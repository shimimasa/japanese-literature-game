/**
 * DataValidator - データバリデーション機能を提供するクラス
 */
class DataValidator {
    constructor() {
        // バリデーションルールの定義
        this.rules = {
            // 基本的な型チェック
            string: (value) => typeof value === 'string',
            number: (value) => typeof value === 'number' && !isNaN(value),
            boolean: (value) => typeof value === 'boolean',
            array: (value) => Array.isArray(value),
            object: (value) => value !== null && typeof value === 'object' && !Array.isArray(value),
            
            // 範囲チェック
            minLength: (min) => (value) => value.length >= min,
            maxLength: (max) => (value) => value.length <= max,
            min: (min) => (value) => value >= min,
            max: (max) => (value) => value <= max,
            between: (min, max) => (value) => value >= min && value <= max,
            
            // パターンチェック
            pattern: (regex) => (value) => regex.test(value),
            email: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
            url: (value) => {
                try {
                    new URL(value);
                    return true;
                } catch {
                    return false;
                }
            },
            
            // 特殊チェック
            required: (value) => value !== null && value !== undefined && value !== '',
            enum: (options) => (value) => options.includes(value),
            custom: (fn) => fn
        };
        
        // 作品データのスキーマ
        this.bookSchema = {
            id: {
                type: 'string',
                required: true,
                minLength: 1
            },
            title: {
                type: 'string',
                required: true,
                minLength: 1,
                maxLength: 100
            },
            author: {
                type: 'string',
                required: true,
                minLength: 1,
                maxLength: 50
            },
            category: {
                type: 'string',
                required: false,
                enum: ['author', 'difficulty', 'length']
            },
            difficulty: {
                type: 'string',
                required: true,
                enum: ['beginner', 'intermediate', 'advanced']
            },
            length: {
                type: 'string',
                required: false,
                enum: ['short', 'medium', 'long']
            },
            content: {
                type: 'array',
                required: true,
                minLength: 1,
                items: {
                    chapter: {
                        type: 'number',
                        required: true,
                        min: 1
                    },
                    title: {
                        type: 'string',
                        required: false
                    },
                    text: {
                        type: 'string',
                        required: true,
                        minLength: 1
                    },
                    annotations: {
                        type: 'array',
                        required: false,
                        items: {
                            word: {
                                type: 'string',
                                required: true
                            },
                            reading: {
                                type: 'string',
                                required: false
                            },
                            definition: {
                                type: 'string',
                                required: true
                            }
                        }
                    }
                }
            },
            metadata: {
                type: 'object',
                required: false,
                properties: {
                    totalChapters: {
                        type: 'number',
                        min: 1
                    },
                    estimatedReadingTime: {
                        type: 'number',
                        min: 1
                    },
                    ageRecommendation: {
                        type: 'string',
                        pattern: /^\d{1,2}-\d{1,2}$/
                    }
                }
            }
        };
        
        // ユーザー進捗データのスキーマ
        this.progressSchema = {
            userId: {
                type: 'string',
                required: true
            },
            books: {
                type: 'object',
                required: true
            },
            settings: {
                type: 'object',
                required: false,
                properties: {
                    fontSize: {
                        type: 'number',
                        between: [10, 40]
                    },
                    backgroundColor: {
                        type: 'string',
                        enum: ['white', 'cream', 'light-green', 'light-blue', 'dark']
                    },
                    soundEnabled: {
                        type: 'boolean'
                    }
                }
            },
            achievements: {
                type: 'array',
                required: false
            }
        };
    }
    
    /**
     * データをスキーマに基づいて検証
     * @param {any} data - 検証対象のデータ
     * @param {Object} schema - 検証スキーマ
     * @returns {Object} 検証結果 {valid: boolean, errors: Array}
     */
    validate(data, schema) {
        const errors = [];
        this.validateObject(data, schema, '', errors);
        
        return {
            valid: errors.length === 0,
            errors: errors
        };
    }
    
