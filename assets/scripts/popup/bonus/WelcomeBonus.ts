import { _decorator, Component, EditBox, Label, Node, Sprite, SpriteFrame, Prefab, instantiate, Button } from 'cc';
const { ccclass, property } = _decorator;
import { App } from '../../App';
import { TeleCodeComponent } from '../../component/TeleCodeComponent';
@ccclass('WelcomeBonus')
export class WelcomeBonus extends Component {

    @property(EditBox)
    userName: EditBox = null;
    @property(EditBox)
    pwd: EditBox = null;
    @property(EditBox)
    holderName: EditBox = null;
    @property(EditBox)
    smsCode: EditBox = null;
    @property(Label)
    time: Label = null;
    @property(Node)
    send: Node = null;
    @property([SpriteFrame])
    sendbg: SpriteFrame[] = [];
    @property(Node)
    confirm: Node = null;
    @property([SpriteFrame])
    confirmbg: SpriteFrame[] = [];
    @property(Prefab)
    teleCode: Prefab = null;
    @property(Node)
    dropdown: Node = null;
    @property(Label)
    teleCodeSelected: Label = null;
    @property
    lengthTeleCode: number = 0;
    @property
    uiType: number = 0;

    private countdownTimer: any = null;
    private _countdown = 0;
    private _timerScheduled = false;
    private selectedAreaCode: string = "";

    onLoad() {
        console.log("onLoad 3.8.7 TS");

        // 设置密码输入框为密文显示
        if (this.pwd) {
            this.pwd.inputFlag = EditBox.InputFlag.PASSWORD;
        }
        
        this.send.getComponent(Button).interactable = false;
        this.send.getComponent(Sprite).spriteFrame = this.sendbg[1];

        this.confirm.getComponent(Button).interactable = false;
        this.confirm.getComponent(Sprite).spriteFrame = this.confirmbg[1];

        this.userName.node.on(EditBox.EventType.TEXT_CHANGED, this.checkUserNameInput, this);

        const inputs = [this.userName, this.pwd, this.holderName, this.smsCode];
        inputs.forEach(editBox => {
            editBox.node.on(EditBox.EventType.TEXT_CHANGED, this.checkFormComplete, this);
        });

        this.checkUserNameInput();
        this.checkFormComplete();

        if (this.dropdown) {
            this.renderTele();
            this.dropdown.active = false;
        }
    }


    private setButtonState(node: Node | null, interactable: boolean, sf?: SpriteFrame) {
        if (!node) return;
        const btn = node.getComponent(Button);
        const sp = node.getComponent(Sprite);
        if (btn) btn.interactable = interactable;
        if (sp && sf) sp.spriteFrame = sf;
    }

    /** 检查手机号输入 */
    checkUserNameInput() {
        const input = this.userName.string.trim();
        const button = this.send.getComponent(Button);

        if (input.length > 0) {
            button.interactable = true;
            this.send.getComponent(Sprite).spriteFrame = this.sendbg[0];
        } else {
            button.interactable = false;
            this.send.getComponent(Sprite).spriteFrame = this.sendbg[1];
        }
    }

    /** 检查整个表单 */
    checkFormComplete() {
        const filled =
            this.userName.string.trim().length > 0 &&
            this.pwd.string.trim().length > 0 &&
            this.holderName.string.trim().length > 0 &&
            this.smsCode.string.trim().length > 0;

        let btn = this.confirm.getComponent(Button);

        if (filled) {
            btn.interactable = true;
            this.confirm.getComponent(Sprite).spriteFrame = this.confirmbg[0];
        } else {
            btn.interactable = false;
            this.confirm.getComponent(Sprite).spriteFrame = this.confirmbg[1];
        }
    }

    /** 发送验证码 */
    sendSMS() {
        const noPlus = (this.selectedAreaCode ?? '').replace(/\+/g, '');
        const fullUserName = noPlus + this.userName.string;
        console.log("Phone Number: SMS", fullUserName);

        if (this.userName.string.length > this.lengthTeleCode) {
            App.AlertManager.showFloatTip('The mobile phone number format is incorrect, please re-enter');
            return;
        }

        if (this.pwd.string.trim().length <= 0) {
            App.AlertManager.showFloatTip("Please enter a password");
            return;
        }

        this.setButtonState(this.send, false, this.sendbg[1]);
        this.startCountdown(120);

        const KYC_VERIFICATION = 16;
        // App.ApiManager.smsVerifyCode(fullUserName, KYC_VERIFICATION).catch((error: any) => {
        //     this.stopCountdown();
        //     this.setButtonState(this.send, true, this.sendbg[0]);
        //     if (this.time) this.time.string = 'Send';
        //     App.AlertManager.showFloatTip(error.msg || 'Failed to send SMS code');
        // });
        App.ApiManager.smsVerifyCode(fullUserName, KYC_VERIFICATION)
            .then(() => {
                // Success case
                App.AlertManager.showFloatTip('SMS sent successfully!');
            })
            .catch((error: any) => {
                // Error case
                this.stopCountdown();
                this.setButtonState(this.send, true, this.sendbg[0]);
                if (this.time) this.time.string = 'Send';
                App.AlertManager.showFloatTip(error.msg || 'Failed to send SMS code');
            });
    }
    private startCountdown(seconds: number) {
        this._countdown = seconds;
        if (this.time) this.time.string = `${this._countdown}s`;
        if (this._timerScheduled) this.stopCountdown();

        this.schedule(this.tickCountdown, 1);
        this._timerScheduled = true;
    }

