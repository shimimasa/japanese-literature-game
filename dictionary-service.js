/**
 * dictionary-service.js - 語句説明サービス
 * 
 * 難しい漢字や古語の説明をポップアップで表示し、
 * 学習ポイントの管理を行います。
 */

export class DictionaryService {
    constructor(storageManager) {
        // 注釈データのキャッシュ
        this.annotationsCache = new Map();
        
        // 現在の作品の注釈
        this.currentAnnotations = [];
        
        // ポップアップ要素
        this.popup = null;
        this.popupContent = null;
        
        // 学習済み語句のセット
        this.learnedWords = new Set();
        this.learnedWordDetails = new Map();
        
        // ポップアップの表示状態
        this.isPopupVisible = false;
        
        // イベントハンドラー
        this.onWordLearned = null;
        this.onPointsEarned = null;
        
        // StorageManager連携
        this.storageManager = storageManager;
        
        // 正規表現パターンのキャッシュ
        this.regexCache = new Map();
        
        // ポイント設定
        this.pointSettings = {
            firstLearn: 10,
            review: 5,
            bonusThreshold: 10, // 10語学習でボーナス
            bonusPoints: 20
        };
        
        // アニメーション設定
        this.animationEnabled = true;
        
        // 初期化
        this.init();
    }
    
