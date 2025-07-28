/**
 * アプリケーション全体を統合管理するコントローラー
 * すべてのサービスクラスの初期化、依存関係の解決、状態管理を担当
 */

class AppController {
    constructor() {
        // サービスインスタンス
        this.services = {
            bookLoader: null,
            bookAdapter: null,
            storageManager: null,
            textRenderer: null,
            dictionaryService: null,
            gameManager: null,
            progressManager: null,
            uiManager: null,
            errorHandler: null,
            dataValidator: null,
            performanceOptimizer: null,
            memoryManager: null
        };

        // アプリケーション状態
        this.state = {
            currentView: 'library', // library, reading, settings, progress
            currentBook: null,
            currentChapter: 0,
            currentPage: 0,
            isLoading: false,
            isInitialized: false
        };

        // イベントバス
        this.eventBus = new EventEmitter();

        // 設定
        this.config = {
            debugMode: false,
            autoSaveInterval: 5000, // 5秒
            cacheEnabled: true,
            maxRecentBooks: 10
        };

        // 自動保存タイマー
        this.autoSaveTimer = null;
    }

    /**
     * アプリケーション初期化
     */
    async initialize() {
        try {
            this.setState({ isLoading: true });
            
            // デバッグモードの確認
            this.config.debugMode = localStorage.getItem('debugMode') === 'true';
            if (this.config.debugMode) {
            }

            // 1. ErrorHandlerとDataValidatorの初期化（他のサービスが依存）
            this.services.errorHandler = new ErrorHandler();
            this.services.dataValidator = new DataValidator();

            // 2. StorageManagerの初期化
            this.services.storageManager = new StorageManager();

            // 3. コアサービスの初期化
            this.services.bookAdapter = new BookAdapter();
            this.services.bookLoader = new BookLoader();

            // 4. UIサービスの初期化
            this.services.textRenderer = new TextRenderer();
            this.services.dictionaryService = new DictionaryService();
            this.services.uiManager = new UIManager();

            // 5. ゲーム関連サービスの初期化
            this.services.gameManager = new GameManager(this.services.storageManager);
            this.services.progressManager = new ProgressManager(this.services.storageManager, this.services.gameManager);

            // 6. パフォーマンス最適化とメモリ管理の初期化
            this.services.performanceOptimizer = new PerformanceOptimizer();
            this.services.memoryManager = new MemoryManager();
            this.services.performanceOptimizer.initialize();
            this.services.memoryManager.initialize();

            // 7. イベントリスナーの設定
            this.setupEventListeners();

            // 8. 初期データの読み込み
            await this.loadInitialData();

            // 9. UIの初期化（initializeメソッドが存在しないためコメントアウト）
            // await this.services.uiManager.initialize();

            // 10. オンボーディングフローの確認と実行
            await this.checkAndRunOnboarding();

            // 11. 自動保存の開始
            this.startAutoSave();

            this.setState({ isInitialized: true, isLoading: false });
            
            if (this.config.debugMode) {
            }

            // 初期画面の表示（オンボーディング完了後）
            if (localStorage.getItem('onboardingCompleted') === 'true') {
                this.showView('library');
            }

        } catch (error) {
            this.handleError(error, 'アプリケーション初期化エラー');
            this.setState({ isLoading: false });
        }
    }

    /**
     * オンボーディングフローの確認と実行
     */
    async checkAndRunOnboarding() {
        // OnboardingFlowのインスタンス作成
        const onboarding = new OnboardingFlow();
        
        // 完了時のコールバック設定
        onboarding.onComplete = () => {
            // オンボーディング完了後の処理
            this.showView('library');
            
            // ウェルカム通知
            this.services.uiManager.showNotification(
                '読書の旅を始めましょう！',
                'success',
                5000
            );
        };
        
        // オンボーディング開始
        onboarding.start();
    }

    /**
     * イベントリスナーの設定
     */
    setupEventListeners() {
        // サービス間のイベント連携
        this.eventBus.on('book:selected', (book) => this.handleBookSelected(book));
        this.eventBus.on('page:changed', (data) => this.handlePageChanged(data));
        this.eventBus.on('word:clicked', (word) => this.handleWordClicked(word));
        this.eventBus.on('achievement:unlocked', (achievement) => this.handleAchievementUnlocked(achievement));
        this.eventBus.on('settings:changed', (settings) => this.handleSettingsChanged(settings));
        this.eventBus.on('view:change', (view) => this.showView(view));
        
        // エラーイベント
        this.eventBus.on('error', (error) => this.handleError(error));

        // ブラウザイベント
        window.addEventListener('beforeunload', () => this.saveCurrentState());
        window.addEventListener('online', () => this.handleOnlineStatusChange(true));
        window.addEventListener('offline', () => this.handleOnlineStatusChange(false));
        
        // パフォーマンス監視
        if (this.config.debugMode) {
            window.addEventListener('error', (e) => {
                console.error('グローバルエラー:', e);
                this.services.errorHandler.logError(e.error || e);
            });
            
            window.addEventListener('unhandledrejection', (e) => {
                console.error('未処理のPromise rejection:', e);
                this.services.errorHandler.logError(e.reason);
            });
        }
    }

