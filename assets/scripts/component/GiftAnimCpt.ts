import { _decorator, Component, Node, Sprite, SpriteAtlas } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('GiftAnimCpt')
export default class GiftAnimCpt extends Component {
    @property(Node)
    bgNode: Node | null = null;
    @property(Sprite)
    giftIcon: Sprite | null = null;
    @property(Node)
    sendUserNode: Node | null = null;
    @property(Node)
    receiveUserNode: Node | null = null;
    @property(Node)
    charmNode: Node | null = null;
    @property(Node)
    charmNode2: Node | null = null;
    @property(SpriteAtlas)
    texture: SpriteAtlas | null = null;
    private closeFunc: Function;
    protected onLoad(): void {
//        // cc.find("gift_ice", this.node).getComponent(sp.Skeleton).setCompleteListener(() => { this.node.active = false; })
        // cc.find("gift_car", this.node).getComponent(sp.Skeleton).setCompleteListener(() => { this.node.active = false; })
        // cc.find("gift_evil", this.node).getComponent(sp.Skeleton).setCompleteListener(() => { this.node.active = false; })
        // cc.find("gift_kiss", this.node).getComponent(sp.Skeleton).setCompleteListener(() => { this.node.active = false; })
        // cc.find("gift_money", this.node).getComponent(sp.Skeleton).setCompleteListener(() => { this.node.active = false; })
        // cc.find("gift_poker", this.node).getComponent(sp.Skeleton).setCompleteListener(() => { this.node.active = false; })
        // cc.find("gift_ring", this.node).getComponent(sp.Skeleton).setCompleteListener(() => { this.node.active = false; })
        // cc.find("gift_tower", this.node).getComponent(sp.Skeleton).setCompleteListener(() => { this.node.active = false; })
        // cc.find("gift_cake", this.node).getComponent(sp.Skeleton).setCompleteListener(() => { this.node.active = false; })
        // cc.find("gift_tea", this.node).getComponent(sp.Skeleton).setCompleteListener(() => { this.node.active = false; })
        // cc.find("gift_hookah", this.node).getComponent(sp.Skeleton).setCompleteListener(() => { this.node.active = false; })
    }
    protected onEnable(): void {
        // this.bgNode.opacity = 0;
        // this.bgNode.on("click", this.onClickClose, this)
        // this.charmNode.active = false;
        // this.charmNode2.active = false;

        // cc.find("gift_ice", this.node).active = false;
        // cc.find("gift_car", this.node).active = false;
        // cc.find("gift_evil", this.node).active = false;
        // cc.find("gift_kiss", this.node).active = false;
        // cc.find("gift_money", this.node).active = false;
        // cc.find("gift_poker", this.node).active = false;
        // cc.find("gift_ring", this.node).active = false;
        // cc.find("gift_tower", this.node).active = false;
        // cc.find("gift_cake", this.node).active = false;
        // cc.find("gift_tea", this.node).active = false;
        // cc.find("gift_hookah", this.node).active = false;

    }
    protected onDisable(): void {
        // this.closeFunc && this.closeFunc();
    }
    onInit(parms, closeFunc) {
        // try {
        // this.closeFunc = closeFunc;
        // cc.tween(this.bgNode).to(0.3, { opacity: 77 }).start();
//            // 设置头像框
        // this.sendUserNode.getComponentInChildren("HeadCmp").setHead(parms.send.uid, parms.send.usericon);
        // this.sendUserNode.getComponentInChildren("HeadCmp").setAvatarFrame(parms.send.avatarframe);
        // this.receiveUserNode.getComponentInChildren("HeadCmp").setHead(parms.receive.uid, parms.receive.usericon);
        // this.receiveUserNode.getComponentInChildren("HeadCmp").setAvatarFrame(parms.receive.avatarframe);

        // cc.find("username", this.sendUserNode).getComponent(cc.Label).string = parms.send.playername;
        // cc.find("username", this.receiveUserNode).getComponent(cc.Label).string = parms.receive.playername;
//            // 设置礼物图标
        // this.giftIcon.spriteFrame = this.texture.getSpriteFrame(parms.info.img);
        // this.giftIcon.node.opacity = 0;
//            // 动作
        // let leftStartPos = cc.v2(-(cc.winSize.width / 2 + 300), 850);
        // let leftEndPos = cc.v2(-300, 850)

        // let rightStartPos = cc.v2((cc.winSize.width / 2 + 300), 650);
        // let rightEndPos = cc.v2(300, 650)

        // this.receiveUserNode.position = cc.v3(leftStartPos);
        // cc.tween(this.receiveUserNode).to(0.5, { position: leftEndPos }, { easing: 'sineOut' }).start();
        // this.sendUserNode.position = cc.v3(rightStartPos);
        // cc.tween(this.sendUserNode).to(0.5, { position: rightEndPos }, { easing: 'sineOut' }).start();

        // this.scheduleOnce(() => {
        // this.giftIcon.node.position = cc.v3(rightEndPos);
        // cc.tween(this.giftIcon.node)
        // .call(() => { this.giftIcon.node.opacity = 255; })
//                    // .then(cc.bezierTo(2, [leftEndPos, leftEndPos, leftEndPos]))
        // .to(0.5, { position: leftEndPos }, { easing: "sineOut" })
        // .delay(0.3)
        // .call(() => {
        // this.giftIcon.node.opacity = 0;
//                        // 飘分
        // this.charmNode.active = true;
        // this.charmNode.scale = 1.5
        // this.charmNode.position = this.receiveUserNode.position;
        // this.charmNode.getComponentInChildren(cc.Label).string = "+" + Global.FormatNumToComma(parms.info.charm);
        // cc.tween(this.charmNode)
        // .to(0.5, { position: this.receiveUserNode.position.add(cc.v3(0, 200)), scale: 1.9 })
        // .delay(1)
        // .call(() => { this.charmNode.active = false }).start()
        // this.charmNode2.active = true;
        // this.charmNode2.scale = 1.5
        // this.charmNode2.position = this.sendUserNode.position;
        // this.charmNode2.getComponentInChildren(cc.Label).string = "+" + Global.FormatNumToComma(parms.info.charm);
        // cc.tween(this.charmNode2)
        // .to(0.5, { position: this.sendUserNode.position.add(cc.v3(0, 200)), scale: 1.9 })
        // .delay(1)
        // .call(() => { this.charmNode2.active = false }).start()
        // })
        // .start();
//                // 设置动画
        // let giftNode = cc.find(parms.info.img, this.node);
        // if (giftNode) {
        // if (parms.info.img == "gift_ice") {
        // giftNode.opacity = 0;
        // giftNode.active = true;
        // cc.tween(giftNode).to(1, { opacity: 255 }).delay(1).call(() => {
//                            // this.node.destroy();
        // this.node.active = false;
        // }).start();
        // } else {
//                        // giftNode.getComponent(sp.Skeleton).setCompleteListener(() => {
//                        //     // this.node.destroy();
//                        //     this.node.active = false;
//                        // })
        // giftNode.active = true;

        // let animNameMap = {
        // "gift_car": "animation",
        // "gift_evil": "ermobao",
        // "gift_kiss": "animation",
        // "gift_money": "chaopiaoqian",
        // "gift_poker": "pkbjb2",
        // "gift_ring": "animation",
        // "gift_tower": "animation",
        // "gift_cake": "animation",
        // "gift_tea": "animation",
        // "gift_hookah": "animation",
        // }
        // giftNode.getComponent(sp.Skeleton).setAnimation(0, animNameMap[parms.info.img], false)
        // }
//                    // 播放音效
        // cc.vv.AudioManager.playEff("BalootClient/BaseRes/", parms.info.img, true);
        // }
        // }, 1);
        // } catch (error) {
        // this.node.active = false;
        // }
    }
    onClickClose() {
//        // this.node.destroy();
    }
}


