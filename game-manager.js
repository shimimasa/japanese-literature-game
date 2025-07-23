/**
 * game-manager.js - ゲーム要素管理
 * 
 * 読書進捗の追跡、ポイントシステム、アチーブメント管理、
 * 完読証明書の生成などのゲーム要素を管理します。
 */

import { CertificateGenerator } from './certificate-generator.js';

export class GameManager {
    constructor(storageManager) {
        this.storageManager = storageManager;
        
        // 現在の読書セッション
        this.currentSession = null;
        
        // ゲームデータ
        this.gameData = this.loadGameData();
        
        // アチーブメント定義
        this.achievementDefinitions = this.defineAchievements();
        
        // イベントハンドラー
        this.onAchievementUnlocked = null;
        this.onPointsAwarded = null;
        this.onProgressUpdate = null;
    }
    
    /**
     * ゲームデータの読み込み
     * @returns {Object} ゲームデータ
     */
    loadGameData() {
        const defaultData = {
            totalPoints: 0,
            totalReadingTime: 0,
            todayReadingTime: 0,
            lastReadDate: new Date().toDateString(),
            consecutiveDays: 0,
            completedBooks: [],
            bookProgress: {},
            learnedWords: [],
            achievements: []
        };
        
        const saved = this.storageManager.loadProgress();
        return { ...defaultData, ...saved };
    }
    
    /**
     * ゲームデータの保存
     */
    saveGameData() {
        this.storageManager.saveProgress(this.gameData);
    }
    
    /**
     * アチーブメントの定義
     * @returns {Array} アチーブメント定義の配列
     */
    defineAchievements() {
        return [
            {
                id: 'first_book_started',
                name: '読書の第一歩',
                description: '初めて作品を開きました',
                icon: '📖',
                condition: (data) => Object.keys(data.bookProgress).length >= 1
            },
            {
                id: 'first_book_completed',
                name: '初めての完読',
                description: '最初の作品を完読しました',
                icon: '🎉',
                condition: (data) => data.completedBooks.length >= 1
            },
            {
                id: 'bookworm',
                name: '本の虫',
                description: '5作品を完読しました',
                icon: '📚',
                condition: (data) => data.completedBooks.length >= 5
            },
            {
                id: 'vocabulary_10',
                name: '語彙マスター初級',
                description: '10個の語句を学習しました',
                icon: '📝',
                condition: (data) => data.learnedWords.length >= 10
            },
            {
                id: 'vocabulary_50',
                name: '語彙マスター中級',
                description: '50個の語句を学習しました',
                icon: '📜',
                condition: (data) => data.learnedWords.length >= 50
            },
            {
                id: 'vocabulary_100',
                name: '語彙マスター上級',
                description: '100個の語句を学習しました',
                icon: '🎓',
                condition: (data) => data.learnedWords.length >= 100
            },
            {
                id: 'reading_streak_7',
                name: '読書習慣',
                description: '7日連続で読書しました',
                icon: '🔥',
                condition: (data) => data.consecutiveDays >= 7
            },
            {
                id: 'reading_streak_30',
                name: '読書の達人',
                description: '30日連続で読書しました',
                icon: '💎',
                condition: (data) => data.consecutiveDays >= 30
            },
            {
                id: 'speed_reader',
                name: 'スピードリーダー',
                description: '1時間で1作品を完読しました',
                icon: '⚡',
                condition: null // 特殊条件
            },
            {
                id: 'night_owl',
                name: '夜の読書家',
                description: '夜10時以降に読書しました',
                icon: '🦉',
                condition: null // 特殊条件
            }
        ];
    }
    
    /**
     * 読書セッションの開始
     * @param {string} bookId - 作品ID
     */
    startReadingSession(bookId) {
        // 日付の更新チェック
        this.updateDailyStats();
        
        this.currentSession = {
            bookId: bookId,
            startTime: Date.now(),
            startPage: this.gameData.bookProgress[bookId]?.currentPage || 0,
            wordsLearned: []
        };
        
        // 初めての作品の場合は進捗を初期化
        if (!this.gameData.bookProgress[bookId]) {
            this.gameData.bookProgress[bookId] = {
                currentPage: 0,
                totalPages: 0,
                currentChapter: 0,
                completedChapters: [],
                readingTime: 0,
                wordsLearned: [],
                points: 0,
                completed: false,
                completedDate: null,
                startedDate: new Date().toISOString()
            };
            
            // アチーブメントチェック
            this.checkAchievements();
        }
        
        // 時間帯によるアチーブメントチェック
        const hour = new Date().getHours();
        if (hour >= 22 && !this.hasAchievement('night_owl')) {
            this.unlockAchievement('night_owl');
        }
    }
    
