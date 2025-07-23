# バージョン管理ガイド

## 現在のバージョン: 1.0.0

## セマンティックバージョニング

このプロジェクトは[セマンティックバージョニング](https://semver.org/lang/ja/)を採用しています。

### バージョン番号の形式: `MAJOR.MINOR.PATCH`

- **MAJOR**: 後方互換性のない変更
- **MINOR**: 後方互換性のある機能追加
- **PATCH**: 後方互換性のあるバグ修正

### プレリリース版
- アルファ版: `1.0.0-alpha.1`
- ベータ版: `1.0.0-beta.1`
- リリース候補: `1.0.0-rc.1`

## バージョン更新手順

### 1. バージョン番号の更新箇所

#### config.production.js
```javascript
const ProductionConfig = {
    version: '1.0.0', // ここを更新
    // ...
};
```

#### config.development.js
```javascript
const DevelopmentConfig = {
    version: '1.0.0-dev', // ここを更新
    // ...
};
```

#### package.json（作成する場合）
```json
{
  "name": "japanese-literature-game",
  "version": "1.0.0",
  // ...
}
```

### 2. 更新時のチェックリスト

- [ ] すべてのテストが合格している
- [ ] ドキュメントが最新化されている
- [ ] CHANGELOG.mdが更新されている
- [ ] RELEASE-NOTES.mdが更新されている
- [ ] バージョン番号が全ファイルで統一されている
- [ ] セキュリティチェックが完了している
- [ ] パフォーマンステストが完了している
- [ ] ブラウザ互換性が確認されている

### 3. Git タグの作成

```bash
# バージョンタグを作成
git tag -a v1.0.0 -m "Release version 1.0.0"

# タグをリモートにプッシュ
git push origin v1.0.0
```

### 4. リリースブランチ戦略

```
main
  └── develop
       ├── feature/xxx
       ├── bugfix/xxx
       └── release/1.0.0
```

## バージョン履歴

### v1.0.0 (2025-01-18)
- 初回リリース
- 基本機能の実装完了
- 3作品を収録

## アップグレードガイド

### 0.x.x から 1.0.0 へ
初回リリースのため、アップグレード手順はありません。

### 将来のアップグレード
各メジャーバージョンアップ時に、以下の情報を記載します：
- 破壊的変更の一覧
- 移行手順
- 新機能の説明
- 非推奨機能の案内

## バージョン管理のベストプラクティス

1. **開発版には必ず `-dev` サフィックスを付ける**
2. **リリース前にはRC版でテストする**
3. **CHANGELOGを詳細に記録する**
4. **破壊的変更は慎重に検討する**
5. **バージョンアップ時は必ずバックアップを推奨する**

## 自動バージョニング（将来の実装）

```javascript
// version-manager.js の実装例
class VersionManager {
    getCurrentVersion() {
        return window.AppConfig?.version || '0.0.0';
    }
    
    checkForUpdates() {
        // バージョンチェックロジック
    }
    
    notifyUpdate(newVersion) {
        // アップデート通知
    }
}
```