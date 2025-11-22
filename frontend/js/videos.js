class VideoManager {
    constructor() {
        this.videos = [];
        this.currentPage = 1;
        this.init();
    }

    async init() {
        // التحقق من المصادقة أولاً
        if (!this.checkAuth()) {
            return;
        }
        await this.loadVideos();
        this.renderVideos();
    }

    checkAuth() {
        const token = localStorage.getItem('authToken');
        const user = localStorage.getItem('user');
        
        if (!token || !user) {
            window.location.href = '/login.html';
            return false;
        }
        
        return true;
    }

    async loadVideos() {
        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch('/api/videos', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.status === 401) {
                // غير مصرح - إعادة التوجيه لتسجيل الدخول
                localStorage.removeItem('authToken');
                localStorage.removeItem('user');
                window.location.href = '/login.html';
                return;
            }

            const data = await response.json();
            
            if (data.success) {
                this.videos = data.data.videos;
            } else {
                console.error('Failed to load videos:', data.message);
                this.showError('فشل في تحميل الفيديوهات: ' + data.message);
            }
        } catch (error) {
            console.error('Error loading videos:', error);
            this.showError('خطأ في تحميل الفيديوهات');
        }
    }

    renderVideos() {
        const grid = document.getElementById('videosGrid');
        if (!grid) return;

        if (this.videos.length === 0) {
            grid.innerHTML = `
                <div style="text-align: center; padding: 3rem; color: var(--text-secondary);">
                    <div style="font-size: 3rem; margin-bottom: 1rem;">🎬</div>
                    <div>لا توجد فيديوهات متاحة حالياً</div>
                    <div style="margin-top: 1rem; font-size: 0.9rem;">
                        قم بتسجيل الدخول كمسؤول لإضافة فيديوهات
                    </div>
                </div>
            `;
            return;
        }

        grid.innerHTML = this.videos.map(video => `
            <div class="video-card" onclick="videoManager.playVideo('${video._id}')">
                <img src="${video.thumbnail}" alt="${video.title}" class="video-thumbnail">
                <div class="video-info">
                    <div class="video-title">${video.title}</div>
                    <div class="video-description">
                        ${video.description ? (video.description.substring(0, 100) + (video.description.length > 100 ? '...' : '')) : 'لا يوجد وصف'}
                    </div>
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 1rem;">
                        <span style="color: var(--text-secondary); font-size: 0.8rem;">
                            ${new Date(video.createdAt).toLocaleDateString('ar-EG')}
                        </span>
                        <span style="color: var(--terminal-green); font-size: 0.8rem;">
                            ${video.views} مشاهدة
                        </span>
                    </div>
                    <div style="margin-top: 0.5rem;">
                        <span class="badge badge-${video.privacy === 'public' ? 'success' : video.privacy === 'private' ? 'danger' : 'warning'}">
                            ${video.privacy === 'public' ? 'عام' : video.privacy === 'private' ? 'خاص' : 'غير مدرج'}
                        </span>
                    </div>
                </div>
            </div>
        `).join('');
    }

    playVideo(videoId) {
        window.location.href = `/watch.html?id=${videoId}`;
    }

    showError(message) {
        const grid = document.getElementById('videosGrid');
        if (grid) {
            grid.innerHTML = `
                <div class="alert alert-error" style="margin: 2rem;">
                    ${message}
                </div>
            `;
        }
    }

    async searchVideos(query) {
        // تنفيذ البحث
        console.log('Searching for:', query);
    }
}

// إنشاء instance من مدير الفيديوهات
let videoManager;

// التهيئة عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', () => {
    videoManager = new VideoManager();
    
    // تحديث واجهة المستخدم بناءً على حالة المصادقة
    updateUIBasedOnAuth();
});

// تحديث واجهة المستخدم بناءً على حالة المصادقة
function updateUIBasedOnAuth() {
    const token = localStorage.getItem('authToken');
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    
    if (token && user) {
        // المستخدم مسجل الدخول
        const userInfoElements = document.querySelectorAll('.user-info');
        userInfoElements.forEach(element => {
            const nameElement = element.querySelector('.user-name');
            if (nameElement) nameElement.textContent = user.name;
        });

        // إخفاء روابط التسجيل والدخول
        const authLinks = document.querySelectorAll('.auth-link');
        authLinks.forEach(link => {
            link.style.display = 'none';
        });

        // إظهار رابط لوحة التحكم إذا كان المستخدم مسؤولاً
        if (user.role === 'admin') {
            const adminLinks = document.querySelectorAll('.admin-link');
            adminLinks.forEach(link => {
                link.style.display = 'block';
            });
        }
    } else {
        // المستخدم غير مسجل الدخول
        const protectedLinks = document.querySelectorAll('.protected-link');
        protectedLinks.forEach(link => {
            link.style.display = 'none';
        });
    }
}

// دالة مساعدة للتحقق من المصادقة
function requireAuth() {
    const token = localStorage.getItem('authToken');
    const user = localStorage.getItem('user');
    
    if (!token || !user) {
        window.location.href = '/login.html';
        return false;
    }
    
    return true;
}

// دالة مساعدة للتحقق من صلاحيات المدير
function requireAdmin() {
    if (!requireAuth()) return false;
    
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    if (user.role !== 'admin') {
        window.location.href = '/';
        return false;
    }
    
    return true;
}