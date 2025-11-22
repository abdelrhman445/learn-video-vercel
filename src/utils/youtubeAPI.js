const axios = require('axios');

// استخراج YouTube ID من الرابط
exports.extractYouTubeId = (url) => {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&?#/]+)/,
    /youtube\.com\/watch\?.*v=([^&]+)/,
    /youtu\.be\/([^?]+)/
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
};

// الحصول على معلومات الفيديو من YouTube API
exports.getYouTubeVideoInfo = async (youtubeId) => {
  try {
    const apiKey = process.env.YOUTUBE_API_KEY;
    
    if (!apiKey) {
      // إذا لم يكن هناك API key، نرجع بيانات افتراضية
      return {
        title: `Video ${youtubeId}`,
        description: 'No description available',
        thumbnail: `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`,
        duration: 'N/A',
        publishedAt: new Date(),
        channelTitle: 'Unknown Channel'
      };
    }

    const response = await axios.get(
      `https://www.googleapis.com/youtube/v3/videos`,
      {
        params: {
          part: 'snippet,contentDetails',
          id: youtubeId,
          key: apiKey
        }
      }
    );

    if (!response.data.items || response.data.items.length === 0) {
      throw new Error('Video not found on YouTube');
    }

    const video = response.data.items[0];
    const snippet = video.snippet;
    const contentDetails = video.contentDetails;

    return {
      title: snippet.title,
      description: snippet.description,
      thumbnail: snippet.thumbnails.high?.url || snippet.thumbnails.medium?.url,
      duration: contentDetails.duration,
      publishedAt: new Date(snippet.publishedAt),
      channelTitle: snippet.channelTitle
    };

  } catch (error) {
    console.error('Error fetching YouTube video info:', error);
    
    // بيانات افتراضية في حالة الخطأ
    return {
      title: `Video ${youtubeId}`,
      description: 'Unable to fetch video details',
      thumbnail: `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`,
      duration: 'N/A',
      publishedAt: new Date(),
      channelTitle: 'Unknown Channel'
    };
  }
};