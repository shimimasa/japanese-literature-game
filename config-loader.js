/**
 * 設定ローダー
 * Configuration Loader
 * 環境に応じて適切な設定ファイルを読み込む
 */

class ConfigLoader {
    constructor() {
        this.config = null;
        this.environment = this.detectEnvironment();
    }

    /**
     * 環境を検出
     */
    detectEnvironment() {
        // URLパラメータで環境を指定可能
        const urlParams = new URLSearchParams(window.location.search);
        const envParam = urlParams.get('env');
        
        if (envParam === 'development' || envParam === 'dev') {
            return 'development';
        }
        
        // ローカルホストは開発環境
        if (window.location.hostname === 'localhost' || 
            window.location.hostname === '127.0.0.1' ||
            window.location.hostname.startsWith('192.168.') ||
            window.location.hostname.endsWith('.local')) {
            return 'development';
        }
        
        // ファイルプロトコルは開発環境
        if (window.location.protocol === 'file:') {
            return 'development';
        }
        
        // それ以外は本番環境
        return 'production';
    }

    /**
     * 設定を読み込む
     */
    async loadConfig() {
        try {
            if (this.environment === 'development') {
                // 開発環境設定を読み込む
                const script = document.createElement('script');
                script.src = 'config.development.js';
                document.head.appendChild(script);
                
                // スクリプトの読み込みを待つ
                await new Promise((resolve, reject) => {
                    script.onload = resolve;
                    script.onerror = reject;
                });
                
                this.config = window.DevelopmentConfig || DevelopmentConfig;
            } else {
                // 本番環境設定を読み込む
                const script = document.createElement('script');
                script.src = 'config.production.js';
                document.head.appendChild(script);
                
                // スクリプトの読み込みを待つ
                await new Promise((resolve, reject) => {
                    script.onload = resolve;
                    script.onerror = reject;
                });
                
                this.config = window.ProductionConfig || ProductionConfig;
            }
            
            // グローバル変数として設定
            window.AppConfig = this.config;
            
            // 環境情報をコンソールに出力（開発環境のみ）
            if (this.config.debug.enabled) {
                console.log(`環境: ${this.environment}`);
                console.log('設定:', this.config);
            }
            
            // セキュリティ設定を適用
            this.applySecuritySettings();
            
            return this.config;
            
        } catch (error) {
            console.error('設定ファイルの読み込みに失敗しました:', error);
            
            // フォールバック設定
            this.config = this.getDefaultConfig();
            window.AppConfig = this.config;
            
            return this.config;
        }
    }

    /**
     * セキュリティ設定を適用
     */
    applySecuritySettings() {
        if (!this.config.security.enableCSP) {
            return;
        }

        // Content Security Policy の設定
        const cspDirectives = [];
        for (const [directive, sources] of Object.entries(this.config.security.cspDirectives)) {
            cspDirectives.push(`${directive} ${sources.join(' ')}`);
        }
        
        const cspContent = cspDirectives.join('; ');
        const meta = document.createElement('meta');
        meta.httpEquiv = 'Content-Security-Policy';
        meta.content = cspContent;
        document.head.appendChild(meta);

        // XSS保護の設定
        if (this.config.security.enableXSSProtection) {
            const xssProtection = document.createElement('meta');
            xssProtection.httpEquiv = 'X-XSS-Protection';
            xssProtection.content = '1; mode=block';
            document.head.appendChild(xssProtection);
        }
    }

    /**
     * デフォルト設定を取得
     */
    getDefaultConfig() {
        return {
            environment: 'fallback',
            version: '1.0.0',
            debug: {
                enabled: false,
                logLevel: 'error',
                showErrorDetails: false,
                preserveConsoleLog: false
            },
            performance: {
                enableCache: true,
                lazyLoadImages: true,
                preloadCriticalAssets: true
            },
            security: {
                enableCSP: false,
                enableXSSProtection: true,
                enableInputSanitization: true,
                maxStorageSize: 5242880, // 5MB
                encryptLocalStorage: false
            },
            storage: {
                prefix: 'jlrg_',
                version: '1.0',
                compression: false,
                encryption: {
                    enabled: false
                }
            },
            app: {
                title: '日本名作文学読解ゲーム',
                defaultLanguage: 'ja',
                supportedLanguages: ['ja'],
                maxConcurrentRequests: 3,
                requestTimeout: 30000,
                retryAttempts: 3,
                retryDelay: 1000
            },
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
            errorHandling: {
                showUserFriendlyMessages: true,
                logErrors: true,
                errorReportingEndpoint: null,
                fallbackBehavior: 'graceful'
            },
            features: {
                enableTouchGestures: true,
                enableKeyboardShortcuts: true,
                enableOfflineMode: false,
                enablePrintFunction: true,
                enableExportFunction: true,
                enableSocialSharing: false
            }
        };
    }

    /**
     * 設定値を取得
     */
    get(path, defaultValue = null) {
        if (!this.config) {
            return defaultValue;
        }

        const keys = path.split('.');
        let value = this.config;

        for (const key of keys) {
            if (value && typeof value === 'object' && key in value) {
                value = value[key];
            } else {
                return defaultValue;
            }
        }

        return value;
    }

    /**
     * 環境が開発環境かどうか
     */
    isDevelopment() {
        return this.environment === 'development';
    }

    /**
     * 環境が本番環境かどうか
     */
    isProduction() {
        return this.environment === 'production';
    }

    /**
     * デバッグモードかどうか
     */
    isDebugMode() {
        return this.config && this.config.debug && this.config.debug.enabled;
    }
}

// シングルトンインスタンスを作成
const configLoader = new ConfigLoader();

// グローバル変数として公開
window.ConfigLoader = configLoader;