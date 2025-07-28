/**
 * シンプルな本文表示実装（全文表示テスト用）
 */
function displayBookContentSimple(container, book) {
    if (!book || !container) {
        console.error('本またはコンテナが見つかりません');
        return;
    }
    
    // 読書モードを開始（初期HTML要素を削除）
    if (window.readingViewManager) {
        window.readingViewManager.startReadingMode();
    }
    
    // コンテナをクリア
    container.innerHTML = '';
    
    // 本文コンテナラッパー
    const contentWrapper = document.createElement('div');
    contentWrapper.className = 'book-content-wrapper';
    
    const content = document.createElement('div');
    content.className = 'book-content vertical-text';
    
    // 全テキストを収集（シンプルに）
    let fullText = '';
    let lineCount = 0;
    
    // 旧形式
    if (Array.isArray(book.content)) {
        console.log('旧形式のコンテンツを処理');
        book.content.forEach(chapter => {
            if (chapter && chapter.text) {
                fullText += chapter.text + '\n\n';
            }
        });
    }
    // 新形式
    else if (book.content && book.content.lines) {
        console.log('新形式のコンテンツを処理');
        console.log('総ライン数:', book.content.lines.length);
        
        book.content.lines.forEach((line, index) => {
            lineCount++;
            if (line.segments) {
                line.segments.forEach(segment => {
                    if (segment.type === 'text' && segment.content) {
                        fullText += segment.content;
                    } else if (segment.type === 'ruby' && segment.base) {
                        // ルビは一旦ベーステキストのみ
                        fullText += segment.base;
                    }
                });
            }
            // 改行を追加
            fullText += '\n';
        });
    }
    
    console.log('処理したライン数:', lineCount);
    console.log('全テキスト長:', fullText.length);
    console.log('最初の500文字:', fullText.substring(0, 500));
    console.log('最後の500文字:', fullText.substring(fullText.length - 500));
    
    // テキストを一つの大きな段落として表示
    const textDiv = document.createElement('div');
    textDiv.style.cssText = `
        white-space: pre-wrap;
        display: inline-block;
        vertical-align: top;
        padding-right: 40px;
    `;
    textDiv.textContent = fullText;
    
    // 要素を組み立て
    content.appendChild(textDiv);
    contentWrapper.appendChild(content);
    container.appendChild(contentWrapper);
    
    // スクロール位置をリセット
    contentWrapper.scrollLeft = 0;
    
    // ESCキーで作品一覧に戻る
    const handleEscape = (e) => {
        if (e.key === 'Escape') {
            console.log('ESC key pressed - returning to library');
            
            // 読書モードを終了
            if (window.readingViewManager) {
                window.readingViewManager.endReadingMode();
            }
            
            if (window.appController) {
                window.appController.showView('library');
            }
            
            // イベントリスナーを削除
            document.removeEventListener('keydown', handleEscape);
        }
    };
    
    // ESCキーのイベントリスナーを追加
    document.addEventListener('keydown', handleEscape);
    
    // 追加コンテンツは生成しない（全画面表示のため）
    
    // レイアウトを強制的に再計算
    setTimeout(() => {
        // 強制的にリフロー
        container.style.display = 'none';
        container.offsetHeight; // リフローをトリガー
        container.style.display = '';
        
        // 縦書きコンテンツの幅を再計算
        if (content) {
            const computedWidth = content.scrollWidth;
            console.log('再計算後のコンテンツ幅:', computedWidth);
            
            // スクロールバーを表示
            content.scrollLeft = 0;
        }
    }, 10);
    
    console.log('シンプル表示完了');
    console.log('コンテンツ幅:', content.scrollWidth);
    console.log('表示幅:', content.clientWidth);
    
    // グローバルにappControllerを保存
    window.appController = window.appController || { showView: () => {} };
}

// グローバルに公開
if (typeof window !== 'undefined') {
    window.displayBookContentSimple = displayBookContentSimple;
}