/**
 * integration-tests.js - システム全体の統合テスト
 */

import { testSuite } from '../test-suite.js';
import { BookLoader } from '../book-loader.js';
import { TextRenderer } from '../text-renderer.js';
import { DictionaryService } from '../dictionary-service.js';
import { GameManager } from '../game-manager.js';
import { StorageManager } from '../storage-manager.js';
import { UIManager } from '../ui-manager.js';

// 作品読み込みから表示までの統合テスト
testSuite.describe('Book Loading and Display Flow', function() {
    let bookLoader;
    let textRenderer;
    let container;
    
    this.beforeAll(() => {
        bookLoader = new BookLoader();
        textRenderer = new TextRenderer();
        container = document.createElement('div');
        container.style.width = '800px';
        container.style.height = '600px';
        document.body.appendChild(container);
    });
    
    this.afterAll(() => {
        document.body.removeChild(container);
    });
    
    this.it('should load and display a book completely', async function() {
        // 作品を読み込む
        const books = await bookLoader.loadBooks('./books/');
        this.assert.true(books.length > 0, 'Should load books');
        
        const firstBook = books[0];
        this.assert.exists(firstBook.id);
        this.assert.exists(firstBook.title);
        this.assert.exists(firstBook.content);
        
        // 作品を表示
        await textRenderer.renderBook(firstBook, container);
        
        // 表示要素の確認
        const titleElement = container.querySelector('.book-title');
        this.assert.exists(titleElement);
        this.assert.equal(titleElement.textContent, firstBook.title);
        
        const textContainer = container.querySelector('.vertical-text-content');
        this.assert.exists(textContainer);
        
        const style = window.getComputedStyle(textContainer);
        this.assert.equal(style.writingMode, 'vertical-rl');
    });
    
    this.it('should handle page navigation correctly', async function() {
        const books = await bookLoader.loadBooks('./books/');
        const book = books[0];
        
        await textRenderer.renderBook(book, container);
        
        const initialPage = textRenderer.currentPage;
        
        // 次のページへ
        textRenderer.nextPage();
        this.assert.equal(textRenderer.currentPage, initialPage + 1);
        
        // 前のページへ
        textRenderer.previousPage();
        this.assert.equal(textRenderer.currentPage, initialPage);
        
        // 境界値のテスト
        textRenderer.goToPage(1);
        textRenderer.previousPage();
        this.assert.equal(textRenderer.currentPage, 1, 'Should not go below page 1');
    });
});

// 設定変更の即座反映テスト
testSuite.describe('Settings Real-time Update', function() {
    let storageManager;
    let textRenderer;
    let container;
    
    this.beforeEach(() => {
        localStorage.clear();
        storageManager = new StorageManager();
        textRenderer = new TextRenderer();
        container = document.createElement('div');
        document.body.appendChild(container);
    });
    
    this.afterEach(() => {
        document.body.removeChild(container);
        localStorage.clear();
    });
    
    this.it('should apply font size changes immediately', function() {
        // 初期設定
        const initialSettings = {
            fontSize: 16,
            lineHeight: 1.8,
            backgroundColor: 'white'
        };
        storageManager.saveSettings(initialSettings);
        
        // 設定を適用
        textRenderer.updateSettings(initialSettings);
        
        // フォントサイズ変更
        const newSettings = { ...initialSettings, fontSize: 20 };
        storageManager.saveSettings(newSettings);
        textRenderer.updateSettings(newSettings);
        
        // CSS変数の確認
        const rootStyle = getComputedStyle(document.documentElement);
        const fontSize = rootStyle.getPropertyValue('--font-size-base');
        this.assert.includes(fontSize, '20');
    });
    
    this.it('should persist and restore settings', function() {
        const settings = {
            fontSize: 18,
            backgroundColor: 'cream',
            soundEnabled: false
        };
        
        storageManager.saveSettings(settings);
        
        // 新しいインスタンスで読み込み
        const newStorageManager = new StorageManager();
        const loadedSettings = newStorageManager.loadSettings();
        
        this.assert.deepEqual(loadedSettings, settings);
    });
});