    /**
     * オブジェクトの検証（再帰的）
     */
    validateObject(data, schema, path, errors) {
        // データが存在しない場合
        if (data === null || data === undefined) {
            if (schema.required) {
                errors.push({
                    path: path || 'root',
                    message: '必須フィールドです',
                    type: 'required'
                });
            }
            return;
        }
        
        // スキーマの各フィールドを検証
        for (const [field, rules] of Object.entries(schema)) {
            const fieldPath = path ? `${path}.${field}` : field;
            const value = data[field];
            
            // アイテムやプロパティの特殊処理
            if (field === 'items' || field === 'properties') {
                continue;
            }
            
            this.validateField(value, rules, fieldPath, errors);
            
            // 配列の各要素を検証
            if (rules.type === 'array' && rules.items && Array.isArray(value)) {
                value.forEach((item, index) => {
                    this.validateObject(item, rules.items, `${fieldPath}[${index}]`, errors);
                });
            }
            
            // オブジェクトのプロパティを検証
            if (rules.type === 'object' && rules.properties && typeof value === 'object' && value !== null) {
                this.validateObject(value, rules.properties, fieldPath, errors);
            }
        }
    }
    
    /**
     * 単一フィールドの検証
     */
    validateField(value, rules, path, errors) {
        // 必須チェック
        if (rules.required && !this.rules.required(value)) {
            errors.push({
                path: path,
                message: '必須フィールドです',
                type: 'required'
            });
            return; // 必須エラーの場合は他のチェックをスキップ
        }
        
        // 値が存在しない場合で必須でなければスキップ
        if (value === null || value === undefined || value === '') {
            return;
        }
        
        // 型チェック
        if (rules.type && !this.rules[rules.type](value)) {
            errors.push({
                path: path,
                message: `${rules.type}型である必要があります`,
                type: 'type',
                expected: rules.type,
                actual: typeof value
            });
            return; // 型エラーの場合は他のチェックをスキップ
        }
        
        // 最小長チェック
        if (rules.minLength !== undefined && value.length < rules.minLength) {
            errors.push({
                path: path,
                message: `${rules.minLength}文字以上である必要があります`,
                type: 'minLength',
                minLength: rules.minLength,
                actual: value.length
            });
        }
        
        // 最大長チェック
        if (rules.maxLength !== undefined && value.length > rules.maxLength) {
            errors.push({
                path: path,
                message: `${rules.maxLength}文字以下である必要があります`,
                type: 'maxLength',
                maxLength: rules.maxLength,
                actual: value.length
            });
        }
        
        // 最小値チェック
        if (rules.min !== undefined && value < rules.min) {
            errors.push({
                path: path,
                message: `${rules.min}以上である必要があります`,
                type: 'min',
                min: rules.min,
                actual: value
            });
        }
        
        // 最大値チェック
        if (rules.max !== undefined && value > rules.max) {
            errors.push({
                path: path,
                message: `${rules.max}以下である必要があります`,
                type: 'max',
                max: rules.max,
                actual: value
            });
        }
        
        // 範囲チェック
        if (rules.between && !this.rules.between(rules.between[0], rules.between[1])(value)) {
            errors.push({
                path: path,
                message: `${rules.between[0]}から${rules.between[1]}の間である必要があります`,
                type: 'between',
                range: rules.between,
                actual: value
            });
        }
        
        // 列挙型チェック
        if (rules.enum && !rules.enum.includes(value)) {
            errors.push({
                path: path,
                message: `次のいずれかである必要があります: ${rules.enum.join(', ')}`,
                type: 'enum',
                options: rules.enum,
                actual: value
            });
        }
        
        // パターンチェック
        if (rules.pattern && !rules.pattern.test(value)) {
            errors.push({
                path: path,
                message: '正しい形式で入力してください',
                type: 'pattern',
                pattern: rules.pattern.toString()
            });
        }
        
        // カスタムバリデーション
        if (rules.custom && typeof rules.custom === 'function') {
            const customResult = rules.custom(value);
            if (customResult !== true) {
                errors.push({
                    path: path,
                    message: typeof customResult === 'string' ? customResult : 'カスタムバリデーションエラー',
                    type: 'custom'
                });
            }
        }
    }
    
