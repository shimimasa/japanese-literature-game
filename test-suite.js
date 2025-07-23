/**
 * TestSuite - 包括的なテストフレームワークを提供するクラス
 * 
 * 単体テスト、統合テスト、パフォーマンステストを実行し、
 * 結果をレポートとして出力します。
 */
export class TestSuite {
    constructor() {
        this.tests = [];
        this.results = [];
        this.currentSuite = null;
        this.startTime = null;
        this.endTime = null;
        
        // テスト統計
        this.stats = {
            total: 0,
            passed: 0,
            failed: 0,
            skipped: 0,
            duration: 0
        };
        
        // アサーションカウンタ
        this.assertions = {
            total: 0,
            passed: 0,
            failed: 0
        };
        
        // デバッグモード
        this.debugMode = false;
        
        // パフォーマンス測定
        this.performanceMetrics = [];
    }
    
    /**
     * テストスイートを定義
     * @param {string} name - スイート名
     * @param {Function} fn - テスト定義関数
     */
    describe(name, fn) {
        const suite = {
            name: name,
            tests: [],
            beforeEach: null,
            afterEach: null,
            beforeAll: null,
            afterAll: null
        };
        
        const previousSuite = this.currentSuite;
        this.currentSuite = suite;
        
        // テスト定義関数を実行
        fn.call(this);
        
        this.tests.push(suite);
        this.currentSuite = previousSuite;
    }
    
    /**
     * 個別テストを定義
     * @param {string} name - テスト名
     * @param {Function} fn - テスト関数
     */
    it(name, fn) {
        if (!this.currentSuite) {
            throw new Error('it() must be called inside describe()');
        }
        
        this.currentSuite.tests.push({
            name: name,
            fn: fn,
            skip: false
        });
    }
    
    /**
     * テストをスキップ
     * @param {string} name - テスト名
     * @param {Function} fn - テスト関数
     */
    skip(name, fn) {
        if (!this.currentSuite) {
            throw new Error('skip() must be called inside describe()');
        }
        
        this.currentSuite.tests.push({
            name: name,
            fn: fn,
            skip: true
        });
    }
    
    /**
     * 各テスト前に実行
     * @param {Function} fn - セットアップ関数
     */
    beforeEach(fn) {
        if (!this.currentSuite) {
            throw new Error('beforeEach() must be called inside describe()');
        }
        this.currentSuite.beforeEach = fn;
    }
    
    /**
     * 各テスト後に実行
     * @param {Function} fn - クリーンアップ関数
     */
    afterEach(fn) {
        if (!this.currentSuite) {
            throw new Error('afterEach() must be called inside describe()');
        }
        this.currentSuite.afterEach = fn;
    }
    
    /**
     * スイート開始前に実行
     * @param {Function} fn - セットアップ関数
     */
    beforeAll(fn) {
        if (!this.currentSuite) {
            throw new Error('beforeAll() must be called inside describe()');
        }
        this.currentSuite.beforeAll = fn;
    }
    
    /**
     * スイート終了後に実行
     * @param {Function} fn - クリーンアップ関数
     */
    afterAll(fn) {
        if (!this.currentSuite) {
            throw new Error('afterAll() must be called inside describe()');
        }
        this.currentSuite.afterAll = fn;
    }
    
