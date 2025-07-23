/**
 * ui-manager.js - UI統合管理
 * 
 * ローディング画面、エラー表示、通知、モーダルなど、
 * UI全体の統合的な管理を行います。
 */

export class UIManager {
    constructor() {
        // UI要素の参照
        this.loadingOverlay = null;
        this.notificationQueue = [];
        this.activeModals = [];
        
        // 設定
        this.notificationDuration = 3000;
        this.maxNotifications = 3;
        
        // 初期化
        this.init();
    }
    
    /**
     * 初期化処理
     */
    init() {
        // ローディングオーバーレイの取得
        this.loadingOverlay = document.getElementById('loading-overlay');
        
        // グローバルエラーハンドラーの設定
        this.setupErrorHandlers();
        
        // レスポンシブ対応の初期化
        this.setupResponsiveHandlers();
        
        // アクセシビリティの初期化
        this.setupAccessibility();
        
        // レイアウト管理の初期化
        this.initializeLayoutManager();
    }
    
    /**
     * エラーハンドラーの設定
     */
    setupErrorHandlers() {
        // グローバルエラーハンドラー
        window.addEventListener('error', (event) => {
            console.error('グローバルエラー:', event.error);
            this.showError('予期しないエラーが発生しました');
        });
        
        // Promise rejection ハンドラー
        window.addEventListener('unhandledrejection', (event) => {
            console.error('未処理のPromiseエラー:', event.reason);
            this.showError('処理中にエラーが発生しました');
        });
    }
    
