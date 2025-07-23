/**
 * ブラウザ互換性チェッカー
 * Browser Compatibility Checker
 * 対応ブラウザの確認と機能検出
 */

class BrowserCompatibility {
    constructor() {
        this.results = {
            browser: {},
            features: {},
            css: {},
            performance: {},
            warnings: [],
            errors: []
        };
    }

    /**
     * 完全な互換性チェックを実行
     */
    async runFullCheck() {
        console.log('ブラウザ互換性チェックを開始します...\n');
        
        // ブラウザ情報を取得
        this.detectBrowser();
        
        // 各種チェックを実行
        this.checkRequiredFeatures();
        this.checkCSSFeatures();
        this.checkJavaScriptAPIs();
        this.checkPerformanceAPIs();
        this.checkStorageAPIs();
        this.checkSecurityFeatures();
        
        // 結果を表示
        this.displayResults();
        
        return this.results;
    }

    /**
     * ブラウザ情報を検出
     */
    detectBrowser() {
        const ua = navigator.userAgent;
        const browser = {
            name: 'Unknown',
            version: '0',
            engine: 'Unknown',
            mobile: /Mobile|Android|iPhone|iPad/.test(ua)
        };

        // Chrome
        if (ua.includes('Chrome') && !ua.includes('Edge')) {
            browser.name = 'Chrome';
            browser.version = ua.match(/Chrome\/(\d+)/)?.[1] || '0';
            browser.engine = 'Blink';
        }
        // Firefox
        else if (ua.includes('Firefox')) {
            browser.name = 'Firefox';
            browser.version = ua.match(/Firefox\/(\d+)/)?.[1] || '0';
            browser.engine = 'Gecko';
        }
        // Safari
        else if (ua.includes('Safari') && !ua.includes('Chrome')) {
            browser.name = 'Safari';
            browser.version = ua.match(/Version\/(\d+)/)?.[1] || '0';
            browser.engine = 'WebKit';
        }
        // Edge
        else if (ua.includes('Edge') || ua.includes('Edg/')) {
            browser.name = 'Edge';
            browser.version = ua.match(/Edg?\/(\d+)/)?.[1] || '0';
            browser.engine = 'Blink';
        }

        this.results.browser = browser;

        // バージョンチェック
        const minVersions = {
            Chrome: 88,
            Firefox: 78,
            Safari: 14,
            Edge: 88
        };

        const minVersion = minVersions[browser.name] || 0;
        if (parseInt(browser.version) < minVersion) {
            this.results.warnings.push({
                type: 'Browser Version',
                message: `${browser.name} ${browser.version}は古いバージョンです。${minVersion}以上を推奨します。`
            });
        }
    }

    /**
     * 必須機能のチェック
     */
    checkRequiredFeatures() {
        const requiredFeatures = {
            'CSS Writing Modes': () => CSS.supports('writing-mode', 'vertical-rl'),
            'CSS Custom Properties': () => CSS.supports('--test', '1'),
            'ES6 Classes': () => {
                try {
                    eval('class Test {}');
                    return true;
                } catch (e) {
                    return false;
                }
            },
            'Async/Await': () => {
                try {
                    eval('async function test() { await Promise.resolve(); }');
                    return true;
                } catch (e) {
                    return false;
                }
            },
            'Fetch API': () => typeof fetch === 'function',
            'LocalStorage': () => {
                try {
                    localStorage.setItem('test', 'test');
                    localStorage.removeItem('test');
                    return true;
                } catch (e) {
                    return false;
                }
            },
            'JSON': () => typeof JSON === 'object' && typeof JSON.parse === 'function'
        };

        for (const [feature, test] of Object.entries(requiredFeatures)) {
            const supported = test();
            this.results.features[feature] = supported;
            
            if (!supported) {
                this.results.errors.push({
                    type: 'Required Feature',
                    feature: feature,
                    message: `${feature}はサポートされていません。アプリケーションが正常に動作しない可能性があります。`
                });
            }
        }
    }

