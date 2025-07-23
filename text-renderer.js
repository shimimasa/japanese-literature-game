/**
 * text-renderer.js - 縦書き表示エンジン
 * 
 * 日本語テキストを縦書きで表示し、ページネーション、
 * 文字サイズ調整、ルビ表示などの機能を提供します。
 */

export class TextRenderer {
    constructor() {
        // 現在の状態
        this.currentBook = null;
        this.currentChapter = 0;
        this.currentPage = 0;
        this.totalPages = 0;
        this.pages = [];
        
        // 表示設定
        this.container = null;
        this.textContainer = null;
        this.pageHeight = 0;
        this.pageWidth = 0;
        this.charsPerLine = 0;
        this.linesPerPage = 0;
        
        // イベントハンドラー
        this.onPageChange = null;
        this.onChapterComplete = null;
        this.onBookComplete = null;
        
        // クリック可能な語句のマップ
        this.annotationMap = new Map();
        
        // タッチ・スワイプ対応
        this.touchStartX = 0;
        this.touchStartY = 0;
        this.minSwipeDistance = 50;
        
        // ページ送りアニメーション
        this.isAnimating = false;
        this.animationDuration = 300; // ms
        
        // 設定
        this.settings = {
            fontSize: 16,
            lineHeight: 1.8,
            letterSpacing: 0.1,
            backgroundColor: 'white',
            textColor: '#333',
            fontFamily: '游明朝, "Yu Mincho", YuMincho, "Hiragino Mincho ProN", "Hiragino Mincho Pro", serif',
            enableAnimation: true,
            enableSound: true
        };
        
        // テーマプリセット
        this.themes = {
            'white': { backgroundColor: '#ffffff', textColor: '#333333' },
            'cream': { backgroundColor: '#f5f2e8', textColor: '#3a3a3a' },
            'mint': { backgroundColor: '#e8f5f2', textColor: '#2a4a3a' },
            'sky': { backgroundColor: '#e8f2f5', textColor: '#2a3a4a' },
            'dark': { backgroundColor: '#1a1a1a', textColor: '#e0e0e0' },
            'high-contrast': { backgroundColor: '#000000', textColor: '#ffffff' }
        };
        
        // キーボードイベントハンドラーのバインド
        this.handleKeyPress = this.handleKeyPress.bind(this);
        this.handleTouchStart = this.handleTouchStart.bind(this);
        this.handleTouchEnd = this.handleTouchEnd.bind(this);
        this.handleResize = this.handleResize.bind(this);
    }
    
    /**
     * 作品をレンダリング
     * @param {Object} book - 作品データ
     * @param {HTMLElement} container - 表示先のコンテナ要素
     */
    async renderBook(book, container) {
        this.currentBook = book;
        this.container = container;
        this.currentChapter = 0;
        this.currentPage = 0;
        
        // コンテナのクリア
        container.innerHTML = '';
        
        // 縦書きコンテナの作成
        this.textContainer = document.createElement('div');
        this.textContainer.className = 'vertical-text-content';
        container.appendChild(this.textContainer);
        
        // 設定の適用
        this.applySettings();
        
        // サイズの計算
        this.calculatePageDimensions();
        
        // 全章のテキストを結合してページ分割
        this.preparePages();
        
        // 最初のページを表示
        this.displayPage(0);
        
        // 注釈のマッピング
        this.buildAnnotationMap();
        
        // イベントハンドラーの設定
        this.setupEventHandlers();
    }
    
