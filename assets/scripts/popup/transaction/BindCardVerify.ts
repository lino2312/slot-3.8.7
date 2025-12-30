import { _decorator, Component, Node, Button, Sprite, SpriteFrame } from 'cc';
import { App } from '../../App';
const { ccclass, property } = _decorator;

@ccclass('BindCardVerify')
export class BindCardVerify extends Component {
    @property(Node) btn1: Node = null!;
    @property(Node) btn12: Node = null!;
    @property(Node) btn2: Node = null!;
    @property([SpriteFrame]) btn2Sprite: SpriteFrame[] = [];

    onLoad() {

        if (!App.userData().isGuest) {
            if (this.btn1) this.btn1.active = false;
            if (this.btn12) this.btn12.active = true;

            // keep original logic order
            const btn2Btn = this.btn2?.getComponent(Button);
            const btn2Sp = this.btn2?.getComponent(Sprite);

            if (btn2Btn) btn2Btn.interactable = true;
            if (btn2Sp && this.btn2Sprite?.[0]) btn2Sp.spriteFrame = this.btn2Sprite[0];

            if (btn2Btn) btn2Btn.interactable = false;
            if (btn2Sp && this.btn2Sprite?.[1]) btn2Sp.spriteFrame = this.btn2Sprite[1];
        } else {
            if (this.btn1) this.btn1.active = true;
            if (this.btn12) this.btn12.active = false;

            const btn2Btn = this.btn2?.getComponent(Button);
            const btn2Sp = this.btn2?.getComponent(Sprite);
            if (btn2Btn) btn2Btn.interactable = false;
            if (btn2Sp && this.btn2Sprite?.[1]) btn2Sp.spriteFrame = this.btn2Sprite[1];

            const btn1Btn = this.btn1?.getComponent(Button);
            const btn1Sp = this.btn1?.getComponent(Sprite);
            if (btn1Btn) btn1Btn.interactable = true;
            if (btn1Sp && this.btn2Sprite?.[0]) btn1Sp.spriteFrame = this.btn2Sprite[0];
        }
    }

    onClickBack() {
        App.PopUpManager.closePopup(this.node);
    }

    onClickVerify() {
        App.PopUpManager.addPopup("prefabs/popup/popupBindBankAccount", "hall", null, false);
    }

    onClickBank() {
        if (App.userData().userInfo.kycVerificationStatus) {
            App.PopUpManager.addPopup("prefabs/popup/popupBindBankAccount", "hall", null, true);
        } else {
            App.PopUpManager.addPopup("prefabs/popup/popupNewComerGift", "hall", null, false);
        }
    }

    customer() {

        const openLivechat = (list: any[]) => {
            for (let i = 0; i < list.length; i++) {
                const element = list[i];
                if (element?.name === 'LIVECHAT') {
                    App.PlatformApiMgr.openURL(element.url);
                    break;
                }
            }
        };

        App.ApiManager.getCustomerServiceList().then((ret: any) => {
            openLivechat(ret);
        });
    }
}