import { _decorator, Component, EditBox, find, Label, Node } from 'cc';
import { App } from 'db://assets/scripts/App';
import { Config } from 'db://assets/scripts/config/Config';
import { t } from 'db://i18n/LanguageData';
const { ccclass, property } = _decorator;

@ccclass('PhoneLogin')
export class PhoneLogin extends Component {
    @property(EditBox)
    phoneNumberInput: EditBox = null;
    @property(EditBox)
    pwdInput: EditBox = null;
    @property(EditBox)
    optInput: EditBox = null;
    @property(Label)
    optLabel: Label = null;

    protected onLoad(): void {

    }

    start() {

    }

    update(deltaTime: number) {

    }

    onClickLogin() {
        this._onClickLoginAsync();
    }

    private async _onClickLoginAsync() {
        if (!this.checkInput()) {
            return;
        }
        console.log('onClickLogin');
        // 发送协议1 登录
        let optstr = "";
        if (this.optInput.node.getParent().active) {
            if (this.optInput.string == "") {
                App.AlertManager.showFloatTip("Please enter OTP");
                return;
            }
            optstr = this.optInput.string;
        }
        try{
            const pYcaiLogin = await App.ApiManager.yaCaiLogin('91'+ this.getPhoneNumber(), this.getPwd(), optstr);
            let account = pYcaiLogin.guestUserName || this.getPhoneNumber();
            console.log('account',account)
            App.GameManager.login(account,"5LYW2waQytc3mW5",Config.LoginType.PHONE,"","","",true,() => {
                App.PopUpManager.closeAllPopups();
            });
        }catch (e){
            console.warn(e);
        }
    }

    showOTP(show: boolean) {
        let obj = find("content/otp", this.node)
        obj.active = show
    }

    onClickClose() {
        App.PopUpManager.closeTopPopup();
    }

    onLoginFail(data) {
        let val = data.detail
        if (val == 335) {
            //need otp
            this.showOTP(true)
        }
    }

    async onClickOpt() {
        if (!this.checkInput()) {
            return;
        }
        const LOGIN_VERIFICATION = 17;
        const pSmsVerifyCode = await App.ApiManager.SmsVerifyCode(this.getPhoneNumber(), LOGIN_VERIFICATION);
        if (pSmsVerifyCode == 0) {
            let data = pSmsVerifyCode.data;
            let tipsstr = "We have send the OTP to your registered mobile number"
            if (data.voice) {
                tipsstr = "We will call your registered mobile number to tell the OTP"
            }
            App.AlertManager.showFloatTip(tipsstr);
        } else {
            App.AlertManager.showFloatTip(pSmsVerifyCode.msg);
            return;
        }

        // @ts-ignore
        this.optLabel.node.getComponent("LabelReTimer").setReTimer(120, 1, () => {
            this.optLabel.string = "OTP";
        }, "OTP(%ss)");
    }

    onclickForgetPwd(){
        App.PopUpManager.addPopup("login/prefabs/phoneForget");
    }


    checkInput() {
        if (this.getPhoneNumber() == "") {
            App.AlertManager.showFloatTip("Please enter phone number");
            return false;
        }

        if (this.getPwd() == "") {
            App.AlertManager.showFloatTip("Please enter password");
            return false;
        }
        return true;
    }

    getPhoneNumber() {
        return this.phoneNumberInput.string.trim();
    }

    getPwd() {
        return this.pwdInput.string.trim();
    }

    protected onDestroy(): void {

    }
}