    /**
     * 初期データの読み込み
     */
    async loadInitialData() {
        try {
            // 設定の読み込み
            const settings = this.services.storageManager.loadSettings();
            if (settings) {
                // UIマネージャーに設定を適用（メソッドが存在しないためコメントアウト）
                // this.services.uiManager.applySettings(settings);
            }

            // 作品リストの読み込み
            const books = await this.services.bookLoader.loadBooks();
            
            // 進捗データの読み込み
            const progressData = this.services.storageManager.loadProgress();
            if (progressData) {
                this.services.gameManager.restoreProgress(progressData);
            }

            // 最近読んだ本の復元
            const lastReadBookId = localStorage.getItem('lastReadBookId');
            if (lastReadBookId) {
                const lastBook = books.find(book => book.id === lastReadBookId);
                if (lastBook) {
                    this.state.currentBook = lastBook;
                }
            }

        } catch (error) {
            this.handleError(error, '初期データ読み込みエラー');
        }
    }

    /**
     * ビューの切り替え
     */
    showView(viewName) {
        const previousView = this.state.currentView;
        this.setState({ currentView: viewName });

        // 現在の状態を保存
        if (previousView === 'reading' && this.state.currentBook) {
            this.saveReadingProgress();
            // 読書ビューのクリーンアップ
            this.cleanupReadingView();
        }

        // すべてのビューを非表示
        document.querySelectorAll('.view-container').forEach(view => {
            view.classList.remove('active');
        });

        // 対象のビューを表示
        const targetViewId = viewName === 'library' ? 'library-view' : 
                            viewName === 'reading' ? 'reading-view' :
                            viewName === 'progress' ? 'progress-view' :
                            viewName === 'settings' ? 'settings-view' :
                            viewName === 'parent-dashboard' ? 'parent-dashboard-view' :
                            'library-view';
        
        const targetView = document.getElementById(targetViewId);
        if (targetView) {
            targetView.classList.add('active');
        }

        // ビュー固有の初期化
        switch (viewName) {
            case 'library':
                this.initializeLibraryView();
                break;
            case 'reading':
                this.initializeReadingView();
                break;
            case 'settings':
                this.initializeSettingsView();
                break;
            case 'progress':
                this.initializeProgressView();
                break;
            case 'parent-dashboard':
                // 保護者用ダッシュボードの初期化（未実装）
                break;
        }
    }

    /**
     * ライブラリビューの初期化
     */
    async initializeLibraryView() {
        try {
            const books = await this.services.bookLoader.getLoadedBooks();
            const progressData = this.services.gameManager.getAllProgress();
            
            // UIManagerのdisplayBookLibraryメソッドが存在しないため、直接実装
            this.displayBookLibrary(books, progressData);
            
            // 設定を確認してテーマを適用
            const settings = this.loadSettings();
            this.applySettings(settings);
        } catch (error) {
            this.handleError(error, 'ライブラリ表示エラー');
        }
    }

    /**
     * 読書ビューの初期化
     */
    initializeReadingView() {
        if (!this.state.currentBook) {
            this.showView('library');
            return;
        }

        try {
            // ビューの切り替え
            document.querySelectorAll('.view-container').forEach(view => {
                view.classList.remove('active');
            });
            const readingView = document.getElementById('reading-view');
            if (readingView) {
                readingView.classList.add('active');
            }

            // 前回の読書ビューの要素をクリーンアップ
            this.cleanupReadingView();

            // テキストコンテナの取得
            const textContainer = document.getElementById('text-container');
            if (!textContainer) {
                throw new Error('テキストコンテナが見つかりません');
            }

            // 簡易的な本文表示
            this.displayBookContent(textContainer);

            // 読書セッションの開始
            this.services.gameManager.startReadingSession(this.state.currentBook.id);
            
            // 表示を確実にするために遅延実行
            setTimeout(() => {
                const readingView = document.getElementById('reading-view');
                if (readingView) {
                    readingView.style.opacity = '0.99';
                    setTimeout(() => {
                        readingView.style.opacity = '1';
                    }, 10);
                }
            }, 50);

        } catch (error) {
            this.handleError(error, '読書画面初期化エラー');
        }
    }

