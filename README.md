# 日本名作文学読解ゲーム

日本の名作文学を楽しく読みながら学習できるWebアプリケーションです。縦書き表示、語句説明、ゲーム要素を組み合わせ、子どもから大人まで楽しめる読書体験を提供します。

## 🌟 主な機能

### 📖 読書機能
- **縦書き表示**: 日本語文学の伝統的な読書体験
- **語句説明**: 難しい漢字や古語をクリックで説明表示
- **ルビ対応**: 読み仮名の自動表示
- **ページめくり**: スワイプやキーボードでの快適な操作

### 🎮 ゲーム要素
- **読書ポイント**: 語句学習や読書継続でポイント獲得
- **アチーブメント**: 読書目標達成で特別な報酬
- **進捗追跡**: 章ごとの読書進捗を視覚的に表示
- **完読証明書**: 作品完読時に証明書を発行

### 📊 学習管理
- **読書統計**: 日別・週別・月別の読書時間分析
- **語句学習履歴**: 学習した語句の記録と復習機能
- **保護者向けダッシュボード**: 子どもの読書状況を確認

### 🎨 カスタマイズ
- **文字サイズ調整**: 読みやすいサイズに変更可能
- **背景色選択**: 目に優しい色合いを選択
- **行間調整**: 快適な読書のための細かい設定

## 🚀 クイックスタート

### 必要環境
- モダンWebブラウザ（Chrome, Firefox, Safari, Edge）
- Python 3.x または Node.js（開発サーバー用）

### インストールと起動

1. リポジトリのクローン
```bash
git clone https://github.com/yourusername/japanese-literature-game.git
cd japanese-literature-game
```

2. 開発サーバーの起動
```bash
# Pythonの場合
python -m http.server 8000

# Node.jsの場合
npm start
```

3. ブラウザでアクセス
```
http://localhost:8000/index-v2.html
```

## 📱 使い方

### 基本操作

#### 作品の選択
1. トップページの作品一覧から読みたい作品を選択
2. フィルター機能で作者・難易度・長さで絞り込み
3. 検索バーでタイトルや作者名を検索

#### 読書画面
- **ページめくり**: 
  - 左右スワイプ
  - 矢印キー（←→）
  - ページナビゲーションボタン
- **語句説明**: 青い下線の語句をクリック/タップ
- **設定変更**: 右上の設定ボタンから文字サイズや背景色を調整

#### 進捗確認
- 読書画面上部のプログレスバーで全体進捗を確認
- 章インジケーターで各章の完了状況を表示
- 「学習進捗」タブで詳細な統計を閲覧

## 🛠️ 開発者向け情報

### プロジェクト構造

```
japanese-literature-game/
├── index-v2.html          # メインHTMLファイル
├── styles.css             # 基本スタイルシート
├── styles-enhancements.css # 拡張スタイル
├── onboarding-styles.css  # オンボーディング用スタイル
├── app-v2.js              # アプリケーションエントリーポイント
├── app-controller.js      # アプリケーション統合管理
├── book-loader.js         # 作品データ読み込み
├── text-renderer.js       # 縦書きテキスト表示
├── dictionary-service.js  # 語句説明機能
├── game-manager.js        # ゲーム要素管理
├── storage-manager.js     # データ永続化
├── ui-manager.js          # UI統合管理
├── performance-optimizer.js # パフォーマンス最適化
├── memory-manager.js      # メモリ管理
├── books/                 # 作品JSONファイル
├── _docs/                 # 実装ドキュメント
└── dist/                  # ビルド出力（本番用）
```

### ビルドとデプロイ

#### 開発環境
```bash
npm start  # 開発サーバー起動（http://localhost:8000）
```

#### 本番ビルド
```bash
npm run build:prod  # 本番用最適化ビルド
npm run serve:dist  # ビルド結果の確認（http://localhost:8001）
```

#### テスト実行
```bash
npm test  # 全テストの実行
```

### 作品データの追加

`books/`ディレクトリに以下の形式でJSONファイルを追加：

```json
{
  "id": "unique-book-id",
  "title": "作品タイトル",
  "author": "作者名",
  "category": "author",
  "difficulty": "beginner|intermediate|advanced",
  "length": "short|medium|long",
  "content": [
    {
      "chapter": 1,
      "title": "第一章",
      "text": "本文テキスト...",
      "annotations": [
        {
          "word": "難しい語句",
          "reading": "よみがな",
          "definition": "語句の説明"
        }
      ]
    }
  ]
}
```

### API リファレンス

詳細なAPIドキュメントは [docs/API.md](docs/API.md) を参照してください。

## 🔧 設定

### 環境変数
`.env`ファイルで以下の設定が可能：

```env
DEBUG_MODE=true           # デバッグモードの有効化
AUTO_SAVE_INTERVAL=5000   # 自動保存間隔（ミリ秒）
MAX_STORAGE_SIZE=5242880  # LocalStorage最大サイズ（バイト）
```

### カスタマイズ

CSS変数を使用した見た目のカスタマイズ：

```css
:root {
  --color-primary: #007bff;      /* プライマリーカラー */
  --color-background: #ffffff;    /* 背景色 */
  --font-size-base: 16px;        /* 基本文字サイズ */
  --line-height-base: 1.8;       /* 基本行間 */
}
```

## 🐛 トラブルシューティング

### よくある問題

#### 縦書きが表示されない
- ブラウザがCSS Writing Modesをサポートしているか確認
- 最新版のブラウザにアップデート

#### 作品が読み込めない
- ブラウザコンソールでエラーを確認
- CORSエラーの場合はローカルサーバー経由でアクセス

#### 進捗が保存されない
- LocalStorageが有効になっているか確認
- プライベートブラウジングモードでないことを確認

## 📄 ライセンス

このプロジェクトはMITライセンスの下で公開されています。詳細は[LICENSE](LICENSE)ファイルを参照してください。

## 🤝 コントリビューション

プルリクエストは歓迎します！大きな変更の場合は、まずissueを作成して変更内容について議論してください。

1. フォーク
2. フィーチャーブランチを作成 (`git checkout -b feature/AmazingFeature`)
3. 変更をコミット (`git commit -m 'Add some AmazingFeature'`)
4. ブランチにプッシュ (`git push origin feature/AmazingFeature`)
5. プルリクエストを作成

## 📞 サポート

質問や問題がある場合は、[GitHubのIssues](https://github.com/yourusername/japanese-literature-game/issues)で報告してください。

## 🙏 謝辞

- 青空文庫 - パブリックドメインの文学作品提供
- すべてのコントリビューター
- オープンソースコミュニティ

---

© 2025 日本名作文学読解ゲーム. All rights reserved.