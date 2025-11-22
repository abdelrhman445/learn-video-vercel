require('dotenv').config();
const app = require('./src/app');

const PORT = process.env.PORT || 3000;

// في Vercel، لا نحتاج لتشغيل قاعدة البيانات إذا لم تكن جاهزة
if (process.env.NODE_ENV !== 'production' || process.env.MONGODB_URI) {
  const connectDB = require('./src/config/database');
  connectDB();
}

// بدء السيرفر
const server = app.listen(PORT, () => {
  console.log(`🖥️  السيرفر يعمل على المنفذ ${PORT}`);
  console.log(`🌐 العنوان: http://localhost:${PORT}`);
});

// Export for Vercel
module.exports = app;