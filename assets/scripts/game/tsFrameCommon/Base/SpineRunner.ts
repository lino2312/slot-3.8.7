// 编辑器模式下运行spine
import { _decorator, sp} from 'cc';
// @ts-ignore
import { EDITOR } from 'cc/env';

if (EDITOR) {
    // 重写update方法 达到在编辑模式下 自动播放动画的功能
    (sp.Skeleton.prototype as any)['update'] = function (dt: number) {
        if (EDITOR) {
            // 在 Cocos Creator 3.x 中，编辑器模式的处理方式可能已改变
            // 如果需要编辑器模式下的特殊处理，可以在这里添加
        }

        if (this.paused) { return; }
        
        // 获取全局 timeScale，如果不存在则默认为 1
        const globalTimeScale = (sp as any).timeScale || 1;
        dt *= this.timeScale * globalTimeScale;

        // 检查是否是缓存动画模式
        if (!this.isAnimationCached()) {
            this._updateRealtime(dt);
            return;
        }

        if (this._isAniComplete) {
            if (this._animationQueue.length === 0 && !this._headAniInfo) {
                let frameCache = this._frameCache;
                if (frameCache && frameCache.isInvalid()) {
                    frameCache.updateToFrame();
                    let frames = frameCache.frames;
                    this._curFrame = frames[frames.length - 1];
                }
                return;
            }
            if (!this._headAniInfo) {
                this._headAniInfo = this._animationQueue.shift();
            }
            this._accTime += dt;
            if (this._accTime > this._headAniInfo.delay) {
                let aniInfo = this._headAniInfo;
                this._headAniInfo = null;
                this.setAnimation(0, aniInfo.animationName, aniInfo.loop);
            }
            return;
        }

        this._updateCache(dt);
    };
}