    /**
     * 設定ビューの初期化
     */
    initializeSettingsView() {
        const settingsView = document.getElementById('settings-view');
        if (!settingsView) return;
        
        // 既存のコンテンツをクリア
        settingsView.innerHTML = '<h2 class="view-title">設定</h2>';
        
        // 設定コンテナの作成
        const content = document.createElement('div');
        content.className = 'settings-content';
        
        // 現在の設定を読み込み
        const currentSettings = this.loadSettings();
        
        content.innerHTML = `
            <div class="setting-group">
                <h3>👀 表示モード</h3>
                <div class="theme-selector">
                    <label class="theme-option">
                        <input type="radio" name="theme" value="default" ${!currentSettings.kidsMode ? 'checked' : ''}>
                        <span>通常モード</span>
                    </label>
                    <label class="theme-option">
                        <input type="radio" name="theme" value="kids" ${currentSettings.kidsMode ? 'checked' : ''}>
                        <span>🌈 こどもモード</span>
                    </label>
                </div>
            </div>
            
            <div class="setting-group">
                <h3>📏 文字サイズ</h3>
                <div class="setting-row">
                    <input type="range" id="font-size-slider" min="14" max="36" value="${currentSettings.fontSize}" class="setting-slider">
                    <span id="font-size-value" class="setting-value">${currentSettings.fontSize}px</span>
                </div>
            </div>
            
            <div class="setting-group">
                <h3>📐 行間</h3>
                <div class="setting-row">
                    <input type="range" id="line-height-slider" min="1.4" max="2.4" step="0.1" value="${currentSettings.lineHeight}" class="setting-slider">
                    <span id="line-height-value" class="setting-value">${currentSettings.lineHeight}</span>
                </div>
            </div>
            
            <div class="setting-group">
                <h3>🎨 背景色</h3>
                <div class="color-options">
                    <button class="color-btn" data-color="white" style="background: #ffffff;" title="白">
                        ${currentSettings.backgroundColor === 'white' ? '✓' : ''}
                    </button>
                    <button class="color-btn" data-color="cream" style="background: #f5f2e8;" title="クリーム">
                        ${currentSettings.backgroundColor === 'cream' ? '✓' : ''}
                    </button>
                    <button class="color-btn" data-color="mint" style="background: #e8f5f2;" title="ミント">
                        ${currentSettings.backgroundColor === 'mint' ? '✓' : ''}
                    </button>
                    <button class="color-btn" data-color="sky" style="background: #e8f2f5;" title="スカイ">
                        ${currentSettings.backgroundColor === 'sky' ? '✓' : ''}
                    </button>
                    <button class="color-btn" data-color="dark" style="background: #1a1a1a; color: white;" title="ダーク">
                        ${currentSettings.backgroundColor === 'dark' ? '✓' : ''}
                    </button>
                </div>
            </div>
            
            <div class="setting-group kids-colors" style="${!currentSettings.kidsMode ? 'display: none;' : ''}">
                <h3>🌈 こども向け背景色</h3>
                <div class="color-options">
                    <button class="color-btn" data-color="yellow" style="background: #FFF9E6;" title="きいろ">
                        ${currentSettings.backgroundColor === 'yellow' ? '✓' : ''}
                    </button>
                    <button class="color-btn" data-color="pink" style="background: #FFE5F1;" title="ピンク">
                        ${currentSettings.backgroundColor === 'pink' ? '✓' : ''}
                    </button>
                    <button class="color-btn" data-color="blue" style="background: #E6F3FF;" title="みずいろ">
                        ${currentSettings.backgroundColor === 'blue' ? '✓' : ''}
                    </button>
                    <button class="color-btn" data-color="green" style="background: #E8F8E8;" title="みどり">
                        ${currentSettings.backgroundColor === 'green' ? '✓' : ''}
                    </button>
                    <button class="color-btn" data-color="purple" style="background: #F0E6FF;" title="むらさき">
                        ${currentSettings.backgroundColor === 'purple' ? '✓' : ''}
                    </button>
                </div>
            </div>
            
            <div class="setting-group">
                <h3>📖 ふりがな表示</h3>
                <div class="ruby-options">
                    <label class="checkbox-option">
                        <input type="checkbox" id="show-all-ruby" ${currentSettings.showAllRuby ? 'checked' : ''}>
                        <span>すべての漢字にふりがなを表示</span>
                    </label>
                </div>
            </div>
            
            <div class="setting-actions">
                <button id="reset-settings" class="btn-secondary">初期設定に戻す</button>
                <button id="save-settings" class="btn-primary">設定を保存</button>
            </div>
        `;
        
        settingsView.appendChild(content);
        
        // イベントリスナーの設定
        this.setupSettingsListeners();
    }