    /**
     * アサーション関数群
     */
    assert = {
        /**
         * 値が真であることを確認
         */
        true: (value, message) => {
            this.assertions.total++;
            if (value === true) {
                this.assertions.passed++;
                if (this.debugMode) console.log('✓', message || 'Expected true');
            } else {
                this.assertions.failed++;
                throw new AssertionError(message || `Expected true, got ${value}`);
            }
        },
        
        /**
         * 値が偽であることを確認
         */
        false: (value, message) => {
            this.assertions.total++;
            if (value === false) {
                this.assertions.passed++;
                if (this.debugMode) console.log('✓', message || 'Expected false');
            } else {
                this.assertions.failed++;
                throw new AssertionError(message || `Expected false, got ${value}`);
            }
        },
        
        /**
         * 値が等しいことを確認
         */
        equal: (actual, expected, message) => {
            this.assertions.total++;
            if (actual === expected) {
                this.assertions.passed++;
                if (this.debugMode) console.log('✓', message || `Expected ${expected}`);
            } else {
                this.assertions.failed++;
                throw new AssertionError(
                    message || `Expected ${expected}, got ${actual}`
                );
            }
        },
        
        /**
         * 値が等しくないことを確認
         */
        notEqual: (actual, expected, message) => {
            this.assertions.total++;
            if (actual !== expected) {
                this.assertions.passed++;
                if (this.debugMode) console.log('✓', message || `Expected not ${expected}`);
            } else {
                this.assertions.failed++;
                throw new AssertionError(
                    message || `Expected not ${expected}, but got ${actual}`
                );
            }
        },
        
        /**
         * 深い等価性を確認
         */
        deepEqual: (actual, expected, message) => {
            this.assertions.total++;
            if (this.deepEquals(actual, expected)) {
                this.assertions.passed++;
                if (this.debugMode) console.log('✓', message || 'Deep equality check passed');
            } else {
                this.assertions.failed++;
                throw new AssertionError(
                    message || `Deep equality failed:\nExpected: ${JSON.stringify(expected, null, 2)}\nActual: ${JSON.stringify(actual, null, 2)}`
                );
            }
        },
        
        /**
         * 配列に値が含まれることを確認
         */
        includes: (array, value, message) => {
            this.assertions.total++;
            if (Array.isArray(array) && array.includes(value)) {
                this.assertions.passed++;
                if (this.debugMode) console.log('✓', message || `Array includes ${value}`);
            } else {
                this.assertions.failed++;
                throw new AssertionError(
                    message || `Expected array to include ${value}`
                );
            }
        },
        
        /**
         * エラーがスローされることを確認
         */
        throws: async (fn, expectedError, message) => {
            this.assertions.total++;
            try {
                await fn();
                this.assertions.failed++;
                throw new AssertionError(
                    message || 'Expected function to throw an error'
                );
            } catch (error) {
                if (error instanceof AssertionError) {
                    throw error;
                }
                if (expectedError && !(error instanceof expectedError)) {
                    this.assertions.failed++;
                    throw new AssertionError(
                        message || `Expected ${expectedError.name}, got ${error.constructor.name}`
                    );
                }
                this.assertions.passed++;
                if (this.debugMode) console.log('✓', message || 'Function threw expected error');
            }
        },
        
        /**
         * 値が存在することを確認
         */
        exists: (value, message) => {
            this.assertions.total++;
            if (value !== null && value !== undefined) {
                this.assertions.passed++;
                if (this.debugMode) console.log('✓', message || 'Value exists');
            } else {
                this.assertions.failed++;
                throw new AssertionError(
                    message || `Expected value to exist, got ${value}`
                );
            }
        },
        
        /**
         * 型を確認
         */
        type: (value, expectedType, message) => {
            this.assertions.total++;
            const actualType = typeof value;
            if (actualType === expectedType) {
                this.assertions.passed++;
                if (this.debugMode) console.log('✓', message || `Type is ${expectedType}`);
            } else {
                this.assertions.failed++;
                throw new AssertionError(
                    message || `Expected type ${expectedType}, got ${actualType}`
                );
            }
        }
    };
    
    /**
     * 深い等価性チェック
     */
    deepEquals(a, b) {
        if (a === b) return true;
        
        if (a === null || b === null) return false;
        if (typeof a !== 'object' || typeof b !== 'object') return false;
        
        const keysA = Object.keys(a);
        const keysB = Object.keys(b);
        
        if (keysA.length !== keysB.length) return false;
        
        for (const key of keysA) {
            if (!keysB.includes(key)) return false;
            if (!this.deepEquals(a[key], b[key])) return false;
        }
        
        return true;
    }
    
