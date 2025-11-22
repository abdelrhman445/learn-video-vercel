class TerminalManager {
    constructor() {
        this.terminalContent = document.getElementById('terminalContent');
        this.isCollapsed = false;
        this.init();
    }

    init() {
        this.bindEvents();
        this.addSystemMessage('تهيئة نظام المراقبة...');
        this.loadInitialLogs();
    }

    bindEvents() {
        const toggleBtn = document.getElementById('toggleTerminal');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => this.toggleTerminal());
        }

        // زر تحديث الترمينال
        const refreshBtn = document.getElementById('refreshTerminal');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                this.refreshTerminal();
            });
        }
    }

    toggleTerminal() {
        const terminal = document.querySelector('.floating-terminal');
        this.isCollapsed = !this.isCollapsed;
        
        if (this.isCollapsed) {
            terminal.classList.add('collapsed');
        } else {
            terminal.classList.remove('collapsed');
        }
    }

    async loadInitialLogs() {
        try {
            const token = localStorage.getItem('authToken');
            if (!token) return;

            const response = await fetch('/api/admin/logs?limit=5', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success && data.data.logs) {
                    this.displayLogs(data.data.logs);
                }
            }
        } catch (error) {
            console.error('Error loading terminal logs:', error);
            this.addSystemMessage('خطأ في تحميل سجلات النظام', 'error');
        }
    }

    displayLogs(logs) {
        if (!this.terminalContent) return;

        // مسح المحتوى القديم
        this.terminalContent.innerHTML = '';

        if (logs.length === 0) {
            this.addSystemMessage('لا توجد سجلات حالياً');
            return;
        }

        logs.forEach(log => {
            this.addLogMessage(log);
        });
    }

    addLogMessage(log) {
        if (!this.terminalContent) return;

        const line = document.createElement('div');
        line.className = 'terminal-line';
        
        const timestamp = new Date(log.createdAt).toLocaleTimeString('ar-EG');
        const type = this.getLogType(log.action);
        const color = this.getLogColor(log.action);

        line.innerHTML = `
            <span class="terminal-prompt" style="color: ${color};">[${type}]</span>
            [${timestamp}] ${log.actor?.name || 'System'} - ${this.getActionText(log.action)} ${log.target}
        `;

        this.terminalContent.appendChild(line);
        this.terminalContent.scrollTop = this.terminalContent.scrollHeight;
    }

    getLogType(action) {
        const types = {
            'LOGIN': 'AUTH',
            'REGISTER': 'AUTH', 
            'ADD_VIDEO': 'VIDEO',
            'UPDATE_VIDEO': 'VIDEO',
            'DELETE_VIDEO': 'VIDEO',
            'UPDATE_USER': 'USER'
        };
        return types[action] || 'INFO';
    }

    getLogColor(action) {
        const colors = {
            'LOGIN': '#39FF14',
            'REGISTER': '#007AFF',
            'ADD_VIDEO': '#00FF7F',
            'UPDATE_VIDEO': '#FFA500',
            'DELETE_VIDEO': '#FF3B30',
            'UPDATE_USER': '#8A2BE2'
        };
        return colors[action] || '#cccccc';
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

    addSystemMessage(message, type = 'info') {
        if (!this.terminalContent) return;

        const line = document.createElement('div');
        line.className = 'terminal-line';
        
        const timestamp = new Date().toLocaleTimeString('ar-EG');
        const prompt = type === 'error' ? '[ERROR]' : type === 'warn' ? '[WARN]' : '[INFO]';
        const color = type === 'error' ? '#FF3B30' : 
                     type === 'warn' ? '#FFA500' : '#39FF14';

        line.innerHTML = `
            <span class="terminal-prompt" style="color: ${color};">${prompt}</span>
            [${timestamp}] ${message}
        `;

        this.terminalContent.appendChild(line);
        this.terminalContent.scrollTop = this.terminalContent.scrollHeight;
    }

    logUserActivity(user, action, target) {
        const message = `المستخدم ${user} ${this.getActionText(action)} ${target}`;
        this.addSystemMessage(message, 'info');
    }

    logSystemEvent(event, details = '') {
        const message = `${event} ${details}`;
        this.addSystemMessage(message, 'info');
    }

    logError(error, context = '') {
        const message = `${context}: ${error}`;
        this.addSystemMessage(message, 'error');
    }

    async refreshTerminal() {
        this.addSystemMessage('جاري تحديث سجلات النظام...');
        await this.loadInitialLogs();
    }

    clearTerminal() {
        if (this.terminalContent) {
            this.terminalContent.innerHTML = '';
            this.addSystemMessage('تم مسح سجل النظام');
        }
    }
}

// إنشاء instance من مدير الترمينال
let terminalManager;

document.addEventListener('DOMContentLoaded', () => {
    terminalManager = new TerminalManager();
});