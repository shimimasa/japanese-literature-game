/**
 * セキュリティ強化機能
 * Security Enhancements
 * XSS対策、入力サニタイズ、暗号化などのセキュリティユーティリティ
 */

class SecurityEnhancements {
    constructor() {
        this.config = window.AppConfig || {};
    }

    /**
     * HTML文字列をサニタイズ
     * @param {string} str - サニタイズする文字列
     * @param {Object} options - オプション
     * @returns {string} サニタイズされた文字列
     */
    sanitizeHTML(str, options = {}) {
        if (typeof str !== 'string') {
            return '';
        }

        // デフォルトオプション
        const defaults = {
            allowedTags: ['b', 'i', 'em', 'strong', 'ruby', 'rt', 'rp', 'br', 'span'],
            allowedAttributes: {
                'span': ['class', 'data-word', 'data-definition'],
                'ruby': [],
                'rt': [],
                'rp': []
            },
            allowedClasses: {
                'span': ['highlight', 'annotation', 'furigana']
            }
        };

        const settings = Object.assign({}, defaults, options);

        // 危険な文字をエスケープ
        let sanitized = str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#x27;')
            .replace(/\//g, '&#x2F;');

        // 許可されたタグを復元
        settings.allowedTags.forEach(tag => {
            // 開始タグ
            const openTagRegex = new RegExp(`&lt;${tag}(\\s[^&]*)?&gt;`, 'gi');
            sanitized = sanitized.replace(openTagRegex, (match, attributes) => {
                if (!attributes) {
                    return `<${tag}>`;
                }

                // 属性をサニタイズ
                const sanitizedAttrs = this.sanitizeAttributes(tag, attributes, settings);
                return `<${tag}${sanitizedAttrs}>`;
            });

            // 終了タグ
            const closeTagRegex = new RegExp(`&lt;\\/${tag}&gt;`, 'gi');
            sanitized = sanitized.replace(closeTagRegex, `</${tag}>`);
        });

        return sanitized;
    }

    /**
     * 属性をサニタイズ
     */
    sanitizeAttributes(tag, attributesStr, settings) {
        const allowedAttrs = settings.allowedAttributes[tag] || [];
        const allowedClasses = settings.allowedClasses[tag] || [];
        
        if (allowedAttrs.length === 0) {
            return '';
        }

        const attributes = [];
        const attrRegex = /(\w+)=["']([^"']+)["']/g;
        let match;

        while ((match = attrRegex.exec(attributesStr)) !== null) {
            const [, attrName, attrValue] = match;

            if (allowedAttrs.includes(attrName)) {
                if (attrName === 'class') {
                    // クラス属性の場合、許可されたクラスのみ
                    const classes = attrValue.split(' ').filter(cls => 
                        allowedClasses.includes(cls)
                    );
                    if (classes.length > 0) {
                        attributes.push(`class="${classes.join(' ')}"`);
                    }
                } else {
                    // その他の属性
                    const sanitizedValue = this.sanitizeAttributeValue(attrValue);
                    attributes.push(`${attrName}="${sanitizedValue}"`);
                }
            }
        }

        return attributes.length > 0 ? ' ' + attributes.join(' ') : '';
    }

    /**
     * 属性値をサニタイズ
     */
    sanitizeAttributeValue(value) {
        return value
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#x27;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/javascript:/gi, '')
            .replace(/on\w+=/gi, '');
    }

    /**
     * テキスト入力をサニタイズ
     * @param {string} input - 入力文字列
     * @param {Object} options - オプション
     * @returns {string} サニタイズされた文字列
     */
    sanitizeTextInput(input, options = {}) {
        if (typeof input !== 'string') {
            return '';
        }

        const defaults = {
            maxLength: 10000,
            allowNewlines: true,
            allowSpecialChars: true,
            trim: true
        };

        const settings = Object.assign({}, defaults, options);

        let sanitized = input;

        // 長さ制限
        if (sanitized.length > settings.maxLength) {
            sanitized = sanitized.substring(0, settings.maxLength);
        }

        // 改行の処理
        if (!settings.allowNewlines) {
            sanitized = sanitized.replace(/[\r\n]+/g, ' ');
        }

        // 特殊文字の処理
        if (!settings.allowSpecialChars) {
            // 日本語、英数字、基本的な記号のみ許可
            sanitized = sanitized.replace(/[^\u3000-\u303f\u3040-\u309f\u30a0-\u30ff\u4e00-\u9faf\u3400-\u4dbf\w\s\.,!?、。！？]/g, '');
        }

        // 制御文字を削除
        sanitized = sanitized.replace(/[\x00-\x1F\x7F]/g, '');

        // トリム
        if (settings.trim) {
            sanitized = sanitized.trim();
        }

        return sanitized;
    }

    /**
     * URLをサニタイズ
     * @param {string} url - URL文字列
     * @returns {string|null} サニタイズされたURL
     */
    sanitizeURL(url) {
        if (typeof url !== 'string') {
            return null;
        }

        try {
            const parsed = new URL(url);
            
            // 許可されたプロトコルのみ
            const allowedProtocols = ['http:', 'https:', 'file:'];
            if (!allowedProtocols.includes(parsed.protocol)) {
                return null;
            }

            // JavaScriptプロトコルをブロック
            if (url.toLowerCase().includes('javascript:')) {
                return null;
            }

            return parsed.href;
        } catch (error) {
            return null;
        }
    }

    /**
     * JSONデータをサニタイズ
     * @param {Object} data - JSONデータ
     * @returns {Object} サニタイズされたデータ
     */
    sanitizeJSON(data) {
        if (typeof data !== 'object' || data === null) {
            return null;
        }

        const sanitized = {};

        for (const [key, value] of Object.entries(data)) {
            // キーをサニタイズ
            const sanitizedKey = this.sanitizeTextInput(key, {
                allowNewlines: false,
                allowSpecialChars: false,
                maxLength: 100
            });

            // 値をサニタイズ
            if (typeof value === 'string') {
                sanitized[sanitizedKey] = this.sanitizeTextInput(value);
            } else if (typeof value === 'object' && value !== null) {
                sanitized[sanitizedKey] = this.sanitizeJSON(value);
            } else if (typeof value === 'number' || typeof value === 'boolean') {
                sanitized[sanitizedKey] = value;
            }
        }

        return sanitized;
    }

    /**
     * 簡易暗号化（Base64 + 簡単な難読化）
     * 注意: これは本格的な暗号化ではありません
     * @param {string} text - 暗号化する文字列
     * @param {string} key - 暗号化キー
     * @returns {string} 暗号化された文字列
     */
    encrypt(text, key = 'defaultKey') {
        if (!this.config.storage || !this.config.storage.encryption || !this.config.storage.encryption.enabled) {
            return text;
        }

        try {
            // 文字列を文字コードの配列に変換
            const textChars = text.split('').map(char => char.charCodeAt(0));
            const keyChars = key.split('').map(char => char.charCodeAt(0));
            
            // XOR暗号化
            const encrypted = textChars.map((char, i) => {
                const keyChar = keyChars[i % keyChars.length];
                return char ^ keyChar;
            });
            
            // Base64エンコード
            const encryptedString = String.fromCharCode(...encrypted);
            return btoa(encryptedString);
        } catch (error) {
            console.error('暗号化エラー:', error);
            return text;
        }
    }

    /**
     * 簡易復号化
     * @param {string} encryptedText - 暗号化された文字列
     * @param {string} key - 復号化キー
     * @returns {string} 復号化された文字列
     */
    decrypt(encryptedText, key = 'defaultKey') {
        if (!this.config.storage || !this.config.storage.encryption || !this.config.storage.encryption.enabled) {
            return encryptedText;
        }

        try {
            // Base64デコード
            const decodedString = atob(encryptedText);
            const encryptedChars = decodedString.split('').map(char => char.charCodeAt(0));
            const keyChars = key.split('').map(char => char.charCodeAt(0));
            
            // XOR復号化
            const decrypted = encryptedChars.map((char, i) => {
                const keyChar = keyChars[i % keyChars.length];
                return char ^ keyChar;
            });
            
            return String.fromCharCode(...decrypted);
        } catch (error) {
            console.error('復号化エラー:', error);
            return encryptedText;
        }
    }

    /**
     * CSRF トークンを生成
     * @returns {string} CSRFトークン
     */
    generateCSRFToken() {
        const array = new Uint8Array(32);
        crypto.getRandomValues(array);
        return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    }

    /**
     * セキュアなランダム文字列を生成
     * @param {number} length - 文字列の長さ
     * @returns {string} ランダム文字列
     */
    generateSecureRandom(length = 16) {
        const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        const values = crypto.getRandomValues(new Uint8Array(length));
        return Array.from(values, byte => charset[byte % charset.length]).join('');
    }

    /**
     * ストレージサイズをチェック
     * @returns {Object} ストレージ使用状況
     */
    checkStorageSize() {
        let totalSize = 0;
        const items = {};

        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            const value = localStorage.getItem(key);
            const size = new Blob([value]).size;
            totalSize += size;
            items[key] = size;
        }

        const maxSize = this.config.security?.maxStorageSize || 5242880; // 5MB
        const usage = (totalSize / maxSize) * 100;

        return {
            totalSize,
            maxSize,
            usage: Math.round(usage * 100) / 100,
            items,
            isFull: totalSize >= maxSize
        };
    }

