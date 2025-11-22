class VideosManager {
    constructor() {
        this.currentPage = 1;
        this.totalPages = 1;
        this.searchQuery = '';
        this.currentEditingVideo = null;
        this.init();
    }

    async init() {
        await this.loadVideos();
        this.bindEvents();
        this.bindVideoEvents();
    }

    bindEvents() {
        const searchInput = document.getElementById('searchVideos');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.searchQuery = e.target.value;
                clearTimeout(this.searchTimeout);
                this.searchTimeout = setTimeout(() => {
                    this.currentPage = 1;
                    this.loadVideos();
                }, 500);
            });
        }

        const modal = document.getElementById('videoModal');
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeModal();
                }
            });
        }
    }

    bindVideoEvents() {
        const updateVideoBtn = document.getElementById('updateVideoBtn');
        if (updateVideoBtn) {
            updateVideoBtn.addEventListener('click', () => {
                this.updateVideo();
            });
        }

        const cancelBtn = document.querySelector('.btn-danger');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                this.closeModal();
            });
        }
    }

    async loadVideos() {
        try {
            const response = await authManager.apiCall(
                `/admin/videos?page=${this.currentPage}&limit=10&search=${this.searchQuery}`
            );
            
            if (response.success) {
                this.renderVideosTable(response.data.videos);
                this.renderPagination(response.data);
            } else {
                this.showAlert('فشل في تحميل الفيديوهات: ' + response.message, 'error');
            }
        } catch (error) {
            console.error('Error loading videos:', error);
            this.showAlert('خطأ في تحميل الفيديوهات', 'error');
        }
    }

    renderVideosTable(videos) {
        const tbody = document.getElementById('videosTableBody');
        if (!tbody) return;

        if (videos.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align: center; padding: 2rem; color: var(--text-secondary);">
                        لا توجد فيديوهات
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = videos.map(video => `
            <tr>
                <td>
                    <div style="display: flex; align-items: center; gap: 1rem;">
                        <img src="${video.thumbnail}" alt="${video.title}" 
                             style="width: 80px; height: 60px; object-fit: cover; border-radius: 4px;">
                        <div>
                            <div style="font-weight: bold; margin-bottom: 0.25rem;">${video.title}</div>
                            <div style="font-size: 0.8rem; color: var(--text-secondary);">
                                ${video.addedBy?.name || 'System'}
                            </div>
                        </div>
                    </div>
                </td>
                <td>
                    <span class="badge ${video.isActive ? 'badge-success' : 'badge-danger'}">
                        ${video.isActive ? 'نشط' : 'غير نشط'}
                    </span>
                </td>
                <td>
                    <span class="badge badge-${video.privacy === 'public' ? 'success' : video.privacy === 'private' ? 'danger' : 'warning'}">
                        ${video.privacy === 'public' ? 'عام' : video.privacy === 'private' ? 'خاص' : 'غير مدرج'}
                    </span>
                </td>
                <td>${video.views}</td>
                <td>${new Date(video.createdAt).toLocaleDateString('ar-EG')}</td>
                <td>
                    <div class="btn-group">
                        <button class="btn btn-sm" onclick="videosManager.editVideo('${video._id}')">تعديل</button>
                        <button class="btn btn-sm btn-danger" onclick="videosManager.deleteVideo('${video._id}')">حذف</button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    renderPagination(data) {
        const pagination = document.getElementById('videosPagination');
        if (!pagination) return;

        let html = '';
        
        if (data.currentPage > 1) {
            html += `<button class="btn btn-sm" onclick="videosManager.goToPage(${data.currentPage - 1})">السابق</button>`;
        }

        for (let i = 1; i <= data.totalPages; i++) {
            if (i === data.currentPage) {
                html += `<button class="btn btn-sm active">${i}</button>`;
            } else {
                html += `<button class="btn btn-sm" onclick="videosManager.goToPage(${i})">${i}</button>`;
            }
        }

        if (data.currentPage < data.totalPages) {
            html += `<button class="btn btn-sm" onclick="videosManager.goToPage(${data.currentPage + 1})">التالي</button>`;
        }

        pagination.innerHTML = html;
    }

    goToPage(page) {
        this.currentPage = page;
        this.loadVideos();
    }

    async fetchVideoInfo() {
        const url = document.getElementById('videoUrl').value;
        if (!url) {
            this.showAlert('يرجى إدخال رابط اليوتيوب', 'error');
            return;
        }

        try {
            const youtubeId = this.extractYouTubeId(url);
            if (!youtubeId) {
                this.showAlert('رابط اليوتيوب غير صالح', 'error');
                return;
            }

            document.getElementById('previewThumbnail').src = `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`;
            document.getElementById('previewTitle').textContent = `فيديو: ${youtubeId}`;
            document.getElementById('previewDescription').textContent = 'سيتم سحب البيانات من يوتيوب عند الحفظ';
            document.getElementById('videoPreview').style.display = 'block';

            this.showAlert('تم التعرف على رابط اليوتيوب بنجاح', 'success');
        } catch (error) {
            console.error('Error fetching video info:', error);
            this.showAlert('خطأ في سحب بيانات الفيديو', 'error');
        }
    }

    extractYouTubeId(url) {
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
    }

    async saveVideo() {
        const url = document.getElementById('videoUrl').value;
        const privacy = document.getElementById('videoPrivacy').value;
        const roles = Array.from(document.getElementById('videoRoles').selectedOptions).map(opt => opt.value);

        if (!url) {
            this.showAlert('يرجى إدخال رابط اليوتيوب', 'error');
            return;
        }

        try {
            const response = await authManager.apiCall('/admin/videos', {
                method: 'POST',
                body: JSON.stringify({ 
                    url, 
                    privacy, 
                    allowedRoles: roles 
                })
            });

            if (response.success) {
                this.showAlert('تم إضافة الفيديو بنجاح', 'success');
                this.closeModal();
                await this.loadVideos();
            } else {
                this.showAlert(response.message, 'error');
            }
        } catch (error) {
            console.error('Error saving video:', error);
            this.showAlert('خطأ في إضافة الفيديو', 'error');
        }
    }

    async editVideo(videoId) {
        try {
            console.log('✏️ محاولة تعديل الفيديو:', videoId);
            
            const response = await authManager.apiCall(`/admin/videos/${videoId}`);
            
            if (response.success) {
                const video = response.data.video;
                this.currentEditingVideo = video;
                this.showEditVideoModal(video);
            } else {
                this.showAlert('فشل في تحميل بيانات الفيديو: ' + response.message, 'error');
            }
        } catch (error) {
            console.error('Error editing video:', error);
            this.showAlert('خطأ في تحميل بيانات الفيديو', 'error');
        }
    }

    showEditVideoModal(video) {
        const modal = document.getElementById('videoModal');
        if (modal) {
            document.getElementById('videoModalTitle').textContent = 'تعديل الفيديو';
            document.getElementById('saveVideoBtn').style.display = 'none';
            document.getElementById('updateVideoBtn').style.display = 'inline-block';
            
            document.getElementById('videoUrl').value = video.url;
            document.getElementById('videoUrl').disabled = true;
            document.getElementById('videoPrivacy').value = video.privacy;
            
            const rolesSelect = document.getElementById('videoRoles');
            Array.from(rolesSelect.options).forEach(option => {
                option.selected = video.allowedRoles.includes(option.value);
            });
            
            document.getElementById('previewThumbnail').src = video.thumbnail;
            document.getElementById('previewTitle').textContent = video.title;
            document.getElementById('previewDescription').textContent = video.description || 'لا يوجد وصف';
            document.getElementById('videoPreview').style.display = 'block';
            
            modal.style.display = 'block';
        }
    }

    async updateVideo() {
        if (!this.currentEditingVideo) {
            this.showAlert('لا يوجد فيديو محدد للتعديل', 'error');
            return;
        }

        const privacy = document.getElementById('videoPrivacy').value;
        const roles = Array.from(document.getElementById('videoRoles').selectedOptions).map(opt => opt.value);

        try {
            const response = await authManager.apiCall(`/admin/videos/${this.currentEditingVideo._id}`, {
                method: 'PUT',
                body: JSON.stringify({ 
                    privacy, 
                    allowedRoles: roles 
                })
            });

            if (response.success) {
                this.showAlert('تم تحديث الفيديو بنجاح', 'success');
                this.closeModal();
                await this.loadVideos();
            } else {
                this.showAlert(response.message, 'error');
            }
        } catch (error) {
            console.error('Error updating video:', error);
            this.showAlert('خطأ في تحديث الفيديو', 'error');
        }
    }

    async deleteVideo(videoId) {
        if (!confirm('هل أنت متأكد من حذف هذا الفيديو؟')) return;

        try {
            const response = await authManager.apiCall(`/admin/videos/${videoId}`, {
                method: 'DELETE'
            });

            if (response.success) {
                this.showAlert('تم حذف الفيديو بنجاح', 'success');
                await this.loadVideos();
            } else {
                this.showAlert(response.message, 'error');
            }
        } catch (error) {
            console.error('Error deleting video:', error);
            this.showAlert('خطأ في حذف الفيديو', 'error');
        }
    }

    showModal() {
        document.getElementById('videoModal').style.display = 'block';
    }

    closeModal() {
        const modal = document.getElementById('videoModal');
        if (modal) {
            modal.style.display = 'none';
            document.getElementById('videoForm').reset();
            document.getElementById('videoUrl').disabled = false;
            document.getElementById('videoPreview').style.display = 'none';
            this.currentEditingVideo = null;
            
            document.getElementById('videoModalTitle').textContent = 'إضافة فيديو جديد';
            document.getElementById('saveVideoBtn').style.display = 'inline-block';
            document.getElementById('updateVideoBtn').style.display = 'none';
        }
    }

    showAlert(message, type) {
        alert(`[${type.toUpperCase()}] ${message}`);
    }
}

function showAddVideoModal() {
    videosManager.showModal();
}

function closeVideoModal() {
    videosManager.closeModal();
}

function fetchVideoInfo() {
    videosManager.fetchVideoInfo();
}

function saveVideo() {
    videosManager.saveVideo();
}

function editVideo(videoId) {
    videosManager.editVideo(videoId);
}

function updateVideo() {
    videosManager.updateVideo();
}

let videosManager;

document.addEventListener('DOMContentLoaded', () => {
    if (requireAuth('admin')) {
        videosManager = new VideosManager();
    }
});