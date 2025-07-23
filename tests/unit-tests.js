/**
 * unit-tests.js - 各コンポーネントの単体テスト
 */

import { testSuite } from '../test-suite.js';
import { BookLoader } from '../book-loader.js';
import { BookAdapter } from '../book-adapter.js';
import { StorageManager } from '../storage-manager.js';
import { TextRenderer } from '../text-renderer.js';
import { DictionaryService } from '../dictionary-service.js';
import { GameManager } from '../game-manager.js';
import { DataValidator } from '../data-validator.js';
import { ErrorHandler } from '../error-handler.js';

// BookLoaderのテスト
testSuite.describe('BookLoader', function() {
    let loader;
    
    this.beforeEach(() => {
        loader = new BookLoader();
    });
    
    this.it('should load default book files', async function() {
        const books = await loader.loadBooks('./books/');
        
        this.assert.exists(books);
        this.assert.type(books, 'object');
        this.assert.true(Array.isArray(books), 'Books should be an array');
        this.assert.true(books.length > 0, 'Should load at least one book');
    });
    
    this.it('should validate book format correctly', function() {
        const validBook = {
            id: 'test',
            title: 'テスト作品',
            author: 'テスト作者',
            content: [{
                chapter: 1,
                text: 'テスト本文',
                annotations: []
            }]
        };
        
        // 正常なデータは例外をスローしない
        this.assert.throws(
            () => loader.validateBookFormat(validBook),
            null,
            'Valid book should not throw'
        );
        
        // 必須フィールドが欠けている場合
        const invalidBook = { title: 'テスト' };
        this.assert.throws(
            () => loader.validateBookFormat(invalidBook),
            Error,
            'Invalid book should throw error'
        );
    });
    
    this.it('should handle JSON parse errors gracefully', function() {
        const invalidJSON = '{ invalid json }';
        
        this.assert.throws(
            () => loader.parseBookContent(invalidJSON),
            Error,
            'Should throw error for invalid JSON'
        );
    });
    
    this.it('should normalize book data correctly', function() {
        const bookData = {
            id: 'test',
            title: 'テスト',
            author: 'テスト作者',
            content: [{
                chapter: 1,
                text: 'テスト'
            }]
        };
        
        const normalized = loader.normalizeBookData(bookData);
        
        this.assert.exists(normalized.category);
        this.assert.exists(normalized.difficulty);
        this.assert.exists(normalized.length);
        this.assert.equal(normalized.content[0].title, '第1章');
    });
});

// BookAdapterのテスト
testSuite.describe('BookAdapter', function() {
    this.it('should detect and convert new format', function() {
        const newFormat = {
            id: 'test',
            title: 'テスト作品',
            author: { name: 'テスト作者' },
            metadata: {
                difficulty: { overall: 5 },
                totalCharacters: 5000
            },
            content: {
                lines: [{
                    segments: [{
                        type: 'text',
                        content: 'テスト本文'
                    }]
                }]
            }
        };
        
        const converted = BookAdapter.normalize(newFormat);
        
        this.assert.equal(converted.author, 'テスト作者');
        this.assert.equal(converted.difficulty, 'intermediate');
        this.assert.equal(converted.length, 'medium');
        this.assert.true(Array.isArray(converted.content));
    });
    
    this.it('should handle old format without conversion', function() {
        const oldFormat = {
            id: 'test',
            title: 'テスト',
            author: 'テスト作者',
            content: [{
                chapter: 1,
                text: 'テスト本文'
            }]
        };
        
        const normalized = BookAdapter.normalize(oldFormat);
        
        this.assert.equal(normalized.author, 'テスト作者');
        this.assert.exists(normalized.difficulty);
        this.assert.true(Array.isArray(normalized.content));
    });
    
    this.it('should process ruby notation correctly', function() {
        const adapter = new BookAdapter();
        const annotations = [];
        
        const result = adapter.processRubyNotation(
            '私《わたし》は｜青空《あおぞら》を見た。',
            0,
            annotations
        );
        
        this.assert.equal(result.text, '私は青空を見た。');
        this.assert.equal(annotations.length, 2);
        this.assert.equal(annotations[0].word, '私');
        this.assert.equal(annotations[0].reading, 'わたし');
        this.assert.equal(annotations[1].word, '青空');
        this.assert.equal(annotations[1].reading, 'あおぞら');
    });
});

