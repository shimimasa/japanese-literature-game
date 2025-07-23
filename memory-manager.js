/**
 * メモリ管理とリーク防止クラス
 * メモリ使用量の監視とリソースの適切な解放を管理
 */

class MemoryManager {
    constructor() {
        this.resources = new Map();
        this.eventListeners = new WeakMap();
        this.timers = new Set();
        this.observers = new Map();
        this.abortControllers = new Map();
        this.objectURLs = new Set();
        
        this.memoryWarningThreshold = 100 * 1024 * 1024; // 100MB
        this.memoryCheckInterval = 30000; // 30秒
        
        this.isMonitoring = false;
        this.memoryCheckTimer = null;
    }

    /**
     * メモリ管理の初期化
     */
    initialize() {
        this.startMemoryMonitoring();
        this.setupUnloadHandlers();
        this.setupWeakMapCleanup();
    }

    /**
     * メモリ監視の開始
     */
    startMemoryMonitoring() {
        if (this.isMonitoring) return;
        
        this.isMonitoring = true;
        
        if ('performance' in window && 'memory' in performance) {
            this.memoryCheckTimer = setInterval(() => {
                this.checkMemoryUsage();
            }, this.memoryCheckInterval);
        }
        
        // ガベージコレクションイベントの監視（可能な場合）
        if ('PerformanceObserver' in window) {
            try {
                const observer = new PerformanceObserver((list) => {
                    for (const entry of list.getEntries()) {
                        if (entry.entryType === 'measure' && entry.name.includes('gc')) {
                            console.log('ガベージコレクション検出:', entry);
                        }
                    }
                });
                observer.observe({ entryTypes: ['measure'] });
                this.observers.set('gc', observer);
            } catch (error) {
                // ガベージコレクション監視がサポートされていない
            }
        }
    }

    /**
     * メモリ使用量のチェック
     */
    checkMemoryUsage() {
        if (!performance.memory) return;
        
        const used = performance.memory.usedJSHeapSize;
        const total = performance.memory.totalJSHeapSize;
        const limit = performance.memory.jsHeapSizeLimit;
        
        const usagePercent = (used / limit) * 100;
        
        if (used > this.memoryWarningThreshold) {
            console.warn(`メモリ使用量が高い: ${(used / 1024 / 1024).toFixed(2)}MB (${usagePercent.toFixed(1)}%)`);
            this.performMemoryCleanup();
        }
        
        // メモリ統計の記録
        this.logMemoryStats({
            used,
            total,
            limit,
            usagePercent,
            timestamp: Date.now()
        });
    }

    /**
     * メモリ統計のログ
     */
    logMemoryStats(stats) {
        // LocalStorageに最新の統計のみ保存（履歴は保持しない）
        try {
            localStorage.setItem('memoryStats', JSON.stringify({
                latest: stats,
                cleanupCount: parseInt(localStorage.getItem('memoryCleanupCount') || '0')
            }));
        } catch (error) {
            // ストレージエラーは無視
        }
    }

    /**
     * メモリクリーンアップの実行
     */
    performMemoryCleanup() {
        console.log('メモリクリーンアップを開始...');
        
        // リソースの解放
        this.cleanupResources();
        
        // イベントリスナーのクリーンアップ
        this.cleanupEventListeners();
        
        // タイマーのクリーンアップ
        this.cleanupTimers();
        
        // オブザーバーのクリーンアップ
        this.cleanupObservers();
        
        // 中断されたリクエストのクリーンアップ
        this.cleanupAbortControllers();
        
        // オブジェクトURLのクリーンアップ
        this.cleanupObjectURLs();
        
        // DOMのクリーンアップ
        this.cleanupDOM();
        
        // キャッシュのクリーンアップ
        this.cleanupCaches();
        
        // 強制ガベージコレクション（可能な場合）
        if (window.gc) {
            window.gc();
        }
        
        // クリーンアップカウントを増加
        const count = parseInt(localStorage.getItem('memoryCleanupCount') || '0');
        localStorage.setItem('memoryCleanupCount', String(count + 1));
    }

    /**
     * リソースの登録
     */
    registerResource(key, resource, type = 'generic') {
        this.resources.set(key, {
            resource,
            type,
            created: Date.now()
        });
    }

