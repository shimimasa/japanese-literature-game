/**
 * パフォーマンス測定ツール
 * Performance Metrics Tool
 * アプリケーションのパフォーマンス指標を測定・記録
 */

class PerformanceMetrics {
    constructor() {
        this.metrics = {
            pageLoad: {},
            resources: {},
            runtime: {},
            memory: {},
            rendering: {},
            userActions: {}
        };
        this.startTime = performance.now();
        this.marks = new Map();
        this.measures = new Map();
    }

    /**
     * 完全なパフォーマンス測定を実行
     */
    async runFullAnalysis() {
        // 各種測定を実行
        this.measurePageLoadMetrics();
        this.measureResourceMetrics();
        await this.measureRuntimeMetrics();
        this.measureMemoryUsage();
        this.measureRenderingPerformance();
        
        // 結果を記録・表示
        this.recordMetrics();
        this.displayResults();
        
        return this.metrics;
    }

    /**
     * ページ読み込みメトリクスを測定
     */
    measurePageLoadMetrics() {
        if (performance.timing) {
            const timing = performance.timing;
            const navigation = performance.navigation;
            
            this.metrics.pageLoad = {
                // DNS解決時間
                dnsLookup: timing.domainLookupEnd - timing.domainLookupStart,
                
                // TCP接続時間
                tcpConnection: timing.connectEnd - timing.connectStart,
                
                // リクエスト時間
                requestTime: timing.responseStart - timing.requestStart,
                
                // レスポンス時間
                responseTime: timing.responseEnd - timing.responseStart,
                
                // DOM処理時間
                domProcessing: timing.domComplete - timing.domLoading,
                
                // DOMContentLoaded時間
                domContentLoaded: timing.domContentLoadedEventEnd - timing.navigationStart,
                
                // 完全読み込み時間
                pageLoadTime: timing.loadEventEnd - timing.navigationStart,
                
                // インタラクティブになるまでの時間
                timeToInteractive: timing.domInteractive - timing.navigationStart,
                
                // ナビゲーションタイプ
                navigationType: ['navigate', 'reload', 'back_forward'][navigation.type] || 'unknown',
                
                // リダイレクト回数
                redirectCount: navigation.redirectCount
            };
        }

        // Core Web Vitals (利用可能な場合)
        if (performance.getEntriesByType) {
            const paintEntries = performance.getEntriesByType('paint');
            paintEntries.forEach(entry => {
                if (entry.name === 'first-paint') {
                    this.metrics.pageLoad.firstPaint = entry.startTime;
                } else if (entry.name === 'first-contentful-paint') {
                    this.metrics.pageLoad.firstContentfulPaint = entry.startTime;
                }
            });
        }

        // Largest Contentful Paint (LCP)
        if (window.PerformanceObserver) {
            try {
                const observer = new PerformanceObserver((list) => {
                    const entries = list.getEntries();
                    const lastEntry = entries[entries.length - 1];
                    this.metrics.pageLoad.largestContentfulPaint = lastEntry.renderTime || lastEntry.loadTime;
                });
                observer.observe({ entryTypes: ['largest-contentful-paint'] });
            } catch (e) {
                // LCP not supported
            }
        }
    }

    /**
     * リソース読み込みメトリクスを測定
     */
    measureResourceMetrics() {
        if (!performance.getEntriesByType) return;

        const resources = performance.getEntriesByType('resource');
        const resourcesByType = {};
        let totalSize = 0;
        let totalDuration = 0;

        resources.forEach(resource => {
            const type = this.getResourceType(resource.name);
            
            if (!resourcesByType[type]) {
                resourcesByType[type] = {
                    count: 0,
                    totalDuration: 0,
                    totalSize: 0,
                    items: []
                };
            }

            const duration = resource.responseEnd - resource.startTime;
            const size = resource.transferSize || 0;

            resourcesByType[type].count++;
            resourcesByType[type].totalDuration += duration;
            resourcesByType[type].totalSize += size;
            resourcesByType[type].items.push({
                name: resource.name.split('/').pop(),
                duration: Math.round(duration),
                size: size,
                cached: resource.transferSize === 0 && resource.decodedBodySize > 0
            });

            totalSize += size;
            totalDuration += duration;
        });

        this.metrics.resources = {
            total: {
                count: resources.length,
                duration: Math.round(totalDuration),
                size: totalSize
            },
            byType: resourcesByType
        };
    }