    /**
     * レスポンシブハンドラーの設定
     */
    setupResponsiveHandlers() {
        // ビューポートサイズの監視
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                this.handleViewportChange();
            }, 250);
        });
        
        // オリエンテーション変更の監視
        window.addEventListener('orientationchange', () => {
            this.handleOrientationChange();
        });
        
        // 初回チェック
        this.handleViewportChange();
    }
    
    /**
     * アクセシビリティの設定
     */
    setupAccessibility() {
        // フォーカストラップの設定
        this.setupFocusTrap();
        
        // ARIAライブリージョンの作成
        this.createAriaLiveRegion();
        
        // キーボードナビゲーションの強化
        this.enhanceKeyboardNavigation();
    }
    
    /**
     * ローディング表示
     * @param {string} message - 表示メッセージ
     */
    showLoading(message = '読み込み中...') {
        if (this.loadingOverlay) {
            const textElement = this.loadingOverlay.querySelector('.loading-text');
            if (textElement) {
                textElement.textContent = message;
            }
            this.loadingOverlay.classList.remove('hidden');
            
            // アクセシビリティ
            this.loadingOverlay.setAttribute('aria-busy', 'true');
            this.announceToScreenReader(message);
        }
    }
    
    /**
     * ローディング非表示
     */
    hideLoading() {
        if (this.loadingOverlay) {
            this.loadingOverlay.classList.add('hidden');
            this.loadingOverlay.setAttribute('aria-busy', 'false');
        }
    }
    
    /**
     * エラー表示
     * @param {string} message - エラーメッセージ
     * @param {Object} options - オプション
     */
    showError(message, options = {}) {
        const errorOptions = {
            type: 'error',
            duration: options.duration || 5000,
            dismissible: options.dismissible !== false,
            icon: '⚠️',
            ...options
        };
        
        this.showNotification(message, errorOptions);
        
        // コンソールにも出力
        console.error('UIエラー:', message);
    }
    
    /**
     * 成功メッセージ表示
     * @param {string} message - メッセージ
     * @param {Object} options - オプション
     */
    showSuccess(message, options = {}) {
        const successOptions = {
            type: 'success',
            icon: '✅',
            ...options
        };
        
        this.showNotification(message, successOptions);
    }
    
    /**
     * 通知表示
     * @param {string} message - メッセージ
     * @param {Object} options - オプション
     */
    showNotification(message, options = {}) {
        const notification = this.createNotificationElement(message, options);
        
        // 通知コンテナの取得または作成
        let container = document.getElementById('notification-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'notification-container';
            container.className = 'notification-container';
            document.body.appendChild(container);
        }
        
        // 最大数を超える場合は古い通知を削除
        const existingNotifications = container.querySelectorAll('.notification-item');
        if (existingNotifications.length >= this.maxNotifications) {
            existingNotifications[0].remove();
        }
        
        // 通知を追加
        container.appendChild(notification);
        
        // アニメーション
        requestAnimationFrame(() => {
            notification.classList.add('show');
        });
        
        // 自動削除
        const duration = options.duration || this.notificationDuration;
        setTimeout(() => {
            this.dismissNotification(notification);
        }, duration);
        
        // スクリーンリーダーへの通知
        this.announceToScreenReader(message);
    }
    
    /**
     * 通知要素の作成
     * @param {string} message - メッセージ
     * @param {Object} options - オプション
     * @returns {HTMLElement} 通知要素
     */
    createNotificationElement(message, options) {
        const notification = document.createElement('div');
        notification.className = `notification-item notification-${options.type || 'info'}`;
        
        const icon = options.icon || 'ℹ️';
        
        notification.innerHTML = `
            <span class="notification-icon">${icon}</span>
            <span class="notification-message">${message}</span>
            ${options.dismissible !== false ? '<button class="notification-close" aria-label="閉じる">×</button>' : ''}
        `;
        
        // 閉じるボタンのイベント
        if (options.dismissible !== false) {
            notification.querySelector('.notification-close').addEventListener('click', () => {
                this.dismissNotification(notification);
            });
        }
        
        return notification;
    }
    
    /**
     * 通知を削除
     * @param {HTMLElement} notification - 通知要素
     */
    dismissNotification(notification) {
        notification.classList.remove('show');
        setTimeout(() => {
            notification.remove();
        }, 300);
    }
    
    /**
     * 確認ダイアログ表示
     * @param {string} message - メッセージ
     * @param {Object} options - オプション
     * @returns {Promise<boolean>} ユーザーの選択
     */
    async showConfirm(message, options = {}) {
        return new Promise((resolve) => {
            const modal = this.createModal({
                title: options.title || '確認',
                content: message,
                buttons: [
                    {
                        text: options.cancelText || 'キャンセル',
                        className: 'btn-secondary',
                        action: () => {
                            this.closeModal(modal);
                            resolve(false);
                        }
                    },
                    {
                        text: options.confirmText || 'OK',
                        className: 'btn-primary',
                        action: () => {
                            this.closeModal(modal);
                            resolve(true);
                        }
                    }
                ]
            });
            
            this.showModal(modal);
        });
    }
    
    /**
     * モーダル作成
     * @param {Object} config - モーダル設定
     * @returns {HTMLElement} モーダル要素
     */
    createModal(config) {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.setAttribute('role', 'dialog');
        modal.setAttribute('aria-modal', 'true');
        modal.setAttribute('aria-labelledby', 'modal-title');
        
        const modalContent = document.createElement('div');
        modalContent.className = 'modal-content';
        
        modalContent.innerHTML = `
            <div class="modal-header">
                <h3 id="modal-title" class="modal-title">${config.title || ''}</h3>
                <button class="modal-close" aria-label="閉じる">×</button>
            </div>
            <div class="modal-body">
                ${config.content || ''}
            </div>
            ${config.buttons ? `
                <div class="modal-footer">
                    ${config.buttons.map(btn => `
                        <button class="${btn.className || 'btn-default'}">${btn.text}</button>
                    `).join('')}
                </div>
            ` : ''}
        `;
        
        modal.appendChild(modalContent);
        
        // イベントハンドラーの設定
        modalContent.querySelector('.modal-close').addEventListener('click', () => {
            this.closeModal(modal);
        });
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.closeModal(modal);
            }
        });
        
        // ボタンのイベント設定
        if (config.buttons) {
            const buttons = modalContent.querySelectorAll('.modal-footer button');
            config.buttons.forEach((btnConfig, index) => {
                if (buttons[index] && btnConfig.action) {
                    buttons[index].addEventListener('click', btnConfig.action);
                }
            });
        }
        
        return modal;
    }
    
    /**
     * モーダル表示
     * @param {HTMLElement} modal - モーダル要素
     */
    showModal(modal) {
        document.body.appendChild(modal);
        this.activeModals.push(modal);
        
        // フォーカストラップ
        this.trapFocus(modal);
        
        // アニメーション
        requestAnimationFrame(() => {
            modal.classList.add('show');
        });
        
        // ESCキーで閉じる
        const escHandler = (e) => {
            if (e.key === 'Escape') {
                this.closeModal(modal);
                document.removeEventListener('keydown', escHandler);
            }
        };
        document.addEventListener('keydown', escHandler);
    }
    
    /**
     * モーダルを閉じる
     * @param {HTMLElement} modal - モーダル要素
     */
    closeModal(modal) {
        modal.classList.remove('show');
        
        setTimeout(() => {
            modal.remove();
            this.activeModals = this.activeModals.filter(m => m !== modal);
            
            // フォーカスを元に戻す
            if (this.previousFocus) {
                this.previousFocus.focus();
            }
        }, 300);
    }
    
    /**
     * ビューポート変更の処理
     */
    handleViewportChange() {
        const width = window.innerWidth;
        const height = window.innerHeight;
        
        // ビューポートサイズクラスの更新
        document.body.classList.remove('viewport-mobile', 'viewport-tablet', 'viewport-desktop');
        
        if (width < 768) {
            document.body.classList.add('viewport-mobile');
        } else if (width < 1024) {
            document.body.classList.add('viewport-tablet');
        } else {
            document.body.classList.add('viewport-desktop');
        }
        
        // カスタムイベントの発火
        const event = new CustomEvent('viewportchange', {
            detail: { width, height }
        });
        document.dispatchEvent(event);
    }
    
    /**
     * オリエンテーション変更の処理
     */
    handleOrientationChange() {
        const orientation = window.orientation || 0;
        const isLandscape = Math.abs(orientation) === 90;
        
        document.body.classList.toggle('orientation-landscape', isLandscape);
        document.body.classList.toggle('orientation-portrait', !isLandscape);
    }
    
    /**
     * フォーカストラップの設定
     */
    setupFocusTrap() {
        // モーダルやポップアップ内でのフォーカス制御
        this.focusableSelectors = [
            'a[href]',
            'button:not([disabled])',
            'input:not([disabled])',
            'select:not([disabled])',
            'textarea:not([disabled])',
            '[tabindex]:not([tabindex="-1"])'
        ].join(',');
    }
    
    /**
     * フォーカスをトラップ
     * @param {HTMLElement} container - コンテナ要素
     */
    trapFocus(container) {
        const focusableElements = container.querySelectorAll(this.focusableSelectors);
        const firstFocusable = focusableElements[0];
        const lastFocusable = focusableElements[focusableElements.length - 1];
        
        // 現在のフォーカスを保存
        this.previousFocus = document.activeElement;
        
        // 最初の要素にフォーカス
        if (firstFocusable) {
            firstFocusable.focus();
        }
        
        // Tabキーのトラップ
        const trapHandler = (e) => {
            if (e.key === 'Tab') {
                if (e.shiftKey) {
                    if (document.activeElement === firstFocusable) {
                        e.preventDefault();
                        lastFocusable.focus();
                    }
                } else {
                    if (document.activeElement === lastFocusable) {
                        e.preventDefault();
                        firstFocusable.focus();
                    }
                }
            }
        };
        
        container.addEventListener('keydown', trapHandler);
    }
    
    /**
     * ARIAライブリージョンの作成
     */
    createAriaLiveRegion() {
        const liveRegion = document.createElement('div');
        liveRegion.id = 'aria-live-region';
        liveRegion.className = 'sr-only';
        liveRegion.setAttribute('aria-live', 'polite');
        liveRegion.setAttribute('aria-atomic', 'true');
        document.body.appendChild(liveRegion);
        
        this.ariaLiveRegion = liveRegion;
    }
    
    /**
     * スクリーンリーダーへの通知
     * @param {string} message - 通知メッセージ
     */
    announceToScreenReader(message) {
        if (this.ariaLiveRegion) {
            this.ariaLiveRegion.textContent = message;
            
            // メッセージをクリア
            setTimeout(() => {
                this.ariaLiveRegion.textContent = '';
            }, 1000);
        }
    }
    
    /**
     * キーボードナビゲーションの強化
     */
    enhanceKeyboardNavigation() {
        // Skip to main content リンクの動作
        const skipLink = document.querySelector('.skip-to-main');
        if (skipLink) {
            skipLink.addEventListener('click', (e) => {
                e.preventDefault();
                const main = document.querySelector('main');
                if (main) {
                    main.tabIndex = -1;
                    main.focus();
                }
            });
        }
    }
    
    /**
     * プログレスバーの更新
     * @param {number} percent - パーセンテージ（0-100）
     * @param {string} label - ラベル
     */
    updateProgressBar(percent, label) {
        const progressBar = document.querySelector('.progress-fill');
        const progressText = document.querySelector('.progress-text');
        
        if (progressBar) {
            progressBar.style.width = `${percent}%`;
            progressBar.setAttribute('aria-valuenow', percent);
        }
        
        if (progressText) {
            progressText.textContent = label || `${Math.round(percent)}%`;
        }
    }
    
    /**
     * ツールチップの表示
     * @param {HTMLElement} element - 対象要素
     * @param {string} text - ツールチップテキスト
     */
    showTooltip(element, text) {
        const tooltip = document.createElement('div');
        tooltip.className = 'tooltip';
        tooltip.textContent = text;
        tooltip.setAttribute('role', 'tooltip');
        
        document.body.appendChild(tooltip);
        
        const rect = element.getBoundingClientRect();
        tooltip.style.left = `${rect.left + rect.width / 2}px`;
        tooltip.style.top = `${rect.top - 10}px`;
        
        setTimeout(() => {
            tooltip.classList.add('show');
        }, 10);
        
        // 自動削除
        setTimeout(() => {
            tooltip.classList.remove('show');
            setTimeout(() => tooltip.remove(), 300);
        }, 2000);
    }
    
    /**
     * レイアウト管理機能の初期化
     */
    initializeLayoutManager() {
        // レイアウト要素の参照を保持
        this.layoutElements = {
            header: document.querySelector('.app-header'),
            main: document.querySelector('.app-main'),
            sidebar: null, // 将来的な拡張用
            footer: null   // 将来的な拡張用
        };
        
        // レイアウトモードの設定
        this.layoutMode = this.determineLayoutMode();
        
        // レイアウトイベントの設定
        this.setupLayoutEvents();
    }
    
    /**
     * レイアウトモードの判定
     * @returns {string} 'mobile', 'tablet', 'desktop'
     */
    determineLayoutMode() {
        const width = window.innerWidth;
        if (width < 768) return 'mobile';
        if (width < 1024) return 'tablet';
        return 'desktop';
    }
    
    /**
     * レイアウトイベントの設定
     */
    setupLayoutEvents() {
        // ヘッダーの固定/非固定切り替え
        let lastScrollTop = 0;
        window.addEventListener('scroll', () => {
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            const header = this.layoutElements.header;
            
            if (header) {
                if (scrollTop > lastScrollTop && scrollTop > 100) {
                    // 下スクロール時：ヘッダーを隠す
                    header.classList.add('header-hidden');
                } else {
                    // 上スクロール時：ヘッダーを表示
                    header.classList.remove('header-hidden');
                }
                lastScrollTop = scrollTop;
            }
        });
    }
    
    /**
     * 画面遷移の管理
     * @param {string} fromView - 遷移元のビュー
     * @param {string} toView - 遷移先のビュー
     * @param {Object} options - 遷移オプション
     */
    async transitionView(fromView, toView, options = {}) {
        const duration = options.duration || 300;
        const fromElement = document.getElementById(`${fromView}-view`);
        const toElement = document.getElementById(`${toView}-view`);
        
        if (!fromElement || !toElement) {
            console.error('遷移先または遷移元のビューが見つかりません');
            return;
        }
        
        // 遷移開始イベント
        this.dispatchViewEvent('viewTransitionStart', { from: fromView, to: toView });
        
        // フェードアウト
        fromElement.style.opacity = '0';
        fromElement.style.transition = `opacity ${duration}ms ease`;
        
        await new Promise(resolve => setTimeout(resolve, duration));
        
        // ビューの切り替え
        fromElement.classList.remove('active');
        toElement.classList.add('active');
        toElement.style.opacity = '0';
        
        // フェードイン
        requestAnimationFrame(() => {
            toElement.style.transition = `opacity ${duration}ms ease`;
            toElement.style.opacity = '1';
        });
        
        await new Promise(resolve => setTimeout(resolve, duration));
        
        // クリーンアップ
        fromElement.style.removeProperty('opacity');
        fromElement.style.removeProperty('transition');
        toElement.style.removeProperty('opacity');
        toElement.style.removeProperty('transition');
        
        // 遷移完了イベント
        this.dispatchViewEvent('viewTransitionEnd', { from: fromView, to: toView });
    }
    
    /**
     * ビューイベントの発行
     */
    dispatchViewEvent(eventName, detail) {
        const event = new CustomEvent(eventName, { detail });
        document.dispatchEvent(event);
    }
    
    /**
     * モーダルの統一管理
     * @param {string} modalId - モーダルのID
     * @param {Object} options - モーダルオプション
     */
    openModal(modalId, options = {}) {
        const modal = document.getElementById(modalId);
        if (!modal) {
            console.error(`モーダル ${modalId} が見つかりません`);
            return;
        }
        
        // オプションの設定
        const modalOptions = {
            closeOnOverlay: true,
            closeOnEscape: true,
            focusTrap: true,
            ...options
        };
        
        // モーダルの表示
        modal.classList.add('modal-active');
        modal.setAttribute('aria-hidden', 'false');
        
        // オーバーレイの作成
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay';
        overlay.dataset.modalId = modalId;
        document.body.appendChild(overlay);
        
        // フォーカストラップの設定
        if (modalOptions.focusTrap) {
            this.setupModalFocusTrap(modal);
        }
        
        // イベントリスナーの設定
        if (modalOptions.closeOnOverlay) {
            overlay.addEventListener('click', () => this.closeModal(modalId));
        }
        
        if (modalOptions.closeOnEscape) {
            const escapeHandler = (e) => {
                if (e.key === 'Escape') {
                    this.closeModal(modalId);
                    document.removeEventListener('keydown', escapeHandler);
                }
            };
            document.addEventListener('keydown', escapeHandler);
        }
        
        // アクティブモーダルの追加
        this.activeModals.push({ id: modalId, options: modalOptions });
        
        // ボディのスクロール無効化
        document.body.style.overflow = 'hidden';
        
        // モーダル開始イベント
        this.dispatchModalEvent('modalOpen', { modalId });
    }
    
    /**
     * モーダルを閉じる
     * @param {string} modalId - モーダルのID
     */
    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        const overlay = document.querySelector(`.modal-overlay[data-modal-id="${modalId}"]`);
        
        if (modal) {
            modal.classList.remove('modal-active');
            modal.setAttribute('aria-hidden', 'true');
        }
        
        if (overlay) {
            overlay.remove();
        }
        
        // アクティブモーダルから削除
        this.activeModals = this.activeModals.filter(m => m.id !== modalId);
        
        // 全てのモーダルが閉じられた場合、ボディのスクロールを有効化
        if (this.activeModals.length === 0) {
            document.body.style.overflow = '';
        }
        
        // モーダル終了イベント
        this.dispatchModalEvent('modalClose', { modalId });
    }
    
    /**
     * モーダルのフォーカストラップ設定
     */
    setupModalFocusTrap(modal) {
        const focusableElements = modal.querySelectorAll(
            'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        
        if (focusableElements.length === 0) return;
        
        const firstFocusable = focusableElements[0];
        const lastFocusable = focusableElements[focusableElements.length - 1];
        
        // 最初の要素にフォーカス
        firstFocusable.focus();
        
        // タブトラップの設定
        const trapHandler = (e) => {
            if (e.key !== 'Tab') return;
            
            if (e.shiftKey && document.activeElement === firstFocusable) {
                e.preventDefault();
                lastFocusable.focus();
            } else if (!e.shiftKey && document.activeElement === lastFocusable) {
                e.preventDefault();
                firstFocusable.focus();
            }
        };
        
        modal.addEventListener('keydown', trapHandler);
        modal.dataset.focusTrapHandler = trapHandler;
    }
    
    /**
     * モーダルイベントの発行
     */
    dispatchModalEvent(eventName, detail) {
        const event = new CustomEvent(eventName, { detail });
        document.dispatchEvent(event);
    }
    
    /**
     * ポップアップの表示（統一管理）
     * @param {string} content - ポップアップの内容
     * @param {Object} options - ポップアップオプション
     */
    showPopup(content, options = {}) {
        const popupOptions = {
            position: 'center',
            type: 'info',
            autoClose: true,
            duration: 3000,
            ...options
        };
        
        // ポップアップ要素の作成
        const popup = document.createElement('div');
        popup.className = `popup popup-${popupOptions.type}`;
        popup.innerHTML = content;
        
        // 位置の設定
        this.positionPopup(popup, popupOptions.position, options.targetElement);
        
        document.body.appendChild(popup);
        
        // アニメーション
        requestAnimationFrame(() => {
            popup.classList.add('popup-show');
        });
        
        // 自動クローズ
        if (popupOptions.autoClose) {
            setTimeout(() => {
                this.closePopup(popup);
            }, popupOptions.duration);
        }
        
        return popup;
    }
    
    /**
     * ポップアップの位置設定
     */
    positionPopup(popup, position, targetElement) {
        if (position === 'center') {
            popup.style.position = 'fixed';
            popup.style.top = '50%';
            popup.style.left = '50%';
            popup.style.transform = 'translate(-50%, -50%)';
        } else if (targetElement) {
            const rect = targetElement.getBoundingClientRect();
            popup.style.position = 'absolute';
            
            switch (position) {
                case 'top':
                    popup.style.left = `${rect.left + rect.width / 2}px`;
                    popup.style.top = `${rect.top - 10}px`;
                    popup.style.transform = 'translateX(-50%) translateY(-100%)';
                    break;
                case 'bottom':
                    popup.style.left = `${rect.left + rect.width / 2}px`;
                    popup.style.top = `${rect.bottom + 10}px`;
                    popup.style.transform = 'translateX(-50%)';
                    break;
                case 'left':
                    popup.style.left = `${rect.left - 10}px`;
                    popup.style.top = `${rect.top + rect.height / 2}px`;
                    popup.style.transform = 'translateX(-100%) translateY(-50%)';
                    break;
                case 'right':
                    popup.style.left = `${rect.right + 10}px`;
                    popup.style.top = `${rect.top + rect.height / 2}px`;
                    popup.style.transform = 'translateY(-50%)';
                    break;
            }
        }
    }
    
    /**
     * ポップアップを閉じる
     */
    closePopup(popup) {
        popup.classList.remove('popup-show');
        setTimeout(() => {
            popup.remove();
        }, 300);
    }
}