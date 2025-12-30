import { _decorator, Button, Component, Enum, find, Prefab, UITransform, Vec3 } from 'cc';
import { App } from './App';
import { Config } from './config/Config';
import { Tabbar } from './widget/Tabbar';

const { ccclass, menu, requireComponent, property } = _decorator;

let PopupType = Enum({
    Prefab: 1,
    Path: 2,
});
let AnimType = Enum({
    None: 1,
    OpacityIn: 2,
    ScaleIn: 3,
    BottomIn: 4,
    RightIn: 5,
    LeftIn: 6,
});
let CloseAnimType = Enum({
    None: 1,
    ScaleOut: 2,
    BottomOut: 4,
    RightOut: 5,
    LeftOut: 6,
});
@ccclass('PopupBtnCmp')
@menu('弹窗相关/弹窗入口')
@requireComponent(Button)
export class PopupBtnCmp extends Component {

    @property({ type: Enum(PopupType) })
    popupType = PopupType.Prefab;

    // path - 只有 popupType == Path 才显示
    @property({
        visible(this: PopupBtnCmp) {
            return this.popupType === PopupType.Path;
        }
    })
    path: string = '';

    // prefab - 只有 popupType == Prefab 才显示
    @property({
        type: Prefab,
        visible(this: PopupBtnCmp) {
            return this.popupType === PopupType.Prefab;
        }
    })
    prefab: Prefab | null = null;

    // nodePath - 只有 setTabIndex == true 才显示
    @property({
        visible(this: PopupBtnCmp) {
            return this.setTabIndex;
        }
    })
    nodePath: string = '';

    // 打开动画类型
    @property({ type: Enum(AnimType) })
    animType = AnimType.None;

    // 关闭动画类型
    @property({ type: Enum(CloseAnimType) })
    closeAnimType = CloseAnimType.None;

    // 关闭按钮提示
    @property
    noCloseHit = false;

    // 关闭黑色遮罩
    @property
    noMask = false;

    // 打开 tabbar 对应 index
    @property
    setTabIndex = false;

    // index - 需要 setTabIndex = true 才显示
    @property({
        visible(this: PopupBtnCmp) {
            return this.setTabIndex;
        }
    })
    index: string = '';

    // 上报开关
    @property
    report = false;

    // reportKey - 只有 report = true 才显示
    @property({
        visible(this: PopupBtnCmp) {
            return this.report;
        }
    })
    reportKey: string = '';
    @property
    public noTouchClose = false;
    private initScale: any = null;
    onLoad() {
        this.initScale = this.node.scale;
        let button = this.node.getComponent(Button)
        if (button) {
            this.node.on('click', this.onClick, this);
        }
        if (this.node.name === "btn_bous_no" && Config.gameChannel === "D105") {
            this.node.active = !(App.userData().userInfo.firstRecharge == 0);
        }
        if (this.node.name === "btn_welcome_no" && App.userData().userInfo) {
            this.node.active = !App.userData().userInfo.kycVerificationStatus;
        }
        if (Config.gameChannel === "D106") {
            if (this.node.name === "btn_cards_no" || this.node.name === "btn_bous_no" || this.node.name === "btn_rank") {
                this.node.active = false
                return;
            }
        }
    }

    onClick() {
        let tempPopup = null;
        if (this.popupType == PopupType.Path) {
            tempPopup = this.path;
        } else if (this.popupType == PopupType.Prefab) {
            tempPopup = this.prefab;
        }
        let args = {
            noCloseHit: this.noCloseHit,
            noTouchClose: this.noTouchClose,
            noMask: this.noMask,
            opacityIn: false,
            scaleIn: false,
            bottomIn: false,
            rightIn: false,
            leftIn: false,
            bottomOut: false,
            rightOut: false,
            leftOut: false,
            scaleOut: false,
            scaleOutParm: {},
            onShow: (node) => {
                if (this.setTabIndex) {
                    let tabbarNode = find(this.nodePath, node);
                    if (tabbarNode) {
                        let tabbarCpt = tabbarNode.getComponent(Tabbar)
                        if (tabbarCpt) {
                            tabbarCpt.setPage(Number(this.index));
                        }
                    }
                }
            },
        };
        if (this.animType == AnimType.OpacityIn) {
            args.opacityIn = true;
        } else if (this.animType == AnimType.ScaleIn) {
            args.scaleIn = true;
        } else if (this.animType == AnimType.BottomIn) {
            args.bottomIn = true;
        } else if (this.animType == AnimType.RightIn) {
            args.rightIn = true;
        } else if (this.animType == AnimType.LeftIn) {
            args.leftIn = true;
        }
        if (this.closeAnimType == CloseAnimType.ScaleOut) {
            args.scaleOut = true;
            let worldPos = this.node.getComponent(UITransform).convertToWorldSpaceAR(new Vec3(0, 0, 0));
            let endPos = find("Canvas").getComponent(UITransform).convertToNodeSpaceAR(worldPos);
            args.scaleOutParm = {
                toPos: endPos,
                node: this.node,
                scale: this.initScale,
            };
        } else if (this.closeAnimType == CloseAnimType.BottomOut) {
            args.bottomOut = true;
        } else if (this.closeAnimType == CloseAnimType.RightOut) {
            args.rightOut = true;
        } else if (this.closeAnimType == CloseAnimType.LeftOut) {
            args.leftOut = true;
        }
        App.PopUpManager.addPopup(tempPopup, "hall", args);
        // App.PopUpManager.addPopup("prefabs/ShareToPlayer", "hall", null, true);
    }

}

