/**
 * パフォーマンス最適化管理クラス
 * アプリケーション全体のパフォーマンスを監視・最適化
 */

class PerformanceOptimizer {
    constructor() {
        this.config = {
            lazyLoadOffset: 50, // 画像の遅延読み込みオフセット（ピクセル）
            cacheExpiration: 24 * 60 * 60 * 1000, // キャッシュ有効期限（24時間）
            memoryThreshold: 50 * 1024 * 1024, // メモリ使用量閾値（50MB）
            debounceDelay: 300, // デバウンス遅延（ミリ秒）
            throttleDelay: 100, // スロットル遅延（ミリ秒）
            maxStorageSize: 5 * 1024 * 1024 // LocalStorage最大サイズ（5MB）
        };
        
        this.observers = new Map();
        this.performanceData = {
            loadTimes: [],
            memoryUsage: [],
            renderingTimes: []
        };
        
        this.resourceCache = new Map();
        this.pendingCleanups = new Set();
    }

    /**
     * パフォーマンス最適化の初期化
     */
    initialize() {
        this.setupLazyLoading();
        this.setupMemoryMonitoring();
        this.setupStorageOptimization();
        this.setupEventOptimization();
        this.setupResourceHints();
        
        if ('requestIdleCallback' in window) {
            requestIdleCallback(() => this.performInitialOptimizations());
        } else {
            setTimeout(() => this.performInitialOptimizations(), 1000);
        }
    }

    /**
     * 遅延読み込みの設定
     */
    setupLazyLoading() {
        // Intersection Observer API の利用
        if ('IntersectionObserver' in window) {
            const imageObserver = new IntersectionObserver(
                (entries) => this.handleImageIntersection(entries),
                {
                    rootMargin: `${this.config.lazyLoadOffset}px`
                }
            );
            
            this.observers.set('images', imageObserver);
            
            // 既存の画像要素に適用
            this.applyLazyLoadingToImages();
        } else {
            // フォールバック: スクロールイベントベース
            this.setupScrollBasedLazyLoading();
        }
    }

    /**
     * 画像要素への遅延読み込み適用
     */
    applyLazyLoadingToImages() {
        const images = document.querySelectorAll('img[data-src], img[data-lazy]');
        const observer = this.observers.get('images');
        
        images.forEach(img => {
            // プレースホルダー画像の設定
            if (!img.src) {
                img.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect width="100" height="100" fill="%23f0f0f0"/%3E%3C/svg%3E';
            }
            
            observer.observe(img);
        });
    }