// StorageManagerのテスト
testSuite.describe('StorageManager', function() {
    let storage;
    
    this.beforeEach(() => {
        storage = new StorageManager();
        // LocalStorageをクリア
        localStorage.clear();
    });
    
    this.afterEach(() => {
        localStorage.clear();
    });
    
    this.it('should save and load settings', function() {
        const settings = {
            fontSize: 18,
            backgroundColor: 'cream',
            soundEnabled: false
        };
        
        storage.saveSettings(settings);
        const loaded = storage.loadSettings();
        
        this.assert.deepEqual(loaded, settings);
    });
    
    this.it('should save and load progress', function() {
        const progressData = {
            bookId: 'test',
            currentPage: 5,
            totalPages: 10
        };
        
        storage.saveProgress('test', progressData);
        const loaded = storage.loadProgress('test');
        
        this.assert.deepEqual(loaded, progressData);
    });
    
    this.it('should handle storage quota exceeded', function() {
        // 大量のデータを保存しようとする
        const hugeData = 'x'.repeat(10 * 1024 * 1024); // 10MB
        
        try {
            storage.saveData('huge', hugeData);
        } catch (error) {
            this.assert.true(
                error.message.includes('容量') || error.name === 'QuotaExceededError',
                'Should handle quota exceeded error'
            );
        }
    });
});

// TextRendererのテスト
testSuite.describe('TextRenderer', function() {
    let renderer;
    let container;
    
    this.beforeEach(() => {
        renderer = new TextRenderer();
        container = document.createElement('div');
        document.body.appendChild(container);
    });
    
    this.afterEach(() => {
        document.body.removeChild(container);
    });
    
    this.it('should calculate pages correctly', function() {
        const text = 'あ'.repeat(1000);
        renderer.container = container;
        
        // コンテナサイズを設定
        container.style.width = '300px';
        container.style.height = '400px';
        
        renderer.calculatePages(text);
        
        this.assert.true(renderer.totalPages > 0, 'Should have at least one page');
    });
    
    this.it('should apply vertical writing mode', function() {
        const book = {
            title: 'テスト',
            content: [{
                chapter: 1,
                text: 'テスト本文'
            }]
        };
        
        renderer.renderBook(book, container);
        
        const textContainer = container.querySelector('.vertical-text-content');
        this.assert.exists(textContainer);
        
        const computedStyle = window.getComputedStyle(textContainer);
        this.assert.equal(
            computedStyle.writingMode,
            'vertical-rl',
            'Should apply vertical writing mode'
        );
    });
});

// DictionaryServiceのテスト
testSuite.describe('DictionaryService', function() {
    let dictionary;
    
    this.beforeEach(() => {
        dictionary = new DictionaryService();
    });
    
    this.it('should set and find annotations', function() {
        const content = [{
            chapter: 1,
            annotations: [
                {
                    word: 'テスト',
                    reading: 'てすと',
                    definition: 'テストの定義'
                }
            ]
        }];
        
        dictionary.setAnnotations(content);
        
        const definition = dictionary.getDefinition('テスト');
        this.assert.exists(definition);
        this.assert.equal(definition.reading, 'てすと');
    });
    
    this.it('should highlight annotated words', function() {
        dictionary.annotations.set('難しい', {
            word: '難しい',
            reading: 'むずかしい',
            definition: '困難な'
        });
        
        const container = document.createElement('div');
        container.innerHTML = '<p>これは難しい問題です。</p>';
        
        dictionary.highlightAnnotations(container);
        
        const highlighted = container.querySelector('.clickable-text');
        this.assert.exists(highlighted);
        this.assert.equal(highlighted.textContent, '難しい');
    });
});

