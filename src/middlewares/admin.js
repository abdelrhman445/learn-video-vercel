const { adminAuth } = require('./auth');

// Middleware للتحقق من صلاحيات المدير مع معالجة أفضل للأخطاء
const requireAdmin = async (req, res, next) => {
  try {
    await adminAuth(req, res, next);
  } catch (error) {
    return res.status(403).json({
      success: false,
      message: 'صلاحيات غير كافية للوصول إلى هذا المورد'
    });
  }
};

module.exports = { requireAdmin };