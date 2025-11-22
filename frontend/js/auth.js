// auth.js - إدارة المصادقة المتقدمة مع دعم الأدوار
class AuthManager {
    constructor() {
        this.token = localStorage.getItem('authToken');
        this.user = JSON.parse(localStorage.getItem('user') || 'null');
        this.init();
    }

    // التهيئة
    init() {
        this.setupEventListeners();
        this.updateUIBasedOnAuth();
        this.handleRoleBasedRedirect();
    }

    // التعامل مع إعادة التوجيه بناءً على الدور
    handleRoleBasedRedirect() {
        // إذا كان المستخدم مسجل دخول وتحققنا من الدور
        if (this.isAuthenticated()) {
            const currentPage = window.location.pathname;
            
            // إذا كان المستخدم أدمن وهو في الصفحة الرئيسية، قم بتوجيهه إلى لوحة التحكم
            if (this.isAdmin() && (currentPage === '/' || currentPage === '/index.html')) {
                setTimeout(() => {
                    window.location.href = '/admin/index.html';
                }, 100);
            }
            
            // إذا كان المستخدم عادي وهو في لوحة التحكم، قم بتوجيهه للصفحة الرئيسية
            if (!this.isAdmin() && currentPage.includes('/admin/')) {
                setTimeout(() => {
                    window.location.href = '/';
                }, 100);
            }
        }
    }

    // إعداد مستمعي الأحداث
    setupEventListeners() {
        // تحديث الواجهة عند تغيير التخزين المحلي
        window.addEventListener('storage', (e) => {
            if (e.key === 'authToken' || e.key === 'user') {
                this.token = localStorage.getItem('authToken');
                this.user = JSON.parse(localStorage.getItem('user') || 'null');
                this.updateUIBasedOnAuth();
                this.handleRoleBasedRedirect();
            }
        });
    }

    // التحقق من حالة تسجيل الدخول
    isAuthenticated() {
        if (!this.token || !this.user) {
            return false;
        }

        // التحقق من انتهاء صلاحية التوكن (إذا كان هناك وقت انتهاء)
        if (this.user.expiresAt && new Date() > new Date(this.user.expiresAt)) {
            this.logout();
            return false;
        }

        return true;
    }

    // الحصول على معلومات المستخدم
    getUser() {
        return this.user;
    }

    // الحصول على التوكن
    getToken() {
        return this.token;
    }

    // تسجيل الدخول
    async login(email, password) {
        try {
            // إظهار حالة التحميل
            this.showLoadingState(true);

            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            // إخفاء حالة التحميل
            this.showLoadingState(false);

            if (data.success) {
                this.token = data.data.token;
                this.user = data.data.user;
                
                // حفظ في localStorage
                localStorage.setItem('authToken', this.token);
                localStorage.setItem('user', JSON.stringify(this.user));
                
                // تسجيل النشاط
                this.logActivity('LOGIN', `تسجيل دخول المستخدم ${this.user.name}`);
                
                // تحديث الواجهة
                this.updateUIBasedOnAuth();
                
                // إعادة التوجيه بناءً على الدور
                this.redirectBasedOnRole();
                
                return { 
                    success: true, 
                    user: this.user,
                    message: 'تم تسجيل الدخول بنجاح'
                };
            } else {
                return { 
                    success: false, 
                    message: data.message || 'فشل في تسجيل الدخول'
                };
            }
        } catch (error) {
            console.error('Login error:', error);
            this.showLoadingState(false);
            return { 
                success: false, 
                message: 'خطأ في الاتصال بالسيرفر' 
            };
        }
    }

    // إعادة التوجيه بناءً على دور المستخدم
    redirectBasedOnRole() {
        const redirectUrl = this.getRedirectAfterLogin();
        
        // إذا كان هناك URL محدد للعودة، استخدمه
        if (redirectUrl && redirectUrl !== '/') {
            setTimeout(() => {
                window.location.href = redirectUrl;
            }, 1000);
            return;
        }
        
        // إذا لم يكن هناك URL محدد، قم بالتوجيه بناءً على الدور
        setTimeout(() => {
            if (this.isAdmin()) {
                window.location.href = '/admin/index.html';
            } else {
                window.location.href = '/';
            }
        }, 1000);
    }

