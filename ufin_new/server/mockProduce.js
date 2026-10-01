// Mock in-memory produce data for development
const mockProduce = [];
/*
  {
    _id: 'prod_001',
    sellerName: 'Rajesh Kumar',
    farmer: '1000',
    type: 'Fruits',
    name: 'Fresh Tomatoes',
    quality: 'SELL',
    basePrice: 45,
    pricingType: 'per_kg',
    quantity: 150,
    status: 'available',
    location: { type: 'Point', coordinates: [77.5946, 12.9716] }, // Bangalore
    images: ['tomato.jpg'],
    imageUrl: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?q=80&w=1000&auto=format&fit=crop',
    freshness: 8,
    damage: 1,
    createdAt: new Date()
  },
  {
    _id: 'prod_002',
    sellerName: 'Priya Sharma',
    farmer: '1001',
    type: 'Fruits',
    name: 'Organic Bananas',
    quality: 'DONATE',
    basePrice: 30,
    pricingType: 'per_dozen',
    quantity: 200,
    status: 'available',
    location: { type: 'Point', coordinates: [78.4867, 17.3850] }, // Hyderabad
    images: ['banana.jpg'],
    imageUrl: 'https://images.unsplash.com/photo-1571771019784-3ff35f4f4277?q=80&w=1000&auto=format&fit=crop',
    freshness: 6,
    damage: 3,
    createdAt: new Date()
  },
  {
    _id: 'prod_003',
    sellerName: 'Amit Singh',
    farmer: '1002',
    type: 'Fruits',
    name: 'Red Apples',
    quality: 'PROCESS',
    basePrice: 60,
    pricingType: 'per_kg',
    quantity: 100,
    status: 'available',
    location: { type: 'Point', coordinates: [72.8777, 19.0760] }, // Mumbai
    images: ['apple.jpg'],
    imageUrl: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?q=80&w=1000&auto=format&fit=crop',
    freshness: 7,
    damage: 2,
    createdAt: new Date()
  },
  {
    _id: 'prod_004',
    sellerName: 'Sunita Patel',
    farmer: '1003',
    type: 'Vegetables',
    name: 'Fresh Carrots',
    quality: 'SELL',
    basePrice: 25,
    pricingType: 'per_kg',
    quantity: 300,
    status: 'available',
    location: { type: 'Point', coordinates: [88.3639, 22.5726] }, // Kolkata
    images: ['carrot.jpg'],
    imageUrl: 'https://images.unsplash.com/photo-1582515073490-39981397c445?q=80&w=1000&auto=format&fit=crop',
    freshness: 9,
    damage: 0,
    createdAt: new Date()
  },
  {
    _id: 'prod_005',
    sellerName: 'Vikram Rao',
    farmer: '1004',
    type: 'Vegetables',
    name: 'Green Spinach',
    quality: 'SELL',
    basePrice: 15,
    pricingType: 'per_bundle',
    quantity: 80,
    status: 'available',
    location: { type: 'Point', coordinates: [80.2707, 13.0827] }, // Chennai
    images: ['spinach.jpg'],
    imageUrl: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?q=80&w=1000&auto=format&fit=crop',
    freshness: 8,
    damage: 1,
    createdAt: new Date()
  },
  {
    _id: 'prod_006',
    sellerName: 'Meera Joshi',
    farmer: '1005',
    type: 'Fruits',
    name: 'Sweet Mangoes',
    quality: 'SELL',
    basePrice: 80,
    pricingType: 'per_kg',
    quantity: 120,
    status: 'available',
    location: { type: 'Point', coordinates: [75.8577, 22.7196] }, // Indore
    images: ['mango.jpg'],
    imageUrl: 'https://images.unsplash.com/photo-1553279768-865429fa0078?q=80&w=1000&auto=format&fit=crop',
    freshness: 9,
    damage: 0,
    createdAt: new Date()
  },
  {
    _id: 'prod_007',
    sellerName: 'Ravi Kumar',
    farmer: '1006',
    type: 'Vegetables',
    name: 'Red Onions',
    quality: 'SELL',
    basePrice: 20,
    pricingType: 'per_kg',
    quantity: 250,
    status: 'available',
    location: { type: 'Point', coordinates: [73.8567, 18.5204] }, // Pune
    images: ['onion.jpg'],
    imageUrl: 'https://images.unsplash.com/photo-1508747703725-719777637510?q=80&w=1000&auto=format&fit=crop',
    freshness: 7,
    damage: 2,
    createdAt: new Date()
  }
];
*/

const removedProductNames = new Set(['organic tomatoes', 'fresh tomatoes', 'retry test', 'permanent test']);

let produceIdCounter = 1008;

const getAllProduce = () => {
  return mockProduce.filter(p => !removedProductNames.has(String(p.name || '').trim().toLowerCase())).map(p => ({
    ...p,
    produce: p
  }));
};

const addProduce = (produceData, farmerId) => {
  const newProduce = {
    _id: `prod_${produceIdCounter++}`,
    ...produceData,
    farmer: farmerId,
    status: 'available',
    createdAt: new Date()
  };
  mockProduce.push(newProduce);
  return newProduce;
};

const updateProduceQuantity = (produceId, quantity) => {
  const produce = mockProduce.find(p => p._id === produceId);
  if (produce) {
    produce.quantity -= quantity;
    if (produce.quantity <= 0) {
      produce.status = 'sold';
      produce.quantity = 0;
    }
  }
  return produce;
};

const updateProduceStatus = (produceId, status) => {
  const produce = mockProduce.find(p => p._id === produceId);
  if (produce) {
    produce.status = status;
  }
  return produce;
};

module.exports = {
  mockProduce,
  getAllProduce,
  addProduce,
  updateProduceQuantity,
  updateProduceStatus
};
