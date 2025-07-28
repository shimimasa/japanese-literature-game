/**
 * ビュー切り替えのデバッグ用コード
 */

// 元のshowViewメソッドをラップしてデバッグ情報を出力
if (window.AppController) {
    const originalShowView = window.AppController.prototype.showView;
    window.AppController.prototype.showView = function(viewName) {
        console.log('=== showView called ===');
        console.log('Target view:', viewName);
        
        // 現在の状態を確認
        console.log('Current body classes:', document.body.className);
        console.log('Reading view active?', document.getElementById('reading-view').classList.contains('active'));
        
        // reading-view内の要素を確認
        const readingView = document.getElementById('reading-view');
        if (readingView) {
            console.log('Elements in reading-view:');
            readingView.childNodes.forEach((node, index) => {
                if (node.nodeType === 1) { // Element node
                    console.log(`  ${index}: ${node.tagName}.${node.className}`);
                    // 子要素も確認
                    if (node.id === 'text-container' && node.children.length > 0) {
                        console.log('    text-container children:');
                        Array.from(node.children).forEach((child, idx) => {
                            console.log(`      ${idx}: ${child.tagName}.${child.className}`);
                        });
                    }
                }
            });
        }
        
        // text-container内の要素を確認
        const textContainer = document.getElementById('text-container');
        if (textContainer) {
            console.log('Elements in text-container:');
            textContainer.childNodes.forEach((node, index) => {
                if (node.nodeType === 1) { // Element node
                    console.log(`  ${index}: ${node.tagName}.${node.className}`);
                }
            });
        }
        
        // 元のメソッドを呼び出し
        const result = originalShowView.call(this, viewName);
        
        console.log('=== After showView ===');
        console.log('Body classes:', document.body.className);
        console.log('Reading view active?', document.getElementById('reading-view').classList.contains('active'));
        
        return result;
    };
}

// cleanupReadingViewのデバッグ
if (window.AppController) {
    const originalCleanup = window.AppController.prototype.cleanupReadingView;
    window.AppController.prototype.cleanupReadingView = function() {
        console.log('=== cleanupReadingView called ===');
        
        // 削除前の状態
        const readingView = document.getElementById('reading-view');
        if (readingView) {
            console.log('Before cleanup - Elements in reading-view:', readingView.children.length);
        }
        
        // 元のメソッドを呼び出し
        const result = originalCleanup.call(this);
        
        // 削除後の状態
        if (readingView) {
            console.log('After cleanup - Elements in reading-view:', readingView.children.length);
            // 残っている要素を詳しく確認
            Array.from(readingView.children).forEach((child, index) => {
                console.log(`  Remaining ${index}: ${child.tagName}.${child.className}`);
            });
        }
        
        return result;
    };
}

// DOMの変更を監視
const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
        if (mutation.type === 'childList' && mutation.target.id === 'reading-view') {
            console.log('=== Reading view DOM changed ===');
            mutation.addedNodes.forEach(node => {
                if (node.nodeType === 1) {
                    console.log('Added:', node.tagName, node.className);
                }
            });
            mutation.removedNodes.forEach(node => {
                if (node.nodeType === 1) {
                    console.log('Removed:', node.tagName, node.className);
                }
            });
        }
    });
});

// 監視開始
const readingView = document.getElementById('reading-view');
if (readingView) {
    observer.observe(readingView, { childList: true, subtree: true });
}

console.log('Debug script loaded. Monitoring view switches...');