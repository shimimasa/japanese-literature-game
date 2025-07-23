/**
 * オンボーディングフロー管理
 * 初回起動時のユーザーガイダンスとチュートリアル
 */

class OnboardingFlow {
    constructor() {
        this.currentStep = 0;
        this.steps = [
            {
                id: 'welcome',
                title: 'ようこそ！',
                content: '日本名作文学読解ゲームへようこそ！\nこのアプリでは、日本の名作を楽しく読みながら、語句を学習できます。',
                image: 'welcome-illustration',
                action: null
            },
            {
                id: 'vertical-text',
                title: '縦書きで読もう',
                content: '日本の文学作品は縦書きで表示されます。\n右から左へスワイプしてページをめくります。',
                image: 'vertical-text-demo',
                action: 'showVerticalTextDemo'
            },
            {
                id: 'word-learning',
                title: '語句を学習しよう',
                content: '難しい語句をタップすると、読み方と意味が表示されます。\n学習するとポイントがもらえます！',
                image: 'word-popup-demo',
                action: 'showWordPopupDemo'
            },
            {
                id: 'progress-tracking',
                title: '進捗を確認しよう',
                content: '読書の進捗やポイント、アチーブメントを確認できます。\n毎日読書を続けて、レベルアップしましょう！',
                image: 'progress-demo',
                action: 'showProgressDemo'
            },
            {
                id: 'personalization',
                title: '自分好みに設定',
                content: '文字サイズや背景色を自分好みに設定できます。\n快適な読書環境を作りましょう。',
                image: 'settings-demo',
                action: 'showSettingsDemo'
            },
            {
                id: 'ready',
                title: '準備完了！',
                content: 'それでは、日本の名作文学の世界を楽しみましょう！\n最初の作品を選んでみてください。',
                image: 'ready-illustration',
                action: 'completeOnboarding'
            }
        ];
        
        this.isCompleted = false;
        this.onComplete = null;
    }

    /**
     * オンボーディングの開始
     */
    start() {
        // オンボーディング完了フラグをチェック
        if (localStorage.getItem('onboardingCompleted') === 'true') {
            this.isCompleted = true;
            if (this.onComplete) {
                this.onComplete();
            }
            return;
        }

        this.currentStep = 0;
        this.createOnboardingUI();
        this.showStep(0);
    }

    /**
     * オンボーディングUIの作成
     */
    createOnboardingUI() {
        // オーバーレイの作成
        const overlay = document.createElement('div');
        overlay.id = 'onboarding-overlay';
        overlay.className = 'onboarding-overlay';
        
        // コンテナの作成
        const container = document.createElement('div');
        container.className = 'onboarding-container';
        
        // コンテンツエリア
        const content = document.createElement('div');
        content.className = 'onboarding-content';
        content.innerHTML = `
            <div class="onboarding-illustration">
                <img id="onboarding-image" src="" alt="">
            </div>
            <h2 id="onboarding-title" class="onboarding-title"></h2>
            <p id="onboarding-text" class="onboarding-text"></p>
            <div id="onboarding-demo" class="onboarding-demo"></div>
        `;
        
        // ナビゲーション
        const navigation = document.createElement('div');
        navigation.className = 'onboarding-navigation';
        navigation.innerHTML = `
            <div class="onboarding-progress">
                ${this.steps.map((_, index) => 
                    `<div class="progress-dot" data-step="${index}"></div>`
                ).join('')}
            </div>
            <div class="onboarding-buttons">
                <button id="onboarding-skip" class="btn-text">スキップ</button>
                <button id="onboarding-prev" class="btn-secondary">前へ</button>
                <button id="onboarding-next" class="btn-primary">次へ</button>
            </div>
        `;
        
        container.appendChild(content);
        container.appendChild(navigation);
        overlay.appendChild(container);
        document.body.appendChild(overlay);
        
        // イベントリスナーの設定
        this.setupEventListeners();
    }

