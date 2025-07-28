/**
 * コードクリーンアップスクリプト
 * 未使用コードの削除、コメントの整理、コード品質の向上
 */

const fs = require('fs').promises;
const path = require('path');

class CodeCleanup {
    constructor() {
        this.config = {
            srcDir: '.',
            excludeDirs: ['node_modules', 'dist', '.git', 'works', 'books', '_docs'],
            jsFiles: [],
            cssFiles: [],
            unusedFiles: [],
            todos: [],
            deprecatedCode: []
        };
    }

    /**
     * クリーンアッププロセスの実行
     */
    async run() {
        
        try {
            // 1. ファイルスキャン
            await this.scanFiles();
            
            // 2. 未使用コードの検出
            await this.detectUnusedCode();
            
            // 3. TODOコメントの収集
            await this.collectTodos();
            
            // 4. 非推奨コードの検出
            await this.detectDeprecatedCode();
            
            // 5. コメントの最適化
            await this.optimizeComments();
            
            // 6. 変数名の統一チェック
            await this.checkNamingConventions();
            
            // 7. レポート生成
            await this.generateReport();
            
            
        } catch (error) {
            console.error('クリーンアップエラー:', error);
        }
    }

    /**
     * ファイルスキャン
     */
    async scanFiles(dir = this.config.srcDir) {
        const entries = await fs.readdir(dir, { withFileTypes: true });
        
        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);
            
            // 除外ディレクトリはスキップ
            if (entry.isDirectory()) {
                if (!this.config.excludeDirs.includes(entry.name)) {
                    await this.scanFiles(fullPath);
                }
                continue;
            }
            
