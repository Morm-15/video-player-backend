const express = require('express');
const router = express.Router();
const { createCheckoutSession } = require('../controllers/payment');
const { protect } = require('../middleware/auth');

// حماية المسار: فقط المستخدم المسجل يمكنه الوصول لهذا الرابط
router.post('/checkout', protect, createCheckoutSession);

module.exports = router;