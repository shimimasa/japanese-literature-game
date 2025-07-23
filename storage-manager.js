/**
 * storage-manager.js - データ永続化サービス
 * 
 * LocalStorageを使用してユーザーの進捗、設定、
 * アチーブメントなどのデータを永続化します。
 */

export class StorageManager {
    constructor() {
        // ストレージキー
        this.KEYS = {
            SETTINGS: 'jlrg_settings',
            PROGRESS: 'jlrg_progress',
            LEARNED_WORDS: 'jlrg_learned_words',
            ACHIEVEMENTS: 'jlrg_achievements',
            BOOK_CACHE: 'jlrg_book_cache',
            VERSION: 'jlrg_version'
        };
        
        // 現在のデータバージョン
        this.CURRENT_VERSION = '1.0.0';
        
        // ストレージ容量制限（5MB）
        this.MAX_STORAGE_SIZE = 5 * 1024 * 1024;
        
        // 初期化
        this.init();
    }
    
    /**
     * 初期化処理
     */
    init() {
        // バージョンチェックとマイグレーション
        this.checkAndMigrate();
        
        // ストレージ容量のチェック
        this.checkStorageSpace();
        
        // 初回起動時のデータ整合性チェック
        const integrityReport = this.performFullIntegrityCheck();
        if (integrityReport.totalErrors > 0 || integrityReport.repairedKeys > 0) {
            console.log('データ整合性チェック結果:', integrityReport);
        }
    }
    
    /**
     * バージョンチェックとデータマイグレーション
     */
    checkAndMigrate() {
        const savedVersion = this.get(this.KEYS.VERSION);
        
        if (!savedVersion) {
            // 初回利用
            this.set(this.KEYS.VERSION, this.CURRENT_VERSION);
        } else if (savedVersion !== this.CURRENT_VERSION) {
            // バージョンが異なる場合はマイグレーション
            this.migrateData(savedVersion, this.CURRENT_VERSION);
            this.set(this.KEYS.VERSION, this.CURRENT_VERSION);
        }
    }
    
    /**
     * データマイグレーション
     * @param {string} fromVersion - 移行元バージョン
     * @param {string} toVersion - 移行先バージョン
     */
    migrateData(fromVersion, toVersion) {
        console.log(`データマイグレーション: ${fromVersion} → ${toVersion}`);
        
        // バージョンごとのマイグレーション処理
        // 現在は初期バージョンのため、特別な処理は不要
    }
    
    /**
     * ストレージ容量のチェック
     * @returns {Object} 使用状況
     */
    checkStorageSpace() {
        let totalSize = 0;
        
        try {
            for (let key in localStorage) {
                if (key.startsWith('jlrg_')) {
                    const value = localStorage.getItem(key);
                    totalSize += key.length + value.length;
                }
            }
            
            const usagePercent = (totalSize / this.MAX_STORAGE_SIZE) * 100;
            
            if (usagePercent > 80) {
                console.warn(`ストレージ使用量が${usagePercent.toFixed(1)}%に達しています`);
            }
            
            return {
                used: totalSize,
                total: this.MAX_STORAGE_SIZE,
                percent: usagePercent
            };
            
        } catch (error) {
            console.error('ストレージ容量チェックエラー:', error);
            return null;
        }
    }
    
    /**
     * 汎用的なデータ保存
     * @param {string} key - キー
     * @param {any} value - 値
     * @returns {boolean} 成功したかどうか
     */
    set(key, value) {
        try {
            const serialized = JSON.stringify(value);
            localStorage.setItem(key, serialized);
            return true;
        } catch (error) {
            if (error.name === 'QuotaExceededError') {
                this.handleStorageFull();
            }
            console.error(`データ保存エラー (${key}):`, error);
            return false;
        }
    }
    
    /**
     * 汎用的なデータ読み込み
     * @param {string} key - キー
     * @returns {any} 値
     */
    get(key) {
        try {
            const serialized = localStorage.getItem(key);
            if (serialized === null) {
                return null;
            }
            return JSON.parse(serialized);
        } catch (error) {
            console.error(`データ読み込みエラー (${key}):`, error);
            return null;
        }
    }
    
