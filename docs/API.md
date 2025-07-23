# API リファレンス

日本名作文学読解ゲームの開発者向けAPIドキュメントです。

## 目次

1. [AppController](#appcontroller)
2. [BookLoader](#bookloader)
3. [TextRenderer](#textrenderer)
4. [DictionaryService](#dictionaryservice)
5. [GameManager](#gamemanager)
6. [StorageManager](#storagemanager)
7. [UIManager](#uimanager)
8. [PerformanceOptimizer](#performanceoptimizer)
9. [MemoryManager](#memorymanager)

---

## AppController

アプリケーション全体を統合管理するメインコントローラー。

### Constructor

```javascript
const appController = new AppController();
```

### Methods

#### initialize()
アプリケーションを初期化します。

```javascript
await appController.initialize();
```

**Returns:** `Promise<void>`

#### showView(viewName)
指定されたビューを表示します。

```javascript
appController.showView('library'); // 'library' | 'reading' | 'settings' | 'progress'
```

**Parameters:**
- `viewName` (string): 表示するビューの名前

#### setState(newState)
アプリケーション状態を更新します。

```javascript
appController.setState({ currentView: 'reading' });
```

**Parameters:**
- `newState` (object): 更新する状態オブジェクト

### Properties

- `state` (object): 現在のアプリケーション状態
- `services` (object): 各サービスのインスタンス
- `config` (object): アプリケーション設定

---

## BookLoader

作品データの読み込みと管理を行います。

### Constructor

```javascript
const bookLoader = new BookLoader(bookAdapter, dataValidator, errorHandler);
```

### Methods

#### loadBooks(directory)
指定ディレクトリから作品を読み込みます。

```javascript
const books = await bookLoader.loadBooks('./books/');
```

**Parameters:**
- `directory` (string): 作品ファイルのディレクトリ

**Returns:** `Promise<Array<Book>>`

#### loadBook(bookPath)
単一の作品を読み込みます。

```javascript
const book = await bookLoader.loadBook('./books/momotaro.json');
```

**Parameters:**
- `bookPath` (string): 作品ファイルのパス

**Returns:** `Promise<Book>`

#### getLoadedBooks()
読み込み済みの作品リストを取得します。

```javascript
const books = bookLoader.getLoadedBooks();
```

**Returns:** `Array<Book>`

### Book Object Structure

```javascript
{
  id: "unique-book-id",
  title: "作品タイトル",
  author: "作者名",
  category: "author",
  difficulty: "beginner",
  length: "short",
  content: [
    {
      chapter: 1,
      title: "第一章",
      text: "本文...",
      annotations: [
        {
          word: "難しい語句",
          reading: "よみがな",
          definition: "説明"
        }
      ]
    }
  ]
}
```

---

## TextRenderer

縦書きテキストの表示とページング処理を行います。

### Constructor

```javascript
const textRenderer = new TextRenderer();
```

### Methods

#### setBook(book)
表示する作品を設定します。

```javascript
textRenderer.setBook(bookObject);
```

**Parameters:**
- `book` (object): 作品オブジェクト

#### renderChapter(chapterIndex, pageIndex)
指定章・ページを表示します。

```javascript
await textRenderer.renderChapter(0, 0);
```

**Parameters:**
- `chapterIndex` (number): 章のインデックス
- `pageIndex` (number): ページのインデックス

#### nextPage()
次のページに移動します。

```javascript
textRenderer.nextPage();
```

#### previousPage()
前のページに移動します。

```javascript
textRenderer.previousPage();
```

#### getCurrentChapter()
現在の章インデックスを取得します。

```javascript
const chapter = textRenderer.getCurrentChapter();
```

**Returns:** `number`

#### getCurrentPage()
現在のページインデックスを取得します。

```javascript
const page = textRenderer.getCurrentPage();
```

**Returns:** `number`

---

## DictionaryService

語句説明の管理と表示を行います。

### Constructor

```javascript
const dictionaryService = new DictionaryService();
```

### Methods

#### setAnnotations(annotations)
語句説明データを設定します。

```javascript
dictionaryService.setAnnotations([
  { word: "吾輩", reading: "わがはい", definition: "自分を指す言葉" }
]);
```

**Parameters:**
- `annotations` (Array): 語句説明の配列

#### showPopup(word, x, y)
語句説明ポップアップを表示します。

```javascript
dictionaryService.showPopup("吾輩", 100, 200);
```

**Parameters:**
- `word` (string): 説明する語句
- `x` (number): X座標
- `y` (number): Y座標

#### hidePopup()
ポップアップを非表示にします。

```javascript
dictionaryService.hidePopup();
```

### Events

- `onWordLearned`: 語句が学習されたときに発火
- `onPointsEarned`: ポイントが獲得されたときに発火

---

## GameManager

ゲーム要素（ポイント、アチーブメント、進捗）を管理します。

### Constructor

```javascript
const gameManager = new GameManager(storageManager);
```

### Methods

#### startReadingSession(bookId)
読書セッションを開始します。

```javascript
gameManager.startReadingSession('momotaro');
```

**Parameters:**
- `bookId` (string): 作品ID

#### endReadingSession()
読書セッションを終了します。

```javascript
gameManager.endReadingSession();
```

#### updateProgress(bookId, chapter, page, percentage)
読書進捗を更新します。

```javascript
gameManager.updateProgress('momotaro', 1, 5, 25.5);
```

**Parameters:**
- `bookId` (string): 作品ID
- `chapter` (number): 章番号
- `page` (number): ページ番号
- `percentage` (number): 進捗率

#### awardPoints(type, points, description)
ポイントを付与します。

```javascript
gameManager.awardPoints('word_learned', 10, '新しい語句を学習');
```

**Parameters:**
- `type` (string): ポイントタイプ
- `points` (number): ポイント数
- `description` (string): 説明

#### getProgress(bookId)
作品の進捗を取得します。

```javascript
const progress = gameManager.getProgress('momotaro');
```

**Returns:** `object | null`

#### getStatistics()
ゲーム統計を取得します。

```javascript
const stats = gameManager.getStatistics();
```

**Returns:** `object`

---

## StorageManager

データの永続化を管理します。

### Constructor

```javascript
const storageManager = new StorageManager();
```

### Methods

#### saveSettings(settings)
設定を保存します。

```javascript
await storageManager.saveSettings({
  fontSize: 16,
  backgroundColor: 'cream'
});
```

**Parameters:**
- `settings` (object): 設定オブジェクト

**Returns:** `Promise<boolean>`

#### loadSettings()
設定を読み込みます。

```javascript
const settings = storageManager.loadSettings();
```

**Returns:** `object | null`

#### saveProgress(progressData)
進捗データを保存します。

```javascript
await storageManager.saveProgress(progressData);
```

**Parameters:**
- `progressData` (object): 進捗データ

**Returns:** `Promise<boolean>`

#### loadProgress()
進捗データを読み込みます。

```javascript
const progress = await storageManager.loadProgress();
```

**Returns:** `Promise<object | null>`

#### clearProgress()
すべての進捗データをクリアします。

```javascript
storageManager.clearProgress();
```

---

## UIManager

UI要素の統合管理を行います。

### Constructor

```javascript
const uiManager = new UIManager();
```

### Methods

#### initialize()
UIを初期化します。

```javascript
await uiManager.initialize();
```

**Returns:** `Promise<void>`

#### showView(viewName)
指定されたビューを表示します。

```javascript
uiManager.showView('library');
```

**Parameters:**
- `viewName` (string): ビュー名

#### showLoading(message)
ローディング画面を表示します。

```javascript
uiManager.showLoading('作品を読み込んでいます...');
```

**Parameters:**
- `message` (string): 表示するメッセージ

#### hideLoading()
ローディング画面を非表示にします。

```javascript
uiManager.hideLoading();
```

#### showNotification(message, type, duration)
通知を表示します。

```javascript
uiManager.showNotification('保存しました', 'success', 3000);
```

**Parameters:**
- `message` (string): メッセージ
- `type` (string): 'success' | 'error' | 'warning' | 'info'
- `duration` (number): 表示時間（ミリ秒）

#### applySettings(settings)
設定をUIに適用します。

```javascript
uiManager.applySettings({
  fontSize: 18,
  backgroundColor: 'dark'
});
```

**Parameters:**
- `settings` (object): 設定オブジェクト

---

## PerformanceOptimizer

パフォーマンス最適化を管理します。

### Constructor

```javascript
const performanceOptimizer = new PerformanceOptimizer();
```

### Methods

#### initialize()
パフォーマンス最適化を初期化します。

```javascript
performanceOptimizer.initialize();
```

#### measurePerformance(name, func)
関数の実行時間を測定します。

```javascript
const result = performanceOptimizer.measurePerformance('render', () => {
  // 重い処理
});
```

**Parameters:**
- `name` (string): 測定名
- `func` (function): 実行する関数

**Returns:** `any` (関数の戻り値)

#### destroy()
リソースをクリーンアップします。

```javascript
performanceOptimizer.destroy();
```

---

## MemoryManager

メモリ使用量の監視と管理を行います。

### Constructor

```javascript
const memoryManager = new MemoryManager();
```

### Methods

#### initialize()
メモリ管理を初期化します。

```javascript
memoryManager.initialize();
```

#### registerResource(key, resource, type)
リソースを登録します。

```javascript
memoryManager.registerResource('image1', imageElement, 'image');
```

**Parameters:**
- `key` (string): リソースキー
- `resource` (any): リソースオブジェクト
- `type` (string): リソースタイプ

#### releaseResource(key)
リソースを解放します。

```javascript
memoryManager.releaseResource('image1');
```

**Parameters:**
- `key` (string): リソースキー

#### addManagedEventListener(element, event, handler, options)
管理されたイベントリスナーを追加します。

```javascript
memoryManager.addManagedEventListener(
  button,
  'click',
  handleClick,
  { passive: true }
);
```

**Parameters:**
- `element` (HTMLElement): 要素
- `event` (string): イベント名
- `handler` (function): ハンドラー関数
- `options` (object): オプション

#### destroy()
すべてのリソースをクリーンアップします。

```javascript
memoryManager.destroy();
```

---

## エラーコード

### BookLoader
- `BOOK_NOT_FOUND`: 作品ファイルが見つからない
- `INVALID_JSON`: JSON形式が不正
- `VALIDATION_FAILED`: バリデーションエラー

### StorageManager
- `STORAGE_FULL`: ストレージ容量不足
- `STORAGE_UNAVAILABLE`: ストレージが利用不可
- `DATA_CORRUPTED`: データが破損

### GameManager
- `SESSION_NOT_STARTED`: セッションが開始されていない
- `INVALID_PROGRESS`: 不正な進捗データ

---

## イベント

### グローバルイベント

```javascript
// アプリケーション初期化完了
window.addEventListener('app:initialized', (event) => {
  console.log('App initialized');
});

// 作品選択
window.addEventListener('book:selected', (event) => {
  console.log('Book selected:', event.detail.book);
});

// ページ変更
window.addEventListener('page:changed', (event) => {
  console.log('Page changed:', event.detail);
});
```

---

## カスタマイズ

### 新しいアチーブメントの追加

```javascript
gameManager.defineAchievement({
  id: 'speed_reader',
  name: 'スピードリーダー',
  description: '1時間で100ページ読む',
  condition: (stats) => stats.pagesPerHour >= 100,
  points: 500
});
```

### カスタムバリデーターの追加

```javascript
dataValidator.addRule('customRule', (value) => {
  return value.length > 0 && value.length < 100;
});
```

---

## ベストプラクティス

1. **非同期処理**: すべてのI/O操作はasync/awaitを使用
2. **エラーハンドリング**: try-catchで適切にエラーを処理
3. **メモリ管理**: 不要になったリソースは必ず解放
4. **イベント**: カスタムイベントで疎結合を維持
5. **パフォーマンス**: 重い処理はrequestIdleCallbackを使用

---

© 2025 日本名作文学読解ゲーム