    // تسجيل الخروج
    async logout() {
        try {
            // إرسال طلب تسجيل الخروج إلى السيرفر
            if (this.token) {
                await fetch('/api/auth/logout', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${this.token}`,
                        'Content-Type': 'application/json'
                    }
                }).catch(err => {
                    console.log('Logout API call failed, continuing with client-side logout');
                });
            }

            // تسجيل النشاط
            this.logActivity('LOGOUT', `تسجيل خروج المستخدم ${this.user?.name || 'غير معروف'}`);

            // مسح البيانات المحلية
            this.token = null;
            this.user = null;
            localStorage.removeItem('authToken');
            localStorage.removeItem('user');

            // تحديث الواجهة
            this.updateUIBasedOnAuth();

            // إعادة التوجيه للصفحة الرئيسية
            window.location.href = '/';

        } catch (error) {
            console.error('Logout error:', error);
            // استمرار في تسجيل الخروج محلياً
            this.token = null;
            this.user = null;
            localStorage.removeItem('authToken');
            localStorage.removeItem('user');
            window.location.href = '/';
        }
    }

    // التسجيل
    async register(name, email, password) {
        try {
            // إظهار حالة التحميل
            this.showLoadingState(true);

            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ name, email, password })
            });

            const data = await response.json();

            // إخفاء حالة التحميل
            this.showLoadingState(false);

            if (data.success) {
                return { 
                    success: true, 
                    message: 'تم إنشاء الحساب بنجاح',
                    user: data.data.user
                };
            } else {
                return { 
                    success: false, 
                    message: data.message || 'فشل في إنشاء الحساب'
                };
            }
        } catch (error) {
            console.error('Registration error:', error);
            this.showLoadingState(false);
            return { 
                success: false, 
                message: 'خطأ في الاتصال بالسيرفر' 
            };
        }
    }

    // تحديث بيانات المستخدم
    updateUser(userData) {
        this.user = { ...this.user, ...userData };
        localStorage.setItem('user', JSON.stringify(this.user));
        this.updateUIBasedOnAuth();
    }

    // التحقق من الصلاحيات
    hasRole(role) {
        return this.user && this.user.role === role;
    }

    // التحقق من الصلاحيات الإدارية
    isAdmin() {
        return this.hasRole('admin');
    }

    // التحقق من صلاحيات المستخدم العادي
    isUser() {
        return this.hasRole('user');
    }

    // تحديث واجهة المستخدم بناءً على حالة المصادقة
    updateUIBasedOnAuth() {
        const isAuthenticated = this.isAuthenticated();
        const user = this.getUser();

        // تحديث عناصر التحكم في المصادقة
        this.updateAuthButtons(isAuthenticated, user);
        
        // تحديث عرض المحتوى بناءً على المصادقة
        this.updateContentVisibility(isAuthenticated);
        
        // تحديث معلومات المستخدم في الواجهة
        this.updateUserInfo(user);

        // إضافة روابط إدارية للمسؤولين
        this.updateAdminLinks(isAuthenticated && this.isAdmin());
    }

    // تحديث أزرار المصادقة
    updateAuthButtons(isAuthenticated, user) {
        const authButtonsContainers = document.querySelectorAll('#authButtons, [data-auth-buttons]');
        
        authButtonsContainers.forEach(container => {
            if (isAuthenticated && user) {
                let adminBadge = '';
                if (this.isAdmin()) {
                    adminBadge = '<span class="badge badge-success" style="margin-right: 0.5rem;">مدير</span>';
                }
                
                container.innerHTML = `
                    <div style="display: flex; align-items: center; gap: 1rem;">
                        ${adminBadge}
                        <span style="color: var(--text-secondary); font-size: 0.9rem;">
                            <i class="fas fa-user"></i> ${user.name}
                        </span>
                        <button class="btn btn-danger btn-sm" onclick="authManager.logout()">
                            <i class="fas fa-sign-out-alt"></i>
                            تسجيل الخروج
                        </button>
                    </div>
                `;
            } else {
                container.innerHTML = `
                    <div style="display: flex; align-items: center; gap: 0.75rem;">
                        <a href="/login.html" class="nav-link">
                            <i class="fas fa-sign-in-alt"></i>
                            تسجيل الدخول
                        </a>
                        <a href="/register.html" class="nav-link">
                            <i class="fas fa-user-plus"></i>
                            إنشاء حساب
                        </a>
                    </div>
                `;
            }
        });
    }

    // تحديث روابط الإدارة للمسؤولين
    updateAdminLinks(isAdmin) {
        const adminLinksContainers = document.querySelectorAll('[data-admin-links]');
        
        adminLinksContainers.forEach(container => {
            if (isAdmin) {
                container.innerHTML = `
                    <a href="/admin/index.html" class="nav-link" style="color: var(--success);">
                        <i class="fas fa-cog"></i>
                        لوحة التحكم
                    </a>
                `;
            } else {
                container.innerHTML = '';
            }
        });
    }

    // تحديث عرض المحتوى بناءً على المصادقة
    updateContentVisibility(isAuthenticated) {
        // العناصر التي تظهر فقط للمستخدمين المسجلين
        const authenticatedElements = document.querySelectorAll('[data-auth="authenticated"]');
        authenticatedElements.forEach(el => {
            el.style.display = isAuthenticated ? '' : 'none';
        });

        // العناصر التي تظهر فقط للزوار
        const guestElements = document.querySelectorAll('[data-auth="guest"]');
        guestElements.forEach(el => {
            el.style.display = isAuthenticated ? 'none' : '';
        });

        // العناصر التي تظهر فقط للمسؤولين
        const adminElements = document.querySelectorAll('[data-auth="admin"]');
        adminElements.forEach(el => {
            el.style.display = this.isAdmin() ? '' : 'none';
        });

        // العناصر التي تظهر فقط للمستخدمين العاديين
        const userElements = document.querySelectorAll('[data-auth="user"]');
        userElements.forEach(el => {
            el.style.display = this.isUser() ? '' : 'none';
        });
    }

    // تحديث معلومات المستخدم في الواجهة
    updateUserInfo(user) {
        const userInfoElements = document.querySelectorAll('[data-user-info]');
        
        userInfoElements.forEach(element => {
            const infoType = element.getAttribute('data-user-info');
            
            if (user) {
                switch (infoType) {
                    case 'name':
                        element.textContent = user.name;
                        break;
                    case 'email':
                        element.textContent = user.email;
                        break;
                    case 'role':
                        element.textContent = user.role === 'admin' ? 'مدير' : 'مستخدم';
                        break;
                    case 'avatar':
                        element.textContent = user.name.charAt(0).toUpperCase();
                        break;
                    case 'role-badge':
                        if (user.role === 'admin') {
                            element.innerHTML = '<span class="badge badge-success">مدير</span>';
                        } else {
                            element.innerHTML = '<span class="badge badge-info">مستخدم</span>';
                        }
                        break;
                }
            } else {
                element.textContent = '';
            }
        });
    }

    // إظهار/إخفاء حالة التحميل
    showLoadingState(show) {
        const loadingElements = document.querySelectorAll('[data-loading]');
        
        loadingElements.forEach(element => {
            const loadingType = element.getAttribute('data-loading');
            
            if (loadingType === 'show-when-loading') {
                element.style.display = show ? '' : 'none';
            } else if (loadingType === 'hide-when-loading') {
                element.style.display = show ? 'none' : '';
            }
        });
    }

    // تسجيل النشاط
    logActivity(action, description) {
        console.log(`Activity: ${action} - ${description}`);
        
        if (this.token) {
            fetch('/api/activity/log', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    action,
                    description,
                    timestamp: new Date().toISOString()
                })
            }).catch(err => {
                console.log('Failed to log activity:', err);
            });
        }
    }

    // تجديد التوكن
    async refreshToken() {
        if (!this.token) return false;

        try {
            const response = await fetch('/api/auth/refresh', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    this.token = data.data.token;
                    localStorage.setItem('authToken', this.token);
                    return true;
                }
            }
        } catch (error) {
            console.error('Token refresh failed:', error);
        }

        return false;
    }

    // التحقق من صحة التوكن
    async validateToken() {
        if (!this.token) return false;

        try {
            const response = await fetch('/api/auth/validate', {
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json'
                }
            });

            return response.ok;
        } catch (error) {
            console.error('Token validation failed:', error);
            return false;
        }
    }

    // إعادة توجيه إذا لم يكن المستخدم مسجل الدخول
    requireAuth(redirectUrl = '/login.html') {
        if (!this.isAuthenticated()) {
            sessionStorage.setItem('redirectAfterLogin', window.location.href);
            window.location.href = redirectUrl;
            return false;
        }
        return true;
    }

    // إعادة توجيه إذا لم يكن المستخدم مسؤولاً
    requireAdmin(redirectUrl = '/') {
        if (!this.isAuthenticated() || !this.isAdmin()) {
            showAlert('غير مسموح لك بالوصول إلى هذه الصفحة', 'error');
            window.location.href = redirectUrl;
            return false;
        }
        return true;
    }

    // إعادة توجيه إذا كان المستخدم مسجل الدخول بالفعل
    requireGuest(redirectUrl = '/') {
        if (this.isAuthenticated()) {
            // إذا كان المستخدم مسؤولاً، قم بتوجيهه إلى لوحة التحكم
            if (this.isAdmin()) {
                window.location.href = '/admin/index.html';
            } else {
                window.location.href = redirectUrl;
            }
            return false;
        }
        return true;
    }

    // الحصول على الصفحة للعودة بعد التسجيل
    getRedirectAfterLogin() {
        const redirectUrl = sessionStorage.getItem('redirectAfterLogin') || '/';
        sessionStorage.removeItem('redirectAfterLogin');
        return redirectUrl;
    }
}

// إنشاء instance عام من مدير المصادقة
const authManager = new AuthManager();

// التهيئة عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', function() {
    // تحديث الواجهة بناءً على حالة المصادقة
    authManager.updateUIBasedOnAuth();
    
    // إضافة مستمعي الأحداث للنماذج
    setupAuthForms();
});

// إعداد نماذج المصادقة
function setupAuthForms() {
    // نموذج تسجيل الدخول
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            
            // إظهار حالة التحميل
            const submitBtn = loginForm.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري تسجيل الدخول...';
            submitBtn.disabled = true;
            
            const result = await authManager.login(email, password);
            
            if (result.success) {
                showAlert('تم تسجيل الدخول بنجاح! جاري التوجيه...', 'success');
                // لا حاجة للتوجيه هنا لأنه يتم في authManager.login()
            } else {
                showAlert(result.message, 'error');
                // إعادة تعيين زر الإرسال
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
            }
        });
    }

    // نموذج التسجيل
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const name = document.getElementById('name').value;
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const confirmPassword = document.getElementById('confirmPassword').value;
            
            // التحقق من تطابق كلمات المرور
            if (password !== confirmPassword) {
                showAlert('كلمات المرور غير متطابقة', 'error');
                return;
            }
            
            // إظهار حالة التحميل
            const submitBtn = registerForm.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري إنشاء الحساب...';
            submitBtn.disabled = true;
            
            const result = await authManager.register(name, email, password);
            
            if (result.success) {
                showAlert('تم إنشاء الحساب بنجاح! جاري تحويلك لصفحة تسجيل الدخول...', 'success');
                
                // التوجيه لصفحة تسجيل الدخول بعد تأخير
                setTimeout(() => {
                    window.location.href = '/login.html';
                }, 2000);
            } else {
                showAlert(result.message, 'error');
                // إعادة تعيين زر الإرسال
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
            }
        });
    }
}

// دالة مساعدة لعرض التنبيهات
function showAlert(message, type = 'info') {
    let alertContainer = document.getElementById('alertContainer');
    
    if (!alertContainer) {
        alertContainer = document.createElement('div');
        alertContainer.id = 'alertContainer';
        alertContainer.style.position = 'fixed';
        alertContainer.style.top = '20px';
        alertContainer.style.right = '20px';
        alertContainer.style.zIndex = '10000';
        alertContainer.style.maxWidth = '400px';
        document.body.appendChild(alertContainer);
    }
    
    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    alert.style.marginBottom = '10px';
    alert.style.animation = 'slideInRight 0.3s ease';
    alert.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: space-between;">
            <div style="display: flex; align-items: center; gap: 0.75rem;">
                <i class="fas ${
                    type === 'success' ? 'fa-check-circle' :
                    type === 'error' ? 'fa-exclamation-circle' :
                    type === 'warning' ? 'fa-exclamation-triangle' : 'fa-info-circle'
                }"></i>
                <span>${message}</span>
            </div>
            <button onclick="this.parentElement.parentElement.remove()" style="background: none; border: none; color: inherit; cursor: pointer;">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;
    
    alertContainer.appendChild(alert);
    
    setTimeout(() => {
        if (alert.parentElement) {
            alert.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => {
                if (alert.parentElement) {
                    alert.remove();
                }
            }, 300);
        }
    }, 5000);
}

// إضافة أنيميشن للتنبيهات
if (!document.querySelector('#alertAnimations')) {
    const style = document.createElement('style');
    style.id = 'alertAnimations';
    style.textContent = `
        @keyframes slideInRight {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
        
        @keyframes slideOutRight {
            from {
                transform: translateX(0);
                opacity: 1;
            }
            to {
                transform: translateX(100%);
                opacity: 0;
            }
        }

        .badge {
            display: inline-block;
            padding: 0.25rem 0.5rem;
            border-radius: 4px;
            font-size: 0.75rem;
            font-weight: 600;
        }

        .badge-success {
            background: rgba(16, 185, 129, 0.1);
            color: var(--success);
            border: 1px solid rgba(16, 185, 129, 0.3);
        }

        .badge-info {
            background: rgba(59, 130, 246, 0.1);
            color: var(--accent-color);
            border: 1px solid rgba(59, 130, 246, 0.3);
        }
    `;
    document.head.appendChild(style);
}

// جعل المدير متاحاً globally
window.authManager = authManager;
window.showAlert = showAlert;