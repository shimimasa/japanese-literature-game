/**
 * app-v2.js - AppControllerを使用した新しいメインエントリーポイント
 * 
 * このファイルはAppControllerを使用してアプリケーション全体を
 * 統合管理する新しいバージョンです。
 */

// グローバルなアプリケーションコントローラー
let appController = null;

// アプリケーション初期化
document.addEventListener('DOMContentLoaded', async () => {
    
    try {
        // AppControllerのインスタンス作成
        appController = new AppController();
        
        // デバッグモードの確認
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('debug') === 'true') {
            localStorage.setItem('debugMode', 'true');
        }
        
        // アプリケーション初期化
        await appController.initialize();
        
        // グローバルアクセス用（デバッグ用）
        if (appController.config.debugMode) {
            window.app = appController;
        }
        
        // ナビゲーションボタンのイベントリスナー設定
        setupNavigationListeners();
        
        // 設定に基づいてテーマを適用
        const settings = appController.loadSettings();
        if (settings.kidsMode) {
            document.body.classList.add('kids-theme');
        }
        
    } catch (error) {
        console.error('初期化エラー:', error);
        
        // エラー表示
        const errorContainer = document.createElement('div');
        errorContainer.className = 'error-message critical';
        errorContainer.innerHTML = `
            <h2>アプリケーションの起動に失敗しました</h2>
            <p>${error.message || 'Unknown error'}</p>
            <button onclick="location.reload()">再読み込み</button>
        `;
        document.body.appendChild(errorContainer);
    }
});

// ナビゲーションリスナーの設定
function setupNavigationListeners() {
    // ナビゲーションボタンのクリックイベント
    const navButtons = document.querySelectorAll('.nav-btn');
    navButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            const view = e.target.dataset.view;
            if (view && appController) {
                appController.showView(view);
            }
        });
    });
}

// ページ離脱時の処理
window.addEventListener('beforeunload', (e) => {
    if (appController && appController.state.currentView === 'reading') {
        // 読書中の場合は確認メッセージを表示
        e.preventDefault();
        e.returnValue = '読書中のデータが保存されていない可能性があります。';
    }
});
