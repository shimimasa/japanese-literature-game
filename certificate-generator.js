/**
 * certificate-generator.js - 完読証明書生成
 * 
 * HTML5 Canvasを使用して美しい完読証明書を生成し、
 * PNG画像やPDFとして出力する機能を提供します。
 */

export class CertificateGenerator {
    constructor() {
        // Canvas設定
        this.canvasWidth = 800;
        this.canvasHeight = 600;
        this.canvas = null;
        this.ctx = null;
        
        // デザイン設定
        this.colors = {
            primary: '#2c3e50',
            secondary: '#3498db',
            accent: '#f39c12',
            background: '#ffffff',
            text: '#333333',
            border: '#d4af37', // ゴールド
            shadow: 'rgba(0, 0, 0, 0.1)'
        };
        
        // フォント設定
        this.fonts = {
            title: 'bold 48px "Hiragino Mincho ProN", "Yu Mincho", serif',
            subtitle: 'bold 24px "Hiragino Sans", sans-serif',
            body: '18px "Hiragino Sans", sans-serif',
            small: '14px "Hiragino Sans", sans-serif'
        };
        
        // 装飾パターン
        this.patterns = {
            borderWidth: 20,
            cornerRadius: 30,
            stampSize: 120
        };
    }
    
    /**
     * 証明書を生成
     * @param {Object} data - 証明書データ
     * @returns {HTMLCanvasElement} 生成されたキャンバス
     */
    generateCertificate(data) {
        // Canvasの作成
        this.canvas = document.createElement('canvas');
        this.canvas.width = this.canvasWidth;
        this.canvas.height = this.canvasHeight;
        this.ctx = this.canvas.getContext('2d');
        
        // 背景の描画
        this.drawBackground();
        
        // 装飾的な枠線
        this.drawDecorativeBorder();
        
        // タイトル
        this.drawTitle();
        
        // 本文
        this.drawContent(data);
        
        // スタンプ風の装飾
        this.drawStamp(data.completedDate);
        
        // 装飾的な要素
        this.drawDecorations();
        
        return this.canvas;
    }
    
