import { _decorator, Component, Director, director, Enum, find, instantiate, isValid, loader, Node, tween, v2, v3, Vec3 } from 'cc';
import { App } from '../App';
import BroadcastCpt from '../Broadcast/BroadcastCpt';
const { ccclass, property } = _decorator;

//待实现
@ccclass('BroadcastManager')
export class BroadcastManager extends Component {

    // @property(Prefab)
    // broadcastPrefab: Prefab = null; // 广播预制体

    // @property(Prefab)
    // giftAnimPrefab: Prefab = null; // 礼物动画预制体

    //    // 走马灯
    protected broadcastPrefabPath = "prefabs/broadcast/Broadcast"; //db://assets/hall/prefabs/broadcast/Broadcast.prefab
    protected broadcastPrefabPath2 = "prefabs/broadcast/newBroadcast";
    protected broadcastStack = [];
    protected broadcastQueue = [];
    //    // 礼物动画
    protected giftAnimPrefabPath = "prefabs/broadcast/PopupGiftAnim";
    protected giftAnimStack = [];
    protected giftAnimQueue = [];
    protected isRun = false;
    protected timer: any;

    protected onLoad(): void {
        App.BroadcastManager = this;
    }

    public init() {
        // 加载新场景只后 删除所有的弹窗
        director.on(Director.EVENT_BEFORE_SCENE_LAUNCH, () => {
            let giftAnimNode = find("Canvas/GiftAnim");
            if (!giftAnimNode) {
                App.ResUtils.getPrefab(this.giftAnimPrefabPath).then((prefab) => {
                    var node = instantiate(prefab)
                    node.active = false;
                    node.parent = find("Canvas");
                    node.setSiblingIndex(200);
                    node.position = v3(0, 400, 0);
                }).catch((err) => {
                    console.warn(err);
                });

            }
        }, this);
    }
    public run() {
        if (this.isRun) return;
        // 启动定时器,检测走马灯是否可以播放下一条
        this.isRun = true;
        this.timer = setInterval(this.checkQueue.bind(this), 100);
    }
    public stop() {
        // 启动定时器,检测走马灯是否可以播放下一条
        this.isRun = false;
        clearInterval(this.timer);
    }
    //    // 检测等待队列
    public checkQueue() {

        // if (!find("Canvas")) return;
        if (this.broadcastStack.length <= 0) {
            if (this.broadcastQueue.length > 0) {
                // 播放广播
                this.handleBroadcast();
            }
        }
        if (this.giftAnimStack.length <= 0) {
            if (this.giftAnimQueue.length > 0) {
                // 播放广播
                this.handleGiftAnim();
            }
        }
    }

    //    // 添加一条走马灯
    public addBroadcast(broadcastItem) {
        if (!this.isRun) return;
        this.broadcastQueue.push(broadcastItem);
        // 进行排序
        this.broadcastQueue.sort((a, b) => {
            return b.level - a.level;
        });
    }
    //    // 添加一条走马灯
    public addGiftAnim(broadcastItem) {
        if (!this.isRun) return;
        this.giftAnimQueue.push(broadcastItem);
    }

    //    // 播放一条广播
    public handleBroadcast() {
        if (!this.broadcastPrefabPath) return;
        let _item = this.broadcastQueue.shift();
        this.broadcastStack.push(_item);
        //判断类型枚举
        let broadEnum = Enum({
            SLIVER: 4,//银喇叭
            GOLD: 5,//金喇叭
        });
        let broadcastPath = this.broadcastPrefabPath;
        if (_item.type == broadEnum.SLIVER || _item.type == broadEnum.GOLD) {
            broadcastPath = this.broadcastPrefabPath2;
        }

        App.ResUtils.getPrefab(broadcastPath).then((prefab) => {

            let nParent = find("Canvas/broadcast")
            if (!isValid(nParent)) return
            let node: Node = instantiate(prefab)
            let broadcastCpt = node.getComponent(BroadcastCpt);
            if (_item.type == broadEnum.SLIVER || _item.type == broadEnum.GOLD) {
                broadcastCpt.initUI(_item);
            }
            broadcastCpt.rewardListCpt.closeAll();
            node.position = v3(0, 0);
            // node.scaleY = 0;
            node.scale = new Vec3(node.scale.x, 0, node.scale.z);
            // node.zIndex = 0;
            node.setSiblingIndex(0);
            node.active = true;
            nParent.addChild(node);
            tween(node)
                .to(0.5, {
                    scale: new Vec3(node.scale.x, node.scale.x, node.scale.z)
                })
                .call(() => {
                    broadcastCpt.run({
                        direction: _item.direction || 1,
                        content: _item.content,
                        rewards: _item.rewards,
                        count: _item.count,
                        closeFunc: () => {
                            this.broadcastStack = this.broadcastStack.filter(item => item !== _item);
                        }
                    });
                })
                .start();

        }).catch((err) => {
            console.warn(err);
        });





    }

    //    // 播放一条礼物动画
    public handleGiftAnim() {
        if (!this.giftAnimPrefabPath) return;
        let _item = this.giftAnimQueue.shift();
        this.giftAnimStack.push(_item);
        let giftAnimNode = find("Canvas/GiftAnim");
        if (giftAnimNode) {
            let cpt: any = giftAnimNode.getComponent("GiftAnimCpt");
            if (cpt) {
                giftAnimNode.active = true;
                cpt.onInit(_item, () => {
                    this.giftAnimStack = this.giftAnimStack.filter(item => item !== _item);
                });
            }
        } else {
            loader.loadRes(this.giftAnimPrefabPath, function (err, prefab) {
                if (!err) {
                    let nParent = find("Canvas")
                    if (!isValid(nParent)) return
                    var node = instantiate(prefab)     //创建弹框
                    node.parent = nParent;
                    node.setSiblingIndex(200);
                    node.position = v2(0, 400)
                    let cpt = node.getComponent("GiftAnimCpt")
                    if (cpt) {
                        cpt.onInit(_item, () => {
                            this.giftAnimStack = this.giftAnimStack.filter(item => item !== _item);
                        });
                    }
                }
            }.bind(this));


            App.ResUtils.getPrefab(this.giftAnimPrefabPath).then((prefab) => {

                let nParent = find("Canvas")
                if (!isValid(nParent)) return
                var node = instantiate(prefab)     //创建弹框
                node.parent = nParent;
                node.setSiblingIndex(200);
                node.position = v3(0, 400, 0)
                let cpt: any = node.getComponent("GiftAnimCpt")
                if (cpt) {
                    cpt.onInit(_item, () => {
                        this.giftAnimStack = this.giftAnimStack.filter(item => item !== _item);
                    });
                }

            }).catch((err) => {
                console.warn(err);
            });

        }
    }

}


