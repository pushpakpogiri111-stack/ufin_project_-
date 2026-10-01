import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp, TrendingDown, DollarSign, Package, BarChart3,
  Calendar, MapPin, Star, AlertCircle, CheckCircle, X
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { dashboardApi, produceApi } from '../api';

const FarmerDashboard = ({ onClose }) => {
  const { t } = useTranslation();
  const [stats, setStats] = useState(null);
  const [farmerProduce, setFarmerProduce] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchFarmerData();
  }, []);

  const fetchFarmerData = async () => {
    try {
      setLoading(true);
      // Get farmer's produce (assuming farmer ID is stored in localStorage or context)
      const farmerId = localStorage.getItem('farmerId') || 'demo_farmer_1';
      const produceResponse = await produceApi.getAll();
      const farmerItems = produceResponse.data.produce.filter(item =>
        item.farmer === farmerId || item.sellerEmail === localStorage.getItem('userEmail')
      );

      setFarmerProduce(farmerItems);

      // Calculate stats
      const totalItems = farmerItems.length;
      const totalValue = farmerItems.reduce((sum, item) => sum + (item.basePrice * item.quantity), 0);
      const soldItems = farmerItems.filter(item => item.status === 'sold').length;
      const availableItems = farmerItems.filter(item => item.status === 'available').length;
      const totalRevenue = farmerItems
        .filter(item => item.status === 'sold')
        .reduce((sum, item) => sum + (item.basePrice * item.quantity), 0);

      // Mock profit calculation (in real app, this would come from orders/transactions)
      const totalProfit = totalRevenue * 0.15; // Assuming 15% profit margin

      setStats({
        totalItems,
        totalValue,
        soldItems,
        availableItems,
        totalRevenue,
        totalProfit,
        profitMargin: 15
      });

    } catch (error) {
      console.error('Error fetching farmer data:', error);
    } finally {
      setLoading(false);
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

  const ProductCard = ({ product }) => (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="glass-card p-4"
    >
      <div className="flex items-start gap-4">
        <img
          src={product.imageUrl}
          alt={product.name}
          className="w-16 h-16 rounded-lg object-cover"
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
            { id: 'analytics', label: 'Analytics', icon: TrendingUp }
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
          {activeTab === 'overview' && stats && (
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
                  value={`₹${stats.totalValue.toLocaleString()}`}
                  icon={DollarSign}
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
                  value={`₹${stats.totalProfit.toLocaleString()}`}
                  icon={TrendingUp}
                  color="purple"
                />
              </div>

              {/* Recent Products */}
              <div>
                <h3 className="text-lg font-semibold text-text-primary mb-4">Recent Products</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {farmerProduce.slice(0, 4).map((product) => (
                    <ProductCard key={product._id || product.name} product={product} />
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
                  <ProductCard key={product._id || product.name} product={product} />
                ))}
              </div>
            </div>
          )}

          {activeTab === 'analytics' && stats && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Profit Chart Placeholder */}
                <div className="glass-card p-6">
                  <h3 className="text-lg font-semibold text-text-primary mb-4">Profit Trends</h3>
                  <div className="h-64 flex items-center justify-center text-text-secondary">
                    <div className="text-center">
                      <BarChart3 className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>Profit chart visualization</p>
                      <p className="text-sm">Coming soon with real data</p>
                    </div>
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
                      <span className="font-semibold text-primary">₹{stats.totalRevenue.toLocaleString()}</span>
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
        </div>
      </motion.div>
    </motion.div>
  );
};

export default FarmerDashboard;