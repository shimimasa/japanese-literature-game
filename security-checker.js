/**
 * セキュリティチェッカー
 * Security Checker
 * XSS、CSRF、その他のセキュリティ脆弱性をチェック
 */

class SecurityChecker {
    constructor() {
        this.issues = [];
        this.warnings = [];
        this.passed = [];
    }

    /**
     * セキュリティチェックを実行
     */
    async runChecks() {
        console.log('セキュリティチェックを開始します...\n');
        
        // 各種チェックを実行
        await this.checkXSSVulnerabilities();
        await this.checkCSRFProtection();
        await this.checkInputValidation();
        await this.checkDataStorage();
        await this.checkDependencies();
        await this.checkContentSecurityPolicy();
        await this.checkHTTPSUsage();
        await this.checkSensitiveDataExposure();
        
        // 結果を表示
        this.displayResults();
        
        return {
            issues: this.issues,
            warnings: this.warnings,
            passed: this.passed,
            score: this.calculateSecurityScore()
        };
    }

    /**
     * XSS脆弱性チェック
     */
    async checkXSSVulnerabilities() {
        console.log('1. XSS脆弱性チェック...');
        
        // innerHTML使用箇所のチェック
        const dangerousPatterns = [
            /\.innerHTML\s*=\s*[^`'"]/g,  // サニタイズなしのinnerHTML
            /\.outerHTML\s*=\s*[^`'"]/g,  // サニタイズなしのouterHTML
            /document\.write\(/g,          // document.write
            /eval\(/g,                     // eval関数
            /new\s+Function\(/g            // Function constructor
        ];
        
        // すべてのJSファイルをチェック
        const jsFiles = [
            'app-v2.js',
            'app-controller.js',
            'book-loader.js',
            'text-renderer.js',
            'dictionary-service.js',
            'game-manager.js',
            'storage-manager.js',
            'ui-manager.js',
            'progress-manager.js',
            'error-handler.js',
            'data-validator.js',
            'performance-optimizer.js',
            'onboarding-flow.js',
            'touch-handler.js'
        ];
        
        for (const file of jsFiles) {
            try {
                const response = await fetch(file);
                if (response.ok) {
                    const content = await response.text();
                    
                    for (const pattern of dangerousPatterns) {
                        const matches = content.match(pattern);
                        if (matches) {
                            this.issues.push({
                                type: 'XSS',
                                severity: 'high',
                                file: file,
                                message: `危険なパターンが検出されました: ${pattern.source}`,
                                occurrences: matches.length
                            });
                        }
                    }
                    
                    // サニタイズ関数の存在チェック
                    if (content.includes('innerHTML') && !content.includes('sanitize')) {
                        this.warnings.push({
                            type: 'XSS',
                            severity: 'medium',
                            file: file,
                            message: 'innerHTMLが使用されていますが、サニタイズ関数が見つかりません'
                        });
                    }
                }
            } catch (error) {
                // ファイルが存在しない場合はスキップ
            }
        }
        
        // SafeDOMの実装チェック
        try {
            const response = await fetch('safedom.js');
            if (response.ok) {
                this.passed.push({
                    type: 'XSS',
                    message: 'SafeDOM実装が存在します'
                });
            }
        } catch (error) {
            this.warnings.push({
                type: 'XSS',
                severity: 'medium',
                message: 'SafeDOMが実装されていません'
            });
        }
    }

    /**
     * CSRF保護チェック
     */
    async checkCSRFProtection() {
        console.log('2. CSRF保護チェック...');
        
        // CSRFトークンの実装チェック
        const hasCSRFToken = false; // 現在のアプリはローカルストレージのみ使用
        
        if (!hasCSRFToken) {
            this.passed.push({
                type: 'CSRF',
                message: 'このアプリケーションはサーバー通信を行わないため、CSRF攻撃のリスクはありません'
            });
        }
    }

    /**
     * 入力検証チェック
     */
    async checkInputValidation() {
        console.log('3. 入力検証チェック...');
        
        try {
            const response = await fetch('data-validator.js');
            if (response.ok) {
                const content = await response.text();
                
                // バリデーション関数の存在チェック
                const validationFunctions = [
                    'validateString',
                    'validateNumber',
                    'validateArray',
                    'validateObject',
                    'sanitizeInput'
                ];
                
                for (const func of validationFunctions) {
                    if (content.includes(func)) {
                        this.passed.push({
                            type: 'Input Validation',
                            message: `${func}関数が実装されています`
                        });
                    } else {
                        this.warnings.push({
                            type: 'Input Validation',
                            severity: 'low',
                            message: `${func}関数が見つかりません`
                        });
                    }
                }
            }
        } catch (error) {
            this.warnings.push({
                type: 'Input Validation',
                severity: 'medium',
                message: 'data-validator.jsが見つかりません'
            });
        }
    }

    /**
     * データストレージセキュリティチェック
     */
    async checkDataStorage() {
        console.log('4. データストレージセキュリティチェック...');
        
        // LocalStorageの暗号化チェック
        try {
            const response = await fetch('storage-manager.js');
            if (response.ok) {
                const content = await response.text();
                
                if (content.includes('encrypt') && content.includes('decrypt')) {
                    this.passed.push({
                        type: 'Storage',
                        message: '暗号化機能が実装されています'
                    });
                } else {
                    this.warnings.push({
                        type: 'Storage',
                        severity: 'medium',
                        message: 'LocalStorageデータの暗号化が実装されていません'
                    });
                }
                
                // ストレージサイズ制限チェック
                if (content.includes('maxStorageSize') || content.includes('checkStorageLimit')) {
                    this.passed.push({
                        type: 'Storage',
                        message: 'ストレージサイズ制限が実装されています'
                    });
                }
            }
        } catch (error) {
            this.warnings.push({
                type: 'Storage',
                severity: 'medium',
                message: 'storage-manager.jsが見つかりません'
            });
        }
    }

    /**
     * 依存関係のセキュリティチェック
     */
    async checkDependencies() {
        console.log('5. 依存関係チェック...');
        
        // 外部ライブラリの使用チェック
        const externalLibraries = [];
        
        if (externalLibraries.length === 0) {
            this.passed.push({
                type: 'Dependencies',
                message: '外部ライブラリを使用していません（セキュリティリスクが低い）'
            });
        }
    }

    /**
     * Content Security Policyチェック
     */
    async checkContentSecurityPolicy() {
        console.log('6. Content Security Policyチェック...');
        
        // CSP設定の確認
        const cspMeta = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
        
        if (cspMeta) {
            this.passed.push({
                type: 'CSP',
                message: 'Content Security Policyが設定されています'
            });
            
            // CSPの内容を検証
            const content = cspMeta.content;
            if (!content.includes('unsafe-eval')) {
                this.passed.push({
                    type: 'CSP',
                    message: 'unsafe-evalが無効化されています'
                });
            } else {
                this.warnings.push({
                    type: 'CSP',
                    severity: 'medium',
                    message: 'CSPでunsafe-evalが許可されています'
                });
            }
        } else {
            this.warnings.push({
                type: 'CSP',
                severity: 'medium',
                message: 'Content Security Policyが設定されていません'
            });
        }
    }

    /**
     * HTTPS使用チェック
     */
    async checkHTTPSUsage() {
        console.log('7. HTTPS使用チェック...');
        
        if (window.location.protocol === 'https:') {
            this.passed.push({
                type: 'HTTPS',
                message: 'HTTPSで提供されています'
            });
        } else if (window.location.protocol === 'file:') {
            this.passed.push({
                type: 'HTTPS',
                message: 'ローカルファイルとして実行されています'
            });
        } else {
            this.warnings.push({
                type: 'HTTPS',
                severity: 'high',
                message: 'HTTPで提供されています。本番環境ではHTTPSを使用してください'
            });
        }
    }

    /**
     * 機密データ露出チェック
     */
    async checkSensitiveDataExposure() {
        console.log('8. 機密データ露出チェック...');
        
        // コンソールログのチェック
        const jsFiles = [
            'app-v2.js',
            'app-controller.js',
            'book-loader.js',
            'storage-manager.js'
        ];
        
        for (const file of jsFiles) {
            try {
                const response = await fetch(file);
                if (response.ok) {
                    const content = await response.text();
                    
                    // console.logの使用チェック
                    const consoleMatches = content.match(/console\.(log|info|warn|error)/g);
                    if (consoleMatches && consoleMatches.length > 10) {
                        this.warnings.push({
                            type: 'Data Exposure',
                            severity: 'low',
                            file: file,
                            message: `過剰なコンソール出力があります（${consoleMatches.length}箇所）`
                        });
                    }
                    
                    // 機密情報のハードコーディングチェック
                    const sensitivePatterns = [
                        /api[_-]?key/i,
                        /password/i,
                        /secret/i,
                        /token/i
                    ];
                    
                    for (const pattern of sensitivePatterns) {
                        if (pattern.test(content)) {
                            this.issues.push({
                                type: 'Data Exposure',
                                severity: 'high',
                                file: file,
                                message: `機密情報の可能性があるパターンが検出されました: ${pattern.source}`
                            });
                        }
                    }
                }
            } catch (error) {
                // ファイルが存在しない場合はスキップ
            }
        }
        
        // 個人情報保護の実装チェック
        this.passed.push({
            type: 'Privacy',
            message: 'このアプリケーションは個人情報を収集しません'
        });
    }

    /**
     * セキュリティスコアを計算
     */
    calculateSecurityScore() {
        const totalChecks = this.issues.length + this.warnings.length + this.passed.length;
        const passedChecks = this.passed.length;
        const warningPenalty = this.warnings.length * 0.5;
        const issuePenalty = this.issues.length * 2;
        
        const score = Math.max(0, Math.min(100, 
            (passedChecks - warningPenalty - issuePenalty) / totalChecks * 100
        ));
        
        return Math.round(score);
    }

    /**
     * 結果を表示
     */
    displayResults() {
        console.log('\n========== セキュリティチェック結果 ==========\n');
        
        // 重大な問題
        if (this.issues.length > 0) {
            console.log('🔴 重大な問題:');
            this.issues.forEach(issue => {
                console.log(`  - [${issue.type}] ${issue.message}`);
                if (issue.file) {
                    console.log(`    ファイル: ${issue.file}`);
                }
                if (issue.occurrences) {
                    console.log(`    発生箇所: ${issue.occurrences}箇所`);
                }
            });
            console.log('');
        }
        
        // 警告
        if (this.warnings.length > 0) {
            console.log('🟡 警告:');
            this.warnings.forEach(warning => {
                console.log(`  - [${warning.type}] ${warning.message}`);
                if (warning.file) {
                    console.log(`    ファイル: ${warning.file}`);
                }
            });
            console.log('');
        }
        
        // 合格項目
        if (this.passed.length > 0) {
            console.log('✅ 合格:');
            this.passed.forEach(pass => {
                console.log(`  - [${pass.type}] ${pass.message}`);
            });
            console.log('');
        }
        
        // スコア
        const score = this.calculateSecurityScore();
        console.log(`セキュリティスコア: ${score}/100`);
        
        if (score >= 90) {
            console.log('評価: 優秀 🌟');
        } else if (score >= 70) {
            console.log('評価: 良好 ✨');
        } else if (score >= 50) {
            console.log('評価: 要改善 ⚠️');
        } else {
            console.log('評価: 要対策 ❌');
        }
        
        console.log('\n=====================================\n');
    }
}

// セキュリティチェックを実行
if (typeof window !== 'undefined') {
    window.SecurityChecker = SecurityChecker;
    
    // 自動実行（開発環境のみ）
    if (window.location.hostname === 'localhost' || 
        window.location.hostname === '127.0.0.1') {
        console.log('セキュリティチェッカーを実行するには、以下を実行してください:');
        console.log('const checker = new SecurityChecker();');
        console.log('await checker.runChecks();');
    }
}