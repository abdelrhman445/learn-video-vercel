const mongoose = require('mongoose');

const videoSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'عنوان الفيديو مطلوب'],
    trim: true,
    default: 'بدون عنوان'
  },
  youtubeId: {
    type: String,
    required: [true, 'معرف اليوتيوب مطلوب'],
    unique: true
  },
  url: {
    type: String,
    required: [true, 'رابط الفيديو مطلوب']
  },
  thumbnail: {
    type: String,
    default: ''
  },
  description: {
    type: String,
    default: ''
  },
  privacy: {
    type: String,
    enum: ['public', 'unlisted', 'private'],
    default: 'public'
  },
  allowedRoles: [{
    type: String,
    enum: ['user', 'vip', 'premium'],
    default: ['user']
  }],
  allowedUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  addedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  metadata: {
    duration: { type: String, default: 'N/A' },
    publishedAt: { type: Date, default: Date.now },
    channelTitle: { type: String, default: 'Unknown Channel' }
  },
  views: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// فهرس للبحث
videoSchema.index({ title: 'text', description: 'text' });

// طريقة للتأكد من أن allowedRoles ليس null
videoSchema.pre('save', function(next) {
  if (!this.allowedRoles || this.allowedRoles.length === 0) {
    this.allowedRoles = ['user'];
  }
  next();
});

module.exports = mongoose.model('Video', videoSchema);