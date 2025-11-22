const ActivityLog = require('../models/ActivityLog');

exports.logActivity = async (actor, action, target, details = {}, ip = '', userAgent = '') => {
  try {
    await ActivityLog.create({
      actor,
      action,
      target,
      details,
      ip,
      userAgent
    });
  } catch (error) {
    console.error('Error logging activity:', error);
  }
};

exports.systemLog = (message, type = 'INFO') => {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${type}: ${message}`;
  
  console.log(logMessage);
  
  // يمكن إضافة كتابة في ملف log هنا إذا لزم الأمر
  // fs.appendFileSync('system.log', logMessage + '\n');
};