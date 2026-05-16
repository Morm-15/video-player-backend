const express = require('express');
const router = express.Router();
const { createCheckoutSession, stripeWebhook } = require('../controllers/payment');
const { protect } = require('../middleware/auth');

// ✅ Stripe Webhook - يجب أن يكون قبل JSON parser
// express.raw() يضمن أن Stripe يستطيع التحقق من التوقيع
router.post('/webhook', express.raw({ type: 'application/json' }), stripeWebhook);

// ✅ إنشاء PaymentIntent للدفع النظيف
router.post('/checkout', protect, createCheckoutSession);

module.exports = router;