    /**
     * CSS機能のチェック
     */
    checkCSSFeatures() {
        const cssFeatures = {
            'writing-mode: vertical-rl': CSS.supports('writing-mode', 'vertical-rl'),
            'text-orientation: mixed': CSS.supports('text-orientation', 'mixed'),
            'CSS Grid': CSS.supports('display', 'grid'),
            'CSS Flexbox': CSS.supports('display', 'flex'),
            'CSS Transforms': CSS.supports('transform', 'rotate(45deg)'),
            'CSS Transitions': CSS.supports('transition', 'all 0.3s'),
            'CSS Animations': CSS.supports('animation', 'test 1s'),
            'CSS Filters': CSS.supports('filter', 'blur(5px)'),
            'CSS Variables': CSS.supports('color', 'var(--test)'),
            'CSS calc()': CSS.supports('width', 'calc(100% - 20px)'),
            'CSS Media Queries': window.matchMedia !== undefined,
            'CSS :has()': CSS.supports('selector(:has(p))'),
            'CSS container queries': CSS.supports('container-type', 'inline-size')
        };

        for (const [feature, supported] of Object.entries(cssFeatures)) {
            this.results.css[feature] = supported;
            
            // 縦書き関連の機能は必須
            if ((feature.includes('writing-mode') || feature.includes('text-orientation')) && !supported) {
                this.results.errors.push({
                    type: 'CSS Feature',
                    feature: feature,
                    message: `${feature}はサポートされていません。縦書き表示が正常に動作しません。`
                });
            }
        }
    }

    /**
     * JavaScript APIのチェック
     */
    checkJavaScriptAPIs() {
        const jsAPIs = {
            'Promise': typeof Promise !== 'undefined',
            'Array.from': typeof Array.from === 'function',
            'Array.includes': typeof Array.prototype.includes === 'function',
            'Object.assign': typeof Object.assign === 'function',
            'Object.entries': typeof Object.entries === 'function',
            'String.padStart': typeof String.prototype.padStart === 'function',
            'String.includes': typeof String.prototype.includes === 'function',
            'Map': typeof Map !== 'undefined',
            'Set': typeof Set !== 'undefined',
            'Symbol': typeof Symbol !== 'undefined',
            'Proxy': typeof Proxy !== 'undefined',
            'URLSearchParams': typeof URLSearchParams !== 'undefined',
            'DOMParser': typeof DOMParser !== 'undefined',
            'FormData': typeof FormData !== 'undefined'
        };

        for (const [api, supported] of Object.entries(jsAPIs)) {
            this.results.features[api] = supported;
            
            // 必須API
            const requiredAPIs = ['Promise', 'Array.from', 'Object.assign', 'DOMParser'];
            if (requiredAPIs.includes(api) && !supported) {
                this.results.errors.push({
                    type: 'JavaScript API',
                    feature: api,
                    message: `${api}はサポートされていません。`
                });
            }
        }
    }

    /**
     * パフォーマンスAPIのチェック
     */
    checkPerformanceAPIs() {
        const perfAPIs = {
            'Performance API': typeof performance !== 'undefined',
            'Performance.now': typeof performance?.now === 'function',
            'Navigation Timing': typeof performance?.timing !== 'undefined',
            'Resource Timing': typeof performance?.getEntriesByType === 'function',
            'User Timing': typeof performance?.mark === 'function',
            'requestAnimationFrame': typeof requestAnimationFrame === 'function',
            'requestIdleCallback': typeof requestIdleCallback === 'function'
        };

        for (const [api, supported] of Object.entries(perfAPIs)) {
            this.results.performance[api] = supported;
        }
    }

    /**
     * ストレージAPIのチェック
     */
    checkStorageAPIs() {
        const storageAPIs = {
            'localStorage': () => {
                try {
                    const test = 'test';
                    localStorage.setItem(test, test);
                    localStorage.removeItem(test);
                    return true;
                } catch (e) {
                    return false;
                }
            },
            'sessionStorage': () => {
                try {
                    const test = 'test';
                    sessionStorage.setItem(test, test);
                    sessionStorage.removeItem(test);
                    return true;
                } catch (e) {
                    return false;
                }
            },
            'IndexedDB': typeof indexedDB !== 'undefined',
            'Cache API': 'caches' in window,
            'Storage estimate': typeof navigator?.storage?.estimate === 'function'
        };

        for (const [api, test] of Object.entries(storageAPIs)) {
            const supported = typeof test === 'function' ? test() : test;
            this.results.features[api] = supported;
            
            if (api === 'localStorage' && !supported) {
                this.results.errors.push({
                    type: 'Storage',
                    feature: api,
                    message: 'LocalStorageが使用できません。進捗が保存されません。'
                });
            }
        }
    }