            // ファイル拡張子で分類
            if (entry.name.endsWith('.js')) {
                this.config.jsFiles.push(fullPath);
            } else if (entry.name.endsWith('.css')) {
                this.config.cssFiles.push(fullPath);
            }
        }
    }

    /**
     * 未使用コードの検出
     */
    async detectUnusedCode() {
        
        // 使用されているファイルのリスト
        const usedFiles = new Set([
            'app-v2.js',
            'app-controller.js',
            'book-loader.js',
            'book-adapter.js',
            'text-renderer.js',
            'dictionary-service.js',
            'game-manager.js',
            'storage-manager.js',
            'ui-manager.js',
            'progress-manager.js',
            'statistics-analyzer.js',
            'certificate-generator.js',
            'touch-handler.js',
            'error-handler.js',
            'data-validator.js',
            'onboarding-flow.js',
            'flow-validator.js',
            'performance-optimizer.js',
            'memory-manager.js',
            'test-suite.js',
            'unit-tests.js',
            'integration-tests.js',
            'debug-console.js'
        ]);
        
        // HTMLファイルで参照されているファイル
        const htmlFiles = ['index-v2.html', 'test-runner.html'];
        
        for (const htmlFile of htmlFiles) {
            try {
                const content = await fs.readFile(htmlFile, 'utf8');
                const scriptMatches = content.match(/src="([^"]+\.js)"/g) || [];
                scriptMatches.forEach(match => {
                    const file = match.match(/src="([^"]+)"/)[1];
                    usedFiles.add(path.basename(file));
                });
            } catch (error) {
                // ファイルが存在しない場合はスキップ
            }
        }
        
        // 未使用ファイルの検出
        for (const jsFile of this.config.jsFiles) {
            const fileName = path.basename(jsFile);
            if (!usedFiles.has(fileName) && 
                !fileName.includes('cleanup') &&
                !fileName.includes('build') &&
                !fileName.includes('test')) {
                this.config.unusedFiles.push(jsFile);
            }
        }
    }

    /**
     * TODOコメントの収集
     */
    async collectTodos() {
        
        for (const file of this.config.jsFiles) {
            const content = await fs.readFile(file, 'utf8');
            const lines = content.split('\n');
            
            lines.forEach((line, index) => {
                if (line.includes('TODO:') || line.includes('FIXME:') || line.includes('HACK:')) {
                    this.config.todos.push({
                        file: path.basename(file),
                        line: index + 1,
                        content: line.trim()
                    });
                }
            });
        }
    }

    /**
     * 非推奨コードの検出
     */
    async detectDeprecatedCode() {
        
        const deprecatedPatterns = [
            { pattern: /debugger;/g, message: 'debugger文は削除' },
            { pattern: /var\s+/g, message: 'varはletまたはconstに置換' },
            { pattern: /==\s*[^=]/g, message: '==は===に置換' },
            { pattern: /!=\s*[^=]/g, message: '!=は!==に置換' }
        ];
        
        for (const file of this.config.jsFiles) {
            const content = await fs.readFile(file, 'utf8');
            
            for (const { pattern, message } of deprecatedPatterns) {
                const matches = content.match(pattern);
                if (matches && matches.length > 0) {
                    this.config.deprecatedCode.push({
                        file: path.basename(file),
                        pattern: pattern.toString(),
                        message,
                        count: matches.length
                    });
                }
            }
        }
    }

    /**
     * コメントの最適化
     */
    async optimizeComments() {
        
        for (const file of this.config.jsFiles) {
            let content = await fs.readFile(file, 'utf8');
            let modified = false;
            
            // 空のコメントブロックを削除
            const emptyCommentPattern = /\/\*\s*\*\/|\/\/\s*$/gm;
            if (emptyCommentPattern.test(content)) {
                content = content.replace(emptyCommentPattern, '');
                modified = true;
            }
            
            // 連続する空行を1行に
            const multipleEmptyLines = /\n\s*\n\s*\n/g;
            if (multipleEmptyLines.test(content)) {
                content = content.replace(multipleEmptyLines, '\n\n');
                modified = true;
            }
            
            // 末尾の空白を削除
            const trailingWhitespace = /[ \t]+$/gm;
            if (trailingWhitespace.test(content)) {
                content = content.replace(trailingWhitespace, '');
                modified = true;
            }
            
            if (modified) {
                // await fs.writeFile(file, content); // 実際の書き込みはコメントアウト
            }
        }
    }

    /**
     * 命名規則のチェック
     */
    async checkNamingConventions() {
        
        const issues = [];
        
        for (const file of this.config.jsFiles) {
            const content = await fs.readFile(file, 'utf8');
            
            // クラス名のチェック（PascalCase）
            const classPattern = /class\s+([a-z]\w*)/g;
            let match;
            while ((match = classPattern.exec(content)) !== null) {
                issues.push({
                    file: path.basename(file),
                    type: 'class',
                    name: match[1],
                    issue: 'クラス名はPascalCaseにすべき'
                });
            }
            
            // 定数のチェック（UPPER_SNAKE_CASE）
            const constPattern = /const\s+([a-z][a-zA-Z]*)\s*=\s*['"`]|const\s+([a-z][a-zA-Z]*)\s*=\s*\d+/g;
            while ((match = constPattern.exec(content)) !== null) {
                const constName = match[1] || match[2];
                if (constName.length > 3 && constName === constName.toUpperCase()) {
                    continue; // 既に大文字
                }
                // 定数っぽい名前の場合
                if (['max', 'min', 'default'].some(prefix => constName.toLowerCase().startsWith(prefix))) {
                    issues.push({
                        file: path.basename(file),
                        type: 'constant',
                        name: constName,
                        issue: '定数はUPPER_SNAKE_CASEを検討'
                    });
                }
            }
        }
        
        return issues;
    }

    /**
     * レポート生成
     */
    async generateReport() {
        const report = {
            summary: {
                totalFiles: this.config.jsFiles.length + this.config.cssFiles.length,
                jsFiles: this.config.jsFiles.length,
                cssFiles: this.config.cssFiles.length,
                unusedFiles: this.config.unusedFiles.length,
                todos: this.config.todos.length,
                deprecatedCode: this.config.deprecatedCode.length
            },
            details: {
                unusedFiles: this.config.unusedFiles.map(f => path.basename(f)),
                todos: this.config.todos,
                deprecatedCode: this.config.deprecatedCode
            }
        };
        
        // レポートの表示
        
        if (report.details.unusedFiles.length > 0) {
            report.details.unusedFiles.forEach(file => {
            });
        }
        
        if (report.details.todos.length > 0) {
            report.details.todos.forEach(todo => {
            });
        }
        
        if (report.details.deprecatedCode.length > 0) {
            report.details.deprecatedCode.forEach(item => {
            });
        }
        
        // レポートファイルの保存
        await fs.writeFile(
            'cleanup-report.json',
            JSON.stringify(report, null, 2)
        );
        
    }

    /**
     * 推奨されるクリーンアップアクション
     */
    async suggestActions() {
        const suggestions = [];
        
        // 未使用ファイルの削除提案
        if (this.config.unusedFiles.length > 0) {
            suggestions.push({
                action: '未使用ファイルの削除',
                files: this.config.unusedFiles,
                command: `rm ${this.config.unusedFiles.join(' ')}`
            });
        }
        
        // 非推奨コードの修正提案
        if (this.config.deprecatedCode.length > 0) {
            suggestions.push({
                action: '非推奨コードの修正',
                details: this.config.deprecatedCode
            });
        }
        
        return suggestions;
    }
}

// スクリプトとして実行
if (require.main === module) {
    const cleanup = new CodeCleanup();
    cleanup.run();
}

module.exports = CodeCleanup;