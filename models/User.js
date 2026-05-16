const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken');

const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please add a name'],
        minLength: 4
    },
    email: {
        type: String,
        required: [true, 'Please add a valid email'],
        unique: true,
        match: [
            /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
            'Please add a valid email',
        ],
    },
    password: {
        type: String,
        required: [true, 'Please add a password'],
        minLength: 6,
        select: false
    },
    isPremium: {
        type: Boolean,
        default: false, // القيمة الافتراضية هي مستخدم عادي تظهر له إعلانات
    },
    stripeCustomerId: {
        type: String,
        default: null,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    subscriptionPlan: {
        type: String,
        enum: ['free', 'monthly', 'yearly', 'lifetime'],
        default: 'free'
    },
    subscriptionExpiration: {
        type: Date,
        default: null
    }
})

UserSchema.pre('save', async function (next) {

    if (!this.isModified('password')) return next()

    const salt = await bcrypt.genSalt(10)
    this.password = await bcrypt.hash(this.password, salt)

})

UserSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password)
}

UserSchema.methods.getSignedJwtToken = function () {
    return jwt.sign(
        { id: this._id },
        process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE,
    });
}

module.exports = mongoose.model('User', UserSchema)