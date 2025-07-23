/**
 * book-library.js - 作品ライブラリ管理
 * 
 * 作品の一覧表示、検索、フィルタリング、
 * 動的追加などの機能を提供します。
 */

export class BookLibrary {
    constructor(bookLoader, storageManager) {
        // 依存サービス
        this.bookLoader = bookLoader;
        this.storageManager = storageManager;
        
        // 作品データ
        this.books = [];
        this.filteredBooks = [];
        this.favorites = new Set();
        
        // 表示設定
        this.container = null;
        this.booksGrid = null;
        this.viewMode = 'grid'; // 'grid' | 'list'
        this.sortBy = 'title'; // 'title' | 'author' | 'difficulty' | 'recent'
        
        // フィルター設定
        this.filters = {
            searchQuery: '',
            authors: [],
            difficulties: [],
            lengths: [],
            categories: []
        };
        
        // UI要素
        this.searchBar = null;
        this.filterControls = null;
        this.resultCount = null;
        this.viewModeToggle = null;
        
        // モーダル
        this.previewModal = null;
        this.currentPreviewBook = null;
        
        // イベントハンドラー
        this.onBookSelect = null;
        this.onBookAdd = null;
        
        // 進捗データ
        this.progressData = {};
        
        // 初期化
        this.init();
    }
    
    /**
     * 初期化
     */
    async init() {
        // お気に入りと進捗データの読み込み
        this.loadUserData();
        
        // UI要素の作成
        this.setupUI();
        
        // 作品の読み込み
        await this.loadBooks();
    }
    
    /**
     * UI要素のセットアップ
     */
    setupUI() {
        // コンテナの取得または作成
        this.container = document.getElementById('book-library');
        if (!this.container) {
            console.warn('book-library要素が見つかりません');
            return;
        }
        
        // ライブラリUIの構築
        this.container.innerHTML = `
            <div class="library-header">
                <h2 class="library-title">📚 作品ライブラリ</h2>
                <div class="library-controls">
                    <div class="search-container">
                        <input type="search" 
                               class="search-bar" 
                               placeholder="作品名・作者名で検索..."
                               aria-label="作品検索">
                        <span class="search-icon">🔍</span>
                    </div>
                    <div class="view-controls">
                        <button class="view-mode-toggle" 
                                aria-label="表示モード切替"
                                title="表示モード切替">
                            <span class="grid-icon">⊞</span>
                            <span class="list-icon" style="display:none">☰</span>
                        </button>
                        <button class="filter-toggle" 
                                aria-label="フィルター"
                                title="フィルター">
                            🔽 フィルター
                        </button>
                    </div>
                </div>
            </div>
            
            <div class="filter-panel" style="display:none">
                <div class="filter-section">
                    <h3>作者</h3>
                    <div class="filter-authors"></div>
                </div>
                <div class="filter-section">
                    <h3>難易度</h3>
                    <div class="filter-difficulties">
                        <label><input type="checkbox" value="beginner"> 初級</label>
                        <label><input type="checkbox" value="intermediate"> 中級</label>
                        <label><input type="checkbox" value="advanced"> 上級</label>
                    </div>
                </div>
                <div class="filter-section">
                    <h3>作品の長さ</h3>
                    <div class="filter-lengths">
                        <label><input type="checkbox" value="short"> 短編（〜15分）</label>
                        <label><input type="checkbox" value="medium"> 中編（15〜60分）</label>
                        <label><input type="checkbox" value="long"> 長編（60分〜）</label>
                    </div>
                </div>
                <div class="filter-actions">
                    <button class="clear-filters">フィルターをクリア</button>
                    <span class="result-count">全 <span class="count">0</span> 作品</span>
                </div>
            </div>
            
            <div class="books-container">
                <div class="books-grid" role="list"></div>
                <div class="empty-state" style="display:none">
                    <p>検索条件に一致する作品が見つかりません</p>
                </div>
            </div>
            
            <div class="add-book-area">
                <div class="drop-zone" 
                     ondrop="event.preventDefault();"
                     ondragover="event.preventDefault();">
                    <p>📤 新しい作品をドラッグ&ドロップ<br>または</p>
                    <input type="file" 
                           id="file-input" 
                           accept=".json" 
                           style="display:none">
                    <button class="select-file-btn">ファイルを選択</button>
                </div>
            </div>
        `;
        
        // 要素の参照を保存
        this.searchBar = this.container.querySelector('.search-bar');
        this.booksGrid = this.container.querySelector('.books-grid');
        this.filterControls = this.container.querySelector('.filter-panel');
        this.resultCount = this.container.querySelector('.count');
        this.viewModeToggle = this.container.querySelector('.view-mode-toggle');
        
        // イベントリスナーの設定
        this.setupEventListeners();
        
        // プレビューモーダルの作成
        this.createPreviewModal();
    }
    
