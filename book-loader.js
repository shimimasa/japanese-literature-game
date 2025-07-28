/**
 * book-loader.js - JSON読み込みサービス
 * 
 * 作品データのJSONファイルを読み込み、バリデーションを行い、
 * アプリケーションで使用可能な形式に変換します。
 */

class BookLoader {
    constructor() {
        // DataValidatorのインスタンス
        this.validator = new DataValidator();
        
        // 読み込み済みの作品をキャッシュ
        this.loadedBooks = null;
        
        // デフォルトの作品ファイルリスト
        this.defaultBookFiles = [
            'momotaro.json',
            'gongitsune.json',
            'hashire_melos.json'
        ];
        
        // 作品リストファイル
        this.worksListFile = 'works_list.json';
        
        // 複数のディレクトリサポート
        this.bookDirectories = [
            './books/',
            './works/'
        ];
        
        // バリデーションエラーメッセージ
        this.errorMessages = {
            'MISSING_FIELD': 'が見つかりません',
            'INVALID_TYPE': 'の形式が正しくありません',
            'EMPTY_CONTENT': 'コンテンツが空です',
            'INVALID_DIFFICULTY': '難易度の値が正しくありません',
            'INVALID_LENGTH': '作品の長さの値が正しくありません',
            'PARSE_ERROR': 'JSONファイルの解析に失敗しました',
            'NETWORK_ERROR': 'ファイルの読み込み中にネットワークエラーが発生しました',
            'FILE_NOT_FOUND': 'ファイルが見つかりません',
            'EMPTY_FILE': 'ファイルが空です',
            'INVALID_JSON': 'JSONファイルの形式が正しくありません'
        };
        
        // 子ども向けエラーメッセージ辞書
        this.friendlyErrorMessages = {
            'MISSING_FIELD': 'この本には大切な情報が足りません',
            'INVALID_TYPE': '本のデータがおかしいみたいです',
            'EMPTY_CONTENT': 'この本には内容がありません',
            'INVALID_DIFFICULTY': 'むずかしさの設定がおかしいです',
            'INVALID_LENGTH': '本の長さの設定がおかしいです',
            'PARSE_ERROR': '本のデータが読めませんでした',
            'NETWORK_ERROR': 'インターネットの調子が悪いみたいです。もう一度やってみてください',
            'FILE_NOT_FOUND': 'この本が見つかりませんでした',
            'EMPTY_FILE': '本の中身がからっぽです',
            'INVALID_JSON': '本のデータがこわれているみたいです'
        };
    }
    
    /**
     * 複数の作品ファイルを読み込む
     * @param {string} directory - 作品ファイルが格納されているディレクトリ（未使用）
     * @returns {Promise<Array>} 作品データの配列
     */
    async loadBooks(directory) {
        const books = [];
        const errors = [];
        
        try {
            // works_list.jsonから作品リストを取得
            const bookList = await this.loadBookList(directory);
            
            // 作品リストが見つかった場合はそれを使用、なければデフォルト
            const filesToLoad = bookList.length > 0 ? 
                bookList.map(id => `${id}.json`) : 
                this.defaultBookFiles;
            
            // 各ファイルを並列で読み込み
            const promises = filesToLoad.map(filename => 
                this.loadSingleBookFromMultipleDirs(filename)
                    .catch(error => {
                        errors.push({
                            filename,
                            error: error.message,
                            details: error.stack
                        });
                        console.error(`Failed to load ${filename}:`, error);
                        return null;
                    })
            );
            
            const results = await Promise.all(promises);
            
            // 成功した読み込みのみを追加
            results.forEach(book => {
                if (book) {
                    books.push(book);
                }
            });
            
            // エラーがあれば警告
            if (errors.length > 0) {
                console.warn('一部の作品ファイルの読み込みに失敗しました:', errors);
            }
            
            // 少なくとも1つの作品が読み込めたか確認
            if (books.length === 0) {
                throw new Error('作品が1つも読み込めませんでした');
            }
            
            // キャッシュに保存
            this.loadedBooks = books;
            return books;
            
        } catch (error) {
            console.error('作品の読み込み中にエラーが発生しました:', error);
            throw new Error('作品データの読み込みに失敗しました');
        }
    }
    
    /**
     * works_list.jsonから作品リストを読み込む
     * @param {string} directory - ディレクトリパス
     * @returns {Promise<Array>} 作品IDのリスト
     */
    async loadBookList(directory) {
        try {
            // 複数のディレクトリから探す
            for (const dir of this.bookDirectories) {
                try {
                    const response = await fetch(`${dir}${this.worksListFile}`);
                    if (response.ok) {
                        const data = await response.json();
                        if (data.works && Array.isArray(data.works)) {
                            return data.works;
                        }
                    }
                } catch (e) {
                    // このディレクトリでは見つからなかった
                    continue;
                }
            }
        } catch (error) {
            console.warn('works_list.jsonの読み込みに失敗しました:', error);
        }
        
        return [];
    }
    
