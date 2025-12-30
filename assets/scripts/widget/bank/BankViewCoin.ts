import { _decorator, Component, Node, Prefab, SpriteAtlas, Sprite, Label, instantiate, Button, tween, Vec3, find, UITransform } from 'cc';
import { App } from '../../App';
import { TimeDownComponent } from '../../component/TimeDownComponent';
const { ccclass, property } = _decorator;

@ccclass('BankViewCoin')
export class BankViewCoin extends Component {
    @property(Node) contentNode: Node = null!;
    @property(Node) itemNode: Node = null!;
    @property(SpriteAtlas) commonAtlas: SpriteAtlas = null!;
    @property(Prefab) sendPrefab: Prefab = null!;

    private config: any[] = [];
    private netListener: any = null;

    onLoad() {
        this.initView();
    }

    protected onEnable(): void {
        App.NetManager.on(App.MessageID.PURCHASE_RECHARGE_SUC, (msg) => {
            this.onPurchaseRechargeSuccess(msg);
        })
        App.NetManager.send({ c: App.MessageID.REQ_SHOP_EX, stype: '1', platform: App.DeviceUtils.isIOS() ? 2 : 1 }, true);
        this.playSwingAnim();
    }

    protected onDisable(): void {
        App.NetManager.off(App.MessageID.PURCHASE_RECHARGE_SUC);
    }

    initView() {
        if (!this.contentNode || !this.itemNode) return;
        for (let i = 0; i < 6; i++) {
            const node = instantiate(this.itemNode);
            node.parent = this.contentNode;
            node.active = true;

            const btn = find('bg', node).getComponent(Button);
            const timeNode = find('bg/time', node);
            const timeCpt = timeNode.getComponent(TimeDownComponent);

            if (btn) {
                btn.node.on(Button.EventType.CLICK, () => this.onClickItem(i, timeCpt), this);
            }
            // 倒计时回调
            timeCpt.setCallback(() => {
                App.NetManager.send({ c: App.MessageID.REQ_SHOP_EX, stype: '1', platform: App.DeviceUtils.isIOS() ? 2 : 1 }, true);
            });
        }
        this.itemNode.active = false;
    }

    initData(config: any[]) {
        this.config = config || [];
        this.updateView();
    }

    updateView() {
        if (!this.config || !this.contentNode) return;

        for (let i = 0; i < 6; i++) {
            const item = this.contentNode.children[i];
            if (!item) continue;
            const data = this.config[i];
            if (!data) continue;

            // 图标
            const icon = find('bg/icon', item)?.getComponent(Sprite);
            icon && (icon.spriteFrame = this.commonAtlas?.getSpriteFrame(`icon_coin_${i + 1}`) || null);

            // 数量与价格
            const lblNum = find('bg/layout/lbl_num', item)?.getComponent(Label);
            lblNum && (lblNum.string = App.FormatUtils.FormatNumToComma?.(data.ocount) ?? String(data.ocount));

            const lblPrice = find('bg/btn_pay/layout/lbl_price', item)?.getComponent(Label);
            const showPrice = `${data.unit ?? ''}${App.FormatUtils.FormatNumToComma?.(data.amount) ?? String(data.amount)}`;
            lblPrice && (lblPrice.string = showPrice);

            const diaObj = find('bg/btn_pay/layout/icon_diamond', item);
            if (diaObj) diaObj.active = false;

            // 赠送信息
            const nSend = (data.count ?? 0) - (data.ocount ?? 0);
            const nPer = data.ocount ? Math.floor((nSend / data.ocount) * 100) : 0;
            const bShowSend = !!nPer;

            const pDisObj = find('bg/discount', item);
            if (pDisObj) pDisObj.active = bShowSend;

            const lblSendNode = find('bg/layout/lbl_extra_num', item);
            if (lblSendNode) {
                lblSendNode.active = bShowSend;
                const lbl = lblSendNode.getComponent(Label);
                if (lbl) lbl.string = App.FormatUtils.FormatNumToComma?.(nSend) ?? String(nSend);
            }
            const extraNode = find('bg/layout/extra', item);
            if (extraNode) extraNode.active = bShowSend;

            const disLabel = find('bg/discount/label', item)?.getComponent(Label);
            disLabel && (disLabel.string = `${data.discount ?? 0}%`);

            const tNode = find('bg/time', item);
            const timeCpt: any = tNode?.getComponent?.('TimeDownCpt');

            // 免费条目
            if (data.free && data.free == 1) {
                const btnPay = find('bg/btn_pay', item);
                if (btnPay) btnPay.active = false;
                if (tNode) tNode.active = true;

                const freeHint = find('bg/freeHint', item);
                if (freeHint) freeHint.active = data.timeout <= 0;

                const hot = find('bg/hot', item);
                if (hot) hot.active = false;

                timeCpt && (timeCpt.timelife = data.timeout ?? 0);
                if ((data.timeout ?? 0) <= 0) {
                    const lblTime = tNode?.getComponent(Label);
                    if (lblTime) lblTime.string = 'FREE';
                }
            } else {
                timeCpt && (timeCpt.timelife = 0);
                const freeHint = find('bg/freeHint', item);
                if (freeHint) freeHint.active = false;
                const hot = find('bg/hot', item);
                if (hot) hot.active = (data.hot ?? 0) > 0;
                const btnPay = find('bg/btn_pay', item);
                if (btnPay) btnPay.active = true;
                if (tNode) tNode.active = false;
            }
        }
    }

