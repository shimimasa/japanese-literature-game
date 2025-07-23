# コントリビューションガイドライン

日本名作文学読解ゲームプロジェクトへの貢献をありがとうございます！このドキュメントでは、プロジェクトへの貢献方法について説明します。

## 目次

1. [行動規範](#行動規範)
2. [貢献の方法](#貢献の方法)
3. [開発環境のセットアップ](#開発環境のセットアップ)
4. [コーディング規約](#コーディング規約)
5. [プルリクエストのプロセス](#プルリクエストのプロセス)
6. [コミットメッセージのガイドライン](#コミットメッセージのガイドライン)
7. [テストの書き方](#テストの書き方)
8. [ドキュメントの更新](#ドキュメントの更新)

## 行動規範

このプロジェクトでは、すべての貢献者が以下の行動規範に従うことを期待しています：

- 相互尊重と建設的なコミュニケーション
- 多様性の尊重と包括的な環境づくり
- プロフェッショナルで協力的な態度
- 他者の意見や批判に対する寛容さ

## 貢献の方法

### バグ報告

バグを見つけた場合は、以下の情報を含めてIssueを作成してください：

1. **バグの説明**: 何が起きているか
2. **再現手順**: バグを再現するための具体的な手順
3. **期待される動作**: 本来どうあるべきか
4. **実際の動作**: 実際に何が起きているか
5. **環境情報**:
   - ブラウザとバージョン
   - OS
   - その他関連する情報

**テンプレート例:**
```markdown
## バグの説明
縦書き表示で特定の文字が正しく表示されない

## 再現手順
1. 「走れメロス」を開く
2. 3ページ目に移動
3. 「々」の文字が横向きになっている

## 期待される動作
すべての文字が縦書きで正しく表示される

## 実際の動作
「々」だけが90度回転して表示される

## 環境
- ブラウザ: Chrome 120.0
- OS: Windows 11
```

### 機能提案

新機能の提案は大歓迎です！以下の点を含めてIssueを作成してください：

1. **機能の概要**: 何を実現したいか
2. **背景・動機**: なぜこの機能が必要か
3. **提案する解決策**: どのように実装するか
4. **代替案**: 他の可能な解決策
5. **追加情報**: モックアップ、参考リンクなど

### コードの貢献

1. **Issueの確認**: 既存のIssueがあるか確認
2. **フォーク**: リポジトリをフォーク
3. **ブランチ作成**: フィーチャーブランチを作成
4. **開発**: コードを書く
5. **テスト**: テストを追加・実行
6. **コミット**: 適切なメッセージでコミット
7. **プルリクエスト**: PRを作成

## 開発環境のセットアップ

### 必要なツール

- Git
- Node.js (v14以上) または Python 3.x
- モダンブラウザ（Chrome推奨）
- テキストエディタ（VS Code推奨）

### セットアップ手順

```bash
# リポジトリのクローン
git clone https://github.com/yourusername/japanese-literature-game.git
cd japanese-literature-game

# 依存関係のインストール（必要な場合）
npm install

# 開発サーバーの起動
npm start

# ブラウザで開く
open http://localhost:8000/index-v2.html
```

### 推奨するVS Code拡張機能

- ESLint
- Prettier
- Japanese Language Pack
- GitLens

## コーディング規約

### JavaScript

```javascript
// 良い例：分かりやすい変数名と関数名
class BookManager {
    constructor() {
        this.books = [];
        this.currentBookId = null;
    }

    async loadBook(bookId) {
        try {
            const book = await this.fetchBook(bookId);
            this.validateBook(book);
            return book;
        } catch (error) {
            this.handleError(error);
        }
    }
}

// 悪い例：不明瞭な命名
class BM {
    constructor() {
        this.b = [];
        this.cbi = null;
    }
}
```

### 命名規則

- **クラス名**: PascalCase (`BookLoader`, `TextRenderer`)
- **関数・メソッド名**: camelCase (`loadBook`, `renderText`)
- **定数**: UPPER_SNAKE_CASE (`MAX_PAGE_SIZE`, `DEFAULT_FONT_SIZE`)
- **ファイル名**: kebab-case (`book-loader.js`, `text-renderer.js`)

### コードスタイル

- インデント: スペース4つ
- 行の最大長: 100文字
- セミコロン: 必須
- 文字列: シングルクォート優先
- async/await: コールバックより優先

### CSS

```css
/* 良い例：構造化されたCSS */
.book-card {
    display: flex;
    flex-direction: column;
    padding: 1rem;
    border-radius: 8px;
    background-color: var(--color-surface);
    transition: transform 0.2s ease;
}

.book-card:hover {
    transform: translateY(-2px);
}

.book-card__title {
    font-size: 1.2rem;
    font-weight: bold;
    margin-bottom: 0.5rem;
}

/* 悪い例：非構造的なCSS */
.card {
    display: flex;
    flex-direction: column;
    padding: 16px;
    border-radius: 8px;
    background: white;
}
```

## プルリクエストのプロセス

### PRを作成する前に

1. **最新の状態に更新**:
   ```bash
   git checkout main
   git pull upstream main
   git checkout your-feature-branch
   git rebase main
   ```

2. **テストの実行**:
   ```bash
   npm test
   ```

3. **コードの整形**:
   ```bash
   npm run lint
   npm run format
   ```

### PRテンプレート

```markdown
## 概要
このPRで何を実現するか

## 変更内容
- 変更点1
- 変更点2
- 変更点3

## テスト方法
1. 手順1
2. 手順2
3. 確認ポイント

## スクリーンショット（UIの変更がある場合）
変更前:
[スクリーンショット]

変更後:
[スクリーンショット]

## チェックリスト
- [ ] コードがプロジェクトのスタイルガイドに従っている
- [ ] セルフレビューを実施した
- [ ] コメントを追加した（特に複雑な部分）
- [ ] ドキュメントを更新した
- [ ] テストを追加した
- [ ] すべてのテストがパスする
- [ ] 関連するIssueをリンクした
```

### レビュープロセス

1. **自動チェック**: CI/CDによる自動テスト
2. **コードレビュー**: 少なくとも1人のレビュアーが必要
3. **フィードバック対応**: レビューコメントへの対応
4. **承認とマージ**: レビュアーの承認後にマージ

## コミットメッセージのガイドライン

### フォーマット

```
<type>(<scope>): <subject>

<body>

<footer>
```

### タイプ

- `feat`: 新機能
- `fix`: バグ修正
- `docs`: ドキュメントのみの変更
- `style`: コードの意味に影響しない変更（空白、フォーマット等）
- `refactor`: バグ修正や機能追加を伴わないコード変更
- `perf`: パフォーマンス改善
- `test`: テストの追加や修正
- `build`: ビルドシステムや外部依存関係の変更
- `ci`: CI設定ファイルやスクリプトの変更
- `chore`: その他の変更

### 例

```
feat(book-loader): 複数ファイルの並列読み込み対応

Promise.allを使用して複数の作品ファイルを並列で読み込めるようにしました。
これにより、初期読み込み時間が約30%短縮されます。

Closes #123
```

## テストの書き方

### 単体テスト

```javascript
describe('BookLoader', () => {
    let bookLoader;
    
    beforeEach(() => {
        bookLoader = new BookLoader();
    });
    
    describe('loadBook', () => {
        it('正常なJSONファイルを読み込める', async () => {
            const book = await bookLoader.loadBook('./test-book.json');
            expect(book).toBeDefined();
            expect(book.title).toBe('テスト作品');
        });
        
        it('不正なJSONファイルでエラーを投げる', async () => {
            await expect(bookLoader.loadBook('./invalid.json'))
                .rejects.toThrow('Invalid JSON format');
        });
    });
});
```

### 統合テスト

```javascript
describe('読書フロー', () => {
    it('作品選択から読書開始まで', async () => {
        // 1. 作品一覧を表示
        await app.showView('library');
        
        // 2. 作品を選択
        const bookCard = document.querySelector('[data-book-id="momotaro"]');
        bookCard.click();
        
        // 3. 読書画面が表示される
        await waitFor(() => {
            expect(app.state.currentView).toBe('reading');
        });
        
        // 4. テキストが表示される
        const textContainer = document.querySelector('.vertical-text');
        expect(textContainer.textContent).toContain('昔々');
    });
});
```

## ドキュメントの更新

### ドキュメントの種類

1. **README.md**: プロジェクトの概要と使い方
2. **API.md**: APIリファレンス
3. **CONTRIBUTING.md**: このファイル
4. **_docs/**: 実装ドキュメント

### ドキュメント更新のタイミング

- 新機能を追加したとき
- APIが変更されたとき
- セットアップ手順が変わったとき
- 重要な設計決定をしたとき

### ドキュメントの書き方

```markdown
## 機能名

### 概要
機能の簡潔な説明

### 使用方法
\```javascript
// コード例
const result = await someFunction(param);
\```

### パラメータ
- `param` (string): パラメータの説明

### 戻り値
- `Promise<Result>`: 戻り値の説明

### 例
実際の使用例を示す

### 注意事項
- 注意点1
- 注意点2
```

## 質問とサポート

- **一般的な質問**: GitHubのDiscussionsを使用
- **バグ報告**: Issuesを作成
- **緊急の問題**: メンテナーに直接連絡

## ライセンス

貢献されたコードは、プロジェクトと同じMITライセンスの下で公開されます。

---

ご協力ありがとうございます！一緒により良いプロジェクトを作りましょう。