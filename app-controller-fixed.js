// 文字化け修正のための関数を追加

/**
 * HTMLエスケープ処理
 */
function escapeHtml(text) {
    if (!text) return '';
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}

/**
 * 改善された禁則処理（HTMLエスケープ対応）
 */
function applyKinsokuProcessingFixed(text, rubyPositions = []) {
    // 行頭禁則文字（重複を削除）
    const lineStartProhibited = '、。，．）」』】〉》〕］｝〗〙〟ー';
    // 行末禁則文字（重複を削除）
    const lineEndProhibited = '（「『【〈《〔［｛〖〘〝';
    
    // 段落ごとに処理
    const paragraphs = text.split('\n').filter(p => p.trim());
    let globalPos = 0;
    
    const processedParagraphs = paragraphs.map(paragraph => {
        let processed = '';
        const chars = paragraph.split('');
        let localPos = 0;
        
        for (let i = 0; i < chars.length; i++) {
            const char = chars[i];
            const nextChar = chars[i + 1] || '';
            const currentGlobalPos = globalPos + localPos;
            
            // ルビがある位置かチェック
            const rubyInfo = rubyPositions.find(r => 
                r.start === currentGlobalPos
            );
            
            if (rubyInfo) {
                // ルビ部分を一括処理
                processed += `<ruby>${escapeHtml(rubyInfo.base)}<rt>${escapeHtml(rubyInfo.ruby)}</rt></ruby>`;
                i += rubyInfo.base.length - 1;
                localPos += rubyInfo.base.length;
            }
            // 現在の文字が行末禁則文字の場合
            else if (lineEndProhibited.includes(char) && nextChar) {
                processed += `<span class="no-wrap">${escapeHtml(char)}${escapeHtml(nextChar)}</span>`;
                i++;
                localPos += 2;
            }
            // 次の文字が行頭禁則文字の場合
            else if (lineStartProhibited.includes(nextChar) && char) {
                processed += `<span class="no-wrap">${escapeHtml(char)}${escapeHtml(nextChar)}</span>`;
                i++;
                localPos += 2;
            }
            else {
                processed += escapeHtml(char);
                localPos++;
            }
        }
        
        globalPos += paragraph.length + 1; // +1 for newline
        return `<p>${processed}</p>`;
    });
    
    return processedParagraphs.join('');
}

// グローバルに公開
if (typeof window !== 'undefined') {
    window.escapeHtml = escapeHtml;
    window.applyKinsokuProcessingFixed = applyKinsokuProcessingFixed;
}