    /**
     * セキュリティ機能のチェック
     */
    checkSecurityFeatures() {
        const securityFeatures = {
            'HTTPS': window.location.protocol === 'https:',
            'Crypto API': typeof crypto !== 'undefined',
            'Crypto.getRandomValues': typeof crypto?.getRandomValues === 'function',
            'CSP Support': () => {
                // CSPのサポートは直接検出が難しいため、メタタグで確認
                const cspMeta = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
                return cspMeta !== null;
            },
            'Referrer Policy': () => {
                const meta = document.querySelector('meta[name="referrer"]');
                return meta !== null;
            }
        };

        for (const [feature, test] of Object.entries(securityFeatures)) {
            const supported = typeof test === 'function' ? test() : test;
            this.results.features[feature] = supported;
        }
    }

    /**
     * 結果を表示
     */
    displayResults() {
        console.log('\n========== ブラウザ互換性チェック結果 ==========\n');
        
        // ブラウザ情報
        console.log('📱 ブラウザ情報:');
        console.log(`  名前: ${this.results.browser.name}`);
        console.log(`  バージョン: ${this.results.browser.version}`);
        console.log(`  エンジン: ${this.results.browser.engine}`);
        console.log(`  モバイル: ${this.results.browser.mobile ? 'はい' : 'いいえ'}`);
        console.log('');
        
        // エラー
        if (this.results.errors.length > 0) {
            console.log('❌ エラー:');
            this.results.errors.forEach(error => {
                console.log(`  - [${error.type}] ${error.message}`);
            });
            console.log('');
        }
        
        // 警告
        if (this.results.warnings.length > 0) {
            console.log('⚠️  警告:');
            this.results.warnings.forEach(warning => {
                console.log(`  - [${warning.type}] ${warning.message}`);
            });
            console.log('');
        }
        
        // 機能サポート状況
        console.log('✅ 機能サポート:');
        const allFeatures = {
            ...this.results.features,
            ...this.results.css,
            ...this.results.performance
        };
        
        const supported = Object.entries(allFeatures).filter(([, value]) => value);
        const unsupported = Object.entries(allFeatures).filter(([, value]) => !value);
        
        console.log(`  サポート: ${supported.length}/${Object.keys(allFeatures).length} 機能`);
        
        if (unsupported.length > 0) {
            console.log('  未サポート:');
            unsupported.forEach(([feature]) => {
                console.log(`    - ${feature}`);
            });
        }
        
        // 互換性スコア
        const score = Math.round((supported.length / Object.keys(allFeatures).length) * 100);
        console.log(`\n互換性スコア: ${score}%`);
        
        if (score >= 95) {
            console.log('評価: 完全対応 🌟');
        } else if (score >= 85) {
            console.log('評価: 良好 ✨');
        } else if (score >= 70) {
            console.log('評価: 部分対応 ⚠️');
        } else {
            console.log('評価: 要アップデート ❌');
        }
        
        // 推奨事項
        if (this.results.errors.length > 0 || score < 85) {
            console.log('\n📋 推奨事項:');
            if (parseInt(this.results.browser.version) < 88 && this.results.browser.name === 'Chrome') {
                console.log('  - Chromeを最新バージョンにアップデートしてください');
            }
            if (!this.results.css['writing-mode: vertical-rl']) {
                console.log('  - 縦書き表示に対応したブラウザを使用してください');
            }
            if (!this.results.features.localStorage) {
                console.log('  - プライベートブラウジングモードを無効にしてください');
            }
        }
        
        console.log('\n======================================\n');
    }

    /**
     * 簡易チェック（特定の機能のみ）
     */
    quickCheck() {
        const critical = {
            'CSS Writing Modes': CSS.supports('writing-mode', 'vertical-rl'),
            'LocalStorage': (() => {
                try {
                    localStorage.setItem('test', 'test');
                    localStorage.removeItem('test');
                    return true;
                } catch (e) {
                    return false;
                }
            })(),
            'Fetch API': typeof fetch === 'function',
            'ES6': (() => {
                try {
                    eval('const test = () => {}; class Test {}');
                    return true;
                } catch (e) {
                    return false;
                }
            })()
        };

        const allSupported = Object.values(critical).every(v => v);
        
        return {
            compatible: allSupported,
            features: critical
        };
    }
}

// グローバルに公開
if (typeof window !== 'undefined') {
    window.BrowserCompatibility = BrowserCompatibility;
    
    // ページ読み込み時に簡易チェック
    document.addEventListener('DOMContentLoaded', () => {
        const checker = new BrowserCompatibility();
        const quick = checker.quickCheck();
        
        if (!quick.compatible) {
            console.warn('ブラウザ互換性の問題が検出されました。');
            console.warn('詳細なチェックを実行するには:');
            console.warn('const checker = new BrowserCompatibility();');
            console.warn('await checker.runFullCheck();');
        }
    });
}