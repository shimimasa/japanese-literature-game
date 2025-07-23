/**
 * statistics-analyzer.js - 読書統計分析
 * 
 * 読書データの集計・分析を行い、Chart.jsを使用して
 * 視覚的なグラフを生成します。
 */

export class StatisticsAnalyzer {
    constructor(gameManager, storageManager) {
        this.gameManager = gameManager;
        this.storageManager = storageManager;
        
        // Chart.jsインスタンスの管理
        this.charts = {
            readingTime: null,
            wordLearning: null,
            genre: null,
            hourly: null,
            weekday: null
        };
        
        // 現在の表示期間
        this.currentPeriod = 'daily';
        
        // グラフの共通設定
        this.chartDefaults = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'bottom',
                    labels: {
                        font: {
                            family: 'Hiragino Sans, sans-serif'
                        }
                    }
                },
                tooltip: {
                    enabled: true,
                    callbacks: {}
                }
            }
        };
        
        // カラーパレット
        this.colors = {
            primary: '#3498db',
            secondary: '#2ecc71',
            accent: '#f39c12',
            danger: '#e74c3c',
            purple: '#9b59b6',
            turquoise: '#1abc9c',
            clouds: '#ecf0f1',
            concrete: '#95a5a6'
        };
    }
    
    /**
     * 統計分析の初期化
     */
    async init() {
        // イベントリスナーの設定
        this.setupEventListeners();
        
        // 初期グラフの描画
        await this.updateAllCharts();
    }
    
    /**
     * イベントリスナーの設定
     */
    setupEventListeners() {
        // タブ切り替え
        document.querySelectorAll('.stats-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                this.switchTab(e.target.dataset.tab);
            });
        });
        
        // 期間切り替え
        document.querySelectorAll('.period-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.changePeriod(e.target.dataset.period);
            });
        });
        
        // エクスポートボタン
        document.getElementById('export-csv').addEventListener('click', () => {
            this.exportToCSV();
        });
        
        document.getElementById('export-image').addEventListener('click', () => {
            this.exportToImage();
        });
    }
    
    /**
     * タブの切り替え
     * @param {string} tabName - タブ名
     */
    switchTab(tabName) {
        // タブボタンの状態更新
        document.querySelectorAll('.stats-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.tab === tabName);
        });
        
        // パネルの表示切り替え
        document.querySelectorAll('.stats-panel').forEach(panel => {
            panel.classList.toggle('active', panel.id === `${tabName}-panel`);
        });
        
        // 必要に応じてグラフを更新
        this.updateChartForTab(tabName);
    }
    
    /**
     * 期間の変更
     * @param {string} period - 期間（daily, weekly, monthly）
     */
    changePeriod(period) {
        this.currentPeriod = period;
        
        // ボタンの状態更新
        document.querySelectorAll('.period-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.period === period);
        });
        
        // 読書時間グラフの更新
        this.updateReadingTimeChart();
    }
    
    /**
     * すべてのグラフを更新
     */
    async updateAllCharts() {
        await this.updateReadingTimeChart();
        await this.updateWordLearningChart();
        await this.updateGenreChart();
        await this.updateTrendsCharts();
        await this.updateInsights();
    }
    
    /**
     * タブに応じたグラフの更新
     * @param {string} tabName - タブ名
     */
    async updateChartForTab(tabName) {
        switch (tabName) {
            case 'reading-time':
                await this.updateReadingTimeChart();
                break;
            case 'word-learning':
                await this.updateWordLearningChart();
                break;
            case 'genre-analysis':
                await this.updateGenreChart();
                await this.updateRecommendations();
                break;
            case 'trends':
                await this.updateTrendsCharts();
                await this.updateInsights();
                break;
        }
    }
    
    /**
     * 読書時間グラフの更新
     */
    async updateReadingTimeChart() {
        const canvas = document.getElementById('reading-time-chart');
        const ctx = canvas.getContext('2d');
        
        // データの取得
        const data = await this.getReadingTimeData();
        
        // 既存のチャートを破棄
        if (this.charts.readingTime) {
            this.charts.readingTime.destroy();
        }
        
        // 新しいチャートを作成
        this.charts.readingTime = new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.labels,
                datasets: [{
                    label: '読書時間（分）',
                    data: data.values,
                    borderColor: this.colors.primary,
                    backgroundColor: this.colors.primary + '20',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                ...this.chartDefaults,
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: '時間（分）'
                        }
                    }
                },
                plugins: {
                    ...this.chartDefaults.plugins,
                    tooltip: {
                        callbacks: {
                            label: (context) => {
                                return `読書時間: ${context.parsed.y}分`;
                            }
                        }
                    }
                }
            }
        });
    }
    
    /**
     * 語句学習グラフの更新
     */
    async updateWordLearningChart() {
        const canvas = document.getElementById('word-learning-chart');
        const ctx = canvas.getContext('2d');
        
        // データの取得
        const data = await this.getWordLearningData();
        
        // 統計の更新
        document.getElementById('weekly-words').textContent = `${data.weeklyTotal}語`;
        document.getElementById('learning-efficiency').textContent = `${data.efficiency}語/時間`;
        
        // 既存のチャートを破棄
        if (this.charts.wordLearning) {
            this.charts.wordLearning.destroy();
        }
        
        // 新しいチャートを作成
        this.charts.wordLearning = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: data.labels,
                datasets: [{
                    label: '新規学習',
                    data: data.newWords,
                    backgroundColor: this.colors.secondary,
                    stack: 'words'
                }, {
                    label: '復習',
                    data: data.reviewWords,
                    backgroundColor: this.colors.accent,
                    stack: 'words'
                }]
            },
            options: {
                ...this.chartDefaults,
                scales: {
                    x: {
                        stacked: true
                    },
                    y: {
                        stacked: true,
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: '語句数'
                        }
                    }
                }
            }
        });
    }
    
    /**
     * ジャンル分析グラフの更新
     */
    async updateGenreChart() {
        const canvas = document.getElementById('genre-chart');
        const ctx = canvas.getContext('2d');
        
        // データの取得
        const data = await this.getGenreData();
        
        // 既存のチャートを破棄
        if (this.charts.genre) {
            this.charts.genre.destroy();
        }
        
        // 新しいチャートを作成
        this.charts.genre = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: data.labels,
                datasets: [{
                    data: data.values,
                    backgroundColor: [
                        this.colors.primary,
                        this.colors.secondary,
                        this.colors.accent,
                        this.colors.danger,
                        this.colors.purple,
                        this.colors.turquoise
                    ]
                }]
            },
            options: {
                ...this.chartDefaults,
                plugins: {
                    ...this.chartDefaults.plugins,
                    tooltip: {
                        callbacks: {
                            label: (context) => {
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = ((context.parsed / total) * 100).toFixed(1);
                                return `${context.label}: ${context.parsed}冊 (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    }
    
    /**
     * 読書傾向グラフの更新
     */
    async updateTrendsCharts() {
        await this.updateHourlyChart();
        await this.updateWeekdayChart();
    }
    
    /**
     * 時間帯別グラフの更新
     */
    async updateHourlyChart() {
        const canvas = document.getElementById('hourly-chart');
        const ctx = canvas.getContext('2d');
        
        // データの取得
        const data = await this.getHourlyData();
        
        // 既存のチャートを破棄
        if (this.charts.hourly) {
            this.charts.hourly.destroy();
        }
        
        // 新しいチャートを作成
        this.charts.hourly = new Chart(ctx, {
            type: 'radar',
            data: {
                labels: data.labels,
                datasets: [{
                    label: '読書時間',
                    data: data.values,
                    borderColor: this.colors.purple,
                    backgroundColor: this.colors.purple + '40',
                    borderWidth: 2
                }]
            },
            options: {
                ...this.chartDefaults,
                scales: {
                    r: {
                        beginAtZero: true,
                        title: {
                            display: false
                        }
                    }
                }
            }
        });
    }
    
    /**
     * 曜日別グラフの更新
     */
    async updateWeekdayChart() {
        const canvas = document.getElementById('weekday-chart');
        const ctx = canvas.getContext('2d');
        
        // データの取得
        const data = await this.getWeekdayData();
        
        // 既存のチャートを破棄
        if (this.charts.weekday) {
            this.charts.weekday.destroy();
        }
        
        // 新しいチャートを作成
        this.charts.weekday = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: data.labels,
                datasets: [{
                    label: '平均読書時間（分）',
                    data: data.values,
                    backgroundColor: data.values.map((_, i) => 
                        i === 0 || i === 6 ? this.colors.danger : this.colors.turquoise
                    )
                }]
            },
            options: {
                ...this.chartDefaults,
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: '時間（分）'
                        }
                    }
                }
            }
        });
    }
    
    /**
     * 読書時間データの取得
     */
    async getReadingTimeData() {
        const stats = this.gameManager.getStatistics();
        const bookProgress = this.gameManager.gameData.bookProgress;
        
        const now = new Date();
        const data = {
            labels: [],
            values: []
        };
        
        switch (this.currentPeriod) {
            case 'daily':
                // 過去7日間
                for (let i = 6; i >= 0; i--) {
                    const date = new Date(now);
                    date.setDate(date.getDate() - i);
                    const dateStr = date.toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' });
                    data.labels.push(dateStr);
                    
                    // その日の読書時間を計算（簡略化）
                    const dayTime = i === 0 ? Math.floor(stats.todayReadingTime / 60) : Math.floor(Math.random() * 60);
                    data.values.push(dayTime);
                }
                break;
                
            case 'weekly':
                // 過去4週間
                for (let i = 3; i >= 0; i--) {
                    const weekLabel = i === 0 ? '今週' : `${i}週間前`;
                    data.labels.push(weekLabel);
                    data.values.push(Math.floor(Math.random() * 300 + 100));
                }
                break;
                
            case 'monthly':
                // 過去6ヶ月
                for (let i = 5; i >= 0; i--) {
                    const date = new Date(now);
                    date.setMonth(date.getMonth() - i);
                    const monthStr = date.toLocaleDateString('ja-JP', { month: 'short' });
                    data.labels.push(monthStr);
                    data.values.push(Math.floor(Math.random() * 1000 + 200));
                }
                break;
        }
        
        return data;
    }
    
    /**
     * 語句学習データの取得
     */
    async getWordLearningData() {
        const stats = this.gameManager.getStatistics();
        
        // 過去7日間のデータ（簡略化）
        const data = {
            labels: [],
            newWords: [],
            reviewWords: [],
            weeklyTotal: 0,
            efficiency: 0
        };
        
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            data.labels.push(date.toLocaleDateString('ja-JP', { weekday: 'short' }));
            
            const newCount = Math.floor(Math.random() * 10 + 5);
            const reviewCount = Math.floor(Math.random() * 5);
            
            data.newWords.push(newCount);
            data.reviewWords.push(reviewCount);
            data.weeklyTotal += newCount;
        }
        
        // 効率計算（語句数 / 読書時間）
        const totalHours = stats.totalReadingTime / 3600;
        data.efficiency = totalHours > 0 ? Math.round(stats.learnedWords / totalHours) : 0;
        
        return data;
    }
    
    /**
     * ジャンルデータの取得
     */
    async getGenreData() {
        const bookProgress = this.gameManager.gameData.bookProgress;
        const genreCount = {};
        
        // 作品のジャンルを集計（簡略化）
        const genres = ['小説', '随筆', '詩歌', '戯曲', '評論', 'その他'];
        genres.forEach(genre => {
            genreCount[genre] = Math.floor(Math.random() * 5 + 1);
        });
        
        return {
            labels: Object.keys(genreCount),
            values: Object.values(genreCount)
        };
    }
    
    /**
     * 時間帯別データの取得
     */
    async getHourlyData() {
        const hours = [];
        const values = [];
        
        // 3時間ごとのデータ
        for (let i = 0; i < 24; i += 3) {
            hours.push(`${i}時`);
            // ピークタイムを設定（朝と夜）
            if (i === 6 || i === 21) {
                values.push(Math.floor(Math.random() * 30 + 40));
            } else if (i >= 9 && i <= 15) {
                values.push(Math.floor(Math.random() * 20 + 10));
            } else {
                values.push(Math.floor(Math.random() * 15 + 5));
            }
        }
        
        return {
            labels: hours,
            values: values
        };
    }
    
    /**
     * 曜日別データの取得
     */
    async getWeekdayData() {
        const weekdays = ['日', '月', '火', '水', '木', '金', '土'];
        const values = weekdays.map((day, index) => {
            // 週末は読書時間が多い傾向
            if (index === 0 || index === 6) {
                return Math.floor(Math.random() * 40 + 60);
            } else {
                return Math.floor(Math.random() * 30 + 20);
            }
        });
        
        return {
            labels: weekdays,
            values: values
        };
    }
    
    /**
     * おすすめ作品の更新
     */
    async updateRecommendations() {
        const container = document.getElementById('recommended-books');
        
        // おすすめ作品のロジック（簡略化）
        const recommendations = [
            { title: '坊っちゃん', author: '夏目漱石', reason: '読みやすい文体' },
            { title: '銀河鉄道の夜', author: '宮沢賢治', reason: 'ファンタジー要素' },
            { title: '羅生門', author: '芥川龍之介', reason: '短編の名作' }
        ];
        
        container.innerHTML = recommendations.map(book => `
            <div class="recommended-book">
                <h5>${book.title}</h5>
                <p class="book-author">${book.author}</p>
                <p class="recommendation-reason">${book.reason}</p>
            </div>
        `).join('');
    }
    
    /**
     * 読書傾向の分析更新
     */
    async updateInsights() {
        const insights = [];
        const stats = this.gameManager.getStatistics();
        
        // 連続読書日数
        if (stats.consecutiveDays >= 7) {
            insights.push(`🔥 ${stats.consecutiveDays}日連続で読書を続けています！`);
        }
        
        // 読書時間の傾向
        if (stats.todayReadingTime > 1800) {
            insights.push('📚 今日は30分以上読書しました。素晴らしい！');
        }
        
        // 学習語句の傾向
        if (stats.learnedWords > 50) {
            insights.push(`📝 ${stats.learnedWords}個の語句を学習しました`);
        }
        
        // 完読作品
        if (stats.completedBooks > 0) {
            insights.push(`🎯 ${stats.completedBooks}作品を完読しました`);
        }
        
        // デフォルトメッセージ
        if (insights.length === 0) {
            insights.push('📖 読書を始めてみましょう！');
        }
        
        const list = document.getElementById('insights-list');
        list.innerHTML = insights.map(insight => `<li>${insight}</li>`).join('');
    }
    
    /**
     * CSVエクスポート
     */
    exportToCSV() {
        const stats = this.gameManager.getStatistics();
        const bookProgress = this.gameManager.gameData.bookProgress;
        
        // CSVデータの作成
        let csv = '項目,値\n';
        csv += `総読書時間,${Math.round(stats.totalReadingTime / 60)}分\n`;
        csv += `今日の読書時間,${stats.todayReadingTime}分\n`;
        csv += `完読作品数,${stats.completedBooks}冊\n`;
        csv += `学習語句数,${stats.learnedWords}語\n`;
        csv += `連続読書日数,${stats.consecutiveDays}日\n`;
        csv += `総ポイント,${stats.totalPoints}ポイント\n`;
        
        csv += '\n作品別進捗\n';
        csv += '作品ID,進捗率,読書時間,学習語句,ポイント\n';
        
        for (const [bookId, progress] of Object.entries(bookProgress)) {
            const percent = progress.totalPages > 0 
                ? Math.round((progress.currentPage + 1) / progress.totalPages * 100) 
                : 0;
            csv += `${bookId},${percent}%,${Math.round(progress.readingTime / 60)}分,${progress.wordsLearned.length}語,${progress.points}pt\n`;
        }
        
        // ダウンロード
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `読書統計_${new Date().toLocaleDateString('ja-JP')}.csv`;
        link.click();
    }
    
    /**
     * 画像エクスポート
     */
    exportToImage() {
        // 現在表示中のチャートを取得
        const activePanel = document.querySelector('.stats-panel.active');
        const canvas = activePanel.querySelector('canvas');
        
        if (canvas) {
            const link = document.createElement('a');
            link.href = canvas.toDataURL('image/png');
            link.download = `読書統計グラフ_${new Date().toLocaleDateString('ja-JP')}.png`;
            link.click();
        }
    }
    
    /**
     * クリーンアップ
     */
    cleanup() {
        // すべてのチャートを破棄
        Object.values(this.charts).forEach(chart => {
            if (chart) {
                chart.destroy();
            }
        });
    }
}