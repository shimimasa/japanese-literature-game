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
                console.log('アプリケーション初期化開始...');
            }

            // 1. ErrorHandlerとDataValidatorの初期化（他のサービスが依存）
            this.services.errorHandler = new ErrorHandler();
            this.services.dataValidator = new DataValidator();

            // 2. StorageManagerの初期化
            this.services.storageManager = new StorageManager();
            await this.services.storageManager.initialize();

            // 3. コアサービスの初期化
            this.services.bookAdapter = new BookAdapter(this.services.dataValidator);
            this.services.bookLoader = new BookLoader(
                this.services.bookAdapter,
                this.services.dataValidator,
                this.services.errorHandler
            );

            // 4. UIサービスの初期化
            this.services.textRenderer = new TextRenderer();
            this.services.dictionaryService = new DictionaryService();
            this.services.uiManager = new UIManager();

            // 5. ゲーム関連サービスの初期化
            this.services.gameManager = new GameManager(this.services.storageManager);
            this.services.progressManager = new ProgressManager(this.services.storageManager);

            // 6. パフォーマンス最適化とメモリ管理の初期化
            this.services.performanceOptimizer = new PerformanceOptimizer();
            this.services.memoryManager = new MemoryManager();
            this.services.performanceOptimizer.initialize();
            this.services.memoryManager.initialize();

            // 7. イベントリスナーの設定
            this.setupEventListeners();

            // 8. 初期データの読み込み
            await this.loadInitialData();

            // 9. UIの初期化
            await this.services.uiManager.initialize();

            // 10. オンボーディングフローの確認と実行
            await this.checkAndRunOnboarding();

            // 11. 自動保存の開始
            this.startAutoSave();

            this.setState({ isInitialized: true, isLoading: false });
            
            if (this.config.debugMode) {
                console.log('アプリケーション初期化完了');
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
            const settings = await this.services.storageManager.loadSettings();
            if (settings) {
                this.services.uiManager.applySettings(settings);
            }

            // 作品リストの読み込み
            const books = await this.services.bookLoader.loadBooks();
            
            // 進捗データの読み込み
            const progressData = await this.services.storageManager.loadProgress();
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
        }

        // UIManagerに通知
        this.services.uiManager.showView(viewName);

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
        }
    }

    /**
     * ライブラリビューの初期化
     */
    async initializeLibraryView() {
        try {
            const books = await this.services.bookLoader.getLoadedBooks();
            const progressData = this.services.gameManager.getAllProgress();
            
            this.services.uiManager.displayBookLibrary(books, progressData);
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
            // テキストレンダラーの初期化
            this.services.textRenderer.setBook(this.state.currentBook);
            this.services.textRenderer.renderChapter(
                this.state.currentChapter,
                this.state.currentPage
            );

            // 辞書サービスの設定
            const annotations = this.state.currentBook.content[this.state.currentChapter]?.annotations || [];
            this.services.dictionaryService.setAnnotations(annotations);

            // 読書セッションの開始
            this.services.gameManager.startReadingSession(this.state.currentBook.id);

        } catch (error) {
            this.handleError(error, '読書画面初期化エラー');
        }
    }

    /**
     * 設定ビューの初期化
     */
    initializeSettingsView() {
        const currentSettings = this.services.storageManager.loadSettings() || {};
        this.services.uiManager.displaySettings(currentSettings);
    }

    /**
     * 進捗ビューの初期化
     */
    async initializeProgressView() {
        try {
            const statistics = await this.services.progressManager.generateReport();
            this.services.uiManager.displayProgressReport(statistics);
        } catch (error) {
            this.handleError(error, '進捗表示エラー');
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
            await this.services.storageManager.saveSettings(settings);
            this.services.uiManager.applySettings(settings);
            
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
                console.log('読書進捗を保存しました');
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
            console.log('State updated:', this.state);
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