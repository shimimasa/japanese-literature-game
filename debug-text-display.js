// デバッグ用：テキスト表示の問題を診断

function debugTextDisplay() {
    const textContainer = document.getElementById('text-container');
    const bookContent = document.querySelector('.book-content.vertical-text');
    const paragraphs = document.querySelectorAll('.vertical-text p');
    
    console.log('=== テキスト表示デバッグ情報 ===');
    
    // コンテナのサイズ
    if (textContainer) {
        console.log('テキストコンテナ:', {
            width: textContainer.offsetWidth,
            height: textContainer.offsetHeight,
            scrollWidth: textContainer.scrollWidth,
            scrollHeight: textContainer.scrollHeight
        });
    }
    
    // 本文コンテンツのサイズ
    if (bookContent) {
        console.log('本文コンテンツ:', {
            width: bookContent.offsetWidth,
            height: bookContent.offsetHeight,
            scrollWidth: bookContent.scrollWidth,
            scrollHeight: bookContent.scrollHeight,
            overflow: window.getComputedStyle(bookContent).overflow,
            overflowX: window.getComputedStyle(bookContent).overflowX,
            overflowY: window.getComputedStyle(bookContent).overflowY
        });
    }
    
    // 段落の情報
    console.log('段落数:', paragraphs.length);
    paragraphs.forEach((p, index) => {
        console.log(`段落${index + 1}:`, {
            text: p.textContent.substring(0, 50) + '...',
            width: p.offsetWidth,
            height: p.offsetHeight,
            computedHeight: window.getComputedStyle(p).height
        });
    });
    
    // 全テキストの長さ
    const fullText = Array.from(paragraphs).map(p => p.textContent).join('\n');
    console.log('全テキスト長:', fullText.length);
    console.log('最後の100文字:', fullText.substring(fullText.length - 100));
}

// 簡易的なテキスト表示テスト
function testSimpleTextDisplay() {
    const bookContent = document.querySelector('.book-content.vertical-text');
    if (!bookContent) {
        console.error('本文コンテンツが見つかりません');
        return;
    }
    
    // 現在の内容を保存
    const originalContent = bookContent.innerHTML;
    
    // テスト用の長いテキストを挿入
    const testText = [];
    for (let i = 1; i <= 50; i++) {
        testText.push(`<p>これはテスト段落${i}です。縦書きで正しく表示されるか確認しています。</p>`);
    }
    
    bookContent.innerHTML = testText.join('');
    console.log('テスト段落を50個挿入しました');
    
    // 5秒後に元に戻す
    setTimeout(() => {
        bookContent.innerHTML = originalContent;
        console.log('元のコンテンツに戻しました');
    }, 5000);
}

// グローバルに公開
if (typeof window !== 'undefined') {
    window.debugTextDisplay = debugTextDisplay;
    window.testSimpleTextDisplay = testSimpleTextDisplay;
}