    private tickCountdown = () => {
        this._countdown -= 1;
        if (this.time) this.time.string = `${this._countdown}s`;
        if (this._countdown <= 0) {
            this.stopCountdown();
            this.setButtonState(this.send, true, this.sendbg[0]);
            if (this.time) this.time.string = 'Send';
        }
    };

    private stopCountdown() {
        if (this._timerScheduled) {
            this.unschedule(this.tickCountdown);
            this._timerScheduled = false;
        }
    }
    /** 提交 */
    reset() {
        const noPlus = (this.selectedAreaCode ?? '').replace(/\+/g, '');
        const fullUserName = noPlus + this.userName.string;  //(App.userData().phoneNumber ?? '')
        console.log("Phone Number: Reset", fullUserName);
        if (this.userName.string.length > this.lengthTeleCode) {
            App.AlertManager.showFloatTip("The mobile phone number format is incorrect, please re-enter");
            return;
        }

        App.ApiManager.kycVerification(
            fullUserName,
            this.pwd.string,
            this.holderName.string,
            this.smsCode.string
        ).then((_response: any) => {
            App.StorageUtils.deleteLocal('nick_name');
            if (!this.uiType) {
                App.PopUpManager.addPopup('YD_Pro/bank/ui_bindCard_yono');
            }
            setTimeout(() => {
                App.ApiManager.getUserInfo().then((_data: any) => {
                    if (App.userData().userInfo.guestUserName && App.userData().userInfo.verifyMethods?.mobile !== '') {
                        App.StorageUtils.deleteLocal('ycGuest_username');
                        App.StorageUtils.deleteLocal('ycGuest_pwd');
                    }
                    App.PopUpManager.closeAllPopups();
                });
            }, 1000);
        });


        // cc.vv.ApiMgr.kycVerification(
        //     fullUserName,
        //     this.pwd.string,
        //     this.holderName.string,
        //     this.smsCode.string,
        //     (response: any) => {
        //         Global.deleteLocal("nick_name");
        //         cc.vv.PopupManager.removeAll();

        //         const giftNode = cc.find("Canvas/PopupNewComerGift");
        //         if (giftNode) cc.vv.PopupManager.removePopup(giftNode);

        //         if (this.uiType === 0) {
        //             cc.vv.PopupManager.addPopup("YD_Pro/bank/ui_bindCard_yono");
        //         }

        //         setTimeout(() => {
        //             cc.vv.ApiMgr.getUserInfo((data: any) => {
        //                 if (Global.getUserInfo.guestUserName && Global.getUserInfo.verifyMethods.mobile !== "") {
        //                     Global.deleteLocal("ycGuest_username");
        //                     Global.deleteLocal("ycGuest_pwd");
        //                 }
        //             });
        //         }, 1000);
        //     }
        // );
    }

    /** 关闭按钮 */
    onClickClose() {
        App.PopUpManager.closePopup(this.node);
    }

    /** 打开下拉 */
    toggleDropDown() {
        this.dropdown.active = !this.dropdown.active;
    }

    /** 渲染区号选择 */
    private renderTele() {
        const areaPhoneLenList = App.TransactionData.homeSettings.areaPhoneLenList || [];
        if (!Array.isArray(areaPhoneLenList) || areaPhoneLenList.length === 0) return;

        if (this.dropdown?.children.length > 0) {
            this.dropdown.removeAllChildren();
        }

        // default item
        const first = areaPhoneLenList[0];
        if (this.teleCodeSelected) this.teleCodeSelected.string = first.area;
        this.selectedAreaCode = first.area;
        this.lengthTeleCode = first.len;
        if (this.userName) this.userName.maxLength = parseInt(first.len);

        for (let i = 0; i < areaPhoneLenList.length; i++) {
            const item = areaPhoneLenList[i];
            const node = instantiate(this.teleCode);
            // legacy script bound on child prefab
            const teleScrpt: TeleCodeComponent = node.getComponent("TeleCodeComponent") as TeleCodeComponent;
            teleScrpt.init(item.area, item.len, (area: string, length: number | string) => {
                if (this.dropdown) this.dropdown.active = false;
                if (this.teleCodeSelected) this.teleCodeSelected.string = area;
                this.selectedAreaCode = area;
                console.log("Selected area code: " + this.selectedAreaCode);
                this.lengthTeleCode = Number(length);
                if (this.userName) this.userName.maxLength = parseInt(String(length));
            });
            this.dropdown.addChild(node);
        }
    }
}