// GameManagerのテスト
testSuite.describe('GameManager', function() {
    let gameManager;
    let storageManager;
    
    this.beforeEach(() => {
        localStorage.clear();
        storageManager = new StorageManager();
        gameManager = new GameManager(storageManager);
    });
    
    this.afterEach(() => {
        localStorage.clear();
    });
    
    this.it('should track reading progress', function() {
        gameManager.startReadingSession('test-book');
        gameManager.trackReadingProgress('test-book', 5, 10);
        
        const progress = gameManager.getBookProgress('test-book');
        this.assert.exists(progress);
        this.assert.equal(progress.currentPage, 5);
        this.assert.equal(progress.percent, 50);
    });
    
    this.it('should award points correctly', function() {
        gameManager.startReadingSession('test-book');
        const initialPoints = gameManager.gameData.totalPoints;
        
        gameManager.awardPoints('word_learned', 10, 'テスト語句を学習');
        
        this.assert.equal(
            gameManager.gameData.totalPoints,
            initialPoints + 10,
            'Points should be awarded'
        );
    });
    
    this.it('should track achievements', function() {
        // 初回読書アチーブメントのテスト
        gameManager.startReadingSession('first-book');
        
        const achievements = gameManager.gameData.achievements;
        const hasFirstRead = achievements.some(a => a.id === 'first_read');
        
        this.assert.true(hasFirstRead, 'Should unlock first read achievement');
    });
    
    this.it('should calculate statistics correctly', function() {
        // 読書データを追加
        gameManager.startReadingSession('book1');
        gameManager.trackReadingProgress('book1', 10, 10);
        gameManager.gameData.bookProgress['book1'].completed = true;
        gameManager.endReadingSession();
        
        const stats = gameManager.getStatistics();
        
        this.assert.equal(stats.completedBooks, 1);
        this.assert.true(stats.totalReadingTime >= 0);
    });
});

// DataValidatorのテスト
testSuite.describe('DataValidator', function() {
    let validator;
    
    this.beforeEach(() => {
        validator = new DataValidator();
    });
    
    this.it('should validate book data correctly', function() {
        const validBook = {
            id: 'test',
            title: 'テスト作品',
            author: 'テスト作者',
            difficulty: 'beginner',
            content: [{
                chapter: 1,
                text: 'テスト本文'
            }]
        };
        
        const result = validator.validateBook(validBook);
        this.assert.true(result.valid);
        this.assert.equal(result.errors.length, 0);
    });
    
    this.it('should detect missing required fields', function() {
        const invalidBook = {
            title: 'テスト作品'
            // id, author, content が欠けている
        };
        
        const result = validator.validateBook(invalidBook);
        this.assert.false(result.valid);
        this.assert.true(result.errors.length > 0);
    });
    
    this.it('should validate field types', function() {
        const schema = {
            name: { type: 'string', required: true },
            age: { type: 'number', min: 0, max: 150 },
            email: { type: 'string', pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ }
        };
        
        const validData = {
            name: 'テスト太郎',
            age: 25,
            email: 'test@example.com'
        };
        
        const result = validator.validate(validData, schema);
        this.assert.true(result.valid);
    });
    
    this.it('should provide friendly error messages', function() {
        const errors = [
            { type: 'required', path: 'title' },
            { type: 'minLength', path: 'author' }
        ];
        
        const messages = validator.getFriendlyErrorMessages(errors);
        
        this.assert.true(Array.isArray(messages));
        this.assert.true(messages.every(m => typeof m === 'string'));
    });
});

// ErrorHandlerのテスト
testSuite.describe('ErrorHandler', function() {
    let errorHandler;
    
    this.beforeEach(() => {
        errorHandler = new ErrorHandler();
        localStorage.clear();
    });
    
    this.afterEach(() => {
        // エラー通知コンテナをクリーンアップ
        const containers = document.querySelectorAll(
            '#error-toast-container, #error-modal-container'
        );
        containers.forEach(c => c.remove());
        localStorage.clear();
    });
    
    this.it('should handle different error types', function() {
        const networkError = new Error('Network failed');
        const result = errorHandler.handleError(
            networkError,
            'network',
            { url: 'test.json' }
        );
        
        this.assert.exists(result);
        this.assert.equal(result.type, 'network');
    });
    
    this.it('should show toast notifications', function() {
        errorHandler.showToast('テストメッセージ', 'info');
        
        const toast = document.querySelector('.error-toast');
        this.assert.exists(toast);
        this.assert.includes(
            toast.textContent,
            'テストメッセージ',
            'Toast should contain message'
        );
    });
    
    this.it('should log errors to localStorage', function() {
        errorHandler.handleError(
            new Error('Test error'),
            'system',
            { test: true }
        );
        
        const log = errorHandler.getErrorLog();
        this.assert.true(log.length > 0);
        this.assert.equal(log[0].type, 'system');
    });
    
    this.it('should provide friendly messages', function() {
        const errorInfo = {
            type: 'network',
            message: 'offline',
            code: 'network_offline'
        };
        
        const message = errorHandler.getFriendlyMessage(errorInfo);
        this.assert.includes(message, 'インターネット');
    });
});

// エクスポート
export default testSuite;