# アーキテクチャドキュメント

## 概要

日本名作文学読解ゲームは、モジュラーアーキテクチャを採用したシングルページアプリケーション（SPA）です。各モジュールは明確な責任を持ち、疎結合に設計されています。

## アーキテクチャ図

```
┌─────────────────────────────────────────────────────┐
│                    User Interface                    │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐  │
│  │ Library │ │ Reading │ │Settings │ │Progress │  │
│  │  View   │ │  View   │ │  View   │ │  View   │  │
│  └────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘  │
│       └───────────┴───────────┴───────────┘        │
└───────────────────────┬─────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────┐
│                  AppController                       │
│  ┌─────────────────────────────────────────────┐   │
│  │ State Management & Event Coordination       │   │
│  └─────────────────────────────────────────────┘   │
└───────────────────────┬─────────────────────────────┘
                        │
    ┌───────────────────┼───────────────────┐
    │                   │                   │
    ▼                   ▼                   ▼
┌─────────┐      ┌─────────────┐    ┌──────────────┐
│   UI    │      │   Business   │    │Infrastructure│
│ Layer   │      │    Logic     │    │   Layer      │
├─────────┤      ├─────────────┤    ├──────────────┤
│UIManager│      │GameManager   │    │StorageManager│
│         │      │TextRenderer  │    │BookLoader    │
│         │      │DictionaryServ│    │BookAdapter   │
│         │      │ProgressMgr  │    │              │
└─────────┘      └─────────────┘    └──────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────┐
│              Cross-Cutting Concerns                  │
├─────────────┬──────────────┬───────────────────────┤
│ErrorHandler │ DataValidator│ PerformanceOptimizer  │
│             │              │ MemoryManager         │
└─────────────┴──────────────┴───────────────────────┘
```

## レイヤー構造

### 1. プレゼンテーション層（UI Layer）

**責任**: ユーザーインターフェースの表示と操作

**主要コンポーネント**:
- `UIManager`: UI要素の統合管理
- `OnboardingFlow`: 初回利用時のガイド
- `TouchHandler`: タッチ操作の処理

**設計原則**:
- ビジネスロジックを含まない
- イベントドリブンな実装
- レスポンシブデザイン

### 2. アプリケーション層（Application Layer）

**責任**: アプリケーションフローの制御と調整

**主要コンポーネント**:
- `AppController`: アプリケーション全体の統合管理
- `FlowValidator`: ユーザーフローの検証

**設計原則**:
- 各サービスの調整役
- 状態管理の中央集権化
- イベントバスによる疎結合

### 3. ビジネスロジック層（Business Logic Layer）

**責任**: アプリケーション固有のビジネスルール

**主要コンポーネント**:
- `GameManager`: ゲーム要素の管理
- `TextRenderer`: 縦書きテキスト表示
- `DictionaryService`: 語句説明機能
- `ProgressManager`: 進捗管理
- `StatisticsAnalyzer`: 統計分析

**設計原則**:
- 単一責任の原則
- テスタブルな設計
- UIから独立した実装

### 4. インフラストラクチャ層（Infrastructure Layer）

**責任**: 外部リソースとの通信、データ永続化

**主要コンポーネント**:
- `StorageManager`: LocalStorage管理
- `BookLoader`: 作品データ読み込み
- `BookAdapter`: データ形式変換

**設計原則**:
- 抽象化による柔軟性
- エラーハンドリングの一元化
- キャッシュ戦略の実装

### 5. 横断的関心事（Cross-Cutting Concerns）

**責任**: アプリケーション全体で共通する機能

**主要コンポーネント**:
- `ErrorHandler`: エラー処理
- `DataValidator`: データ検証
- `PerformanceOptimizer`: パフォーマンス最適化
- `MemoryManager`: メモリ管理

## データフロー

### 1. 作品選択フロー

```
User → UIManager → AppController → BookLoader → BookAdapter
                                          ↓
                                    StorageManager
                                          ↓
TextRenderer ← GameManager ← AppController
      ↓
   UIManager → User
```

