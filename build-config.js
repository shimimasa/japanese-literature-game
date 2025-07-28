/**
 * ビルド設定とコード最適化スクリプト
 * 本番環境向けのJavaScript/CSS圧縮と最適化
 */

const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

class BuildOptimizer {
    constructor() {
        this.config = {
            srcDir: '.',
            distDir: './dist',
            jsFiles: [
                'error-handler.js',
                'data-validator.js',
                'storage-manager.js',
                'book-adapter.js',
                'book-loader.js',
                'text-renderer.js',
                'dictionary-service.js',
                'game-manager.js',
                'ui-manager.js',
                'progress-manager.js',
                'certificate-generator.js',
                'statistics-analyzer.js',
                'touch-handler.js',
                'onboarding-flow.js',
                'flow-validator.js',
                'performance-optimizer.js',
                'app-controller.js',
                'app-v2.js'
            ],
            cssFiles: [
                'styles.css',
                'styles-enhancements.css',
                'onboarding-styles.css'
            ],
            htmlFiles: [
                'index-v2.html'
            ]
        };
    }

    /**
     * ビルドプロセスの実行
     */
    async build() {
        
        try {
            // ディストリビューションディレクトリの作成
            await this.createDistDirectory();
            
            // JavaScriptファイルの処理
            await this.processJavaScriptFiles();
            
            // CSSファイルの処理
            await this.processCSSFiles();
            
            // HTMLファイルの処理
            await this.processHTMLFiles();
            
            // アセットファイルのコピー
            await this.copyAssets();
            
            // ビルド情報の生成
            await this.generateBuildInfo();
            
            
        } catch (error) {
            console.error('ビルドエラー:', error);
            process.exit(1);
        }
    }

    /**
     * ディストリビューションディレクトリの作成
     */
    async createDistDirectory() {
        try {
            await fs.rmdir(this.config.distDir, { recursive: true });
        } catch (error) {
            // ディレクトリが存在しない場合は無視
        }
        
        await fs.mkdir(this.config.distDir, { recursive: true });
        await fs.mkdir(path.join(this.config.distDir, 'js'), { recursive: true });
        await fs.mkdir(path.join(this.config.distDir, 'css'), { recursive: true });
        await fs.mkdir(path.join(this.config.distDir, 'assets'), { recursive: true });
    }

    /**
     * JavaScriptファイルの処理
     */
    async processJavaScriptFiles() {
        
        // 個別ファイルの最適化
        for (const file of this.config.jsFiles) {
            const content = await fs.readFile(path.join(this.config.srcDir, file), 'utf8');
            const optimized = this.optimizeJavaScript(content);
            const minified = this.minifyJavaScript(optimized);
            
            const outputPath = path.join(this.config.distDir, 'js', file.replace('.js', '.min.js'));
            await fs.writeFile(outputPath, minified);
        }
        
        // バンドルファイルの作成
        await this.createJavaScriptBundle();
    }

    /**
     * JavaScriptの最適化
     */
    optimizeJavaScript(code) {
        // コメントの削除（JSDocコメントは保持）
        code = code.replace(/\/\*(?![\*!])[\s\S]*?\*\//g, '');
        code = code.replace(/\/\/.*$/gm, '');
        
        // 不要な空白の削除
        code = code.replace(/\s+/g, ' ');
        code = code.replace(/\s*([{}();,:])\s*/g, '$1');
        
        if (process.env.NODE_ENV === 'production') {
            code = code.replace(/console\.(log|debug|info)\([^)]*\);?/g, '');
        }
        
        // デバッグコードの削除
        code = code.replace(/if\s*\(\s*(?:this\.)?config\.debugMode\s*\)\s*{[^}]*}/g, '');
        