    /**
     * すべてのテストを実行
     * @returns {Promise<Object>} テスト結果
     */
    async runTests() {
        this.startTime = Date.now();
        this.results = [];
        this.stats = { total: 0, passed: 0, failed: 0, skipped: 0, duration: 0 };
        this.assertions = { total: 0, passed: 0, failed: 0 };
        
        console.log('🧪 テスト実行開始...\n');
        
        for (const suite of this.tests) {
            await this.runSuite(suite);
        }
        
        this.endTime = Date.now();
        this.stats.duration = this.endTime - this.startTime;
        
        this.reportResults();
        
        return {
            stats: this.stats,
            results: this.results,
            assertions: this.assertions,
            performanceMetrics: this.performanceMetrics
        };
    }
    
    /**
     * テストスイートを実行
     */
    async runSuite(suite) {
        console.log(`\n📁 ${suite.name}`);
        
        const suiteResult = {
            name: suite.name,
            tests: [],
            passed: 0,
            failed: 0,
            skipped: 0
        };
        
        // beforeAll実行
        if (suite.beforeAll) {
            try {
                await suite.beforeAll();
            } catch (error) {
                console.error('  ❌ beforeAll failed:', error.message);
                return;
            }
        }
        
        // 各テストを実行
        for (const test of suite.tests) {
            if (test.skip) {
                this.stats.skipped++;
                suiteResult.skipped++;
                console.log(`  ⏭️  ${test.name} (skipped)`);
                continue;
            }
            
            const testResult = await this.runTest(test, suite);
            suiteResult.tests.push(testResult);
            
            if (testResult.passed) {
                suiteResult.passed++;
            } else {
                suiteResult.failed++;
            }
        }
        
        // afterAll実行
        if (suite.afterAll) {
            try {
                await suite.afterAll();
            } catch (error) {
                console.error('  ❌ afterAll failed:', error.message);
            }
        }
        
        this.results.push(suiteResult);
    }
    
    /**
     * 個別テストを実行
     */
    async runTest(test, suite) {
        this.stats.total++;
        
        const testResult = {
            name: test.name,
            passed: false,
            error: null,
            duration: 0,
            assertions: 0
        };
        
        const startTime = Date.now();
        const startAssertions = this.assertions.total;
        
        try {
            // beforeEach実行
            if (suite.beforeEach) {
                await suite.beforeEach();
            }
            
            // テスト実行
            await test.fn.call(this);
            
            // afterEach実行
            if (suite.afterEach) {
                await suite.afterEach();
            }
            
            testResult.passed = true;
            this.stats.passed++;
            console.log(`  ✅ ${test.name}`);
            
        } catch (error) {
            testResult.passed = false;
            testResult.error = error;
            this.stats.failed++;
            console.log(`  ❌ ${test.name}`);
            console.error(`     ${error.message}`);
            
            if (this.debugMode && error.stack) {
                console.error(error.stack);
            }
        }
        
        testResult.duration = Date.now() - startTime;
        testResult.assertions = this.assertions.total - startAssertions;
        
        return testResult;
    }
    
    /**
     * テスト結果をレポート
     */
    reportResults() {
        console.log('\n' + '='.repeat(60));
        console.log('📊 テスト結果サマリー\n');
        
        console.log(`総テスト数: ${this.stats.total}`);
        console.log(`✅ 成功: ${this.stats.passed}`);
        console.log(`❌ 失敗: ${this.stats.failed}`);
        console.log(`⏭️  スキップ: ${this.stats.skipped}`);
        console.log(`\n実行時間: ${this.stats.duration}ms`);
        
        console.log(`\nアサーション統計:`);
        console.log(`  総数: ${this.assertions.total}`);
        console.log(`  成功: ${this.assertions.passed}`);
        console.log(`  失敗: ${this.assertions.failed}`);
        
        // 失敗したテストの詳細
        if (this.stats.failed > 0) {
            console.log('\n❌ 失敗したテスト:');
            for (const suite of this.results) {
                for (const test of suite.tests) {
                    if (!test.passed && test.error) {
                        console.log(`\n  ${suite.name} > ${test.name}:`);
                        console.log(`    ${test.error.message}`);
                    }
                }
            }
        }
        
        console.log('\n' + '='.repeat(60));
    }
    