    onClickItem(index: number, timeCpt: any) {
        if (!this.config || !this.config[index]) return;
        if (timeCpt?.timelife > 0) {
            App.AlertManager.getCommonAlert().showWithoutCancel("还未到可领取时间");
            return;
        }
        const data = this.config[index];
        // 免费领取
        if (data.free && data.free == 1) {
            if ((data.timeout ?? 0) <= 0) {
                App.NetManager.send({ c: App.MessageID.REQ_SHOP_FREE_REWARD, id: data.id });
            }
            return;
        }

        App.AlertManager.getCommonAlert().showWithoutCancel("Please go to the lobby to recharge");
        return;

        // 如需打开充值弹窗，可改为：
        // App.PopUpManager?.addPopup(this.sendPrefab, null, { coin: data.count }, true);
    }

    onClickSend(index: number) {
        if (!this.config || !this.config[index]) return;
        // 通过项目内弹窗管理器弹出赠送界面（要求对方脚本实现 setParams 接口）
        App.PopUpManager.addPopup(this.sendPrefab, "hall", { data: this.config[index] }, true);
    }


    playSwingAnim() {
        if (!this.contentNode) return;
        for (let i = 0; i < 6; i++) {
            const obj = this.contentNode.children[i];
            if (!obj) continue;
            const card = find('bg', obj);
            if (!card) continue;

            tween(card).stop();
            card.angle = 2.5;

            const dt = 0.02;
            tween(card)
                .to(dt * 10, { angle: 5 }, { easing: 'sineInOut' })
                .to(dt * 10, { angle: -3 }, { easing: 'sineInOut' })
                .to(dt * 9, { angle: 2 }, { easing: 'sineInOut' })
                .to(dt * 8, { angle: -1 }, { easing: 'sineInOut' })
                .to(dt * 7, { angle: 0 }, { easing: 'sineIn' })
                .start();
        }
    }

    // 充值金币成功
    onPurchaseRechargeSuccess(msg: any) {
        if (msg?.code != 200) return;
        if (msg?.rewards && this.config && this.contentNode) {
            let tempNode: Node | null = null;
            for (let i = 0; i < this.config.length; i++) {
                if (this.config[i].id == msg.shopid) {
                    tempNode = this.contentNode.children[i] || null;
                    break;
                }
            }
            if (tempNode) {
                // 这里使用世界坐标，可按需替换为 3.x 的 UITransform/world space 方案
                const ui = tempNode.getComponent(UITransform);
                const worldPos = ui ? ui.convertToWorldSpaceAR(new Vec3(0, 0, 0)) : new Vec3(0, 0, 0);
                App.AnimationUtils.RewardFly(msg.rewards, worldPos);
            }
        }
    }
}