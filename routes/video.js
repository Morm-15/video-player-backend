const express = require('express');
const { saveProgress, getProgress } = require('../controllers/video');
const { protect } = require('../middleware/auth'); // نفترض وجود middleware للحماية

const router = express.Router();

router.post('/progress', protect, saveProgress);
router.get('/progress/:videoId', protect, getProgress);

module.exports = router;
