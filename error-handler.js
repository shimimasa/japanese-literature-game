/**
 * ErrorHandler - エラーハンドリングとユーザー通知を管理するクラス
 */
class ErrorHandler {
    constructor() {
        this.errorLog = [];
        this.maxLogSize = 100;
        this.errorTypes = {
            NETWORK: 'network',
            DATA: 'data',
            UI: 'ui',
            SYSTEM: 'system',
            VALIDATION: 'validation'
        };
        
        // 子ども向けエラーメッセージ辞書
        this.friendlyMessages = {
            'network_offline': 'インターネットにつながっていないみたい。もう一度ためしてみてね。',
            'network_timeout': 'じかんがかかりすぎちゃった。もういちどボタンをおしてみて。',
            'network_404': 'さがしているものがみつからなかったよ。',
            'data_invalid_json': 'データがこわれているみたい。大人の人にそうだんしてね。',
            'data_missing_field': 'ひつようなじょうほうがたりないよ。',
            'data_type_error': 'データのかたちがちがうみたい。',
            'ui_render_error': 'がめんをひょうじできなかった。ページをさいよみこみしてみて。',
            'system_storage_full': 'ほぞんするばしょがいっぱいになっちゃった。',
            'system_browser_unsupported': 'このブラウザではつかえないきのうだよ。',
            'validation_required': 'にゅうりょくがひつようだよ。',
            'validation_format': 'ただしいかたちでにゅうりょくしてね。',
            'default': 'なにかもんだいがおきちゃった。もういちどためしてみてね。'
        };
        
        this.initializeNotificationContainer();
        this.loadErrorLog();
    }
    
    /**
     * エラー通知用のコンテナを初期化
     */
    initializeNotificationContainer() {
        // トースト通知用コンテナ
        if (!document.getElementById('error-toast-container')) {
            const toastContainer = document.createElement('div');
            toastContainer.id = 'error-toast-container';
            toastContainer.className = 'error-toast-container';
            toastContainer.setAttribute('role', 'alert');
            toastContainer.setAttribute('aria-live', 'polite');
            document.body.appendChild(toastContainer);
        }
        
        // モーダル用コンテナ
        if (!document.getElementById('error-modal-container')) {
            const modalContainer = document.createElement('div');
            modalContainer.id = 'error-modal-container';
            modalContainer.className = 'error-modal-container';
            modalContainer.setAttribute('role', 'dialog');
            modalContainer.setAttribute('aria-modal', 'true');
            document.body.appendChild(modalContainer);
        }
    }
    
    /**
     * エラーを処理する主要メソッド
     * @param {Error|string} error - エラーオブジェクトまたはメッセージ
     * @param {string} type - エラータイプ
     * @param {Object} context - 追加のコンテキスト情報
     */
    handleError(error, type = this.errorTypes.SYSTEM, context = {}) {
        const errorInfo = this.parseError(error, type, context);
        
        // エラーをログに記録
        this.logError(errorInfo);
        
        // ユーザーへの通知方法を決定
        const severity = this.determineSeverity(errorInfo);
        this.showError(errorInfo, severity);
        
        // 開発環境ではコンソールに詳細を出力
        if (this.isDevelopment()) {
            console.error('Error Details:', errorInfo);
        }
        
        return errorInfo;
    }
    
    /**
     * エラー情報を解析して構造化
     */
    parseError(error, type, context) {
        const errorInfo = {
            timestamp: new Date().toISOString(),
            type: type,
            message: '',
            stack: '',
            code: '',
            context: context,
            userAgent: navigator.userAgent,
            url: window.location.href
        };
        
        if (error instanceof Error) {
            errorInfo.message = error.message;
            errorInfo.stack = error.stack;
            errorInfo.code = error.code || '';
        } else if (typeof error === 'string') {
            errorInfo.message = error;
        } else if (error && typeof error === 'object') {
            errorInfo.message = error.message || JSON.stringify(error);
            errorInfo.code = error.code || '';
        }
        
        return errorInfo;
    }
    
    /**
     * エラーの深刻度を判定
     */
    determineSeverity(errorInfo) {
        // ネットワークエラーやシステムエラーは高優先度
        if (errorInfo.type === this.errorTypes.NETWORK || 
            errorInfo.type === this.errorTypes.SYSTEM) {
            return 'high';
        }
        
        // バリデーションエラーは低優先度
        if (errorInfo.type === this.errorTypes.VALIDATION) {
            return 'low';
        }
        
        return 'medium';
    }
    
