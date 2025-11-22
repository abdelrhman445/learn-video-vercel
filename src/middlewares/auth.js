const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  try {
    console.log('🔐 التحقق من المصادقة...');
    
    const authHeader = req.header('Authorization');
    console.log('📨 رأس Authorization:', authHeader);

    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: 'الوصول مرفوض. لا يوجد token'
      });
    }

    // التحقق من تنسيق Bearer token
    if (!authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'تنسيق token غير صالح. يجب أن يبدأ بـ Bearer'
      });
    }

    const token = authHeader.replace('Bearer ', '');
    console.log('🔑 Token المستخدم:', token.substring(0, 20) + '...');

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'الوصول مرفوض. لا يوجد token'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
    console.log('📋 Token مفكوك:', decoded);

    const user = await User.findById(decoded.userId).select('-passwordHash');
    
    if (!user) {
      console.log('❌ المستخدم غير موجود في قاعدة البيانات');
      return res.status(401).json({
        success: false,
        message: 'المستخدم غير موجود'
      });
    }

    if (!user.active) {
      console.log('❌ الحساب معطل:', user.email);
      return res.status(401).json({
        success: false,
        message: 'الحساب معطل. يرجى التواصل مع المسؤول'
      });
    }

    console.log('✅ مصادقة ناجحة للمستخدم:', user.email);
    req.user = user;
    next();
  } catch (error) {
    console.error('❌ خطأ في المصادقة:', error.message);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Token غير صالح'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'انتهت صلاحية Token'
      });
    }

    res.status(401).json({
      success: false,
      message: 'فشل في المصادقة'
    });
  }
};

const adminAuth = async (req, res, next) => {
  try {
    console.log('👑 التحقق من صلاحيات المدير...');
    
    // استخدام auth العادي أولاً
    await auth(req, res, () => {});
    
    if (req.user.role !== 'admin') {
      console.log('❌ صلاحيات غير كافية للمستخدم:', req.user.email);
      return res.status(403).json({
        success: false,
        message: 'الوصول مرفوض. تحتاج صلاحيات مدير'
      });
    }
    
    console.log('✅ صلاحيات مدير مؤكدة للمستخدم:', req.user.email);
    next();
  } catch (error) {
    console.error('❌ خطأ في التحقق من صلاحيات المدير:', error);
    res.status(403).json({
      success: false,
      message: 'صلاحيات غير كافية'
    });
  }
};

module.exports = { auth, adminAuth };