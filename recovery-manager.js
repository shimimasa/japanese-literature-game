/**
 * RecoveryManager - フォールバックとリカバリー機能を提供するクラス
 */
class RecoveryManager {
    constructor(errorHandler) {
        this.errorHandler = errorHandler;
        
        // リトライ設定
        this.retryConfig = {
            maxRetries: 3,
            baseDelay: 1000, // 1秒
            maxDelay: 10000, // 10秒
            backoffMultiplier: 2
        };
        
        // デフォルトデータ
        this.defaultData = {
            book: {
                id: 'default',
                title: 'サンプル作品',
                author: 'システム',
                difficulty: 'beginner',
                content: [{
                    chapter: 1,
                    text: 'データの読み込みに失敗しました。しばらくしてからもう一度お試しください。',
                    annotations: []
                }]
            },
            settings: {
                fontSize: 16,
                lineHeight: 1.8,
                backgroundColor: 'white',
                soundEnabled: true
            },
            progress: {
                userId: 'default',
                books: {},
                settings: {},
                achievements: []
            }
        };
        
        // 破損データの修復パターン
        this.repairPatterns = [
            {
                name: 'missingId',
                detect: (data) => data && !data.id,
                repair: (data) => ({...data, id: `book_${Date.now()}`})
            },
            {
                name: 'invalidContent',
                detect: (data) => data && (!Array.isArray(data.content) || data.content.length === 0),
                repair: (data) => ({
                    ...data,
                    content: [{
                        chapter: 1,
                        text: data.text || 'コンテンツがありません',
                        annotations: []
                    }]
                })
            },
            {
                name: 'corruptedProgress',
                detect: (data) => data && data.books && typeof data.books !== 'object',
                repair: (data) => ({
                    ...data,
                    books: {}
                })
            }
        ];
        
        // オフラインキャッシュ
        this.offlineCache = new Map();
        
        // 実行中のリトライ
        this.activeRetries = new Map();
    }
    
    /**
     * 指数バックオフによるリトライ
     * @param {Function} operation - 実行する操作
     * @param {Object} options - リトライオプション
     * @returns {Promise} 操作の結果
     */
    async retryWithBackoff(operation, options = {}) {
        const config = { ...this.retryConfig, ...options };
        const operationId = options.id || `op_${Date.now()}`;
        
        // 既に実行中のリトライがある場合は待機
        if (this.activeRetries.has(operationId)) {
            return this.activeRetries.get(operationId);
        }
        
        const retryPromise = this._performRetry(operation, config, operationId);
        this.activeRetries.set(operationId, retryPromise);
        
        try {
            const result = await retryPromise;
            this.activeRetries.delete(operationId);
            return result;
        } catch (error) {
            this.activeRetries.delete(operationId);
            throw error;
        }
    }
    
    /**
     * 実際のリトライ処理
     */
    async _performRetry(operation, config, operationId) {
        let lastError = null;
        let delay = config.baseDelay;
        
        for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
            try {
                // リトライ前の通知
                if (attempt > 0) {
                    this.errorHandler.showToast(
                        `もういちどためしています... (${attempt}/${config.maxRetries})`,
                        'info'
                    );
                }
                
                // 操作の実行
                const result = await operation();
                
                // 成功時の通知
                if (attempt > 0) {
                    this.errorHandler.showToast('せいこうしました！', 'info');
                }
                
                return result;
                
            } catch (error) {
                lastError = error;
                
                // ネットワークエラーでオフラインの場合は即座に失敗
                if (!navigator.onLine) {
                    throw new Error('オフラインです。インターネットにつながってからもういちどためしてください。');
                }
                
                // 最後の試行の場合はエラーをスロー
                if (attempt === config.maxRetries) {
                    break;
                }
                
                // 待機時間の計算（指数バックオフ）
                await this._delay(Math.min(delay, config.maxDelay));
                delay *= config.backoffMultiplier;
            }
        }
        