    /**
     * リソースタイプを判定
     */
    getResourceType(url) {
        const extension = url.split('.').pop().toLowerCase();
        const typeMap = {
            'js': 'JavaScript',
            'css': 'CSS',
            'jpg': 'Image',
            'jpeg': 'Image',
            'png': 'Image',
            'gif': 'Image',
            'svg': 'Image',
            'webp': 'Image',
            'json': 'Data',
            'woff': 'Font',
            'woff2': 'Font',
            'ttf': 'Font',
            'otf': 'Font'
        };
        return typeMap[extension] || 'Other';
    }

    /**
     * ランタイムメトリクスを測定
     */
    async measureRuntimeMetrics() {
        // JavaScriptの実行時間を測定
        const jsStartTime = performance.now();
        
        // サンプル処理を実行
        const testOperations = {
            arrayOperations: () => {
                const arr = Array.from({ length: 10000 }, (_, i) => i);
                return arr.filter(n => n % 2 === 0).map(n => n * 2);
            },
            stringOperations: () => {
                let str = '';
                for (let i = 0; i < 1000; i++) {
                    str += '日本名作文学';
                }
                return str.length;
            },
            domOperations: () => {
                const div = document.createElement('div');
                for (let i = 0; i < 100; i++) {
                    const span = document.createElement('span');
                    span.textContent = `テスト${i}`;
                    div.appendChild(span);
                }
                return div.children.length;
            }
        };

        const operationMetrics = {};
        for (const [name, operation] of Object.entries(testOperations)) {
            const start = performance.now();
            operation();
            const end = performance.now();
            operationMetrics[name] = end - start;
        }

        this.metrics.runtime = {
            jsExecutionTime: performance.now() - jsStartTime,
            operations: operationMetrics,
            eventLoopDelay: await this.measureEventLoopDelay()
        };
    }

    /**
     * イベントループ遅延を測定
     */
    measureEventLoopDelay() {
        return new Promise(resolve => {
            const iterations = 10;
            const delays = [];
            let count = 0;

            function measure() {
                const start = performance.now();
                setTimeout(() => {
                    const delay = performance.now() - start;
                    delays.push(delay);
                    count++;
                    
                    if (count < iterations) {
                        measure();
                    } else {
                        const avgDelay = delays.reduce((a, b) => a + b, 0) / delays.length;
                        resolve(avgDelay - 0); // 0ms timeout の理想的な遅延を引く
                    }
                }, 0);
            }

            measure();
        });
    }

    /**
     * メモリ使用量を測定
     */
    measureMemoryUsage() {
        if (performance.memory) {
            this.metrics.memory = {
                usedJSHeapSize: performance.memory.usedJSHeapSize,
                totalJSHeapSize: performance.memory.totalJSHeapSize,
                jsHeapSizeLimit: performance.memory.jsHeapSizeLimit,
                usagePercentage: (performance.memory.usedJSHeapSize / performance.memory.jsHeapSizeLimit) * 100
            };
        } else {
            this.metrics.memory = {
                available: false,
                message: 'Memory API は利用できません（Chrome限定機能）'
            };
        }

        // LocalStorage使用量
        let localStorageSize = 0;
        for (let key in localStorage) {
            if (localStorage.hasOwnProperty(key)) {
                localStorageSize += localStorage[key].length + key.length;
            }
        }
        this.metrics.memory.localStorageSize = localStorageSize;
    }

    /**
     * レンダリングパフォーマンスを測定
     */
    measureRenderingPerformance() {
        const fpsMeasurements = [];
        let lastTime = performance.now();
        let frameCount = 0;
        const measureDuration = 1000; // 1秒間測定
        const startTime = performance.now();

        const measureFPS = () => {
            const currentTime = performance.now();
            const deltaTime = currentTime - lastTime;
            
            if (deltaTime > 0) {
                const currentFPS = 1000 / deltaTime;
                fpsMeasurements.push(currentFPS);
            }
            
            lastTime = currentTime;
            frameCount++;

            if (currentTime - startTime < measureDuration) {
                requestAnimationFrame(measureFPS);
            } else {
                // FPS統計を計算
                const avgFPS = fpsMeasurements.reduce((a, b) => a + b, 0) / fpsMeasurements.length;
                const minFPS = Math.min(...fpsMeasurements);
                const maxFPS = Math.max(...fpsMeasurements);

                this.metrics.rendering = {
                    averageFPS: Math.round(avgFPS),
                    minFPS: Math.round(minFPS),
                    maxFPS: Math.round(maxFPS),
                    frameCount: frameCount,
                    droppedFrames: fpsMeasurements.filter(fps => fps < 30).length,
                    smoothness: avgFPS >= 55 ? '良好' : avgFPS >= 30 ? '普通' : '不良'
                };
            }
        };

        requestAnimationFrame(measureFPS);
    }