    /**
     * イベントリスナーの設定
     */
    setupEventListeners() {
        // 検索
        this.searchBar.addEventListener('input', (e) => {
            this.filters.searchQuery = e.target.value;
            this.applyFilters();
        });
        
        // 表示モード切替
        this.viewModeToggle.addEventListener('click', () => {
            this.toggleViewMode();
        });
        
        // フィルターパネルの表示/非表示
        this.container.querySelector('.filter-toggle').addEventListener('click', () => {
            this.toggleFilterPanel();
        });
        
        // フィルターのクリア
        this.container.querySelector('.clear-filters').addEventListener('click', () => {
            this.clearFilters();
        });
        
        // フィルターチェックボックス
        this.filterControls.addEventListener('change', (e) => {
            if (e.target.type === 'checkbox') {
                this.updateFiltersFromUI();
                this.applyFilters();
            }
        });
        
        // ファイル選択
        const fileInput = this.container.querySelector('#file-input');
        const selectFileBtn = this.container.querySelector('.select-file-btn');
        
        selectFileBtn.addEventListener('click', () => {
            fileInput.click();
        });
        
        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                this.handleFileSelect(e.target.files[0]);
            }
        });
        
        // ドラッグ&ドロップ
        const dropZone = this.container.querySelector('.drop-zone');
        
        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropZone.classList.add('drag-over');
        });
        
        dropZone.addEventListener('dragleave', () => {
            dropZone.classList.remove('drag-over');
        });
        
        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropZone.classList.remove('drag-over');
            
            if (e.dataTransfer.files.length > 0) {
                this.handleFileSelect(e.dataTransfer.files[0]);
            }
        });
    }
    
    /**
     * 作品の読み込み
     */
    async loadBooks() {
        try {
            // デフォルトの作品を読み込み
            const books = await this.bookLoader.loadBooks('./books/');
            this.books = books;
            
            // 進捗データの適用
            this.applyProgressData();
            
            // 初期表示
            this.filteredBooks = [...this.books];
            this.displayBooks();
            
            // 作者リストの更新
            this.updateAuthorFilter();
            
        } catch (error) {
            console.error('作品の読み込みエラー:', error);
            this.showError('作品の読み込みに失敗しました');
        }
    }
    
    /**
     * 作品の表示
     */
    displayBooks() {
        // ソート
        this.sortBooks();
        
        // グリッドのクリア
        this.booksGrid.innerHTML = '';
        
        // 作品カードの作成
        this.filteredBooks.forEach(book => {
            const card = this.createBookCard(book);
            this.booksGrid.appendChild(card);
        });
        
        // 結果数の更新
        this.resultCount.textContent = this.filteredBooks.length;
        
        // 空の状態の表示/非表示
        const emptyState = this.container.querySelector('.empty-state');
        if (this.filteredBooks.length === 0) {
            emptyState.style.display = 'block';
            this.booksGrid.style.display = 'none';
        } else {
            emptyState.style.display = 'none';
            this.booksGrid.style.display = '';
        }
    }
    
    /**
     * 作品カードの作成
     * @param {Object} book - 作品データ
     * @returns {HTMLElement} カード要素
     */
    createBookCard(book) {
        const card = document.createElement('article');
        card.className = `book-card ${this.viewMode}`;
        card.setAttribute('role', 'listitem');
        
        const progress = this.progressData[book.id] || {};
        const isCompleted = progress.completed;
        const isReading = progress.currentChapter > 0 && !isCompleted;
        const isFavorite = this.favorites.has(book.id);
        
        const difficultyLabels = {
            'beginner': '初級',
            'intermediate': '中級',
            'advanced': '上級'
        };
        
        const lengthLabels = {
            'short': '短編',
            'medium': '中編',
            'long': '長編'
        };
        
        card.innerHTML = `
            <div class="book-cover">
                ${this.getCoverImage(book)}
                ${isCompleted ? '<span class="status-badge completed">完読</span>' : ''}
                ${isReading ? '<span class="status-badge reading">読書中</span>' : ''}
            </div>
            <div class="book-info">
                <h3 class="book-title">${this.escapeHtml(book.title)}</h3>
                <p class="book-author">${this.escapeHtml(book.author)}</p>
                <div class="book-meta">
                    <span class="difficulty ${book.difficulty}">
                        ${difficultyLabels[book.difficulty] || '中級'}
                    </span>
                    <span class="length">
                        ${lengthLabels[book.length] || '中編'}
                    </span>
                    <span class="reading-time">
                        ⏱ ${book.metadata?.estimatedReadingTime || '30'}分
                    </span>
                </div>
                ${progress.progress ? `
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${progress.progress}%"></div>
                    </div>
                    <span class="progress-text">${Math.round(progress.progress)}%</span>
                ` : ''}
            </div>
            <div class="book-actions">
                <button class="favorite-btn ${isFavorite ? 'active' : ''}" 
                        aria-label="${isFavorite ? 'お気に入りから削除' : 'お気に入りに追加'}"
                        data-book-id="${book.id}">
                    ${isFavorite ? '❤️' : '🤍'}
                </button>
                <button class="preview-btn" 
                        aria-label="詳細を見る"
                        data-book-id="${book.id}">
                    📖 詳細
                </button>
                <button class="read-btn primary" 
                        aria-label="${isReading ? '続きを読む' : '読み始める'}"
                        data-book-id="${book.id}">
                    ${isReading ? '続きを読む' : '読み始める'}
                </button>
            </div>
        `;
        
        // イベントリスナー
        card.querySelector('.favorite-btn').addEventListener('click', (e) => {
            this.toggleFavorite(book.id);
            e.stopPropagation();
        });
        
        card.querySelector('.preview-btn').addEventListener('click', (e) => {
            this.showPreview(book);
            e.stopPropagation();
        });
        
        card.querySelector('.read-btn').addEventListener('click', (e) => {
            if (this.onBookSelect) {
                this.onBookSelect(book);
            }
            e.stopPropagation();
        });
        
        return card;
    }
    
    /**
     * カバー画像の取得
     * @param {Object} book - 作品データ
     * @returns {string} HTML文字列
     */
    getCoverImage(book) {
        // カバー画像がある場合はそれを使用
        if (book.coverImage) {
            return `<img src="${book.coverImage}" alt="${book.title}の表紙">`;
        }
        
        // なければデフォルトの絵文字アイコン
        const categoryIcons = {
            'classic': '📜',
            'modern': '📘',
            'children': '🎨',
            'poetry': '🌸',
            'essay': '✍️'
        };
        
        const icon = categoryIcons[book.category] || '📚';
        return `<div class="default-cover">${icon}</div>`;
    }
    
    /**
     * 表示モードの切替
     */
    toggleViewMode() {
        this.viewMode = this.viewMode === 'grid' ? 'list' : 'grid';
        
        // ボタンアイコンの切替
        const gridIcon = this.viewModeToggle.querySelector('.grid-icon');
        const listIcon = this.viewModeToggle.querySelector('.list-icon');
        
        if (this.viewMode === 'grid') {
            gridIcon.style.display = '';
            listIcon.style.display = 'none';
            this.booksGrid.className = 'books-grid';
        } else {
            gridIcon.style.display = 'none';
            listIcon.style.display = '';
            this.booksGrid.className = 'books-list';
        }
        
        // 再表示
        this.displayBooks();
    }
    
    /**
     * フィルターパネルの表示/非表示
     */
    toggleFilterPanel() {
        const isVisible = this.filterControls.style.display !== 'none';
        this.filterControls.style.display = isVisible ? 'none' : 'block';
        
        const filterToggle = this.container.querySelector('.filter-toggle');
        filterToggle.textContent = isVisible ? '🔽 フィルター' : '🔼 フィルター';
    }
    
    /**
     * フィルターの適用
     */
    applyFilters() {
        this.filteredBooks = this.books.filter(book => {
            // 検索クエリ
            if (this.filters.searchQuery) {
                const query = this.filters.searchQuery.toLowerCase();
                const matchTitle = book.title.toLowerCase().includes(query);
                const matchAuthor = book.author.toLowerCase().includes(query);
                if (!matchTitle && !matchAuthor) return false;
            }
            
            // 作者フィルター
            if (this.filters.authors.length > 0) {
                if (!this.filters.authors.includes(book.author)) return false;
            }
            
            // 難易度フィルター
            if (this.filters.difficulties.length > 0) {
                if (!this.filters.difficulties.includes(book.difficulty)) return false;
            }
            
            // 文量フィルター
            if (this.filters.lengths.length > 0) {
                if (!this.filters.lengths.includes(book.length)) return false;
            }
            
            return true;
        });
        
        this.displayBooks();
    }
    
    /**
     * フィルターのクリア
     */
    clearFilters() {
        // フィルター設定のリセット
        this.filters = {
            searchQuery: '',
            authors: [],
            difficulties: [],
            lengths: [],
            categories: []
        };
        
        // UIのリセット
        this.searchBar.value = '';
        this.filterControls.querySelectorAll('input[type="checkbox"]').forEach(cb => {
            cb.checked = false;
        });
        
        // 再表示
        this.filteredBooks = [...this.books];
        this.displayBooks();
    }
    
    /**
     * UIからフィルター設定を更新
     */
    updateFiltersFromUI() {
        // 難易度
        this.filters.difficulties = [];
        this.filterControls.querySelectorAll('.filter-difficulties input:checked').forEach(cb => {
            this.filters.difficulties.push(cb.value);
        });
        
        // 文量
        this.filters.lengths = [];
        this.filterControls.querySelectorAll('.filter-lengths input:checked').forEach(cb => {
            this.filters.lengths.push(cb.value);
        });
        
        // 作者
        this.filters.authors = [];
        this.filterControls.querySelectorAll('.filter-authors input:checked').forEach(cb => {
            this.filters.authors.push(cb.value);
        });
    }
    
    /**
     * 作者フィルターの更新
     */
    updateAuthorFilter() {
        const authors = [...new Set(this.books.map(book => book.author))].sort();
        const authorsContainer = this.filterControls.querySelector('.filter-authors');
        
        authorsContainer.innerHTML = authors.map(author => `
            <label>
                <input type="checkbox" value="${this.escapeHtml(author)}">
                ${this.escapeHtml(author)}
            </label>
        `).join('');
    }
    
    /**
     * 作品のソート
     */
    sortBooks() {
        this.filteredBooks.sort((a, b) => {
            switch (this.sortBy) {
                case 'title':
                    return a.title.localeCompare(b.title, 'ja');
                case 'author':
                    return a.author.localeCompare(b.author, 'ja');
                case 'difficulty':
                    const diffOrder = { 'beginner': 1, 'intermediate': 2, 'advanced': 3 };
                    return (diffOrder[a.difficulty] || 2) - (diffOrder[b.difficulty] || 2);
                case 'recent':
                    // 最近読んだ順（進捗データを使用）
                    const progressA = this.progressData[a.id];
                    const progressB = this.progressData[b.id];
                    const dateA = progressA?.lastReadDate || 0;
                    const dateB = progressB?.lastReadDate || 0;
                    return new Date(dateB) - new Date(dateA);
                default:
                    return 0;
            }
        });
    }
    
    /**
     * お気に入りの切替
     * @param {string} bookId - 作品ID
     */
    toggleFavorite(bookId) {
        if (this.favorites.has(bookId)) {
            this.favorites.delete(bookId);
        } else {
            this.favorites.add(bookId);
        }
        
        this.saveFavorites();
        this.displayBooks();
    }
    
    /**
     * プレビューモーダルの作成
     */
    createPreviewModal() {
        const modal = document.createElement('div');
        modal.className = 'book-preview-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <button class="modal-close" aria-label="閉じる">×</button>
                <div class="preview-content">
                    <div class="preview-header">
                        <h2 class="preview-title"></h2>
                        <p class="preview-author"></p>
                    </div>
                    <div class="preview-body">
                        <div class="preview-meta">
                            <span class="preview-difficulty"></span>
                            <span class="preview-length"></span>
                            <span class="preview-time"></span>
                        </div>
                        <div class="preview-description"></div>
                        <div class="preview-chapters">
                            <h3>章構成</h3>
                            <ol class="chapter-list"></ol>
                        </div>
                        <div class="preview-stats">
                            <h3>作品情報</h3>
                            <dl>
                                <dt>総文字数</dt>
                                <dd class="total-chars"></dd>
                                <dt>推定読書時間</dt>
                                <dd class="estimated-time"></dd>
                                <dt>対象年齢</dt>
                                <dd class="age-recommendation"></dd>
                            </dl>
                        </div>
                    </div>
                    <div class="preview-footer">
                        <button class="btn-favorite">
                            <span class="favorite-icon">🤍</span>
                            お気に入り
                        </button>
                        <button class="btn-read primary">読み始める</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        this.previewModal = modal;
        
        // イベントリスナー
        modal.querySelector('.modal-close').addEventListener('click', () => {
            this.hidePreview();
        });
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.hidePreview();
            }
        });
    }
    
    /**
     * プレビューの表示
     * @param {Object} book - 作品データ
     */
    showPreview(book) {
        this.currentPreviewBook = book;
        
        // データの設定
        const modal = this.previewModal;
        modal.querySelector('.preview-title').textContent = book.title;
        modal.querySelector('.preview-author').textContent = `作：${book.author}`;
        
        // メタデータ
        const difficultyLabels = {
            'beginner': '初級',
            'intermediate': '中級',
            'advanced': '上級'
        };
        modal.querySelector('.preview-difficulty').textContent = difficultyLabels[book.difficulty] || '中級';
        modal.querySelector('.preview-length').textContent = `${book.metadata?.totalChapters || book.content.length}章`;
        modal.querySelector('.preview-time').textContent = `約${book.metadata?.estimatedReadingTime || '30'}分`;
        
        // 説明（あれば）
        const descContainer = modal.querySelector('.preview-description');
        if (book.description) {
            descContainer.innerHTML = `<p>${this.escapeHtml(book.description)}</p>`;
            descContainer.style.display = 'block';
        } else {
            descContainer.style.display = 'none';
        }
        
        // 章リスト
        const chapterList = modal.querySelector('.chapter-list');
        chapterList.innerHTML = book.content.map(chapter => `
            <li>${chapter.title || `第${chapter.chapter}章`}</li>
        `).join('');
        
        // 統計情報
        const totalChars = book.content.reduce((sum, ch) => sum + ch.text.length, 0);
        modal.querySelector('.total-chars').textContent = `${totalChars.toLocaleString()}文字`;
        modal.querySelector('.estimated-time').textContent = `${book.metadata?.estimatedReadingTime || Math.ceil(totalChars / 400)}分`;
        modal.querySelector('.age-recommendation').textContent = book.metadata?.ageRecommendation || '10歳以上';
        
        // お気に入りボタン
        const favoriteBtn = modal.querySelector('.btn-favorite');
        const isFavorite = this.favorites.has(book.id);
        favoriteBtn.querySelector('.favorite-icon').textContent = isFavorite ? '❤️' : '🤍';
        
        // イベントリスナー
        favoriteBtn.onclick = () => {
            this.toggleFavorite(book.id);
            favoriteBtn.querySelector('.favorite-icon').textContent = 
                this.favorites.has(book.id) ? '❤️' : '🤍';
        };
        
        modal.querySelector('.btn-read').onclick = () => {
            this.hidePreview();
            if (this.onBookSelect) {
                this.onBookSelect(book);
            }
        };
        
        // モーダルの表示
        modal.style.display = 'flex';
        requestAnimationFrame(() => {
            modal.classList.add('show');
        });
    }
    
    /**
     * プレビューを非表示
     */
    hidePreview() {
        this.previewModal.classList.remove('show');
        setTimeout(() => {
            this.previewModal.style.display = 'none';
        }, 300);
    }
    
    /**
     * ファイル選択の処理
     * @param {File} file - 選択されたファイル
     */
    async handleFileSelect(file) {
        if (!file.name.endsWith('.json')) {
            this.showError('JSONファイルを選択してください');
            return;
        }
        
        try {
            const book = await this.bookLoader.addBookFromFile(file);
            
            // 重複チェック
            if (this.books.some(b => b.id === book.id)) {
                this.showError('この作品は既に登録されています');
                return;
            }
            
            // 作品を追加
            this.books.push(book);
            this.filteredBooks = [...this.books];
            
            // 表示を更新
            this.displayBooks();
            this.updateAuthorFilter();
            
            // 成功通知
            this.showSuccess(`「${book.title}」を追加しました`);
            
            // イベント発火
            if (this.onBookAdd) {
                this.onBookAdd(book);
            }
            
        } catch (error) {
            console.error('ファイル読み込みエラー:', error);
            this.showError(error.message || 'ファイルの読み込みに失敗しました');
        }
    }
    
    /**
     * 進捗データの適用
     */
    applyProgressData() {
        if (this.storageManager) {
            const progress = this.storageManager.loadProgress();
            if (progress && progress.bookProgress) {
                this.progressData = progress.bookProgress;
            }
        }
    }
    
    /**
     * ユーザーデータの読み込み
     */
    loadUserData() {
        // お気に入り
        if (this.storageManager) {
            const saved = this.storageManager.get('bookFavorites');
            if (saved) {
                this.favorites = new Set(saved);
            }
        }
        
        // 進捗データ
        this.applyProgressData();
    }
    
    /**
     * お気に入りの保存
     */
    saveFavorites() {
        if (this.storageManager) {
            this.storageManager.set('bookFavorites', [...this.favorites]);
        }
    }
    
    /**
     * エラー表示
     * @param {string} message - エラーメッセージ
     */
    showError(message) {
        const notification = document.createElement('div');
        notification.className = 'notification error';
        notification.textContent = `❌ ${message}`;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('show');
        }, 10);
        
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
    
    /**
     * 成功通知
     * @param {string} message - メッセージ
     */
    showSuccess(message) {
        const notification = document.createElement('div');
        notification.className = 'notification success';
        notification.textContent = `✅ ${message}`;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('show');
        }, 10);
        
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
    
    /**
     * HTMLエスケープ
     * @param {string} text - エスケープするテキスト
     * @returns {string} エスケープ済みテキスト
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}