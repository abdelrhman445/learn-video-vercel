const Video = require('../models/Video');
const User = require('../models/User');
const ActivityLog = require('../models/ActivityLog');
const { getYouTubeVideoInfo, extractYouTubeId } = require('../utils/youtubeAPI');
const { validationResult } = require('express-validator');

// إدارة الفيديوهات - الإضافة
exports.addVideo = async (req, res) => {
  try {
    console.log('🎬 بدء إضافة فيديو جديد...');
    console.log('📦 بيانات الطلب:', req.body);

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('❌ أخطاء التحقق:', errors.array());
      return res.status(400).json({
        success: false,
        message: 'بيانات غير صالحة',
        errors: errors.array()
      });
    }

    const { url, privacy = 'public', allowedRoles = [], allowedUsers = [] } = req.body;
    
    console.log('🔍 استخراج معرف اليوتيوب من الرابط...');
    const youtubeId = extractYouTubeId(url);
    console.log('📹 معرف اليوتيوب المستخرج:', youtubeId);

    if (!youtubeId) {
      return res.status(400).json({
        success: false,
        message: 'رابط اليوتيوب غير صالح'
      });
    }

    // التحقق من عدم وجود الفيديو مسبقاً
    console.log('🔎 التحقق من وجود الفيديو مسبقاً...');
    const existingVideo = await Video.findOne({ youtubeId });
    if (existingVideo) {
      return res.status(400).json({
        success: false,
        message: 'هذا الفيديو مضاف مسبقاً'
      });
    }

    // سحب معلومات الفيديو من يوتيوب
    console.log('🌐 جلب معلومات الفيديو من يوتيوب...');
    let videoInfo;
    try {
      videoInfo = await getYouTubeVideoInfo(youtubeId);
      console.log('✅ معلومات الفيديو المستلمة:', videoInfo.title);
    } catch (error) {
      console.error('❌ خطأ في جلب معلومات اليوتيوب:', error);
      return res.status(400).json({
        success: false,
        message: 'تعذر جلب معلومات الفيديو من يوتيوب'
      });
    }

    // إنشاء الفيديو
    console.log('📝 إنشاء سجل الفيديو...');
    const video = new Video({
      title: videoInfo.title,
      youtubeId,
      url: `https://www.youtube.com/watch?v=${youtubeId}`,
      thumbnail: videoInfo.thumbnail,
      description: videoInfo.description,
      privacy,
      allowedRoles,
      allowedUsers,
      addedBy: req.user._id,
      metadata: {
        duration: videoInfo.duration,
        publishedAt: videoInfo.publishedAt,
        channelTitle: videoInfo.channelTitle
      }
    });

    await video.save();
    console.log('💾 تم حفظ الفيديو في قاعدة البيانات');

    // تسجيل النشاط
    await ActivityLog.create({
      actor: req.user._id,
      action: 'ADD_VIDEO',
      target: 'VIDEO',
      details: { videoId: video._id, title: video.title },
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });

    console.log('✅ تم إضافة الفيديو بنجاح:', video.title);
    res.status(201).json({
      success: true,
      message: 'تم إضافة الفيديو بنجاح',
      data: {
        video
      }
    });

  } catch (error) {
    console.error('❌ خطأ في إضافة الفيديو:', error);
    console.error('📝 تفاصيل الخطأ:', error.message);
    console.error('🔄 stack:', error.stack);
    
    res.status(500).json({
      success: false,
      message: 'خطأ في السيرفر: ' + error.message
    });
  }
};

// تحديث فيديو
exports.updateVideo = async (req, res) => {
  try {
    const videoId = req.params.id;
    const updates = req.body;

    console.log('✏️ محاولة تحديث الفيديو:', videoId);
    console.log('🔄 التحديثات:', updates);

    const video = await Video.findById(videoId);
    if (!video) {
      return res.status(404).json({
        success: false,
        message: 'الفيديو غير موجود'
      });
    }

    // تحديث البيانات
    Object.keys(updates).forEach(key => {
      if (updates[key] !== undefined) {
        video[key] = updates[key];
      }
    });

    await video.save();

    // تسجيل النشاط
    await ActivityLog.create({
      actor: req.user._id,
      action: 'UPDATE_VIDEO',
      target: 'VIDEO',
      details: { videoId: video._id, title: video.title, updates },
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });

    console.log('✅ تم تحديث الفيديو بنجاح:', video.title);
    res.json({
      success: true,
      message: 'تم تحديث الفيديو بنجاح',
      data: {
        video
      }
    });

  } catch (error) {
    console.error('❌ خطأ في تحديث الفيديو:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في السيرفر: ' + error.message
    });
  }
};

// حذف فيديو
exports.deleteVideo = async (req, res) => {
  try {
    const videoId = req.params.id;
    console.log('🗑️ محاولة حذف الفيديو:', videoId);

    const video = await Video.findById(videoId);
    if (!video) {
      return res.status(404).json({
        success: false,
        message: 'الفيديو غير موجود'
      });
    }

    await Video.findByIdAndDelete(videoId);

    // تسجيل النشاط
    await ActivityLog.create({
      actor: req.user._id,
      action: 'DELETE_VIDEO',
      target: 'VIDEO',
      details: { videoId: video._id, title: video.title },
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });

    console.log('✅ تم حذف الفيديو بنجاح:', video.title);
    res.json({
      success: true,
      message: 'تم حذف الفيديو بنجاح'
    });

  } catch (error) {
    console.error('❌ خطأ في حذف الفيديو:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في السيرفر: ' + error.message
    });
  }
};

