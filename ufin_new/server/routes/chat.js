const express = require('express');
const router = express.Router();
const Groq = require("groq-sdk");
const mongoose = require('mongoose');
const Produce = require('../models/Produce');

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const getLiveProducts = async () => {
  if (mongoose.connection.readyState !== 1) return [];

  return Produce.find({ status: 'available' })
    .sort({ basePrice: 1 })
    .limit(100)
    .select('name type basePrice pricingType quantity freshness sellerName demand')
    .lean();
};

const formatUnit = (pricingType) => ({
  per_kg: 'kg',
  per_item: 'item',
  per_dozen: 'dozen'
}[pricingType] || 'kg');

const detectLanguage = (message, requestedLanguage) => {
  if (/^[\u0000-\u007F]*$/.test(message)) return 'English';
  if (/[\u0900-\u097F]/.test(message)) return 'Hindi';
  if (/[\u0C00-\u0C7F]/.test(message)) return 'Telugu';
  if (requestedLanguage === 'hi-IN') return 'Hindi';
  if (requestedLanguage === 'te-IN') return 'Telugu';
  return 'English';
};

const findMentionedProducts = (message, products) => products.filter((product) => {
  const nameWords = product.name.toLowerCase().split(/\s+/).filter(word => word.length > 2);
  const aliases = [];
  if (product.name.toLowerCase().includes('tomato')) aliases.push('tomato', 'tomatoes', '\u091f\u092e\u093e\u091f\u0930', '\u0c1f\u0c2e\u0c3e\u091f\u0c3e', '\u0c1f\u0c2e\u0c3e\u091f');
  if (product.name.toLowerCase().includes('potato')) aliases.push('potato', 'potatoes', '\u0906\u0932\u0942');
  if (product.name.toLowerCase().includes('banana')) aliases.push('banana', 'bananas', '\u0915\u0947\u0932\u093e');
  return [...nameWords, ...aliases].some(word => message.includes(word));
});

const isPriceQuestion = (message) => /price|cost|rate|how much|today|cheap|lowest|\u092d\u093e\u0935|\u0926\u093e\u092e|\u0915\u0940\u092e\u0924|\u0906\u091c|\u0938\u0938\u094d\u0924\u093e|\u0c27\u0930|\u0930\u0947\u091f\u0941|\u0c08\u0930\u094b\u091c\u0941|\u0c9a\u094c\u0915/i.test(message);

