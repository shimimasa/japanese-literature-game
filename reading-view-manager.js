/**
 * 読書ビューの管理を行うクラス
 * 読書画面の初期HTML要素を動的に管理
 */
class ReadingViewManager {
    constructor() {
        this.originalElements = null;
        this.isReading = false;
        this.hasBeenInitialized = false;
    }

    /**
     * 読書モードを開始
     */
    startReadingMode() {
        console.log('=== ReadingViewManager.startReadingMode called ===');
        const readingView = document.getElementById('reading-view');
        if (!readingView) {
            console.log('Reading view not found');
            return;
        }

        // 初期HTML要素を保存して削除（text-containerは除外）
        if (!this.hasBeenInitialized) {
            this.originalElements = [];
            const elementsToRemove = readingView.querySelectorAll(
                '.reading-header, .chapter-progress, .reading-time-display, .reading-navigation'
            );
            
            console.log('Saving and removing elements:', elementsToRemove.length);
            elementsToRemove.forEach(el => {
                // 要素の情報を保存
                this.originalElements.push({
                    element: el.cloneNode(true),
                    parent: el.parentNode,
                    nextSibling: el.nextSibling
                });
                // 要素を削除
                el.remove();
            });
            this.hasBeenInitialized = true;
        }

        // 読書モードフラグを設定
        this.isReading = true;
        document.body.classList.add('reading-mode');
    }

    /**
     * 読書モードを終了
     */
    endReadingMode() {
        console.log('=== ReadingViewManager.endReadingMode called ===');
        const readingView = document.getElementById('reading-view');
        if (!readingView) {
            console.log('Reading view not found');
            return;
        }

        // 保存した要素を復元
        if (this.originalElements && this.originalElements.length > 0) {
            console.log('Restoring original elements:', this.originalElements.length);
            this.originalElements.forEach((item, index) => {
                console.log(`  Restoring ${index}: ${item.element.className}`);
                try {
                    if (item.nextSibling && item.nextSibling.parentNode) {
                        item.parent.insertBefore(item.element, item.nextSibling);
                    } else {
                        item.parent.appendChild(item.element);
                    }
                } catch (e) {
                    console.error('Failed to restore element:', e);
                }
            });
            // 保存した要素をクリア
            this.originalElements = null;
        } else {
            console.log('No original elements to restore');
        }

        // text-containerをクリア
        const textContainer = document.getElementById('text-container');
        if (textContainer) {
            console.log('Clearing text-container, current children:', textContainer.children.length);
            textContainer.innerHTML = '';
            textContainer.removeAttribute('style');
            console.log('After clear, children:', textContainer.children.length);
        } else {
            console.log('text-container not found!');
        }

        // 読書ビュー内の動的要素も削除
        const dynamicElements = readingView.querySelectorAll('.book-header, .book-content-wrapper, .back-button');
        console.log('Removing dynamic elements:', dynamicElements.length);
        dynamicElements.forEach(el => el.remove());

        // 読書モードフラグを解除
        this.isReading = false;
        document.body.classList.remove('reading-mode');
        console.log('=== ReadingViewManager.endReadingMode completed ===');
    }

    /**
     * 読書モードかどうかを取得
     */
    isInReadingMode() {
        return this.isReading;
    }
}

// グローバルインスタンスを作成
window.readingViewManager = new ReadingViewManager();