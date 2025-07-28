/**
 * progress-manager.js - 保護者向け進捗管理と分析機能
 * 
 * 子どもの読書進捗を詳細に追跡し、保護者が確認できる
 * ダッシュボードとレポート生成機能を提供します。
 */

class ProgressManager {
    constructor(storageManager, gameManager) {
        this.storageManager = storageManager;
        this.gameManager = gameManager;
        
        // 進捗データキャッシュ
        this.progressData = {
            dailyStats: {},
            weeklyStats: {},
            monthlyStats: {},
            bookProgress: {},
            vocabularyStats: {},
            achievements: []
        };
        
        // ダッシュボード要素のキャッシュ
        this.elements = {};
        
        // 初期化
        this.loadProgressData();
    }
    
    /**
     * 進捗データの読み込み
     */
    loadProgressData() {
        try {
            const savedProgress = this.storageManager.get('parentDashboardData');
            if (savedProgress) {
                this.progressData = { ...this.progressData, ...savedProgress };
            }
            
            // GameManagerから最新データを取得
            if (this.gameManager && this.gameManager.gameData) {
                this.mergeProgressData(this.gameManager.gameData);
            }
        } catch (error) {
            console.error('進捗データの読み込みエラー:', error);
        }
    }
    
    /**
     * 進捗データのマージ
     */
    mergeProgressData(currentData) {
        // 本の進捗情報を統合
        Object.keys(currentData).forEach(bookId => {
            if (!this.progressData.bookProgress[bookId]) {
                this.progressData.bookProgress[bookId] = {};
            }
            this.progressData.bookProgress[bookId] = {
                ...this.progressData.bookProgress[bookId],
                ...currentData[bookId]
            };
        });
        
        // 今日の統計を更新
        const today = new Date().toLocaleDateString('ja-JP');
        if (!this.progressData.dailyStats[today]) {
            this.progressData.dailyStats[today] = {
                readingTime: 0,
                wordsLearned: [],
                pagesRead: 0,
                chaptersCompleted: 0
            };
        }
    }
    
    /**
     * ダッシュボードUIの初期化
     */
    initializeDashboard(container) {
        if (!container) return;
        
        container.innerHTML = `
            <div class="parent-dashboard">
                <h2>保護者用ダッシュボード</h2>
                
                <div class="dashboard-tabs">
                    <button class="tab-button active" data-tab="overview">概要</button>
                    <button class="tab-button" data-tab="reading-time">読書時間</button>
                    <button class="tab-button" data-tab="vocabulary">学習語彙</button>
                    <button class="tab-button" data-tab="achievements">達成記録</button>
                    <button class="tab-button" data-tab="recommendations">推奨事項</button>
                </div>
                
                <div class="dashboard-content">
                    <div id="overview-panel" class="panel active">
                        ${this.renderOverviewPanel()}
                    </div>
                    
                    <div id="reading-time-panel" class="panel">
                        ${this.renderReadingTimePanel()}
                    </div>
                    
                    <div id="vocabulary-panel" class="panel">
                        ${this.renderVocabularyPanel()}
                    </div>
                    
                    <div id="achievements-panel" class="panel">
                        ${this.renderAchievementsPanel()}
                    </div>
                    
                    <div id="recommendations-panel" class="panel">
                        ${this.renderRecommendationsPanel()}
                    </div>
                </div>
                
                <div class="dashboard-actions">
                    <button id="export-report" class="action-button">
                        <i class="fas fa-download"></i> レポート出力
                    </button>
                    <button id="print-report" class="action-button">
                        <i class="fas fa-print"></i> 印刷
                    </button>
                    <button id="share-report" class="action-button">
                        <i class="fas fa-share"></i> 共有
                    </button>
                </div>
            </div>
        `;
        
        this.attachEventListeners(container);
    }
    