const localReply = (message, products, language) => {
  const question = message.toLowerCase();
  const isHindi = language === 'Hindi';
  const isTelugu = language === 'Telugu';
  const asksForPrice = isPriceQuestion(question);

  if (products.length === 0) {
    return isHindi
      ? 'अभी कोई उत्पाद सूचीबद्ध नहीं है। लाइव कीमत और उपलब्धता देखने के लिए पहले कोई उत्पाद जोड़ें।'
      : isTelugu
        ? 'ప్రస్తుతం ఉత్పత్తులు జాబితాలో లేవు. తాజా ధర మరియు లభ్యత కోసం ముందుగా ఉత్పత్తిని జోడించండి.'
        : 'There are no products listed yet. Add a product first, and I can provide live prices and availability.';
  }

  const mentionedProducts = findMentionedProducts(question, products);
  if (mentionedProducts.length > 0 && asksForPrice) {
    return mentionedProducts.map(product =>
      isHindi
        ? `📦 उत्पाद: ${product.name}\n💰 आज की कीमत: ₹${product.basePrice}/${formatUnit(product.pricingType)}\n📊 उपलब्ध मात्रा: ${product.quantity} ${formatUnit(product.pricingType)}\n💡 यह U-FIN की वर्तमान सूची की कीमत है।`
        : isTelugu
          ? `📦 ఉత్పత్తి: ${product.name}\n💰 నేటి ధర: ₹${product.basePrice}/${formatUnit(product.pricingType)}\n📊 అందుబాటులో ఉన్న పరిమాణం: ${product.quantity} ${formatUnit(product.pricingType)}\n💡 ఇది U-FIN ప్రస్తుత జాబితా ధర.`
          : `📦 Product: ${product.name}\n💰 Price today: ₹${product.basePrice}/${formatUnit(product.pricingType)}\n📊 Available quantity: ${product.quantity} ${formatUnit(product.pricingType)}\n💡 This price is from the current U-FIN listing.`
    ).join('\n\n');
  }

  if (question.includes('cheap') || question.includes('lowest')) {
    const product = products[0];
    return isHindi
      ? `📦 उत्पाद: ${product.name}\n💰 आज की कीमत: ₹${product.basePrice}/${formatUnit(product.pricingType)}\n💡 यह सबसे कम कीमत वाला उपलब्ध उत्पाद है।`
      : isTelugu
        ? `📦 ఉత్పత్తి: ${product.name}\n💰 నేటి ధర: ₹${product.basePrice}/${formatUnit(product.pricingType)}\n💡 ఇది ప్రస్తుతం తక్కువ ధరలో ఉన్న ఉత్పత్తి.`
        : `📦 Product: ${product.name}\n💰 Price today: ₹${product.basePrice}/${formatUnit(product.pricingType)}\n📊 Available quantity: ${product.quantity} ${formatUnit(product.pricingType)}\n💡 Suggestion: This is currently the lowest-priced available product.`;
  }

  if (question.includes('complaint') || question.includes('problem')) {
    return isHindi
      ? '💡 सुझाव: डैशबोर्ड में शिकायत विकल्प खोलें, ऑर्डर या किसान चुनें, समस्या लिखें और समीक्षा के लिए जमा करें।'
      : isTelugu
        ? '💡 సూచన: డాష్‌బోర్డ్‌లో ఫిర్యాదు ఎంపికను తెరిచి, ఆర్డర్ లేదా రైతును ఎంచుకుని, సమస్యను నమోదు చేసి సమర్పించండి.'
        : '💡 Suggestion: Open the complaint option from the dashboard, select the order or farmer, describe the issue, and submit it for review.';
  }

  return isHindi
    ? `📦 उपलब्ध उत्पाद: ${products.length}\n💡 सुझाव: किसी उत्पाद की कीमत, सबसे सस्ता उत्पाद, ताजगी या शिकायत के बारे में पूछें।`
    : isTelugu
      ? `📦 అందుబాటులో ఉన్న ఉత్పత్తులు: ${products.length}\n💡 సూచన: ఉత్పత్తి ధర, తక్కువ ధర, తాజాదనం లేదా ఫిర్యాదు గురించి అడగండి.`
      : `📦 Products available: ${products.length}\n💡 Suggestion: Ask me for the price of a named product, the cheapest product, freshness, or filing a complaint.`;
};

const buildProductContext = (products) => products.map(product => ({
  product: product.name,
  type: product.type,
  priceToday: `₹${product.basePrice}/${formatUnit(product.pricingType)}`,
  quantityAvailable: product.quantity,
  freshness: product.freshness,
  farmer: product.sellerName,
  demand: product.demand
}));

// POST /api/chat
router.post("/", async (req, res) => {
  try {
    const { message, language: requestedLanguage } = req.body;

    if (!message) {
      return res.status(400).json({ success: false, message: 'Message is required' });
    }

    const products = await getLiveProducts();
    const language = detectLanguage(message, requestedLanguage);
    const directReply = localReply(message, products, language);
    if (findMentionedProducts(message.toLowerCase(), products).length > 0 && (isPriceQuestion(message) || language !== 'English')) {
      return res.json({ reply: directReply, source: 'live-data' });
    }

    if (!process.env.GROQ_API_KEY || process.env.GROQ_API_KEY === 'your_groq_api_key_here') {
      return res.json({ reply: directReply, source: 'local' });
    }

    const systemPrompt = `You are U-FIN Assistant (farm platform AI).
STRICT RULES:
- Short answers
- Use structured format (📦 Product, ⭐ Trust, 💡 Suggestion)
- Mention price, trust, rating
- Detect language automatically (English, Hindi, Telugu)
- Answer in ${language}, matching the user's language exactly.
- Keep it simple and practical.
- Use only the live product data below for prices, quantities, and availability.
- Never invent a product or price. If the requested product is not listed, say that it is not currently listed.

LIVE PRODUCT DATA (retrieved now):
${JSON.stringify(buildProductContext(products))}`;

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message },
      ],
      model: "qwen/qwen3.8-27b",
      temperature: 0.7,
      max_tokens: 1024,
    });

    res.json({
      reply: chatCompletion.choices[0].message.content.trim(),
      source: 'groq'
    });

  } catch (err) {
    console.error("GROQ ERROR:", err.message);
    res.json({ reply: localReply(req.body.message, await getLiveProducts(), detectLanguage(req.body.message, req.body.language)), source: 'local' });
  }
});

module.exports = router;