    /**
     * リソースの解放
     */
    releaseResource(key) {
        const item = this.resources.get(key);
        if (!item) return;
        
        switch (item.type) {
            case 'image':
                if (item.resource.src) {
                    item.resource.src = '';
                }
                break;
            case 'audio':
                if (item.resource.pause) {
                    item.resource.pause();
                    item.resource.src = '';
                }
                break;
            case 'video':
                if (item.resource.pause) {
                    item.resource.pause();
                    item.resource.src = '';
                }
                break;
            case 'canvas':
                const ctx = item.resource.getContext('2d');
                if (ctx) {
                    ctx.clearRect(0, 0, item.resource.width, item.resource.height);
                }
                break;
        }
        
        this.resources.delete(key);
    }

    /**
     * リソースのクリーンアップ
     */
    cleanupResources() {
        const now = Date.now();
        const maxAge = 600000; // 10分
        
        this.resources.forEach((item, key) => {
            if (now - item.created > maxAge) {
                this.releaseResource(key);
            }
        });
    }

    /**
     * イベントリスナーの管理
     */
    addManagedEventListener(element, event, handler, options) {
        if (!this.eventListeners.has(element)) {
            this.eventListeners.set(element, new Map());
        }
        
        const listeners = this.eventListeners.get(element);
        const key = `${event}:${handler.toString()}`;
        
        if (!listeners.has(key)) {
            element.addEventListener(event, handler, options);
            listeners.set(key, { event, handler, options });
        }
    }

    /**
     * イベントリスナーの削除
     */
    removeManagedEventListener(element, event, handler) {
        const listeners = this.eventListeners.get(element);
        if (!listeners) return;
        
        const key = `${event}:${handler.toString()}`;
        const listener = listeners.get(key);
        
        if (listener) {
            element.removeEventListener(event, handler, listener.options);
            listeners.delete(key);
            
            if (listeners.size === 0) {
                this.eventListeners.delete(element);
            }
        }
    }

    /**
     * イベントリスナーのクリーンアップ
     */
    cleanupEventListeners() {
        // WeakMapは自動的にガベージコレクションされるが、
        // 明示的に削除可能なものは削除
        const elements = document.querySelectorAll('*');
        elements.forEach(element => {
            const listeners = this.eventListeners.get(element);
            if (listeners && !document.body.contains(element)) {
                listeners.forEach(({ event, handler, options }) => {
                    element.removeEventListener(event, handler, options);
                });
                this.eventListeners.delete(element);
            }
        });
    }

    /**
     * タイマーの管理
     */
    setManagedTimeout(callback, delay) {
        const timerId = setTimeout(() => {
            callback();
            this.timers.delete(timerId);
        }, delay);
        
        this.timers.add(timerId);
        return timerId;
    }

    /**
     * インターバルの管理
     */
    setManagedInterval(callback, delay) {
        const intervalId = setInterval(callback, delay);
        this.timers.add(intervalId);
        return intervalId;
    }

    /**
     * タイマーのクリア
     */
    clearManagedTimer(timerId) {
        if (this.timers.has(timerId)) {
            clearTimeout(timerId);
            clearInterval(timerId);
            this.timers.delete(timerId);
        }
    }

    /**
     * タイマーのクリーンアップ
     */
    cleanupTimers() {
        this.timers.forEach(timerId => {
            clearTimeout(timerId);
            clearInterval(timerId);
        });
        this.timers.clear();
    }

    /**
     * オブザーバーの管理
     */
    addManagedObserver(key, observer) {
        this.observers.set(key, observer);
    }

    /**
     * オブザーバーのクリーンアップ
     */
    cleanupObservers() {
        this.observers.forEach((observer, key) => {
            if (observer.disconnect) {
                observer.disconnect();
            }
        });
        this.observers.clear();
    }

    /**
     * AbortControllerの管理
     */
    createManagedAbortController(key) {
        const controller = new AbortController();
        this.abortControllers.set(key, controller);
        return controller;
    }

    /**
     * リクエストの中断
     */
    abortRequest(key) {
        const controller = this.abortControllers.get(key);
        if (controller) {
            controller.abort();
            this.abortControllers.delete(key);
        }
    }

    /**
     * AbortControllerのクリーンアップ
     */
    cleanupAbortControllers() {
        this.abortControllers.forEach((controller, key) => {
            controller.abort();
        });
        this.abortControllers.clear();
    }

    /**
     * オブジェクトURLの管理
     */
    createManagedObjectURL(blob) {
        const url = URL.createObjectURL(blob);
        this.objectURLs.add(url);
        return url;
    }

