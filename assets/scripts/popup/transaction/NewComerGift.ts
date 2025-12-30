import { _decorator, Component, Node, Button, Label, find, Vec2, Vec3 } from 'cc';
import { App } from '../../App';
const { ccclass, property } = _decorator;

declare const Global: any;
declare const MsgId: any;
declare const EventId: any;

@ccclass('NewComerGift')
export class NewComerGift extends Component {
    @property(Button) btnGet: Button = null!;
    @property(Button) btnRule: Button = null!;
    @property(Button) popupClose: Button = null!;
    @property(Button) btnLater: Button = null!;

    private coin = 0;

    onLoad() {
        App.NetManager.on(App.MessageID.GET_NEWER_GIFT_REWARDS, (msg) => {
            this.onGetNewerGiftRewards(msg);
        });
        // Bind button events
        this.btnGet?.node.on(Button.EventType.CLICK, this.onGetRewards, this);
        this.btnRule?.node.on(Button.EventType.CLICK, this.onClickRule, this);
        this.popupClose?.node.on(Button.EventType.CLICK, this.onClickLogin, this);
        this.btnLater?.node.on(Button.EventType.CLICK, this.onClickLater, this);

        App.EventUtils.on(App.EventID.HIDE_ALREADY_ACCOUNT, this.onRcvHideAccount, this);
    }

    onDestroy() {
        App.NetManager.off(App.MessageID.GET_NEWER_GIFT_REWARDS);
        App.EventUtils.off(App.EventID.HIDE_ALREADY_ACCOUNT, this.onRcvHideAccount, this);
        // this.btnGet?.node.off(Button.EventType.CLICK, this.onGetRewards, this);
        // this.btnRule?.node.off(Button.EventType.CLICK, this.onClickRule, this);
        // this.popupClose?.node.off(Button.EventType.CLICK, this.onClickLogin, this);
        // this.btnLater?.node.off(Button.EventType.CLICK, this.onClickLater, this);
    }

    onRcvHideAccount() {
        if (this.popupClose) this.popupClose.node.active = false;
        if (this.btnLater) this.btnLater.node.active = false;
        if (this.btnGet) {
            const p = this.btnGet.node.position;
            this.btnGet.node.setPosition(p.x + 230, p.y, p.z);
        }
    }

    setCoin(val: number) {
        this.coin = val;
        const labelNode = find('bg_newer_gift/lbl', this.node);
        labelNode?.getComponent(Label) && (labelNode.getComponent(Label)!.string = String(val));
    }

    onClickLater() {
        App.PopUpManager.closePopup(this.node);
    }

    onClickLogin() {
        App.GameManager.goBackLoginScene();
        // App.PopUpManager.addPopup("prefabs/welcomeBonus/main", "hall", null, true);
    }

    onGetRewards() {
        App.PopUpManager.allowMultiple = true;
        App.PopUpManager.addPopup(
            "prefabs/welcomeBonus/main",
            'hall',
            null,
            true,
        );
    }

    private onGetNewerGiftRewards(msg: any) {
        if (msg?.code !== 200) return;
        if (msg?.spcode && msg.spcode > 0) {
            App.AlertManager.showFloatTip(App.CommonUtils.spcode2String(msg.spcode));
            return;
        }

        // Fly reward effect from btnGet world position
        const wp: Vec3 | undefined = this.btnGet.node.worldPosition;
        const pos2 = wp ? new Vec2(wp.x, wp.y) : new Vec2(0, 0);
        App.AnimationUtils.RewardFly(msg.rewards, pos2);
        // App.PopUpManager.closePopup(this.node);
    }

    onClickRule() {
        // App.PopUpManager.addPopup("prefabs/popup/popupNewergiftRule", "hall", this.coin, true);
    }
}