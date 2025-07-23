/**
 * BookAdapter - 新旧JSONフォーマットの変換を行うアダプタークラス
 * 
 * 青空文庫形式の新フォーマットを既存システムの旧フォーマットに変換します。
 * これにより、既存のコードを変更せずに新しい作品を追加できます。
 */
export class BookAdapter {
    constructor() {
        // 難易度マッピング
        this.difficultyMap = {
            1: 'beginner',
            2: 'beginner',
            3: 'beginner',
            4: 'intermediate',
            5: 'intermediate',
            6: 'intermediate',
            7: 'advanced',
            8: 'advanced',
            9: 'advanced',
            10: 'advanced'
        };
        
        // 文字数による長さの判定
        this.lengthThresholds = {
            short: 3000,      // 3000文字以下
            medium: 10000,    // 10000文字以下
            long: Infinity    // それ以上
        };
    }
    
    /**
     * 作品データを正規化（新旧両形式に対応）
     * @param {Object} bookData - 作品データ
     * @returns {Object} 正規化された作品データ
     */
    static normalize(bookData) {
        const adapter = new BookAdapter();
        
        // 新形式を検出（content.linesがある場合）
        if (bookData.content && bookData.content.lines) {
            return adapter.convertFromAozora(bookData);
        }
        
        // 旧形式を検出（content配列の場合）
        if (Array.isArray(bookData.content)) {
            return adapter.ensureOldFormat(bookData);
        }
        
        // それ以外の形式はエラー
        throw new Error(`Unknown book format for: ${bookData.id || 'unknown'}`);
    }
    
    /**
     * 青空文庫形式（新形式）から旧形式への変換
     * @param {Object} data - 青空文庫形式のデータ
     * @returns {Object} 旧形式のデータ
     */
    convertFromAozora(data) {
        // 基本情報の抽出
        const id = data.id || 'unknown';
        const title = data.title || '無題';
        const author = this.extractAuthor(data.author);
        const difficulty = this.mapDifficulty(data.metadata?.difficulty?.overall);
        const length = this.calculateLength(data.metadata?.totalCharacters);
        
        // コンテンツの変換
        const content = this.convertContent(data.content.lines);
        
        // メタデータの保持（拡張用）
        const metadata = {
            ...data.metadata,
            originalFormat: 'aozora'
        };
        
        return {
            id,
            title,
            author,
            category: 'author', // デフォルト値
            difficulty,
            length,
            content,
            metadata
        };
    }
    
    /**
     * 旧形式の確認と補完
     * @param {Object} data - 旧形式のデータ
     * @returns {Object} 補完された旧形式のデータ
     */
    ensureOldFormat(data) {
        // 必須フィールドの補完
        return {
            id: data.id || 'unknown',
            title: data.title || '無題',
            author: data.author || '作者不詳',
            category: data.category || 'author',
            difficulty: data.difficulty || 'intermediate',
            length: data.length || this.estimateLength(data.content),
            content: this.ensureContentFormat(data.content),
            metadata: data.metadata || {}
        };
    }
    
    /**
     * 作者情報の抽出
     * @param {string|Object} author - 作者データ
     * @returns {string} 作者名
     */
    extractAuthor(author) {
        if (typeof author === 'string') {
            return author;
        }
        if (author && typeof author === 'object') {
            return author.name || '作者不詳';
        }
        return '作者不詳';
    }
    
    /**
     * 難易度のマッピング
     * @param {number} overallDifficulty - 数値難易度（1-10）
     * @returns {string} 文字列難易度（beginner/intermediate/advanced）
     */
    mapDifficulty(overallDifficulty) {
        if (!overallDifficulty) return 'intermediate';
        return this.difficultyMap[overallDifficulty] || 'intermediate';
    }
    
    /**
     * 文字数から長さを計算
     * @param {number} characterCount - 文字数
     * @returns {string} 長さ（short/medium/long）
     */
    calculateLength(characterCount) {
        if (!characterCount) return 'medium';
        
        if (characterCount <= this.lengthThresholds.short) return 'short';
        if (characterCount <= this.lengthThresholds.medium) return 'medium';
        return 'long';
    }
    
    /**
     * 新形式のコンテンツを旧形式に変換
     * @param {Array} lines - 新形式の行データ
     * @returns {Array} 旧形式の章データ
     */
    convertContent(lines) {
        if (!lines || !Array.isArray(lines)) {
            return [{
                chapter: 1,
                title: '',
                text: '',
                annotations: []
            }];
        }
        
        // 全テキストを結合
        let fullText = '';
        const annotations = [];
        let currentPosition = 0;
        
        lines.forEach(line => {
            if (line.segments) {
                line.segments.forEach(segment => {
                    if (segment.type === 'text' && segment.content) {
                        // ルビ記法の処理
                        const processed = this.processRubyNotation(
                            segment.content, 
                            currentPosition, 
                            annotations
                        );
                        fullText += processed.text;
                        currentPosition += processed.text.length;
                    }
                });
            }
            // 改行を追加（段落の区切り）
            fullText += '\n';
            currentPosition += 1;
        });
        
        // 章分割の検出（簡易版：一定文字数で分割）
        const chapters = this.splitIntoChapters(fullText, annotations);
        
        return chapters;
    }
    