    /**
     * データの削除
     * @param {string} key - キー
     */
    remove(key) {
        try {
            localStorage.removeItem(key);
        } catch (error) {
            console.error(`データ削除エラー (${key}):`, error);
        }
    }
    
    /**
     * 設定の保存
     * @param {Object} settings - 設定データ
     * @returns {boolean} 成功したかどうか
     */
    saveSettings(settings) {
        const settingsData = {
            fontSize: settings.fontSize || 16,
            lineHeight: settings.lineHeight || 1.8,
            backgroundColor: settings.backgroundColor || 'white',
            soundEnabled: settings.soundEnabled !== false,
            lastUpdated: new Date().toISOString()
        };
        
        return this.set(this.KEYS.SETTINGS, settingsData);
    }
    
    /**
     * 設定の読み込み
     * @returns {Object} 設定データ
     */
    loadSettings() {
        const settings = this.get(this.KEYS.SETTINGS);
        
        if (!settings) {
            // デフォルト設定
            return {
                fontSize: 16,
                lineHeight: 1.8,
                backgroundColor: 'white',
                soundEnabled: true
            };
        }
        
        return settings;
    }
    
    /**
     * 進捗データの保存
     * @param {Object} progressData - 進捗データ
     * @returns {boolean} 成功したかどうか
     */
    saveProgress(progressData) {
        // データの検証
        if (!this.validateProgressData(progressData)) {
            console.error('進捗データの検証に失敗しました');
            return false;
        }
        
        // タイムスタンプの追加
        progressData.lastUpdated = new Date().toISOString();
        
        // 増分保存のための最適化（大きなオブジェクトの場合）
        return this.set(this.KEYS.PROGRESS, progressData);
    }
    
    /**
     * 特定の作品の進捗を更新（増分更新）
     * @param {string} bookId - 作品ID
     * @param {Object} bookProgress - 作品の進捗データ
     * @returns {boolean} 成功したかどうか
     */
    updateBookProgress(bookId, bookProgress) {
        const progress = this.loadProgress() || this.createEmptyProgress();
        
        // 作品の進捗を更新
        progress.bookProgress[bookId] = {
            ...progress.bookProgress[bookId],
            ...bookProgress,
            lastUpdated: new Date().toISOString()
        };
        
        // 読書時間の更新
        if (bookProgress.readingTime) {
            const previousTime = progress.bookProgress[bookId]?.readingTime || 0;
            const timeDiff = bookProgress.readingTime - previousTime;
            progress.totalReadingTime += timeDiff;
        }
        
        // 完読した場合の処理
        if (bookProgress.completed && !progress.completedBooks.includes(bookId)) {
            progress.completedBooks.push(bookId);
            progress.totalCompletedBooks = progress.completedBooks.length;
        }
        
        return this.saveProgress(progress);
    }
    
    /**
     * ユーザー設定の部分更新
     * @param {Object} partialSettings - 更新する設定の一部
     * @returns {boolean} 成功したかどうか
     */
    updateSettings(partialSettings) {
        const currentSettings = this.loadSettings();
        const updatedSettings = {
            ...currentSettings,
            ...partialSettings,
            lastUpdated: new Date().toISOString()
        };
        
        return this.saveSettings(updatedSettings);
    }
    
    /**
     * アチーブメントの追加（既存のものに追加）
     * @param {Object} newAchievement - 新しいアチーブメント
     * @returns {boolean} 成功したかどうか
     */
    addAchievement(newAchievement) {
        const achievements = this.loadAchievements();
        
        // 重複チェック
        const exists = achievements.some(a => 
            a.type === newAchievement.type && 
            a.bookId === newAchievement.bookId
        );
        
        if (!exists) {
            achievements.push({
                ...newAchievement,
                date: new Date().toISOString(),
                id: this.generateId()
            });
            
            return this.saveAchievements(achievements);
        }
        
        return false;
    }
    
