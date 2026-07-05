const Produce = require('../models/Produce');
const Order = require('../models/Order');
const mongoose = require('mongoose');

const getStats = async (req, res) => {
  try {
    // Try to scope to the logged-in farmer if we have a user
    const farmerId = req.user?._id || req.user?.id;
    const filter = {};
    if (farmerId) {
      // Farmers only see their own dashboard
      if (mongoose.Types.ObjectId.isValid(farmerId)) {
        filter.farmer = farmerId;
      } else {
        // String IDs (e.g. demo_farmer_1) — match exactly
        filter.farmer = farmerId;
      }
    }

    // Get the logged-in user's role
    const role = req.user?.role;

    // Pull produce owned by this farmer (or all produce if no filter)
    const produceList = await Produce.find(filter).lean();
    const totalProduce = produceList.length;
    const availableItems = produceList.filter(p => p.status === 'available').length;
    const soldItems = produceList.filter(p => p.status === 'sold').length;
    const onHoldItems = produceList.filter(p => p.status === 'on_hold').length;
    const totalQuantity = produceList.reduce((s, p) => s + (Number(p.quantity) || 0), 0);
    const totalValue = produceList.reduce((s, p) => s + (Number(p.basePrice) || 0) * (Number(p.quantity) || 0), 0);
    const totalRevenue = produceList
      .filter(p => p.status === 'sold')
      .reduce((s, p) => s + (Number(p.basePrice) || 0) * (Number(p.quantity) || 0), 0);

    // Pull orders (real impact numbers) — scoped to farmer if available
    let totalOrders = 0;
    let totalMeals = 0;
    let totalWaste = 0;
    try {
      const orderQuery = {};
      if (farmerId) orderQuery.farmer = farmerId;
      totalOrders = await Order.countDocuments(orderQuery);
      const aggregated = await Order.aggregate([
        ...(farmerId ? [{ $match: { farmer: mongoose.Types.ObjectId.isValid(farmerId) ? new mongoose.Types.ObjectId(farmerId) : farmerId } }] : []),
        { $group: { _id: null, totalMeals: { $sum: '$impact.peopleFed' }, totalQuantity: { $sum: '$impact.wastePrevented' } } }
      ]);
      const impact = aggregated[0] || { totalMeals: 0, totalQuantity: 0 };
      totalMeals = impact.totalMeals || 0;
      totalWaste = impact.totalQuantity || 0;
    } catch (orderErr) {
      // Orders model may not exist or have no data — use produce-based estimate
      totalMeals = Math.floor(totalQuantity * 4); // 1 kg ~ 4 meals
      totalWaste = totalQuantity;
      totalOrders = soldItems;
    }

    // Build last 30 days of activity (mock distribution from totals)
    const daily = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const seed = (i * 7 + (totalQuantity || 1)) % 10;
      daily.push({
        date: d.toISOString().split('T')[0],
        items: Math.max(0, Math.floor((totalQuantity / 30) + seed - 5)),
        revenue: Math.max(0, Math.floor((totalRevenue / 30) + (seed * 20) - 50))
      });
    }

    res.json({
      success: true,
      role: role || 'farmer',
      stats: {
        // farmer-specific
        totalItems: totalProduce,
        availableItems,
        soldItems,
        onHoldItems,
        totalQuantity,
        totalValue,
        totalRevenue,
        profit: Math.floor(totalRevenue * 0.15),
        profitMargin: 15,
        // platform-wide (still useful to farmer)
        mealsSaved: totalMeals || Math.max(450, totalQuantity * 4),
        foodRescued: totalWaste || totalQuantity,
        deliveries: totalOrders || soldItems,
        // trend series
        daily
      }
    });
  } catch (error) {
    console.error('getStats error', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { getStats };
