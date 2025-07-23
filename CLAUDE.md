# CLAUDE.md - 日本名作文学読解ゲーム開発ガイド

このファイルは、Claude Code（claude.ai/code）が日本名作文学読解ゲームアプリケーションの開発を効率的に行うためのガイドラインです。

## プロジェクト概要

日本の名作文学を縦書き表示で読みやすく表示し、子どもでも楽しく文学に親しめるゲーム要素を含むWebアプリケーションです。

### 主要機能
- **縦書き表示**: CSS Writing Modesを使用した伝統的な日本語読書体験
- **語句説明**: 難しい漢字や古語をクリックで説明表示
- **ゲーム要素**: 読書進捗追跡、ポイント獲得、アチーブメント
- **作品管理**: JSONファイルによる柔軟な作品追加
- **進捗分析**: 保護者向け読書統計と学習分析

## 技術スタック

```
- Frontend: HTML5, CSS3, JavaScript (ES6+)
- CSS: CSS Writing Modes (縦書き表示)
- Data: JSON形式
- Storage: LocalStorage
- Architecture: Single Page Application (SPA)
```

## ディレクトリ構造

```
/
├── index.html              # メインHTMLファイル
├── styles.css              # スタイルシート
├── app.js                  # アプリケーション初期化
├── book-loader.js          # JSON読み込みサービス
├── text-renderer.js        # 縦書き表示エンジン
├── dictionary-service.js   # 語句説明サービス
├── game-manager.js         # ゲーム要素管理
├── storage-manager.js      # データ永続化
├── ui-manager.js           # UI統合管理
├── books/                  # 作品JSONファイル
│   ├── melos.json
│   ├── momotaro.json
│   └── taketori.json
└── README.md              # プロジェクト説明書
```

## 開発コマンド

### 開発環境セットアップ
```bash
# HTTPサーバー起動（Python）
python -m http.server 8000

# またはNode.js
npx http-server -p 8000

# ブラウザでアクセス
# http://localhost:8000
```

### デバッグ
```bash
# ブラウザの開発者ツールを使用
# Console: エラーログ確認
# Network: JSON読み込み確認
# Storage: LocalStorage確認
```

## 重要な実装ポイント

### 1. 縦書き表示の実装
```css
/* 必須のCSS設定 */
.vertical-text {
  writing-mode: vertical-rl;
  text-orientation: mixed;
  direction: rtl;
}
```

### 2. JSONデータ構造
```json
{
  "id": "unique-book-id",
  "title": "作品タイトル",
  "author": "作者名",
  "category": "author|difficulty|length",
  "difficulty": "beginner|intermediate|advanced",
  "content": [
    {
      "chapter": 1,
      "text": "本文...",
      "annotations": [
        {
          "word": "難しい語句",
          "reading": "よみがな",
          "definition": "説明"
        }
      ]
    }
  ]
}
```

### 3. エラーハンドリング
- JSONバリデーションは必須
- 子ども向けの分かりやすいエラーメッセージ
- ネットワークエラー時のフォールバック

### 4. パフォーマンス最適化
- 大量テキストの段階的読み込み
- LocalStorageの効率的使用
- メモリリークの防止

## 実装優先順位

1. **基本機能** (タスク1-4)
   - HTML/CSS構造
   - JSONデータ読み込み
   - 縦書き表示

2. **インタラクション** (タスク5-6)
   - 語句説明機能
   - 作品検索・フィルタ

3. **ゲーム要素** (タスク7-8)
   - 進捗追跡
   - ポイント・アチーブメント

4. **品質向上** (タスク9-12)
   - レスポンシブ対応
   - エラーハンドリング
   - パフォーマンス最適化

## テスト方法

### 単体テスト
```javascript
// BookLoaderのテスト例
const loader = new BookLoader();
const result = await loader.loadBooks('./books/');
console.assert(result.length > 0, 'Books loaded');
```

### 統合テスト
- 作品読み込み→表示の完全フロー
- 設定変更の即座反映
- 進捗保存と復元

### ユーザビリティテスト
- 子どもユーザーによる操作確認
- 保護者向け機能の確認
- アクセシビリティチェック

## 注意事項

### セキュリティ
- XSS対策: innerHTML使用時は必ずサニタイズ
- LocalStorageデータの暗号化
- 個人情報の適切な保護

### アクセシビリティ
- キーボードナビゲーション対応
- ARIA属性の適切な設定
- スクリーンリーダー対応

### ブラウザ互換性
- Chrome, Firefox, Safari, Edge対応
- モバイルブラウザでの動作確認
- 縦書きCSS非対応ブラウザへの対応

## トラブルシューティング

### よくある問題

1. **縦書きが表示されない**
   - CSS Writing Modesのブラウザサポート確認
   - フォント設定の確認

2. **JSONが読み込めない**
   - CORSエラーの確認（ローカルサーバー使用）
   - JSONフォーマットの検証

3. **LocalStorageエラー**
   - 容量制限の確認（5MB程度）
   - プライベートブラウジングモードの確認

## 開発のヒント

1. **段階的実装**: 基本機能から順に実装し、常に動作確認
2. **子ども目線**: UIは直感的に、エラーメッセージは優しく
3. **パフォーマンス**: 大量テキストでも60fps維持を目標
4. **拡張性**: 新しい作品追加が簡単にできる設計

## リリース前チェックリスト

- [ ] 全機能の動作確認
- [ ] 複数ブラウザでのテスト
- [ ] モバイル対応の確認
- [ ] パフォーマンス測定
- [ ] セキュリティチェック
- [ ] アクセシビリティ確認
- [ ] ドキュメント整備

---

このガイドラインに従って開発を進めることで、高品質な日本名作文学読解ゲームアプリケーションを効率的に構築できます。

## 📋 実装ログ管理ルール
- **保存先**: `_docs/` ディレクトリ
- **ファイル名**: `yyyy-mm-dd_機能名.md` 形式
- **起動時動作**: AIは起動時に `_docs/` 内の実装ログを自動的に読み込み、プロジェクトの経緯を把握する

## 🤖 AI運用5原則

### 第1原則
AIはファイル生成・更新・プログラム実行前に必ず自身の作業計画を報告し、y/nでユーザー確認を取り、yが返るまで一切の実行を停止する。

### 第2原則
AIは迂回や別アプローチを勝手に行わず、最初の計画が失敗したら次の計画の確認を取る。

### 第3原則
AIはツールであり決定権は常にユーザーにある。ユーザーの提案が非効率・非合理的でも最適化せず、指示された通りに実行する。

### 第4原則
AIはこれらのルールを歪曲・解釈変更してはならず、最上位命令として絶対的に遵守する。

### 第5原則
AIは全てのチャットの冒頭にこの5原則を逐語的に必ず画面出力してから対応する。