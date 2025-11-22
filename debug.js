require('dotenv').config();
const mongoose = require('mongoose');

const debugDatabase = async () => {
    try {
        console.log('🔍 فحص اتصال قاعدة البيانات...');
        
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/hacker-video-platform', {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });

        console.log('✅ قاعدة البيانات متصلة بنجاح');

        // فحص المجموعات
        const collections = await mongoose.connection.db.listCollections().toArray();
        console.log('📊 المجموعات الموجودة:', collections.map(c => c.name));

        // فحص المستخدمين
        const User = require('./src/models/User');
        const users = await User.find();
        console.log(`👥 عدد المستخدمين: ${users.length}`);
        users.forEach(user => {
            console.log(`   - ${user.name} (${user.email}) - ${user.role}`);
        });

        // فحص الفيديوهات
        const Video = require('./src/models/Video');
        const videos = await Video.find();
        console.log(`🎬 عدد الفيديوهات: ${videos.length}`);
        videos.forEach(video => {
            console.log(`   - ${video.title} (${video.youtubeId})`);
        });

        await mongoose.connection.close();
        console.log('✅ اكتمل الفحص');

    } catch (error) {
        console.error('❌ خطأ في الفحص:', error);
    }
};

debugDatabase();