    /**
     * 進捗ビューの初期化
     */
    async initializeProgressView() {
        // 一時的な実装
        const progressView = document.getElementById('progress-view');
        if (progressView && !progressView.querySelector('.progress-content')) {
            const content = document.createElement('div');
            content.className = 'progress-content';
            content.innerHTML = '<h3>学習進捗（準備中）</h3><p>進捗表示機能は現在開発中です。</p>';
            progressView.appendChild(content);
        }
    }

    /**
     * 本が選択されたときの処理
     */
    async handleBookSelected(book) {
        try {
            this.setState({
                currentBook: book,
                currentChapter: 0,
                currentPage: 0
            });

            // 進捗の復元
            const progress = this.services.gameManager.getProgress(book.id);
            if (progress && progress.currentChapter !== undefined) {
                this.setState({
                    currentChapter: progress.currentChapter,
                    currentPage: progress.currentPage || 0
                });
            }

            // 最後に読んだ本として記録
            localStorage.setItem('lastReadBookId', book.id);

            // 読書画面へ遷移
            this.showView('reading');

        } catch (error) {
            this.handleError(error, '作品選択エラー');
        }
    }

    /**
     * ページ変更時の処理
     */
    handlePageChanged(data) {
        this.setState({
            currentChapter: data.chapter,
            currentPage: data.page
        });

        // 進捗の更新
        if (this.state.currentBook) {
            this.services.gameManager.updateProgress(
                this.state.currentBook.id,
                data.chapter,
                data.page,
                data.percentage
            );
        }
    }

    /**
     * 語句クリック時の処理
     */
    handleWordClicked(wordData) {
        // ポイント付与
        const points = this.services.gameManager.awardWordLearningPoints(
            wordData.word,
            wordData.isFirstTime
        );

        // 通知表示
        if (points > 0) {
            this.services.uiManager.showNotification(
                `+${points}ポイント獲得！`,
                'success'
            );
        }
    }

    /**
     * アチーブメント解除時の処理
     */
    handleAchievementUnlocked(achievement) {
        this.services.uiManager.showAchievementNotification(achievement);
    }

    /**
     * 設定変更時の処理
     */
    async handleSettingsChanged(settings) {
        try {
            this.services.storageManager.saveSettings(settings);
            // this.services.uiManager.applySettings(settings); // メソッドが存在しない
            
            // テキストレンダラーの再描画
            if (this.state.currentView === 'reading' && this.state.currentBook) {
                this.services.textRenderer.updateSettings();
            }

        } catch (error) {
            this.handleError(error, '設定保存エラー');
        }
    }

    /**
     * オンラインステータス変更時の処理
     */
    handleOnlineStatusChange(isOnline) {
        if (isOnline) {
            this.services.uiManager.showNotification(
                'インターネット接続が復旧しました',
                'info'
            );
        } else {
            this.services.uiManager.showNotification(
                'オフラインモードで動作中です',
                'warning'
            );
        }
    }

    /**
     * 現在の読書進捗を保存
     */
    async saveReadingProgress() {
        if (!this.state.currentBook) return;

        try {
            await this.services.gameManager.saveProgress();
            
            if (this.config.debugMode) {
            }
        } catch (error) {
            console.error('進捗保存エラー:', error);
        }
    }

    /**
     * 自動保存の開始
     */
    startAutoSave() {
        this.autoSaveTimer = setInterval(() => {
            if (this.state.currentView === 'reading' && this.state.currentBook) {
                this.saveReadingProgress();
            }
        }, this.config.autoSaveInterval);
    }

    /**
     * 自動保存の停止
     */
    stopAutoSave() {
        if (this.autoSaveTimer) {
            clearInterval(this.autoSaveTimer);
            this.autoSaveTimer = null;
        }
    }

    /**
     * 現在の状態を保存
     */
    saveCurrentState() {
        this.stopAutoSave();
        this.saveReadingProgress();
        this.services.gameManager.endReadingSession();
    }

    /**
     * 状態の更新
     */
    setState(newState) {
        Object.assign(this.state, newState);
        
        if (this.config.debugMode) {
        }
    }

    /**
     * エラーハンドリング
     */
    handleError(error, context = '') {
        console.error(`${context}:`, error);
        
        if (this.services.errorHandler) {
            this.services.errorHandler.handleError(error, {
                context,
                state: this.state
            });
        }
    }

    /**
     * 作品ライブラリの表示（一時的な実装）
     */
    displayBookLibrary(books, progressData) {
        const booksGrid = document.getElementById('books-grid');
        if (!booksGrid) return;
        
        // 既存のコンテンツをクリア
        booksGrid.innerHTML = '';
        
        // 作品カードを作成
        books.forEach(book => {
            const card = this.createBookCard(book, progressData[book.id]);
            booksGrid.appendChild(card);
        });
    }
    