// الحصول على جميع الفيديوهات (للمسؤول)
exports.getAllVideos = async (req, res) => {
  try {
    console.log('🔍 جلب جميع الفيديوهات للمسؤول...');
    
    const { page = 1, limit = 10, search = '' } = req.query;
    console.log('📊 معاملات الطلب:', { page, limit, search });

    const query = { isActive: true }; // فقط الفيديوهات النشطة
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    console.log('🔎 استعلام البحث:', JSON.stringify(query));

    // جلب الفيديوهات مع معلومات السكان
    const videos = await Video.find(query)
      .populate('addedBy', 'name email')
      .populate('allowedUsers', 'name email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean(); // استخدام lean() للحصول على كائنات JavaScript عادية

    console.log(`✅ تم العثور على ${videos.length} فيديو`);

    const total = await Video.countDocuments(query);
    console.log(`📈 إجمالي الفيديوهات: ${total}`);

    res.json({
      success: true,
      data: {
        videos,
        totalPages: Math.ceil(total / limit),
        currentPage: parseInt(page),
        total
      }
    });

  } catch (error) {
    console.error('❌ خطأ في جلب الفيديوهات:', error);
    console.error('📝 تفاصيل الخطأ:', error.message);
    console.error('🔄 stack:', error.stack);
    
    res.status(500).json({
      success: false,
      message: 'خطأ في السيرفر: ' + error.message,
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// إدارة المستخدمين - الحصول على جميع المستخدمين
exports.getAllUsers = async (req, res) => {
  try {
    console.log('👥 جلب جميع المستخدمين...');
    
    const { page = 1, limit = 10 } = req.query;
    console.log('📊 معاملات الطلب:', { page, limit });

    const users = await User.find()
      .select('-passwordHash')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await User.countDocuments();
    console.log(`✅ تم جلب ${users.length} مستخدم من إجمالي ${total}`);

    res.json({
      success: true,
      data: {
        users,
        totalPages: Math.ceil(total / limit),
        currentPage: parseInt(page),
        total
      }
    });

  } catch (error) {
    console.error('❌ خطأ في جلب المستخدمين:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في السيرفر: ' + error.message
    });
  }
};

// تحديث مستخدم
exports.updateUser = async (req, res) => {
  try {
    const userId = req.params.id;
    const { role, active } = req.body;

    console.log('✏️ محاولة تحديث المستخدم:', userId);
    console.log('🔄 التحديثات:', { role, active });

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'المستخدم غير موجود'
      });
    }

    if (role) user.role = role;
    if (active !== undefined) user.active = active;

    await user.save();

    // تسجيل النشاط
    await ActivityLog.create({
      actor: req.user._id,
      action: 'UPDATE_USER',
      target: 'USER',
      details: { userId: user._id, email: user.email, updates: { role, active } },
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });

    console.log('✅ تم تحديث المستخدم بنجاح:', user.email);
    res.json({
      success: true,
      message: 'تم تحديث المستخدم بنجاح',
      data: {
        user
      }
    });

  } catch (error) {
    console.error('❌ خطأ في تحديث المستخدم:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في السيرفر: ' + error.message
    });
  }
};

// الحصول على سجلات النشاط
exports.getActivityLogs = async (req, res) => {
  try {
    console.log('📋 جلب سجلات النشاط...');
    
    const { page = 1, limit = 20, action } = req.query;
    console.log('📊 معاملات الطلب:', { page, limit, action });

    const query = {};
    if (action) {
      query.action = action;
    }

    const logs = await ActivityLog.find(query)
      .populate('actor', 'name email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await ActivityLog.countDocuments(query);
    console.log(`✅ تم جلب ${logs.length} سجل نشاط`);

    res.json({
      success: true,
      data: {
        logs,
        totalPages: Math.ceil(total / limit),
        currentPage: parseInt(page),
        total
      }
    });

  } catch (error) {
    console.error('❌ خطأ في جلب سجلات النشاط:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في السيرفر: ' + error.message
    });
  }
};

// إحصائيات النظام
exports.getStats = async (req, res) => {
  try {
    console.log('📊 جلب إحصائيات النظام...');

    const totalUsers = await User.countDocuments();
    const totalVideos = await Video.countDocuments();
    
    const totalViewsResult = await Video.aggregate([
      { $group: { _id: null, total: { $sum: '$views' } } }
    ]);
    const totalViews = totalViewsResult[0]?.total || 0;
    
    const recentUsers = await User.countDocuments({
      createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
    });

    const stats = {
      totalUsers,
      totalVideos,
      totalViews,
      recentUsers,
      systemStatus: 'operational'
    };

    console.log('✅ الإحصائيات:', stats);
    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('❌ خطأ في جلب الإحصائيات:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في السيرفر: ' + error.message
    });
  }
};

// الحصول على فيديو معين (للمسؤول) - ✅ هذه الدالة كانت موجودة بالفعل
exports.getVideo = async (req, res) => {
  try {
    const videoId = req.params.id;
    console.log('🔍 جلب فيديو معين:', videoId);

    const video = await Video.findById(videoId)
      .populate('addedBy', 'name email')
      .populate('allowedUsers', 'name email');

    if (!video) {
      return res.status(404).json({
        success: false,
        message: 'الفيديو غير موجود'
      });
    }

    console.log('✅ تم جلب الفيديو:', video.title);
    res.json({
      success: true,
      data: {
        video
      }
    });

  } catch (error) {
    console.error('❌ خطأ في جلب الفيديو:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في السيرفر: ' + error.message
    });
  }
};