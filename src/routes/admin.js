const express = require('express');
const { body } = require('express-validator');
const { 
  addVideo, 
  updateVideo, 
  deleteVideo, 
  getAllVideos,
  getAllUsers,
  updateUser,
  getActivityLogs,
  getStats,
  getVideo
} = require('../controllers/adminController');
const { adminAuth } = require('../middlewares/auth');

const router = express.Router();

// جميع مسارات الإدارة تتطلب صلاحيات مدير
router.use(adminAuth);

// التحقق من صحة بيانات الفيديو
const videoValidation = [
  body('url').isURL().withMessage('رابط غير صالح')
];

// مسارات الفيديوهات
router.post('/videos', videoValidation, addVideo);
router.get('/videos', getAllVideos);
router.get('/videos/:id', getVideo); // ✅ تمت الإضافة
router.put('/videos/:id', updateVideo);
router.delete('/videos/:id', deleteVideo);

// مسارات المستخدمين
router.get('/users', getAllUsers);
router.put('/users/:id', updateUser);

// مسارات السجلات والإحصائيات
router.get('/logs', getActivityLogs);
router.get('/stats', getStats);

module.exports = router;