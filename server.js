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
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));

// 3. Stripe Webhook (يجب قبل express.json)
app.post(
    '/api/payment/webhook',
    express.raw({ type: 'application/json' }),
    stripeWebhook
);

// 4. Body Parser
app.use(express.json({ limit: '10kb' }));

// 5. Health Check
app.get('/', (req, res) => {
    res.json({
        status: 'ok',
        message: 'VideoPlayer API is running 🎬',
        timestamp: new Date().toISOString()
    });
});

// 6. صفحة نجاح الدفع (تُعرض في المتصفح بعد الدفع)
app.get('/payment-success', async (req, res) => {
    const { session_id, user_id, plan } = req.query;

    // ترقية المستخدم تلقائياً عند فتح صفحة النجاح
    if (user_id) {
        try {
            const User = require('./models/User');
            const Transaction = require('./models/Transaction');
            await User.findByIdAndUpdate(user_id, {
                isPremium: true,
                subscriptionPlan: plan || 'monthly'
            });
            if (session_id) {
                await Transaction.findOneAndUpdate(
                    { stripePaymentIntentId: session_id },
                    { status: 'succeeded' }
                );
            }
            console.log(`✅ User ${user_id} upgraded to Premium via success page`);
        } catch (e) {
            console.error('Error upgrading user:', e.message);
        }
    }

    res.send(`
        <!DOCTYPE html>
        <html dir="rtl" lang="ar">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>تم الدفع بنجاح</title>
            <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body {
                    font-family: 'Segoe UI', Arial, sans-serif;
                    background: #0a0a0a;
                    color: #fff;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    min-height: 100vh;
                    text-align: center;
                    padding: 20px;
                }
                .icon { font-size: 80px; margin-bottom: 24px; animation: bounce 1s infinite; }
                @keyframes bounce { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-15px); } }
                h1 { font-size: 28px; color: #f5c518; margin-bottom: 12px; }
                p { font-size: 16px; color: #aaa; margin-bottom: 8px; line-height: 1.6; }
                .badge {
                    background: linear-gradient(135deg, #f5c518, #e50914);
                    border-radius: 30px;
                    padding: 12px 30px;
                    margin-top: 24px;
                    font-size: 18px;
                    font-weight: bold;
                }
                .instruction { margin-top: 30px; background: #1a1a1a; border-radius: 12px; padding: 16px; font-size: 14px; color: #888; }
            </style>
        </head>
        <body>
            <div class="icon">🎉</div>
            <h1>تهانينا! أصبحت VIP</h1>
            <p>تمت عملية الدفع بنجاح</p>
            <div class="badge">👑 عضو VIP</div>
            <div class="instruction">
                <p>يمكنك الآن إغلاق هذه الصفحة</p>
                <p>والعودة للتطبيق للاستمتاع بتجربة VIP</p>
            </div>
        </body>
        </html>
    `);
});

// 7. صفحة إلغاء الدفع
app.get('/payment-cancel', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html dir="rtl" lang="ar">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>تم إلغاء الدفع</title>
            <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body {
                    font-family: 'Segoe UI', Arial, sans-serif;
                    background: #0a0a0a;
                    color: #fff;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    min-height: 100vh;
                    text-align: center;
                    padding: 20px;
                }
                .icon { font-size: 80px; margin-bottom: 24px; }
                h1 { font-size: 28px; color: #e50914; margin-bottom: 12px; }
                p { font-size: 16px; color: #aaa; line-height: 1.6; }
                .instruction { margin-top: 30px; background: #1a1a1a; border-radius: 12px; padding: 16px; font-size: 14px; color: #888; }
            </style>
        </head>
        <body>
            <div class="icon">❌</div>
            <h1>تم إلغاء الدفع</h1>
            <p>لم تتم عملية الدفع</p>
            <div class="instruction">
                <p>يمكنك إغلاق هذه الصفحة والعودة للتطبيق</p>
                <p>ويمكنك إعادة المحاولة في أي وقت</p>
            </div>
        </body>
        </html>
    `);
});

// 8. مسارات API
app.use('/api/auth', auth);
app.use('/api/payment', payment);
app.use('/api/video', video);

// 9. معالج الأخطاء
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
});

// 10. تشغيل السيرفر
const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Server is running on port ${PORT}`);
});