    /**
     * ページサイズの計算
     */
    calculatePageDimensions() {
        const containerRect = this.container.getBoundingClientRect();
        this.pageHeight = containerRect.height - 40; // パディング分を引く
        this.pageWidth = containerRect.width - 40;
        
        // 1行あたりの文字数を計算（縦書きなので高さ方向）
        const fontSize = this.settings.fontSize || 16;
        const lineHeight = this.settings.lineHeight || 1.8;
        const letterSpacing = this.settings.letterSpacing || 0.1;
        
        const charHeight = fontSize * lineHeight;
        const lineWidth = fontSize * (1 + letterSpacing) * 1.5; // 縦書きの行幅
        
        this.charsPerLine = Math.floor(this.pageHeight / charHeight);
        this.linesPerPage = Math.floor(this.pageWidth / lineWidth);
        
        // モバイルデバイスの場合は余白を調整
        if (window.innerWidth <= 768) {
            this.charsPerLine = Math.max(10, this.charsPerLine - 2);
            this.linesPerPage = Math.max(8, this.linesPerPage - 1);
        }
    }
    
    /**
     * ページ分割の準備
     */
    preparePages() {
        this.pages = [];
        let currentPageContent = [];
        let currentLineChars = 0;
        let currentLines = 0;
        
        this.currentBook.content.forEach((chapter, chapterIndex) => {
            // 章の開始で新しいページ（章境界での改ページ）
            if (currentPageContent.length > 0 && this.shouldBreakPageAtChapter(currentPageContent)) {
                this.pages.push([...currentPageContent]);
                currentPageContent = [];
                currentLineChars = 0;
                currentLines = 0;
            }
            
            // 章タイトルの追加
            const chapterTitle = `${chapter.title || `第${chapter.chapter}章`}\n\n`;
            const titleChars = Array.from(chapterTitle);
            
            titleChars.forEach(char => {
                currentPageContent.push({
                    char: char,
                    chapterIndex: chapterIndex,
                    isTitle: true
                });
                
                currentLineChars++;
                
                if (char === '\n' || currentLineChars >= this.charsPerLine) {
                    currentLineChars = 0;
                    currentLines++;
                    
                    if (currentLines >= this.linesPerPage) {
                        this.pages.push([...currentPageContent]);
                        currentPageContent = [];
                        currentLines = 0;
                    }
                }
            });
            
            // 本文の処理
            const textWithRuby = this.processTextWithAnnotations(chapter.text, chapter.annotations);
            const chars = this.splitTextIntoChars(textWithRuby);
            
            chars.forEach((charObj, index) => {
                currentPageContent.push({
                    ...charObj,
                    chapterIndex: chapterIndex,
                    isTitle: false
                });
                
                currentLineChars++;
                
                // 文字切れ防止（句読点や閉じ括弧の処理）
                const nextChar = chars[index + 1];
                const shouldNotBreak = this.shouldNotBreakLine(charObj.char, nextChar?.char);
                
                // 改行または行の終わり
                if (charObj.char === '\n' || 
                    (currentLineChars >= this.charsPerLine && !shouldNotBreak)) {
                    currentLineChars = 0;
                    currentLines++;
                    
                    // ページの終わり
                    if (currentLines >= this.linesPerPage) {
                        // 文節単位での改ページ処理
                        const pageBreakIndex = this.findBestPageBreakPoint(currentPageContent);
                        if (pageBreakIndex > 0 && pageBreakIndex < currentPageContent.length - 1) {
                            const nextPageContent = currentPageContent.splice(pageBreakIndex);
                            this.pages.push([...currentPageContent]);
                            currentPageContent = nextPageContent;
                            currentLines = Math.ceil(nextPageContent.length / this.charsPerLine);
                        } else {
                            this.pages.push([...currentPageContent]);
                            currentPageContent = [];
                            currentLines = 0;
                        }
                    }
                }
            });
        });
        
        // 最後のページ
        if (currentPageContent.length > 0) {
            this.pages.push(currentPageContent);
        }
        
        this.totalPages = this.pages.length;
    }
    
    /**
     * 章境界での改ページ判定
     * @param {Array} pageContent - 現在のページ内容
     * @returns {boolean} 改ページすべきか
     */
    shouldBreakPageAtChapter(pageContent) {
        // ページの80%以上が埋まっている場合は改ページ
        const pageFullness = pageContent.length / (this.charsPerLine * this.linesPerPage);
        return pageFullness > 0.8;
    }
    
