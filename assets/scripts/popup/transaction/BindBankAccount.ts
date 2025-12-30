import { _decorator, Button, Component, EditBox, find, instantiate, Label, Node, Prefab, Sprite, SpriteFrame } from 'cc';
import { App } from '../../App';
import { PopUpAnimType } from '../../component/PopupComponent';
import { TeleCodeComponent } from '../../component/TeleCodeComponent';
const { ccclass, property } = _decorator;

@ccclass('BindBankAccount')
export class BindBankAccount extends Component {
    @property(EditBox) userName: EditBox = null!;
    @property(EditBox) pwd: EditBox = null!;
    @property(EditBox) holderName: EditBox = null!;
    @property(EditBox) smsCode: EditBox = null!;

    @property(Label) time: Label = null!;

    @property(Node) send: Node = null!;
    @property([SpriteFrame]) sendBg: SpriteFrame[] = [];

    @property(Node) confirm: Node = null!;
    @property([SpriteFrame]) confirmBg: SpriteFrame[] = [];

    @property(Prefab) teleCode: Prefab = null!;
    @property(Node) dropdown: Node = null!;
    @property(Label) teleCodeSelected: Label = null!;

    @property({ tooltip: 'Max phone length for current area' }) lengthTeleCode = 0;
    @property({ tooltip: '0: page, 1: pop-up' }) uiType = 0;

    private _countdown = 0;
    private _timerScheduled = false;
    private selectedAreaCode: string = "";

    onLoad() {
        // init buttons
        this.setButtonState(this.send, false, this.sendBg[1]);
        this.setButtonState(this.confirm, false, this.confirmBg[1]);

        // input events
        this.userName.node.on(EditBox.EventType.TEXT_CHANGED, this.checkUserNameInput, this);
        this.checkUserNameInput();

        const inputs = [this.userName, this.pwd, this.holderName, this.smsCode];
        inputs.forEach(edit => edit.node.on(EditBox.EventType.TEXT_CHANGED, this.checkFormComplete, this));
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

    private checkUserNameInput() {
        const input = this.userName.string.trim();
        const enabled = input.length > 0;
        this.setButtonState(this.send, enabled, enabled ? this.sendBg[0] : this.sendBg[1]);
    }

    private checkFormComplete() {
        const filled =
            this.userName.string.trim().length > 0 &&
            this.pwd.string.trim().length > 0 &&
            this.holderName.string.trim().length > 0 &&
            this.smsCode.string.trim().length > 0;

        this.setButtonState(this.confirm, filled, filled ? this.confirmBg[0] : this.confirmBg[1]);
    }

    start() {
        // noop
        this.scheduleOnce(() => {
            if (this.pwd) {
                this.pwd.inputFlag = EditBox.InputFlag.PASSWORD;
                this.pwd.inputMode = EditBox.InputMode.SINGLE_LINE;
            }
        }, 0);
    }

    public sendSMS() {
        const noPlus = (this.selectedAreaCode ?? '').replace(/\+/g, '');
        const fullUserName = noPlus + this.userName.string;
        console.log("Phone Number: ", fullUserName);

        if (this.userName.string.length > this.lengthTeleCode) {
            App.AlertManager.showFloatTip('The mobile phone number format is incorrect, please re-enter');
            return;
        }
        if (this.pwd.string.trim().length <= 0) {
            App.AlertManager.showFloatTip('Please enter a password');
            return;
        }

        this.setButtonState(this.send, false, this.sendBg[1]);
        this.startCountdown(120);

        const KYC_VERIFICATION = 16;
        // App.ApiManager.smsVerifyCode(fullUserName, KYC_VERIFICATION).catch((error: any) => {
        //     this.stopCountdown();
        //     this.setButtonState(this.send, true, this.sendBg[0]);
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
                this.setButtonState(this.send, true, this.sendBg[0]);
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
            this.setButtonState(this.send, true, this.sendBg[0]);
            if (this.time) this.time.string = 'Send';
        }
    };

    private stopCountdown() {
        if (this._timerScheduled) {
            this.unschedule(this.tickCountdown);
            this._timerScheduled = false;
        }
    }

    public reset() {
        const noPlus = (this.selectedAreaCode ?? '').replace(/\+/g, '');
        const fullUserName = noPlus + this.userName.string;

        if (this.userName.string.length > this.lengthTeleCode) {
            App.AlertManager.showFloatTip('The mobile phone number format is incorrect, please re-enter');
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
                // App.PopUpManager.addPopup('YD_Pro/bank/ui_bindCard_yono');
                App.PopUpManager?.addPopup('prefabs/popup/popupBindCardYono', "hall", null, false, null, PopUpAnimType.normal);
            }
            setTimeout(() => {
                App.ApiManager.getUserInfo().then((_data: any) => {
                    if (App.userData().userInfo.guestUserName && App.userData().userInfo.verifyMethods?.mobile !== '') {
                        App.StorageUtils.deleteLocal('ycGuest_username');
                        App.StorageUtils.deleteLocal('ycGuest_pwd');
                    }
                    App.PopUpManager.closeAllPopups();
                });
            }, 300);
        });
    }

    public onclickService() {
        App.ComponentUtils.openCustomerService();
    }

    public onClickClose() {
        App.PopUpManager.closePopup(this.node);
        if (!App.userData().isGuest) {
            const verify = find('Canvas/popupBindCardVerify');
            if (verify) App.PopUpManager.closePopup(verify);
        }
    }

    public toggleDropDown() {
        if (this.dropdown) this.dropdown.active = !this.dropdown.active;
    }

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
            const teleScrpt: TeleCodeComponent = node.getComponent(TeleCodeComponent);
            teleScrpt.init(item.area, item.len, (area: string, length: number | string) => {
                if (this.dropdown) this.dropdown.active = false;
                if (this.teleCodeSelected) this.teleCodeSelected.string = area;
                this.selectedAreaCode = area;
                this.lengthTeleCode = Number(length);
                if (this.userName) this.userName.maxLength = parseInt(String(length));
            });
            this.dropdown.addChild(node);
        }
    }
}