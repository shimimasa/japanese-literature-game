/**
 * touch-handler.js - タッチ操作とジェスチャー管理
 * 
 * スワイプ、ピンチズーム、ロングタップなどの
 * タッチジェスチャーを統一的に管理します。
 */

export class TouchHandler {
    constructor() {
        // タッチ状態の管理
        this.touches = new Map();
        this.currentGesture = null;
        this.gestureStartTime = 0;
        
        // ジェスチャーの閾値設定
        this.config = {
            swipeThreshold: 50,        // スワイプと判定する最小距離（px）
            swipeTimeout: 300,         // スワイプのタイムアウト（ms）
            longPressDelay: 500,       // ロングタップの判定時間（ms）
            pinchThreshold: 0.1,       // ピンチの最小スケール変化
            doubleTapDelay: 300,       // ダブルタップの間隔（ms）
            momentumMultiplier: 0.95   // 慣性スクロールの減衰率
        };
        
        // ジェスチャーハンドラーの登録
        this.gestureHandlers = new Map();
        
        // 最後のタップ時刻（ダブルタップ検出用）
        this.lastTapTime = 0;
        this.lastTapPosition = { x: 0, y: 0 };
        
        // 慣性スクロールの管理
        this.momentum = {
            velocityX: 0,
            velocityY: 0,
            animationId: null
        };
    }
    