    /**
     * ルビ記法の処理
     * @param {string} text - ルビ記法を含むテキスト
     * @param {number} startPosition - テキストの開始位置
     * @param {Array} annotations - アノテーション配列
     * @returns {Object} 処理済みテキストと長さ
     */
    processRubyNotation(text, startPosition, annotations) {
        // 青空文庫形式のルビ記法を処理
        // パターン1: 漢字《かんじ》
        // パターン2: ｜漢字《かんじ》
        
        let processedText = text;
        let offset = 0;
        
        // パターン1: 直前の漢字に対するルビ
        const rubyPattern1 = /([\u4e00-\u9faf]+)《([^》]+)》/g;
        processedText = processedText.replace(rubyPattern1, (match, kanji, reading) => {
            annotations.push({
                word: kanji,
                reading: reading,
                definition: '', // 定義は後で追加可能
                position: startPosition + match.index - offset
            });
            offset += match.length - kanji.length;
            return kanji;
        });
        
        // パターン2: 範囲指定のルビ
        const rubyPattern2 = /｜([^《]+)《([^》]+)》/g;
        processedText = processedText.replace(rubyPattern2, (match, word, reading) => {
            annotations.push({
                word: word,
                reading: reading,
                definition: '',
                position: startPosition + match.index - offset
            });
            offset += match.length - word.length;
            return word;
        });
        
        return {
            text: processedText,
            length: processedText.length
        };
    }
    
    /**
     * テキストを章に分割
     * @param {string} fullText - 全テキスト
     * @param {Array} annotations - アノテーション
     * @returns {Array} 章の配列
     */
    splitIntoChapters(fullText, annotations) {
        // 簡易実装：5000文字ごとに章を分割
        const chapterSize = 5000;
        const chapters = [];
        
        for (let i = 0; i < fullText.length; i += chapterSize) {
            const chapterText = fullText.slice(i, i + chapterSize);
            const chapterNumber = Math.floor(i / chapterSize) + 1;
            
            // この章に含まれるアノテーションを抽出
            const chapterAnnotations = annotations
                .filter(ann => ann.position >= i && ann.position < i + chapterSize)
                .map(ann => ({
                    word: ann.word,
                    reading: ann.reading,
                    definition: ann.definition
                }));
            
            chapters.push({
                chapter: chapterNumber,
                title: `第${chapterNumber}章`,
                text: chapterText.trim(),
                annotations: chapterAnnotations
            });
        }
        
        // 章が作成されなかった場合のフォールバック
        if (chapters.length === 0) {
            chapters.push({
                chapter: 1,
                title: '',
                text: fullText.trim(),
                annotations: annotations.map(ann => ({
                    word: ann.word,
                    reading: ann.reading,
                    definition: ann.definition
                }))
            });
        }
        
        return chapters;
    }
    
    /**
     * コンテンツの長さを推定
     * @param {Array} content - コンテンツ配列
     * @returns {string} 推定された長さ
     */
    estimateLength(content) {
        if (!Array.isArray(content)) return 'medium';
        
        const totalChars = content.reduce((sum, chapter) => {
            return sum + (chapter.text ? chapter.text.length : 0);
        }, 0);
        
        return this.calculateLength(totalChars);
    }
    
    /**
     * コンテンツ形式の確認
     * @param {Array} content - コンテンツ配列
     * @returns {Array} 正しい形式のコンテンツ
     */
    ensureContentFormat(content) {
        if (!Array.isArray(content)) {
            return [{
                chapter: 1,
                title: '',
                text: String(content),
                annotations: []
            }];
        }
        
        return content.map((chapter, index) => ({
            chapter: chapter.chapter || index + 1,
            title: chapter.title || '',
            text: chapter.text || '',
            annotations: chapter.annotations || []
        }));
    }
    
    /**
     * 拡張メタデータから追加情報を抽出
     * @param {Object} bookData - 正規化された作品データ
     * @returns {Object} 追加情報
     */
    static extractExtendedInfo(bookData) {
        const metadata = bookData.metadata || {};
        
        return {
            gradeLevel: metadata.gradeLevel,
            themes: metadata.themes || [],
            estimatedReadingTime: metadata.estimatedReadingTime,
            totalCharacters: metadata.totalCharacters,
            genres: metadata.genres || [],
            publishedYear: metadata.publishedYear,
            jlptLevel: metadata.jlptLevel,
            teachingPoints: metadata.teachingPoints || []
        };
    }
}

// エクスポート
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BookAdapter;
}