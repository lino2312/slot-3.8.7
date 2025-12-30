import { _decorator, Component, Node, Prefab, NodePool, instantiate, Vec3, screen, tween } from 'cc';
const { ccclass, property } = _decorator;

/**
 * 掉落金币
 */
@ccclass('DropCoins')
export class DropCoins extends Component {
    
    @property(Prefab)
    coin_prefab: Prefab = null;
    
    @property
    autoPlay: boolean = false;

    private _coinPool: NodePool;
    private _totalNum: number = 30;
    private _endWidth: number = 600;
    private _startWidth: number = 100;
    private _maxHeight: number = 0;
    private _bPlay: boolean = false;
    private _frameTime: number = 0;

    onLoad() {
        this._coinPool = new NodePool();
    }

    start() {
        if (this.autoPlay) {
            this.setPlay();
        }
    }

    //开始播放
    //nNum 越小越少
    //startWidth 出生的时候随机x偏移范围
    //endWidth 结束点x偏移最大宽度
    //endHeight 结束y偏移最大高度
    setPlay(nNum: number = 30, startWidth: number = 100, endWidth: number = 600, endHeight?: number) {
        this._totalNum = nNum;
        this._endWidth = endWidth;
        this._startWidth = startWidth;
        this._maxHeight = screen.windowSize.height;
        if (endHeight) {
            this._maxHeight = endHeight;
        }
        this.node.active = true;
        this._bPlay = true;
        this._frameTime = 0;
    }

    stopPlay() {
        this.node.active = false;
        this._bPlay = false;
        this._coinPool.clear();
    }

    onDestroy() {
        this._coinPool.clear();
    }

    _generate() {
        if (!this._bPlay) {
            return;
        }

        let pool = this._coinPool;
        let coin: Node = null;
        if (pool.size() > 0) {
            coin = pool.get();
        } else {
            coin = instantiate(this.coin_prefab);
        }
        this.node.addChild(coin);

        let ranVal = Math.random();
        let dir = -1;
        if (ranVal >= 0.5) {
            dir = 1;
        }
        coin.setScale(ranVal, ranVal, ranVal);

        let startPos = new Vec3(Math.random() * this._startWidth * dir, 0, 0);
        let endPos = new Vec3(Math.random() * this._endWidth * dir, -this._maxHeight / 2, 0);
        coin.setPosition(startPos);

        let height = (0.2 + Math.random() * 0.4) * this._maxHeight;
        let duration = (1 + Math.random()); // 移除了Global.SLOT_GAME_SPEED的依赖
        
        // 停止所有动画并开始新的动画
        tween(coin).stop();
        
        // 创建跳跃和缩放动画
        tween(coin)
            .parallel(
                tween().to(duration, { scale: new Vec3(1, 1, 1) }),
                tween().to(duration, { position: endPos }, {
                    // 简化的跳跃效果，使用贝塞尔曲线模拟
                    easing: 'bounceOut'
                })
            )
            .call(() => {
                pool.put(coin);
            })
            .start();
    }

    update(dt: number) {
        this._frameTime += dt;
        let speedMultiplier = 1; // 可以根据需要调整速度，替代Global.SLOT_GAME_SPEED
        if (this._frameTime > (1 / this._totalNum) / speedMultiplier) {   //控制数量
            this._frameTime = 0;
            this._generate();
        }
    }
}


