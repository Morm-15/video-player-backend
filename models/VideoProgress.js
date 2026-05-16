const mongoose = require('mongoose');

const VideoProgressSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    videoId: {
        type: String, // سيتم استخدام اسم الملف أو معرف الفيديو المحلي
        required: true
    },
    progress: {
        type: Number, // التقدم بالثواني أو الميلي ثانية
        required: true,
        default: 0
    }
}, {
    timestamps: true
});

// لمنع تكرار نفس الفيديو لنفس المستخدم، نضع index فريد
VideoProgressSchema.index({ user: 1, videoId: 1 }, { unique: true });

module.exports = mongoose.model('VideoProgress', VideoProgressSchema);
