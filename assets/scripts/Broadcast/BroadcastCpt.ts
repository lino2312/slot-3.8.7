import { _decorator, Button, Component, Enum, find, Label, Layout, Node, RichText, Sprite, SpriteFrame, tween, UITransform } from 'cc';
import { App } from '../App';
import { PopUpAnimType } from '../component/PopupComponent';
import RewardListCpt from '../component/RewardListCpt';
const { ccclass, property } = _decorator;

@ccclass('BroadcastCpt')
export default class BroadcastCpt extends Component {
        @property(Node)
        contentNode: Node | null = null;
        @property(Label)
        contentLabel: any = null;
        @property(RichText)
        contentLabelRich: RichText | null = null;
        @property(Layout)
        layout: Layout | null = null;
        @property(RewardListCpt)
        rewardListCpt: RewardListCpt = null;
        @property(SpriteFrame)
        bgFrames: SpriteFrame[] = [];
        @property(SpriteFrame)
        iconFrames: SpriteFrame[] = [];
        @property(Button)
        btnGo: Button | null = null;
        @property
        speed: number = 300;
        @property
        delay: number = 0.5;
        closeFunc: Function;
        contentLabelShow: any = null;
        private _uid: any = null;
        protected onLoad(): void {
                this.contentLabelShow = this.contentLabel || this.contentLabelRich;
                this.layout.node.active = false;
                this.contentLabelShow.node.opacity = 1;
                //注册事件
                if (this.btnGo) {
                        // db://assets/hall/prefabs/popup/popupPersonalInfo.prefab
                        App.PopUpManager.addPopup("prefabs/popup/popupPersonalInfo", "hall", {
                                // opacityIn: true,
                                // multiple: true,
                                onShow: (node) => {
                                        let cpt = node.getComponent("PersonalInfo");
                                        if (cpt) {
                                                cpt.init(this._uid);
                                        }
                                }
                        }, false, null, PopUpAnimType.scale, PopUpAnimType.scale);
                }
        }
        //    //初始化ui
        initUI(data) {
                let rtype = data.type;
                if (data.extra_info == null || data.extra_info == undefined) return;
                //判断类型枚举
                let broadEnum = Enum({
                        SLIVER: 4,//银喇叭
                        GOLD: 5,//金喇叭
                });
                let userInfo = data.extra_info;
                this._uid = userInfo.uid;
                let bg = find("bg", this.node);
                let icon = find("icon", this.node);
                let headNode = find("node_head", this.node);
                bg.getComponent(Sprite).spriteFrame = this.bgFrames[rtype - broadEnum.SLIVER];
                icon.getComponent(Sprite).spriteFrame = this.iconFrames[rtype - broadEnum.SLIVER];
                // 设置头像
                let headCmp: any = headNode.getComponent("HeadCmp");
                headCmp.setHead(userInfo.uid, userInfo.usericon);
                let _avatarframe = userInfo.avatarframe.toString();
                _avatarframe = _avatarframe.indexOf("avatarframe_") >= 0 ? _avatarframe : "avatarframe_0";
                headCmp.setAvatarFrame(_avatarframe);
        }
        //    // direction 1: 右进左出 2:左进右出
        run(params: any) {
                let count = params.count || 1;
                this.layout.node.active = false;
                this.closeFunc = params.closeFunc;
                this.contentLabelShow.string = params.content;
                if (!!params.rewards) {
                        let nodeMap = this.rewardListCpt.updateView(params.rewards);
                        if (nodeMap[1]) nodeMap[1].icon.scale = 0.4;
                        if (nodeMap[25]) nodeMap[25].icon.scale = 0.4;
                        if (nodeMap[53]) nodeMap[53].icon.scale = 0.3;
                        if (nodeMap[54]) nodeMap[54].icon.scale = 0.5;
                } else {
                        this.rewardListCpt.closeAll();
                }
                // 执行播放, 动作结束移除自己
                this.scheduleOnce(() => {
                        this.layout.node.active = true;
                        this.layout.updateLayout();
                        this.contentLabelShow.node.opacity = 255;
                        // 右进左出(英文版)
                        let startX = 0;
                        if (params.direction == 1) {
                                // 设置起始位置,和结束位置
                                startX = this.contentNode.getComponent(UITransform)!.width / 2 + this.layout.getComponent(UITransform)!.width / 2;
                        } else {
                                startX = -(this.contentNode.getComponent(UITransform)!.width / 2 + this.layout.node.getComponent(UITransform)!.width / 2);
                        }
                        let endx = -startX;
                        this.layout.node.x = startX;
                        // 计算执行时间 (距离除以速度)
                        let animTime = (this.contentNode.getComponent(UITransform)!.width + this.layout.node.getComponent(UITransform)!.width) / this.speed;
                        if (count > 1) animTime *= 2;//如果次数是多次，速度放慢一倍
                        //播放几次的喇叭
                        let tw1 = tween(this.layout.node)
                                .call(() => { this.layout.node.x = startX; })
                                .to(animTime, { x: endx })
                                .start()
                        tween(this.layout.node)
                                .repeat(count, tw1)
                                .delay(this.delay)
                                .call(() => {
                                        this.node.destroy();
                                })
                                .start()
                });
        }
        protected onDestroy(): void {
                this.closeFunc && this.closeFunc();
        }
}