    /**
     * 複数のディレクトリから単一の作品ファイルを読み込む
     * @param {string} filename - ファイル名
     * @returns {Promise<Object>} 作品データ
     */
    async loadSingleBookFromMultipleDirs(filename) {
        let lastError = null;
        
        // 各ディレクトリを順に試す
        for (const dir of this.bookDirectories) {
            try {
                const book = await this.loadSingleBook(`${dir}${filename}`);
                if (book) {
                    return book;
                }
            } catch (error) {
                lastError = error;
                // 次のディレクトリを試す
                continue;
            }
        }
        
        // すべてのディレクトリで失敗
        throw lastError || new Error(`ファイルが見つかりません: ${filename}`);
    }
    
    /**
     * 単一の作品ファイルを読み込む
     * @param {string} filepath - 作品ファイルのパス
     * @returns {Promise<Object>} 作品データ
     */
    async loadSingleBook(filepath) {
        try {
            // 絶対URLの構築
            const url = new URL(filepath, window.location.href).href;
            const response = await fetch(url);
            
            if (!response.ok) {
                if (response.status === 404) {
                    throw new Error(this.createFriendlyError('FILE_NOT_FOUND', filepath));
                } else if (response.status >= 500) {
                    throw new Error(this.createFriendlyError('NETWORK_ERROR'));
                }
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const text = await response.text();
            
            // 空ファイルチェック
            if (!text || text.trim().length === 0) {
                throw new Error(this.createFriendlyError('EMPTY_FILE', filepath));
            }
            
            const bookData = this.parseBookContent(text);
            
            // BookAdapterを使用してデータを正規化（新旧両形式対忍）
            let normalizedData;
            try {
                normalizedData = BookAdapter.normalize(bookData);
            } catch (adapterError) {
                console.error('BookAdapter error:', adapterError);
                // BookAdapterが失敗した場合は元のデータを使用
                normalizedData = bookData;
            }
            
            // 簡易バリデーション（必須フィールドのみ）
            if (!normalizedData.id || !normalizedData.title || !normalizedData.author || !normalizedData.content) {
                throw new Error(this.createFriendlyError('MISSING_FIELD'));
            }
            
            // コンテンツが配列であることを確認
            if (!Array.isArray(normalizedData.content) || normalizedData.content.length === 0) {
                throw new Error(this.createFriendlyError('EMPTY_CONTENT'));
            }
            
            // データを返す（normalizeBookDataの呼び出しを避ける）
            return normalizedData;
            
        } catch (error) {
            // ネットワークエラーの詳細判定
            if (error instanceof TypeError && error.message.includes('fetch')) {
                throw new Error(this.createFriendlyError('NETWORK_ERROR'));
            }
            
            if (error.name === 'SyntaxError') {
                throw new Error(this.createFriendlyError('PARSE_ERROR', filepath));
            }
            
            // エラーの再スロー（既にフレンドリーエラーの場合はそのまま）
            if (error.message.includes('📚')) {
                throw error;
            }
            
            throw new Error(`${filepath}: ${error.message}`);
        }
    }
    
    /**
     * JSONテキストをパース
     * @param {string} rawData - JSON文字列
     * @returns {Object} パースされたデータ
     */
    parseBookContent(rawData) {
        try {
            return JSON.parse(rawData);
        } catch (error) {
            // より詳細なエラー情報を提供
            const match = error.message.match(/position (\d+)/);
            if (match) {
                const position = parseInt(match[1]);
                const lines = rawData.substring(0, position).split('\n');
                const lineNumber = lines.length;
                const columnNumber = lines[lines.length - 1].length + 1;
                
                // エラー周辺のコンテキストを取得
                const contextStart = Math.max(0, position - 50);
                const contextEnd = Math.min(rawData.length, position + 50);
                const errorContext = rawData.substring(contextStart, contextEnd);
                
                throw new Error(`JSON解析エラー (行 ${lineNumber}, 列 ${columnNumber}): ${error.message}\n` +
                               `エラー位置の周辺: ...${errorContext}...`);
            }
            throw error;
        }
    }
    
    /**
     * 子ども向けのフレンドリーなエラーメッセージを作成
     * @param {string} errorType - エラータイプ
     * @param {string} details - 追加の詳細情報
     * @returns {string} フレンドリーなエラーメッセージ
     */
    createFriendlyError(errorType, details = '') {
        const friendlyMessage = this.friendlyErrorMessages[errorType] || 'なにかがうまくいきませんでした';
        const technicalMessage = this.errorMessages[errorType] || errorType;
        
        // 子ども向けメッセージと技術的な詳細の両方を含める
        return `📚 ${friendlyMessage}\n` +
               `（詳細: ${technicalMessage}${details ? ` - ${details}` : ''}）`;
    }
    
    /**
     * 作品データのバリデーション
     * @param {Object} bookData - 検証する作品データ
     * @throws {Error} バリデーションエラー
     */
    validateBookFormat(bookData) {
        // DataValidatorを使用した包括的なバリデーション
        // スタックオーバーフローを避けるため一時的にコメントアウト
        // const validationResult = this.validator.validateBook(bookData);
        
        if (!validationResult.valid) {
            // エラーメッセージを子ども向けに変換
            const friendlyMessages = this.validator.getFriendlyErrorMessages(validationResult.errors);
            
            // エラーハンドラーで詳細なエラー情報を記録
            errorHandler.handleDataError(
                new Error('Book validation failed'),
                {
                    bookId: bookData.id || 'unknown',
                    errors: validationResult.errors
                }
            );
            
            // 最初のエラーメッセージを使用してエラーをスロー
            throw new Error(this.createFriendlyError('INVALID_TYPE', friendlyMessages[0]));
        }
        
        // 追加の内容チェック（後方互換性のため）
        if (!bookData.content || bookData.content.length === 0) {
            throw new Error(this.createFriendlyError('EMPTY_CONTENT'));
        }
        
        // 旧実装との互換性のため、必須フィールドのチェックも残す
        const requiredFields = ['id', 'title', 'author', 'content'];
        for (const field of requiredFields) {
            if (!bookData[field]) {
                throw new Error(`${field} ${this.errorMessages.MISSING_FIELD}`);
            }
        }
        
        // データ型のチェック
        if (typeof bookData.id !== 'string') {
            throw new Error(`id ${this.errorMessages.INVALID_TYPE}`);
        }
        
        if (typeof bookData.title !== 'string') {
            throw new Error(`title ${this.errorMessages.INVALID_TYPE}`);
        }
        
        if (typeof bookData.author !== 'string') {
            throw new Error(`author ${this.errorMessages.INVALID_TYPE}`);
        }
        
        if (!Array.isArray(bookData.content)) {
            throw new Error(`content ${this.errorMessages.INVALID_TYPE}`);
        }
        
        if (bookData.content.length === 0) {
            throw new Error(this.errorMessages.EMPTY_CONTENT);
        }
        
        // コンテンツの詳細チェック
        bookData.content.forEach((chapter, index) => {
            this.validateChapter(chapter, index);
        });
        
        // オプションフィールドのチェック
        if (bookData.difficulty) {
            const validDifficulties = ['beginner', 'intermediate', 'advanced'];
            if (!validDifficulties.includes(bookData.difficulty)) {
                throw new Error(this.errorMessages.INVALID_DIFFICULTY);
            }
        }
        
        if (bookData.length) {
            const validLengths = ['short', 'medium', 'long'];
            if (!validLengths.includes(bookData.length)) {
                throw new Error(this.errorMessages.INVALID_LENGTH);
            }
        }
    }
    
    /**
     * 章データのバリデーション
     * @param {Object} chapter - 検証する章データ
     * @param {number} index - 章のインデックス
     * @throws {Error} バリデーションエラー
     */
    validateChapter(chapter, index) {
        if (!chapter.chapter || typeof chapter.chapter !== 'number') {
            throw new Error(`章 ${index + 1}: chapter番号 ${this.errorMessages.INVALID_TYPE}`);
        }
        
        if (!chapter.text || typeof chapter.text !== 'string') {
            throw new Error(`章 ${chapter.chapter}: text ${this.errorMessages.INVALID_TYPE}`);
        }
        
        if (chapter.text.trim().length === 0) {
            throw new Error(`章 ${chapter.chapter}: テキストが空です`);
        }
        
        // 注釈のバリデーション
        if (chapter.annotations && Array.isArray(chapter.annotations)) {
            chapter.annotations.forEach((annotation, i) => {
                this.validateAnnotation(annotation, chapter.chapter, i);
            });
        }
    }
    
    /**
     * 注釈データのバリデーション
     * @param {Object} annotation - 検証する注釈データ
     * @param {number} chapterNum - 章番号
     * @param {number} index - 注釈のインデックス
     * @throws {Error} バリデーションエラー
     */
    validateAnnotation(annotation, chapterNum, index) {
        if (!annotation.word || typeof annotation.word !== 'string') {
            throw new Error(`章 ${chapterNum} 注釈 ${index + 1}: word ${this.errorMessages.INVALID_TYPE}`);
        }
        
        if (!annotation.definition || typeof annotation.definition !== 'string') {
            throw new Error(`章 ${chapterNum} 注釈 ${index + 1}: definition ${this.errorMessages.INVALID_TYPE}`);
        }
    }
    
    /**
     * 作品データの正規化
     * @param {Object} bookData - 正規化する作品データ
     * @returns {Object} 正規化された作品データ
     */
    normalizeBookData(bookData) {
        // デフォルト値の設定
        const normalized = {
            id: bookData.id,
            title: bookData.title.trim(),
            author: bookData.author.trim(),
            category: bookData.category || 'general',
            difficulty: bookData.difficulty || 'intermediate',
            length: bookData.length || this.calculateLength(bookData.content),
            content: bookData.content.map(chapter => this.normalizeChapter(chapter)),
            metadata: {
                totalChapters: bookData.content.length,
                estimatedReadingTime: this.calculateReadingTime(bookData.content),
                ageRecommendation: bookData.metadata?.ageRecommendation || this.getAgeRecommendation(bookData.difficulty)
            }
        };
        
        return normalized;
    }
    
    /**
     * 章データの正規化
     * @param {Object} chapter - 正規化する章データ
     * @returns {Object} 正規化された章データ
     */
    normalizeChapter(chapter) {
        return {
            chapter: chapter.chapter,
            title: chapter.title || `第${chapter.chapter}章`,
            text: chapter.text.trim(),
            annotations: chapter.annotations ? 
                chapter.annotations.map(ann => this.normalizeAnnotation(ann)) : []
        };
    }
    
    /**
     * 注釈データの正規化
     * @param {Object} annotation - 正規化する注釈データ
     * @returns {Object} 正規化された注釈データ
     */
    normalizeAnnotation(annotation) {
        return {
            word: annotation.word.trim(),
            reading: annotation.reading || '',
            definition: annotation.definition.trim()
        };
    }
    
    /**
     * 作品の長さを計算
     * @param {Array} content - 作品のコンテンツ
     * @returns {string} 'short', 'medium', 'long'のいずれか
     */
    calculateLength(content) {
        const totalChars = content.reduce((sum, chapter) => {
            return sum + chapter.text.length;
        }, 0);
        
        if (totalChars < 5000) return 'short';
        if (totalChars < 20000) return 'medium';
        return 'long';
    }
    
    /**
     * 推定読書時間を計算（分単位）
     * @param {Array} content - 作品のコンテンツ
     * @returns {number} 推定読書時間（分）
     */
    calculateReadingTime(content) {
        const totalChars = content.reduce((sum, chapter) => {
            return sum + chapter.text.length;
        }, 0);
        
        // 平均的な読書速度: 400文字/分
        const readingSpeed = 400;
        return Math.ceil(totalChars / readingSpeed);
    }
    
    /**
     * 難易度に基づく推奨年齢を取得
     * @param {string} difficulty - 難易度
     * @returns {string} 推奨年齢
     */
    getAgeRecommendation(difficulty) {
        const recommendations = {
            'beginner': '8-10',
            'intermediate': '10-12',
            'advanced': '12+'
        };
        return recommendations[difficulty] || '10-12';
    }
    
    /**
     * 新しい作品ファイルの動的追加
     * @param {File} file - 追加するファイル
     * @returns {Promise<Object>} 追加された作品データ
     */
    async addBookFromFile(file) {
        try {
            const text = await file.text();
            const bookData = this.parseBookContent(text);
            
            // バリデーション
            this.validateBookFormat(bookData);
            
            // 重複チェック
            if (this.defaultBookFiles.includes(file.name)) {
                throw new Error('この作品は既に登録されています');
            }
            
            // データの正規化
            return this.normalizeBookData(bookData);
            
        } catch (error) {
            throw new Error(`ファイル "${file.name}" の読み込みエラー: ${error.message}`);
        }
    }
    
    /**
     * 作品データの検索
     * @param {Array} books - 作品データの配列
     * @param {string} query - 検索クエリ
     * @returns {Array} 検索結果
     */
    searchBooks(books, query) {
        const lowerQuery = query.toLowerCase();
        
        return books.filter(book => {
            // タイトル、作者、本文での検索
            const inTitle = book.title.toLowerCase().includes(lowerQuery);
            const inAuthor = book.author.toLowerCase().includes(lowerQuery);
            const inContent = book.content.some(chapter => 
                chapter.text.toLowerCase().includes(lowerQuery)
            );
            
            return inTitle || inAuthor || inContent;
        });
    }
    
    /**
     * 読み込み済みの作品を取得
     * @returns {Array} 読み込み済みの作品リスト
     */
    async getLoadedBooks() {
        // キャッシュがあればそれを返す
        if (this.loadedBooks !== null) {
            return this.loadedBooks;
        }
        
        // キャッシュがなければ読み込み
        try {
            this.loadedBooks = await this.loadBooks();
            return this.loadedBooks;
        } catch (error) {
            console.error('getLoadedBooks error:', error);
            return [];
        }
    }
}

// グローバルに公開
if (typeof window !== 'undefined') {
    window.BookLoader = BookLoader;
}