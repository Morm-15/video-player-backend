const VideoProgress = require('../models/VideoProgress');

// حفظ أو تحديث تقدم الفيديو
exports.saveProgress = async (req, res) => {
    try {
        const { videoId, progress } = req.body;
        const userId = req.user.id; // يأتي من الـ middleware protect

        if (!videoId || progress === undefined) {
            return res.status(400).json({ success: false, message: 'Please provide videoId and progress' });
        }

        // تحديث أو إنشاء سجل جديد
        const videoProgress = await VideoProgress.findOneAndUpdate(
            { user: userId, videoId: videoId },
            { progress: progress },
            { new: true, upsert: true } // upsert: true يعني إذا لم يكن موجوداً قم بإنشائه
        );

        res.status(200).json({ success: true, data: videoProgress });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// جلب تقدم فيديو معين
exports.getProgress = async (req, res) => {
    try {
        const { videoId } = req.params;
        const userId = req.user.id;

        const videoProgress = await VideoProgress.findOne({ user: userId, videoId: videoId });

        res.status(200).json({ 
            success: true, 
            progress: videoProgress ? videoProgress.progress : 0 
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};