    /**
     * カスタムマークを設定
     */
    mark(name) {
        performance.mark(name);
        this.marks.set(name, performance.now());
    }

    /**
     * カスタム測定を実行
     */
    measure(name, startMark, endMark) {
        performance.measure(name, startMark, endMark);
        const measure = performance.getEntriesByName(name, 'measure')[0];
        this.measures.set(name, measure.duration);
        return measure.duration;
    }

    /**
     * ユーザーアクションを測定
     */
    measureUserAction(actionName, callback) {
        const startMark = `${actionName}-start`;
        const endMark = `${actionName}-end`;
        
        this.mark(startMark);
        
        const result = callback();
        
        if (result instanceof Promise) {
            return result.then(value => {
                this.mark(endMark);
                const duration = this.measure(actionName, startMark, endMark);
                this.metrics.userActions[actionName] = duration;
                return value;
            });
        } else {
            this.mark(endMark);
            const duration = this.measure(actionName, startMark, endMark);
            this.metrics.userActions[actionName] = duration;
            return result;
        }
    }

    /**
     * メトリクスを記録
     */
    recordMetrics() {
        const timestamp = new Date().toISOString();
        const record = {
            timestamp,
            url: window.location.href,
            userAgent: navigator.userAgent,
            metrics: this.metrics
        };

        // LocalStorageに保存（最新10件まで）
        const storageKey = 'performanceMetrics';
        let history = [];
        
        try {
            const stored = localStorage.getItem(storageKey);
            if (stored) {
                history = JSON.parse(stored);
            }
        } catch (e) {
            console.error('Failed to parse performance history:', e);
        }

        history.unshift(record);
        history = history.slice(0, 10); // 最新10件のみ保持

        try {
            localStorage.setItem(storageKey, JSON.stringify(history));
        } catch (e) {
            console.error('Failed to save performance metrics:', e);
        }
    }

    /**
     * 結果を表示
     */
    displayResults() {
        // 結果はメトリクスオブジェクトに格納されているため、
        // console.logの代わりにデバッグツールやUIで表示可能
        return this.metrics;
    }

    /**
     * パフォーマンススコアを計算
     */
    calculatePerformanceScore() {
        let score = 100;

        // ページ読み込み時間（30点）
        if (this.metrics.pageLoad.pageLoadTime) {
            if (this.metrics.pageLoad.pageLoadTime > 3000) score -= 30;
            else if (this.metrics.pageLoad.pageLoadTime > 2000) score -= 20;
            else if (this.metrics.pageLoad.pageLoadTime > 1000) score -= 10;
        }

        // FCP（20点）
        if (this.metrics.pageLoad.firstContentfulPaint) {
            if (this.metrics.pageLoad.firstContentfulPaint > 2500) score -= 20;
            else if (this.metrics.pageLoad.firstContentfulPaint > 1800) score -= 15;
            else if (this.metrics.pageLoad.firstContentfulPaint > 1000) score -= 10;
        }

        // メモリ使用率（20点）
        if (this.metrics.memory.usagePercentage) {
            if (this.metrics.memory.usagePercentage > 80) score -= 20;
            else if (this.metrics.memory.usagePercentage > 60) score -= 15;
            else if (this.metrics.memory.usagePercentage > 40) score -= 10;
        }

        // FPS（30点）
        if (this.metrics.rendering.averageFPS) {
            if (this.metrics.rendering.averageFPS < 30) score -= 30;
            else if (this.metrics.rendering.averageFPS < 45) score -= 20;
            else if (this.metrics.rendering.averageFPS < 55) score -= 10;
        }

        return Math.max(0, Math.min(100, score));
    }
}

// グローバルに公開
if (typeof window !== 'undefined') {
    window.PerformanceMetrics = PerformanceMetrics;
    
    // パフォーマンス測定のヘルパー関数
    window.measurePerformance = async () => {
        const metrics = new PerformanceMetrics();
        return await metrics.runFullAnalysis();
    };
}