    /**
     * 背景を描画
     */
    drawBackground() {
        // グラデーション背景
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvasHeight);
        gradient.addColorStop(0, '#ffffff');
        gradient.addColorStop(1, '#f9f9f9');
        
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);
        
        // 透かし模様
        this.ctx.save();
        this.ctx.globalAlpha = 0.05;
        this.ctx.fillStyle = this.colors.accent;
        
        // 和柄風の模様
        for (let i = 0; i < 10; i++) {
            for (let j = 0; j < 10; j++) {
                const x = i * 100 - 50;
                const y = j * 100 - 50;
                this.drawSakuraPattern(x, y, 30);
            }
        }
        
        this.ctx.restore();
    }
    
    /**
     * 装飾的な枠線を描画
     */
    drawDecorativeBorder() {
        const borderWidth = this.patterns.borderWidth;
        const cornerRadius = this.patterns.cornerRadius;
        
        // 外側の枠
        this.ctx.strokeStyle = this.colors.border;
        this.ctx.lineWidth = 3;
        this.drawRoundedRect(
            borderWidth,
            borderWidth,
            this.canvasWidth - borderWidth * 2,
            this.canvasHeight - borderWidth * 2,
            cornerRadius
        );
        
        // 内側の枠
        this.ctx.strokeStyle = this.colors.border;
        this.ctx.lineWidth = 1;
        this.drawRoundedRect(
            borderWidth + 10,
            borderWidth + 10,
            this.canvasWidth - (borderWidth + 10) * 2,
            this.canvasHeight - (borderWidth + 10) * 2,
            cornerRadius - 5
        );
        
        // コーナー装飾
        this.drawCornerDecorations();
    }
    
    /**
     * タイトルを描画
     */
    drawTitle() {
        this.ctx.save();
        
        // タイトル背景
        const titleY = 80;
        this.ctx.fillStyle = this.colors.accent;
        this.ctx.fillRect(200, titleY - 30, 400, 60);
        
        // タイトルテキスト
        this.ctx.font = this.fonts.title;
        this.ctx.fillStyle = this.colors.background;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText('完読証明書', this.canvasWidth / 2, titleY);
        
        // サブタイトル
        this.ctx.font = this.fonts.small;
        this.ctx.fillStyle = this.colors.text;
        this.ctx.fillText('Certificate of Completion', this.canvasWidth / 2, titleY + 40);
        
        this.ctx.restore();
    }
    
    /**
     * 本文を描画
     * @param {Object} data - 証明書データ
     */
    drawContent(data) {
        this.ctx.save();
        
        const centerX = this.canvasWidth / 2;
        let currentY = 200;
        
        // 作品名
        this.ctx.font = this.fonts.subtitle;
        this.ctx.fillStyle = this.colors.primary;
        this.ctx.textAlign = 'center';
        this.ctx.fillText(`『${data.title}』`, centerX, currentY);
        currentY += 40;
        
        // 作者名
        this.ctx.font = this.fonts.body;
        this.ctx.fillStyle = this.colors.text;
        this.ctx.fillText(`作者：${data.author}`, centerX, currentY);
        currentY += 60;
        
        // 完読メッセージ
        this.ctx.font = this.fonts.body;
        this.ctx.fillText('上記の作品を完読されたことを', centerX, currentY);
        currentY += 30;
        this.ctx.fillText('ここに証明いたします', centerX, currentY);
        currentY += 60;
        
        // 詳細情報
        this.ctx.font = this.fonts.body;
        this.ctx.textAlign = 'left';
        
        const detailsX = 250;
        const lineHeight = 30;
        
        // 完読日
        this.ctx.fillText(`完読日：${this.formatDate(data.completedDate)}`, detailsX, currentY);
        currentY += lineHeight;
        
        // 読書時間
        const hours = Math.floor(data.readingTime / 3600);
        const minutes = Math.floor((data.readingTime % 3600) / 60);
        const timeText = hours > 0 ? `${hours}時間${minutes}分` : `${minutes}分`;
        this.ctx.fillText(`読書時間：${timeText}`, detailsX, currentY);
        currentY += lineHeight;
        
        // 学習語句
        this.ctx.fillText(`学習語句：${data.wordsLearned}語`, detailsX, currentY);
        currentY += lineHeight;
        
        // 獲得ポイント
        this.ctx.fillText(`獲得ポイント：${data.points}ポイント`, detailsX, currentY);
        
        this.ctx.restore();
    }
    
    /**
     * スタンプ風の装飾を描画
     * @param {string} date - 完読日
     */
    drawStamp(date) {
        this.ctx.save();
        
        const stampX = this.canvasWidth - 150;
        const stampY = this.canvasHeight - 150;
        const radius = this.patterns.stampSize / 2;
        
        // スタンプの円
        this.ctx.beginPath();
        this.ctx.arc(stampX, stampY, radius, 0, Math.PI * 2);
        this.ctx.fillStyle = this.colors.danger || '#e74c3c';
        this.ctx.fill();
        
        // スタンプの文字
        this.ctx.fillStyle = this.colors.background;
        this.ctx.font = 'bold 24px serif';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        
        // 「完読」の文字
        this.ctx.fillText('完読', stampX, stampY - 15);
        
        // 日付
        this.ctx.font = '14px sans-serif';
        const dateStr = new Date(date).toLocaleDateString('ja-JP', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        }).replace(/\//g, '.');
        this.ctx.fillText(dateStr, stampX, stampY + 15);
        
        this.ctx.restore();
    }
    
    /**
     * 装飾的な要素を描画
     */
    drawDecorations() {
        // 左上の装飾
        this.drawRibbon(50, 50, 'left');
        
        // 右上の装飾
        this.drawRibbon(this.canvasWidth - 50, 50, 'right');
    }
    
    /**
     * リボン装飾を描画
     * @param {number} x - X座標
     * @param {number} y - Y座標
     * @param {string} direction - 方向
     */
    drawRibbon(x, y, direction) {
        this.ctx.save();
        
        this.ctx.fillStyle = this.colors.accent;
        this.ctx.beginPath();
        
        if (direction === 'left') {
            this.ctx.moveTo(x, y);
            this.ctx.lineTo(x + 40, y);
            this.ctx.lineTo(x + 40, y + 80);
            this.ctx.lineTo(x + 20, y + 60);
            this.ctx.lineTo(x, y + 80);
        } else {
            this.ctx.moveTo(x, y);
            this.ctx.lineTo(x - 40, y);
            this.ctx.lineTo(x - 40, y + 80);
            this.ctx.lineTo(x - 20, y + 60);
            this.ctx.lineTo(x, y + 80);
        }
        
        this.ctx.closePath();
        this.ctx.fill();
        
        this.ctx.restore();
    }
    
    /**
     * コーナー装飾を描画
     */
    drawCornerDecorations() {
        const cornerSize = 40;
        const margin = this.patterns.borderWidth;
        
        this.ctx.strokeStyle = this.colors.border;
        this.ctx.lineWidth = 2;
        
        // 左上
        this.drawCornerPattern(margin, margin, cornerSize, 'tl');
        
        // 右上
        this.drawCornerPattern(
            this.canvasWidth - margin - cornerSize,
            margin,
            cornerSize,
            'tr'
        );
        
        // 左下
        this.drawCornerPattern(
            margin,
            this.canvasHeight - margin - cornerSize,
            cornerSize,
            'bl'
        );
        
        // 右下
        this.drawCornerPattern(
            this.canvasWidth - margin - cornerSize,
            this.canvasHeight - margin - cornerSize,
            cornerSize,
            'br'
        );
    }
    
    /**
     * コーナーパターンを描画
     * @param {number} x - X座標
     * @param {number} y - Y座標
     * @param {number} size - サイズ
     * @param {string} corner - コーナー位置
     */
    drawCornerPattern(x, y, size, corner) {
        this.ctx.beginPath();
        
        switch (corner) {
            case 'tl': // Top Left
                this.ctx.moveTo(x + size, y);
                this.ctx.lineTo(x, y);
                this.ctx.lineTo(x, y + size);
                break;
            case 'tr': // Top Right
                this.ctx.moveTo(x, y);
                this.ctx.lineTo(x + size, y);
                this.ctx.lineTo(x + size, y + size);
                break;
            case 'bl': // Bottom Left
                this.ctx.moveTo(x, y);
                this.ctx.lineTo(x, y + size);
                this.ctx.lineTo(x + size, y + size);
                break;
            case 'br': // Bottom Right
                this.ctx.moveTo(x + size, y);
                this.ctx.lineTo(x + size, y + size);
                this.ctx.lineTo(x, y + size);
                break;
        }
        
        this.ctx.stroke();
    }
    
    /**
     * 角丸矩形を描画
     */
    drawRoundedRect(x, y, width, height, radius) {
        this.ctx.beginPath();
        this.ctx.moveTo(x + radius, y);
        this.ctx.lineTo(x + width - radius, y);
        this.ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        this.ctx.lineTo(x + width, y + height - radius);
        this.ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        this.ctx.lineTo(x + radius, y + height);
        this.ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        this.ctx.lineTo(x, y + radius);
        this.ctx.quadraticCurveTo(x, y, x + radius, y);
        this.ctx.closePath();
        this.ctx.stroke();
    }
    
    /**
     * 桜模様を描画
     * @param {number} x - X座標
     * @param {number} y - Y座標
     * @param {number} size - サイズ
     */
    drawSakuraPattern(x, y, size) {
        const petalCount = 5;
        const angleStep = (Math.PI * 2) / petalCount;
        
        this.ctx.beginPath();
        
        for (let i = 0; i < petalCount; i++) {
            const angle = i * angleStep;
            const petalX = x + Math.cos(angle) * size;
            const petalY = y + Math.sin(angle) * size;
            
            this.ctx.moveTo(x, y);
            this.ctx.quadraticCurveTo(
                x + Math.cos(angle - angleStep / 4) * size * 0.7,
                y + Math.sin(angle - angleStep / 4) * size * 0.7,
                petalX,
                petalY
            );
            this.ctx.quadraticCurveTo(
                x + Math.cos(angle + angleStep / 4) * size * 0.7,
                y + Math.sin(angle + angleStep / 4) * size * 0.7,
                x,
                y
            );
        }
        
        this.ctx.fill();
    }
    
    /**
     * 日付をフォーマット
     * @param {string} dateStr - 日付文字列
     * @returns {string} フォーマット済み日付
     */
    formatDate(dateStr) {
        const date = new Date(dateStr);
        return date.toLocaleDateString('ja-JP', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }
    
    /**
     * PNG画像として保存
     * @param {string} filename - ファイル名
     */
    saveAsPNG(filename = '完読証明書.png') {
        const link = document.createElement('a');
        link.download = filename;
        link.href = this.canvas.toDataURL('image/png');
        link.click();
    }
    
    /**
     * PDFとして保存
     * @param {string} filename - ファイル名
     */
    saveAsPDF(filename = '完読証明書.pdf') {
        // jsPDFライブラリが読み込まれているかチェック
        if (typeof window.jspdf === 'undefined') {
            console.error('jsPDFライブラリが読み込まれていません');
            return;
        }
        
        const { jsPDF } = window.jspdf;
        
        // A4サイズのPDFを作成（横向き）
        const pdf = new jsPDF({
            orientation: 'landscape',
            unit: 'mm',
            format: 'a4'
        });
        
        // Canvasの内容をPDFに追加
        const imgData = this.canvas.toDataURL('image/png');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        
        // アスペクト比を保ちながらPDFに収める
        const canvasAspectRatio = this.canvasWidth / this.canvasHeight;
        const pdfAspectRatio = pdfWidth / pdfHeight;
        
        let imgWidth, imgHeight, imgX, imgY;
        
        if (canvasAspectRatio > pdfAspectRatio) {
            // 横長の場合
            imgWidth = pdfWidth;
            imgHeight = pdfWidth / canvasAspectRatio;
            imgX = 0;
            imgY = (pdfHeight - imgHeight) / 2;
        } else {
            // 縦長の場合
            imgHeight = pdfHeight;
            imgWidth = pdfHeight * canvasAspectRatio;
            imgX = (pdfWidth - imgWidth) / 2;
            imgY = 0;
        }
        
        pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth, imgHeight);
        pdf.save(filename);
    }
    
    /**
     * 印刷
     */
    print() {
        const printWindow = window.open('', '_blank');
        const imgData = this.canvas.toDataURL('image/png');
        
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>完読証明書</title>
                <style>
                    body {
                        margin: 0;
                        padding: 20px;
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        min-height: 100vh;
                    }
                    img {
                        max-width: 100%;
                        max-height: 100vh;
                        box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
                    }
                    @media print {
                        body {
                            padding: 0;
                        }
                        img {
                            max-width: 100%;
                            max-height: 100%;
                            page-break-inside: avoid;
                        }
                    }
                </style>
            </head>
            <body>
                <img src="${imgData}" alt="完読証明書">
                <script>
                    window.onload = function() {
                        window.print();
                        window.onafterprint = function() {
                            window.close();
                        };
                    };
                </script>
            </body>
            </html>
        `);
    }
}