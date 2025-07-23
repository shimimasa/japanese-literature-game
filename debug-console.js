/**
 * DebugConsole - デバッグとユーザビリティテストのためのコンソール
 */
export class DebugConsole {
    constructor() {
        this.enabled = false;
        this.logs = [];
        this.maxLogs = 1000;
        this.logLevel = 'info'; // debug, info, warn, error
        
        // パフォーマンス測定
        this.performanceMarks = new Map();
        this.performanceMeasures = [];
        
        // ユーザー行動ログ
        this.userActions = [];
        this.maxActions = 500;
        
        // メモリ使用量追跡
        this.memorySnapshots = [];
        
        // コンソールUI要素
        this.consoleElement = null;
        this.isMinimized = false;
        
        // ログレベル
        this.logLevels = {
            debug: 0,
            info: 1,
            warn: 2,
            error: 3
        };
        
        // 初期化
        this.init();
    }
    
    /**
     * デバッグコンソールの初期化
     */
    init() {
        // 開発環境でのみ有効化
        if (window.location.hostname === 'localhost' || 
            window.location.hostname === '127.0.0.1') {
            this.enabled = true;
            this.createConsoleUI();
            this.setupEventListeners();
            this.startMemoryMonitoring();
        }
    }
    
    /**
     * コンソールUIの作成
     */
    createConsoleUI() {
        // 既存のコンソールがあれば削除
        if (this.consoleElement) {
            this.consoleElement.remove();
        }
        
        // コンソールコンテナ
        this.consoleElement = document.createElement('div');
        this.consoleElement.id = 'debug-console';
        this.consoleElement.className = 'debug-console';
        this.consoleElement.innerHTML = `
            <div class="debug-console-header">
                <span class="debug-console-title">🐛 Debug Console</span>
                <div class="debug-console-controls">
                    <button class="debug-btn" data-action="clear" title="Clear logs">🗑️</button>
                    <button class="debug-btn" data-action="export" title="Export logs">💾</button>
                    <button class="debug-btn" data-action="minimize" title="Minimize">_</button>
                    <button class="debug-btn" data-action="close" title="Close">✕</button>
                </div>
            </div>
            <div class="debug-console-tabs">
                <button class="debug-tab active" data-tab="logs">Logs</button>
                <button class="debug-tab" data-tab="performance">Performance</button>
                <button class="debug-tab" data-tab="actions">User Actions</button>
                <button class="debug-tab" data-tab="memory">Memory</button>
                <button class="debug-tab" data-tab="state">App State</button>
            </div>
            <div class="debug-console-filters">
                <label>
                    <input type="checkbox" class="debug-filter" data-level="debug" checked> Debug
                </label>
                <label>
                    <input type="checkbox" class="debug-filter" data-level="info" checked> Info
                </label>
                <label>
                    <input type="checkbox" class="debug-filter" data-level="warn" checked> Warn
                </label>
                <label>
                    <input type="checkbox" class="debug-filter" data-level="error" checked> Error
                </label>
            </div>
            <div class="debug-console-content">
                <div class="debug-tab-content active" data-content="logs">
                    <div class="debug-logs"></div>
                </div>
                <div class="debug-tab-content" data-content="performance">
                    <div class="debug-performance"></div>
                </div>
                <div class="debug-tab-content" data-content="actions">
                    <div class="debug-actions"></div>
                </div>
                <div class="debug-tab-content" data-content="memory">
                    <div class="debug-memory"></div>
                </div>
                <div class="debug-tab-content" data-content="state">
                    <div class="debug-state"></div>
                </div>
            </div>
        `;
        
        // スタイルを追加
        this.addStyles();
        
        // DOMに追加
        document.body.appendChild(this.consoleElement);
        
        // イベントリスナー設定
        this.setupConsoleEvents();
    }
    