    /**
     * 概要パネルの描画
     */
    renderOverviewPanel() {
        const stats = this.calculateOverallStats();
        
        return `
            <div class="overview-stats">
                <div class="stat-card">
                    <h3>累計読書時間</h3>
                    <div class="stat-value">${this.formatTime(stats.totalReadingTime)}</div>
                    <div class="stat-trend">${this.getTrend(stats.readingTimeTrend)}</div>
                </div>
                
                <div class="stat-card">
                    <h3>完読作品数</h3>
                    <div class="stat-value">${stats.completedBooks}</div>
                    <div class="stat-subtitle">全${stats.totalBooks}作品中</div>
                </div>
                
                <div class="stat-card">
                    <h3>学習語彙数</h3>
                    <div class="stat-value">${stats.totalWordsLearned}</div>
                    <div class="stat-trend">${this.getTrend(stats.vocabularyTrend)}</div>
                </div>
                
                <div class="stat-card">
                    <h3>読書レベル</h3>
                    <div class="stat-value">${stats.currentLevel}</div>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${stats.levelProgress}%"></div>
                    </div>
                </div>
            </div>
            
            <div class="recent-activity">
                <h3>最近の活動</h3>
                <ul class="activity-list">
                    ${this.getRecentActivities().map(activity => `
                        <li class="activity-item">
                            <span class="activity-icon">${activity.icon}</span>
                            <span class="activity-text">${activity.text}</span>
                            <span class="activity-time">${activity.time}</span>
                        </li>
                    `).join('')}
                </ul>
            </div>
        `;
    }
    
    /**
     * 読書時間パネルの描画
     */
    renderReadingTimePanel() {
        const timeStats = this.calculateReadingTimeStats();
        
        return `
            <div class="time-stats-container">
                <div class="period-selector">
                    <button class="period-btn active" data-period="daily">日別</button>
                    <button class="period-btn" data-period="weekly">週別</button>
                    <button class="period-btn" data-period="monthly">月別</button>
                </div>
                
                <div class="time-chart-container">
                    <canvas id="reading-time-chart"></canvas>
                </div>
                
                <div class="time-summary">
                    <div class="summary-item">
                        <h4>今日の読書時間</h4>
                        <p>${this.formatTime(timeStats.today)}</p>
                    </div>
                    <div class="summary-item">
                        <h4>今週の読書時間</h4>
                        <p>${this.formatTime(timeStats.thisWeek)}</p>
                    </div>
                    <div class="summary-item">
                        <h4>今月の読書時間</h4>
                        <p>${this.formatTime(timeStats.thisMonth)}</p>
                    </div>
                    <div class="summary-item">
                        <h4>平均読書時間</h4>
                        <p>${this.formatTime(timeStats.dailyAverage)}/日</p>
                    </div>
                </div>
                
                <div class="reading-goals">
                    <h4>読書目標</h4>
                    <div class="goal-item">
                        <span>日次目標（30分）</span>
                        <div class="goal-progress">
                            <div class="goal-bar" style="width: ${timeStats.dailyGoalProgress}%"></div>
                        </div>
                        <span>${timeStats.dailyGoalProgress}%</span>
                    </div>
                    <div class="goal-item">
                        <span>週次目標（3時間）</span>
                        <div class="goal-progress">
                            <div class="goal-bar" style="width: ${timeStats.weeklyGoalProgress}%"></div>
                        </div>
                        <span>${timeStats.weeklyGoalProgress}%</span>
                    </div>
                </div>
            </div>
        `;
    }
    
