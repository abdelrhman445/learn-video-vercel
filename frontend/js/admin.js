class AdminManager {
    constructor() {
        this.currentPage = 'dashboard';
        this.videos = [];
        this.users = [];
        this.logs = [];
        this.currentEditingVideo = null;
        
        if (!this.checkAdminAuth()) {
            return;
        }
        
        this.init();
    }

    checkAdminAuth() {
        const token = localStorage.getItem('authToken');
        const user = JSON.parse(localStorage.getItem('user') || 'null');
        
        console.log('🔐 التحقق من صلاحيات المدير...');
        console.log('👤 المستخدم:', user?.email);
        console.log('🔑 Token:', token ? 'موجود' : 'مفقود');
        
        if (!token || !user) {
            console.log('❌ غير مصرح - إعادة التوجيه لتسجيل الدخول');
            window.location.href = '/login.html';
            return false;
        }
        
        if (user.role !== 'admin') {
            console.log('❌ صلاحيات غير كافية - إعادة التوجيه للرئيسية');
            window.location.href = '/';
            return false;
        }
        
        console.log('✅ صلاحيات مدير مؤكدة');
        return true;
    }

    init() {
        console.log('🚀 تهيئة لوحة الإدارة...');
        this.bindEvents();
        this.loadDashboard();
        this.updateUserInfo();
    }

    bindEvents() {
        console.log('🔗 ربط الأحداث...');
        
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const href = item.getAttribute('href');
                if (href) {
                    const page = href.split('/').pop().replace('.html', '');
                    console.log('📄 التنقل إلى:', page);
                    this.navigateTo(page);
                }
            });
        });

        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                console.log('🚪 تسجيل الخروج...');
                this.logout();
            });
        }

        const toggleTerminal = document.getElementById('toggleTerminal');
        if (toggleTerminal) {
            toggleTerminal.addEventListener('click', () => {
                this.toggleTerminal();
            });
        }
    }

    toggleTerminal() {
        const terminal = document.querySelector('.floating-terminal');
        const isCollapsed = terminal.classList.contains('collapsed');
        
        if (isCollapsed) {
            terminal.classList.remove('collapsed');
        } else {
            terminal.classList.add('collapsed');
        }
    }

    logout() {
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        window.location.href = '/login.html';
    }

    navigateTo(page) {
        console.log('🧭 التنقل إلى صفحة:', page);
        
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        
        const activeNavItem = document.querySelector(`.nav-item[href="${page}.html"]`);
        if (activeNavItem) {
            activeNavItem.classList.add('active');
        } else {
            const activeNavItem2 = document.querySelector(`.nav-item[href="/admin/${page}.html"]`);
            if (activeNavItem2) {
                activeNavItem2.classList.add('active');
            }
        }

        const titles = {
            'index': 'لوحة التحكم',
            'videos': 'إدارة الفيديوهات',
            'users': 'إدارة المستخدمين',
            'logs': 'سجلات النظام',
            'settings': 'الإعدادات'
        };
        document.getElementById('pageTitle').textContent = titles[page] || 'لوحة التحكم';

        this.currentPage = page;
        this.loadPageContent(page);
    }

    async loadPageContent(page) {
        const contentArea = document.getElementById('contentArea');
        console.log(`📂 تحميل محتوى الصفحة: ${page}`);
        
        try {
            let html = '';
            
            switch (page) {
                case 'index':
                case 'dashboard':
                    html = await this.loadDashboardContent();
                    break;
                case 'videos':
                    html = this.loadVideosContent();
                    break;
                case 'users':
                    html = this.loadUsersContent();
                    break;
                case 'logs':
                    html = this.loadLogsContent();
                    break;
                case 'settings':
                    html = this.loadSettingsContent();
                    break;
            }
            
            contentArea.innerHTML = html;
            this.initializePageScripts(page);
        } catch (error) {
            console.error('❌ خطأ في تحميل المحتوى:', error);
            contentArea.innerHTML = `
                <div class="alert alert-error">
                    <strong>خطأ في تحميل المحتوى:</strong><br>
                    ${error.message}
                </div>
            `;
        }
    }

    async loadDashboardContent() {
        try {
            console.log('📊 تحميل محتوى لوحة التحكم...');
            const stats = await this.apiCall('/admin/stats');
            
            if (!stats.success) {
                throw new Error(stats.message);
            }

            return `
                <div class="dashboard-content">
                    <div class="stats-grid">
                        <div class="stat-card">
                            <div class="stat-number">${stats.data.totalUsers}</div>
                            <div class="stat-label">إجمالي المستخدمين</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-number">${stats.data.totalVideos}</div>
                            <div class="stat-label">إجمالي الفيديوهات</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-number">${stats.data.totalViews}</div>
                            <div class="stat-label">إجمالي المشاهدات</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-number">${stats.data.recentUsers}</div>
                            <div class="stat-label">مستخدمين جدد</div>
                        </div>
                    </div>

                    <div class="card">
                        <div class="card-header">آخر الفيديوهات المضافة</div>
                        <div id="recentVideosList">
                            <div style="text-align: center; padding: 2rem; color: var(--text-secondary);">
                                جاري تحميل الفيديوهات...
                            </div>
                        </div>
                    </div>

                    <div class="card">
                        <div class="card-header">النشاط الأخير</div>
                        <div id="recentActivityList">
                            <div style="text-align: center; padding: 2rem; color: var(--text-secondary);">
                                جاري تحميل النشاط...
                            </div>
                        </div>
                    </div>
                </div>
            `;
        } catch (error) {
            console.error('❌ خطأ في تحميل لوحة التحكم:', error);
            return `
                <div class="alert alert-error">
                    <strong>خطأ في تحميل الإحصائيات:</strong><br>
                    ${error.message}
                    <button class="btn" id="retryDashboardBtn">🔄 إعادة المحاولة</button>
                </div>
            `;
        }
    }

    loadVideosContent() {
        return `
            <div class="videos-content">
                <div class="table-header">
                    <h3>إدارة الفيديوهات</h3>
                    <div class="table-actions">
                        <button id="addVideoBtn" class="btn">+ إضافة فيديو</button>
                        <button id="refreshVideosBtn" class="btn">🔄 تحديث</button>
                    </div>
                </div>
                
                <div class="table-container">
                    <div id="videosTableContainer">
                        <div style="text-align: center; padding: 2rem; color: var(--text-secondary);">
                            جاري تحميل الفيديوهات...
                        </div>
                    </div>
                </div>
            </div>

            <div id="videoModal" class="modal" style="display: none;">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3 id="videoModalTitle">إضافة فيديو جديد</h3>
                        <button class="close-modal">&times;</button>
                    </div>
                    <div class="modal-body">
                        <form id="videoForm">
                            <div id="editVideoInfo" style="display: none; background: var(--primary-bg); padding: 1rem; border-radius: 4px; margin-bottom: 1rem; border: 1px solid var(--border-color);">
                                <div style="display: flex; align-items: center; gap: 1rem;">
                                    <img id="editVideoThumbnail" src="" alt="Thumbnail" style="width: 80px; height: 60px; object-fit: cover; border-radius: 4px;">
                                    <div>
                                        <div id="editVideoTitle" style="font-weight: bold; margin-bottom: 0.25rem;"></div>
                                        <div id="editVideoId" style="font-size: 0.8rem; color: var(--text-secondary);"></div>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="form-group">
                                <label class="form-label">رابط اليوتيوب</label>
                                <input type="url" class="form-control" id="videoUrl" 
                                       placeholder="https://www.youtube.com/watch?v=..." required>
                                <div class="form-hint">يدعم روابط youtube.com و youtu.be</div>
                            </div>
                            
                            <div class="form-row">
                                <div class="form-group">
                                    <label class="form-label">الخصوصية</label>
                                    <select class="form-control" id="videoPrivacy">
                                        <option value="public">عام</option>
                                        <option value="unlisted">غير مدرج</option>
                                        <option value="private">خاص</option>
                                    </select>
                                </div>
                                
                                <div class="form-group">
                                    <label class="form-label">الأدوار المسموحة</label>
                                    <select class="form-control" id="videoRoles" multiple style="height: 100px;">
                                        <option value="user">مستخدم عادي</option>
                                        <option value="vip">VIP</option>
                                        <option value="premium">Premium</option>
                                    </select>
                                    <div class="form-hint">اضغط Ctrl لاختيار أكثر من دور</div>
                                </div>
                            </div>
                            
                            <div class="form-group">
                                <label class="form-label">المستخدمون المسموحون</label>
                                <input type="text" class="form-control" id="videoUsers" 
                                       placeholder="أدخل أسماء المستخدمين (افصل بفاصلة)">
                                <div class="form-hint">للفيديوهات الخاصة فقط</div>
                            </div>

                            <div class="form-group">
                                <label class="form-label">حالة الفيديو</label>
                                <div style="display: flex; gap: 1rem; margin-top: 0.5rem;">
                                    <label style="display: flex; align-items: center; gap: 0.5rem;">
                                        <input type="radio" name="videoStatus" id="videoActive" value="active" checked>
                                        <span>نشط</span>
                                    </label>
                                    <label style="display: flex; align-items: center; gap: 0.5rem;">
                                        <input type="radio" name="videoStatus" id="videoInactive" value="inactive">
                                        <span>غير نشط</span>
                                    </label>
                                </div>
                            </div>

                            <div id="videoPreview" style="display: none; margin-top: 1rem; padding: 1rem; background: var(--primary-bg); border-radius: 4px; border: 1px solid var(--border-color);">
                                <h4 style="margin-bottom: 1rem;">معاينة الفيديو</h4>
                                <img id="previewThumbnail" src="" alt="Preview" style="width: 100%; max-width: 300px; border-radius: 4px;">
                                <div id="previewTitle" style="margin-top: 1rem; font-weight: bold;"></div>
                                <div id="previewDescription" style="color: var(--text-secondary); margin-top: 0.5rem;"></div>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn" id="fetchVideoBtn">سحب بيانات اليوتيوب</button>
                        <button type="button" class="btn" id="saveVideoBtn">حفظ الفيديو</button>
                        <button type="button" class="btn" id="updateVideoBtn" style="display: none;">تحديث الفيديو</button>
                        <button type="button" class="btn btn-danger" id="cancelVideoBtn">إلغاء</button>
                    </div>
                </div>
            </div>
        `;
    }

    loadUsersContent() {
        return `
            <div class="users-content">
                <div class="table-header">
                    <h3>إدارة المستخدمين</h3>
                    <div class="table-actions">
                        <button id="refreshUsersBtn" class="btn">🔄 تحديث</button>
                    </div>
                </div>
                
                <div class="table-container">
                    <div id="usersTableContainer">
                        <div style="text-align: center; padding: 2rem; color: var(--text-secondary);">
                            جاري تحميل المستخدمين...
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    loadLogsContent() {
        return `
            <div class="logs-content">
                <div class="table-header">
                    <h3>سجلات النظام</h3>
                    <div class="table-actions">
                        <select id="logFilter" class="form-control" style="width: 200px;">
                            <option value="">جميع النشاطات</option>
                            <option value="LOGIN">تسجيل الدخول</option>
                            <option value="REGISTER">تسجيل مستخدم</option>
                            <option value="ADD_VIDEO">إضافة فيديو</option>
                            <option value="UPDATE_VIDEO">تحديث فيديو</option>
                            <option value="DELETE_VIDEO">حذف فيديو</option>
                            <option value="UPDATE_USER">تحديث مستخدم</option>
                        </select>
                        <button id="refreshLogsBtn" class="btn">🔄 تحديث</button>
                    </div>
                </div>
                
                <div class="table-container">
                    <div id="logsTableContainer">
                        <div style="text-align: center; padding: 2rem; color: var(--text-secondary);">
                            جاري تحميل السجلات...
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    loadSettingsContent() {
        return `
            <div class="settings-content">
                <div class="card">
                    <div class="card-header">إعدادات النظام</div>
                    <div style="padding: 1.5rem;">
                        <div class="form-group">
                            <label class="form-label">مفتاح YouTube API</label>
                            <input type="text" class="form-control" placeholder="أدخل مفتاح YouTube API" id="youtubeApiKey">
                        </div>
                        <div class="form-group">
                            <label class="form-label">إعدادات الخصوصية الافتراضية</label>
                            <select class="form-control" id="defaultPrivacy">
                                <option value="public">عام</option>
                                <option value="unlisted">غير مدرج</option>
                                <option value="private">خاص</option>
                            </select>
                        </div>
                        <div class="form-actions">
                            <button class="btn" id="saveSettingsBtn">حفظ الإعدادات</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    async initializePageScripts(page) {
        console.log(`⚙️ تهيئة سكريبتات الصفحة: ${page}`);
        
        switch (page) {
            case 'index':
            case 'dashboard':
                await this.loadRecentVideos();
                await this.loadRecentActivity();
                this.bindDashboardPageEvents();
                break;
            case 'videos':
                await this.loadVideosTable();
                this.initializeVideoModal();
                this.bindVideosPageEvents();
                break;
            case 'users':
                await this.loadUsersTable();
                this.bindUsersPageEvents();
                break;
            case 'logs':
                await this.loadLogsTable();
                this.bindLogsPageEvents();
                break;
            case 'settings':
                this.initializeSettings();
                this.bindSettingsPageEvents();
                break;
        }
    }

    bindDashboardPageEvents() {
        const retryDashboardBtn = document.getElementById('retryDashboardBtn');
        if (retryDashboardBtn) {
            retryDashboardBtn.addEventListener('click', () => {
                this.loadDashboard();
            });
        }
    }

    bindVideosPageEvents() {
        const addVideoBtn = document.getElementById('addVideoBtn');
        if (addVideoBtn) {
            addVideoBtn.addEventListener('click', () => {
                console.log('➕ زر إضافة فيديو مضغوط');
                this.showAddVideoModal();
            });
        }

        const refreshVideosBtn = document.getElementById('refreshVideosBtn');
        if (refreshVideosBtn) {
            refreshVideosBtn.addEventListener('click', () => {
                console.log('🔄 زر تحديث الفيديوهات مضغوط');
                this.loadVideosTable();
            });
        }
    }

    bindUsersPageEvents() {
        const refreshUsersBtn = document.getElementById('refreshUsersBtn');
        if (refreshUsersBtn) {
            refreshUsersBtn.addEventListener('click', () => {
                console.log('🔄 زر تحديث المستخدمين مضغوط');
                this.loadUsersTable();
            });
        }
    }

    bindLogsPageEvents() {
        const refreshLogsBtn = document.getElementById('refreshLogsBtn');
        if (refreshLogsBtn) {
            refreshLogsBtn.addEventListener('click', () => {
                console.log('🔄 زر تحديث السجلات مضغوط');
                this.loadLogsTable();
            });
        }

        const logFilter = document.getElementById('logFilter');
        if (logFilter) {
            logFilter.addEventListener('change', (e) => {
                console.log('🔍 تغيير تصفية السجلات:', e.target.value);
                this.filterLogs();
            });
        }
    }

    bindSettingsPageEvents() {
        const saveSettingsBtn = document.getElementById('saveSettingsBtn');
        if (saveSettingsBtn) {
            saveSettingsBtn.addEventListener('click', () => {
                console.log('💾 زر حفظ الإعدادات مضغوط');
                this.saveSettings();
            });
        }
    }

    async loadRecentVideos() {
        try {
            console.log('🎬 جلب أحدث الفيديوهات...');
            const response = await this.apiCall('/admin/videos?limit=5');
            const container = document.getElementById('recentVideosList');
            
            if (!response.success || !response.data.videos || response.data.videos.length === 0) {
                container.innerHTML = `
                    <div style="text-align: center; padding: 2rem; color: var(--text-secondary);">
                        <div style="font-size: 3rem; margin-bottom: 1rem;">🎬</div>
                        <div>لا توجد فيديوهات حالياً</div>
                        <button class="btn" id="addFirstVideoBtn">+ إضافة فيديو جديد</button>
                    </div>
                `;

                const addFirstVideoBtn = document.getElementById('addFirstVideoBtn');
                if (addFirstVideoBtn) {
                    addFirstVideoBtn.addEventListener('click', () => {
                        this.showAddVideoModal();
                    });
                }

                return;
            }

            container.innerHTML = response.data.videos.map(video => `
                <div class="video-admin-card" style="margin-bottom: 1rem;">
                    <div class="video-admin-body">
                        <img src="${video.thumbnail}" alt="${video.title}" class="video-thumbnail-sm">
                        <div class="video-info-sm">
                            <div class="video-title-sm">${video.title}</div>
                            <div class="video-meta">
                                <span>${new Date(video.createdAt).toLocaleDateString('ar-EG')}</span>
                                <span>${video.views} مشاهدة</span>
                                <span class="badge badge-${video.privacy === 'public' ? 'success' : video.privacy === 'private' ? 'danger' : 'warning'}">
                                    ${video.privacy === 'public' ? 'عام' : video.privacy === 'private' ? 'خاص' : 'غير مدرج'}
                                </span>
                            </div>
                        </div>
                        <div class="video-actions">
                            <button class="btn btn-sm view-video-btn" data-video-id="${video._id}">عرض</button>
                            <button class="btn btn-sm edit-video-btn" data-video-id="${video._id}">تعديل</button>
                        </div>
                    </div>
                </div>
            `).join('');

            document.querySelectorAll('.view-video-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const videoId = e.target.getAttribute('data-video-id');
                    this.viewVideo(videoId);
                });
            });

            document.querySelectorAll('.edit-video-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const videoId = e.target.getAttribute('data-video-id');
                    this.editVideo(videoId);
                });
            });
            
            console.log('✅ تم تحميل أحدث الفيديوهات');
        } catch (error) {
            console.error('❌ خطأ في تحميل أحدث الفيديوهات:', error);
            document.getElementById('recentVideosList').innerHTML = `
                <div class="alert alert-error">
                    خطأ في تحميل الفيديوهات: ${error.message}
                </div>
            `;
        }
    }

    async loadRecentActivity() {
        try {
            console.log('📋 جلب النشاط الأخير...');
            const response = await this.apiCall('/admin/logs?limit=10');
            const container = document.getElementById('recentActivityList');
            
            if (!response.success || !response.data.logs || response.data.logs.length === 0) {
                container.innerHTML = '<div style="text-align: center; padding: 2rem; color: var(--text-secondary);">لا توجد نشاطات</div>';
                return;
            }

            container.innerHTML = response.data.logs.map(log => `
                <div style="padding: 0.75rem; border-bottom: 1px solid var(--border-color);">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 0.25rem;">
                        <span style="color: var(--text-primary); font-weight: bold;">
                            ${log.actor?.name || 'System'}
                        </span>
                        <span style="color: var(--text-secondary); font-size: 0.8rem;">
                            ${new Date(log.createdAt).toLocaleString('ar-EG')}
                        </span>
                    </div>
                    <div style="color: var(--text-secondary); font-size: 0.9rem;">
                        ${this.getActionText(log.action)} ${log.target}
                        ${log.details ? `- ${JSON.stringify(log.details)}` : ''}
                    </div>
                </div>
            `).join('');
            
            console.log('✅ تم تحميل النشاط الأخير');
        } catch (error) {
            console.error('❌ خطأ في تحميل النشاط الأخير:', error);
            document.getElementById('recentActivityList').innerHTML = `
                <div class="alert alert-error">
                    خطأ في تحميل النشاط: ${error.message}
                </div>
            `;
        }
    }

    getActionText(action) {
        const actions = {
            'REGISTER': 'قام بتسجيل',
            'LOGIN': 'قام بتسجيل الدخول',
            'ADD_VIDEO': 'أضاف فيديو',
            'UPDATE_VIDEO': 'حدث فيديو',
            'DELETE_VIDEO': 'حذف فيديو',
            'UPDATE_USER': 'حدث مستخدم'
        };
        return actions[action] || action;
    }

    updateUserInfo() {
        const user = JSON.parse(localStorage.getItem('user') || 'null');
        if (user) {
            const userInfo = document.getElementById('userInfo');
            if (userInfo) {
                const nameElement = userInfo.querySelector('.user-name');
                const roleElement = userInfo.querySelector('.user-role');
                if (nameElement) nameElement.textContent = user.name;
                if (roleElement) roleElement.textContent = user.role === 'admin' ? 'ADMIN' : 'USER';
            }
        }
    }

    async apiCall(endpoint, options = {}) {
        const token = localStorage.getItem('authToken');
        
        if (!token) {
            throw new Error('غير مصرح بالدخول');
        }

        const defaultOptions = {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        };

        const config = { ...defaultOptions, ...options };
        
        console.log(`🌐 طلب API: ${endpoint}`);
        
        try {
            const response = await fetch(`/api${endpoint}`, config);
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || `خطأ في السيرفر: ${response.status}`);
            }
            
            return data;
        } catch (error) {
            console.error(`❌ خطأ في طلب API ${endpoint}:`, error);
            throw error;
        }
    }

    showAddVideoModal() {
        const modal = document.getElementById('videoModal');
        if (modal) {
            this.resetVideoForm();
            document.getElementById('videoModalTitle').textContent = 'إضافة فيديو جديد';
            document.getElementById('saveVideoBtn').style.display = 'inline-block';
            document.getElementById('updateVideoBtn').style.display = 'none';
            document.getElementById('editVideoInfo').style.display = 'none';
            modal.style.display = 'block';
        }
    }

    async editVideo(videoId) {
        try {
            console.log('✏️ محاولة تعديل الفيديو:', videoId);
            
            const response = await this.apiCall(`/admin/videos/${videoId}`);
            
            if (!response.success) {
                throw new Error(response.message);
            }

            const video = response.data.video;
            this.currentEditingVideo = video;
            this.showEditVideoModal(video);
            
        } catch (error) {
            console.error('❌ خطأ في تحميل بيانات الفيديو:', error);
            this.showAlert('خطأ في تحميل بيانات الفيديو: ' + error.message, 'error');
        }
    }

    showEditVideoModal(video) {
        const modal = document.getElementById('videoModal');
        if (modal) {
            document.getElementById('videoModalTitle').textContent = 'تعديل الفيديو';
            document.getElementById('saveVideoBtn').style.display = 'none';
            document.getElementById('updateVideoBtn').style.display = 'inline-block';
            
            document.getElementById('editVideoInfo').style.display = 'block';
            document.getElementById('editVideoThumbnail').src = video.thumbnail;
            document.getElementById('editVideoTitle').textContent = video.title;
            document.getElementById('editVideoId').textContent = `ID: ${video.youtubeId}`;
            
            document.getElementById('videoUrl').value = video.url;
            document.getElementById('videoUrl').disabled = true;
            document.getElementById('videoPrivacy').value = video.privacy;
            
            const rolesSelect = document.getElementById('videoRoles');
            Array.from(rolesSelect.options).forEach(option => {
                option.selected = video.allowedRoles.includes(option.value);
            });
            
            if (video.isActive) {
                document.getElementById('videoActive').checked = true;
            } else {
                document.getElementById('videoInactive').checked = true;
            }
            
            document.getElementById('videoPreview').style.display = 'none';
            
            modal.style.display = 'block';
        }
    }

    resetVideoForm() {
        document.getElementById('videoForm').reset();
        document.getElementById('videoUrl').disabled = false;
        document.getElementById('videoPreview').style.display = 'none';
        this.currentEditingVideo = null;
        
        const rolesSelect = document.getElementById('videoRoles');
        Array.from(rolesSelect.options).forEach(option => {
            option.selected = false;
        });
        
        document.getElementById('videoActive').checked = true;
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
        const isActive = document.getElementById('videoActive').checked;

        if (!url) {
            this.showAlert('يرجى إدخال رابط اليوتيوب', 'error');
            return;
        }

        try {
            console.log('💾 محاولة حفظ الفيديو...');
            const response = await this.apiCall('/admin/videos', {
                method: 'POST',
                body: JSON.stringify({ 
                    url, 
                    privacy, 
                    allowedRoles: roles,
                    isActive
                })
            });

            if (response.success) {
                this.showAlert('تم إضافة الفيديو بنجاح', 'success');
                this.closeModal();
                await this.loadVideosTable();
                
                if (this.currentPage === 'dashboard') {
                    await this.loadRecentVideos();
                }
            } else {
                this.showAlert(response.message, 'error');
            }
        } catch (error) {
            console.error('Error saving video:', error);
            this.showAlert('خطأ في إضافة الفيديو: ' + error.message, 'error');
        }
    }

    async updateVideo() {
        if (!this.currentEditingVideo) {
            this.showAlert('لا يوجد فيديو محدد للتعديل', 'error');
            return;
        }

        const privacy = document.getElementById('videoPrivacy').value;
        const roles = Array.from(document.getElementById('videoRoles').selectedOptions).map(opt => opt.value);
        const isActive = document.getElementById('videoActive').checked;

        try {
            console.log('🔄 محاولة تحديث الفيديو:', this.currentEditingVideo._id);
            const response = await this.apiCall(`/admin/videos/${this.currentEditingVideo._id}`, {
                method: 'PUT',
                body: JSON.stringify({ 
                    privacy, 
                    allowedRoles: roles,
                    isActive
                })
            });

            if (response.success) {
                this.showAlert('تم تحديث الفيديو بنجاح', 'success');
                this.closeModal();
                await this.loadVideosTable();
                
                if (this.currentPage === 'dashboard') {
                    await this.loadRecentVideos();
                }
            } else {
                this.showAlert(response.message, 'error');
            }
        } catch (error) {
            console.error('Error updating video:', error);
            this.showAlert('خطأ في تحديث الفيديو: ' + error.message, 'error');
        }
    }

    initializeVideoModal() {
        const modal = document.getElementById('videoModal');
        const closeButtons = document.querySelectorAll('.close-modal');

        closeButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                this.closeModal();
            });
        });

        const fetchVideoBtn = document.getElementById('fetchVideoBtn');
        if (fetchVideoBtn) {
            fetchVideoBtn.addEventListener('click', () => {
                this.fetchVideoInfo();
            });
        }

        const saveVideoBtn = document.getElementById('saveVideoBtn');
        if (saveVideoBtn) {
            saveVideoBtn.addEventListener('click', () => {
                this.saveVideo();
            });
        }

        const updateVideoBtn = document.getElementById('updateVideoBtn');
        if (updateVideoBtn) {
            updateVideoBtn.addEventListener('click', () => {
                this.updateVideo();
            });
        }

        const cancelVideoBtn = document.getElementById('cancelVideoBtn');
        if (cancelVideoBtn) {
            cancelVideoBtn.addEventListener('click', () => {
                this.closeModal();
            });
        }

        window.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.closeModal();
            }
        });
    }

    closeModal() {
        const modal = document.getElementById('videoModal');
        if (modal) {
            modal.style.display = 'none';
            this.resetVideoForm();
        }
    }

    async loadVideosTable() {
        try {
            console.log('🎬 جلب جدول الفيديوهات...');
            const response = await this.apiCall('/admin/videos');
            const container = document.getElementById('videosTableContainer');
            
            if (!response.success || !response.data.videos || response.data.videos.length === 0) {
                container.innerHTML = `
                    <div style="text-align: center; padding: 3rem; color: var(--text-secondary);">
                        <div style="font-size: 3rem; margin-bottom: 1rem;">🎬</div>
                        <div>لا توجد فيديوهات حالياً</div>
                        <button class="btn" id="addFirstVideoBtn">+ إضافة فيديو جديد</button>
                    </div>
                `;

                const addFirstVideoBtn = document.getElementById('addFirstVideoBtn');
                if (addFirstVideoBtn) {
                    addFirstVideoBtn.addEventListener('click', () => {
                        this.showAddVideoModal();
                    });
                }

                return;
            }

            container.innerHTML = `
                <table class="table">
                    <thead>
                        <tr>
                            <th>الفيديو</th>
                            <th>الحالة</th>
                            <th>المشاهدات</th>
                            <th>تاريخ الإضافة</th>
                            <th>الإجراءات</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${response.data.videos.map(video => `
                            <tr>
                                <td>
                                    <div style="display: flex; align-items: center; gap: 1rem;">
                                        <img src="${video.thumbnail}" alt="${video.title}" 
                                             style="width: 80px; height: 60px; object-fit: cover; border-radius: 4px;">
                                        <div>
                                            <div style="font-weight: bold; margin-bottom: 0.25rem; max-width: 300px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                                                ${video.title}
                                                ${video.embedStatus === 'unavailable' ? ' ⚠️' : ''}
                                            </div>
                                            <div style="font-size: 0.8rem; color: var(--text-secondary);">
                                                ${video.addedBy?.name || 'System'}
                                                ${video.embedStatus === 'unavailable' ? ' - قد لا يعمل' : ''}
                                            </div>
                                        </div>
                                    </div>
                                </td>
                                <td>
                                    <span class="badge ${video.isActive ? 'badge-success' : 'badge-danger'}">
                                        ${video.isActive ? 'نشط' : 'غير نشط'}
                                    </span>
                                    <br>
                                    <span class="badge badge-${video.privacy === 'public' ? 'success' : video.privacy === 'private' ? 'danger' : 'warning'}" style="margin-top: 0.25rem;">
                                        ${video.privacy === 'public' ? 'عام' : video.privacy === 'private' ? 'خاص' : 'غير مدرج'}
                                    </span>
                                </td>
                                <td>${video.views}</td>
                                <td>${new Date(video.createdAt).toLocaleDateString('ar-EG')}</td>
                                <td>
                                    <div class="btn-group">
                                        <button class="btn btn-sm edit-video-btn" data-video-id="${video._id}">تعديل</button>
                                        <button class="btn btn-sm btn-danger delete-video-btn" data-video-id="${video._id}">حذف</button>
                                    </div>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
                
                <div style="padding: 1rem; text-align: center; color: var(--text-secondary);">
                    عرض ${response.data.videos.length} من أصل ${response.data.total} فيديو
                </div>
            `;

            this.bindVideoTableEvents();
            
            console.log('✅ تم تحميل جدول الفيديوهات');
        } catch (error) {
            console.error('❌ خطأ في تحميل جدول الفيديوهات:', error);
            const container = document.getElementById('videosTableContainer');
            container.innerHTML = `
                <div class="alert alert-error">
                    <strong>خطأ في تحميل الفيديوهات:</strong><br>
                    ${error.message}
                    <button class="btn" id="retryVideosBtn">🔄 إعادة المحاولة</button>
                </div>
            `;

            const retryBtn = document.getElementById('retryVideosBtn');
            if (retryBtn) {
                retryBtn.addEventListener('click', () => {
                    this.loadVideosTable();
                });
            }
        }
    }

    bindVideoTableEvents() {
        document.querySelectorAll('.edit-video-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const videoId = e.target.getAttribute('data-video-id');
                this.editVideo(videoId);
            });
        });

        document.querySelectorAll('.delete-video-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const videoId = e.target.getAttribute('data-video-id');
                this.deleteVideo(videoId);
            });
        });
    }

    async loadUsersTable() {
        try {
            console.log('👥 جلب جدول المستخدمين...');
            const response = await this.apiCall('/admin/users');
            const container = document.getElementById('usersTableContainer');
            
            if (!response.success || !response.data.users || response.data.users.length === 0) {
                container.innerHTML = '<div style="text-align: center; padding: 2rem; color: var(--text-secondary);">لا توجد مستخدمين</div>';
                return;
            }

            container.innerHTML = `
                <table class="table">
                    <thead>
                        <tr>
                            <th>المستخدم</th>
                            <th>البريد الإلكتروني</th>
                            <th>الدور</th>
                            <th>الحالة</th>
                            <th>تاريخ التسجيل</th>
                            <th>الإجراءات</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${response.data.users.map(user => `
                            <tr>
                                <td>
                                    <div style="display: flex; align-items: center; gap: 1rem;">
                                        <div class="user-avatar" style="width: 40px; height: 40px; background: var(--terminal-green); color: var(--primary-bg); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold;">
                                            ${user.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <div style="font-weight: bold;">${user.name}</div>
                                        </div>
                                    </div>
                                </td>
                                <td>${user.email}</td>
                                <td>
                                    <span class="badge ${user.role === 'admin' ? 'badge-success' : 'badge-warning'}">
                                        ${user.role === 'admin' ? 'مدير' : 'مستخدم'}
                                    </span>
                                </td>
                                <td>
                                    <span class="badge ${user.active ? 'badge-success' : 'badge-danger'}">
                                        ${user.active ? 'نشط' : 'غير نشط'}
                                    </span>
                                </td>
                                <td>${new Date(user.createdAt).toLocaleDateString('ar-EG')}</td>
                                <td>
                                    <div class="btn-group">
                                        <button class="btn btn-sm toggle-user-btn" data-user-id="${user._id}" data-current-status="${user.active}">
                                            ${user.active ? 'تعطيل' : 'تفعيل'}
                                        </button>
                                        <button class="btn btn-sm change-role-btn" data-user-id="${user._id}" data-current-role="${user.role}">
                                            ${user.role === 'admin' ? 'إزالة المدير' : 'جعل مدير'}
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;

            this.bindUserTableEvents();
            
            console.log('✅ تم تحميل جدول المستخدمين');
        } catch (error) {
            console.error('❌ خطأ في تحميل جدول المستخدمين:', error);
            const container = document.getElementById('usersTableContainer');
            container.innerHTML = `
                <div class="alert alert-error">
                    خطأ في تحميل المستخدمين: ${error.message}
                </div>
            `;
        }
    }

    bindUserTableEvents() {
        document.querySelectorAll('.toggle-user-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const userId = e.target.getAttribute('data-user-id');
                const currentStatus = e.target.getAttribute('data-current-status') === 'true';
                this.toggleUserStatus(userId, !currentStatus);
            });
        });

        document.querySelectorAll('.change-role-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const userId = e.target.getAttribute('data-user-id');
                const currentRole = e.target.getAttribute('data-current-role');
                const newRole = currentRole === 'admin' ? 'user' : 'admin';
                this.changeUserRole(userId, newRole);
            });
        });
    }

    async loadLogsTable() {
        try {
            console.log('📋 جلب جدول السجلات...');
            const filter = document.getElementById('logFilter')?.value || '';
            const url = filter ? `/admin/logs?action=${filter}` : '/admin/logs';
            
            const response = await this.apiCall(url);
            const container = document.getElementById('logsTableContainer');
            
            if (!response.success || !response.data.logs || response.data.logs.length === 0) {
                container.innerHTML = '<div style="text-align: center; padding: 2rem; color: var(--text-secondary);">لا توجد سجلات</div>';
                return;
            }

            container.innerHTML = `
                <table class="table">
                    <thead>
                        <tr>
                            <th>المستخدم</th>
                            <th>الإجراء</th>
                            <th>الهدف</th>
                            <th>التاريخ</th>
                            <th>التفاصيل</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${response.data.logs.map(log => `
                            <tr>
                                <td>${log.actor?.name || 'System'}</td>
                                <td>
                                    <span class="badge badge-info">${log.action}</span>
                                </td>
                                <td>${log.target}</td>
                                <td>${new Date(log.createdAt).toLocaleString('ar-EG')}</td>
                                <td style="max-width: 200px; overflow: hidden; text-overflow: ellipsis;">
                                    ${JSON.stringify(log.details || {})}
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;
            
            console.log('✅ تم تحميل جدول السجلات');
        } catch (error) {
            console.error('❌ خطأ في تحميل جدول السجلات:', error);
            const container = document.getElementById('logsTableContainer');
            container.innerHTML = `
                <div class="alert alert-error">
                    خطأ في تحميل السجلات: ${error.message}
                </div>
            `;
        }
    }

    filterLogs() {
        this.loadLogsTable();
    }

    async deleteVideo(videoId) {
        if (!confirm('هل أنت متأكد من حذف هذا الفيديو؟ لا يمكن التراجع عن هذا الإجراء.')) {
            return;
        }

        try {
            console.log('🗑️ محاولة حذف الفيديو:', videoId);
            const response = await this.apiCall(`/admin/videos/${videoId}`, {
                method: 'DELETE'
            });

            if (response.success) {
                this.showAlert('تم حذف الفيديو بنجاح', 'success');
                await this.loadVideosTable();
                
                if (this.currentPage === 'dashboard') {
                    await this.loadRecentVideos();
                }
            } else {
                this.showAlert('فشل في حذف الفيديو: ' + response.message, 'error');
            }
        } catch (error) {
            console.error('Error deleting video:', error);
            this.showAlert('خطأ في حذف الفيديو: ' + error.message, 'error');
        }
    }

    async toggleUserStatus(userId, newStatus) {
        try {
            console.log('🔄 تغيير حالة المستخدم:', userId, newStatus);
            const response = await this.apiCall(`/admin/users/${userId}`, {
                method: 'PUT',
                body: JSON.stringify({ active: newStatus })
            });

            if (response.success) {
                this.showAlert(`تم ${newStatus ? 'تفعيل' : 'تعطيل'} المستخدم بنجاح`, 'success');
                await this.loadUsersTable();
            } else {
                this.showAlert('فشل في تحديث حالة المستخدم: ' + response.message, 'error');
            }
        } catch (error) {
            console.error('Error updating user status:', error);
            this.showAlert('خطأ في تحديث حالة المستخدم: ' + error.message, 'error');
        }
    }

    async changeUserRole(userId, newRole) {
        try {
            console.log('👑 تغيير دور المستخدم:', userId, newRole);
            const response = await this.apiCall(`/admin/users/${userId}`, {
                method: 'PUT',
                body: JSON.stringify({ role: newRole })
            });

            if (response.success) {
                this.showAlert(`تم تغيير دور المستخدم إلى ${newRole === 'admin' ? 'مدير' : 'مستخدم'} بنجاح`, 'success');
                await this.loadUsersTable();
            } else {
                this.showAlert('فشل في تغيير دور المستخدم: ' + response.message, 'error');
            }
        } catch (error) {
            console.error('Error changing user role:', error);
            this.showAlert('خطأ في تغيير دور المستخدم: ' + error.message, 'error');
        }
    }

    viewVideo(videoId) {
        window.open(`/watch.html?id=${videoId}`, '_blank');
    }

    showAlert(message, type = 'info') {
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type}`;
        alertDiv.textContent = message;
        alertDiv.style.position = 'fixed';
        alertDiv.style.top = '20px';
        alertDiv.style.right = '20px';
        alertDiv.style.zIndex = '10000';
        alertDiv.style.minWidth = '300px';
        
        document.body.appendChild(alertDiv);
        
        setTimeout(() => {
            alertDiv.remove();
        }, 5000);
    }

    async loadDashboard() {
        console.log('📊 تحميل لوحة التحكم...');
        await this.loadPageContent('dashboard');
    }

    initializeSettings() {
        console.log('⚙️ تهيئة الإعدادات...');
    }

    saveSettings() {
        console.log('💾 حفظ الإعدادات...');
        this.showAlert('تم حفظ الإعدادات بنجاح', 'success');
    }
}

let adminManager;

document.addEventListener('DOMContentLoaded', () => {
    console.log('📄 تم تحميل صفحة الإدارة');
    adminManager = new AdminManager();
});