    /**
     * 安全にevalを実行（使用は推奨されません）
     * @param {string} code - 実行するコード
     * @param {Object} context - 実行コンテキスト
     * @returns {any} 実行結果
     */
    safeEval(code, context = {}) {
        // evalの使用は避けるべきですが、必要な場合のための安全な実装
        console.warn('safeEvalの使用は推奨されません');
        
        try {
            // Function constructorを使用して制限されたスコープで実行
            const func = new Function(...Object.keys(context), code);
            return func(...Object.values(context));
        } catch (error) {
            console.error('safeEval実行エラー:', error);
            return null;
        }
    }

    /**
     * DOMPurifyの簡易実装
     * @param {string} html - 浄化するHTML
     * @returns {string} 浄化されたHTML
     */
    purifyHTML(html) {
        // DOMParserを使用してHTMLを解析
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        
        // 危険な要素を削除
        const dangerousElements = ['script', 'style', 'iframe', 'object', 'embed', 'link'];
        dangerousElements.forEach(tag => {
            const elements = doc.getElementsByTagName(tag);
            for (let i = elements.length - 1; i >= 0; i--) {
                elements[i].parentNode.removeChild(elements[i]);
            }
        });
        
        // 危険な属性を削除
        const dangerousAttributes = ['onclick', 'onload', 'onerror', 'onmouseover', 'onmouseout', 'onkeydown', 'onkeyup'];
        const allElements = doc.getElementsByTagName('*');
        for (let i = 0; i < allElements.length; i++) {
            const element = allElements[i];
            dangerousAttributes.forEach(attr => {
                element.removeAttribute(attr);
            });
            
            // href属性のjavascript:を削除
            if (element.hasAttribute('href')) {
                const href = element.getAttribute('href');
                if (href && href.toLowerCase().includes('javascript:')) {
                    element.removeAttribute('href');
                }
            }
        }
        
        return doc.body.innerHTML;
    }
}

// グローバルに公開
if (typeof window !== 'undefined') {
    window.SecurityEnhancements = SecurityEnhancements;
    window.securityEnhancements = new SecurityEnhancements();
}