    /**
     * 読書セッションの終了
     */
    endReadingSession() {
        if (!this.currentSession) return;
        
        const sessionTime = Math.floor((Date.now() - this.currentSession.startTime) / 1000); // 秒単位
        const bookId = this.currentSession.bookId;
        const progress = this.gameData.bookProgress[bookId];
        
        // 読書時間の更新
        progress.readingTime += sessionTime;
        this.gameData.totalReadingTime += sessionTime;
        this.gameData.todayReadingTime += sessionTime;
        
        // スピードリーダーアチーブメントのチェック
        if (progress.completed && progress.readingTime <= 3600 && !this.hasAchievement('speed_reader')) {
            this.unlockAchievement('speed_reader');
        }
        
        this.currentSession = null;
        this.saveGameData();
    }
    
    /**
     * 日次統計の更新
     */
    updateDailyStats() {
        const today = new Date().toDateString();
        
        if (this.gameData.lastReadDate !== today) {
            // 前日との差をチェック
            const lastDate = new Date(this.gameData.lastReadDate);
            const todayDate = new Date(today);
            const daysDiff = Math.floor((todayDate - lastDate) / (1000 * 60 * 60 * 24));
            
            if (daysDiff === 1) {
                // 連続日数を増加
                this.gameData.consecutiveDays++;
            } else {
                // 連続が途切れた
                this.gameData.consecutiveDays = 1;
            }
            
            // 今日の読書時間をリセット
            this.gameData.todayReadingTime = 0;
            this.gameData.lastReadDate = today;
            
            this.saveGameData();
        }
    }
    
    /**
     * 読書進捗の追跡
     * @param {string} bookId - 作品ID
     * @param {number} currentPage - 現在のページ
     * @param {number} totalPages - 総ページ数
     * @param {Object} bookInfo - 作品情報（オプション）
     */
    trackReadingProgress(bookId, currentPage, totalPages, bookInfo = {}) {
        if (!this.gameData.bookProgress[bookId]) return;
        
        const progress = this.gameData.bookProgress[bookId];
        progress.currentPage = currentPage;
        progress.totalPages = totalPages;
        
        // 完読チェック
        if (currentPage === totalPages - 1 && !progress.completed) {
            this.completeBook(bookId, bookInfo);
        }
        
        // 進捗イベントの発火
        if (this.onProgressUpdate) {
            this.onProgressUpdate(bookId, (currentPage + 1) / totalPages * 100);
        }
        
        this.saveGameData();
    }
    
    /**
     * 作品の完読処理
     * @param {string} bookId - 作品ID
     * @param {Object} bookInfo - 作品情報（タイトル、作者）
     */
    completeBook(bookId, bookInfo = {}) {
        const progress = this.gameData.bookProgress[bookId];
        progress.completed = true;
        progress.completedDate = new Date().toISOString();
        
        // 作品情報を保存
        if (bookInfo.title || bookInfo.author) {
            progress.bookInfo = {
                title: bookInfo.title || bookId,
                author: bookInfo.author || '不明'
            };
        }
        
        // 完読リストに追加
        if (!this.gameData.completedBooks.includes(bookId)) {
            this.gameData.completedBooks.push(bookId);
        }
        
        // 完読ボーナスポイント
        const bonusPoints = 100;
        this.awardPoints('book_complete', bonusPoints, `作品完読ボーナス`);
        
        // アチーブメントチェック
        this.checkAchievements();
        
        // 完読証明書の表示
        this.showCompletionCertificate(bookId);
    }
    
    /**
     * ポイントの付与
     * @param {string} action - アクション種別
     * @param {number} amount - ポイント数
     * @param {string} description - 説明
     */
    awardPoints(action, amount, description) {
        this.gameData.totalPoints += amount;
        
        if (this.currentSession) {
            const progress = this.gameData.bookProgress[this.currentSession.bookId];
            if (progress) {
                progress.points += amount;
            }
        }
        
        // ポイント付与イベントの発火
        if (this.onPointsAwarded) {
            this.onPointsAwarded(amount, description);
        }
        
        this.saveGameData();
        this.showPointNotification(amount, description);
    }
    