    /**
     * 要素にタッチイベントを設定
     * @param {HTMLElement} element - 対象要素
     * @param {Object} options - オプション設定
     */
    attachToElement(element, options = {}) {
        if (!element) return;
        
        // オプションのマージ
        const elementConfig = { ...this.config, ...options };
        element.dataset.touchConfig = JSON.stringify(elementConfig);
        
        // タッチイベントの設定
        element.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
        element.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
        element.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: false });
        element.addEventListener('touchcancel', this.handleTouchCancel.bind(this), { passive: false });
        
        // マウスイベントのフォールバック（開発用）
        if (options.enableMouseFallback) {
            this.setupMouseFallback(element);
        }
    }
    
    /**
     * タッチ開始処理
     */
    handleTouchStart(event) {
        const element = event.currentTarget;
        const config = JSON.parse(element.dataset.touchConfig || '{}');
        
        // タッチポイントの記録
        Array.from(event.changedTouches).forEach(touch => {
            this.touches.set(touch.identifier, {
                startX: touch.clientX,
                startY: touch.clientY,
                currentX: touch.clientX,
                currentY: touch.clientY,
                startTime: Date.now(),
                element: element
            });
        });
        
        // ジェスチャーの判定
        if (event.touches.length === 1) {
            // シングルタッチ
            this.startSingleTouch(event, config);
        } else if (event.touches.length === 2) {
            // マルチタッチ（ピンチ）
            this.startPinch(event);
        }
        
        // 慣性スクロールの停止
        this.stopMomentum();
    }
    
    /**
     * タッチ移動処理
     */
    handleTouchMove(event) {
        const element = event.currentTarget;
        const config = JSON.parse(element.dataset.touchConfig || '{}');
        
        // タッチポイントの更新
        Array.from(event.changedTouches).forEach(touch => {
            const touchData = this.touches.get(touch.identifier);
            if (touchData) {
                touchData.previousX = touchData.currentX;
                touchData.previousY = touchData.currentY;
                touchData.currentX = touch.clientX;
                touchData.currentY = touch.clientY;
                touchData.velocityX = touchData.currentX - touchData.previousX;
                touchData.velocityY = touchData.currentY - touchData.previousY;
            }
        });
        
        // 現在のジェスチャーに応じた処理
        if (this.currentGesture === 'swipe') {
            this.handleSwipeMove(event, config);
        } else if (this.currentGesture === 'pinch') {
            this.handlePinchMove(event);
        }
    }
    
    /**
     * タッチ終了処理
     */
    handleTouchEnd(event) {
        const element = event.currentTarget;
        const config = JSON.parse(element.dataset.touchConfig || '{}');
        
        Array.from(event.changedTouches).forEach(touch => {
            const touchData = this.touches.get(touch.identifier);
            if (!touchData) return;
            
            const deltaX = touchData.currentX - touchData.startX;
            const deltaY = touchData.currentY - touchData.startY;
            const deltaTime = Date.now() - touchData.startTime;
            const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
            
            // ジェスチャーの判定と実行
            if (this.currentGesture === 'swipe' && distance > config.swipeThreshold) {
                this.completeSwipe(touchData, deltaX, deltaY, deltaTime);
            } else if (distance < 10 && deltaTime < config.longPressDelay) {
                // タップの処理
                this.handleTap(touchData, config);
            }
            
            // タッチデータの削除
            this.touches.delete(touch.identifier);
        });
        
        // 全てのタッチが終了した場合
        if (event.touches.length === 0) {
            this.currentGesture = null;
            
            // 慣性スクロールの開始
            if (this.momentum.velocityX || this.momentum.velocityY) {
                this.startMomentum();
            }
        }
    }
    
    /**
     * タッチキャンセル処理
     */
    handleTouchCancel(event) {
        // タッチデータのクリア
        Array.from(event.changedTouches).forEach(touch => {
            this.touches.delete(touch.identifier);
        });
        
        this.currentGesture = null;
        this.stopMomentum();
    }
    
    /**
     * シングルタッチの開始
     */
    startSingleTouch(event, config) {
        this.currentGesture = 'single';
        this.gestureStartTime = Date.now();
        
        // ロングタップの検出
        const touch = event.touches[0];
        const touchData = this.touches.get(touch.identifier);
        
        touchData.longPressTimer = setTimeout(() => {
            if (this.currentGesture === 'single') {
                this.handleLongPress(touchData);
            }
        }, config.longPressDelay);
    }
    
    /**
     * スワイプ移動の処理
     */
    handleSwipeMove(event, config) {
        const touch = event.touches[0];
        const touchData = this.touches.get(touch.identifier);
        if (!touchData) return;
        
        const deltaX = touchData.currentX - touchData.startX;
        const deltaY = touchData.currentY - touchData.startY;
        
        // スワイプ中のイベント発行
        this.triggerGesture('swipeMove', {
            deltaX,
            deltaY,
            velocityX: touchData.velocityX,
            velocityY: touchData.velocityY,
            element: touchData.element
        });
        
        // デフォルトのスクロールを防ぐ
        if (Math.abs(deltaX) > 10 || Math.abs(deltaY) > 10) {
            event.preventDefault();
            this.currentGesture = 'swipe';
            
            // ロングタップタイマーのクリア
            if (touchData.longPressTimer) {
                clearTimeout(touchData.longPressTimer);
                touchData.longPressTimer = null;
            }
        }
    }
    
    /**
     * スワイプの完了
     */
    completeSwipe(touchData, deltaX, deltaY, deltaTime) {
        const velocity = Math.sqrt(deltaX * deltaX + deltaY * deltaY) / deltaTime;
        
        // スワイプ方向の判定
        let direction;
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
            direction = deltaX > 0 ? 'right' : 'left';
        } else {
            direction = deltaY > 0 ? 'down' : 'up';
        }
        
        // スワイプイベントの発行
        this.triggerGesture('swipe', {
            direction,
            deltaX,
            deltaY,
            velocity,
            element: touchData.element
        });
        
        // 慣性スクロールの速度設定
        this.momentum.velocityX = touchData.velocityX || 0;
        this.momentum.velocityY = touchData.velocityY || 0;
    }
    
    /**
     * タップの処理
     */
    handleTap(touchData, config) {
        const now = Date.now();
        const tapX = touchData.currentX;
        const tapY = touchData.currentY;
        
        // ダブルタップの検出
        const timeDiff = now - this.lastTapTime;
        const distX = Math.abs(tapX - this.lastTapPosition.x);
        const distY = Math.abs(tapY - this.lastTapPosition.y);
        
        if (timeDiff < config.doubleTapDelay && distX < 30 && distY < 30) {
            // ダブルタップ
            this.triggerGesture('doubleTap', {
                x: tapX,
                y: tapY,
                element: touchData.element
            });
            this.lastTapTime = 0;
        } else {
            // シングルタップ
            this.triggerGesture('tap', {
                x: tapX,
                y: tapY,
                element: touchData.element
            });
            this.lastTapTime = now;
            this.lastTapPosition = { x: tapX, y: tapY };
        }
        
        // ロングタップタイマーのクリア
        if (touchData.longPressTimer) {
            clearTimeout(touchData.longPressTimer);
        }
    }
    
    /**
     * ロングタップの処理
     */
    handleLongPress(touchData) {
        this.currentGesture = 'longPress';
        
        // バイブレーションフィードバック（対応デバイスのみ）
        if ('vibrate' in navigator) {
            navigator.vibrate(50);
        }
        
        this.triggerGesture('longPress', {
            x: touchData.currentX,
            y: touchData.currentY,
            element: touchData.element
        });
    }
    
    /**
     * ピンチの開始
     */
    startPinch(event) {
        if (event.touches.length !== 2) return;
        
        this.currentGesture = 'pinch';
        
        const touch1 = event.touches[0];
        const touch2 = event.touches[1];
        
        // 初期距離の計算
        const dx = touch2.clientX - touch1.clientX;
        const dy = touch2.clientY - touch1.clientY;
        this.pinchStartDistance = Math.sqrt(dx * dx + dy * dy);
        this.pinchStartScale = 1;
    }
    
    /**
     * ピンチ移動の処理
     */
    handlePinchMove(event) {
        if (event.touches.length !== 2) return;
        
        const touch1 = event.touches[0];
        const touch2 = event.touches[1];
        
        // 現在の距離を計算
        const dx = touch2.clientX - touch1.clientX;
        const dy = touch2.clientY - touch1.clientY;
        const currentDistance = Math.sqrt(dx * dx + dy * dy);
        
        // スケールの計算
        const scale = currentDistance / this.pinchStartDistance;
        
        // ピンチイベントの発行
        this.triggerGesture('pinch', {
            scale: scale * this.pinchStartScale,
            centerX: (touch1.clientX + touch2.clientX) / 2,
            centerY: (touch1.clientY + touch2.clientY) / 2
        });
        
        event.preventDefault();
    }
    
    /**
     * 慣性スクロールの開始
     */
    startMomentum() {
        const animate = () => {
            // 速度の減衰
            this.momentum.velocityX *= this.config.momentumMultiplier;
            this.momentum.velocityY *= this.config.momentumMultiplier;
            
            // 最小速度で停止
            if (Math.abs(this.momentum.velocityX) < 0.1 && Math.abs(this.momentum.velocityY) < 0.1) {
                this.stopMomentum();
                return;
            }
            
            // 慣性移動イベントの発行
            this.triggerGesture('momentum', {
                velocityX: this.momentum.velocityX,
                velocityY: this.momentum.velocityY
            });
            
            this.momentum.animationId = requestAnimationFrame(animate);
        };
        
        this.momentum.animationId = requestAnimationFrame(animate);
    }
    
    /**
     * 慣性スクロールの停止
     */
    stopMomentum() {
        if (this.momentum.animationId) {
            cancelAnimationFrame(this.momentum.animationId);
            this.momentum.animationId = null;
        }
        this.momentum.velocityX = 0;
        this.momentum.velocityY = 0;
    }
    
    /**
     * ジェスチャーハンドラーの登録
     * @param {string} gesture - ジェスチャー名
     * @param {Function} handler - ハンドラー関数
     */
    on(gesture, handler) {
        if (!this.gestureHandlers.has(gesture)) {
            this.gestureHandlers.set(gesture, []);
        }
        this.gestureHandlers.get(gesture).push(handler);
    }
    
    /**
     * ジェスチャーハンドラーの解除
     * @param {string} gesture - ジェスチャー名
     * @param {Function} handler - ハンドラー関数
     */
    off(gesture, handler) {
        const handlers = this.gestureHandlers.get(gesture);
        if (handlers) {
            const index = handlers.indexOf(handler);
            if (index > -1) {
                handlers.splice(index, 1);
            }
        }
    }
    
    /**
     * ジェスチャーイベントの発行
     */
    triggerGesture(gesture, data) {
        const handlers = this.gestureHandlers.get(gesture);
        if (handlers) {
            handlers.forEach(handler => {
                try {
                    handler(data);
                } catch (error) {
                    console.error(`Error in ${gesture} handler:`, error);
                }
            });
        }
        
        // カスタムイベントの発行
        const event = new CustomEvent(`touch${gesture}`, { detail: data });
        document.dispatchEvent(event);
    }
    
    /**
     * マウスイベントのフォールバック設定（開発用）
     */
    setupMouseFallback(element) {
        let isMouseDown = false;
        let mouseTouch = null;
        
        element.addEventListener('mousedown', (e) => {
            isMouseDown = true;
            mouseTouch = {
                identifier: 'mouse',
                clientX: e.clientX,
                clientY: e.clientY
            };
            
            const fakeEvent = {
                touches: [mouseTouch],
                changedTouches: [mouseTouch],
                preventDefault: () => e.preventDefault(),
                currentTarget: element
            };
            
            this.handleTouchStart(fakeEvent);
        });
        
        element.addEventListener('mousemove', (e) => {
            if (!isMouseDown || !mouseTouch) return;
            
            mouseTouch.clientX = e.clientX;
            mouseTouch.clientY = e.clientY;
            
            const fakeEvent = {
                touches: [mouseTouch],
                changedTouches: [mouseTouch],
                preventDefault: () => e.preventDefault(),
                currentTarget: element
            };
            
            this.handleTouchMove(fakeEvent);
        });
        
        element.addEventListener('mouseup', (e) => {
            if (!isMouseDown || !mouseTouch) return;
            
            isMouseDown = false;
            
            const fakeEvent = {
                touches: [],
                changedTouches: [mouseTouch],
                preventDefault: () => e.preventDefault(),
                currentTarget: element
            };
            
            this.handleTouchEnd(fakeEvent);
            mouseTouch = null;
        });
        
        element.addEventListener('mouseleave', (e) => {
            if (!isMouseDown || !mouseTouch) return;
            
            isMouseDown = false;
            
            const fakeEvent = {
                touches: [],
                changedTouches: [mouseTouch],
                preventDefault: () => e.preventDefault(),
                currentTarget: element
            };
            
            this.handleTouchCancel(fakeEvent);
            mouseTouch = null;
        });
    }
    
    /**
     * デバッグ情報の取得
     */
    getDebugInfo() {
        return {
            activeeTouches: this.touches.size,
            currentGesture: this.currentGesture,
            momentum: { ...this.momentum },
            lastTap: {
                time: this.lastTapTime,
                position: { ...this.lastTapPosition }
            }
        };
    }
}