    /**
     * イベントリスナーの設定
     */
    setupEventListeners() {
        document.getElementById('onboarding-next').addEventListener('click', () => {
            this.nextStep();
        });
        
        document.getElementById('onboarding-prev').addEventListener('click', () => {
            this.previousStep();
        });
        
        document.getElementById('onboarding-skip').addEventListener('click', () => {
            if (confirm('チュートリアルをスキップしますか？\n後で設定から確認できます。')) {
                this.complete();
            }
        });
        
        // キーボードナビゲーション
        document.addEventListener('keydown', this.handleKeyPress);
    }

    /**
     * キーボード操作の処理
     */
    handleKeyPress = (e) => {
        if (!document.getElementById('onboarding-overlay')) return;
        
        switch (e.key) {
            case 'ArrowRight':
            case 'Enter':
                this.nextStep();
                break;
            case 'ArrowLeft':
                this.previousStep();
                break;
            case 'Escape':
                document.getElementById('onboarding-skip').click();
                break;
        }
    }

    /**
     * ステップの表示
     */
    showStep(stepIndex) {
        const step = this.steps[stepIndex];
        if (!step) return;
        
        // コンテンツの更新
        document.getElementById('onboarding-title').textContent = step.title;
        document.getElementById('onboarding-text').textContent = step.content;
        
        // 画像の更新（プレースホルダー）
        const image = document.getElementById('onboarding-image');
        image.src = `assets/onboarding/${step.image}.png`;
        image.alt = step.title;
        
        // デモエリアのクリア
        const demoArea = document.getElementById('onboarding-demo');
        demoArea.innerHTML = '';
        
        // ステップ固有のアクション実行
        if (step.action && typeof this[step.action] === 'function') {
            this[step.action](demoArea);
        }
        
        // 進捗ドットの更新
        document.querySelectorAll('.progress-dot').forEach((dot, index) => {
            dot.classList.toggle('active', index === stepIndex);
            dot.classList.toggle('completed', index < stepIndex);
        });
        
        // ボタンの表示制御
        const prevBtn = document.getElementById('onboarding-prev');
        const nextBtn = document.getElementById('onboarding-next');
        const skipBtn = document.getElementById('onboarding-skip');
        
        prevBtn.style.display = stepIndex === 0 ? 'none' : 'block';
        nextBtn.textContent = stepIndex === this.steps.length - 1 ? '始める' : '次へ';
        skipBtn.style.display = stepIndex === this.steps.length - 1 ? 'none' : 'block';
        
        this.currentStep = stepIndex;
    }

    /**
     * 次のステップへ
     */
    nextStep() {
        if (this.currentStep < this.steps.length - 1) {
            this.showStep(this.currentStep + 1);
        } else {
            this.complete();
        }
    }

    /**
     * 前のステップへ
     */
    previousStep() {
        if (this.currentStep > 0) {
            this.showStep(this.currentStep - 1);
        }
    }

    /**
     * 縦書きテキストのデモ表示
     */
    showVerticalTextDemo(container) {
        const demo = document.createElement('div');
        demo.className = 'vertical-text-demo';
        demo.innerHTML = `
            <div class="demo-text vertical-rl">
                <p>吾輩は猫である。<br>名前はまだ無い。</p>
            </div>
            <div class="demo-instruction">
                <span class="gesture-icon">👉</span>
                <span>右から左へスワイプ</span>
            </div>
        `;
        container.appendChild(demo);
        
        // アニメーション
        setTimeout(() => {
            demo.querySelector('.gesture-icon').classList.add('animate-swipe');
        }, 500);
    }

    /**
     * 語句ポップアップのデモ表示
     */
    showWordPopupDemo(container) {
        const demo = document.createElement('div');
        demo.className = 'word-popup-demo';
        demo.innerHTML = `
            <div class="demo-sentence">
                <span class="clickable-word highlighted">吾輩</span>は猫である。
            </div>
            <div class="mini-popup">
                <p class="popup-reading">わがはい</p>
                <p class="popup-meaning">自分のことを偉そうに言う言葉</p>
                <p class="popup-points">+10ポイント！</p>
            </div>
        `;
        container.appendChild(demo);
        
        // クリックデモ
        const word = demo.querySelector('.clickable-word');
        const popup = demo.querySelector('.mini-popup');
        
        word.addEventListener('click', () => {
            popup.classList.add('show');
            setTimeout(() => {
                popup.classList.remove('show');
            }, 2000);
        });
    }