    /**
     * 初期化
     */
    init() {
        // 学習済み語句の読み込み
        this.loadLearnedWordsFromStorage();
        
        // ポップアップ要素の作成または取得
        this.setupPopupElement();
        
        // カスタムイベントリスナーの設定
        document.addEventListener('show-annotation', (e) => {
            const { annotation, element } = e.detail;
            this.showDefinitionPopup(annotation.word, element);
        });
        
        // ポップアップのクリックイベント
        this.popup.addEventListener('click', (e) => {
            if (e.target === this.popup || e.target.classList.contains('popup-close')) {
                this.hidePopup();
            }
        });
        
        // ESCキーでポップアップを閉じる
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isPopupVisible) {
                this.hidePopup();
            }
        });
        
        // クリック外し検出
        document.addEventListener('click', (e) => {
            if (this.isPopupVisible && 
                !this.popup.contains(e.target) && 
                !e.target.classList.contains('annotated')) {
                this.hidePopup();
            }
        });
    }
    
    /**
     * ポップアップ要素のセットアップ
     */
    setupPopupElement() {
        // 既存の要素を探す
        this.popup = document.getElementById('dictionary-popup');
        
        // なければ作成
        if (!this.popup) {
            this.popup = this.createPopupElement();
            document.body.appendChild(this.popup);
        }
        
        this.popupContent = this.popup.querySelector('.word-info');
    }
    
    /**
     * ポップアップ要素の作成
     * @returns {HTMLElement} ポップアップ要素
     */
    createPopupElement() {
        const popup = document.createElement('div');
        popup.id = 'dictionary-popup';
        popup.className = 'dictionary-popup hidden';
        
        popup.innerHTML = `
            <div class="popup-content">
                <button class="popup-close" aria-label="閉じる">×</button>
                <div class="word-info">
                    <h3 class="word-title"></h3>
                    <p class="word-reading"></p>
                    <div class="word-definition"></div>
                    <div class="word-stats">
                        <span class="learn-count"></span>
                    </div>
                </div>
            </div>
        `;
        
        return popup;
    }
    
    /**
     * 作品の注釈データを設定
     * @param {Array} chapters - 章データの配列
     */
    setAnnotations(chapters) {
        this.currentAnnotations = [];
        this.annotationsCache.clear();
        
        chapters.forEach(chapter => {
            if (chapter.annotations) {
                chapter.annotations.forEach(annotation => {
                    this.currentAnnotations.push(annotation);
                    this.annotationsCache.set(annotation.word, annotation);
                });
            }
        });
    }
    
    /**
     * 語句の定義を取得
     * @param {string} word - 検索する語句
     * @returns {Object|null} 注釈データ
     */
    getWordDefinition(word) {
        // キャッシュから検索（完全一致）
        if (this.annotationsCache.has(word)) {
            return this.annotationsCache.get(word);
        }
        
        // 正規表現による検索
        for (const annotation of this.currentAnnotations) {
            const pattern = this.getRegexPattern(annotation.word);
            if (pattern.test(word)) {
                return annotation;
            }
        }
        
        // 部分一致で検索（フォールバック）
        for (const annotation of this.currentAnnotations) {
            if (word.includes(annotation.word) || annotation.word.includes(word)) {
                return annotation;
            }
        }
        
        return null;
    }
    
    /**
     * 語句の正規表現パターンを取得（キャッシュ付き）
     * @param {string} word - 語句
     * @returns {RegExp} 正規表現パターン
     */
    getRegexPattern(word) {
        if (this.regexCache.has(word)) {
            return this.regexCache.get(word);
        }
        
        // 特殊文字をエスケープ
        const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        
        // 複数の読み方がある漢字への対応（例：今日（きょう/こんにち））
        const pattern = new RegExp(escaped, 'g');
        this.regexCache.set(word, pattern);
        
        return pattern;
    }
    
    /**
     * 読み仮名のヒントを取得
     * @param {string} kanji - 漢字
     * @returns {string} 読み仮名
     */
    getReadingHint(kanji) {
        const annotation = this.getWordDefinition(kanji);
        return annotation?.reading || '';
    }
    
    /**
     * 定義ポップアップを表示
     * @param {string} word - 表示する語句
     * @param {HTMLElement} targetElement - クリックされた要素
     */
    showDefinitionPopup(word, targetElement) {
        const annotation = this.getWordDefinition(word);
        
        if (!annotation) {
            console.warn(`語句 "${word}" の注釈が見つかりません`);
            return;
        }
        
        // ポップアップの内容を更新
        this.updatePopupContent(annotation);
        
        // ポップアップの位置を計算
        this.positionPopup(targetElement);
        
        // ポップアップを表示
        this.popup.classList.remove('hidden');
        this.isPopupVisible = true;
        
        // 初回学習の場合はポイントを付与
        if (!this.learnedWords.has(word)) {
            this.markWordAsLearned(word);
        }
        
        // アニメーション
        requestAnimationFrame(() => {
            this.popup.style.opacity = '1';
        });
    }
    
    /**
     * ポップアップの内容を更新
     * @param {Object} annotation - 注釈データ
     */
    updatePopupContent(annotation) {
        const titleElement = this.popupContent.querySelector('.word-title');
        const readingElement = this.popupContent.querySelector('.word-reading');
        const definitionElement = this.popupContent.querySelector('.word-definition');
        const statsElement = this.popupContent.querySelector('.word-stats');
        
        // タイトル（語句）
        titleElement.textContent = annotation.word;
        
        // 読み仮名
        if (annotation.reading) {
            readingElement.innerHTML = `<ruby>${annotation.word}<rt>${annotation.reading}</rt></ruby>`;
            readingElement.style.display = 'block';
        } else {
            readingElement.style.display = 'none';
        }
        
        // 説明文
        definitionElement.innerHTML = this.formatDefinition(annotation.definition);
        
        // 学習状態の表示
        const wordDetails = this.learnedWordDetails.get(annotation.word);
        if (wordDetails) {
            const reviewCount = wordDetails.reviewCount || 1;
            const totalPoints = wordDetails.totalPoints || 0;
            const lastReviewDate = new Date(wordDetails.lastReviewedDate);
            const daysSinceReview = Math.floor((Date.now() - lastReviewDate) / (1000 * 60 * 60 * 24));
            
            titleElement.innerHTML += ' <span class="learned-mark">✓ 学習済み</span>';
            
            statsElement.innerHTML = `
                <div class="word-stats-content">
                    <span class="review-count">復習回数: ${reviewCount}回</span>
                    <span class="total-points">獲得ポイント: ${totalPoints}点</span>
                    ${daysSinceReview > 7 ? 
                        `<span class="review-reminder">📝 ${daysSinceReview}日ぶりの復習です</span>` : 
                        ''}
                </div>
            `;
            statsElement.style.display = 'block';
        } else {
            titleElement.innerHTML += ' <span class="new-word-mark">🆕 初めての語句</span>';
            statsElement.style.display = 'none';
        }
    }
    
    /**
     * 説明文のフォーマット
     * @param {string} definition - 説明文
     * @returns {string} フォーマット済みの説明文
     */
    formatDefinition(definition) {
        // 改行を<br>に変換
        let formatted = definition.replace(/\n/g, '<br>');
        
        // 【】で囲まれた部分を強調
        formatted = formatted.replace(/【(.+?)】/g, '<strong>【$1】</strong>');
        
        // 例文がある場合は斜体に
        formatted = formatted.replace(/例：(.+?)(?=<br>|$)/g, '<em>例：$1</em>');
        
        return formatted;
    }
    
    /**
     * ポップアップの位置を計算して設定
     * @param {HTMLElement} targetElement - 基準となる要素
     */
    positionPopup(targetElement) {
        const rect = targetElement.getBoundingClientRect();
        const popupRect = this.popup.getBoundingClientRect();
        
        // 縦書きレイアウトを考慮した位置計算
        let left = rect.left - popupRect.width - 20; // 要素の左側に表示
        let top = rect.top + (rect.height / 2) - (popupRect.height / 2);
        
        // 画面外にはみ出す場合の調整
        if (left < 10) {
            left = rect.right + 20; // 右側に表示
        }
        
        if (top < 10) {
            top = 10;
        } else if (top + popupRect.height > window.innerHeight - 10) {
            top = window.innerHeight - popupRect.height - 10;
        }
        
        // モバイルデバイスの場合は中央に表示
        if (window.innerWidth < 768) {
            const popupContentElement = this.popup.querySelector('.popup-content');
            popupContentElement.style.position = 'fixed';
            popupContentElement.style.top = '50%';
            popupContentElement.style.left = '50%';
            popupContentElement.style.transform = 'translate(-50%, -50%)';
        } else {
            const popupContentElement = this.popup.querySelector('.popup-content');
            popupContentElement.style.position = 'absolute';
            popupContentElement.style.left = `${left}px`;
            popupContentElement.style.top = `${top}px`;
            popupContentElement.style.transform = 'none';
        }
    }
    
    /**
     * ポップアップを非表示
     */
    hidePopup() {
        if (!this.isPopupVisible) return;
        
        // フェードアウトアニメーション
        this.popup.style.opacity = '0';
        
        setTimeout(() => {
            this.popup.classList.add('hidden');
            this.isPopupVisible = false;
        }, 150);
    }
    
    /**
     * 語句を学習済みとしてマーク
     * @param {string} word - 学習した語句
     */
    markWordAsLearned(word) {
        const isFirstLearn = !this.learnedWords.has(word);
        let points = 0;
        
        if (isFirstLearn) {
            // 初回学習
            this.learnedWords.add(word);
            points = this.pointSettings.firstLearn;
            
            // 詳細情報を記録
            this.learnedWordDetails.set(word, {
                firstLearnedDate: new Date().toISOString(),
                lastReviewedDate: new Date().toISOString(),
                reviewCount: 1,
                totalPoints: points
            });
        } else {
            // 復習
            const details = this.learnedWordDetails.get(word);
            points = this.pointSettings.review;
            
            if (details) {
                details.lastReviewedDate = new Date().toISOString();
                details.reviewCount = (details.reviewCount || 0) + 1;
                details.totalPoints = (details.totalPoints || 0) + points;
            }
        }
        
        // 保存
        this.saveLearnedWords();
        
        // ボーナスチェック
        if (this.learnedWords.size % this.pointSettings.bonusThreshold === 0) {
            points += this.pointSettings.bonusPoints;
            this.showBonusAnimation();
        }
        
        // ポイントアニメーション
        if (points > 0) {
            this.showPointAnimation(points, isFirstLearn);
        }
        
        // イベントの発火
        if (this.onWordLearned) {
            this.onWordLearned(word, points, isFirstLearn);
        }
        
        if (this.onPointsEarned) {
            this.onPointsEarned(points, word);
        }
        
        // StorageManager経由でのポイント追加
        if (this.storageManager) {
            const progress = this.storageManager.loadProgress();
            if (progress) {
                progress.totalPoints = (progress.totalPoints || 0) + points;
                this.storageManager.saveProgress(progress);
            }
        }
    }
    
    /**
     * ポイント獲得アニメーションを表示
     * @param {number} points - 獲得ポイント
     * @param {boolean} isFirstLearn - 初回学習かどうか
     */
    showPointAnimation(points, isFirstLearn = true) {
        if (!this.animationEnabled) return;
        
        const pointElement = document.createElement('div');
        pointElement.className = 'point-animation';
        
        if (isFirstLearn) {
            pointElement.classList.add('first-learn');
            pointElement.innerHTML = `
                <span class="point-icon">⭐</span>
                <span class="point-text">+${points}ポイント</span>
                <span class="point-label">初回学習！</span>
            `;
        } else {
            pointElement.classList.add('review');
            pointElement.innerHTML = `
                <span class="point-icon">📚</span>
                <span class="point-text">+${points}ポイント</span>
                <span class="point-label">復習ボーナス</span>
            `;
        }
        
        // ポップアップの近くに表示
        const popupRect = this.popup.getBoundingClientRect();
        pointElement.style.position = 'fixed';
        pointElement.style.left = `${popupRect.left + popupRect.width / 2}px`;
        pointElement.style.top = `${popupRect.top - 20}px`;
        pointElement.style.transform = 'translateX(-50%)';
        pointElement.style.zIndex = '10000';
        
        document.body.appendChild(pointElement);
        
        // アニメーション
        requestAnimationFrame(() => {
            pointElement.classList.add('animate');
        });
        
        // アニメーション終了後に削除
        setTimeout(() => {
            pointElement.remove();
        }, 2000);
    }
    
    /**
     * ボーナスアニメーションを表示
     */
    showBonusAnimation() {
        if (!this.animationEnabled) return;
        
        const bonusElement = document.createElement('div');
        bonusElement.className = 'bonus-animation';
        bonusElement.innerHTML = `
            <div class="bonus-content">
                <span class="bonus-icon">🎉</span>
                <span class="bonus-text">${this.learnedWords.size}語達成！</span>
                <span class="bonus-points">+${this.pointSettings.bonusPoints}ボーナス</span>
            </div>
        `;
        
        bonusElement.style.position = 'fixed';
        bonusElement.style.top = '50%';
        bonusElement.style.left = '50%';
        bonusElement.style.transform = 'translate(-50%, -50%)';
        bonusElement.style.zIndex = '10001';
        
        document.body.appendChild(bonusElement);
        
        // アニメーション
        requestAnimationFrame(() => {
            bonusElement.classList.add('show');
        });
        
        // アニメーション終了後に削除
        setTimeout(() => {
            bonusElement.classList.add('hide');
            setTimeout(() => {
                bonusElement.remove();
            }, 500);
        }, 2500);
    }
    
    /**
     * 学習済み語句を読み込み
     * @returns {Array} 学習済み語句の配列
     */
    loadLearnedWords() {
        try {
            const saved = localStorage.getItem('learnedWords');
            return saved ? JSON.parse(saved) : [];
        } catch (error) {
            console.error('学習済み語句の読み込みエラー:', error);
            return [];
        }
    }
    
    /**
     * 学習済み語句を保存
     */
    saveLearnedWords() {
        try {
            localStorage.setItem('learnedWords', JSON.stringify([...this.learnedWords]));
        } catch (error) {
            console.error('学習済み語句の保存エラー:', error);
        }
    }
    
    /**
     * 学習統計を取得
     * @returns {Object} 統計情報
     */
    getStatistics() {
        return {
            totalWords: this.currentAnnotations.length,
            learnedWords: this.learnedWords.size,
            learnedPercentage: this.currentAnnotations.length > 0 
                ? Math.round((this.learnedWords.size / this.currentAnnotations.length) * 100)
                : 0
        };
    }
    
    /**
     * 特定の作品の学習済み語句を取得
     * @param {Array} chapters - 章データの配列
     * @returns {Array} 学習済み語句のリスト
     */
    getLearnedWordsForBook(chapters) {
        const bookWords = new Set();
        
        chapters.forEach(chapter => {
            if (chapter.annotations) {
                chapter.annotations.forEach(annotation => {
                    bookWords.add(annotation.word);
                });
            }
        });
        
        return [...bookWords].filter(word => this.learnedWords.has(word));
    }
    
    /**
     * 語句の復習推奨を取得
     * @returns {Array} 復習推奨語句のリスト
     */
    getReviewRecommendations() {
        // 簡易的な実装：ランダムに学習済み語句から選択
        const learned = [...this.learnedWords];
        const recommendations = [];
        const count = Math.min(5, learned.length);
        
        for (let i = 0; i < count; i++) {
            const randomIndex = Math.floor(Math.random() * learned.length);
            recommendations.push(learned[randomIndex]);
            learned.splice(randomIndex, 1);
        }
        
        return recommendations;
    }
    
    /**
     * 学習データをリセット
     */
    resetLearnedWords() {
        this.learnedWords.clear();
        this.learnedWordDetails.clear();
        this.saveLearnedWords();
    }
    
    /**
     * テキスト内の注釈対象語句をハイライト
     * @param {string} text - 元のテキスト
     * @param {Array} annotations - 注釈データ
     * @returns {string} ハイライト済みHTML
     */
    highlightAnnotatedWords(text, annotations) {
        if (!annotations || annotations.length === 0) {
            return this.escapeHtml(text);
        }
        
        // 語句を長い順にソート（長い語句を優先的にマッチ）
        const sortedAnnotations = [...annotations].sort((a, b) => 
            b.word.length - a.word.length
        );
        
        let highlightedText = text;
        const replacements = [];
        
        // 各注釈語句を検索してマーク
        sortedAnnotations.forEach(annotation => {
            const pattern = this.getRegexPattern(annotation.word);
            let match;
            
            while ((match = pattern.exec(highlightedText)) !== null) {
                replacements.push({
                    start: match.index,
                    end: match.index + match[0].length,
                    word: match[0],
                    annotation: annotation
                });
            }
        });
        
        // 重複を除去（同じ位置の短い語句を除外）
        const finalReplacements = this.removeOverlappingReplacements(replacements);
        
        // 後ろから置換（インデックスがずれないように）
        finalReplacements.sort((a, b) => b.start - a.start);
        
        finalReplacements.forEach(replacement => {
            const { start, end, word, annotation } = replacement;
            const highlighted = this.createHighlightedSpan(word, annotation);
            highlightedText = 
                highlightedText.slice(0, start) + 
                highlighted + 
                highlightedText.slice(end);
        });
        
        return highlightedText;
    }
    
    /**
     * ハイライト用のspan要素を作成
     * @param {string} word - 語句
     * @param {Object} annotation - 注釈データ
     * @returns {string} HTML文字列
     */
    createHighlightedSpan(word, annotation) {
        const isLearned = this.learnedWords.has(annotation.word);
        const classes = ['annotated'];
        
        if (isLearned) {
            classes.push('learned');
        }
        
        const escapedWord = this.escapeHtml(word);
        const tooltip = annotation.reading ? 
            `${annotation.reading} - ${annotation.definition.substring(0, 50)}...` : 
            annotation.definition.substring(0, 50) + '...';
        
        return `<span class="${classes.join(' ')}" 
                      data-word="${this.escapeHtml(annotation.word)}"
                      data-tooltip="${this.escapeHtml(tooltip)}"
                      tabindex="0"
                      role="button"
                      aria-label="${escapedWord}の説明を表示">${escapedWord}</span>`;
    }
    
    /**
     * 重複する置換を除去
     * @param {Array} replacements - 置換情報の配列
     * @returns {Array} 重複を除去した配列
     */
    removeOverlappingReplacements(replacements) {
        if (replacements.length === 0) return [];
        
        // 開始位置でソート
        replacements.sort((a, b) => a.start - b.start);
        
        const result = [replacements[0]];
        
        for (let i = 1; i < replacements.length; i++) {
            const current = replacements[i];
            const last = result[result.length - 1];
            
            // 重複していない場合のみ追加
            if (current.start >= last.end) {
                result.push(current);
            }
        }
        
        return result;
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
    
    /**
     * 学習済み語句をStorageManagerから読み込み
     */
    loadLearnedWordsFromStorage() {
        if (this.storageManager) {
            const learnedData = this.storageManager.get(this.storageManager.KEYS.LEARNED_WORDS);
            if (learnedData) {
                this.learnedWords = new Set(learnedData.words || []);
                this.learnedWordDetails = new Map(
                    Object.entries(learnedData.wordDetails || {})
                );
            }
        } else {
            // フォールバック：LocalStorageから直接読み込み
            this.learnedWords = new Set(this.loadLearnedWords());
        }
    }
    
    /**
     * 学習済み語句を保存（StorageManager経由）
     */
    saveLearnedWords() {
        if (this.storageManager) {
            const wordDetails = {};
            this.learnedWordDetails.forEach((value, key) => {
                wordDetails[key] = value;
            });
            
            this.storageManager.set(this.storageManager.KEYS.LEARNED_WORDS, {
                words: [...this.learnedWords],
                wordDetails: wordDetails,
                count: this.learnedWords.size,
                lastUpdated: new Date().toISOString()
            });
        } else {
            // フォールバック：LocalStorageに直接保存
            try {
                localStorage.setItem('learnedWords', JSON.stringify([...this.learnedWords]));
            } catch (error) {
                console.error('学習済み語句の保存エラー:', error);
            }
        }
    }
}