/**
 * 注意：已把原脚本注释，由于脚本变动过大，转换的时候可能有遗落，需要自行手动转换
 */
// const { ccclass, property } = cc._decorator;
// 
// @ccclass
// export default class GiftAnimCpt extends cc.Component {
// 
//     @property(cc.Node)
//     bgNode: cc.Node = null;
//     @property(cc.Sprite)
//     giftIcon: cc.Sprite = null;
//     @property(cc.Node)
//     sendUserNode: cc.Node = null;
//     @property(cc.Node)
//     receiveUserNode: cc.Node = null;
// 
//     @property(cc.Node)
//     charmNode: cc.Node = null;
//     @property(cc.Node)
//     charmNode2: cc.Node = null;
// 
// 
//     @property(cc.SpriteAtlas)
//     texture: cc.SpriteAtlas = null;
//     private closeFunc: Function;
// 
//     protected onLoad(): void {
//         // cc.find("gift_ice", this.node).getComponent(sp.Skeleton).setCompleteListener(() => { this.node.active = false; })
//         cc.find("gift_car", this.node).getComponent(sp.Skeleton).setCompleteListener(() => { this.node.active = false; })
//         cc.find("gift_evil", this.node).getComponent(sp.Skeleton).setCompleteListener(() => { this.node.active = false; })
//         cc.find("gift_kiss", this.node).getComponent(sp.Skeleton).setCompleteListener(() => { this.node.active = false; })
//         cc.find("gift_money", this.node).getComponent(sp.Skeleton).setCompleteListener(() => { this.node.active = false; })
//         cc.find("gift_poker", this.node).getComponent(sp.Skeleton).setCompleteListener(() => { this.node.active = false; })
//         cc.find("gift_ring", this.node).getComponent(sp.Skeleton).setCompleteListener(() => { this.node.active = false; })
//         cc.find("gift_tower", this.node).getComponent(sp.Skeleton).setCompleteListener(() => { this.node.active = false; })
//         cc.find("gift_cake", this.node).getComponent(sp.Skeleton).setCompleteListener(() => { this.node.active = false; })
//         cc.find("gift_tea", this.node).getComponent(sp.Skeleton).setCompleteListener(() => { this.node.active = false; })
//         cc.find("gift_hookah", this.node).getComponent(sp.Skeleton).setCompleteListener(() => { this.node.active = false; })
//     }
// 
// 
//     protected onEnable(): void {
//         this.bgNode.opacity = 0;
//         this.bgNode.on("click", this.onClickClose, this)
//         this.charmNode.active = false;
//         this.charmNode2.active = false;
// 
//         cc.find("gift_ice", this.node).active = false;
//         cc.find("gift_car", this.node).active = false;
//         cc.find("gift_evil", this.node).active = false;
//         cc.find("gift_kiss", this.node).active = false;
//         cc.find("gift_money", this.node).active = false;
//         cc.find("gift_poker", this.node).active = false;
//         cc.find("gift_ring", this.node).active = false;
//         cc.find("gift_tower", this.node).active = false;
//         cc.find("gift_cake", this.node).active = false;
//         cc.find("gift_tea", this.node).active = false;
//         cc.find("gift_hookah", this.node).active = false;
// 
//     }
// 
//     protected onDisable(): void {
//         this.closeFunc && this.closeFunc();
//     }
// 
//     onInit(parms, closeFunc) {
//         try {
//             this.closeFunc = closeFunc;
//             cc.tween(this.bgNode).to(0.3, { opacity: 77 }).start();
//             // 设置头像框
//             this.sendUserNode.getComponentInChildren("HeadCmp").setHead(parms.send.uid, parms.send.usericon);
//             this.sendUserNode.getComponentInChildren("HeadCmp").setAvatarFrame(parms.send.avatarframe);
//             this.receiveUserNode.getComponentInChildren("HeadCmp").setHead(parms.receive.uid, parms.receive.usericon);
//             this.receiveUserNode.getComponentInChildren("HeadCmp").setAvatarFrame(parms.receive.avatarframe);
// 
//             cc.find("username", this.sendUserNode).getComponent(cc.Label).string = parms.send.playername;
//             cc.find("username", this.receiveUserNode).getComponent(cc.Label).string = parms.receive.playername;
//             // 设置礼物图标
//             this.giftIcon.spriteFrame = this.texture.getSpriteFrame(parms.info.img);
//             this.giftIcon.node.opacity = 0;
//             // 动作
//             let leftStartPos = cc.v2(-(cc.winSize.width / 2 + 300), 850);
//             let leftEndPos = cc.v2(-300, 850)
// 
//             let rightStartPos = cc.v2((cc.winSize.width / 2 + 300), 650);
//             let rightEndPos = cc.v2(300, 650)
// 
//             this.receiveUserNode.position = cc.v3(leftStartPos);
//             cc.tween(this.receiveUserNode).to(0.5, { position: leftEndPos }, { easing: 'sineOut' }).start();
//             this.sendUserNode.position = cc.v3(rightStartPos);
//             cc.tween(this.sendUserNode).to(0.5, { position: rightEndPos }, { easing: 'sineOut' }).start();
// 
//             this.scheduleOnce(() => {
//                 this.giftIcon.node.position = cc.v3(rightEndPos);
//                 cc.tween(this.giftIcon.node)
//                     .call(() => { this.giftIcon.node.opacity = 255; })
//                     // .then(cc.bezierTo(2, [leftEndPos, leftEndPos, leftEndPos]))
//                     .to(0.5, { position: leftEndPos }, { easing: "sineOut" })
//                     .delay(0.3)
//                     .call(() => {
//                         this.giftIcon.node.opacity = 0;
//                         // 飘分
//                         this.charmNode.active = true;
//                         this.charmNode.scale = 1.5
//                         this.charmNode.position = this.receiveUserNode.position;
//                         this.charmNode.getComponentInChildren(cc.Label).string = "+" + Global.FormatNumToComma(parms.info.charm);
//                         cc.tween(this.charmNode)
//                             .to(0.5, { position: this.receiveUserNode.position.add(cc.v3(0, 200)), scale: 1.9 })
//                             .delay(1)
//                             .call(() => { this.charmNode.active = false }).start()
//                         this.charmNode2.active = true;
//                         this.charmNode2.scale = 1.5
//                         this.charmNode2.position = this.sendUserNode.position;
//                         this.charmNode2.getComponentInChildren(cc.Label).string = "+" + Global.FormatNumToComma(parms.info.charm);
//                         cc.tween(this.charmNode2)
//                             .to(0.5, { position: this.sendUserNode.position.add(cc.v3(0, 200)), scale: 1.9 })
//                             .delay(1)
//                             .call(() => { this.charmNode2.active = false }).start()
//                     })
//                     .start();
//                 // 设置动画
//                 let giftNode = cc.find(parms.info.img, this.node);
//                 if (giftNode) {
//                     if (parms.info.img == "gift_ice") {
//                         giftNode.opacity = 0;
//                         giftNode.active = true;
//                         cc.tween(giftNode).to(1, { opacity: 255 }).delay(1).call(() => {
//                             // this.node.destroy();
//                             this.node.active = false;
//                         }).start();
//                     } else {
//                         // giftNode.getComponent(sp.Skeleton).setCompleteListener(() => {
//                         //     // this.node.destroy();
//                         //     this.node.active = false;
//                         // })
//                         giftNode.active = true;
// 
//                         let animNameMap = {
//                             "gift_car": "animation",
//                             "gift_evil": "ermobao",
//                             "gift_kiss": "animation",
//                             "gift_money": "chaopiaoqian",
//                             "gift_poker": "pkbjb2",
//                             "gift_ring": "animation",
//                             "gift_tower": "animation",
//                             "gift_cake": "animation",
//                             "gift_tea": "animation",
//                             "gift_hookah": "animation",
//                         }
//                         giftNode.getComponent(sp.Skeleton).setAnimation(0, animNameMap[parms.info.img], false)
//                     }
//                     // 播放音效
//                     cc.vv.AudioManager.playEff("BalootClient/BaseRes/", parms.info.img, true);
//                 }
//             }, 1);
//         } catch (error) {
//             this.node.active = false;
//         }
//     }
// 
//     onClickClose() {
//         // this.node.destroy();
//     }
// 
// }
