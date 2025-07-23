/**
 * app.js - メインアプリケーション初期化
 * 
 * このファイルは日本名作文学読解ゲームアプリケーションの
 * エントリーポイントとなり、各モジュールの初期化と
 * アプリケーション全体の制御を行います。
 */

import { BookLoader } from './book-loader.js';
import { TextRenderer } from './text-renderer.js';
import { DictionaryService } from './dictionary-service.js';
import { GameManager } from './game-manager.js';
import { StorageManager } from './storage-manager.js';
import { UIManager } from './ui-manager.js';
import { StatisticsAnalyzer } from './statistics-analyzer.js';
import { ProgressManager } from './progress-manager.js';
import { TouchHandler } from './touch-handler.js';
import { ErrorHandler } from './error-handler.js';

class App {
    constructor() {
        // エラーハンドラーを最初に初期化
        this.errorHandler = new ErrorHandler();
        
        // グローバルエラーハンドラーの設定
        this.setupGlobalErrorHandlers();
        
        // サービスのインスタンス化
        this.storageManager = new StorageManager();
        this.bookLoader = new BookLoader();
        this.textRenderer = new TextRenderer();
        this.dictionaryService = new DictionaryService();
        this.gameManager = new GameManager(this.storageManager);
        this.uiManager = new UIManager();
        this.statisticsAnalyzer = null; // GameManager初期化後に作成
        this.progressManager = null; // GameManager初期化後に作成
        this.touchHandler = new TouchHandler();
        
        // 現在の状態
        this.currentView = 'library';
        this.currentBook = null;
        this.books = [];
        this.readingTimer = null;
        this.sessionStartTime = null;
        
        // 設定の初期化
        this.settings = this.storageManager.loadSettings() || {
            fontSize: 16,
            lineHeight: 1.8,
            backgroundColor: 'white',
            soundEnabled: true
        };
        
        // GameManagerのイベントハンドラー設定
        this.setupGameManagerEvents();
        
        // DictionaryServiceのイベントハンドラー設定
        this.setupDictionaryServiceEvents();
    }
    
    /**
     * アプリケーションの初期化
     */
    async init() {
        console.log('アプリケーションを初期化しています...');
        
        try {
            // UIの初期設定
            this.uiManager.showLoading('アプリケーションを準備しています...');
            
            // イベントリスナーの設定
            this.setupEventListeners();
            
            // 設定の適用
            this.applySettings();
            
            // 作品データの読み込み
            await this.loadBooks();
            
            // 統計分析の初期化
            this.statisticsAnalyzer = new StatisticsAnalyzer(this.gameManager, this.storageManager);
            
            // 進捗管理の初期化
            this.progressManager = new ProgressManager(this.storageManager, this.gameManager);
            
            // 初期ビューの表示
            this.showView('library');
            
            // ローディング画面を非表示
            this.uiManager.hideLoading();
            
            console.log('アプリケーションの初期化が完了しました');
            
        } catch (error) {
            this.errorHandler.handleError(error, 'system', {
                phase: 'initialization'
            });
        }
    }
    
