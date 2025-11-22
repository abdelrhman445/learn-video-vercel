const express = require('express');
const router = express.Router();

// Route للصفحة الرئيسية
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'مرحباً في منصة الفيديو - نظام إدارة محتوى الفيديو',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      videos: '/api/videos',
      admin: '/api/admin'
    }
  });
});

module.exports = router;