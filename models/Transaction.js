const mongoose = require('mongoose');

const TransactionSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    stripePaymentIntentId: {
        type: String,
        required: true,
        unique: true
    },
    amount: {
        type: Number,
        required: true
    },
    currency: {
        type: String,
        required: true
    },
    planType: {
        type: String,
        enum: ['monthly', 'yearly', 'lifetime'],
        required: true
    },
    status: {
        type: String,
        enum: ['succeeded', 'failed', 'pending'],
        required: true,
        default: 'pending'
    },
    expiryDate: {
        type: Date
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Transaction', TransactionSchema);