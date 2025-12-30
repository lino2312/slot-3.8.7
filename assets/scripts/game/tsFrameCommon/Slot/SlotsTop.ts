import { Label, Node, Prefab, UITransform, Vec3, _decorator, assetManager, find, instantiate, isValid, log, resources, sp, tween, v2, v3 } from 'cc';
import { App } from '../../../App';
import BaseComponent from "../Base/BaseComponent";
import EventDispatcher from "../Base/EventDispatcher";
import Utils from "../Base/MyUtils";
import SlotGameData from "./SlotsGameData";
const { ccclass, property } = _decorator;

@ccclass
export default class SlotsTop extends BaseComponent {

    @property(Node)
    ndHead: Node = null;

    @property(Node)
    ndCoinsNum: Node = null;

    @property(Node)
    ndLessCoin: Node = null;

    @property(Node)
    ndMenuAni: Node = null;

    // LIFE-CYCLE CALLBACKS:

    onLoad() {
        EventDispatcher.getInstance().on(SlotGameData.BUNDLE_NAME + "_PlayerScoreChange", this.onEventMsg_PlayerScoreChange, this);
        EventDispatcher.getInstance().on(SlotGameData.BUNDLE_NAME + "_BetChange", this.onEventMsg_BetChange, this);

        if ((globalThis as any).App?.EventUtils) {
            (globalThis as any).App.EventUtils.on("USER_INFO_CHANGE", this.showHeadInfo, this);
        }
    }

    onDestroy() {
        EventDispatcher.getInstance().off(SlotGameData.BUNDLE_NAME + "_PlayerScoreChange", this.onEventMsg_PlayerScoreChange, this);
        EventDispatcher.getInstance().off(SlotGameData.BUNDLE_NAME + "_BetChange", this.onEventMsg_BetChange, this);
    }

    start() {
        this.showCoin()
        this.showHeadInfo()
    }

    // // update (dt) {}

    onEventMsg_PlayerScoreChange() {
        this.showCoin()
    }

    onEventMsg_BetChange() {
        this.onBetChange();
    }

    onPlayCommomClickAudio() {
        App.AudioManager.playSfx("audio/slotGame/", "common_click", null, null);
    }

    onClickEvent(event, data: string) {
        // if (SlotGameData.IS_SINGLE_MODLE) {
        //     return;
        // }
        switch (data) {
            case 'menu':
                this.onClickMenu(event, data);
                break;
            case 'purchase':
                this.onClickPurchase();
                break;
            case 'record':
                this.onClickRecord();
                break;
            default:
                break;
        }
    }

    onClickMenu(event, data) {
        this.onPlayCommomClickAudio();
        this.showMenuAni(true)

        assetManager.loadBundle("hall", (err, bundle) => {
            if (err) {
                return;
            }
            bundle.load("prefabs/slotgame/LMSlots_MenuNode", Prefab, (err, prefab) => {
                if (err) {
                    return;
                }
                let old = this.node.parent.getChildByName('LMSlots_MenuNode')
                if (!old) {
                    let node = instantiate(prefab)
                    if ((globalThis as any).App?.ScreenUtils) {
                        (globalThis as any).App.ScreenUtils.FixDesignScale_V(node);
                    }
                    node.name = 'LMSlots_MenuNode'
                    node.parent = this.node.parent //加到父节点
                    let oldScaleY = node.scale.y;
                    let lvNode = event.target;
                    if (lvNode) {
                        const uiTransform = lvNode.getComponent(UITransform);
                        const parentUITransform = this.node.parent.getComponent(UITransform);
                        let pos = uiTransform.convertToWorldSpaceAR(Vec3.ZERO);
                        let tipPos = parentUITransform.convertToNodeSpaceAR(pos) ;
                        node.setPosition(v3(tipPos.x - 15, tipPos.y - (uiTransform?.height  / 2 - 5) * oldScaleY + 10, 0));
                        node.setScale(v3(1, 0, 1));
                        tween(node)
                            .to(0.1, { scale: v3(1, oldScaleY, 1) })
                            .start();
                    }
                    (node.getComponent("SlotGameMenuComponent") as any)?.setCloseCall(() => {
                        this.showMenuAni(false);
                    });
                }
            })

        })


    }

    onClickRecord() {
        this.onPlayCommomClickAudio();

        // const cc = (globalThis as any).cc;
        // if (!cc?.vv) {
        //     return;
        // }
        let cfg = App.SubGameManager.getSlotGameDataScript().getGameCfg();
        log(cfg, "cfg");

        let url = cfg.bet_records; // 动态资源路径
        let parts = url.split("/"); // 拆分路径
        let bundleName = `${parts[0]}/${parts[1]}`; // 动态获取子游戏的 Asset Bundle 名称
        let resourcePath = url.substring(bundleName.length + 1); // 获取资源在 Asset Bundle 中的路径

        // 加载 Asset Bundle
        // if (parts[0] == "games") {
            assetManager.loadBundle('hall', (err, bundle) => {
                if (err) {
                    console.error("加载子包失败:", bundleName, err);
                    return;
                }

                console.log("加载子包成功:", bundleName);

                // 加载资源
                bundle.load(url, Prefab, (err, prefab) => {
                    if (err) {
                        console.error("加载资源失败:", url, err);
                        return;
                    }

                    let parNode = find("Canvas");
                    if (isValid(parNode)) {
                        if (!parNode.getChildByName("record_pannel")) {
                            let node = instantiate(prefab);
                            node.parent = parNode;
                            node.name = "record_pannel";
                            console.log("动态实例化节点成功:", node.name);
                        }
                    }
                });
            });
        // }
        //  else {
        //     resources.load(bundleName + "/" + resourcePath, Prefab, (err, Prefab) => {
        //         if (!err) {
        //             let parNode = find("Canvas");
        //             if (isValid(parNode)) {
        //                 if (!parNode.getChildByName("record_pannel")) {
        //                     let node = instantiate(Prefab);
        //                     node.parent = parNode;
        //                     node.name = "record_pannel";
        //                     console.log("动态实例化节点成功:", node.name);
        //                 }
        //             }
        //         }
        //         else {
        //             log(err)
        //         }
        //     })
        // }

    }

    onClickPurchase() {
        this.onPlayCommomClickAudio();
        Utils.showRechargeTip();
    }

    showHeadInfo() {
        if (SlotGameData.IS_SINGLE_MODLE) {
            return;
        }
        if (!this.ndHead) {
            return;
        }
        const cc = (globalThis as any).cc;
        let avatarframe = cc?.vv?.UserManager?.avatarframe || 0;
        const headCmp = this.ndHead.getComponent("HeadCmp") as any;
        if (headCmp) {
            headCmp.setHead(SlotGameData.playerInfo.uid, SlotGameData.playerInfo.headIcon);
            headCmp.setAvatarFrame(avatarframe);
        }
    }

    //显示金币
    showCoin() {
        if (this.ndCoinsNum) {
            const label = this.ndCoinsNum.getComponent(Label);
            if (label) {
                label.string = Utils.floatToFormat(SlotGameData.playerInfo.score);
            }
        }

        //检查一下是否缺金币
        this.onBetChange()
    }

    showMenuAni(bshow) {
        if (this.ndMenuAni) {
            let aniName = bshow ? "animation_3" : "animation_4"
            this.ndMenuAni.getComponent(sp.Skeleton).setAnimation(0, aniName, false);
        }
    }

    onBetChange() {
        if (this.ndLessCoin) {
            this.ndLessCoin.active = SlotGameData.playerInfo.score < SlotGameData.getCurBetScore()
        }
    }
}
