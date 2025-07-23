/**
 * 開発環境設定ファイル
 * Development Configuration
 */

const DevelopmentConfig = {
    // 環境設定
    environment: 'development',
    version: '1.0.0-dev',
    
    // デバッグ設定
    debug: {
        enabled: true,
        logLevel: 'debug', // error, warn, info, debug
        showErrorDetails: true,
        preserveConsoleLog: true,
        showPerformanceMetrics: true,
        enableDebugPanel: true
    },
    
    // パフォーマンス設定
    performance: {
        enableCache: false, // 開発時はキャッシュ無効
        cacheVersion: 'dev',
        cacheDuration: 0,
        lazyLoadImages: false,
        preloadCriticalAssets: false,
        minifyAssets: false,
        enableCompression: false
    },
    
    // セキュリティ設定（開発環境では緩和）
    security: {
        enableCSP: false, // 開発時は無効
        cspDirectives: {},
        enableXSSProtection: true,
        enableInputSanitization: true,
        maxStorageSize: 52428800, // 50MB（開発時は大きめ）
        encryptLocalStorage: false // 開発時は無効
    },
    
    // ストレージ設定
    storage: {
        prefix: 'jlrg_dev_',
        version: '1.0',
        compression: false,
        encryption: {
            enabled: false,
            algorithm: 'none',
            keyDerivation: 'none'
        }
    },
    
    // アプリケーション設定
    app: {
        title: '日本名作文学読解ゲーム (開発版)',
        defaultLanguage: 'ja',
        supportedLanguages: ['ja'],
        maxConcurrentRequests: 10, // 開発時は多め
        requestTimeout: 60000, // 60秒（開発時は長め）
        retryAttempts: 1,
        retryDelay: 500
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
            min: 10,
            max: 32,
            default: 16
        },
        showDevTools: true,
        showDebugInfo: true
    },
    
    // エラーハンドリング設定
    errorHandling: {
        showUserFriendlyMessages: false, // 開発時は詳細表示
        logErrors: true,
        errorReportingEndpoint: null,
        fallbackBehavior: 'strict', // 開発時は厳密に
        breakOnError: true
    },
    
    // アナリティクス設定
    analytics: {
        enabled: false,
        trackingId: null,
        anonymizeIP: true,
        respectDoNotTrack: true
    },
    
    // 最適化設定
    optimization: {
        bundleScripts: false,
        bundleStyles: false,
        removeComments: false,
        removeWhitespace: false,
        obfuscateCode: false,
        enableServiceWorker: false
    },
    
    // コンテンツ設定
    content: {
        maxTextLength: 1000000, // 開発時は大きめ
        maxAnnotations: 10000,
        maxBooksLoaded: 100,
        preloadNextChapter: false
    },
    
    // 機能フラグ
    features: {
        enableTouchGestures: true,
        enableKeyboardShortcuts: true,
        enableOfflineMode: false,
        enablePrintFunction: true,
        enableExportFunction: true,
        enableSocialSharing: false,
        enableDevFeatures: true, // 開発機能
        enableMockData: true // モックデータ
    },
    
    // ブラウザ要件（開発時は緩和）
    browserRequirements: {
        minChromeVersion: 80,
        minFirefoxVersion: 70,
        minSafariVersion: 13,
        minEdgeVersion: 80,
        checkOnStartup: false,
        showWarningForOldBrowsers: false
    },
    
    // 開発専用設定
    development: {
        hotReload: true,
        sourceMaps: true,
        verboseLogging: true,
        mockDelay: 0, // API遅延シミュレーション（ミリ秒）
        testMode: false,
        skipValidation: false
    }
};

// エクスポート（開発環境では凍結しない）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DevelopmentConfig;
}