    /**
     * 作品カードの作成
     */
    createBookCard(book, progress) {
        const card = document.createElement('div');
        card.className = 'book-card';
        card.dataset.bookId = book.id;
        
        // 進捗率の計算
        const progressPercent = progress ? (progress.percentage || 0) : 0;
        const isCompleted = progress && progress.completed;
        
        // 難易度の日本語表記
        const difficultyText = {
            'beginner': '初級',
            'intermediate': '中級',
            'advanced': '上級'
        }[book.difficulty] || book.difficulty;
        
        card.innerHTML = `
            <div class="book-card-header">
                <h3 class="book-title">${book.title}</h3>
                <p class="book-author">${book.author}</p>
            </div>
            <div class="book-card-body">
                <div class="book-meta">
                    <span class="difficulty ${book.difficulty}">${difficultyText}</span>
                    <span class="reading-time">${book.metadata?.estimatedReadingTime || '?'}分</span>
                </div>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${progressPercent}%"></div>
                </div>
                <p class="progress-text">
                    ${isCompleted ? '完読済み' : progressPercent > 0 ? `${Math.floor(progressPercent)}%` : '未読'}
                </p>
            </div>
        `;
        
        // クリックイベントの追加
        card.addEventListener('click', () => {
            this.eventBus.emit('book:selected', book);
        });
        
        return card;
    }
    
    /**
     * 本文の表示（簡易実装）
     */
    displayBookContent(container) {
        const book = this.state.currentBook;
        if (!book) {
            container.innerHTML = '<p>本文が見つかりません</p>';
            return;
        }
        
        // シンプル表示を使用（デバッグ用）
        if (window.displayBookContentSimple) {
            console.log('シンプル表示モードを使用');  
            window.displayBookContentSimple(container, book);
            
            // 設定を適用
            const settings = this.loadSettings();
            this.applySettings(settings);
            
            // 子どもモードの場合、マスコットを表示
            if (settings.kidsMode) {
                this.addKidsMascot();
            }
            return;
        }
        
        // 保存された設定を読み込み
        const settings = this.loadSettings();
        
        // コンテナをクリア
        container.innerHTML = '';
        container.style.position = 'relative';
        container.style.width = '100%';
        container.style.height = '100%';
        
        // タイトルと作者の表示
        const header = document.createElement('div');
        header.className = 'book-header';
        
        // 作者名の取得（オブジェクトまたは文字列）
        const authorName = book.author && typeof book.author === 'object' 
            ? book.author.name 
            : book.author;
            
        header.innerHTML = `
            <h1>${window.escapeHtml ? window.escapeHtml(book.title) : book.title}</h1>
            <p class="author-name">${window.escapeHtml ? window.escapeHtml(authorName) : authorName}</p>
        `;
        
        // 本文の表示（縦書き）
        const content = document.createElement('div');
        content.className = 'book-content vertical-text';
        
        // 全テキストを結合
        let fullText = '';
        
        // 旧形式（contentが配列）の場合
        if (Array.isArray(book.content)) {
            const chapter = book.content[0];
            if (chapter && chapter.text) {
                fullText = chapter.text;
            }
        }
        // 新形式（content.lines）の場合
        else if (book.content && book.content.lines) {
            console.log('新形式のJSONを処理中');
            console.log('lines数:', book.content.lines.length);
            
            // すべてのlinesのテキストを結合（ルビタグは後で処理）
            book.content.lines.forEach((line, index) => {
                if (line.segments) {
                    line.segments.forEach(segment => {
                        if (segment.type === 'text' && segment.content) {
                            fullText += segment.content;
                        } else if (segment.type === 'ruby' && segment.base) {
                            // ルビの場合もベーステキストのみ追加
                            fullText += segment.base;
                        }
                    });
                }
                // 各行の後に改行を追加
                if (index < book.content.lines.length - 1) {
                    fullText += '\n';
                }
            });
        }
        
        console.log('結合されたテキスト長:', fullText.length);
        console.log('最初の200文字:', fullText.substring(0, 200));
        
        if (fullText) {
            // セグメントを処理してHTMLを生成
            let processedHtml = '';
            
            // ルビ位置情報を収集
            const rubyPositions = [];
            const segments = [];
            
            // 新形式の場合、セグメント情報を再構築
            if (book.content && book.content.lines) {
                let currentPos = 0;
                book.content.lines.forEach((line, lineIndex) => {
                    if (line.segments) {
                        line.segments.forEach(segment => {
                            if (segment.type === 'text' && segment.content) {
                                segments.push({ type: 'text', content: segment.content });
                                currentPos += segment.content.length;
                            } else if (segment.type === 'ruby' && segment.base) {
                                rubyPositions.push({
                                    start: currentPos,
                                    end: currentPos + segment.base.length,
                                    base: segment.base,
                                    ruby: segment.ruby || ''
                                });
                                currentPos += segment.base.length;
                            }
                        });
                    }
                    if (lineIndex < book.content.lines.length - 1) {
                        currentPos += 1; // for newline
                    }
                });
            }
            
            // 改善された禁則処理を使用
            if (window.applyKinsokuProcessingFixed) {
                processedHtml = window.applyKinsokuProcessingFixed(fullText, rubyPositions);
            } else {
                // フォールバック
                processedHtml = this.applyKinsokuProcessing(fullText);
            }
            
            if (processedHtml && processedHtml.trim()) {
                content.innerHTML = processedHtml;
                console.log('コンテンツ設定完了');
            } else {
                content.innerHTML = '<p>本文の処理に失敗しました</p>';
            }
        } else {
            content.innerHTML = '<p>本文データが見つかりません</p>';
        }
        
        // 戻るボタンの追加
        const backButton = document.createElement('button');
        backButton.className = 'back-button';
        if (settings.kidsMode) {
            backButton.innerHTML = '📚 作品一覧にもどる';
        } else {
            backButton.textContent = '作品一覧に戻る';
        }
        backButton.onclick = () => this.showView('library');
        
        // 要素を追加（コンテナ内に配置）
        container.appendChild(content);
        container.appendChild(header);
        container.appendChild(backButton);
        
        // 設定を適用
        this.applySettings(settings);
        
        // 子どもモードの場合、マスコットを表示
        if (settings.kidsMode) {
            this.addKidsMascot();
        }
    }
    