    /**
     * 行末での文字切れ防止判定
     * @param {string} currentChar - 現在の文字
     * @param {string} nextChar - 次の文字
     * @returns {boolean} 改行を避けるべきか
     */
    shouldNotBreakLine(currentChar, nextChar) {
        if (!nextChar) return false;
        
        // 句読点、閉じ括弧、閉じ引用符は行頭に来ないようにする
        const noBreakAfter = ['。', '、', '」', '』', '）', '］', '｝', '〉', '》', '・'];
        const noBreakBefore = ['「', '『', '（', '［', '｛', '〈', '《'];
        
        return noBreakAfter.includes(nextChar) || noBreakBefore.includes(currentChar);
    }
    
    /**
     * 最適な改ページ位置を見つける
     * @param {Array} pageContent - ページ内容
     * @returns {number} 改ページ位置のインデックス
     */
    findBestPageBreakPoint(pageContent) {
        // 最後の10文字から句読点を探す
        const searchStart = Math.max(0, pageContent.length - 15);
        const punctuations = ['。', '、', '\n'];
        
        for (let i = pageContent.length - 1; i >= searchStart; i--) {
            if (punctuations.includes(pageContent[i].char)) {
                return i + 1; // 句読点の次で改ページ
            }
        }
        
        return -1; // 適切な位置が見つからない
    }
    
    /**
     * 注釈付きテキストの処理
     * @param {string} text - 元のテキスト
     * @param {Array} annotations - 注釈データ
     * @returns {string} 処理済みテキスト
     */
    processTextWithAnnotations(text, annotations) {
        if (!annotations || annotations.length === 0) {
            return text;
        }
        
        let processedText = text;
        
        // 注釈を逆順で処理（後ろから置換することで位置がずれない）
        const sortedAnnotations = [...annotations].sort((a, b) => {
            const posA = text.lastIndexOf(a.word);
            const posB = text.lastIndexOf(b.word);
            return posB - posA;
        });
        
        sortedAnnotations.forEach(annotation => {
            const word = annotation.word;
            const reading = annotation.reading;
            
            if (reading) {
                // ルビ付きの場合
                const rubyHtml = this.createRubyMarkup(word, reading);
                processedText = processedText.replace(new RegExp(word, 'g'), rubyHtml);
            }
        });
        
        return processedText;
    }
    
    /**
     * ルビマークアップの作成
     * @param {string} word - 単語
     * @param {string} reading - 読み仮名
     * @returns {string} ルビマークアップ
     */
    createRubyMarkup(word, reading) {
        // 特殊マーカーを使用してルビ部分を識別
        return `<ruby>${word}<rt>${reading}</rt></ruby>`;
    }
    
    /**
     * テキストを文字単位に分割
     * @param {string} text - 分割するテキスト
     * @returns {Array} 文字オブジェクトの配列
     */
    splitTextIntoChars(text) {
        const chars = [];
        let i = 0;
        
        while (i < text.length) {
            // ルビタグの処理
            if (text.substring(i).startsWith('<ruby>')) {
                const rubyEnd = text.indexOf('</ruby>', i) + 7;
                const rubyContent = text.substring(i, rubyEnd);
                
                // ルビの内容を解析
                const match = rubyContent.match(/<ruby>(.*?)<rt>(.*?)<\/rt><\/ruby>/);
                if (match) {
                    const baseText = match[1];
                    const rubyText = match[2];
                    
                    // 各文字にルビ情報を付加
                    Array.from(baseText).forEach((char, index) => {
                        chars.push({
                            char: char,
                            ruby: index === 0 ? rubyText : null, // 最初の文字にのみルビを付ける
                            hasAnnotation: true
                        });
                    });
                }
                
                i = rubyEnd;
            } else {
                // 通常の文字
                chars.push({
                    char: text[i],
                    ruby: null,
                    hasAnnotation: false
                });
                i++;
            }
        }
        
        return chars;
    }
    