    /**
     * スタイルの追加
     */
    addStyles() {
        if (document.getElementById('debug-console-styles')) {
            return;
        }
        
        const style = document.createElement('style');
        style.id = 'debug-console-styles';
        style.textContent = `
            .debug-console {
                position: fixed;
                bottom: 0;
                right: 20px;
                width: 400px;
                height: 300px;
                background: #1e1e1e;
                color: #d4d4d4;
                font-family: 'Consolas', 'Monaco', monospace;
                font-size: 12px;
                border: 1px solid #444;
                border-bottom: none;
                box-shadow: 0 -2px 10px rgba(0,0,0,0.5);
                z-index: 10000;
                display: flex;
                flex-direction: column;
                transition: height 0.3s ease;
            }
            
            .debug-console.minimized {
                height: 32px;
            }
            
            .debug-console-header {
                background: #2d2d2d;
                padding: 8px;
                display: flex;
                justify-content: space-between;
                align-items: center;
                cursor: move;
                user-select: none;
            }
            
            .debug-console-title {
                font-weight: bold;
                color: #fff;
            }
            
            .debug-console-controls {
                display: flex;
                gap: 5px;
            }
            
            .debug-btn {
                background: none;
                border: 1px solid #666;
                color: #d4d4d4;
                padding: 2px 8px;
                cursor: pointer;
                font-size: 12px;
                border-radius: 3px;
                transition: all 0.2s;
            }
            
            .debug-btn:hover {
                background: #444;
                border-color: #888;
            }
            
            .debug-console-tabs {
                display: flex;
                background: #252526;
                border-bottom: 1px solid #444;
            }
            
            .debug-console.minimized .debug-console-tabs,
            .debug-console.minimized .debug-console-filters,
            .debug-console.minimized .debug-console-content {
                display: none;
            }
            
            .debug-tab {
                background: none;
                border: none;
                color: #969696;
                padding: 8px 16px;
                cursor: pointer;
                border-bottom: 2px solid transparent;
                transition: all 0.2s;
            }
            
            .debug-tab:hover {
                color: #d4d4d4;
            }
            
            .debug-tab.active {
                color: #fff;
                border-bottom-color: #007acc;
            }
            
            .debug-console-filters {
                display: flex;
                gap: 15px;
                padding: 8px;
                background: #252526;
                border-bottom: 1px solid #444;
            }
            
            .debug-console-filters label {
                display: flex;
                align-items: center;
                gap: 5px;
                cursor: pointer;
            }
            
            .debug-console-content {
                flex: 1;
                overflow: hidden;
                position: relative;
            }
            
            .debug-tab-content {
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                overflow-y: auto;
                padding: 10px;
                display: none;
            }
            
            .debug-tab-content.active {
                display: block;
            }
            
            .debug-log-entry {
                margin-bottom: 4px;
                padding: 2px 4px;
                border-radius: 2px;
                font-family: monospace;
                white-space: pre-wrap;
                word-break: break-all;
            }
            
            .debug-log-debug { color: #969696; }
            .debug-log-info { color: #d4d4d4; }
            .debug-log-warn { color: #ce9178; background: rgba(206, 145, 120, 0.1); }
            .debug-log-error { color: #f48771; background: rgba(244, 135, 113, 0.1); }
            
            .debug-log-timestamp {
                color: #608b4e;
                margin-right: 8px;
            }
            
            .debug-performance-item,
            .debug-action-item {
                padding: 4px;
                margin-bottom: 4px;
                background: #2d2d2d;
                border-radius: 3px;
            }
            
            .debug-memory-chart {
                height: 150px;
                background: #2d2d2d;
                border-radius: 4px;
                padding: 10px;
                margin-bottom: 10px;
            }
            
            .debug-state-tree {
                font-family: monospace;
                line-height: 1.4;
            }
            
            .debug-state-key {
                color: #9cdcfe;
            }
            
            .debug-state-value {
                color: #ce9178;
            }
            
            .debug-state-object {
                margin-left: 20px;
            }
        `;
        
        document.head.appendChild(style);
    }
    