    /**
     * すべての漢字にふりがなを追加（簡易実装）
     */
    addRubyToAllKanji(text, annotations) {
        // 注釈がある場合はそれを使用
        if (annotations && annotations.length > 0) {
            let processedText = text;
            annotations.forEach(annotation => {
                if (annotation.reading) {
                    const regex = new RegExp(annotation.word, 'g');
                    processedText = processedText.replace(regex, 
                        `<ruby>${annotation.word}<rt>${annotation.reading}</rt></ruby>`);
                }
            });
            return processedText;
        }
        // 簡易的な実装（実際にはより高度な処理が必要）
        return text;
    }
    
    /**
     * 子ども向けマスコットの追加
     */
    addKidsMascot() {
        if (!document.querySelector('.kids-mascot')) {
            const mascot = document.createElement('div');
            mascot.className = 'kids-mascot';
            mascot.title = 'こんにちは！いっしょにほんをよもう！';
            mascot.onclick = () => {
                mascot.classList.add('cheering');
                this.showKidsNotification('がんばって！📖✨');
                setTimeout(() => mascot.classList.remove('cheering'), 2000);
            };
            document.body.appendChild(mascot);
        }
    }
    
    /**
     * 禁則処理の適用
     */
    applyKinsokuProcessing(text) {
        // 行頭禁則文字
        const lineStartProhibited = '、。，．）」』】〉》〕］｝】〗〙〟\'"`';
        // 行末禁則文字
        const lineEndProhibited = '（「『【〈《〔［｛【〖〘〝\'"';
        
        // 段落ごとに処理
        const paragraphs = text.split('\n').filter(p => p.trim());
        const processedParagraphs = paragraphs.map(paragraph => {
            // 文字を1文字ずつ処理
            let processed = '';
            const chars = paragraph.split('');
            
            for (let i = 0; i < chars.length; i++) {
                const char = chars[i];
                const nextChar = chars[i + 1] || '';
                
                // 現在の文字が行末禁則文字の場合、次の文字と一緒にする
                if (lineEndProhibited.includes(char) && nextChar) {
                    processed += `<span class="no-wrap">${char}${nextChar}</span>`;
                    i++; // 次の文字をスキップ
                }
                // 次の文字が行頭禁則文字の場合、現在の文字と一緒にする
                else if (lineStartProhibited.includes(nextChar) && char) {
                    processed += `<span class="no-wrap">${char}${nextChar}</span>`;
                    i++; // 次の文字をスキップ
                }
                else {
                    processed += char;
                }
            }
            
            return `<p>${processed}</p>`;
        });
        
        return processedParagraphs.join('');
    }
    
    /**
     * 設定の読み込み
     */
    loadSettings() {
        const defaultSettings = {
            fontSize: 20,
            lineHeight: 1.8,
            backgroundColor: 'white',
            kidsMode: false,
            showAllRuby: false
        };
        
        const saved = localStorage.getItem('readingSettings');
        if (saved) {
            return { ...defaultSettings, ...JSON.parse(saved) };
        }
        
        return defaultSettings;
    }
    