    /**
     * 作品データの検証
     * @param {Object} bookData - 作品データ
     * @returns {Object} 検証結果
     */
    validateBook(bookData) {
        return this.validate(bookData, this.bookSchema);
    }
    
    /**
     * 進捗データの検証
     * @param {Object} progressData - 進捗データ
     * @returns {Object} 検証結果
     */
    validateProgress(progressData) {
        return this.validate(progressData, this.progressSchema);
    }
    
    /**
     * エラーメッセージをユーザーフレンドリーな形式に変換
     * @param {Array} errors - エラー配列
     * @returns {Array} 子ども向けメッセージ配列
     */
    getFriendlyErrorMessages(errors) {
        const friendlyMessages = {
            required: 'ひつようなじょうほうがありません',
            type: 'ただしいかたちでにゅうりょくしてください',
            minLength: 'もうすこしながくかいてください',
            maxLength: 'みじかくしてください',
            min: 'すうじがちいさすぎます',
            max: 'すうじがおおきすぎます',
            between: 'きめられたはんいでにゅうりょくしてください',
            enum: 'えらべるものからえらんでください',
            pattern: 'ただしいかたちでにゅうりょくしてください',
            custom: 'なにかまちがいがあります'
        };
        
        return errors.map(error => {
            const baseMessage = friendlyMessages[error.type] || 'エラーがありました';
            
            // パスを日本語に変換
            const pathLabels = {
                'title': 'タイトル',
                'author': 'さくしゃ',
                'content': 'ほんぶん',
                'text': 'もじ',
                'word': 'ことば',
                'definition': 'せつめい'
            };
            
            const pathParts = error.path.split('.');
            const fieldName = pathLabels[pathParts[pathParts.length - 1]] || pathParts[pathParts.length - 1];
            
            return `${fieldName}：${baseMessage}`;
        });
    }
    
    /**
     * 部分的なデータ検証（単一フィールド）
     * @param {string} fieldName - フィールド名
     * @param {any} value - 値
     * @param {Object} rules - バリデーションルール
     * @returns {Object} 検証結果
     */
    validateField(fieldName, value, rules) {
        const errors = [];
        this.validateField(value, rules, fieldName, errors);
        
        return {
            valid: errors.length === 0,
            errors: errors
        };
    }
    
    /**
     * カスタムバリデーションルールの追加
     * @param {string} name - ルール名
     * @param {Function} validator - バリデーション関数
     */
    addCustomRule(name, validator) {
        this.rules[name] = validator;
    }
    
    /**
     * 入力値のサニタイズ
     * @param {any} value - サニタイズ対象の値
     * @param {string} type - データ型
     * @returns {any} サニタイズ済みの値
     */
    sanitize(value, type) {
        if (value === null || value === undefined) {
            return value;
        }
        
        switch (type) {
            case 'string':
                // HTMLタグの除去とトリム
                return String(value)
                    .replace(/<[^>]*>/g, '')
                    .trim();
                    
            case 'number':
                const num = Number(value);
                return isNaN(num) ? 0 : num;
                
            case 'boolean':
                return Boolean(value);
                
            case 'array':
                return Array.isArray(value) ? value : [];
                
            case 'object':
                return typeof value === 'object' ? value : {};
                
            default:
                return value;
        }
    }
    
    /**
     * フォームデータの一括検証
     * @param {Object} formData - フォームデータ
     * @param {Object} schema - 検証スキーマ
     * @returns {Object} 検証結果とサニタイズ済みデータ
     */
    validateForm(formData, schema) {
        const sanitizedData = {};
        const errors = [];
        
        // 各フィールドをサニタイズして検証
        for (const [field, rules] of Object.entries(schema)) {
            const value = formData[field];
            const sanitized = this.sanitize(value, rules.type);
            sanitizedData[field] = sanitized;
            
            this.validateField(sanitized, rules, field, errors);
        }
        
        return {
            valid: errors.length === 0,
            errors: errors,
            data: sanitizedData
        };
    }
}

// エクスポート
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DataValidator;
}