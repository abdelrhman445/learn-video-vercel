const Video = require('../models/Video');
const ActivityLog = require('../models/ActivityLog');
const { extractYouTubeId } = require('../utils/youtubeAPI');
const { validationResult } = require('express-validator');

// الحصول على قائمة الفيديوهات للمستخدم
exports.getVideos = async (req, res) => {
  try {
    const userId = req.user._id;
    const userRole = req.user.role;

    // بناء query للفيديوهات المسموح بها
    const query = {
      isActive: true,
      $or: [
        { privacy: 'public' },
        { privacy: 'unlisted' },
        { 
          $and: [
            { privacy: 'private' },
            { 
              $or: [
                { allowedRoles: { $in: [userRole] } },
                { allowedUsers: { $in: [userId] } },
                { addedBy: userId }
              ]
            }
          ]
        }
      ]
    };

    const videos = await Video.find(query)
      .populate('addedBy', 'name email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: {
        videos,
        count: videos.length
      }
    });

  } catch (error) {
    console.error('خطأ في جلب الفيديوهات:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في السيرفر'
    });
  }
};

// الحصول على فيديو معين
exports.getVideo = async (req, res) => {
  try {
    const videoId = req.params.id;
    const userId = req.user._id;
    const userRole = req.user.role;

    const video = await Video.findById(videoId)
      .populate('addedBy', 'name email')
      .populate('allowedUsers', 'name email');

    if (!video || !video.isActive) {
      return res.status(404).json({
        success: false,
        message: 'الفيديو غير موجود'
      });
    }

    // التحقق من الصلاحية
    if (video.privacy === 'private') {
      const isAllowed = 
        video.allowedRoles.includes(userRole) ||
        video.allowedUsers.some(user => user._id.equals(userId)) ||
        video.addedBy._id.equals(userId);

      if (!isAllowed) {
        return res.status(403).json({
          success: false,
          message: 'غير مسموح لك بمشاهدة هذا الفيديو'
        });
      }
    }

    // زيادة عدد المشاهدات
    video.views += 1;
    await video.save();

    res.json({
      success: true,
      data: {
        video
      }
    });

  } catch (error) {
    console.error('خطأ في جلب الفيديو:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في السيرفر'
    });
  }
};