// 進捗保存と復元の統合テスト
testSuite.describe('Progress Save and Restore', function() {
    let gameManager;
    let storageManager;
    let textRenderer;
    
    this.beforeEach(() => {
        localStorage.clear();
        storageManager = new StorageManager();
        gameManager = new GameManager(storageManager);
        textRenderer = new TextRenderer();
    });
    
    this.afterEach(() => {
        localStorage.clear();
    });
    
    this.it('should save and restore reading progress correctly', function() {
        const bookId = 'test-book';
        const bookInfo = {
            title: 'テスト作品',
            author: 'テスト作者'
        };
        
        // 読書セッション開始
        gameManager.startReadingSession(bookId);
        
        // 進捗を記録
        gameManager.trackReadingProgress(bookId, 5, 10, bookInfo);
        
        // 語句を学習
        gameManager.recordWordLearned('難しい', 10);
        gameManager.recordWordLearned('簡単', 10);
        
        // セッション終了
        gameManager.endReadingSession();
        
        // 新しいインスタンスで読み込み
        const newStorageManager = new StorageManager();
        const newGameManager = new GameManager(newStorageManager);
        
        const progress = newGameManager.getBookProgress(bookId);
        this.assert.exists(progress);
        this.assert.equal(progress.currentPage, 5);
        this.assert.equal(progress.percent, 50);
        this.assert.includes(progress.wordsLearned, '難しい');
        this.assert.includes(progress.wordsLearned, '簡単');
    });
    
    this.it('should handle multiple books progress', function() {
        const books = [
            { id: 'book1', pages: 10 },
            { id: 'book2', pages: 20 },
            { id: 'book3', pages: 15 }
        ];
        
        // 各本の進捗を記録
        books.forEach(book => {
            gameManager.startReadingSession(book.id);
            gameManager.trackReadingProgress(book.id, 5, book.pages);
            gameManager.endReadingSession();
        });
        
        // すべての進捗を確認
        books.forEach(book => {
            const progress = gameManager.getBookProgress(book.id);
            this.assert.exists(progress);
            this.assert.equal(progress.currentPage, 5);
        });
    });
});

// ゲーム要素の統合テスト
testSuite.describe('Game Features Integration', function() {
    let gameManager;
    let dictionaryService;
    let storageManager;
    
    this.beforeEach(() => {
        localStorage.clear();
        storageManager = new StorageManager();
        gameManager = new GameManager(storageManager);
        dictionaryService = new DictionaryService();
        
        // 辞書サービスとゲームマネージャーの連携
        dictionaryService.onWordLearned = (word, points, isFirstLearn) => {
            gameManager.recordWordLearned(word, points);
        };
    });
    
    this.afterEach(() => {
        localStorage.clear();
    });
    
    this.it('should award points for various actions', function() {
        const initialPoints = gameManager.gameData.totalPoints;
        
        // 読書開始
        gameManager.startReadingSession('book1');
        
        // 語句学習
        dictionaryService.learnWord('新しい語句');
        
        // 章完了
        gameManager.awardPoints('chapter_complete', 50, '第1章完了');
        
        // ポイント確認
        const currentPoints = gameManager.gameData.totalPoints;
        this.assert.true(currentPoints > initialPoints);
    });
    
    this.it('should unlock achievements progressively', function() {
        // 初回読書
        gameManager.startReadingSession('first-book');
        let achievements = gameManager.gameData.achievements;
        const firstReadCount = achievements.filter(a => a.id === 'first_read').length;
        this.assert.equal(firstReadCount, 1);
        
        // 5冊完読
        for (let i = 1; i <= 5; i++) {
            gameManager.startReadingSession(`book${i}`);
            gameManager.trackReadingProgress(`book${i}`, 10, 10);
            gameManager.gameData.bookProgress[`book${i}`].completed = true;
            gameManager.gameData.bookProgress[`book${i}`].completedDate = Date.now();
        }
        
        gameManager.checkAchievements();
        achievements = gameManager.gameData.achievements;
        const bookwormCount = achievements.filter(a => a.id === 'bookworm').length;
        this.assert.equal(bookwormCount, 1, 'Should unlock bookworm achievement');
    });
});