    /**
     * 語彙学習パネルの描画
     */
    renderVocabularyPanel() {
        const vocabStats = this.calculateVocabularyStats();
        
        return `
            <div class="vocabulary-container">
                <div class="vocab-overview">
                    <div class="vocab-stat">
                        <h4>総学習語彙数</h4>
                        <p class="vocab-number">${vocabStats.totalWords}</p>
                    </div>
                    <div class="vocab-stat">
                        <h4>今週の新規語彙</h4>
                        <p class="vocab-number">${vocabStats.weeklyNew}</p>
                    </div>
                    <div class="vocab-stat">
                        <h4>定着率</h4>
                        <p class="vocab-number">${vocabStats.retentionRate}%</p>
                    </div>
                </div>
                
                <div class="vocab-level-distribution">
                    <h4>語彙レベル分布</h4>
                    <div class="level-bars">
                        <div class="level-bar-item">
                            <span class="level-label">初級</span>
                            <div class="level-bar">
                                <div class="level-fill beginner" style="width: ${vocabStats.beginnerPercent}%"></div>
                            </div>
                            <span class="level-count">${vocabStats.beginnerCount}</span>
                        </div>
                        <div class="level-bar-item">
                            <span class="level-label">中級</span>
                            <div class="level-bar">
                                <div class="level-fill intermediate" style="width: ${vocabStats.intermediatePercent}%"></div>
                            </div>
                            <span class="level-count">${vocabStats.intermediateCount}</span>
                        </div>
                        <div class="level-bar-item">
                            <span class="level-label">上級</span>
                            <div class="level-bar">
                                <div class="level-fill advanced" style="width: ${vocabStats.advancedPercent}%"></div>
                            </div>
                            <span class="level-count">${vocabStats.advancedCount}</span>
                        </div>
                    </div>
                </div>
                
                <div class="recent-words">
                    <h4>最近学習した語彙</h4>
                    <div class="word-list">
                        ${vocabStats.recentWords.map(word => `
                            <div class="word-item">
                                <span class="word-text">${word.text}</span>
                                <span class="word-reading">${word.reading}</span>
                                <span class="word-date">${word.date}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
                
                <div class="vocabulary-recommendations">
                    <h4>復習推奨語彙</h4>
                    <p>忘却曲線に基づいて、以下の語彙の復習をお勧めします：</p>
                    <div class="review-words">
                        ${vocabStats.reviewWords.map(word => `
                            <span class="review-word">${word}</span>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
    }
    
    /**
     * 達成記録パネルの描画
     */
    renderAchievementsPanel() {
        const achievements = this.getAchievements();
        
        return `
            <div class="achievements-container">
                <div class="achievement-stats">
                    <div class="achievement-stat">
                        <h4>獲得バッジ数</h4>
                        <p>${achievements.earned.length}</p>
                    </div>
                    <div class="achievement-stat">
                        <h4>獲得ポイント</h4>
                        <p>${achievements.totalPoints}</p>
                    </div>
                    <div class="achievement-stat">
                        <h4>達成率</h4>
                        <p>${achievements.completionRate}%</p>
                    </div>
                </div>
                
                <div class="achievement-list">
                    <h4>獲得済みバッジ</h4>
                    <div class="badges">
                        ${achievements.earned.map(badge => `
                            <div class="badge-item earned">
                                <div class="badge-icon">${badge.icon}</div>
                                <div class="badge-name">${badge.name}</div>
                                <div class="badge-date">${badge.date}</div>
                            </div>
                        `).join('')}
                    </div>
                </div>
                
                <div class="upcoming-achievements">
                    <h4>もうすぐ獲得できるバッジ</h4>
                    <div class="badges">
                        ${achievements.upcoming.map(badge => `
                            <div class="badge-item upcoming">
                                <div class="badge-icon">${badge.icon}</div>
                                <div class="badge-name">${badge.name}</div>
                                <div class="badge-progress">
                                    <div class="progress-bar">
                                        <div class="progress-fill" style="width: ${badge.progress}%"></div>
                                    </div>
                                    <span>${badge.progress}%</span>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
    }
    
    /**
     * 推奨事項パネルの描画
     */
    renderRecommendationsPanel() {
        const recommendations = this.generateRecommendations();
        
        return `
            <div class="recommendations-container">
                <div class="reading-analysis">
                    <h4>読書傾向分析</h4>
                    <div class="analysis-item">
                        <span class="analysis-label">好みのジャンル：</span>
                        <span class="analysis-value">${recommendations.favoriteGenre}</span>
                    </div>
                    <div class="analysis-item">
                        <span class="analysis-label">読書ペース：</span>
                        <span class="analysis-value">${recommendations.readingPace}</span>
                    </div>
                    <div class="analysis-item">
                        <span class="analysis-label">理解度レベル：</span>
                        <span class="analysis-value">${recommendations.comprehensionLevel}</span>
                    </div>
                    <div class="analysis-item">
                        <span class="analysis-label">集中時間帯：</span>
                        <span class="analysis-value">${recommendations.peakReadingTime}</span>
                    </div>
                </div>
                
                <div class="book-recommendations">
                    <h4>おすすめ作品</h4>
                    <p>お子様の読書レベルと興味に基づいた推奨作品：</p>
                    <div class="recommended-books">
                        ${recommendations.books.map(book => `
                            <div class="book-recommendation">
                                <h5>${book.title}</h5>
                                <p class="book-author">作者: ${book.author}</p>
                                <p class="book-reason">推奨理由: ${book.reason}</p>
                                <div class="book-difficulty">
                                    難易度: <span class="difficulty-${book.difficulty}">${this.getDifficultyLabel(book.difficulty)}</span>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
                
                <div class="habit-suggestions">
                    <h4>読書習慣の改善提案</h4>
                    <ul class="suggestion-list">
                        ${recommendations.habitSuggestions.map(suggestion => `
                            <li class="suggestion-item">
                                <i class="fas fa-lightbulb"></i>
                                ${suggestion}
                            </li>
                        `).join('')}
                    </ul>
                </div>
            </div>
        `;
    }
    
    /**
     * イベントリスナーの設定
     */
    attachEventListeners(container) {
        // タブ切り替え
        container.querySelectorAll('.tab-button').forEach(button => {
            button.addEventListener('click', (e) => {
                const tab = e.target.dataset.tab;
                this.switchTab(tab);
            });
        });
        
        // レポート出力
        container.querySelector('#export-report')?.addEventListener('click', () => {
            this.exportReport();
        });
        
        // 印刷
        container.querySelector('#print-report')?.addEventListener('click', () => {
            this.printReport();
        });
        
        // 共有
        container.querySelector('#share-report')?.addEventListener('click', () => {
            this.shareReport();
        });
        
        // 期間セレクター（読書時間パネル）
        container.querySelectorAll('.period-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const period = e.target.dataset.period;
                this.updateReadingTimeChart(period);
            });
        });
    }
    
    /**
     * タブ切り替え
     */
    switchTab(tabName) {
        // タブボタンのアクティブ状態を更新
        document.querySelectorAll('.tab-button').forEach(button => {
            button.classList.toggle('active', button.dataset.tab === tabName);
        });
        
        // パネルの表示切り替え
        document.querySelectorAll('.panel').forEach(panel => {
            panel.classList.remove('active');
        });
        
        const targetPanel = document.querySelector(`#${tabName}-panel`);
        if (targetPanel) {
            targetPanel.classList.add('active');
            
            // 特定のタブに対する追加処理
            if (tabName === 'reading-time') {
                this.initializeReadingTimeChart();
            }
        }
    }
    
    /**
     * 全体統計の計算
     */
    calculateOverallStats() {
        const progress = this.gameManager.getAllProgress();
        const books = Object.keys(progress);
        
        let totalReadingTime = 0;
        let completedBooks = 0;
        let totalWordsLearned = new Set();
        
        books.forEach(bookId => {
            const bookProgress = progress[bookId];
            totalReadingTime += bookProgress.readingTime || 0;
            if (bookProgress.completed) completedBooks++;
            if (bookProgress.wordsLearned) {
                bookProgress.wordsLearned.forEach(word => totalWordsLearned.add(word));
            }
        });
        
        // レベル計算（簡易版）
        const level = Math.floor(completedBooks / 5) + 1;
        const levelProgress = (completedBooks % 5) * 20;
        
        return {
            totalReadingTime,
            completedBooks,
            totalBooks: books.length,
            totalWordsLearned: totalWordsLearned.size,
            currentLevel: `レベル ${level}`,
            levelProgress,
            readingTimeTrend: this.calculateTrend('readingTime'),
            vocabularyTrend: this.calculateTrend('vocabulary')
        };
    }
    
    /**
     * 読書時間統計の計算
     */
    calculateReadingTimeStats() {
        const now = new Date();
        const today = now.toLocaleDateString('ja-JP');
        const todayStats = this.progressData.dailyStats[today] || { readingTime: 0 };
        
        // 週・月の集計
        let thisWeek = 0;
        let thisMonth = 0;
        let totalDays = 0;
        
        Object.entries(this.progressData.dailyStats).forEach(([date, stats]) => {
            const dateObj = new Date(date);
            const daysDiff = Math.floor((now - dateObj) / (1000 * 60 * 60 * 24));
            
            if (daysDiff < 7) thisWeek += stats.readingTime;
            if (daysDiff < 30) thisMonth += stats.readingTime;
            if (stats.readingTime > 0) totalDays++;
        });
        
        const dailyAverage = totalDays > 0 ? thisMonth / totalDays : 0;
        
        // 目標進捗（分単位）
        const dailyGoal = 30; // 30分
        const weeklyGoal = 180; // 3時間
        
        return {
            today: todayStats.readingTime,
            thisWeek,
            thisMonth,
            dailyAverage,
            dailyGoalProgress: Math.min(100, Math.round((todayStats.readingTime / dailyGoal) * 100)),
            weeklyGoalProgress: Math.min(100, Math.round((thisWeek / weeklyGoal) * 100))
        };
    }
    
    /**
     * 語彙統計の計算
     */
    calculateVocabularyStats() {
        const progress = this.gameManager.getAllProgress();
        const allWords = new Map();
        const recentWords = [];
        
        // 全語彙の収集
        Object.values(progress).forEach(bookProgress => {
            if (bookProgress.wordsLearned) {
                bookProgress.wordsLearned.forEach(word => {
                    if (!allWords.has(word)) {
                        allWords.set(word, {
                            text: word,
                            count: 0,
                            firstLearned: new Date(),
                            level: this.getWordLevel(word)
                        });
                    }
                    allWords.get(word).count++;
                });
            }
        });
        
        // レベル別集計
        let beginnerCount = 0;
        let intermediateCount = 0;
        let advancedCount = 0;
        
        allWords.forEach(word => {
            switch (word.level) {
                case 'beginner': beginnerCount++; break;
                case 'intermediate': intermediateCount++; break;
                case 'advanced': advancedCount++; break;
            }
        });
        
        const totalWords = allWords.size;
        
        // 最近の語彙（ダミーデータ）
        const dummyRecentWords = [
            { text: '邂逅', reading: 'かいこう', date: '2024/01/15' },
            { text: '憂鬱', reading: 'ゆううつ', date: '2024/01/14' },
            { text: '慈悲', reading: 'じひ', date: '2024/01/13' }
        ];
        
        return {
            totalWords,
            weeklyNew: Math.floor(totalWords * 0.1), // ダミー
            retentionRate: 85, // ダミー
            beginnerCount,
            beginnerPercent: totalWords > 0 ? (beginnerCount / totalWords) * 100 : 0,
            intermediateCount,
            intermediatePercent: totalWords > 0 ? (intermediateCount / totalWords) * 100 : 0,
            advancedCount,
            advancedPercent: totalWords > 0 ? (advancedCount / totalWords) * 100 : 0,
            recentWords: dummyRecentWords,
            reviewWords: ['邂逅', '憂鬱', '朦朧', '逡巡'] // ダミー
        };
    }
    
    /**
     * アチーブメント情報の取得
     */
    getAchievements() {
        const earned = this.gameManager.achievements || [];
        
        // ダミーデータ
        const dummyEarned = [
            { icon: '🏆', name: '初めての完読', date: '2024/01/10' },
            { icon: '📚', name: '5作品読破', date: '2024/01/12' },
            { icon: '🔥', name: '連続7日読書', date: '2024/01/14' }
        ];
        
        const dummyUpcoming = [
            { icon: '🌟', name: '10作品読破', progress: 70 },
            { icon: '📖', name: '100語彙マスター', progress: 85 },
            { icon: '⏱️', name: '累計10時間読書', progress: 60 }
        ];
        
        return {
            earned: dummyEarned,
            upcoming: dummyUpcoming,
            totalPoints: 1250,
            completionRate: 45
        };
    }
    
    /**
     * 推奨事項の生成
     */
    generateRecommendations() {
        // 分析結果（ダミー）
        return {
            favoriteGenre: '冒険・ファンタジー',
            readingPace: '標準的（1日30分）',
            comprehensionLevel: '年齢相応',
            peakReadingTime: '夕方（16:00-18:00）',
            books: [
                {
                    title: '銀河鉄道の夜',
                    author: '宮沢賢治',
                    difficulty: 'intermediate',
                    reason: '想像力を刺激するファンタジー要素'
                },
                {
                    title: '注文の多い料理店',
                    author: '宮沢賢治',
                    difficulty: 'beginner',
                    reason: '短編で読みやすく、ユーモアがある'
                }
            ],
            habitSuggestions: [
                '夕方の読書時間を15分延長してみましょう',
                '週末に親子で一緒に読書する時間を作ってみてください',
                '読んだ本の感想を日記に書く習慣をつけると理解が深まります'
            ]
        };
    }
    
    /**
     * 最近の活動を取得
     */
    getRecentActivities() {
        // ダミーデータ
        return [
            { icon: '📖', text: '「走れメロス」を読み始めました', time: '2時間前' },
            { icon: '✨', text: '新しい語彙「邂逅」を学習しました', time: '3時間前' },
            { icon: '🏆', text: '「桃太郎」を完読しました', time: '昨日' },
            { icon: '📚', text: '連続読書3日を達成しました', time: '2日前' }
        ];
    }
    
    /**
     * レポートのエクスポート
     */
    async exportReport() {
        const reportData = {
            generatedDate: new Date().toLocaleString('ja-JP'),
            overallStats: this.calculateOverallStats(),
            readingTimeStats: this.calculateReadingTimeStats(),
            vocabularyStats: this.calculateVocabularyStats(),
            achievements: this.getAchievements(),
            recommendations: this.generateRecommendations()
        };
        
        // PDF生成（実装には別途ライブラリが必要）
        const pdfContent = this.generatePDFContent(reportData);
        
        // ダウンロード処理
        const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `読書進捗レポート_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        alert('レポートをダウンロードしました');
    }
    
    /**
     * レポートの印刷
     */
    printReport() {
        window.print();
    }
    
    /**
     * レポートの共有
     */
    async shareReport() {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: '読書進捗レポート',
                    text: 'お子様の読書進捗をご確認ください',
                    url: window.location.href
                });
            } catch (error) {
                console.error('共有エラー:', error);
            }
        } else {
            // 共有APIが使えない場合
            alert('このブラウザでは共有機能が利用できません');
        }
    }
    
    /**
     * ユーティリティ関数
     */
    formatTime(minutes) {
        if (minutes < 60) {
            return `${minutes}分`;
        }
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return mins > 0 ? `${hours}時間${mins}分` : `${hours}時間`;
    }
    
    getTrend(type) {
        // トレンド計算（ダミー）
        const trends = ['↑ 上昇中', '→ 横ばい', '↓ 低下中'];
        return trends[Math.floor(Math.random() * trends.length)];
    }
    
    getWordLevel(word) {
        // 語彙レベル判定（簡易版）
        const length = word.length;
        if (length <= 2) return 'beginner';
        if (length <= 4) return 'intermediate';
        return 'advanced';
    }
    
    getDifficultyLabel(difficulty) {
        const labels = {
            beginner: '初級',
            intermediate: '中級',
            advanced: '上級'
        };
        return labels[difficulty] || difficulty;
    }
    
    calculateTrend(dataType) {
        // トレンド計算（ダミー実装）
        return '↑ 上昇中';
    }
    
    /**
     * PDF生成用コンテンツ（ダミー）
     */
    generatePDFContent(data) {
        // 実際のPDF生成にはjsPDFなどのライブラリが必要
        return `読書進捗レポート\n生成日時: ${data.generatedDate}\n...`;
    }
    
    /**
     * 読書時間チャートの初期化
     */
    initializeReadingTimeChart() {
        // Chart.jsなどを使用してグラフを描画
        // この実装にはChart.jsの読み込みが必要
    }
    
    /**
     * 読書時間チャートの更新
     */
    updateReadingTimeChart(period) {
        // 期間に応じてチャートを更新
    }
}
// グローバルに公開
if (typeof window !== 'undefined') {
    window.ProgressManager = ProgressManager;
}