    /**
     * 画像の交差検出処理
     */
    handleImageIntersection(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                const src = img.dataset.src || img.dataset.lazy;
                
                if (src) {
                    // 画像の読み込み
                    this.loadImage(img, src);
                    
                    // 監視を解除
                    this.observers.get('images').unobserve(img);
                }
            }
        });
    }

    /**
     * 画像の読み込み
     */
    async loadImage(img, src) {
        try {
            // キャッシュチェック
            if (this.resourceCache.has(src)) {
                img.src = this.resourceCache.get(src);
                img.classList.add('loaded');
                return;
            }
            
            // 新規読み込み
            const response = await fetch(src);
            const blob = await response.blob();
            const objectURL = URL.createObjectURL(blob);
            
            img.src = objectURL;
            img.classList.add('loaded');
            
            // キャッシュに保存
            this.resourceCache.set(src, objectURL);
            
            // データ属性の削除
            delete img.dataset.src;
            delete img.dataset.lazy;
            
        } catch (error) {
            console.error('画像の読み込みエラー:', error);
            img.classList.add('error');
        }
    }

    /**
     * スクロールベースの遅延読み込み（フォールバック）
     */
    setupScrollBasedLazyLoading() {
        const lazyLoadHandler = this.throttle(() => {
            const images = document.querySelectorAll('img[data-src], img[data-lazy]');
            
            images.forEach(img => {
                if (this.isElementInViewport(img)) {
                    const src = img.dataset.src || img.dataset.lazy;
                    if (src) {
                        this.loadImage(img, src);
                    }
                }
            });
        }, this.config.throttleDelay);
        
        window.addEventListener('scroll', lazyLoadHandler);
        window.addEventListener('resize', lazyLoadHandler);
    }

    /**
     * 要素がビューポート内にあるかチェック
     */
    isElementInViewport(element) {
        const rect = element.getBoundingClientRect();
        return (
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) + this.config.lazyLoadOffset &&
            rect.right <= (window.innerWidth || document.documentElement.clientWidth)
        );
    }

    /**
     * メモリ監視の設定
     */
    setupMemoryMonitoring() {
        if ('performance' in window && 'memory' in performance) {
            // 定期的なメモリチェック
            setInterval(() => {
                const memoryInfo = performance.memory;
                const usedMemory = memoryInfo.usedJSHeapSize;
                
                this.performanceData.memoryUsage.push({
                    timestamp: Date.now(),
                    used: usedMemory,
                    total: memoryInfo.totalJSHeapSize,
                    limit: memoryInfo.jsHeapSizeLimit
                });
                
                // メモリ使用量が閾値を超えた場合
                if (usedMemory > this.config.memoryThreshold) {
                    this.performMemoryCleanup();
                }
                
                // 古いデータの削除
                this.cleanupPerformanceData();
                
            }, 30000); // 30秒ごと
        }
    }

    /**
     * メモリクリーンアップ
     */
    performMemoryCleanup() {
        console.log('メモリクリーンアップを実行中...');
        
        // 未使用のリソースを解放
        this.resourceCache.forEach((url, key) => {
            if (url.startsWith('blob:')) {
                URL.revokeObjectURL(url);
            }
        });
        this.resourceCache.clear();
        
        // DOM要素のクリーンアップ
        this.cleanupDetachedNodes();
        
        // イベントリスナーのクリーンアップ
        this.cleanupEventListeners();
        
        // 強制ガベージコレクション（可能な場合）
        if (window.gc) {
            window.gc();
        }
    }

    /**
     * 切り離されたDOM要素のクリーンアップ
     */
    cleanupDetachedNodes() {
        // 一時的に作成された要素の削除
        document.querySelectorAll('.temporary, .disposable').forEach(element => {
            element.remove();
        });
        
        // 非表示の通知要素
        const oldNotifications = document.querySelectorAll('.notification.hidden');
        oldNotifications.forEach(notification => {
            if (Date.now() - notification.dataset.timestamp > 60000) { // 1分以上経過
                notification.remove();
            }
        });
    }

    /**
     * イベントリスナーのクリーンアップ
     */
    cleanupEventListeners() {
        // WeakMapを使用して管理されているリスナーをクリーンアップ
        this.pendingCleanups.forEach(cleanup => {
            if (typeof cleanup === 'function') {
                cleanup();
            }
        });
        this.pendingCleanups.clear();
    }

    /**
     * LocalStorage最適化の設定
     */
    setupStorageOptimization() {
        // 定期的なストレージクリーンアップ
        setInterval(() => {
            this.optimizeLocalStorage();
        }, 3600000); // 1時間ごと
        
        // ストレージイベントの監視
        window.addEventListener('storage', (e) => {
            if (e.key === null) return; // クリア操作の場合
            this.checkStorageQuota();
        });
    }

    /**
     * LocalStorageの最適化
     */
    optimizeLocalStorage() {
        const now = Date.now();
        const keysToRemove = [];
        let totalSize = 0;
        
        // 各アイテムのチェック
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            const value = localStorage.getItem(key);
            const size = (key.length + value.length) * 2; // UTF-16として計算
            
            totalSize += size;
            
            // 有効期限チェック
            try {
                const data = JSON.parse(value);
                if (data.expiry && data.expiry < now) {
                    keysToRemove.push(key);
                }
            } catch (e) {
                // JSONでない場合はスキップ
            }
            
            // 古いセッションデータ
            if (key.startsWith('session_') && key.includes('_old')) {
                keysToRemove.push(key);
            }
        }
        
        // サイズ制限チェック
        if (totalSize > this.config.maxStorageSize) {
            // 最も古いデータから削除
            const sortedKeys = this.getStorageKeysSortedByAge();
            const targetSize = this.config.maxStorageSize * 0.8; // 80%まで削減
            
            while (totalSize > targetSize && sortedKeys.length > 0) {
                const keyToRemove = sortedKeys.shift();
                const value = localStorage.getItem(keyToRemove);
                totalSize -= (keyToRemove.length + value.length) * 2;
                keysToRemove.push(keyToRemove);
            }
        }
        
        // 削除実行
        keysToRemove.forEach(key => {
            localStorage.removeItem(key);
        });
        
        if (keysToRemove.length > 0) {
            console.log(`LocalStorage: ${keysToRemove.length}個のアイテムを削除しました`);
        }
    }

    /**
     * ストレージキーを古い順にソート
     */
    getStorageKeysSortedByAge() {
        const keys = [];
        
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            let timestamp = 0;
            
            try {
                const data = JSON.parse(localStorage.getItem(key));
                timestamp = data.timestamp || 0;
            } catch (e) {
                // タイムスタンプなし
            }
            
            keys.push({ key, timestamp });
        }
        
        return keys
            .sort((a, b) => a.timestamp - b.timestamp)
            .map(item => item.key);
    }

    /**
     * ストレージ容量チェック
     */
    async checkStorageQuota() {
        if ('storage' in navigator && 'estimate' in navigator.storage) {
            const estimate = await navigator.storage.estimate();
            const percentUsed = (estimate.usage / estimate.quota) * 100;
            
            if (percentUsed > 90) {
                console.warn(`ストレージ使用率が高くなっています: ${percentUsed.toFixed(2)}%`);
                this.optimizeLocalStorage();
            }
        }
    }

    /**
     * イベント最適化の設定
     */
    setupEventOptimization() {
        // パッシブイベントリスナーの使用
        const passiveSupported = this.checkPassiveSupport();
        
        if (passiveSupported) {
            // スクロールとタッチイベントをパッシブに
            document.addEventListener('touchstart', () => {}, { passive: true });
            document.addEventListener('touchmove', () => {}, { passive: true });
            document.addEventListener('wheel', () => {}, { passive: true });
        }
        
        // イベントデリゲーション
        this.setupEventDelegation();
    }

    /**
     * パッシブイベントリスナーのサポートチェック
     */
    checkPassiveSupport() {
        let passiveSupported = false;
        
        try {
            const options = {
                get passive() {
                    passiveSupported = true;
                    return false;
                }
            };
            
            window.addEventListener('test', null, options);
            window.removeEventListener('test', null, options);
        } catch (err) {
            passiveSupported = false;
        }
        
        return passiveSupported;
    }

    /**
     * イベントデリゲーションの設定
     */
    setupEventDelegation() {
        // クリックイベントの最適化
        document.body.addEventListener('click', (e) => {
            const target = e.target;
            
            // ボタンクリック
            if (target.matches('button, .btn')) {
                // ダブルクリック防止
                if (target.dataset.clicking) return;
                
                target.dataset.clicking = 'true';
                setTimeout(() => {
                    delete target.dataset.clicking;
                }, 500);
            }
        });
    }

    /**
     * リソースヒントの設定
     */
    setupResourceHints() {
        // 重要なリソースのプリロード
        this.addResourceHint('preload', '/fonts/main-font.woff2', 'font');
        
        // 次に必要になりそうなリソースのプリフェッチ
        this.addResourceHint('prefetch', '/books/popular.json');
        
        // 外部ドメインへの事前接続
        this.addResourceHint('preconnect', 'https://cdn.jsdelivr.net');
    }

    /**
     * リソースヒントの追加
     */
    addResourceHint(rel, href, as = null) {
        const link = document.createElement('link');
        link.rel = rel;
        link.href = href;
        
        if (as) {
            link.as = as;
        }
        
        if (rel === 'preload' && as === 'font') {
            link.crossOrigin = 'anonymous';
        }
        
        document.head.appendChild(link);
    }

    /**
     * 初期最適化の実行
     */
    performInitialOptimizations() {
        // 不要な空白の削除
        this.removeUnnecessaryWhitespace();
        
        // CSSの最適化
        this.optimizeCSS();
        
        // 未使用のスクリプトの遅延
        this.deferUnusedScripts();
    }

    /**
     * 不要な空白の削除
     */
    removeUnnecessaryWhitespace() {
        const textNodes = document.createTreeWalker(
            document.body,
            NodeFilter.SHOW_TEXT,
            {
                acceptNode: (node) => {
                    return node.nodeValue.trim() === '' 
                        ? NodeFilter.FILTER_ACCEPT 
                        : NodeFilter.FILTER_REJECT;
                }
            }
        );
        
        const nodesToRemove = [];
        while (textNodes.nextNode()) {
            nodesToRemove.push(textNodes.currentNode);
        }
        
        nodesToRemove.forEach(node => node.remove());
    }

    /**
     * CSSの最適化
     */
    optimizeCSS() {
        // 未使用のCSSルールの検出（簡易版）
        const stylesheets = Array.from(document.styleSheets);
        
        stylesheets.forEach(sheet => {
            try {
                const rules = Array.from(sheet.cssRules || sheet.rules);
                
                rules.forEach((rule, index) => {
                    if (rule.selectorText) {
                        try {
                            const elements = document.querySelectorAll(rule.selectorText);
                            if (elements.length === 0) {
                                // 未使用のルール（ただし、疑似要素や状態は保持）
                                if (!rule.selectorText.includes(':') && 
                                    !rule.selectorText.includes('::')) {
                                    console.log('未使用のCSSルール:', rule.selectorText);
                                }
                            }
                        } catch (e) {
                            // 無効なセレクタはスキップ
                        }
                    }
                });
            } catch (e) {
                // クロスオリジンのスタイルシートはスキップ
            }
        });
    }

    /**
     * 未使用スクリプトの遅延
     */
    deferUnusedScripts() {
        const scripts = document.querySelectorAll('script[data-defer]');
        
        scripts.forEach(script => {
            script.setAttribute('defer', '');
        });
    }

    /**
     * パフォーマンスデータのクリーンアップ
     */
    cleanupPerformanceData() {
        const cutoffTime = Date.now() - 3600000; // 1時間前
        
        ['loadTimes', 'memoryUsage', 'renderingTimes'].forEach(key => {
            this.performanceData[key] = this.performanceData[key].filter(
                item => item.timestamp > cutoffTime
            );
        });
    }

    /**
     * デバウンス関数
     */
    debounce(func, delay) {
        let timeoutId;
        
        return function debounced(...args) {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => func.apply(this, args), delay);
        };
    }

    /**
     * スロットル関数
     */
    throttle(func, delay) {
        let lastCall = 0;
        let timeoutId;
        
        return function throttled(...args) {
            const now = Date.now();
            const timeSinceLastCall = now - lastCall;
            
            if (timeSinceLastCall >= delay) {
                lastCall = now;
                func.apply(this, args);
            } else {
                clearTimeout(timeoutId);
                timeoutId = setTimeout(() => {
                    lastCall = Date.now();
                    func.apply(this, args);
                }, delay - timeSinceLastCall);
            }
        };
    }

    /**
     * パフォーマンス測定
     */
    measurePerformance(name, func) {
        const startTime = performance.now();
        
        const result = func();
        
        const endTime = performance.now();
        const duration = endTime - startTime;
        
        this.performanceData.renderingTimes.push({
            name,
            duration,
            timestamp: Date.now()
        });
        
        if (duration > 16.67) { // 60fps = 16.67ms/frame
            console.warn(`パフォーマンス警告: ${name} が ${duration.toFixed(2)}ms かかりました`);
        }
        
        return result;
    }

    /**
     * クリーンアップ
     */
    destroy() {
        // オブザーバーの停止
        this.observers.forEach(observer => observer.disconnect());
        this.observers.clear();
        
        // リソースの解放
        this.resourceCache.forEach((url, key) => {
            if (url.startsWith('blob:')) {
                URL.revokeObjectURL(url);
            }
        });
        this.resourceCache.clear();
        
        // クリーンアップ関数の実行
        this.cleanupEventListeners();
    }
}