    /**
     * イベントリスナーの設定
     */
    setupEventListeners() {
        // ナビゲーションボタン
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const view = e.target.dataset.view;
                this.showView(view);
            });
        });
        
        // 作品一覧への戻るボタン
        document.querySelector('.back-to-library').addEventListener('click', () => {
            this.showView('library');
        });
        
        // 検索・フィルター
        document.getElementById('search-input').addEventListener('input', (e) => {
            this.filterBooks();
        });
        
        document.getElementById('author-filter').addEventListener('change', () => {
            this.filterBooks();
        });
        
        document.getElementById('difficulty-filter').addEventListener('change', () => {
            this.filterBooks();
        });
        
        document.getElementById('length-filter').addEventListener('change', () => {
            this.filterBooks();
        });
        
        // ページナビゲーション
        document.getElementById('prev-page').addEventListener('click', () => {
            this.textRenderer.previousPage();
        });
        
        document.getElementById('next-page').addEventListener('click', () => {
            this.textRenderer.nextPage();
        });
        
        // 設定関連
        document.getElementById('font-size-slider').addEventListener('input', (e) => {
            this.settings.fontSize = parseInt(e.target.value);
            document.getElementById('font-size-value').textContent = `${this.settings.fontSize}px`;
            this.applySettings();
            this.storageManager.saveSettings(this.settings);
        });
        
        document.getElementById('line-height-slider').addEventListener('input', (e) => {
            this.settings.lineHeight = parseFloat(e.target.value);
            document.getElementById('line-height-value').textContent = this.settings.lineHeight;
            this.applySettings();
            this.storageManager.saveSettings(this.settings);
        });
        
        document.querySelectorAll('.color-option').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.settings.backgroundColor = e.target.dataset.color;
                this.applySettings();
                this.storageManager.saveSettings(this.settings);
                
                // アクティブ状態の更新
                document.querySelectorAll('.color-option').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
            });
        });
        
        document.getElementById('sound-enabled').addEventListener('change', (e) => {
            this.settings.soundEnabled = e.target.checked;
            this.storageManager.saveSettings(this.settings);
        });
        
        document.getElementById('reset-progress').addEventListener('click', () => {
            if (confirm('本当に進捗データをリセットしますか？この操作は取り消せません。')) {
                this.storageManager.clearProgress();
                this.gameManager.resetAllProgress();
                this.updateProgressView();
                this.uiManager.showNotification('進捗データをリセットしました');
            }
        });
        
        // キーボードショートカット
        document.addEventListener('keydown', (e) => {
            if (this.currentView === 'reading') {
                switch(e.key) {
                    case 'ArrowLeft':
                        this.textRenderer.nextPage();
                        break;
                    case 'ArrowRight':
                        this.textRenderer.previousPage();
                        break;
                    case ' ':
                        e.preventDefault();
                        this.textRenderer.nextPage();
                        break;
                    case 'Escape':
                        this.dictionaryService.hidePopup();
                        break;
                }
            }
        });
        
        // ポップアップを閉じる
        document.querySelector('.popup-close').addEventListener('click', () => {
            this.dictionaryService.hidePopup();
        });
        
        document.getElementById('dictionary-popup').addEventListener('click', (e) => {
            if (e.target.id === 'dictionary-popup') {
                this.dictionaryService.hidePopup();
            }
        });
        
        // タッチジェスチャーの設定
        this.setupTouchGestures();
    }
    
    /**
     * タッチジェスチャーの設定
     */
    setupTouchGestures() {
        // 縦書きテキストコンテナへのタッチ設定
        const textContainer = document.getElementById('vertical-text');
        if (textContainer) {
            this.touchHandler.attachToElement(textContainer, {
                enableMouseFallback: true, // 開発環境でのマウスサポート
                swipeThreshold: 30
            });
            
            // スワイプでのページ送り
            this.touchHandler.on('swipe', (data) => {
                if (this.currentView !== 'reading') return;
                
                if (data.direction === 'left') {
                    // 左スワイプ：次ページ（縦書きなので）
                    this.textRenderer.nextPage();
                } else if (data.direction === 'right') {
                    // 右スワイプ：前ページ
                    this.textRenderer.previousPage();
                }
            });
            
            // ピンチズームでの文字サイズ調整
            this.touchHandler.on('pinch', (data) => {
                if (this.currentView !== 'reading') return;
                
                const newSize = Math.round(this.settings.fontSize * data.scale);
                const clampedSize = Math.max(12, Math.min(30, newSize));
                
                if (clampedSize !== this.settings.fontSize) {
                    this.settings.fontSize = clampedSize;
                    this.applySettings();
                    
                    // UIの更新
                    const slider = document.getElementById('font-size-slider');
                    const value = document.getElementById('font-size-value');
                    if (slider) slider.value = clampedSize;
                    if (value) value.textContent = `${clampedSize}px`;
                }
            });
            
            // ロングタップでの語句説明
            this.touchHandler.on('longPress', (data) => {
                if (this.currentView !== 'reading') return;
                
                // タップ位置の要素を取得
                const element = document.elementFromPoint(data.x, data.y);
                if (element && element.classList.contains('clickable-text')) {
                    // 語句説明を表示
                    element.click();
                }
            });
        }
        
        // 作品カードへのタッチ設定
        const bookGrid = document.querySelector('.book-grid');
        if (bookGrid) {
            this.touchHandler.attachToElement(bookGrid, {
                enableMouseFallback: true
            });
            
            // タップで作品を開く
            this.touchHandler.on('tap', (data) => {
                const bookCard = data.element.closest('.book-card');
                if (bookCard) {
                    bookCard.click();
                }
            });
        }
        
        // 設定画面でのジェスチャー
        const settingsView = document.getElementById('settings-view');
        if (settingsView) {
            this.touchHandler.attachToElement(settingsView, {
                enableMouseFallback: true
            });
            
            // ダブルタップで設定リセット
            this.touchHandler.on('doubleTap', (data) => {
                const resetButton = document.getElementById('reset-progress');
                if (resetButton && data.element === resetButton) {
                    resetButton.click();
                }
            });
        }
        
        // グローバルなタッチイベントリスナー
        this.touchHandler.on('momentum', (data) => {
            // 慣性スクロールの処理（必要に応じて実装）
            if (this.currentView === 'reading' && textContainer) {
                // 縦書きの場合は横方向の慣性を適用
                const scrollElement = textContainer.querySelector('.vertical-text-content');
                if (scrollElement) {
                    scrollElement.scrollLeft += data.velocityX;
                }
            }
        });
    }
    
    /**
     * 作品データの読み込み
     */
    async loadBooks() {
        try {
            this.books = await this.bookLoader.loadBooks('./books/');
            this.displayBooks(this.books);
            this.updateAuthorFilter();
        } catch (error) {
            this.errorHandler.handleNetworkError(error, './books/');
        }
    }
    
    /**
     * 作品一覧の表示
     */
    displayBooks(books) {
        const container = document.getElementById('books-grid');
        container.innerHTML = '';
        
        if (books.length === 0) {
            container.innerHTML = '<p class="no-books">作品が見つかりませんでした</p>';
            return;
        }
        
        books.forEach(book => {
            const card = this.createBookCard(book);
            container.appendChild(card);
        });
    }
    
    /**
     * 作品カードの作成
     */
    createBookCard(book) {
        const card = document.createElement('div');
        card.className = 'book-card';
        
        const progress = this.gameManager.getBookProgress(book.id);
        const progressPercent = progress ? Math.round(progress.percent) : 0;
        
        card.innerHTML = `
            <h3 class="book-card-title">${book.title}</h3>
            <p class="book-card-author">${book.author}</p>
            <div class="book-card-meta">
                <span class="difficulty-badge difficulty-${book.difficulty}">${this.getDifficultyLabel(book.difficulty)}</span>
                <span class="length-badge">${this.getLengthLabel(book.length)}</span>
            </div>
            ${progressPercent > 0 ? `
                <div class="book-progress-bar">
                    <div class="progress-fill" style="width: ${progressPercent}%"></div>
                </div>
                <p class="progress-text">${progressPercent}% 完了</p>
            ` : ''}
        `;
        
        card.addEventListener('click', () => {
            this.openBook(book);
        });
        
        return card;
    }
    
    /**
     * 難易度ラベルの取得
     */
    getDifficultyLabel(difficulty) {
        const labels = {
            'beginner': '初級',
            'intermediate': '中級',
            'advanced': '上級'
        };
        return labels[difficulty] || difficulty;
    }
    
    /**
     * 長さラベルの取得
     */
    getLengthLabel(length) {
        const labels = {
            'short': '短編',
            'medium': '中編',
            'long': '長編'
        };
        return labels[length] || length;
    }
    
    /**
     * 作者フィルターの更新
     */
    updateAuthorFilter() {
        const authors = [...new Set(this.books.map(book => book.author))];
        const select = document.getElementById('author-filter');
        
        select.innerHTML = '<option value="">すべての作者</option>';
        authors.forEach(author => {
            const option = document.createElement('option');
            option.value = author;
            option.textContent = author;
            select.appendChild(option);
        });
    }
    
    /**
     * 作品のフィルタリング
     */
    filterBooks() {
        const searchTerm = document.getElementById('search-input').value.toLowerCase();
        const authorFilter = document.getElementById('author-filter').value;
        const difficultyFilter = document.getElementById('difficulty-filter').value;
        const lengthFilter = document.getElementById('length-filter').value;
        
        const filteredBooks = this.books.filter(book => {
            // 検索条件
            const matchesSearch = !searchTerm || 
                book.title.toLowerCase().includes(searchTerm) ||
                book.author.toLowerCase().includes(searchTerm);
            
            // フィルター条件
            const matchesAuthor = !authorFilter || book.author === authorFilter;
            const matchesDifficulty = !difficultyFilter || book.difficulty === difficultyFilter;
            const matchesLength = !lengthFilter || book.length === lengthFilter;
            
            return matchesSearch && matchesAuthor && matchesDifficulty && matchesLength;
        });
        
        this.displayBooks(filteredBooks);
    }
    
    /**
     * 作品を開く
     */
    async openBook(book) {
        this.currentBook = book;
        this.uiManager.showLoading('作品を読み込んでいます...');
        
        try {
            // 読書ビューの準備
            document.querySelector('.book-title').textContent = book.title;
            
            // ページ変更コールバックの設定
            this.textRenderer.onPageChange = (currentPage, totalPages) => {
                this.onPageChange(currentPage, totalPages);
            };
            
            // テキストのレンダリング
            await this.textRenderer.renderBook(book, document.getElementById('text-container'));
            
            // 語句説明の設定
            this.dictionaryService.setAnnotations(book.content);
            
            // 進捗の読み込み
            const progress = this.gameManager.getBookProgress(book.id);
            if (progress && progress.currentPage) {
                this.textRenderer.goToPage(progress.currentPage);
            }
            
            // ゲームセッションの開始
            this.gameManager.startReadingSession(book.id);
            
            // 章進捗インジケーターの初期化
            this.updateChapterProgress(book);
            
            // 読書時間の更新タイマー開始
            this.startReadingTimer();
            
            // ビューの切り替え
            this.showView('reading');
            
            // 初期進捗の更新
            this.updateReadingProgress();
            
            this.uiManager.hideLoading();
            
        } catch (error) {
            this.errorHandler.handleError(error, 'data', {
                bookId: book.id,
                bookTitle: book.title
            });
        }
    }
    
    /**
     * ビューの切り替え
     */
    showView(viewName) {
        // すべてのビューを非表示
        document.querySelectorAll('.view-container').forEach(view => {
            view.classList.remove('active');
        });
        
        // ナビゲーションボタンの状態更新
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        // 指定されたビューを表示
        const viewElement = document.getElementById(`${viewName}-view`);
        if (viewElement) {
            viewElement.classList.add('active');
            this.currentView = viewName;
            
            // 対応するナビゲーションボタンをアクティブに
            const navBtn = document.querySelector(`.nav-btn[data-view="${viewName}"]`);
            if (navBtn) {
                navBtn.classList.add('active');
            }
            
            // ビュー固有の処理
            switch(viewName) {
                case 'progress':
                    this.updateProgressView();
                    // 統計グラフの初期化
                    if (this.statisticsAnalyzer) {
                        this.statisticsAnalyzer.init();
                    }
                    break;
                case 'parent-dashboard':
                    // 保護者ダッシュボードの初期化
                    if (this.progressManager) {
                        const container = document.getElementById('parent-dashboard-container');
                        this.progressManager.initializeDashboard(container);
                    }
                    break;
                case 'library':
                    if (this.currentBook) {
                        // 読書セッションの終了
                        this.gameManager.endReadingSession();
                        this.stopReadingTimer();
                        this.currentBook = null;
                    }
                    break;
            }
        }
    }
    
    /**
     * 進捗ビューの更新
     */
    updateProgressView() {
        const stats = this.gameManager.getStatistics();
        
        document.getElementById('today-reading-time').textContent = `${stats.todayReadingTime}分`;
        document.getElementById('total-reading-time').textContent = `${Math.round(stats.totalReadingTime / 60)}時間`;
        document.getElementById('completed-books').textContent = `${stats.completedBooks}冊`;
        document.getElementById('learned-words').textContent = `${stats.learnedWords}語`;
        
        // アチーブメントの表示
        const achievementsContainer = document.getElementById('achievements-list');
        achievementsContainer.innerHTML = '';
        
        stats.achievements.forEach(achievement => {
            const elem = document.createElement('div');
            elem.className = 'achievement-item';
            elem.innerHTML = `
                <div class="achievement-icon">🏆</div>
                <div class="achievement-info">
                    <h4>${achievement.name}</h4>
                    <p>${achievement.description}</p>
                    <time>${new Date(achievement.date).toLocaleDateString('ja-JP')}</time>
                </div>
            `;
            achievementsContainer.appendChild(elem);
        });
    }
    
    /**
     * 設定の適用
     */
    applySettings() {
        // CSS変数の更新
        document.documentElement.style.setProperty('--font-size-base', `${this.settings.fontSize}px`);
        document.documentElement.style.setProperty('--line-height-base', this.settings.lineHeight);
        
        // 背景色の適用
        const bgColors = {
            'white': '#ffffff',
            'cream': '#FFF8DC',
            'light-green': '#E8F5E9',
            'light-blue': '#E3F2FD',
            'dark': '#263238'
        };
        
        document.documentElement.style.setProperty('--color-background', bgColors[this.settings.backgroundColor] || '#ffffff');
        
        // ダークテーマの切り替え
        if (this.settings.backgroundColor === 'dark') {
            document.documentElement.setAttribute('data-theme', 'dark');
        } else {
            document.documentElement.removeAttribute('data-theme');
        }
        
        // 設定UIの更新
        document.getElementById('font-size-slider').value = this.settings.fontSize;
        document.getElementById('font-size-value').textContent = `${this.settings.fontSize}px`;
        document.getElementById('line-height-slider').value = this.settings.lineHeight;
        document.getElementById('line-height-value').textContent = this.settings.lineHeight;
        document.getElementById('sound-enabled').checked = this.settings.soundEnabled;
        
        // 背景色オプションのアクティブ状態
        document.querySelectorAll('.color-option').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.color === this.settings.backgroundColor);
        });
    }
    
    /**
     * GameManagerのイベントハンドラー設定
     */
    setupGameManagerEvents() {
        // アチーブメント解除時
        this.gameManager.onAchievementUnlocked = (achievement) => {
            // アチーブメント通知は GameManager 内で表示されるため、追加処理は不要
            // 必要に応じて進捗ビューを更新
            if (this.currentView === 'progress') {
                this.updateProgressView();
            }
        };
        
        // ポイント獲得時
        this.gameManager.onPointsAwarded = (points, description) => {
            // ポイント表示の更新
            this.updateReadingProgress();
        };
        
        // 進捗更新時
        this.gameManager.onProgressUpdate = (bookId, percent) => {
            // 進捗バーの更新
            const progressFill = document.querySelector('.reading-progress .progress-fill');
            const progressText = document.querySelector('.reading-progress .progress-text');
            if (progressFill && progressText) {
                progressFill.style.width = `${percent}%`;
                progressText.textContent = `${Math.round(percent)}%`;
            }
        };
    }
    
    /**
     * DictionaryServiceのイベントハンドラー設定
     */
    setupDictionaryServiceEvents() {
        // 語句学習時
        this.dictionaryService.onWordLearned = (word, points, isFirstLearn) => {
            // GameManagerに語句学習を記録
            this.gameManager.recordWordLearned(word, points);
        };
        
        // ポイント獲得時（必要に応じて追加処理）
        this.dictionaryService.onPointsEarned = (points, word) => {
            // 現在は recordWordLearned 内でポイント付与されるため、追加処理は不要
        };
    }
    
    /**
     * 章進捗インジケーターの更新
     */
    updateChapterProgress(book) {
        const container = document.querySelector('.chapter-progress');
        container.innerHTML = '';
        
        const progress = this.gameManager.getBookProgress(book.id);
        const currentChapter = progress?.currentChapter || 0;
        
        book.content.forEach((chapter, index) => {
            const indicator = document.createElement('div');
            indicator.className = 'chapter-indicator';
            indicator.textContent = index + 1;
            
            if (progress?.completedChapters?.includes(index)) {
                indicator.classList.add('completed');
            } else if (index === currentChapter) {
                indicator.classList.add('current');
            }
            
            indicator.title = `第${index + 1}章`;
            container.appendChild(indicator);
        });
    }
    
    /**
     * 読書時間タイマーの開始
     */
    startReadingTimer() {
        this.sessionStartTime = Date.now();
        
        // 既存のタイマーをクリア
        if (this.readingTimer) {
            clearInterval(this.readingTimer);
        }
        
        // 1秒ごとに更新
        this.readingTimer = setInterval(() => {
            this.updateReadingTime();
        }, 1000);
    }
    
    /**
     * 読書時間タイマーの停止
     */
    stopReadingTimer() {
        if (this.readingTimer) {
            clearInterval(this.readingTimer);
            this.readingTimer = null;
        }
    }
    
    /**
     * 読書時間の表示更新
     */
    updateReadingTime() {
        if (!this.sessionStartTime || !this.currentBook) return;
        
        const sessionTime = Math.floor((Date.now() - this.sessionStartTime) / 1000);
        const minutes = Math.floor(sessionTime / 60);
        
        // セッション時間の更新
        document.getElementById('session-time').textContent = minutes;
        
        // この作品の総読書時間
        const progress = this.gameManager.getBookProgress(this.currentBook.id);
        if (progress) {
            const totalMinutes = Math.floor((progress.readingTime + sessionTime) / 60);
            document.getElementById('book-time').textContent = totalMinutes;
        }
    }
    
    /**
     * 読書進捗の更新
     */
    updateReadingProgress() {
        if (!this.currentBook) return;
        
        const progress = this.gameManager.getBookProgress(this.currentBook.id);
        if (progress) {
            // ポイント表示
            document.getElementById('book-points').textContent = progress.points || 0;
            
            // 進捗バーの更新
            const percent = progress.percent || 0;
            document.querySelector('.reading-progress .progress-fill').style.width = `${percent}%`;
            document.querySelector('.reading-progress .progress-text').textContent = `${Math.round(percent)}%`;
        }
    }
    
    /**
     * ページ送り時の処理（TextRendererから呼び出される）
     */
    onPageChange(currentPage, totalPages) {
        if (this.currentBook) {
            // 作品情報を含めて進捗を追跡
            const bookInfo = {
                title: this.currentBook.title,
                author: this.currentBook.author
            };
            this.gameManager.trackReadingProgress(this.currentBook.id, currentPage, totalPages, bookInfo);
            
            // 章の切り替わりをチェック
            const currentChapter = this.textRenderer.getCurrentChapter();
            const progress = this.gameManager.getBookProgress(this.currentBook.id);
            
            if (progress && currentChapter !== progress.currentChapter) {
                // 章が変わった場合の処理
                const bookProgress = this.gameManager.gameData.bookProgress[this.currentBook.id];
                bookProgress.currentChapter = currentChapter;
                
                // 章の完了チェック
                if (currentChapter > 0 && !bookProgress.completedChapters.includes(currentChapter - 1)) {
                    bookProgress.completedChapters.push(currentChapter - 1);
                    this.gameManager.awardPoints('chapter_complete', 50, `第${currentChapter}章を完読`);
                }
                
                this.gameManager.saveGameData();
                this.updateChapterProgress(this.currentBook);
            }
        }
    }
    
    /**
     * グローバルエラーハンドラーの設定
     */
    setupGlobalErrorHandlers() {
        // キャッチされなかったエラーのハンドリング
        window.addEventListener('error', (event) => {
            this.errorHandler.handleError(event.error || event.message, 'system', {
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno
            });
            event.preventDefault();
        });
        
        // Promise rejectionsのハンドリング
        window.addEventListener('unhandledrejection', (event) => {
            this.errorHandler.handleError(event.reason, 'system', {
                promise: event.promise,
                type: 'unhandledRejection'
            });
            event.preventDefault();
        });
        
        // オフライン/オンラインイベント
        window.addEventListener('offline', () => {
            this.errorHandler.showError({
                code: 'network_offline'
            }, 'high');
        });
        
        window.addEventListener('online', () => {
            this.errorHandler.showToast('インターネットにせつぞくしました！', 'info');
        });
    }
}

// アプリケーションの起動
document.addEventListener('DOMContentLoaded', () => {
    const app = new App();
    app.init();
});