    /**
     * エラーをユーザーに表示
     * @param {Object} errorInfo - エラー情報
     * @param {string} severity - 深刻度 (low, medium, high)
     */
    showError(errorInfo, severity = 'medium') {
        const friendlyMessage = this.getFriendlyMessage(errorInfo);
        
        switch (severity) {
            case 'low':
                this.showToast(friendlyMessage, 'info');
                break;
            case 'medium':
                this.showToast(friendlyMessage, 'warning');
                break;
            case 'high':
                this.showModal(friendlyMessage, errorInfo);
                break;
        }
    }
    
    /**
     * トースト通知を表示
     */
    showToast(message, type = 'error') {
        const container = document.getElementById('error-toast-container');
        const toast = document.createElement('div');
        toast.className = `error-toast error-toast-${type}`;
        
        // アイコンを追加
        const icon = document.createElement('span');
        icon.className = 'error-toast-icon';
        icon.textContent = type === 'error' ? '❌' : type === 'warning' ? '⚠️' : 'ℹ️';
        
        // メッセージを追加
        const messageSpan = document.createElement('span');
        messageSpan.className = 'error-toast-message';
        messageSpan.textContent = message;
        
        // 閉じるボタン
        const closeBtn = document.createElement('button');
        closeBtn.className = 'error-toast-close';
        closeBtn.textContent = '✕';
        closeBtn.setAttribute('aria-label', '閉じる');
        closeBtn.onclick = () => this.removeToast(toast);
        
        toast.appendChild(icon);
        toast.appendChild(messageSpan);
        toast.appendChild(closeBtn);
        
        container.appendChild(toast);
        
        // アニメーション開始
        requestAnimationFrame(() => {
            toast.classList.add('error-toast-show');
        });
        
        // 自動的に削除（5秒後）
        setTimeout(() => this.removeToast(toast), 5000);
    }
    