// UIフローの統合テスト
testSuite.describe('UI Flow Integration', function() {
    let uiManager;
    let container;
    
    this.beforeAll(() => {
        uiManager = new UIManager();
        container = document.createElement('div');
        container.id = 'test-container';
        document.body.appendChild(container);
    });
    
    this.afterAll(() => {
        document.body.removeChild(container);
    });
    
    this.it('should show and hide loading states', async function() {
        // ローディング表示
        uiManager.showLoading('テスト中...');
        
        let loadingElement = document.querySelector('.loading-overlay');
        this.assert.exists(loadingElement);
        this.assert.includes(loadingElement.textContent, 'テスト中...');
        
        // ローディング非表示
        uiManager.hideLoading();
        
        // アニメーション完了を待つ
        await new Promise(resolve => setTimeout(resolve, 400));
        
        loadingElement = document.querySelector('.loading-overlay');
        this.assert.false(
            loadingElement && loadingElement.style.display !== 'none',
            'Loading should be hidden'
        );
    });
    
    this.it('should show notifications correctly', async function() {
        // 通知表示
        uiManager.showNotification('テスト通知', 'success');
        
        const notification = document.querySelector('.notification-item');
        this.assert.exists(notification);
        this.assert.includes(notification.textContent, 'テスト通知');
        this.assert.true(notification.classList.contains('notification-success'));
        
        // 自動非表示を待つ
        await new Promise(resolve => setTimeout(resolve, 3500));
        
        const remainingNotifications = document.querySelectorAll('.notification-item');
        this.assert.equal(remainingNotifications.length, 0, 'Notification should auto-hide');
    });
});

// クロスブラウザ互換性テスト
testSuite.describe('Cross-browser Compatibility', function() {
    this.it('should detect CSS Writing Mode support', function() {
        const testElement = document.createElement('div');
        testElement.style.writingMode = 'vertical-rl';
        document.body.appendChild(testElement);
        
        const computedStyle = window.getComputedStyle(testElement);
        const isSupported = computedStyle.writingMode === 'vertical-rl';
        
        document.body.removeChild(testElement);
        
        this.assert.true(isSupported, 'Browser should support CSS Writing Modes');
    });
    
    this.it('should handle localStorage availability', function() {
        // LocalStorageが利用可能か確認
        let isAvailable = false;
        try {
            const testKey = '__localStorage_test__';
            localStorage.setItem(testKey, 'test');
            localStorage.removeItem(testKey);
            isAvailable = true;
        } catch (e) {
            isAvailable = false;
        }
        
        this.assert.true(isAvailable, 'localStorage should be available');
    });
    
    this.it('should support modern JavaScript features', function() {
        // ES6機能のサポート確認
        this.assert.exists(Promise, 'Promise should be supported');
        this.assert.exists(Array.from, 'Array.from should be supported');
        this.assert.exists(Object.assign, 'Object.assign should be supported');
        
        // async/awaitのサポート（関数として定義できるか）
        const asyncFunc = async () => await Promise.resolve(true);
        this.assert.type(asyncFunc, 'function', 'Async functions should be supported');
    });
});

// パフォーマンステスト
testSuite.describe('Performance Tests', function() {
    this.it('should render large texts efficiently', async function() {
        const largeText = 'あ'.repeat(10000);
        const renderer = new TextRenderer();
        const container = document.createElement('div');
        container.style.width = '800px';
        container.style.height = '600px';
        document.body.appendChild(container);
        
        const startTime = performance.now();
        
        renderer.calculatePages(largeText);
        
        const endTime = performance.now();
        const duration = endTime - startTime;
        
        document.body.removeChild(container);
        
        this.assert.true(
            duration < 1000,
            `Large text should render in less than 1 second (took ${duration}ms)`
        );
    });
    
    this.it('should handle multiple books loading efficiently', async function() {
        const loader = new BookLoader();
        
        const startTime = performance.now();
        
        const books = await loader.loadBooks('./books/');
        
        const endTime = performance.now();
        const duration = endTime - startTime;
        
        this.assert.true(
            duration < 2000,
            `Books should load in less than 2 seconds (took ${duration}ms)`
        );
        
        this.assert.true(books.length > 0, 'Should load multiple books');
    });
});

// エクスポート
export default testSuite;