    /**
     * パフォーマンステストを実行
     * @param {string} name - テスト名
     * @param {Function} fn - テスト関数
     * @param {Object} options - オプション
     */
    async performance(name, fn, options = {}) {
        const {
            iterations = 100,
            warmup = 10,
            maxTime = 5000
        } = options;
        
        console.log(`\n⚡ パフォーマンステスト: ${name}`);
        
        // ウォームアップ
        for (let i = 0; i < warmup; i++) {
            await fn();
        }
        
        // 実測
        const measurements = [];
        const startTime = Date.now();
        
        for (let i = 0; i < iterations; i++) {
            if (Date.now() - startTime > maxTime) {
                break;
            }
            
            const iterStart = performance.now();
            await fn();
            const iterEnd = performance.now();
            
            measurements.push(iterEnd - iterStart);
        }
        
        // 統計計算
        const stats = this.calculateStats(measurements);
        
        console.log(`  実行回数: ${measurements.length}`);
        console.log(`  平均: ${stats.mean.toFixed(2)}ms`);
        console.log(`  中央値: ${stats.median.toFixed(2)}ms`);
        console.log(`  最小: ${stats.min.toFixed(2)}ms`);
        console.log(`  最大: ${stats.max.toFixed(2)}ms`);
        console.log(`  標準偏差: ${stats.stdDev.toFixed(2)}ms`);
        
        this.performanceMetrics.push({
            name,
            stats,
            measurements
        });
        
        return stats;
    }
    
    /**
     * 統計情報を計算
     */
    calculateStats(values) {
        const sorted = values.slice().sort((a, b) => a - b);
        const sum = values.reduce((a, b) => a + b, 0);
        const mean = sum / values.length;
        
        const median = sorted.length % 2 === 0
            ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
            : sorted[Math.floor(sorted.length / 2)];
        
        const variance = values.reduce((acc, val) => {
            return acc + Math.pow(val - mean, 2);
        }, 0) / values.length;
        
        return {
            mean,
            median,
            min: sorted[0],
            max: sorted[sorted.length - 1],
            stdDev: Math.sqrt(variance)
        };
    }
    
    /**
     * デバッグモードの切り替え
     */
    setDebugMode(enabled) {
        this.debugMode = enabled;
    }
    
    /**
     * テスト結果をHTMLとして出力
     */
    generateHTMLReport() {
        const html = `
<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <title>テストレポート - ${new Date().toLocaleString('ja-JP')}</title>
    <style>
        body {
            font-family: 'Hiragino Kaku Gothic ProN', sans-serif;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
            background: #f5f5f5;
        }
        h1 { color: #333; }
        .summary {
            background: white;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 20px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .passed { color: #4CAF50; }
        .failed { color: #f44336; }
        .skipped { color: #FF9800; }
        .suite {
            background: white;
            padding: 15px;
            margin-bottom: 10px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .test {
            margin-left: 20px;
            padding: 5px;
        }
        .error {
            background: #ffebee;
            padding: 10px;
            margin: 5px 0;
            border-radius: 4px;
            font-family: monospace;
            font-size: 12px;
        }
    </style>
</head>
<body>
    <h1>テストレポート</h1>
    <div class="summary">
        <h2>サマリー</h2>
        <p>総テスト数: ${this.stats.total}</p>
        <p class="passed">成功: ${this.stats.passed}</p>
        <p class="failed">失敗: ${this.stats.failed}</p>
        <p class="skipped">スキップ: ${this.stats.skipped}</p>
        <p>実行時間: ${this.stats.duration}ms</p>
    </div>
    ${this.results.map(suite => `
        <div class="suite">
            <h3>${suite.name}</h3>
            ${suite.tests.map(test => `
                <div class="test ${test.passed ? 'passed' : 'failed'}">
                    ${test.passed ? '✅' : '❌'} ${test.name} (${test.duration}ms)
                    ${test.error ? `<div class="error">${test.error.message}</div>` : ''}
                </div>
            `).join('')}
        </div>
    `).join('')}
</body>
</html>`;
        
        return html;
    }
}

/**
 * カスタムエラークラス
 */
class AssertionError extends Error {
    constructor(message) {
        super(message);
        this.name = 'AssertionError';
    }
}

// エクスポート
export const testSuite = new TestSuite();

// エクスポート
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TestSuite;
}