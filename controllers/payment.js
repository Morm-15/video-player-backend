const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
const Transaction = require('../models/Transaction');
const User = require('../models/User');

const BASE_URL = process.env.BACKEND_URL || 'https://video-player-backend-7ywy.onrender.com';

// @desc    إنشاء Stripe Checkout Session (يعمل عبر المتصفح - متوافق مع Expo Go)
// @route   POST /api/payment/checkout
exports.createCheckoutSession = async (req, res) => {
    try {
        const { planType, amount } = req.body;

        const productName = planType === 'yearly'
            ? 'VIP سنوي - مشاهدة بلا حدود'
            : 'VIP شهري - مشاهدة بلا حدود';

        // إنشاء Stripe Checkout Session (صفحة دفع جاهزة من Stripe)
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [{
                price_data: {
                    currency: 'usd',
                    product_data: {
                        name: productName,
                        description: 'اشتراك VIP في VideoPlayer App',
                    },
                    unit_amount: amount, // بالسنت (999 = $9.99)
                },
                quantity: 1,
            }],
            mode: 'payment',
            // صفحات نجاح وإلغاء على السيرفر
            success_url: `${BASE_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}&user_id=${req.user.id}&plan=${planType}`,
            cancel_url: `${BASE_URL}/payment-cancel`,
            metadata: {
                userId: req.user.id.toString(),
                planType: planType,
            },
        });

        // حفظ العملية بحالة pending
        await Transaction.create({
            user: req.user.id,
            stripePaymentIntentId: session.id, // نستخدم session.id كمعرف
            amount: amount,
            currency: 'usd',
            planType: planType,
            status: 'pending',
        });

        res.status(200).json({
            success: true,
            url: session.url,           // رابط صفحة الدفع
            sessionId: session.id,      // للتحقق بعد العودة
        });

    } catch (error) {
        console.error('Checkout error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    التحقق من حالة الدفع بعد عودة المستخدم للتطبيق
// @route   GET /api/payment/verify/:sessionId
exports.verifyPayment = async (req, res) => {
    try {
        const { sessionId } = req.params;

        const session = await stripe.checkout.sessions.retrieve(sessionId);

        if (session.payment_status === 'paid') {
            const userId = session.metadata?.userId || req.user.id;
            const planType = session.metadata?.planType || 'monthly';

            // ترقية المستخدم للـ Premium
            await User.findByIdAndUpdate(userId, {
                isPremium: true,
                subscriptionPlan: planType,
            });

            // تحديث حالة العملية
            await Transaction.findOneAndUpdate(
                { stripePaymentIntentId: sessionId },
                { status: 'succeeded' }
            );

            return res.json({ success: true, paid: true, plan: planType });
        }

        res.json({ success: true, paid: false });

    } catch (error) {
        console.error('Verify error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Stripe Webhook - تحديث تلقائي عند اكتمال الدفع
// @route   POST /api/payment/webhook
exports.stripeWebhook = async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
        event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
        console.log(`⚠️  Webhook signature verification failed.`, err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    if (event.type === 'checkout.session.completed') {
        const session = event.data.object;

        if (session.payment_status === 'paid') {
            const userId = session.metadata?.userId;
            const planType = session.metadata?.planType || 'monthly';

            if (userId) {
                await User.findByIdAndUpdate(userId, {
                    isPremium: true,
                    subscriptionPlan: planType,
                });

                await Transaction.findOneAndUpdate(
                    { stripePaymentIntentId: session.id },
                    { status: 'succeeded' }
                );

                console.log(`✅ User ${userId} upgraded to Premium (${planType})`);
            }
        }
    }

    res.json({ received: true });
};