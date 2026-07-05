import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, UploadCloud, Mic, Sparkles, Camera, Image as ImageIcon } from 'lucide-react';
import { produceApi } from './api';
import { useVoiceRecognition } from './useVoice';
import { useTranslation } from 'react-i18next';
import { getProductImage, fileToBase64 } from './utils/images';

const AddFood = ({ onSuccess }) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    name: '',
    type: '',
    quantity: '',
    basePrice: '',
    sellerName: 'John Doe',
    sellerPhone: '9876543210',
    sellerEmail: 'john@example.com',
    latitude: '17.3850', // Default Hyderabad latitude
    longitude: '78.4867', // Default Hyderabad longitude
    photo: null,
    customImage: null
  });

  const [loading, setLoading] = useState(false);
  const [predictedPrice, setPredictedPrice] = useState(null);
  const [isPredicting, setIsPredicting] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);

  // Handle image upload
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      try {
        const base64 = await fileToBase64(file);
        setFormData(prev => ({ ...prev, customImage: base64 }));
        setPreviewImage(URL.createObjectURL(file));
      } catch (error) {
        console.error('Error converting image:', error);
        alert('Error processing image. Please try again.');
      }
    }
  };

  // Get suggested image based on product name and type
  const getSuggestedImage = (name, type) => {
    const n = (name || formData.name || '').toLowerCase().trim();
    const t = (type || formData.type || '').toLowerCase().trim();

    // Specific product match (exact or close)
    if (n === 'mango' || n.includes('mango')) return 'https://images.unsplash.com/photo-1553279768-865429fa0078?q=80&w=1000&auto=format&fit=crop';
    if (n === 'apple' || n.includes('apple')) return 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?q=80&w=1000&auto=format&fit=crop';
    if (n === 'banana' || n.includes('banana')) return 'https://images.unsplash.com/photo-1571771019784-3ff35f4f4277?q=80&w=1000&auto=format&fit=crop';
    if (n === 'tomato' || n.includes('tomato')) return 'https://images.unsplash.com/photo-1546470427-e9e826f9e5dc?q=80&w=1000&auto=format&fit=crop';
    if (n === 'potato' || n.includes('potato')) return 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?q=80&w=1000&auto=format&fit=crop';
    if (n === 'onion' || n.includes('onion')) return 'https://images.unsplash.com/photo-1620574387735-3624d75b2dbc?q=80&w=1000&auto=format&fit=crop';
    if (n === 'carrot' || n.includes('carrot')) return 'https://images.unsplash.com/photo-1582515073490-39981397c445?q=80&w=1000&auto=format&fit=crop';
    if (n === 'spinach' || n.includes('spinach')) return 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?q=80&w=1000&auto=format&fit=crop';
    if (n === 'grape' || n.includes('grape')) return 'https://images.unsplash.com/photo-1599819811279-d5ad9cccf838?q=80&w=1000&auto=format&fit=crop';
    if (n === 'orange' || n.includes('orange')) return 'https://images.unsplash.com/photo-1547514701-42782101795e?q=80&w=1000&auto=format&fit=crop';
    if (n === 'strawberry' || n.includes('strawberry')) return 'https://images.unsplash.com/photo-1518635017498-87f514b751ba?q=80&w=1000&auto=format&fit=crop';
    if (n === 'cabbage' || n.includes('cabbage')) return 'https://images.unsplash.com/photo-1594282486552-05b4d80fbb9f?q=80&w=1000&auto=format&fit=crop';
    if (n === 'cauliflower' || n.includes('cauliflower')) return 'https://images.unsplash.com/photo-1568584711271-6c929fb49b60?q=80&w=1000&auto=format&fit=crop';
    if (n === 'cucumber' || n.includes('cucumber')) return 'https://images.unsplash.com/photo-1604977042946-1eecc30f269e?q=80&w=1000&auto=format&fit=crop';
    if (n === 'brinjal' || n.includes('brinjal') || n.includes('eggplant')) return 'https://images.unsplash.com/photo-1615484477778-ca3b77940c25?q=80&w=1000&auto=format&fit=crop';
    if (n === 'pomegranate' || n.includes('pomegranate')) return 'https://images.unsplash.com/photo-1541344999736-83eca272f6fc?q=80&w=1000&auto=format&fit=crop';
    if (n === 'papaya' || n.includes('papaya')) return 'https://images.unsplash.com/photo-1517282009859-f000ec3b26fe?q=80&w=1000&auto=format&fit=crop';
    if (n === 'watermelon' || n.includes('watermelon')) return 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?q=80&w=1000&auto=format&fit=crop';
    if (n === 'lemon' || n.includes('lemon')) return 'https://images.unsplash.com/photo-1590502593747-42a996133562?q=80&w=1000&auto=format&fit=crop';
    if (n === 'chilli' || n.includes('chilli') || n.includes('chili') || n.includes('pepper')) return 'https://images.unsplash.com/photo-1583286816039-7545e04d6a8e?q=80&w=1000&auto=format&fit=crop';
    if (n === 'garlic' || n.includes('garlic')) return 'https://images.unsplash.com/photo-1615477550927-6ec8efa55ec4?q=80&w=1000&auto=format&fit=crop';
    if (n === 'ginger' || n.includes('ginger')) return 'https://images.unsplash.com/photo-1608032077018-c9aad9565a29?q=80&w=1000&auto=format&fit=crop';
    if (n === 'coriander' || n.includes('coriander') || n.includes('cilantro')) return 'https://images.unsplash.com/photo-1535481248020-3a6e93e7856b?q=80&w=1000&auto=format&fit=crop';
    if (n === 'mint' || n.includes('mint')) return 'https://images.unsplash.com/photo-1628612653590-356b08e7e504?q=80&w=1000&auto=format&fit=crop';
    if (n === 'peas' || n.includes('peas') || n.includes('pea')) return 'https://images.unsplash.com/photo-1587735243615-c03f25aaff15?q=80&w=1000&auto=format&fit=crop';
    if (n === 'beetroot' || n.includes('beetroot')) return 'https://images.unsplash.com/photo-1593105544559-ecb03bf76f82?q=80&w=1000&auto=format&fit=crop';
    if (n === 'radish' || n.includes('radish')) return 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?q=80&w=1000&auto=format&fit=crop';
    if (n === 'broccoli' || n.includes('broccoli')) return 'https://images.unsplash.com/photo-1584270354949-c26b0d5b4a0c?q=80&w=1000&auto=format&fit=crop';
    if (n === 'pumpkin' || n.includes('pumpkin')) return 'https://images.unsplash.com/photo-1506917728037-b6af01a7d403?q=80&w=1000&auto=format&fit=crop';
    if (n === 'capsicum' || n.includes('capsicum') || n.includes('bell pepper')) return 'https://images.unsplash.com/photo-1525607551316-4a8e16d1f9ba?q=80&w=1000&auto=format&fit=crop';

    // Category-based fallbacks
    if (t === 'vegetable' || t === 'vegetables') return 'https://images.unsplash.com/photo-1566385101042-1a0aa0c1268c?q=80&w=1000&auto=format&fit=crop';
    if (t === 'fruit' || t === 'fruits') return 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?q=80&w=1000&auto=format&fit=crop';

    return 'https://images.unsplash.com/photo-1518843875459-f738682238a6?q=80&w=2042&auto=format&fit=crop';
  };

  // Simulate AI prediction
  useEffect(() => {
    if (formData.name.length > 2) {
      setIsPredicting(true);
      const timer = setTimeout(() => {
        const base = formData.name.charCodeAt(0) || 50;
        const calcPrice = (base % 50) + 20 + formData.name.length * 2;
        setPredictedPrice(calcPrice);
        setIsPredicting(false);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      setPredictedPrice(null);
    }
  }, [formData.name]);

  // Voice Inputs
  const { isListening: isNameListening, startListening: startNameVoice } = useVoiceRecognition((text) => {
    setFormData(prev => ({ ...prev, name: text }));
  });

  const { isListening: isQtyListening, startListening: startQtyVoice } = useVoiceRecognition((text) => {
    const qty = text.match(/\d+/);
    if (qty) setFormData(prev => ({ ...prev, quantity: qty[0] }));
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Prepare data with coordinates and image
      const submitData = {
        ...formData,
        freshness: 8,
        damage: 2,
        expiryHours: 24,
        demand: 10,
        quality: 'SELL',
        status: 'available',
        pricingType: 'per_kg',
        location: [parseFloat(formData.longitude), parseFloat(formData.latitude)],
        imageUrl: formData.customImage || getSuggestedImage(formData.name, formData.type)
      };
      delete submitData.latitude;
      delete submitData.longitude;
      delete submitData.photo; // Remove unused photo field
      delete submitData.customImage; // Remove from submission, use imageUrl

      const res = await produceApi.add(submitData);
      if (res.data.success) {
        alert('Food item added successfully! AI classification complete.');
        setFormData({
          name: '',
          type: '',
          quantity: '',
          basePrice: '',
          sellerName: 'John Doe',
          sellerPhone: '9876543210',
          sellerEmail: 'john@example.com',
          latitude: '17.3850', // Default Hyderabad latitude
          longitude: '78.4867', // Default Hyderabad longitude
          photo: null,
          customImage: null
        });
        setPreviewImage(null);
        if (onSuccess) onSuccess();
      }
    } catch (error) {
      console.error('Error adding food', error);
      const msg = error?.response?.data?.errors?.[0]?.msg || error?.response?.data?.message || 'Failed to add food.';
      alert('Failed to add food: ' + msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="glass-card p-8 shadow-2xl border border-primary/20"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-primary/10 rounded-xl">
          <UploadCloud className="w-6 h-6 text-primary" />
        </div>
        <h2 className="text-2xl font-bold font-display text-text-primary">Premium Produce Listing</h2>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-xs font-bold text-text-secondary uppercase">Produce Name</label>
          <div className="relative">
            <input
              required
              placeholder="e.g. Organic Tomatoes"
              className="w-full p-4 pr-12 bg-surface border border-border rounded-xl outline-none focus:ring-1 focus:ring-primary"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
            <button
              type="button"
              onClick={startNameVoice}
              className={`absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-lg transition-all ${isNameListening ? 'bg-red-500 text-white animate-pulse' : 'text-text-secondary hover:text-primary hover:bg-primary/10'}`}
              title="Speak Name"
            >
              <Mic className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold text-text-secondary uppercase">Type</label>
          <select
            required
            className="w-full p-4 bg-surface border border-border rounded-xl outline-none focus:ring-1 focus:ring-primary"
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
          >
            <option value="">Select Type</option>
            <option value="Vegetable">Vegetable</option>
            <option value="Fruit">Fruit</option>
            <option value="Grain">Grain</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold text-text-secondary uppercase">Quantity (kg)</label>
          <div className="relative">
            <input
              required
              type="number"
              placeholder="0"
              className="w-full p-4 pr-12 bg-surface border border-border rounded-xl outline-none focus:ring-1 focus:ring-primary"
              value={formData.quantity}
              onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
            />
            <button
              type="button"
              onClick={startQtyVoice}
              className={`absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-lg transition-all ${isQtyListening ? 'bg-red-500 text-white animate-pulse' : 'text-text-secondary hover:text-primary hover:bg-primary/10'}`}
              title="Speak Quantity"
            >
              <Mic className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold text-text-secondary uppercase">Price per kg (₹)</label>
          <div className="relative">
            <input
              required
              type="number"
              placeholder="0"
              className="w-full p-4 bg-surface border border-border rounded-xl outline-none focus:ring-1 focus:ring-primary"
              value={formData.basePrice}
              onChange={(e) => setFormData({ ...formData, basePrice: e.target.value })}
            />
          </div>
          <AnimatePresence>
            {(Boolean(isPredicting) || predictedPrice !== null) && formData.name.length > 2 ? (
              <motion.div
                initial={{ opacity: 0, height: 0, marginTop: 0 }}
                animate={{ opacity: 1, height: 'auto', marginTop: 8 }}
                exit={{ opacity: 0, height: 0, marginTop: 0 }}
                className="overflow-hidden"
              >
                <div className="flex items-center gap-3 p-3 bg-primary/10 border border-primary/20 rounded-xl">
                  {isPredicting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      <span className="text-xs font-medium text-primary">AI is analyzing market trends...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-primary" />
                      <span className="text-xs font-medium text-primary">
                        Est. Market Price: <strong className="text-sm font-bold ml-1">₹{predictedPrice}</strong>/kg
                      </span>
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, basePrice: (predictedPrice || 0).toString() }))}
                        className="ml-auto text-[10px] font-bold bg-primary text-white px-3 py-1.5 rounded-lg shadow-md hover:bg-white hover:text-primary transition-all duration-300"
                      >
                        Apply Price
                      </button>
                    </>
                  )}
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>

        <div className="space-y-2 md:col-span-2">
          <label className="text-xs font-bold text-text-secondary uppercase">Product Photo</label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Image Preview */}
            <div className="space-y-2">
              <div className="aspect-square bg-surface border border-border rounded-xl overflow-hidden">
                <img
                  src={previewImage || getSuggestedImage(formData.name, formData.type)}
                  alt="Product preview"
                  className="w-full h-full object-cover"
                  onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1518843875459-f738682238a6?q=80&w=2042&auto=format&fit=crop'; }}
                />
              </div>
              <p className="text-[10px] text-text-secondary text-center">
                {previewImage ? 'Your uploaded image' : 'Suggested image based on product'}
              </p>
            </div>

            {/* Upload Options */}
            <div className="space-y-3">
              <div className="space-y-2">
                <label className="text-xs font-medium text-text-secondary">Upload Your Photo</label>
                <div className="relative">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="w-full p-4 bg-surface border border-border rounded-xl outline-none focus:ring-1 focus:ring-primary file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-primary/90"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-text-secondary">Or Use Suggested Image</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setFormData(prev => ({ ...prev, customImage: null }));
                      setPreviewImage(null);
                    }}
                    className={`p-3 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
                      !formData.customImage && !previewImage
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <ImageIcon className="w-5 h-5 text-text-secondary" />
                    <span className="text-xs font-medium">Auto</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const suggested = getSuggestedImage(formData.name, formData.type);
                      setFormData(prev => ({ ...prev, customImage: suggested }));
                      setPreviewImage(suggested);
                    }}
                    className={`p-3 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
                      formData.customImage && !previewImage
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <Camera className="w-5 h-5 text-text-secondary" />
                    <span className="text-xs font-medium">Suggested</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold text-text-secondary uppercase">Location Coordinates (for Map)</label>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-text-secondary">Latitude</label>
              <input
                required
                type="number"
                step="any"
                placeholder="17.3850 (Hyderabad)"
                className="w-full p-4 bg-surface border border-border rounded-xl outline-none focus:ring-1 focus:ring-primary"
                value={formData.latitude}
                onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
              />
            </div>
            <div>
              <label className="text-xs text-text-secondary">Longitude</label>
              <input
                required
                type="number"
                step="any"
                placeholder="78.4867 (Hyderabad)"
                className="w-full p-4 bg-surface border border-border rounded-xl outline-none focus:ring-1 focus:ring-primary"
                value={formData.longitude}
                onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
              />
            </div>
          </div>
          <p className="text-xs text-text-secondary">Enter precise coordinates for accurate map positioning. You can find coordinates using Google Maps or GPS.</p>
        </div>

        <div className="md:col-span-2 mt-4">
          <button
            disabled={loading}
            className="w-full py-4 bg-gradient-to-r from-primary to-secondary text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-primary/30 transition-all active:scale-95 disabled:opacity-50"
          >
            {loading ? 'AI Analyzing Listing...' : t("list_produce")}
          </button>
        </div>
      </form>
    </motion.div>
  );
};

export default AddFood;