    /**
     * 設定の保存
     */
    saveSettings(settings) {
        localStorage.setItem('readingSettings', JSON.stringify(settings));
        this.applySettings(settings);
    }
    
    /**
     * 設定の適用
     */
    applySettings(settings) {
        const verticalText = document.querySelector('.vertical-text');
        const textContainer = document.getElementById('text-container');
        
        if (verticalText) {
            // 文字サイズ
            verticalText.style.fontSize = `${settings.fontSize}px`;
            
            // 行間
            verticalText.style.lineHeight = settings.lineHeight;
            
            // 色の設定
            const bgColors = {
                'white': '#ffffff',
                'cream': '#f5f2e8',
                'mint': '#e8f5f2',
                'sky': '#e8f2f5',
                'dark': '#1a1a1a',
                // 子ども向け背景色
                'yellow': '#FFF9E6',
                'pink': '#FFE5F1',
                'blue': '#E6F3FF',
                'green': '#E8F8E8',
                'purple': '#F0E6FF'
            };
            
            const textColors = {
                'white': '#333333',
                'cream': '#3a3a3a',
                'mint': '#2a4a3a',
                'sky': '#2a3a4a',
                'dark': '#e0e0e0',
                // 子ども向けテキスト色
                'yellow': '#5a4a00',
                'pink': '#8a2255',
                'blue': '#004488',
                'green': '#2a5a2a',
                'purple': '#5a2a8a'
            };
            
            // 背景色はコンテナに適用
            if (textContainer) {
                textContainer.style.backgroundColor = bgColors[settings.backgroundColor] || bgColors.white;
            }
            
            verticalText.style.color = textColors[settings.backgroundColor] || textColors.white;
            
            // こどもモードの適用
            if (settings.kidsMode) {
                document.body.classList.add('kids-theme');
                // デフォルトフォントサイズを大きくする
                if (settings.fontSize < 24) {
                    verticalText.style.fontSize = '24px';
                }
            } else {
                document.body.classList.remove('kids-theme');
            }
        }
    }
    
