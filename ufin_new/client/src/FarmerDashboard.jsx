import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp, TrendingDown, IndianRupee, Package, BarChart3,
  Calendar, MapPin, Star, AlertCircle, CheckCircle, X, QrCode, Trash2
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { LineChart, Line, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import { dashboardApi, produceApi } from './api';

const FarmerDashboard = ({ onClose }) => {
  const { t } = useTranslation();
  const [stats, setStats] = useState({});
  const [farmerProduce, setFarmerProduce] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [qrImage, setQrImage] = useState(null);

  useEffect(() => {
    fetchFarmerData();
  }, []);

  const fetchFarmerData = async () => {
    try {
      setLoading(true);
      const userStr = localStorage.getItem('user');
      let user = {};
      try {
        if (userStr && userStr !== 'undefined') {
          user = JSON.parse(userStr);
        }
      } catch(e) {
        console.error('Error parsing user:', e);
      }
      const farmerId = user._id || user.id || user.email || localStorage.getItem('farmerId') || 'demo_farmer_1';

      // Use /api/produce/mine which returns only this farmer's produce (server-side filter)
      let farmerItems = [];
      try {
        const token = localStorage.getItem('token');
        const mineRes = await fetch('https://ufin-final-1.onrender.com/api/produce/mine', {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        const mineData = await mineRes.json();
        if (mineData.success && Array.isArray(mineData.produce)) {
          farmerItems = mineData.produce;
        }
      } catch (mineErr) {
        console.error('Error fetching mine produce:', mineErr);
        // Fallback: fetch all and filter (convert ObjectId to string for comparison)
        try {
          const allRes = await produceApi.getAll('all');
          const allProduce = allRes.data.produce || [];
          farmerItems = allProduce.filter(item =>
            String(item.farmer) === String(farmerId) ||
            item.sellerEmail === user.email
          );
        } catch (fallbackErr) {
          console.error('Fallback fetch failed:', fallbackErr);
        }
      }

      setFarmerProduce(farmerItems);

      // Fetch QR Code
      try {
        const qrRes = await fetch(`https://ufin-final-1.onrender.com/api/complaint/qr/${farmerId}`);
        const qrData = await qrRes.json();
        if (qrData.success) {
          setQrImage(qrData.qrCode);
        }
      } catch (err) {
        console.error('Error fetching QR:', err);
      }

      // Fetch farmer-specific stats from backend (scoped to this farmer)
      try {
        const token = localStorage.getItem('token');
        const dashRes = await fetch('https://ufin-final-1.onrender.com/api/dashboard/stats', {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        const dashData = await dashRes.json();
        if (dashData.success && dashData.stats) {
          // Ensure daily data is sorted by date ascending
          const sortedDaily = (dashData.stats.daily || []).slice().sort((a, b) => new Date(a.date) - new Date(b.date));
          setStats({
            totalItems: dashData.stats.totalItems ?? farmerItems.length,
            totalValue: dashData.stats.totalValue ?? farmerItems.reduce((s, i) => s + (i.basePrice * i.quantity), 0),
            soldItems: dashData.stats.soldItems ?? farmerItems.filter(i => i.status === 'sold').length,
            availableItems: dashData.stats.availableItems ?? farmerItems.filter(i => i.status === 'available').length,
            onHoldItems: dashData.stats.onHoldItems ?? 0,
            totalQuantity: dashData.stats.totalQuantity ?? farmerItems.reduce((s, i) => s + (i.quantity || 0), 0),
            totalRevenue: dashData.stats.totalRevenue ?? 0,
            totalProfit: dashData.stats.profit ?? 0,
            profitMargin: dashData.stats.profitMargin ?? 15,
            mealsSaved: dashData.stats.mealsSaved ?? 0,
            foodRescued: dashData.stats.foodRescued ?? 0,
            deliveries: dashData.stats.deliveries ?? 0,
            daily: sortedDaily
          });
        } else {
          // Fallback: compute locally from farmerItems
          setStats({
            totalItems: farmerItems.length,
            totalValue: farmerItems.reduce((s, i) => s + (i.basePrice * i.quantity), 0),
            soldItems: farmerItems.filter(i => i.status === 'sold').length,
            availableItems: farmerItems.filter(i => i.status === 'available').length,
            onHoldItems: farmerItems.filter(i => i.status === 'on_hold').length,
            totalQuantity: farmerItems.reduce((s, i) => s + (i.quantity || 0), 0),
            totalRevenue: farmerItems.filter(i => i.status === 'sold').reduce((s, i) => s + (i.basePrice * i.quantity), 0),
            totalProfit: 0,
            profitMargin: 15,
            mealsSaved: 0,
            foodRescued: 0,
            deliveries: 0,
            daily: []
          });
        }
      } catch (dashErr) {
        console.error('Error fetching dashboard stats:', dashErr);
        // Fallback: compute locally
        setStats({
          totalItems: farmerItems.length,
          totalValue: farmerItems.reduce((s, i) => s + (i.basePrice * i.quantity), 0),
          soldItems: farmerItems.filter(i => i.status === 'sold').length,
          availableItems: farmerItems.filter(i => i.status === 'available').length,
          onHoldItems: farmerItems.filter(i => i.status === 'on_hold').length,
          totalQuantity: farmerItems.reduce((s, i) => s + (i.quantity || 0), 0),
          totalRevenue: farmerItems.filter(i => i.status === 'sold').reduce((s, i) => s + (i.basePrice * i.quantity), 0),
          totalProfit: 0,
          profitMargin: 15,
          mealsSaved: 0,
          foodRescued: 0,
          deliveries: 0,
          daily: []
        });
      }

    } catch (error) {
      console.error('Error fetching farmer data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (productId) => {
    if (!window.confirm('Remove this item from your listings? This cannot be undone.')) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`https://ufin-final-1.onrender.com/api/produce/${productId}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      const data = await res.json();
      if (data.success) {
        // Remove instantly from local state
        setFarmerProduce(prev => prev.filter(p => p._id !== productId));
      } else {
        alert(data.message || 'Failed to remove item.');
      }
    } catch (err) {
      console.error('Delete error:', err);
      alert('Error removing item. Please try again.');
    }
  };

  const StatCard = ({ title, value, icon: Icon, trend, color = 'primary' }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-6"
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-xl bg-${color}/10`}>
          <Icon className={`w-6 h-6 text-${color}`} />
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-sm ${trend > 0 ? 'text-green-500' : 'text-red-500'}`}>
            {trend > 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <div className="space-y-1">
        <p className="text-sm text-text-secondary">{title}</p>
        <p className="text-2xl font-bold text-text-primary">{value}</p>
      </div>
    </motion.div>
  );

  const ProductCard = ({ product, onDelete }) => (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="glass-card p-4 relative group"
    >
      <div className="flex items-start gap-4">
        <img
          src={product.imageUrl || 'https://images.unsplash.com/photo-1518843875459-f738682238a6?q=80&w=400&auto=format&fit=crop'}
          alt={product.name}
          className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
        />
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-text-primary truncate">{product.name}</h3>
          <p className="text-sm text-text-secondary">{product.type} • {product.quantity}kg</p>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-lg font-bold text-primary">₹{product.basePrice}/kg</span>
            <span className={`px-2 py-1 rounded-full text-xs ${
              product.status === 'sold' ? 'bg-green-500/10 text-green-500' :
              product.status === 'available' ? 'bg-blue-500/10 text-blue-500' :
              'bg-yellow-500/10 text-yellow-500'
            }`}>
              {product.status}
            </span>
          </div>
          {product.location && (
            <div className="flex items-center gap-1 mt-1">
              <MapPin className="w-3 h-3 text-text-secondary" />
              <span className="text-xs text-text-secondary">
                {product.location.coordinates ? `${product.location.coordinates[1].toFixed(2)}, ${product.location.coordinates[0].toFixed(2)}` : 'Location not set'}
              </span>
            </div>
          )}
        </div>
        {/* Delete button */}
        {onDelete && (
          <button
            onClick={() => onDelete(product._id)}
            title="Remove listing"
            className="opacity-0 group-hover:opacity-100 transition-opacity p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-500 flex-shrink-0"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>
    </motion.div>
  );

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      >
        <div className="glass-card p-8 text-center">
          <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-text-secondary">Loading your dashboard...</p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/50 backdrop-blur-sm"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="w-full max-w-6xl max-h-[90vh] overflow-hidden glass-card"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div>
            <h2 className="text-2xl font-bold font-display text-text-primary">Farmer Dashboard</h2>
            <p className="text-text-secondary">Track your sales and profits</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-surface rounded-full transition-colors"
          >
            <X className="w-6 h-6 text-text-secondary" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border">
          {[
            { id: 'overview', label: 'Overview', icon: BarChart3 },
            { id: 'products', label: 'My Products', icon: Package },
            { id: 'analytics', label: 'Analytics', icon: TrendingUp },
            { id: 'myqr', label: 'My QR', icon: QrCode }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-4 border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-text-secondary hover:text-text-primary'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {activeTab === 'overview' && stats && stats.totalItems !== undefined && (
            <div className="space-y-6">
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                  title="Total Products"
                  value={stats.totalItems}
                  icon={Package}
                  color="primary"
                />
                <StatCard
                  title="Total Value"
                   value={`₹${(stats.totalValue || 0).toLocaleString()}`}
                  icon={IndianRupee}
                  color="green"
                />
                <StatCard
                  title="Items Sold"
                  value={stats.soldItems}
                  icon={CheckCircle}
                  color="blue"
                />
                <StatCard
                  title="Total Profit"
                   value={`₹${(stats.totalProfit || 0).toLocaleString()}`}
                  icon={TrendingUp}
                  color="purple"
                />
              </div>

              {/* Recent Products */}
              <div>
                <h3 className="text-lg font-semibold text-text-primary mb-4">Recent Products</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {farmerProduce.slice(0, 4).map((product) => (
                    <ProductCard key={product._id || product.name} product={product} onDelete={handleDelete} />
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'products' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-text-primary">All My Products</h3>
                <span className="text-sm text-text-secondary">{farmerProduce.length} products</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {farmerProduce.map((product) => (
                  <ProductCard key={product._id || product.name} product={product} onDelete={handleDelete} />
                ))}
              </div>
            </div>
          )}

          {activeTab === 'analytics' && stats && stats.totalItems !== undefined && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Profit Chart Placeholder */}
                <div className="glass-card p-6">
                  <h3 className="text-lg font-semibold text-text-primary mb-4">Profit Trends</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={[
                        { name: 'Week 1', profit: 4500 },
                        { name: 'Week 2', profit: 3200 },
                        { name: 'Week 3', profit: 6800 },
                        { name: 'Week 4', profit: stats?.totalProfit > 0 ? stats.totalProfit : 8500 }
                      ]}>
                        <XAxis dataKey="name" stroke="#8884d8" />
                        <YAxis stroke="#8884d8" />
                        <RechartsTooltip
                          contentStyle={{ backgroundColor: '#1e1e2d', borderColor: '#323248', borderRadius: '8px' }}
                          itemStyle={{ color: '#fff' }}
                        />
                        <Line type="monotone" dataKey="profit" stroke="#10B981" strokeWidth={3} dot={{ r: 6 }} activeDot={{ r: 8 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Sales Breakdown */}
                <div className="glass-card p-6">
                  <h3 className="text-lg font-semibold text-text-primary mb-4">Sales Breakdown</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-text-secondary">Available Items</span>
                      <span className="font-semibold text-text-primary">{stats.availableItems}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-text-secondary">Sold Items</span>
                      <span className="font-semibold text-green-500">{stats.soldItems}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-text-secondary">Total Revenue</span>
                       <span className="font-semibold text-primary">₹{(stats.totalRevenue || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-text-secondary">Profit Margin</span>
                      <span className="font-semibold text-purple-500">{stats.profitMargin}%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'myqr' && (
            <div className="flex flex-col items-center justify-center space-y-6 py-8">
              <div className="text-center">
                <h3 className="text-2xl font-bold text-text-primary mb-2">Your Unique QR Code</h3>
                <p className="text-text-secondary">Customers can scan this code to report issues or leave feedback directly.</p>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-xl">
                {qrImage ? (
                  <img src={qrImage} alt="Farmer QR Code" className="w-64 h-64" />
                ) : (
                  <div className="w-64 h-64 flex items-center justify-center bg-gray-100 rounded-xl text-gray-500">
                    Loading QR...
                  </div>
                )}
              </div>

              <button
                onClick={() => {
                  if(!qrImage) return;
                  const link = document.createElement('a');
                  link.href = qrImage;
                  link.download = 'my-qr-code.png';
                  link.click();
                }}
                className="px-6 py-3 bg-primary hover:bg-primary/90 text-white rounded-xl font-bold transition-all flex items-center gap-2"
              >
                <QrCode className="w-5 h-5" /> Download QR Code
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default FarmerDashboard;