### 2. 語句学習フロー

```
User Click → DictionaryService → GameManager
                   ↓                   ↓
              UIManager          StorageManager
                   ↓                   ↓
                User            ProgressManager
```

### 3. 進捗保存フロー

```
Timer/Event → GameManager → StorageManager
                  ↓              ↓
           ProgressManager    LocalStorage
                  ↓
           StatisticsAnalyzer
```

## 状態管理

### アプリケーション状態

```javascript
{
    currentView: 'library|reading|settings|progress',
    currentBook: Book | null,
    currentChapter: number,
    currentPage: number,
    isLoading: boolean,
    isInitialized: boolean
}
```

### ゲーム状態

```javascript
{
    userId: string,
    totalPoints: number,
    totalReadingTime: number,
    achievements: Achievement[],
    bookProgress: {
        [bookId]: {
            currentChapter: number,
            currentPage: number,
            completedChapters: number[],
            readingTime: number,
            points: number,
            wordsLearned: string[],
            lastRead: timestamp
        }
    }
}
```

## イベントシステム

### グローバルイベント

- `app:initialized`: アプリケーション初期化完了
- `book:selected`: 作品選択
- `page:changed`: ページ変更
- `word:clicked`: 語句クリック
- `achievement:unlocked`: アチーブメント解除
- `settings:changed`: 設定変更
- `error:occurred`: エラー発生

### イベントバス実装

```javascript
class EventEmitter {
    emit(event, data) { /* ... */ }
    on(event, callback) { /* ... */ }
    off(event, callback) { /* ... */ }
}
```

## セキュリティ

### XSS対策

- `textContent`の使用（`innerHTML`は最小限）
- ユーザー入力のサニタイズ
- CSPヘッダーの設定推奨

### データ保護

- LocalStorage暗号化（Base64）
- 個人情報の最小限保存
- セッション管理

## パフォーマンス戦略

### 初期読み込み

1. **Critical CSS**: インライン化
2. **遅延読み込み**: 画像とリソース
3. **コード分割**: 必要時のみ読み込み

### ランタイム最適化

1. **メモリ管理**: 自動クリーンアップ
2. **イベント最適化**: デバウンス/スロットル
3. **DOM操作**: バッチ更新

### キャッシュ戦略

1. **LocalStorage**: 進捗データ
2. **メモリキャッシュ**: 画像リソース
3. **ブラウザキャッシュ**: 静的アセット

## 拡張ポイント

### 新しいビューの追加

1. HTMLにビューコンテナを追加
2. AppControllerに状態を追加
3. UIManagerにビュー処理を追加
4. ナビゲーションを更新

### 新しいゲーム要素の追加

1. GameManagerに機能を追加
2. アチーブメント定義を追加
3. UIに表示要素を追加
4. StorageManagerで永続化

### 新しいデータソースの追加

1. BookAdapterで形式変換
2. BookLoaderで読み込み処理
3. DataValidatorで検証ルール

## テスト戦略

### 単体テスト

- 各クラスの公開メソッド
- エッジケースの処理
- エラーハンドリング

### 統合テスト

- コンポーネント間の連携
- ユーザーフロー全体
- データの整合性

### パフォーマンステスト

- 大量データでの動作
- メモリリーク検出
- レンダリング速度

## デプロイメント

### ビルドプロセス

1. コード圧縮
2. アセット最適化
3. バンドル生成
4. ハッシュ付きファイル名

### 環境設定

- 開発: `DEBUG_MODE=true`
- ステージング: 本番同等
- 本番: 最適化済み

## 今後の拡張計画

### 短期（3ヶ月）

- PWA対応
- オフライン機能
- 音声読み上げ

### 中期（6ヶ月）

- マルチプレイヤー機能
- AI推薦システム
- 学習分析の高度化

### 長期（1年）

- ネイティブアプリ版
- 教育機関向け機能
- 国際化対応

---

このアーキテクチャドキュメントは、プロジェクトの成長に合わせて更新されます。