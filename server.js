const helmet = require('helmet');
const express = require('express');
const cors = require('cors');
require('dotenv').config();
const connectDB = require('./config/db');
const auth = require('./routes/auth');
const payment = require('./routes/payment');
const video = require('./routes/video');
const { stripeWebhook } = require('./controllers/payment');

const app = express();

// 1. الاتصال بقاعدة البيانات
connectDB();

// 2. إعدادات الحماية العامة
app.use(helmet());
app.use(cors({
    origin: '*', // السماح لأي مصدر (للتطبيق المحمول)
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));

// 3. رابط الـ Webhook (يجب أن يكون قبل express.json)
app.post(
    '/api/payment/webhook',
    express.raw({ type: 'application/json' }),
    stripeWebhook
);

// 4. تحليل البيانات القادمة للجسم (Body Parser) لبقية الروابط
app.use(express.json({ limit: '10kb' }));

// 5. Health Check للـ Railway
app.get('/', (req, res) => {
    res.json({ status: 'ok', message: 'VideoPlayer API is running 🎬', timestamp: new Date().toISOString() });
});

// 6. مسارات المشروع
app.use('/api/auth', auth);
app.use('/api/payment', payment);
app.use('/api/video', video);

// 7. معالج الأخطاء العام
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
});

// 8. تشغيل السيرفر
const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Server is running on port ${PORT}`);
});