    /**
     * 空の進捗データを作成
     * @returns {Object} 空の進捗データ
     */
    createEmptyProgress() {
        return {
            totalPoints: 0,
            totalReadingTime: 0,
            completedBooks: [],
            totalCompletedBooks: 0,
            bookProgress: {},
            streakDays: 0,
            lastReadDate: null,
            startDate: new Date().toISOString()
        };
    }
    
    /**
     * IDの生成
     * @returns {string} ユニークなID
     */
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }
    
    /**
     * 進捗データの読み込み
     * @returns {Object} 進捗データ
     */
    loadProgress() {
        const progress = this.get(this.KEYS.PROGRESS);
        
        if (!progress) {
            return null;
        }
        
        // データの整合性チェック
        if (!this.validateProgressData(progress)) {
            console.warn('進捗データが破損している可能性があります');
            return null;
        }
        
        return progress;
    }
    
    /**
     * 進捗データの検証
     * @param {Object} data - 検証するデータ
     * @returns {boolean} 有効かどうか
     */
    validateProgressData(data) {
        // 必須フィールドのチェック
        const requiredFields = [
            'totalPoints',
            'totalReadingTime',
            'completedBooks',
            'bookProgress'
        ];
        
        for (const field of requiredFields) {
            if (!(field in data)) {
                console.error(`必須フィールド "${field}" が見つかりません`);
                return false;
            }
        }
        
        // 型チェック
        if (typeof data.totalPoints !== 'number' ||
            typeof data.totalReadingTime !== 'number' ||
            !Array.isArray(data.completedBooks) ||
            typeof data.bookProgress !== 'object') {
            console.error('データ型が正しくありません');
            return false;
        }
        
        // 数値の妥当性チェック
        if (data.totalPoints < 0 || data.totalReadingTime < 0) {
            console.error('数値が負の値になっています');
            return false;
        }
        
        // 配列の整合性チェック
        if (data.totalCompletedBooks !== undefined && 
            data.totalCompletedBooks !== data.completedBooks.length) {
            console.warn('完読数の不整合を検出しました');
        }
        
        return true;
    }
    
    /**
     * データの整合性チェックと修復
     * @returns {Object} チェック結果
     */
    checkAndRepairDataIntegrity() {
        const results = {
            checked: 0,
            repaired: 0,
            errors: []
        };
        
        // 進捗データのチェック
        const progress = this.get(this.KEYS.PROGRESS);
        if (progress) {
            results.checked++;
            
            // 完読数の整合性修復
            if (progress.completedBooks && progress.totalCompletedBooks !== progress.completedBooks.length) {
                progress.totalCompletedBooks = progress.completedBooks.length;
                this.set(this.KEYS.PROGRESS, progress);
                results.repaired++;
            }
            
            // 重複の削除
            if (progress.completedBooks) {
                const uniqueBooks = [...new Set(progress.completedBooks)];
                if (uniqueBooks.length !== progress.completedBooks.length) {
                    progress.completedBooks = uniqueBooks;
                    progress.totalCompletedBooks = uniqueBooks.length;
                    this.set(this.KEYS.PROGRESS, progress);
                    results.repaired++;
                }
            }
            
            // 各作品の進捗データチェック
            if (progress.bookProgress) {
                for (const bookId in progress.bookProgress) {
                    const bookData = progress.bookProgress[bookId];
                    
                    // 負の値のチェック
                    if (bookData.readingTime < 0) {
                        bookData.readingTime = 0;
                        results.repaired++;
                    }
                    
                    // 章の進捗整合性
                    if (bookData.completedChapters && 
                        bookData.currentChapter < bookData.completedChapters.length) {
                        bookData.currentChapter = bookData.completedChapters.length;
                        results.repaired++;
                    }
                }
                
                if (results.repaired > 0) {
                    this.set(this.KEYS.PROGRESS, progress);
                }
            }
        }
        
        // 学習語句データのチェック
        const learnedWords = this.get(this.KEYS.LEARNED_WORDS);
        if (learnedWords) {
            results.checked++;
            
            if (learnedWords.words && learnedWords.count !== learnedWords.words.length) {
                learnedWords.count = learnedWords.words.length;
                this.set(this.KEYS.LEARNED_WORDS, learnedWords);
                results.repaired++;
            }
        }
        
        return results;
    }
    
    /**
     * 破損データの検出
     * @param {string} key - チェックするキー
     * @returns {boolean} データが破損しているかどうか
     */
    isDataCorrupted(key) {
        try {
            const data = localStorage.getItem(key);
            if (!data) return false;
            
            JSON.parse(data);
            return false;
        } catch (error) {
            return true;
        }
    }
    
    /**
     * すべてのデータの整合性チェック
     * @returns {Object} チェック結果の詳細
     */
    performFullIntegrityCheck() {
        const report = {
            timestamp: new Date().toISOString(),
            corruptedKeys: [],
            repairedKeys: [],
            totalErrors: 0
        };
        
        // 各キーのチェック
        for (const keyName in this.KEYS) {
            const key = this.KEYS[keyName];
            
            if (this.isDataCorrupted(key)) {
                report.corruptedKeys.push(key);
                report.totalErrors++;
                
                // 破損データのバックアップと削除
                try {
                    const corruptedData = localStorage.getItem(key);
                    localStorage.setItem(`${key}_corrupted_${Date.now()}`, corruptedData);
                    localStorage.removeItem(key);
                    console.warn(`破損データを検出: ${key} - バックアップを作成しました`);
                } catch (error) {
                    console.error(`破損データの処理エラー: ${key}`, error);
                }
            }
        }
        
        // データ修復の実行
        const repairResults = this.checkAndRepairDataIntegrity();
        report.repairedKeys = repairResults.repaired;
        
        return report;
    }
    
    /**
     * 学習済み語句の保存
     * @param {Array} words - 語句の配列
     * @returns {boolean} 成功したかどうか
     */
    saveLearnedWords(words) {
        if (!Array.isArray(words)) {
            console.error('語句データは配列である必要があります');
            return false;
        }
        
        // 重複を除去
        const uniqueWords = [...new Set(words)];
        
        return this.set(this.KEYS.LEARNED_WORDS, {
            words: uniqueWords,
            count: uniqueWords.length,
            lastUpdated: new Date().toISOString()
        });
    }
    
    /**
     * 学習済み語句の追加（増分更新）
     * @param {string} word - 追加する語句
     * @param {Object} wordData - 語句の詳細データ
     * @returns {boolean} 成功したかどうか
     */
    addLearnedWord(word, wordData = {}) {
        const learnedData = this.get(this.KEYS.LEARNED_WORDS) || { words: [], wordDetails: {} };
        
        if (!learnedData.words.includes(word)) {
            learnedData.words.push(word);
            learnedData.count = learnedData.words.length;
        }
        
        // 語句の詳細情報を保存
        if (!learnedData.wordDetails) {
            learnedData.wordDetails = {};
        }
        
        learnedData.wordDetails[word] = {
            ...learnedData.wordDetails[word],
            ...wordData,
            firstLearnedDate: learnedData.wordDetails[word]?.firstLearnedDate || new Date().toISOString(),
            lastReviewedDate: new Date().toISOString(),
            reviewCount: (learnedData.wordDetails[word]?.reviewCount || 0) + 1
        };
        
        learnedData.lastUpdated = new Date().toISOString();
        
        return this.set(this.KEYS.LEARNED_WORDS, learnedData);
    }
    
    /**
     * 学習済み語句の読み込み
     * @returns {Array} 語句の配列
     */
    loadLearnedWords() {
        const data = this.get(this.KEYS.LEARNED_WORDS);
        return data?.words || [];
    }
    
    /**
     * アチーブメントの保存
     * @param {Array} achievements - アチーブメントの配列
     * @returns {boolean} 成功したかどうか
     */
    saveAchievements(achievements) {
        return this.set(this.KEYS.ACHIEVEMENTS, {
            achievements: achievements,
            count: achievements.length,
            lastUnlocked: achievements[achievements.length - 1]?.date || null
        });
    }
    
    /**
     * アチーブメントの読み込み
     * @returns {Array} アチーブメントの配列
     */
    loadAchievements() {
        const data = this.get(this.KEYS.ACHIEVEMENTS);
        return data?.achievements || [];
    }
    
    /**
     * 作品キャッシュの保存
     * @param {string} bookId - 作品ID
     * @param {Object} bookData - 作品データ
     * @returns {boolean} 成功したかどうか
     */
    cacheBook(bookId, bookData) {
        const cache = this.get(this.KEYS.BOOK_CACHE) || {};
        
        cache[bookId] = {
            data: bookData,
            cachedAt: new Date().toISOString()
        };
        
        // 古いキャッシュの削除（30日以上前）
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        for (const id in cache) {
            if (new Date(cache[id].cachedAt) < thirtyDaysAgo) {
                delete cache[id];
            }
        }
        
        return this.set(this.KEYS.BOOK_CACHE, cache);
    }
    
    /**
     * 作品キャッシュの取得
     * @param {string} bookId - 作品ID
     * @returns {Object|null} 作品データ
     */
    getCachedBook(bookId) {
        const cache = this.get(this.KEYS.BOOK_CACHE);
        return cache?.[bookId]?.data || null;
    }
    
    /**
     * すべてのデータをエクスポート
     * @returns {Object} エクスポートデータ
     */
    exportAllData() {
        const exportData = {
            version: this.CURRENT_VERSION,
            exportedAt: new Date().toISOString(),
            settings: this.loadSettings(),
            progress: this.loadProgress(),
            learnedWords: this.loadLearnedWords(),
            achievements: this.loadAchievements()
        };
        
        return exportData;
    }
    
    /**
     * データのインポート
     * @param {Object} importData - インポートするデータ
     * @returns {boolean} 成功したかどうか
     */
    importData(importData) {
        try {
            // バージョンチェック
            if (importData.version !== this.CURRENT_VERSION) {
                if (!confirm('データのバージョンが異なります。インポートを続行しますか？')) {
                    return false;
                }
            }
            
            // 各データのインポート
            if (importData.settings) {
                this.saveSettings(importData.settings);
            }
            
            if (importData.progress) {
                this.saveProgress(importData.progress);
            }
            
            if (importData.learnedWords) {
                this.saveLearnedWords(importData.learnedWords);
            }
            
            if (importData.achievements) {
                this.saveAchievements(importData.achievements);
            }
            
            return true;
            
        } catch (error) {
            console.error('データインポートエラー:', error);
            return false;
        }
    }
    
    /**
     * 進捗データのクリア
     */
    clearProgress() {
        this.remove(this.KEYS.PROGRESS);
        this.remove(this.KEYS.LEARNED_WORDS);
        this.remove(this.KEYS.ACHIEVEMENTS);
    }
    
    /**
     * すべてのデータをクリア
     */
    clearAllData() {
        for (const key in this.KEYS) {
            this.remove(this.KEYS[key]);
        }
    }
    
    /**
     * ストレージ容量不足時の処理
     */
    handleStorageFull() {
        console.warn('LocalStorageの容量が不足しています');
        
        // キャッシュのクリア
        this.remove(this.KEYS.BOOK_CACHE);
        
        // ユーザーに通知
        if (confirm('ストレージ容量が不足しています。古いキャッシュデータを削除しますか？')) {
            // さらに古いデータの削除などの処理
        }
    }
    
    /**
     * データの圧縮（Base64エンコーディング）
     * @param {Object} data - 圧縮するデータ
     * @returns {string} 圧縮されたデータ
     */
    compress(data) {
        try {
            const jsonString = JSON.stringify(data);
            return btoa(encodeURIComponent(jsonString));
        } catch (error) {
            console.error('データ圧縮エラー:', error);
            return null;
        }
    }
    
    /**
     * データの解凍
     * @param {string} compressed - 圧縮されたデータ
     * @returns {Object} 解凍されたデータ
     */
    decompress(compressed) {
        try {
            const jsonString = decodeURIComponent(atob(compressed));
            return JSON.parse(jsonString);
        } catch (error) {
            console.error('データ解凍エラー:', error);
            return null;
        }
    }
}