    /**
     * ページを表示
     * @param {number} pageIndex - 表示するページのインデックス
     */
    displayPage(pageIndex) {
        if (pageIndex < 0 || pageIndex >= this.totalPages) {
            return;
        }
        
        this.currentPage = pageIndex;
        const pageContent = this.pages[pageIndex];
        
        // コンテナをクリア
        this.textContainer.innerHTML = '';
        
        // 縦書きレイアウトの作成
        const pageElement = document.createElement('div');
        pageElement.className = 'page-content';
        
        let currentLine = document.createElement('div');
        currentLine.className = 'vertical-line';
        
        pageContent.forEach(charObj => {
            if (charObj.char === '\n') {
                // 改行
                pageElement.appendChild(currentLine);
                currentLine = document.createElement('div');
                currentLine.className = 'vertical-line';
            } else if (!charObj.isSpace) {
                // 文字要素の作成
                const charElement = this.createCharElement(charObj);
                currentLine.appendChild(charElement);
            }
        });
        
        // 最後の行を追加
        if (currentLine.children.length > 0) {
            pageElement.appendChild(currentLine);
        }
        
        this.textContainer.appendChild(pageElement);
        
        // ページ情報の更新
        this.updatePageInfo();
        
        // イベントの発火
        if (this.onPageChange) {
            this.onPageChange(this.currentPage, this.totalPages);
        }
        
        // 章・作品の完了チェック
        this.checkCompletion();
    }
    
    /**
     * 文字要素の作成
     * @param {Object} charObj - 文字オブジェクト
     * @returns {HTMLElement} 文字要素
     */
    createCharElement(charObj) {
        const element = document.createElement('span');
        element.className = 'char';
        
        if (charObj.isTitle) {
            element.classList.add('chapter-title');
        }
        
        if (charObj.hasAnnotation) {
            element.classList.add('annotated');
            element.dataset.word = charObj.char;
        }
        
        if (charObj.ruby) {
            // ルビ付き文字
            const ruby = document.createElement('ruby');
            const rb = document.createElement('rb');
            rb.textContent = charObj.char;
            const rt = document.createElement('rt');
            rt.textContent = charObj.ruby;
            
            ruby.appendChild(rb);
            ruby.appendChild(rt);
            element.appendChild(ruby);
        } else {
            // 通常の文字
            element.textContent = charObj.char;
        }
        
        // 縦書き用の文字調整
        this.adjustCharacterOrientation(element, charObj.char);
        
        return element;
    }
    
    /**
     * 文字の向きを調整
     * @param {HTMLElement} element - 文字要素
     * @param {string} char - 文字
     */
    adjustCharacterOrientation(element, char) {
        // 横向きにすべき文字（半角英数字など）
        const horizontalChars = /[a-zA-Z0-9\-\—]/;
        
        if (horizontalChars.test(char)) {
            element.classList.add('horizontal-in-vertical');
        }
        
        // 特殊な句読点の位置調整
        const punctuation = {
            '、': 'comma',
            '。': 'period',
            '「': 'open-quote',
            '」': 'close-quote',
            '（': 'open-paren',
            '）': 'close-paren'
        };
        
        if (punctuation[char]) {
            element.classList.add(`punct-${punctuation[char]}`);
        }
    }
    
    /**
     * 注釈マップの構築
     */
    buildAnnotationMap() {
        this.annotationMap.clear();
        
        this.currentBook.content.forEach(chapter => {
            if (chapter.annotations) {
                chapter.annotations.forEach(annotation => {
                    this.annotationMap.set(annotation.word, annotation);
                });
            }
        });
    }
    
