const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const { register, login } = require('../controllers/authController');
const { getUsers } = require('../mockAuth');
const User = require('../models/User');
const mongoose = require('mongoose');

router.get('/users', async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.json({ source: 'mock', users: getUsers({}, res) });
    }
    const users = await User.find({}, 'name email role createdAt').sort({ createdAt: -1 }).limit(50);
    res.json({ source: 'atlas', count: users.length, users });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

router.post('/register', [
  body('name').notEmpty(),
  body('email').isEmail(),
  body('password').isLength({ min: 6 }),
  body('role').isIn(['farmer', 'ngo', 'buyer', 'admin'])
], register);

router.post('/login', [body('email').isEmail(), body('password').exists()], login);

module.exports = router;
