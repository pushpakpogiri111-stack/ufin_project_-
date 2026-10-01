import { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { 
  Zap, Plus, Filter, Sun, Moon, X, ShoppingCart, 
  Search, AlertTriangle, TrendingUp, TrendingDown,
  Navigation, CheckCircle2, Info, Mic, Languages, Sparkles, BrainCircuit,
  BarChart3
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import './i18n';

// New Components
import Checkout from './Checkout';
import Stats from './Stats';
import AddFood from './AddFood';
import FAQ from './FAQ';
import PriceGraph from './PriceGraph';
import ProductModal from './ProductModal';
import Login from './Login';
import Register from './Register';
import FarmerDashboard from './FarmerDashboard';
import { produceApi } from './api';
import { useVoiceRecognition } from './useVoice';

// Fix for Leaflet markers
import L from 'leaflet';
try {
  if (L.Icon && L.Icon.Default) {
    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
      iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    });
  }
} catch (e) {
  console.error('Leaflet marker fix error:', e);
}

function App() {
  const { t, i18n } = useTranslation();
  const [produceList, setProduceList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [filterType, setFilterType] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState('home'); 
  const [checkoutProduceId, setCheckoutProduceId] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showFarmerDashboard, setShowFarmerDashboard] = useState(false);
  const [aiAnalyzing, setAiAnalyzing] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showProductModal, setShowProductModal] = useState(false);
  const [authMode, setAuthMode] = useState('register'); // 'login' or 'register'

  // Voice Recognition for Search
  const { isListening, startListening } = useVoiceRecognition((transcript) => {
    setSearchQuery(transcript);
    setAiAnalyzing(true);
    setTimeout(() => setAiAnalyzing(false), 1500);
  });

  // Language Switch
  const changeLanguage = (lng) => i18n.changeLanguage(lng);

  // Fetch Produce
  const fetchProduce = async () => {
    setLoading(true);
    try {
      const res = await produceApi.getAll();
      if (res.data.success) {
        setProduceList(res.data.produce);
      }
    } catch (error) {
      console.error('Fetch error', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProduce();
  }, []);

  // Theme management
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.remove('light-mode');
    } else {
      document.documentElement.classList.add('light-mode');
    }
  }, [isDarkMode]);

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  // Filter and Search logic
  const filteredProduce = useMemo(() => {
    return (produceList || []).filter(item => {
      if (!item) return false;
      const type = item.type || '';
      const name = item.name || '';
      const matchesFilter = filterType === 'all' || type.toLowerCase() === filterType.toLowerCase();
      const matchesSearch = name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            type.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesFilter && matchesSearch;
    });
  }, [produceList, filterType, searchQuery]);

  const handleBuyNow = (id) => {
    setCheckoutProduceId(id);
    setCurrentPage('checkout');
    window.scrollTo(0, 0);
  };

  const handleProductClick = (product) => {
    setSelectedProduct(product);
    setShowProductModal(true);
  };

  const handleModalBuyNow = (productId) => {
    setShowProductModal(false);
    setCheckoutProduceId(productId);
    setCurrentPage('checkout');
    window.scrollTo(0, 0);
  };

  // Authentication handlers
  const handleLogin = (userData) => {
    setUser(userData);
    setIsAuthenticated(true);
    setCurrentPage('home');
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    setIsAuthenticated(false);
    setCurrentPage('home');
    localStorage.removeItem('user');
  };

  // Check for existing login on app load
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
      setIsAuthenticated(true);
    }
  }, []);

  // AI Recommendation Logic
  const getAiRecommendation = (item) => {
    const trend = item.predictedPrice - item.basePrice;
    if (trend > 1) return { text: t("wait"), reason: `Because price is expected to rise by ₹${trend.toFixed(2)}`, icon: <TrendingUp className="w-4 h-4 text-green-500" /> };
    if (trend < -1) return { text: t("buy_now"), reason: `Because price is expected to drop by ₹${Math.abs(trend).toFixed(2)}`, icon: <TrendingDown className="w-4 h-4 text-red-500" /> };
    return { text: "Neutral", reason: "Market is stable", icon: <CheckCircle2 className="w-4 h-4 text-primary" /> };
  };

  if (currentPage === 'checkout') {
    return <Checkout produceId={checkoutProduceId} onBack={() => setCurrentPage('home')} />;
  }

  if (currentPage === 'checkout') {
    return <Checkout produceId={checkoutProduceId} onBack={() => setCurrentPage('home')} />;
  }

  return (
    <div className="min-h-screen transition-colors duration-500">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 backdrop-blur-xl bg-background/80 border-b border-border">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <motion.div 
            initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => setCurrentPage('home')}
          >
            <div className="w-10 h-10 bg-gradient-to-br from-primary via-secondary to-accent rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-[0_0_20px_rgba(99,102,241,0.5)]"><ShoppingCart className="w-6 h-6" /></div>
            <span className="text-2xl font-bold font-display tracking-tight text-text-primary">U-FIN</span>
          </motion.div>

          <div className="hidden lg:flex items-center gap-8 text-sm font-medium text-text-secondary">
            <a href="#marketplace" className="hover:text-primary transition-colors">{t("marketplace")}</a>
            <a href="#impact" className="hover:text-primary transition-colors">{t("impact")}</a>
            <a href="#map" className="hover:text-primary transition-colors">{t("map")}</a>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center p-1 bg-surface border border-border rounded-xl">
              <button onClick={() => changeLanguage('en')} className={`px-2 py-1 text-xs rounded-lg transition-all ${i18n.language === 'en' ? 'bg-primary text-white' : 'text-text-secondary'}`}>EN</button>
              <button onClick={() => changeLanguage('hi')} className={`px-2 py-1 text-xs rounded-lg transition-all ${i18n.language === 'hi' ? 'bg-primary text-white' : 'text-text-secondary'}`}>HI</button>
              <button onClick={() => changeLanguage('te')} className={`px-2 py-1 text-xs rounded-lg transition-all ${i18n.language === 'te' ? 'bg-primary text-white' : 'text-text-secondary'}`}>TE</button>
            </div>
            
            <button onClick={toggleTheme} className="p-2.5 rounded-xl hover:bg-surface transition-colors border border-border">
              {isDarkMode ? <Sun className="w-5 h-5 text-yellow-500" /> : <Moon className="w-5 h-5 text-primary" />}
            </button>
            
            {isAuthenticated ? (
              <div className="flex items-center gap-2">
                <span className="text-sm text-text-secondary">Welcome, {user?.name || user?.email}</span>
                <button 
                  onClick={handleLogout}
                  className="px-4 py-2 bg-red-500 text-white rounded-xl font-medium hover:bg-red-600 transition-colors text-sm"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setCurrentPage('auth')}
                  className="px-4 py-2 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 transition-colors text-sm"
                >
                  Register
                </button>
                <button 
                  onClick={() => { setAuthMode('login'); setCurrentPage('auth'); }}
                  className="px-4 py-2 border border-primary text-primary rounded-xl font-medium hover:bg-primary hover:text-white transition-colors text-sm"
                >
                  Login
                </button>
              </div>
            )}
            
            <button 
              onClick={() => {
                if (isAuthenticated) {
                  setShowFarmerDashboard(true);
                } else {
                  setCurrentPage('auth');
                }
              }}
              className="px-5 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-bold flex items-center gap-2 hover:shadow-[0_0_15px_rgba(147,51,234,0.4)] transition-all active:scale-95 text-sm"
            >
              <BarChart3 className="w-4 h-4" /> Dashboard
            </button>
            
            <button 
              onClick={() => {
                if (isAuthenticated) {
                  setShowAddForm(true);
                } else {
                  setCurrentPage('auth');
                }
              }}
              className="px-5 py-2.5 bg-gradient-to-r from-primary to-secondary text-white rounded-xl font-bold flex items-center gap-2 hover:shadow-[0_0_15px_rgba(99,102,241,0.4)] transition-all active:scale-95 text-sm"
            >
              <Plus className="w-4 h-4" /> {t("list_produce")}
            </button>
          </div>
        </div>
      </nav>

      {/* Authentication Page */}
      {currentPage === 'auth' && (
        <div className="pt-20 min-h-screen flex items-center justify-center px-6">
          <div className="w-full max-w-md">
            {authMode === 'login' ? (
              <Login onLogin={handleLogin} onSwitchToRegister={() => setAuthMode('register')} />
            ) : (
              <Register onRegister={handleLogin} onSwitchToLogin={() => setAuthMode('login')} />
            )}
          </div>
        </div>
      )}

      {/* Main Content */}
      {currentPage === 'home' && (
        <>
          {/* Hero Section */}
      <header className="pt-40 pb-20 px-6 relative overflow-hidden">
        <div className="max-w-7xl mx-auto flex flex-col items-center text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-bold mb-6"
          >
            <Sparkles className="w-4 h-4 fill-primary" /> {t("ai_powered_waste_reduction", { defaultValue: "AI-Powered Market Intelligence" })}
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="text-6xl md:text-8xl font-bold font-display text-text-primary mb-6 tracking-tight"
          >
            {t("hero_title", { defaultValue: "Smarter Decisions." })} <br />
            <span className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent animate-gradient-x">{t("hero_title_accent", { defaultValue: "Bigger Impact." })}</span>
          </motion.h1>
          
          <motion.div id="impact" className="w-full mt-12">
            <Stats />
          </motion.div>
        </div>

        {/* Abstract Background Orbs */}
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary/20 rounded-full blur-[120px] -z-10 animate-pulse"></div>
        <div className="absolute top-1/2 right-1/4 w-[400px] h-[400px] bg-secondary/20 rounded-full blur-[120px] -z-10 animate-pulse delay-700"></div>
      </header>

      {/* Marketplace Section */}
      <main id="marketplace" className="max-w-7xl mx-auto px-6 py-20">
        <div className="flex flex-col lg:flex-row gap-8 mb-12">
          <div className="flex-1">
            <h2 className="text-4xl font-bold font-display text-text-primary mb-2">{t("marketplace")}</h2>
            <p className="text-text-secondary">AI-driven insights for optimal food redistribution.</p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-secondary w-4 h-4" />
              <input
                type="text"
                placeholder={t("search_placeholder")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-3 bg-surface border border-border rounded-xl text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-primary w-full"
              />
            </div>
            
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-4 py-3 bg-surface border border-border rounded-xl text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="all">Categories</option>
              <option value="vegetable">Vegetables</option>
              <option value="fruit">Fruits</option>
              <option value="grain">Grains</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="h-64 flex flex-col items-center justify-center gap-4">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            <p className="text-text-secondary font-medium animate-pulse">Predicting market trends...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <AnimatePresence mode="popLayout">
              {filteredProduce.map((item, idx) => {
                const rec = getAiRecommendation(item);
                return (
                  <motion.div
                    key={item._id || idx}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.3 }}
                    className="glass-card p-6 cursor-pointer group hover:shadow-[0_0_30px_rgba(99,102,241,0.1)] transition-all duration-300"
                    onClick={() => handleProductClick(item)}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        {item.imageUrl ? (
                          <img src={item.imageUrl} alt={item.name} className="w-12 h-12 object-cover rounded-xl" />
                        ) : (
                          <div className="w-12 h-12 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center text-white font-bold text-lg">
                            {item.name?.charAt(0)?.toUpperCase() || 'P'}
                          </div>
                        )}
                        <div>
                          <h3 className="font-bold text-text-primary text-lg">{item.name || 'Produce'}</h3>
                          <p className="text-text-secondary text-sm">{item.quantity || 0}kg • ₹{(item.basePrice || 0).toFixed(2)}/kg</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        {rec.icon}
                        <span className="text-xs font-medium text-text-secondary">{rec.text}</span>
                      </div>
                    </div>

                    <div className="space-y-3 mb-6">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-text-secondary">AI Analysis</span>
                        <span className="font-bold text-primary">{item.predictedPrice ? `₹${item.predictedPrice.toFixed(2)}/kg` : t("analyzing")}</span>
                      </div>
                      
                      <div className="w-full bg-surface rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-primary to-secondary h-2 rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(100, (item.predictedPrice || 0) / (item.basePrice || 1) * 50)}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="border-t border-border/50 pt-4">
                      <div className="grid grid-cols-3 gap-2 mb-4">
                        <div className="text-center">
                          <p className="text-[10px] text-text-secondary uppercase">Demand</p>
                          <p className="text-sm font-bold text-white">{item.demandLevel || 'Medium'}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-[10px] text-text-secondary uppercase">Expiry</p>
                          <p className={`text-sm font-bold ${(item.expiryHours || 0) < 12 ? 'text-red-500' : 'text-green-500'}`}>{(item.expiryHours || 0) < 12 ? 'Soon' : 'Safe'}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-[10px] text-text-secondary uppercase">Trend</p>
                          <p className="text-sm font-bold text-white">{(item.predictedPrice || 0) > (item.basePrice || 0) ? '↑' : '↓'}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-2 pt-3 border-t border-border/50">
                        <div className="text-center">
                          <p className="text-[8px] text-text-secondary uppercase">{t("demand")}</p>
                          <p className="text-[10px] font-bold text-white">{item.demandLevel || 'Medium'}</p>
                        </div>
                        <div className="text-center">
                           <p className="text-[8px] text-text-secondary uppercase">{t("expiry_risk")}</p>
                           <p className={`text-[10px] font-bold ${(item.expiryHours || 0) < 12 ? 'text-red-500' : 'text-green-500'}`}>{(item.expiryHours || 0) < 12 ? 'High' : 'Low'}</p>
                        </div>
                        <div className="text-center">
                           <p className="text-[8px] text-text-secondary uppercase">{t("price_trend")}</p>
                           <p className="text-[10px] font-bold text-white">{(item.predictedPrice || 0) > (item.basePrice || 0) ? 'Rising' : 'Falling'}</p>
                        </div>
                      </div>

                      {/* Price History Mini Graph */}
                      <div className="h-24 mb-6">
                        <PriceGraph history={item.priceHistory || []} predictedPrice={item.predictedPrice || 0} />
                      </div>

                      <button 
                        onClick={() => handleProductClick(item)}
                        className="w-full py-3.5 bg-primary hover:bg-white hover:text-primary text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2 group/btn shadow-[0_4px_15px_rgba(99,102,241,0.2)]"
                      >
                        <ShoppingCart className="w-4 h-4 group-hover/btn:translate-x-1/2 transition-transform" /> {t("view_details")}
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </main>

      {/* Network Map */}
      <section id="map" className="max-w-7xl mx-auto px-6 py-20">
        <div className="mb-12">
          <h2 className="text-4xl font-bold font-display text-text-primary mb-2">{t("map")}</h2>
          <p className="text-text-secondary">AI Optimization for logistic redistribution.</p>
        </div>
        <div className="h-[600px] rounded-3xl overflow-hidden border border-border shadow-2xl relative bg-surface">
          <MapContainer
            center={[15.9129, 79.7400]} // Center of South India
            zoom={6}
            style={{ height: '100%', width: '100%' }}
            className="rounded-3xl"
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            {filteredProduce.map((product, index) => {
              if (!product.location || !product.location.coordinates) return null;

              const [lng, lat] = product.location.coordinates;
              return (
                <Marker key={product._id || index} position={[lat, lng]}>
                  <Popup>
                    <div className="p-2 min-w-[200px]">
                      <h3 className="font-bold text-lg mb-2">{product.name}</h3>
                      <div className="space-y-1 text-sm">
                        <p><strong>Seller:</strong> {product.sellerName}</p>
                        <p><strong>Price:</strong> ₹{product.basePrice}/kg</p>
                        <p><strong>Quantity:</strong> {product.quantity}kg</p>
                        <p><strong>Type:</strong> {product.type}</p>
                        <p><strong>Quality:</strong> {product.quality}</p>
                      </div>
                      <button
                        onClick={() => handleBuyNow(product)}
                        className="mt-3 w-full py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors"
                      >
                        Buy Now
                      </button>
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>
        </div>
      </section>

      {/* FAQ */}
      <FAQ />

      {/* Footer */}
      <footer className="py-20 border-t border-border bg-surface/10">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <div className="flex items-center justify-center gap-2 mb-8 cursor-pointer hover:opacity-80 transition-opacity" onClick={() => setCurrentPage('home')}>
             <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white"><BrainCircuit className="w-5 h-5" /></div>
             <span className="text-xl font-bold text-text-primary">U-FIN AI</span>
          </div>
          <p className="text-xs text-text-secondary">© 2026 U-FIN AI Intelligence Network. Multilingual Voice Access Enabled.</p>
        </div>
      </footer>

      {/* Add Produce Modal */}
      <AnimatePresence>
        {showAddForm && isAuthenticated && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowAddForm(false)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 10 }} className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <button onClick={() => setShowAddForm(false)} className="absolute top-6 right-6 p-2 hover:bg-surface rounded-full transition-colors z-10"><X className="w-6 h-6 text-text-secondary" /></button>
              <AddFood onSuccess={() => { setShowAddForm(false); fetchProduce(); }} />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Farmer Dashboard Modal */}
      <AnimatePresence>
        {showFarmerDashboard && isAuthenticated && (
          <FarmerDashboard onClose={() => setShowFarmerDashboard(false)} />
        )}
      </AnimatePresence>
      </>
      )}

      {/* Product Modal */}
      <ProductModal
        product={selectedProduct}
        isOpen={showProductModal}
        onClose={() => setShowProductModal(false)}
        onBuyNow={handleModalBuyNow}
      />
    </div>
  );
}

export default App;
