const express = require('express');
const router = express.Router();
const { createCheckoutSession, stripeWebhook } = require('../controllers/payment');
const { protect } = require('../middleware/auth');

// ⚠️ الـ Webhook يجب أن يستخدم raw body (قبل JSON parser) لكي يتحقق Stripe من التوقيع
router.post('/webhook', express.raw({ type: 'application/json' }), stripeWebhook);

// إنشاء PaymentIntent للدفع
router.post('/checkout', protect, createCheckoutSession);

module.exports = router;