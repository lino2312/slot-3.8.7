import { _decorator, Component, EditBox, Label, Button } from 'cc';
import { App } from '../App';   // 
const { ccclass, property } = _decorator;

@ccclass('BindEmail')
export class BindEmail extends Component {
    @property(EditBox)
    emailEditBox: EditBox = null!;

    @property(EditBox)
    codeEditBox: EditBox = null!;

    @property(Label)
    sendLab: Label = null!;

    @property(Button)
    btn: Button = null!;

    private countDown: number = 0;
    private intervalId: any = null;

    onLoad() {
        this.countDown = 0;
    }

    /** 点击发送验证码 */
    onClickSendCode() {
        App.AudioManager.playBtnClick2();
        if (!this.emailEditBox.string.trim()) {
            App.AlertManager.showFloatTip("Please enter email");
            return;
        }

        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (!emailRegex.test(this.emailEditBox.string)) {
            App.AlertManager.showFloatTip("Please enter the correct email address");
            return;
        }

        if (this.countDown > 0) {
            App.AlertManager.showFloatTip(`Please try again in ${this.countDown} seconds`);
            return;
        }

        const params = {
            email: this.emailEditBox.string.trim(),
            emailType: 3,
        };

        App.HttpUtils.sendPostRequest("EmailVerifyCode", params, (error: any, response: any) => {
            if (error) {
                console.error(error);
                App.AlertManager.showFloatTip("Network error, please try again");
                return;
            }

            console.log("响应结果:", response);
            if (response.code === 0) {
                App.AlertManager.showFloatTip(response.msg);
                this.startCountDown(60);
            } else {
                App.AlertManager.showFloatTip(response.msg);
            }
        });
    }

    /** 启动倒计时 */
    private startCountDown(duration: number) {
        this.countDown = duration;

        if (this.intervalId) clearInterval(this.intervalId);

        this.intervalId = setInterval(() => {
            const minutes = Math.floor(this.countDown / 60);
            const seconds = this.countDown % 60;
            this.sendLab.string = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;

            if (this.countDown <= 0) {
                clearInterval(this.intervalId);
                this.intervalId = null;
                this.sendLab.string = "Send";
            } else {
                this.countDown--;
            }
        }, 1000);
    }

    /** 点击绑定邮箱 */
    onClickBindEmail() {
        if (!this.codeEditBox.string.trim()) {
            App.AlertManager.showFloatTip("Please enter code");
            return;
        }
        if (!this.emailEditBox.string.trim()) {
            App.AlertManager.showFloatTip("Please enter email");
            return;
        }

        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (!emailRegex.test(this.emailEditBox.string)) {
            App.AlertManager.showFloatTip("Please enter the correct email address");
            return;
        }

        const params = {
            email: this.emailEditBox.string.trim(),
            emailvCode: this.codeEditBox.string.trim(),
        };

        App.HttpUtils.sendPostRequest("BindEmail", params, (error: any, response: any) => {
            if (error) {
                console.error(error);
                App.AlertManager.showFloatTip("Network error");
                return;
            }

            console.log("响应结果:", response);
            if (response.code === 0 && response.msg === "Succeed") {
                App.AlertManager.showFloatTip("Email bound successfully!");
            } else {
                App.AlertManager.showFloatTip(response.msg);
            }
        });
    }

    onDestroy() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
    }
}
