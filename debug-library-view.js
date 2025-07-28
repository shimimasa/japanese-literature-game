/**
 * 作品一覧画面のデバッグ
 */

// 定期的にビューの状態を確認
setInterval(() => {
    const libraryView = document.getElementById('library-view');
    const readingView = document.getElementById('reading-view');
    
    if (libraryView && libraryView.classList.contains('active')) {
        // 作品一覧画面がアクティブの時
        const visibleElements = document.querySelectorAll('body *');
        const suspiciousElements = [];
        
        visibleElements.forEach(el => {
            const rect = el.getBoundingClientRect();
            const text = el.textContent || '';
            
            // 画面に表示されていて、疑わしいテキストを含む要素を探す
            if (rect.top >= 0 && rect.top < window.innerHeight && 
                rect.width > 0 && rect.height > 0) {
                
                // 読書ビュー関連のテキストや要素を探す
                if (text.includes('作品一覧') || 
                    text.includes('← 作品一覧') ||
                    text.includes('桃太郎') ||  // 直前に読んでいた作品
                    el.classList.contains('book-header') || 
                    el.classList.contains('book-content-wrapper') ||
                    el.classList.contains('back-button') ||
                    el.classList.contains('author-name')) {
                    
                    suspiciousElements.push({
                        element: el,
                        tagName: el.tagName,
                        className: el.className,
                        id: el.id,
                        text: text.substring(0, 50).replace(/\n/g, ' '),
                        parent: el.parentElement ? `${el.parentElement.tagName}#${el.parentElement.id || ''}${el.parentElement.className || ''}` : 'no parent',
                        rect: {top: rect.top, left: rect.left, width: rect.width, height: rect.height},
                        display: window.getComputedStyle(el).display,
                        visibility: window.getComputedStyle(el).visibility,
                        position: window.getComputedStyle(el).position,
                        zIndex: window.getComputedStyle(el).zIndex
                    });
                }
            }
        });
        
        if (suspiciousElements.length > 0) {
            console.log('=== Suspicious elements found in library view ===');
            suspiciousElements.forEach(item => {
                console.log('Element:', item);
            });
        }
    }
}, 2000); // 2秒ごとにチェック