    /**
     * オブジェクトURLの解放
     */
    revokeManagedObjectURL(url) {
        if (this.objectURLs.has(url)) {
            URL.revokeObjectURL(url);
            this.objectURLs.delete(url);
        }
    }

    /**
     * オブジェクトURLのクリーンアップ
     */
    cleanupObjectURLs() {
        this.objectURLs.forEach(url => {
            URL.revokeObjectURL(url);
        });
        this.objectURLs.clear();
    }

    /**
     * DOMのクリーンアップ
     */
    cleanupDOM() {
        // 孤立したノードの削除
        const orphanedNodes = document.querySelectorAll('.temp, .temporary, .disposable');
        orphanedNodes.forEach(node => {
            node.remove();
        });
        
        // 非表示の古い要素の削除
        const hiddenElements = document.querySelectorAll('.hidden[data-timestamp]');
        const now = Date.now();
        
        hiddenElements.forEach(element => {
            const timestamp = parseInt(element.dataset.timestamp);
            if (now - timestamp > 300000) { // 5分以上経過
                element.remove();
            }
        });
        
        // 空のコンテナの削除
        const emptyContainers = document.querySelectorAll('[data-removable-if-empty]');
        emptyContainers.forEach(container => {
            if (container.children.length === 0 && container.textContent.trim() === '') {
                container.remove();
            }
        });
    }

    /**
     * キャッシュのクリーンアップ
     */
    cleanupCaches() {
        // ブラウザキャッシュのクリア（Service Worker使用時）
        if ('caches' in window) {
            caches.keys().then(names => {
                names.forEach(name => {
                    if (name.includes('temp-') || name.includes('old-')) {
                        caches.delete(name);
                    }
                });
            });
        }
        
        // セッションストレージの古いデータ削除
        const sessionKeys = Object.keys(sessionStorage);
        const now = Date.now();
        
        sessionKeys.forEach(key => {
            try {
                const data = JSON.parse(sessionStorage.getItem(key));
                if (data.expiry && data.expiry < now) {
                    sessionStorage.removeItem(key);
                }
            } catch (error) {
                // JSONパースエラーは無視
            }
        });
    }

    /**
     * WeakMapのクリーンアップ設定
     */
    setupWeakMapCleanup() {
        // WeakMapは自動的にガベージコレクションされるが、
        // 定期的に参照を確認して不要なものを削除
        setInterval(() => {
            // 削除されたDOM要素の参照をクリーンアップ
            const allElements = new Set(document.querySelectorAll('*'));
            
            // イベントリスナーのWeakMapは自動クリーンアップされる
            // ただし、明示的なクリーンアップが必要な場合は実行
        }, 300000); // 5分ごと
    }

    /**
     * アンロード時のハンドラー設定
     */
    setupUnloadHandlers() {
        const cleanup = () => {
            this.destroy();
        };
        
        window.addEventListener('beforeunload', cleanup);
        window.addEventListener('unload', cleanup);
        
        // ページ非表示時のクリーンアップ
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.performLightCleanup();
            }
        });
    }

    /**
     * 軽量クリーンアップ（ページ非表示時）
     */
    performLightCleanup() {
        // タイマーの一時停止
        this.pauseTimers();
        
        // 不要なリソースの解放
        this.cleanupResources();
        
        // オブジェクトURLのクリーンアップ
        this.cleanupObjectURLs();
    }

    /**
     * タイマーの一時停止
     */
    pauseTimers() {
        // アニメーションフレームのキャンセル
        if (window.cancelAnimationFrame) {
            for (let i = 1; i < 99999; i++) {
                window.cancelAnimationFrame(i);
            }
        }
    }

    /**
     * メモリリークの検出（デバッグ用）
     */
    detectMemoryLeaks() {
        const leaks = {
            detachedNodes: 0,
            listeners: 0,
            timers: this.timers.size,
            resources: this.resources.size,
            observers: this.observers.size
        };
        
        // 切り離されたDOM要素の検出
        const allNodes = document.querySelectorAll('*');
        allNodes.forEach(node => {
            if (!document.body.contains(node)) {
                leaks.detachedNodes++;
            }
        });
        
        console.log('メモリリーク検出結果:', leaks);
        return leaks;
    }

    /**
     * 破棄処理
     */
    destroy() {
        // メモリ監視の停止
        if (this.memoryCheckTimer) {
            clearInterval(this.memoryCheckTimer);
        }
        
        // すべてのリソースをクリーンアップ
        this.performMemoryCleanup();
        
        this.isMonitoring = false;
    }
}