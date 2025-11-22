const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const rateLimit = require('express-rate-limit');

const app = express();

// Middleware الأمان - تبسيط للإعداد على Vercel
app.use(helmet({
  contentSecurityPolicy: false // تعطيل CSP للتبسيط في Vercel
}));

// إعدادات CORS أكثر مرونة للتطوير والإنتاج
app.use(cors({
  origin: true,
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  message: {
    success: false,
    message: 'تم تجاوز الحد المسموح من الطلبات، يرجى المحاولة لاحقاً'
  }
});
app.use('/api/', limiter);

// middleware لتحليل JSON
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// تسجيل الطلبات الواردة (مفيد للتطوير)
app.use((req, res, next) => {
  console.log(`📨 ${req.method} ${req.path}`, {
    body: Object.keys(req.body).length > 0 ? 'بيانات موجودة' : 'لا توجد بيانات',
    query: Object.keys(req.query).length > 0 ? req.query : 'لا توجد استعلامات',
    headers: req.headers?.authorization ? 'Token موجود' : 'لا يوجد Token'
  });
  next();
});

// خدمة الملفات الثابتة للواجهة الأمامية
app.use(express.static(path.join(__dirname, '../frontend')));

// الروابط
app.use('/api/auth', require('./routes/auth'));
app.use('/api/videos', require('./routes/videos'));
app.use('/api/admin', require('./routes/admin'));

// Routes للصفحات الرئيسية
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/login.html'));
});

app.get('/login.html', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/login.html'));
});

app.get('/register', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/register.html'));
});

app.get('/register.html', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/register.html'));
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/admin/index.html'));
});

app.get('/watch', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/watch.html'));
});

app.get('/watch.html', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/watch.html'));
});

// Routes لصفحات الإدارة
app.get('/admin/*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/admin/index.html'));
});

// معالج الأخطاء
app.use(require('./middlewares/errorHandler'));

// Route لأي صفحة غير موجودة - SPA fallback
app.use('*', (req, res) => {
  console.log(`❌ مسار غير موجود: ${req.originalUrl}`);
  
  // إذا كان الطلب لملف (يملك امتداد) نرجع 404
  if (req.originalUrl.includes('.')) {
    return res.status(404).json({
      success: false,
      message: 'الصفحة غير موجودة'
    });
  }
  
  // إذا كان مسار عادي نرجع index.html لتطبيق SPA
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

module.exports = app;