    /**
     * コンソールイベントの設定
     */
    setupConsoleEvents() {
        // ヘッダーボタン
        this.consoleElement.querySelectorAll('.debug-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const action = e.target.dataset.action;
                switch (action) {
                    case 'clear':
                        this.clear();
                        break;
                    case 'export':
                        this.exportLogs();
                        break;
                    case 'minimize':
                        this.toggleMinimize();
                        break;
                    case 'close':
                        this.close();
                        break;
                }
            });
        });
        
        // タブ切り替え
        this.consoleElement.querySelectorAll('.debug-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                this.switchTab(e.target.dataset.tab);
            });
        });
        
        // フィルター
        this.consoleElement.querySelectorAll('.debug-filter').forEach(filter => {
            filter.addEventListener('change', () => {
                this.updateLogDisplay();
            });
        });
        
        // ドラッグ機能
        this.setupDragging();
    }
    
    /**
     * ドラッグ機能の設定
     */
    setupDragging() {
        const header = this.consoleElement.querySelector('.debug-console-header');
        let isDragging = false;
        let startX, startY, startRight, startBottom;
        
        header.addEventListener('mousedown', (e) => {
            if (e.target.classList.contains('debug-btn')) return;
            
            isDragging = true;
            startX = e.clientX;
            startY = e.clientY;
            
            const rect = this.consoleElement.getBoundingClientRect();
            startRight = window.innerWidth - rect.right;
            startBottom = window.innerHeight - rect.bottom;
            
            document.addEventListener('mousemove', handleDrag);
            document.addEventListener('mouseup', stopDrag);
        });
        
        const handleDrag = (e) => {
            if (!isDragging) return;
            
            const deltaX = startX - e.clientX;
            const deltaY = startY - e.clientY;
            
            this.consoleElement.style.right = `${startRight + deltaX}px`;
            this.consoleElement.style.bottom = `${startBottom + deltaY}px`;
        };
        
        const stopDrag = () => {
            isDragging = false;
            document.removeEventListener('mousemove', handleDrag);
            document.removeEventListener('mouseup', stopDrag);
        };
    }
    
    /**
     * イベントリスナーの設定
     */
    setupEventListeners() {
        // コンソールメソッドのオーバーライド
        const originalLog = console.log;
        const originalWarn = console.warn;
        const originalError = console.error;
        
        console.log = (...args) => {
            this.log('info', ...args);
            originalLog.apply(console, args);
        };
        
        console.warn = (...args) => {
            this.log('warn', ...args);
            originalWarn.apply(console, args);
        };
        
        console.error = (...args) => {
            this.log('error', ...args);
            originalError.apply(console, args);
        };
        
        // デバッグメソッドの追加
        console.debug = (...args) => {
            this.log('debug', ...args);
        };
        
        // ユーザーアクションの追跡
        this.trackUserActions();
        
        // キーボードショートカット
        document.addEventListener('keydown', (e) => {
            // Ctrl+Shift+D でコンソール表示切り替え
            if (e.ctrlKey && e.shiftKey && e.key === 'D') {
                e.preventDefault();
                this.toggle();
            }
        });
    }
    
    /**
     * ログ記録
     */
    log(level, ...args) {
        if (!this.enabled) return;
        
        const logEntry = {
            timestamp: new Date().toISOString(),
            level: level,
            message: args.map(arg => {
                if (typeof arg === 'object') {
                    try {
                        return JSON.stringify(arg, null, 2);
                    } catch {
                        return String(arg);
                    }
                }
                return String(arg);
            }).join(' ')
        };
        
        this.logs.push(logEntry);
        
        // ログ数制限
        if (this.logs.length > this.maxLogs) {
            this.logs.shift();
        }
        
        // UIに追加
        this.addLogToUI(logEntry);
    }
    
    /**
     * ログをUIに追加
     */
    addLogToUI(logEntry) {
        if (!this.consoleElement) return;
        
        const logsContainer = this.consoleElement.querySelector('.debug-logs');
        if (!logsContainer) return;
        
        const logElement = document.createElement('div');
        logElement.className = `debug-log-entry debug-log-${logEntry.level}`;
        logElement.innerHTML = `
            <span class="debug-log-timestamp">${new Date(logEntry.timestamp).toLocaleTimeString()}</span>
            <span class="debug-log-message">${this.escapeHtml(logEntry.message)}</span>
        `;
        
        logsContainer.appendChild(logElement);
        
        // 自動スクロール
        logsContainer.scrollTop = logsContainer.scrollHeight;
    }
    
    /**
     * HTMLエスケープ
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    /**
     * ユーザーアクションの追跡
     */
    trackUserActions() {
        // クリックイベント
        document.addEventListener('click', (e) => {
            this.recordAction('click', {
                target: e.target.tagName,
                id: e.target.id,
                className: e.target.className,
                text: e.target.textContent?.substring(0, 50)
            });
        });
        
        // フォーム入力
        document.addEventListener('change', (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') {
                this.recordAction('input', {
                    target: e.target.tagName,
                    name: e.target.name,
                    type: e.target.type,
                    value: e.target.type === 'password' ? '***' : e.target.value
                });
            }
        });
        
        // ページ遷移
        window.addEventListener('popstate', () => {
            this.recordAction('navigation', {
                url: window.location.href
            });
        });
    }
    
    /**
     * アクションの記録
     */
    recordAction(type, data) {
        const action = {
            timestamp: Date.now(),
            type: type,
            data: data
        };
        
        this.userActions.push(action);
        
        // アクション数制限
        if (this.userActions.length > this.maxActions) {
            this.userActions.shift();
        }
        
        // UIを更新
        this.updateActionsDisplay();
    }
    
    /**
     * パフォーマンスマーク
     */
    mark(name) {
        if (!this.enabled) return;
        
        this.performanceMarks.set(name, performance.now());
        performance.mark(name);
    }
    
    /**
     * パフォーマンス測定
     */
    measure(name, startMark, endMark) {
        if (!this.enabled) return;
        
        const measure = performance.measure(name, startMark, endMark);
        
        this.performanceMeasures.push({
            name: name,
            duration: measure.duration,
            timestamp: Date.now()
        });
        
        this.updatePerformanceDisplay();
        
        return measure.duration;
    }
    
    /**
     * メモリ監視の開始
     */
    startMemoryMonitoring() {
        if (!this.enabled || !performance.memory) return;
        
        setInterval(() => {
            const snapshot = {
                timestamp: Date.now(),
                usedJSHeapSize: performance.memory.usedJSHeapSize,
                totalJSHeapSize: performance.memory.totalJSHeapSize,
                jsHeapSizeLimit: performance.memory.jsHeapSizeLimit
            };
            
            this.memorySnapshots.push(snapshot);
            
            // スナップショット数制限
            if (this.memorySnapshots.length > 60) {
                this.memorySnapshots.shift();
            }
            
            this.updateMemoryDisplay();
        }, 1000);
    }
    
    /**
     * タブ切り替え
     */
    switchTab(tabName) {
        // タブボタンの更新
        this.consoleElement.querySelectorAll('.debug-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.tab === tabName);
        });
        
        // コンテンツの更新
        this.consoleElement.querySelectorAll('.debug-tab-content').forEach(content => {
            content.classList.toggle('active', content.dataset.content === tabName);
        });
        
        // 各タブのコンテンツを更新
        switch (tabName) {
            case 'logs':
                this.updateLogDisplay();
                break;
            case 'performance':
                this.updatePerformanceDisplay();
                break;
            case 'actions':
                this.updateActionsDisplay();
                break;
            case 'memory':
                this.updateMemoryDisplay();
                break;
            case 'state':
                this.updateStateDisplay();
                break;
        }
    }
    
    /**
     * ログ表示の更新
     */
    updateLogDisplay() {
        const logsContainer = this.consoleElement.querySelector('.debug-logs');
        if (!logsContainer) return;
        
        // フィルター状態を取得
        const filters = {};
        this.consoleElement.querySelectorAll('.debug-filter').forEach(filter => {
            filters[filter.dataset.level] = filter.checked;
        });
        
        // ログをフィルタリングして表示
        logsContainer.innerHTML = '';
        this.logs.forEach(log => {
            if (filters[log.level]) {
                this.addLogToUI(log);
            }
        });
    }
    
    /**
     * パフォーマンス表示の更新
     */
    updatePerformanceDisplay() {
        const container = this.consoleElement.querySelector('.debug-performance');
        if (!container) return;
        
        container.innerHTML = '<h3>Performance Measurements</h3>';
        
        // 最新の測定結果を表示
        const recentMeasures = this.performanceMeasures.slice(-20);
        recentMeasures.reverse().forEach(measure => {
            const item = document.createElement('div');
            item.className = 'debug-performance-item';
            item.innerHTML = `
                <strong>${measure.name}</strong>: ${measure.duration.toFixed(2)}ms
                <span style="float: right; color: #608b4e;">
                    ${new Date(measure.timestamp).toLocaleTimeString()}
                </span>
            `;
            container.appendChild(item);
        });
    }
    
    /**
     * アクション表示の更新
     */
    updateActionsDisplay() {
        const container = this.consoleElement.querySelector('.debug-actions');
        if (!container) return;
        
        container.innerHTML = '<h3>User Actions</h3>';
        
        // 最新のアクションを表示
        const recentActions = this.userActions.slice(-30);
        recentActions.reverse().forEach(action => {
            const item = document.createElement('div');
            item.className = 'debug-action-item';
            item.innerHTML = `
                <strong>${action.type}</strong>: ${JSON.stringify(action.data)}
                <span style="float: right; color: #608b4e;">
                    ${new Date(action.timestamp).toLocaleTimeString()}
                </span>
            `;
            container.appendChild(item);
        });
    }
    
    /**
     * メモリ表示の更新
     */
    updateMemoryDisplay() {
        const container = this.consoleElement.querySelector('.debug-memory');
        if (!container) return;
        
        container.innerHTML = '<h3>Memory Usage</h3>';
        
        if (!performance.memory) {
            container.innerHTML += '<p>Memory monitoring not available in this browser</p>';
            return;
        }
        
        // 現在のメモリ使用量
        const current = this.memorySnapshots[this.memorySnapshots.length - 1];
        if (current) {
            const usedMB = (current.usedJSHeapSize / 1024 / 1024).toFixed(2);
            const totalMB = (current.totalJSHeapSize / 1024 / 1024).toFixed(2);
            const limitMB = (current.jsHeapSizeLimit / 1024 / 1024).toFixed(2);
            
            container.innerHTML += `
                <div class="debug-memory-stats">
                    <p>Used: ${usedMB} MB</p>
                    <p>Total: ${totalMB} MB</p>
                    <p>Limit: ${limitMB} MB</p>
                    <p>Usage: ${((current.usedJSHeapSize / current.totalJSHeapSize) * 100).toFixed(1)}%</p>
                </div>
            `;
        }
        
        // 簡易チャート
        const chart = document.createElement('div');
        chart.className = 'debug-memory-chart';
        chart.innerHTML = '<canvas width="360" height="130"></canvas>';
        container.appendChild(chart);
        
        this.drawMemoryChart(chart.querySelector('canvas'));
    }
    
    /**
     * メモリチャートの描画
     */
    drawMemoryChart(canvas) {
        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;
        
        // クリア
        ctx.clearRect(0, 0, width, height);
        
        if (this.memorySnapshots.length < 2) return;
        
        // スケール計算
        const maxMemory = Math.max(...this.memorySnapshots.map(s => s.usedJSHeapSize));
        const scale = height / maxMemory;
        
        // グリッド
        ctx.strokeStyle = '#444';
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let i = 0; i < 5; i++) {
            const y = (height / 4) * i;
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
        }
        ctx.stroke();
        
        // データプロット
        ctx.strokeStyle = '#4ec9b0';
        ctx.lineWidth = 2;
        ctx.beginPath();
        
        this.memorySnapshots.forEach((snapshot, index) => {
            const x = (width / (this.memorySnapshots.length - 1)) * index;
            const y = height - (snapshot.usedJSHeapSize * scale);
            
            if (index === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });
        
        ctx.stroke();
    }
    
    /**
     * アプリケーション状態の表示
     */
    updateStateDisplay() {
        const container = this.consoleElement.querySelector('.debug-state');
        if (!container) return;
        
        container.innerHTML = '<h3>Application State</h3>';
        
        // グローバル変数から主要な状態を取得
        const state = {
            localStorage: this.getLocalStorageState(),
            sessionStorage: this.getSessionStorageState(),
            documentReadyState: document.readyState,
            windowSize: {
                width: window.innerWidth,
                height: window.innerHeight
            },
            location: {
                href: window.location.href,
                pathname: window.location.pathname
            }
        };
        
        // 状態をツリー表示
        const tree = document.createElement('div');
        tree.className = 'debug-state-tree';
        tree.innerHTML = this.formatObject(state);
        container.appendChild(tree);
    }
    
    /**
     * LocalStorageの状態を取得
     */
    getLocalStorageState() {
        const state = {};
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            try {
                const value = localStorage.getItem(key);
                state[key] = value.length > 100 ? value.substring(0, 100) + '...' : value;
            } catch {
                state[key] = '[Error reading value]';
            }
        }
        return state;
    }
    
    /**
     * SessionStorageの状態を取得
     */
    getSessionStorageState() {
        const state = {};
        for (let i = 0; i < sessionStorage.length; i++) {
            const key = sessionStorage.key(i);
            try {
                const value = sessionStorage.getItem(key);
                state[key] = value.length > 100 ? value.substring(0, 100) + '...' : value;
            } catch {
                state[key] = '[Error reading value]';
            }
        }
        return state;
    }
    
    /**
     * オブジェクトのフォーマット
     */
    formatObject(obj, indent = 0) {
        let html = '';
        const spaces = '  '.repeat(indent);
        
        for (const [key, value] of Object.entries(obj)) {
            html += `${spaces}<span class="debug-state-key">${key}</span>: `;
            
            if (typeof value === 'object' && value !== null) {
                html += `{\n${this.formatObject(value, indent + 1)}${spaces}}\n`;
            } else {
                html += `<span class="debug-state-value">${JSON.stringify(value)}</span>\n`;
            }
        }
        
        return html;
    }
    
    /**
     * ログをクリア
     */
    clear() {
        this.logs = [];
        this.updateLogDisplay();
    }
    
    /**
     * ログをエクスポート
     */
    exportLogs() {
        const data = {
            logs: this.logs,
            userActions: this.userActions,
            performanceMeasures: this.performanceMeasures,
            memorySnapshots: this.memorySnapshots,
            timestamp: new Date().toISOString()
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], {
            type: 'application/json'
        });
        
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `debug-log-${Date.now()}.json`;
        a.click();
        
        URL.revokeObjectURL(url);
    }
    
    /**
     * 最小化の切り替え
     */
    toggleMinimize() {
        this.isMinimized = !this.isMinimized;
        this.consoleElement.classList.toggle('minimized', this.isMinimized);
    }
    
    /**
     * コンソールを閉じる
     */
    close() {
        if (this.consoleElement) {
            this.consoleElement.remove();
            this.consoleElement = null;
        }
    }
    
    /**
     * コンソールの表示切り替え
     */
    toggle() {
        if (this.consoleElement) {
            this.close();
        } else {
            this.createConsoleUI();
        }
    }
    
    /**
     * デバッグ情報の取得
     */
    getDebugInfo() {
        return {
            logs: this.logs,
            userActions: this.userActions,
            performanceMeasures: this.performanceMeasures,
            memorySnapshots: this.memorySnapshots,
            browserInfo: {
                userAgent: navigator.userAgent,
                language: navigator.language,
                platform: navigator.platform,
                cookieEnabled: navigator.cookieEnabled,
                onLine: navigator.onLine
            },
            screenInfo: {
                width: screen.width,
                height: screen.height,
                availWidth: screen.availWidth,
                availHeight: screen.availHeight,
                colorDepth: screen.colorDepth,
                pixelRatio: window.devicePixelRatio
            }
        };
    }
}

// シングルトンインスタンス
export const debugConsole = new DebugConsole();

// グローバルに公開（開発用）
if (window) {
    window.debugConsole = debugConsole;
}

// エクスポート
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DebugConsole;
}