    /**
     * 設定画面のイベントリスナー設定
     */
    setupSettingsListeners() {
        const currentSettings = this.loadSettings();
        
        // テーマ選択
        const themeRadios = document.querySelectorAll('input[name="theme"]');
        themeRadios.forEach(radio => {
            radio.addEventListener('change', (e) => {
                currentSettings.kidsMode = e.target.value === 'kids';
                // 子ども向け背景色の表示/非表示
                const kidsColors = document.querySelector('.kids-colors');
                if (kidsColors) {
                    kidsColors.style.display = currentSettings.kidsMode ? 'block' : 'none';
                }
                // 子どもモードの場合、デフォルト設定を調整
                if (currentSettings.kidsMode) {
                    if (currentSettings.fontSize < 24) {
                        currentSettings.fontSize = 24;
                        if (fontSizeSlider) fontSizeSlider.value = 24;
                        if (fontSizeValue) fontSizeValue.textContent = '24px';
                    }
                    currentSettings.showAllRuby = true;
                    const rubyCheckbox = document.getElementById('show-all-ruby');
                    if (rubyCheckbox) rubyCheckbox.checked = true;
                }
            });
        });
        
        // 文字サイズスライダー
        const fontSizeSlider = document.getElementById('font-size-slider');
        const fontSizeValue = document.getElementById('font-size-value');
        if (fontSizeSlider) {
            fontSizeSlider.addEventListener('input', (e) => {
                fontSizeValue.textContent = `${e.target.value}px`;
                currentSettings.fontSize = parseInt(e.target.value);
            });
        }
        
        // 行間スライダー
        const lineHeightSlider = document.getElementById('line-height-slider');
        const lineHeightValue = document.getElementById('line-height-value');
        if (lineHeightSlider) {
            lineHeightSlider.addEventListener('input', (e) => {
                lineHeightValue.textContent = e.target.value;
                currentSettings.lineHeight = parseFloat(e.target.value);
            });
        }
        
        // 背景色ボタン
        const colorButtons = document.querySelectorAll('.color-btn');
        colorButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                // 同じグループ内のチェックマークを削除
                const group = btn.closest('.color-options');
                group.querySelectorAll('.color-btn').forEach(b => b.innerHTML = '');
                // 選択したボタンにチェックマークを追加
                btn.innerHTML = '✓';
                currentSettings.backgroundColor = btn.dataset.color;
            });
        });
        
        // ふりがな表示チェックボックス
        const rubyCheckbox = document.getElementById('show-all-ruby');
        if (rubyCheckbox) {
            rubyCheckbox.addEventListener('change', (e) => {
                currentSettings.showAllRuby = e.target.checked;
            });
        }
        
        // 保存ボタン
        const saveBtn = document.getElementById('save-settings');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => {
                this.saveSettings(currentSettings);
                // 子どもモード用のメッセージ
                if (currentSettings.kidsMode) {
                    this.showKidsNotification('せっていをほぞんしました！🎉');
                } else {
                    alert('設定を保存しました');
                }
            });
        }
        
        // リセットボタン
        const resetBtn = document.getElementById('reset-settings');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                const defaultSettings = {
                    fontSize: 20,
                    lineHeight: 1.8,
                    backgroundColor: 'white',
                    kidsMode: false,
                    showAllRuby: false
                };
                this.saveSettings(defaultSettings);
                this.initializeSettingsView(); // 画面を再描画
                alert('初期設定に戻しました');
            });
        }
    }
    
    /**
     * 子ども向け通知の表示
     */
    showKidsNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'kids-notification';
        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-icon">🌟</span>
                <span class="notification-message">${message}</span>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);
        
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
    
    /**
     * 読書ビューのクリーンアップ
     */
    cleanupReadingView() {
        // 読書モードを終了（ReadingViewManagerを使用）
        if (window.readingViewManager) {
            window.readingViewManager.endReadingMode();
        } else {
            // フォールバック処理
            document.body.classList.remove('reading-mode');
            
            // テキストコンテナ内の動的に追加された要素をクリア
            const textContainer = document.getElementById('text-container');
            if (textContainer) {
                textContainer.innerHTML = '';
                textContainer.removeAttribute('style');
            }
        }
        
        // 読書ビュー内のすべての動的要素を削除
        const readingView = document.getElementById('reading-view');
        if (readingView) {
            // text-container以外のすべての動的要素を削除
            const elementsToRemove = readingView.querySelectorAll(
                '.reading-header-area, .reading-extra-content, .reading-stats, ' +
                '.reading-extra-section, .scroll-spacer, .book-header, ' +
                '.book-content-wrapper, .back-button'
            );
            elementsToRemove.forEach(el => el.remove());
            
            // readingViewの直下の子要素も確認
            Array.from(readingView.children).forEach(child => {
                // text-containerとHTMLに初めから存在する要素以外は削除
                if (child.id !== 'text-container' && 
                    !child.classList.contains('reading-header') &&
                    !child.classList.contains('chapter-progress') &&
                    !child.classList.contains('reading-time-display') &&
                    !child.classList.contains('reading-navigation')) {
                    child.remove();
                }
            });
            
            // 念のため、どこにあっても動的要素を削除
            const allDynamicElements = document.querySelectorAll('.book-header, .book-content-wrapper, .back-button');
            allDynamicElements.forEach(el => {
                console.log('Removing stray element:', el.className);
                el.remove();
            });
        }
        
        // マスコットを削除
        const mascot = document.querySelector('.kids-mascot');
        if (mascot) {
            mascot.remove();
        }
    }
    
    /**
     * アプリケーションの終了処理
     */
    destroy() {
        this.saveCurrentState();
        this.stopAutoSave();
        
        // イベントリスナーの削除
        window.removeEventListener('beforeunload', () => this.saveCurrentState());
        window.removeEventListener('online', () => this.handleOnlineStatusChange(true));
        window.removeEventListener('offline', () => this.handleOnlineStatusChange(false));
        
        // パフォーマンス最適化とメモリ管理のクリーンアップを先に実行
        if (this.services.performanceOptimizer) {
            this.services.performanceOptimizer.destroy();
        }
        if (this.services.memoryManager) {
            this.services.memoryManager.destroy();
        }
        
        // その他のサービスのクリーンアップ
        Object.values(this.services).forEach(service => {
            if (service && typeof service.destroy === 'function') {
                service.destroy();
            }
        });
    }
}

/**
 * シンプルなイベントエミッター
 */
class EventEmitter {
    constructor() {
        this.events = {};
    }

    on(event, callback) {
        if (!this.events[event]) {
            this.events[event] = [];
        }
        this.events[event].push(callback);
    }

    off(event, callback) {
        if (this.events[event]) {
            this.events[event] = this.events[event].filter(cb => cb !== callback);
        }
    }

    emit(event, data) {
        if (this.events[event]) {
            this.events[event].forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`Event handler error for ${event}:`, error);
                }
            });
        }
    }
}
// グローバルに公開
if (typeof window !== 'undefined') {
    window.AppController = AppController;
    window.EventEmitter = EventEmitter;
}
