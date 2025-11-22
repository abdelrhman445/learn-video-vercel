const { systemLog } = require('../utils/logger');

const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // تسجيل الخطأ
  systemLog(`Error: ${err.message}`, 'ERROR');

  // خطأ في MongoDB
  if (err.name === 'CastError') {
    const message = 'المعرف غير صالح';
    error = { message, statusCode: 400 };
  }

  // تكرار المفتاح
  if (err.code === 11000) {
    const message = 'هذا السجل موجود مسبقاً في النظام';
    error = { message, statusCode: 400 };
  }

  // خطأ في التحقق
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message).join(', ');
    error = { message, statusCode: 400 };
  }

  res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || 'خطأ في السيرفر'
  });
};

module.exports = errorHandler;