        // すべてのリトライが失敗
        throw lastError || new Error('操作に失敗しました');
    }
    
    /**
     * 遅延処理
     */
    _delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    /**
     * デフォルトデータの取得
     * @param {string} dataType - データタイプ（book, settings, progress）
     * @returns {Object} デフォルトデータ
     */
    getDefaultData(dataType) {
        const data = this.defaultData[dataType];
        if (!data) {
            throw new Error(`Unknown data type: ${dataType}`);
        }
        
        // ディープコピーして返す
        return JSON.parse(JSON.stringify(data));
    }
    
    /**
     * 破損データの修復
     * @param {Object} data - 修復対象のデータ
     * @param {string} dataType - データタイプ
     * @returns {Object} 修復済みデータ
     */
    repairCorruptedData(data, dataType) {
        if (!data || typeof data !== 'object') {
            // 完全に破損している場合はデフォルトデータを返す
            return this.getDefaultData(dataType);
        }
        
        let repaired = { ...data };
        let wasRepaired = false;
        
        // 各修復パターンを適用
        for (const pattern of this.repairPatterns) {
            if (pattern.detect(repaired)) {
                repaired = pattern.repair(repaired);
                wasRepaired = true;
                
                console.warn(`Data repaired: ${pattern.name}`, {
                    before: data,
                    after: repaired
                });
            }
        }
        
        // 修復された場合は通知
        if (wasRepaired) {
            this.errorHandler.showToast(
                'データをじどうしゅうふくしました',
                'warning'
            );
        }
        
        return repaired;
    }
    
    /**
     * データのリセット（緊急時）
     * @param {string} dataType - リセットするデータタイプ
     * @returns {Object} リセット後のデータ
     */
    resetToDefault(dataType) {
        const defaultData = this.getDefaultData(dataType);
        
        // 確認メッセージ
        this.errorHandler.showToast(
            `${dataType}データをリセットしました`,
            'info'
        );
        
        return defaultData;
    }
    
    /**
     * オフラインフォールバック
     * @param {string} key - キャッシュキー
     * @param {Function} fetchFunction - データ取得関数
     * @returns {Promise} データ
     */
    async withOfflineFallback(key, fetchFunction) {
        try {
            // オンラインの場合は通常の取得
            if (navigator.onLine) {
                const data = await fetchFunction();
                // 成功したらキャッシュに保存
                this.offlineCache.set(key, {
                    data: data,
                    timestamp: Date.now()
                });
                return data;
            }
            
            // オフラインの場合はキャッシュから取得
            const cached = this.offlineCache.get(key);
            if (cached) {
                this.errorHandler.showToast(
                    'オフラインモード：ほぞんされたデータをつかっています',
                    'info'
                );
                return cached.data;
            }
            
            // キャッシュもない場合はエラー
            throw new Error('オフラインでデータがみつかりません');
            
        } catch (error) {
            // オンラインでもエラーの場合はキャッシュを試す
            const cached = this.offlineCache.get(key);
            if (cached) {
                this.errorHandler.showToast(
                    'エラーがおきたため、ほぞんされたデータをつかっています',
                    'warning'
                );
                return cached.data;
            }
            
            throw error;
        }
    }
    
    /**
     * 安全なLocalStorage操作
     * @param {string} key - ストレージキー
     * @param {any} value - 保存する値
     * @returns {boolean} 成功したかどうか
     */
    safeLocalStorageSet(key, value) {
        try {
            const serialized = JSON.stringify(value);
            
            // 容量チェック
            const sizeInBytes = new Blob([serialized]).size;
            const remainingSpace = this._estimateRemainingSpace();
            
            if (sizeInBytes > remainingSpace) {
                // 古いデータを削除して再試行
                this._cleanupOldData();
            }
            
            localStorage.setItem(key, serialized);
            return true;
            
        } catch (error) {
            if (error.name === 'QuotaExceededError') {
                this.errorHandler.handleError(
                    error,
                    'system',
                    { operation: 'localStorage.setItem', key: key }
                );
                
                // 緊急クリーンアップ
                this._emergencyCleanup();
                
                // 再試行
                try {
                    localStorage.setItem(key, JSON.stringify(value));
                    return true;
                } catch {
                    return false;
                }
            }
            
            return false;
        }
    }
    
    /**
     * 安全なLocalStorage読み込み
     * @param {string} key - ストレージキー
     * @param {any} defaultValue - デフォルト値
     * @returns {any} 読み込んだ値またはデフォルト値
     */
    safeLocalStorageGet(key, defaultValue = null) {
        try {
            const item = localStorage.getItem(key);
            if (item === null) {
                return defaultValue;
            }
            
            return JSON.parse(item);
            
        } catch (error) {
            console.warn(`Failed to parse localStorage item: ${key}`, error);
            
            // 破損データの削除
            try {
                localStorage.removeItem(key);
            } catch {}
            
            return defaultValue;
        }
    }
    
    /**
     * LocalStorageの残り容量を推定
     */
    _estimateRemainingSpace() {
        try {
            // 既存データのサイズを計算
            let totalSize = 0;
            for (let key in localStorage) {
                if (localStorage.hasOwnProperty(key)) {
                    totalSize += localStorage[key].length + key.length;
                }
            }
            
            // 一般的な上限5MBと仮定
            const maxSize = 5 * 1024 * 1024; // 5MB
            return Math.max(0, maxSize - totalSize);
            
        } catch {
            return 0;
        }
    }
    
    /**
     * 古いデータのクリーンアップ
     */
    _cleanupOldData() {
        const keysToCheck = ['errorLog', 'gameData', 'readingHistory'];
        const now = Date.now();
        const maxAge = 30 * 24 * 60 * 60 * 1000; // 30日
        
        for (const key of keysToCheck) {
            try {
                const data = this.safeLocalStorageGet(key);
                if (data && data.timestamp && (now - data.timestamp) > maxAge) {
                    localStorage.removeItem(key);
                }
            } catch {}
        }
    }
    
    /**
     * 緊急クリーンアップ（容量不足時）
     */
    _emergencyCleanup() {
        // エラーログをクリア
        try {
            localStorage.removeItem('errorLog');
        } catch {}
        
        // 古い進捗データをクリア
        try {
            const gameData = this.safeLocalStorageGet('gameData');
            if (gameData && gameData.bookProgress) {
                // 完読済みの古いデータを削除
                const oneMonthAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
                for (const bookId in gameData.bookProgress) {
                    const progress = gameData.bookProgress[bookId];
                    if (progress.completed && progress.completedDate < oneMonthAgo) {
                        delete gameData.bookProgress[bookId];
                    }
                }
                this.safeLocalStorageSet('gameData', gameData);
            }
        } catch {}
        
        this.errorHandler.showToast(
            'ほぞんスペースをせいりしました',
            'info'
        );
    }
    
    /**
     * ネットワーク状態の監視
     * @param {Function} onOnline - オンライン復帰時のコールバック
     * @param {Function} onOffline - オフライン時のコールバック
     */
    monitorNetworkStatus(onOnline, onOffline) {
        window.addEventListener('online', () => {
            console.log('Network: Online');
            if (onOnline) onOnline();
        });
        
        window.addEventListener('offline', () => {
            console.log('Network: Offline');
            if (onOffline) onOffline();
        });
        
        // 初期状態のチェック
        if (!navigator.onLine && onOffline) {
            onOffline();
        }
    }
}

// エクスポート
if (typeof module !== 'undefined' && module.exports) {
    module.exports = RecoveryManager;
}