    /**
     * イベントハンドラーの設定
     */
    setupEventHandlers() {
        // クリックイベント（語句説明）
        this.textContainer.addEventListener('click', (e) => {
            const annotatedElement = e.target.closest('.annotated');
            if (annotatedElement) {
                const word = annotatedElement.dataset.word;
                const annotation = this.annotationMap.get(word);
                
                if (annotation) {
                    this.showAnnotation(annotation, annotatedElement);
                }
            }
        });
        
        // キーボードイベント
        document.addEventListener('keydown', this.handleKeyPress);
        
        // タッチイベント
        this.textContainer.addEventListener('touchstart', this.handleTouchStart, { passive: true });
        this.textContainer.addEventListener('touchend', this.handleTouchEnd);
        
        // ウィンドウリサイズ
        window.addEventListener('resize', this.handleResize);
    }
    
    /**
     * キーボードイベントハンドラー
     * @param {KeyboardEvent} e - キーボードイベント
     */
    handleKeyPress(e) {
        if (this.isAnimating) return;
        
        switch(e.key) {
            case 'ArrowLeft':
            case 'PageUp':
                e.preventDefault();
                this.previousPage();
                break;
            case 'ArrowRight':
            case 'PageDown':
            case ' ':
                e.preventDefault();
                this.nextPage();
                break;
            case 'Home':
                e.preventDefault();
                this.goToPage(1);
                break;
            case 'End':
                e.preventDefault();
                this.goToPage(this.totalPages);
                break;
        }
    }
    
    /**
     * タッチ開始イベントハンドラー
     * @param {TouchEvent} e - タッチイベント
     */
    handleTouchStart(e) {
        this.touchStartX = e.touches[0].clientX;
        this.touchStartY = e.touches[0].clientY;
    }
    