    /**
     * 進捗表示のデモ
     */
    showProgressDemo(container) {
        const demo = document.createElement('div');
        demo.className = 'progress-demo';
        demo.innerHTML = `
            <div class="demo-stats">
                <div class="stat-item">
                    <span class="stat-icon">📚</span>
                    <span class="stat-label">完読作品</span>
                    <span class="stat-value">3冊</span>
                </div>
                <div class="stat-item">
                    <span class="stat-icon">⏱️</span>
                    <span class="stat-label">読書時間</span>
                    <span class="stat-value">5時間</span>
                </div>
                <div class="stat-item">
                    <span class="stat-icon">🏆</span>
                    <span class="stat-label">ポイント</span>
                    <span class="stat-value">250pt</span>
                </div>
            </div>
            <div class="demo-achievement">
                <span class="achievement-icon">🎖️</span>
                <span>「読書家」アチーブメント獲得！</span>
            </div>
        `;
        container.appendChild(demo);
        
        // アニメーション
        setTimeout(() => {
            demo.querySelector('.demo-achievement').classList.add('animate-bounce');
        }, 500);
    }

    /**
     * 設定画面のデモ
     */
    showSettingsDemo(container) {
        const demo = document.createElement('div');
        demo.className = 'settings-demo';
        demo.innerHTML = `
            <div class="demo-settings">
                <div class="setting-row">
                    <label>文字サイズ</label>
                    <input type="range" min="12" max="24" value="16" class="demo-slider">
                    <span class="demo-value">16px</span>
                </div>
                <div class="setting-row">
                    <label>背景色</label>
                    <div class="color-options-demo">
                        <button class="color-btn" style="background: white;"></button>
                        <button class="color-btn active" style="background: #FFF8DC;"></button>
                        <button class="color-btn" style="background: #E8F5E9;"></button>
                    </div>
                </div>
            </div>
            <p class="demo-hint">自分に合った設定で快適に読書！</p>
        `;
        container.appendChild(demo);
        
        // インタラクション
        const slider = demo.querySelector('.demo-slider');
        const value = demo.querySelector('.demo-value');
        slider.addEventListener('input', (e) => {
            value.textContent = `${e.target.value}px`;
        });
    }

    /**
     * オンボーディング完了処理
     */
    completeOnboarding() {
        // 推奨設定の適用
        this.applyRecommendedSettings();
        this.complete();
    }

    /**
     * 推奨設定の適用
     */
    applyRecommendedSettings() {
        // 初回ユーザー向けの推奨設定
        const recommendedSettings = {
            fontSize: 16,
            lineHeight: 1.8,
            backgroundColor: 'cream',
            soundEnabled: true,
            showTutorialHints: true
        };
        
        // 既存の設定がない場合のみ適用
        const currentSettings = localStorage.getItem('userSettings');
        if (!currentSettings) {
            localStorage.setItem('userSettings', JSON.stringify(recommendedSettings));
        }
    }

    /**
     * オンボーディング完了
     */
    complete() {
        // 完了フラグを保存
        localStorage.setItem('onboardingCompleted', 'true');
        localStorage.setItem('onboardingDate', new Date().toISOString());
        
        // UIの削除
        const overlay = document.getElementById('onboarding-overlay');
        if (overlay) {
            overlay.classList.add('fade-out');
            setTimeout(() => {
                overlay.remove();
            }, 300);
        }
        
        // イベントリスナーの削除
        document.removeEventListener('keydown', this.handleKeyPress);
        
        // 完了コールバック
        this.isCompleted = true;
        if (this.onComplete) {
            this.onComplete();
        }
    }

    /**
     * オンボーディングのリセット（デバッグ用）
     */
    reset() {
        localStorage.removeItem('onboardingCompleted');
        localStorage.removeItem('onboardingDate');
        this.isCompleted = false;
        this.currentStep = 0;
    }
}