/**
 * 本番環境設定ファイル
 * Production Configuration
 */

const ProductionConfig = {
    // 環境設定
    environment: 'production',
    version: '1.0.0',
    
    // デバッグ設定
    debug: {
        enabled: false,
        logLevel: 'error', // error, warn, info, debug
        showErrorDetails: false,
        preserveConsoleLog: false
    },
    
    // パフォーマンス設定
    performance: {
        enableCache: true,
        cacheVersion: 'v1.0.0',
        cacheDuration: 604800000, // 7日間（ミリ秒）
        lazyLoadImages: true,
        preloadCriticalAssets: true,
        minifyAssets: true,
        enableCompression: true
    },
    
    // セキュリティ設定
    security: {
        enableCSP: true,
        cspDirectives: {
            'default-src': ["'self'"],
            'script-src': ["'self'", "'unsafe-inline'"],
            'style-src': ["'self'", "'unsafe-inline'"],
            'img-src': ["'self'", 'data:', 'blob:'],
            'font-src': ["'self'"],
            'connect-src': ["'self'"],
            'frame-ancestors': ["'none'"],
            'form-action': ["'self'"]
        },
        enableXSSProtection: true,
        enableInputSanitization: true,
        maxStorageSize: 10485760, // 10MB
        encryptLocalStorage: true
    },
    
    // ストレージ設定
    storage: {
        prefix: 'jlrg_', // Japanese Literature Reading Game
        version: '1.0',
        compression: true,
        encryption: {
            enabled: true,
            algorithm: 'AES-GCM',
            keyDerivation: 'PBKDF2'
        }
    },
    
    // アプリケーション設定
    app: {
        title: '日本名作文学読解ゲーム',
        defaultLanguage: 'ja',
        supportedLanguages: ['ja'],
        maxConcurrentRequests: 3,
        requestTimeout: 30000, // 30秒
        retryAttempts: 3,
        retryDelay: 1000 // 1秒
    },
    
    // UI設定
    ui: {
        animations: {
            enabled: true,
            duration: 300,
            easing: 'ease-in-out'
        },
        theme: {
            default: 'light',
            allowUserSelection: true
        },
        fontSize: {
            min: 12,
            max: 24,
            default: 16
        }
    },
    
    // エラーハンドリング設定
    errorHandling: {
        showUserFriendlyMessages: true,
        logErrors: true,
        errorReportingEndpoint: null, // 将来のエラー報告用
        fallbackBehavior: 'graceful'
    },
    
    // アナリティクス設定（将来の拡張用）
    analytics: {
        enabled: false,
        trackingId: null,
        anonymizeIP: true,
        respectDoNotTrack: true
    },
    
    // 最適化設定
    optimization: {
        bundleScripts: true,
        bundleStyles: true,
        removeComments: true,
        removeWhitespace: true,
        obfuscateCode: false, // 教育目的のため無効
        enableServiceWorker: false // 初期バージョンでは無効
    },
    
    // コンテンツ設定
    content: {
        maxTextLength: 100000, // 最大10万文字
        maxAnnotations: 1000,
        maxBooksLoaded: 50,
        preloadNextChapter: true
    },
    
    // 機能フラグ
    features: {
        enableTouchGestures: true,
        enableKeyboardShortcuts: true,
        enableOfflineMode: false, // 初期バージョンでは無効
        enablePrintFunction: true,
        enableExportFunction: true,
        enableSocialSharing: false // 初期バージョンでは無効
    },
    
    // ブラウザ要件
    browserRequirements: {
        minChromeVersion: 88,
        minFirefoxVersion: 78,
        minSafariVersion: 14,
        minEdgeVersion: 88,
        checkOnStartup: true,
        showWarningForOldBrowsers: true
    }
};

// 設定の凍結（変更不可にする）
Object.freeze(ProductionConfig);
Object.freeze(ProductionConfig.debug);
Object.freeze(ProductionConfig.performance);
Object.freeze(ProductionConfig.security);
Object.freeze(ProductionConfig.security.cspDirectives);
Object.freeze(ProductionConfig.storage);
Object.freeze(ProductionConfig.storage.encryption);
Object.freeze(ProductionConfig.app);
Object.freeze(ProductionConfig.ui);
Object.freeze(ProductionConfig.ui.animations);
Object.freeze(ProductionConfig.ui.theme);
Object.freeze(ProductionConfig.ui.fontSize);
Object.freeze(ProductionConfig.errorHandling);
Object.freeze(ProductionConfig.analytics);
Object.freeze(ProductionConfig.optimization);
Object.freeze(ProductionConfig.content);
Object.freeze(ProductionConfig.features);
Object.freeze(ProductionConfig.browserRequirements);

// エクスポート
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ProductionConfig;
}