    /**
     * トーストを削除
     */
    removeToast(toast) {
        toast.classList.remove('error-toast-show');
        toast.classList.add('error-toast-hide');
        
        toast.addEventListener('transitionend', () => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        });
    }
    
    /**
     * モーダルダイアログを表示
     */
    showModal(message, errorInfo) {
        const container = document.getElementById('error-modal-container');
        container.innerHTML = '';
        
        const modal = document.createElement('div');
        modal.className = 'error-modal';
        
        const content = document.createElement('div');
        content.className = 'error-modal-content';
        
        // タイトル
        const title = document.createElement('h2');
        title.className = 'error-modal-title';
        title.textContent = 'エラーがはっせいしました';
        
        // メッセージ
        const messageDiv = document.createElement('div');
        messageDiv.className = 'error-modal-message';
        messageDiv.textContent = message;
        
        // 詳細情報（開発環境のみ）
        if (this.isDevelopment()) {
            const details = document.createElement('details');
            details.className = 'error-modal-details';
            const summary = document.createElement('summary');
            summary.textContent = '詳細情報';
            const pre = document.createElement('pre');
            pre.textContent = JSON.stringify(errorInfo, null, 2);
            details.appendChild(summary);
            details.appendChild(pre);
            content.appendChild(details);
        }
        
        // ボタン
        const buttonContainer = document.createElement('div');
        buttonContainer.className = 'error-modal-buttons';
        
        const retryBtn = document.createElement('button');
        retryBtn.className = 'error-modal-button error-modal-retry';
        retryBtn.textContent = 'もういちど';
        retryBtn.onclick = () => {
            this.closeModal();
            window.location.reload();
        };
        
        const closeBtn = document.createElement('button');
        closeBtn.className = 'error-modal-button error-modal-close';
        closeBtn.textContent = 'とじる';
        closeBtn.onclick = () => this.closeModal();
        
        buttonContainer.appendChild(retryBtn);
        buttonContainer.appendChild(closeBtn);
        
        content.appendChild(title);
        content.appendChild(messageDiv);
        content.appendChild(buttonContainer);
        
        modal.appendChild(content);
        container.appendChild(modal);
        
        // 表示
        container.style.display = 'flex';
        requestAnimationFrame(() => {
            container.classList.add('error-modal-show');
        });
        
        // フォーカストラップ
        closeBtn.focus();
    }
    
    /**
     * モーダルを閉じる
     */
    closeModal() {
        const container = document.getElementById('error-modal-container');
        container.classList.remove('error-modal-show');
        
        setTimeout(() => {
            container.style.display = 'none';
            container.innerHTML = '';
        }, 300);
    }
    
    /**
     * ユーザーフレンドリーなメッセージを取得
     */
    getFriendlyMessage(errorInfo) {
        // エラーコードからメッセージを検索
        if (errorInfo.code && this.friendlyMessages[errorInfo.code]) {
            return this.friendlyMessages[errorInfo.code];
        }
        
        // エラータイプとメッセージから推測
        const errorKey = this.guessErrorKey(errorInfo);
        if (errorKey && this.friendlyMessages[errorKey]) {
            return this.friendlyMessages[errorKey];
        }
        
        // デフォルトメッセージ
        return this.friendlyMessages.default;
    }
    
    /**
     * エラー情報からエラーキーを推測
     */
    guessErrorKey(errorInfo) {
        const message = errorInfo.message.toLowerCase();
        
        // ネットワークエラー
        if (errorInfo.type === this.errorTypes.NETWORK) {
            if (message.includes('offline') || !navigator.onLine) {
                return 'network_offline';
            }
            if (message.includes('timeout')) {
                return 'network_timeout';
            }
            if (message.includes('404')) {
                return 'network_404';
            }
        }
        
        // データエラー
        if (errorInfo.type === this.errorTypes.DATA) {
            if (message.includes('json')) {
                return 'data_invalid_json';
            }
            if (message.includes('missing') || message.includes('required')) {
                return 'data_missing_field';
            }
            if (message.includes('type')) {
                return 'data_type_error';
            }
        }
        
        // システムエラー
        if (errorInfo.type === this.errorTypes.SYSTEM) {
            if (message.includes('storage') || message.includes('quota')) {
                return 'system_storage_full';
            }
            if (message.includes('unsupported') || message.includes('browser')) {
                return 'system_browser_unsupported';
            }
        }
        
        return null;
    }
    
    /**
     * エラーログに記録
     */
    logError(errorInfo) {
        this.errorLog.unshift(errorInfo);
        
        // ログサイズ制限
        if (this.errorLog.length > this.maxLogSize) {
            this.errorLog = this.errorLog.slice(0, this.maxLogSize);
        }
        
        // LocalStorageに保存
        this.saveErrorLog();
    }
    
    /**
     * エラーログを保存
     */
    saveErrorLog() {
        try {
            localStorage.setItem('errorLog', JSON.stringify(this.errorLog));
        } catch (e) {
            console.warn('Failed to save error log:', e);
        }
    }
    
    /**
     * エラーログを読み込み
     */
    loadErrorLog() {
        try {
            const saved = localStorage.getItem('errorLog');
            if (saved) {
                this.errorLog = JSON.parse(saved);
            }
        } catch (e) {
            console.warn('Failed to load error log:', e);
            this.errorLog = [];
        }
    }
    
    /**
     * エラーログを取得
     */
    getErrorLog() {
        return [...this.errorLog];
    }
    
    /**
     * エラーログをクリア
     */
    clearErrorLog() {
        this.errorLog = [];
        this.saveErrorLog();
    }
    
    /**
     * 開発環境かどうかを判定
     */
    isDevelopment() {
        return window.location.hostname === 'localhost' || 
               window.location.hostname === '127.0.0.1';
    }
    
    /**
     * インライン通知を表示
     */
    showInlineError(element, message) {
        // 既存のエラー表示を削除
        const existingError = element.parentNode.querySelector('.inline-error');
        if (existingError) {
            existingError.remove();
        }
        
        // エラー要素を作成
        const errorDiv = document.createElement('div');
        errorDiv.className = 'inline-error';
        errorDiv.textContent = message;
        errorDiv.setAttribute('role', 'alert');
        
        // 要素の後に挿入
        element.parentNode.insertBefore(errorDiv, element.nextSibling);
        
        // エラー状態のクラスを追加
        element.classList.add('error');
        
        // 5秒後に自動削除
        setTimeout(() => {
            errorDiv.remove();
            element.classList.remove('error');
        }, 5000);
    }
    
    /**
     * ネットワークエラー専用ハンドラー
     */
    handleNetworkError(error, url) {
        const context = {
            url: url,
            online: navigator.onLine,
            timestamp: new Date().toISOString()
        };
        
        return this.handleError(error, this.errorTypes.NETWORK, context);
    }
    
    /**
     * データエラー専用ハンドラー
     */
    handleDataError(error, data) {
        const context = {
            data: typeof data === 'object' ? JSON.stringify(data).slice(0, 200) : data,
            timestamp: new Date().toISOString()
        };
        
        return this.handleError(error, this.errorTypes.DATA, context);
    }
    
    /**
     * バリデーションエラー専用ハンドラー
     */
    handleValidationError(field, message) {
        const error = new Error(`Validation failed for field: ${field}`);
        error.code = 'validation_error';
        
        const context = {
            field: field,
            validationMessage: message,
            timestamp: new Date().toISOString()
        };
        
        return this.handleError(error, this.errorTypes.VALIDATION, context);
    }
}

// グローバルなエラーハンドラーインスタンスをエクスポート
const errorHandler = new ErrorHandler();

// エクスポート
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ErrorHandler;
}
// グローバルに公開
if (typeof window !== 'undefined') {
    window.ErrorHandler = ErrorHandler;
    window.errorHandler = errorHandler;
}