        return code;
    }

    /**
     * JavaScriptの圧縮
     */
    minifyJavaScript(code) {
        // 簡易的な圧縮（実際のプロジェクトではTerserやUglifyJSを使用）
        
        // 変数名の短縮（簡易版）
        const variableMap = new Map();
        let varCounter = 0;
        
        // ローカル変数の検出と置換
        code = code.replace(/\b(let|const|var)\s+(\w{4,})\b/g, (match, keyword, varName) => {
            if (!variableMap.has(varName)) {
                variableMap.set(varName, this.generateShortName(varCounter++));
            }
            return `${keyword} ${variableMap.get(varName)}`;
        });
        
        // 変数参照の置換
        variableMap.forEach((shortName, longName) => {
            const regex = new RegExp(`\\b${longName}\\b`, 'g');
            code = code.replace(regex, shortName);
        });
        
        // セミコロンの最適化
        code = code.replace(/;+/g, ';');
        code = code.replace(/;}/g, '}');
        
        return code;
    }

    /**
     * 短い変数名の生成
     */
    generateShortName(index) {
        const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
        let name = '';
        
        do {
            name = chars[index % chars.length] + name;
            index = Math.floor(index / chars.length);
        } while (index > 0);
        
        return name;
    }

    /**
     * JavaScriptバンドルの作成
     */
    async createJavaScriptBundle() {
        
        let bundleContent = '(function(){\n"use strict";\n';
        
        // 依存関係の順序で結合
        const orderedFiles = this.sortFilesByDependency(this.config.jsFiles);
        
        for (const file of orderedFiles) {
            const content = await fs.readFile(path.join(this.config.distDir, 'js', file.replace('.js', '.min.js')), 'utf8');
            bundleContent += content + '\n';
        }
        
        bundleContent += '\n})();';
        
        // ハッシュ付きファイル名
        const hash = this.generateFileHash(bundleContent);
        const bundleFileName = `app.bundle.${hash}.min.js`;
        
        await fs.writeFile(path.join(this.config.distDir, 'js', bundleFileName), bundleContent);
        
        return bundleFileName;
    }

    /**
     * ファイルの依存関係でソート
     */
    sortFilesByDependency(files) {
        // 簡易的な依存関係解決（実際のプロジェクトではより高度な解析が必要）
        const dependencies = {
            'app-v2.js': ['app-controller.js'],
            'app-controller.js': ['ui-manager.js', 'game-manager.js', 'book-loader.js'],
            'ui-manager.js': ['error-handler.js'],
            'game-manager.js': ['storage-manager.js'],
            'book-loader.js': ['book-adapter.js', 'data-validator.js'],
            'progress-manager.js': ['storage-manager.js', 'game-manager.js'],
            'statistics-analyzer.js': ['game-manager.js'],
            'touch-handler.js': []
        };
        
        const sorted = [];
        const visited = new Set();
        
        const visit = (file) => {
            if (visited.has(file)) return;
            visited.add(file);
            
            const deps = dependencies[file] || [];
            deps.forEach(dep => {
                if (files.includes(dep)) {
                    visit(dep);
                }
            });
            
            sorted.push(file);
        };
        
        files.forEach(file => visit(file));
        
        return sorted;
    }

    /**
     * CSSファイルの処理
     */
    async processCSSFiles() {
        
        let combinedCSS = '';
        
        for (const file of this.config.cssFiles) {
            const content = await fs.readFile(path.join(this.config.srcDir, file), 'utf8');
            const optimized = this.optimizeCSS(content);
            combinedCSS += optimized + '\n';
        }
        
        const minified = this.minifyCSS(combinedCSS);
        
        // ハッシュ付きファイル名
        const hash = this.generateFileHash(minified);
        const cssFileName = `styles.bundle.${hash}.min.css`;
        
        await fs.writeFile(path.join(this.config.distDir, 'css', cssFileName), minified);
        
        return cssFileName;
    }

    /**
     * CSSの最適化
     */
    optimizeCSS(css) {
        // @import文の解決
        css = css.replace(/@import\s+url\(['"]([^'"]+)['"]\);/g, '');
        
        // コメントの削除
        css = css.replace(/\/\*[\s\S]*?\*\//g, '');
        
        // 不要な空白の削除
        css = css.replace(/\s+/g, ' ');
        css = css.replace(/\s*([{}:;,])\s*/g, '$1');
        
        // 0pxを0に変換
        css = css.replace(/:\s*0px/g, ':0');
        
        // カラーコードの短縮
        css = css.replace(/#([0-9a-f])\1([0-9a-f])\2([0-9a-f])\3/gi, '#$1$2$3');
        
        // 重複するルールの削除
        css = this.removeDuplicateRules(css);
        
        return css;
    }

    /**
     * CSSの圧縮
     */
    minifyCSS(css) {
        // セレクタの最適化
        css = css.replace(/([^{}]+){/g, (match, selector) => {
            selector = selector.trim();
            selector = selector.replace(/\s*([>+~])\s*/g, '$1');
            return selector + '{';
        });
        
        // 最後のセミコロンの削除
        css = css.replace(/;}/g, '}');
        
        // 不要なクォートの削除
        css = css.replace(/url\(["']([^"')]+)["']\)/g, 'url($1)');
        
        return css;
    }

    /**
     * 重複するCSSルールの削除
     */
    removeDuplicateRules(css) {
        const rules = new Map();
        const ruleRegex = /([^{]+){([^}]+)}/g;
        
        let match;
        while ((match = ruleRegex.exec(css)) !== null) {
            const selector = match[1].trim();
            const declarations = match[2].trim();
            
            if (rules.has(selector)) {
                // 既存のルールとマージ
                const existing = rules.get(selector);
                rules.set(selector, this.mergeDeclarations(existing, declarations));
            } else {
                rules.set(selector, declarations);
            }
        }
        
        // ルールを再構築
        let optimizedCSS = '';
        rules.forEach((declarations, selector) => {
            optimizedCSS += `${selector}{${declarations}}`;
        });
        
        return optimizedCSS;
    }

    /**
     * CSS宣言のマージ
     */
    mergeDeclarations(existing, new_decls) {
        const declarations = new Map();
        
        // 既存の宣言を解析
        existing.split(';').forEach(decl => {
            const [prop, value] = decl.split(':').map(s => s.trim());
            if (prop && value) {
                declarations.set(prop, value);
            }
        });
        
        // 新しい宣言で上書き
        new_decls.split(';').forEach(decl => {
            const [prop, value] = decl.split(':').map(s => s.trim());
            if (prop && value) {
                declarations.set(prop, value);
            }
        });
        
        // 結合
        return Array.from(declarations.entries())
            .map(([prop, value]) => `${prop}:${value}`)
            .join(';');
    }

    /**
     * HTMLファイルの処理
     */
    async processHTMLFiles() {
        
        for (const file of this.config.htmlFiles) {
            let content = await fs.readFile(path.join(this.config.srcDir, file), 'utf8');
            
            // スクリプトとスタイルシートのパスを更新
            content = this.updateAssetPaths(content);
            
            // HTMLの最適化
            content = this.optimizeHTML(content);
            
            const outputPath = path.join(this.config.distDir, file.replace('-v2', ''));
            await fs.writeFile(outputPath, content);
        }
    }

    /**
     * アセットパスの更新
     */
    updateAssetPaths(html) {
        // 開発用パスを本番用パスに変更
        html = html.replace(/src="([^"]+\.js)"/g, 'src="js/$1.min.js"');
        html = html.replace(/href="([^"]+\.css)"/g, 'href="css/$1.min.css"');
        
        return html;
    }

    /**
     * HTMLの最適化
     */
    optimizeHTML(html) {
        // コメントの削除
        html = html.replace(/<!--[\s\S]*?-->/g, '');
        
        // 不要な空白の削除（preタグ内は除く）
        html = html.replace(/>\s+</g, '><');
        
        // 属性値の最適化
        html = html.replace(/\s*=\s*/g, '=');
        
        // 終了タグの省略可能な要素
        html = html.replace(/<\/(?:li|dt|dd|p|rt|rp|optgroup|option|colgroup|thead|tbody|tfoot|tr|td|th)>/gi, '');
        
        return html;
    }

    /**
     * アセットファイルのコピー
     */
    async copyAssets() {
        
        const assetDirs = ['images', 'fonts', 'books'];
        
        for (const dir of assetDirs) {
            try {
                await this.copyDirectory(
                    path.join(this.config.srcDir, dir),
                    path.join(this.config.distDir, 'assets', dir)
                );
            } catch (error) {
                console.warn(`アセットディレクトリ ${dir} が見つかりません`);
            }
        }
    }

    /**
     * ディレクトリのコピー
     */
    async copyDirectory(src, dest) {
        await fs.mkdir(dest, { recursive: true });
        
        const entries = await fs.readdir(src, { withFileTypes: true });
        
        for (const entry of entries) {
            const srcPath = path.join(src, entry.name);
            const destPath = path.join(dest, entry.name);
            
            if (entry.isDirectory()) {
                await this.copyDirectory(srcPath, destPath);
            } else {
                await fs.copyFile(srcPath, destPath);
            }
        }
    }

    /**
     * ファイルハッシュの生成
     */
    generateFileHash(content) {
        return crypto.createHash('md5').update(content).digest('hex').substring(0, 8);
    }

    /**
     * ビルド情報の生成
     */
    async generateBuildInfo() {
        const buildInfo = {
            version: '1.0.0',
            buildDate: new Date().toISOString(),
            environment: process.env.NODE_ENV || 'development',
            files: {
                js: await fs.readdir(path.join(this.config.distDir, 'js')),
                css: await fs.readdir(path.join(this.config.distDir, 'css'))
            }
        };
        
        await fs.writeFile(
            path.join(this.config.distDir, 'build-info.json'),
            JSON.stringify(buildInfo, null, 2)
        );
    }
}

// スクリプトとして実行
if (require.main === module) {
    const optimizer = new BuildOptimizer();
    optimizer.build();
}

module.exports = BuildOptimizer;