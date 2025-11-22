const express = require('express');
const { getVideos, getVideo } = require('../controllers/videoController');
const { auth } = require('../middlewares/auth');

const router = express.Router();

// جميع المسارات تتطلب مصادقة
router.use(auth);

router.get('/', getVideos);
router.get('/:id', getVideo);

module.exports = router;