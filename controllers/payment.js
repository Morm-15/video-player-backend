const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
const Transaction = require('../models/Transaction');
const User = require('../models/User');

// @desc    إنشاء PaymentIntent للدفع عبر Native Stripe SDK
// @route   POST /api/payment/checkout
exports.createCheckoutSession = async (req, res) => {
    try {
        const { planType, amount } = req.body;

        // إنشاء PaymentIntent من Stripe
        const paymentIntent = await stripe.paymentIntents.create({
            amount: amount, // بالسنت (999 = $9.99)
            currency: 'usd',
            metadata: {
                userId: req.user.id.toString(),
                planType: planType,
            },
        });

        // حفظ العملية في قاعدة البيانات
        await Transaction.create({
            user: req.user.id,
            stripePaymentIntentId: paymentIntent.id,
            amount: amount,
            currency: 'usd',
            planType: planType,
            status: 'pending',
        });

        res.status(200).json({
            success: true,
            clientSecret: paymentIntent.client_secret,
        });

    } catch (error) {
        console.error('Payment error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Stripe Webhook - يُفعّل حساب VIP تلقائياً عند نجاح الدفع
// @route   POST /api/payment/webhook
exports.stripeWebhook = async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
        event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
        console.log(`⚠️ Webhook signature verification failed:`, err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    if (event.type === 'payment_intent.succeeded') {
        const paymentIntent = event.data.object;
        console.log(`🔔 PaymentIntent ${paymentIntent.id} succeeded.`);

        // البحث عن العملية في قاعدة البيانات
        let transaction = await Transaction.findOne({ stripePaymentIntentId: paymentIntent.id });

        if (!transaction) {
            // Fallback للاختبار: ابحث عن أحدث عملية pending
            transaction = await Transaction.findOne({ status: 'pending' }).sort({ createdAt: -1 });
        }

        if (transaction) {
            const userId = paymentIntent.metadata?.userId || transaction.user;
            const planType = paymentIntent.metadata?.planType || transaction.planType;

            // ترقية المستخدم
            await User.findByIdAndUpdate(userId, {
                isPremium: true,
                subscriptionPlan: planType,
            });

            // تحديث حالة العملية
            transaction.status = 'succeeded';
            await transaction.save();

            console.log(`✅ User ${userId} upgraded to Premium (${planType})`);
        } else {
            console.log('❌ No matching transaction found.');
        }
    }

    res.json({ received: true });
};