    /**
     * タッチ終了イベントハンドラー
     * @param {TouchEvent} e - タッチイベント
     */
    handleTouchEnd(e) {
        if (this.isAnimating) return;
        
        const touchEndX = e.changedTouches[0].clientX;
        const touchEndY = e.changedTouches[0].clientY;
        
        const deltaX = touchEndX - this.touchStartX;
        const deltaY = touchEndY - this.touchStartY;
        
        // 水平スワイプの判定（縦書きなので左右でページ送り）
        if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > this.minSwipeDistance) {
            if (deltaX > 0) {
                // 右スワイプ（前のページ）
                this.previousPage();
            } else {
                // 左スワイプ（次のページ）
                this.nextPage();
            }
        }
    }
    
    /**
     * リサイズイベントハンドラー
     */
    handleResize() {
        // デバウンス処理
        clearTimeout(this.resizeTimeout);
        this.resizeTimeout = setTimeout(() => {
            this.updateLayout();
        }, 300);
    }
    
    /**
     * 注釈を表示
     * @param {Object} annotation - 注釈データ
     * @param {HTMLElement} element - クリックされた要素
     */
    showAnnotation(annotation, element) {
        // DictionaryServiceに委譲するため、カスタムイベントを発火
        const event = new CustomEvent('show-annotation', {
            detail: {
                annotation: annotation,
                element: element
            }
        });
        document.dispatchEvent(event);
    }
    
    /**
     * ページ情報の更新
     */
    updatePageInfo() {
        document.getElementById('current-page').textContent = this.currentPage + 1;
        document.getElementById('total-pages').textContent = this.totalPages;
        
        // ナビゲーションボタンの状態更新
        document.getElementById('prev-page').disabled = this.currentPage === 0;
        document.getElementById('next-page').disabled = this.currentPage === this.totalPages - 1;
        
        // 進捗バーの更新
        const progress = ((this.currentPage + 1) / this.totalPages) * 100;
        document.querySelector('.progress-fill').style.width = `${progress}%`;
        document.querySelector('.progress-text').textContent = `${Math.round(progress)}%`;
    }
    
    
    /**
     * 指定ページへジャンプ
     * @param {number} pageNumber - ページ番号（1始まり）
     */
    goToPage(pageNumber) {
        const pageIndex = pageNumber - 1;
        if (pageIndex >= 0 && pageIndex < this.totalPages) {
            this.displayPage(pageIndex);
        }
    }
    
    /**
     * 現在の章を取得
     * @returns {number} 現在の章インデックス
     */
    getCurrentChapter() {
        if (!this.pages[this.currentPage] || this.pages[this.currentPage].length === 0) {
            return 0;
        }
        
        // ページ内の最初の要素の章インデックスを返す
        const firstElement = this.pages[this.currentPage][0];
        return firstElement.chapterIndex || 0;
    }
    
    /**
     * 完了状態のチェック
     */
    checkCompletion() {
        // 最後のページかチェック
        if (this.currentPage === this.totalPages - 1) {
            if (this.onBookComplete) {
                this.onBookComplete();
            }
        }
        
        // 章の完了チェック（実装は簡略化）
        const currentChapterIndex = this.pages[this.currentPage][0]?.chapterIndex;
        const nextPageChapterIndex = this.pages[this.currentPage + 1]?.[0]?.chapterIndex;
        
        if (currentChapterIndex !== undefined && 
            nextPageChapterIndex !== undefined && 
            currentChapterIndex !== nextPageChapterIndex) {
            if (this.onChapterComplete) {
                this.onChapterComplete(currentChapterIndex);
            }
        }
    }
    
    /**
     * 現在の読書位置を取得
     * @returns {Object} 読書位置情報
     */
    getCurrentPosition() {
        return {
            bookId: this.currentBook?.id,
            currentPage: this.currentPage,
            totalPages: this.totalPages,
            progress: ((this.currentPage + 1) / this.totalPages) * 100
        };
    }
    
    /**
     * 文字サイズ変更時の再レンダリング
     */
    updateLayout() {
        if (this.currentBook && this.container) {
            const currentProgress = this.currentPage / this.totalPages;
            this.renderBook(this.currentBook, this.container).then(() => {
                // 以前の読書位置に近いページへ移動
                const newPage = Math.floor(currentProgress * this.totalPages);
                this.goToPage(newPage + 1);
            });
        }
    }
    
    /**
     * 設定の適用
     */
    applySettings() {
        const root = document.documentElement;
        
        // CSS変数の更新
        root.style.setProperty('--font-size-base', `${this.settings.fontSize}px`);
        root.style.setProperty('--line-height-base', this.settings.lineHeight);
        root.style.setProperty('--letter-spacing', `${this.settings.letterSpacing}em`);
        root.style.setProperty('--bg-color', this.settings.backgroundColor);
        root.style.setProperty('--text-color', this.settings.textColor);
        root.style.setProperty('--font-family', this.settings.fontFamily);
        
        // コンテナへの直接適用
        if (this.container) {
            this.container.style.backgroundColor = this.settings.backgroundColor;
            this.container.style.color = this.settings.textColor;
            this.container.style.fontFamily = this.settings.fontFamily;
        }
    }
    
    /**
     * 文字サイズの更新
     * @param {string} size - サイズ（'small', 'medium', 'large', 'xlarge'）
     */
    updateFontSize(size) {
        const sizes = {
            'small': 14,
            'medium': 16,
            'large': 20,
            'xlarge': 24
        };
        
        if (sizes[size]) {
            this.settings.fontSize = sizes[size];
            this.settings.lineHeight = size === 'xlarge' ? 2.0 : 1.8;
            this.applySettings();
            this.updateLayout();
        }
    }
    
    /**
     * 行間の更新
     * @param {number} lineHeight - 行間（1.4 - 2.4）
     */
    updateLineHeight(lineHeight) {
        if (lineHeight >= 1.4 && lineHeight <= 2.4) {
            this.settings.lineHeight = lineHeight;
            this.applySettings();
            this.updateLayout();
        }
    }
    
    /**
     * 文字間隔の更新
     * @param {number} letterSpacing - 文字間隔（0 - 0.5）
     */
    updateLetterSpacing(letterSpacing) {
        if (letterSpacing >= 0 && letterSpacing <= 0.5) {
            this.settings.letterSpacing = letterSpacing;
            this.applySettings();
            this.updateLayout();
        }
    }
    
    /**
     * テーマの適用
     * @param {string} themeName - テーマ名
     */
    applyTheme(themeName) {
        const theme = this.themes[themeName];
        if (theme) {
            this.settings.backgroundColor = theme.backgroundColor;
            this.settings.textColor = theme.textColor;
            
            // ダークテーマの場合はフォントウェイトを調整
            if (themeName === 'dark' || themeName === 'high-contrast') {
                document.documentElement.style.setProperty('--font-weight-normal', '300');
            } else {
                document.documentElement.style.setProperty('--font-weight-normal', '400');
            }
            
            this.applySettings();
            
            // テーマ変更イベントを発火
            const event = new CustomEvent('theme-changed', {
                detail: { theme: themeName }
            });
            document.dispatchEvent(event);
        }
    }
    
    /**
     * 設定の取得
     * @returns {Object} 現在の設定
     */
    getSettings() {
        return { ...this.settings };
    }
    
    /**
     * 設定の更新
     * @param {Object} newSettings - 新しい設定
     */
    updateSettings(newSettings) {
        this.settings = { ...this.settings, ...newSettings };
        this.applySettings();
        
        // レイアウトに影響する設定が変更された場合は再レンダリング
        if (newSettings.fontSize || newSettings.lineHeight || newSettings.letterSpacing) {
            this.updateLayout();
        }
    }
    
    /**
     * ページ送りアニメーション付き表示
     * @param {number} pageIndex - 表示するページのインデックス
     * @param {string} direction - アニメーション方向（'next' or 'prev'）
     */
    async displayPageWithAnimation(pageIndex, direction = 'next') {
        if (!this.settings.enableAnimation || this.isAnimating) {
            this.displayPage(pageIndex);
            return;
        }
        
        this.isAnimating = true;
        
        // 現在のページをフェードアウト
        this.textContainer.style.transition = `opacity ${this.animationDuration / 2}ms ease-out`;
        this.textContainer.style.opacity = '0';
        
        await new Promise(resolve => setTimeout(resolve, this.animationDuration / 2));
        
        // 新しいページを表示
        this.displayPage(pageIndex);
        
        // フェードイン
        this.textContainer.style.opacity = '1';
        
        await new Promise(resolve => setTimeout(resolve, this.animationDuration / 2));
        
        this.textContainer.style.transition = '';
        this.isAnimating = false;
    }
    
    /**
     * 次のページへ（アニメーション付き）
     */
    nextPage() {
        if (this.currentPage < this.totalPages - 1) {
            if (this.settings.enableAnimation) {
                this.displayPageWithAnimation(this.currentPage + 1, 'next');
            } else {
                this.displayPage(this.currentPage + 1);
            }
        }
    }
    
    /**
     * 前のページへ（アニメーション付き）
     */
    previousPage() {
        if (this.currentPage > 0) {
            if (this.settings.enableAnimation) {
                this.displayPageWithAnimation(this.currentPage - 1, 'prev');
            } else {
                this.displayPage(this.currentPage - 1);
            }
        }
    }
    
    /**
     * クリーンアップ
     */
    cleanup() {
        // イベントリスナーの削除
        document.removeEventListener('keydown', this.handleKeyPress);
        window.removeEventListener('resize', this.handleResize);
        
        if (this.textContainer) {
            this.textContainer.removeEventListener('touchstart', this.handleTouchStart);
            this.textContainer.removeEventListener('touchend', this.handleTouchEnd);
        }
        
        // タイマーのクリア
        clearTimeout(this.resizeTimeout);
    }
}