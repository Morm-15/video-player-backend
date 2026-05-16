const express = require('express');
const router = express.Router();
const { createCheckoutSession, verifyPayment } = require('../controllers/payment');
const { protect } = require('../middleware/auth');

// إنشاء جلسة دفع (يتطلب تسجيل دخول)
router.post('/checkout', protect, createCheckoutSession);

// التحقق من حالة الدفع بعد عودة المستخدم
router.get('/verify/:sessionId', protect, verifyPayment);

module.exports = router;