    /**
     * ポイント獲得通知の表示
     * @param {number} points - ポイント数
     * @param {string} description - 説明
     */
    showPointNotification(points, description) {
        const notification = document.createElement('div');
        notification.className = 'point-notification';
        notification.innerHTML = `
            <div class="point-icon">✨</div>
            <div class="point-text">
                <strong>+${points}ポイント</strong>
                <span>${description}</span>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // アニメーション
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);
        
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
    
    /**
     * 語句学習の記録
     * @param {string} word - 学習した語句
     * @param {number} points - 獲得ポイント
     */
    recordWordLearned(word, points) {
        if (!this.gameData.learnedWords.includes(word)) {
            this.gameData.learnedWords.push(word);
        }
        
        if (this.currentSession) {
            this.currentSession.wordsLearned.push(word);
            const progress = this.gameData.bookProgress[this.currentSession.bookId];
            if (progress && !progress.wordsLearned.includes(word)) {
                progress.wordsLearned.push(word);
            }
        }
        
        this.awardPoints('word_learned', points, `「${word}」を学習`);
        this.checkAchievements();
    }
    
    /**
     * アチーブメントのチェック
     */
    checkAchievements() {
        this.achievementDefinitions.forEach(achievement => {
            if (!this.hasAchievement(achievement.id) && achievement.condition) {
                if (achievement.condition(this.gameData)) {
                    this.unlockAchievement(achievement.id);
                }
            }
        });
    }
    
    /**
     * アチーブメントの解除
     * @param {string} achievementId - アチーブメントID
     */
    unlockAchievement(achievementId) {
        const achievement = this.achievementDefinitions.find(a => a.id === achievementId);
        if (!achievement) return;
        
        this.gameData.achievements.push({
            id: achievementId,
            name: achievement.name,
            description: achievement.description,
            icon: achievement.icon,
            date: new Date().toISOString()
        });
        
        // アチーブメント解除ボーナス
        this.awardPoints('achievement', 50, `アチーブメント「${achievement.name}」達成`);
        
        // 通知の表示
        this.showAchievementNotification(achievement);
        
        // イベントの発火
        if (this.onAchievementUnlocked) {
            this.onAchievementUnlocked(achievement);
        }
        
        this.saveGameData();
    }
    
    /**
     * アチーブメント通知の表示
     * @param {Object} achievement - アチーブメントデータ
     */
    showAchievementNotification(achievement) {
        const notification = document.getElementById('achievement-notification');
        const nameElement = notification.querySelector('.achievement-name');
        
        nameElement.textContent = `${achievement.icon} ${achievement.name}`;
        
        notification.classList.remove('hidden');
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);
        
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                notification.classList.add('hidden');
            }, 300);
        }, 4000);
    }
    
    /**
     * アチーブメントを持っているかチェック
     * @param {string} achievementId - アチーブメントID
     * @returns {boolean} 持っているかどうか
     */
    hasAchievement(achievementId) {
        return this.gameData.achievements.some(a => a.id === achievementId);
    }
    
    /**
     * 完読証明書の表示
     * @param {string} bookId - 作品ID
     */
    showCompletionCertificate(bookId) {
        const progress = this.gameData.bookProgress[bookId];
        
        // 作品情報を取得
        const bookInfo = {
            title: progress.bookInfo?.title || bookId,
            author: progress.bookInfo?.author || '不明',
            completedDate: progress.completedDate,
            readingTime: progress.readingTime,
            wordsLearned: progress.wordsLearned.length,
            points: progress.points
        };
        
        // 証明書生成器のインスタンスを作成
        const generator = new CertificateGenerator();
        const canvas = generator.generateCertificate(bookInfo);
        
        // モーダルを作成
        const modal = document.createElement('div');
        modal.className = 'completion-certificate';
        modal.innerHTML = `
            <div class="certificate-modal-content">
                <div class="certificate-canvas-container"></div>
                <div class="certificate-actions">
                    <button class="btn-download-png">PNG保存</button>
                    <button class="btn-download-pdf">PDF保存</button>
                    <button class="btn-print">印刷</button>
                    <button class="btn-close">閉じる</button>
                </div>
            </div>
        `;
        
        // Canvasを追加
        const container = modal.querySelector('.certificate-canvas-container');
        container.appendChild(canvas);
        
        document.body.appendChild(modal);
        
        // イベントリスナーの設定
        modal.querySelector('.btn-download-png').addEventListener('click', () => {
            generator.saveAsPNG(`完読証明書_${bookInfo.title}.png`);
        });
        
        modal.querySelector('.btn-download-pdf').addEventListener('click', () => {
            generator.saveAsPDF(`完読証明書_${bookInfo.title}.pdf`);
        });
        
        modal.querySelector('.btn-print').addEventListener('click', () => {
            generator.print();
        });
        
        modal.querySelector('.btn-close').addEventListener('click', () => {
            modal.remove();
        });
        
        // モーダル外クリックで閉じる
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }
    
    /**
     * 作品の進捗を取得
     * @param {string} bookId - 作品ID
     * @returns {Object} 進捗データ
     */
    getBookProgress(bookId) {
        const progress = this.gameData.bookProgress[bookId];
        if (!progress) return null;
        
        return {
            ...progress,
            percent: progress.totalPages > 0 
                ? ((progress.currentPage + 1) / progress.totalPages) * 100 
                : 0
        };
    }
    
    /**
     * 統計情報を取得
     * @returns {Object} 統計データ
     */
    getStatistics() {
        return {
            totalPoints: this.gameData.totalPoints,
            totalReadingTime: this.gameData.totalReadingTime,
            todayReadingTime: this.gameData.todayReadingTime,
            completedBooks: this.gameData.completedBooks.length,
            learnedWords: this.gameData.learnedWords.length,
            consecutiveDays: this.gameData.consecutiveDays,
            achievements: this.gameData.achievements
        };
    }
    
    /**
     * 全進捗のリセット
     */
    resetAllProgress() {
        this.gameData = {
            totalPoints: 0,
            totalReadingTime: 0,
            todayReadingTime: 0,
            lastReadDate: new Date().toDateString(),
            consecutiveDays: 0,
            completedBooks: [],
            bookProgress: {},
            learnedWords: [],
            achievements: []
        };
        
        this.saveGameData();
    }
}