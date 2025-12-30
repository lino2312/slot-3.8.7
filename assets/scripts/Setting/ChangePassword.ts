import { _decorator, Component, EditBox } from 'cc';
import { App } from '../App';   
const { ccclass, property } = _decorator;

@ccclass('ChangePassword')
export class ChangePassword extends Component {

    @property(EditBox)
    currentPasswordEditBox: EditBox = null!;

    @property(EditBox)
    newPasswordEditBox: EditBox = null!;

    @property(EditBox)
    confirmPasswordEditBox: EditBox = null!;

    /** 点击确认按钮 */
    onClickConfirm() {
        App.AudioManager.playBtnClick2();
        const currentPwd = this.currentPasswordEditBox.string.trim();
        const newPwd = this.newPasswordEditBox.string.trim();
        const confirmPwd = this.confirmPasswordEditBox.string.trim();

        if (!currentPwd) {
            App.AlertManager.showFloatTip("Please enter Current Password");
            return;
        }
        if (!newPwd) {
            App.AlertManager.showFloatTip("Please enter New Password");
            return;
        }
        if (!confirmPwd) {
            App.AlertManager.showFloatTip("Please enter Confirm Password");
            return;
        }
        if (newPwd.length < 8 || newPwd.length > 30) {
            App.AlertManager.showFloatTip("New password length between 8 and 30 characters");
            return;
        }
        if (confirmPwd !== newPwd) {
            App.AlertManager.showFloatTip("The new password is different when entered twice");
            return;
        }

        const params = {
            confirmNewPwd: confirmPwd,
            newPwd: newPwd,
            oldPwd: currentPwd,
        };

        console.log("🔹 提交参数:", params);

        App.HttpUtils.sendPostRequest("ResetPassword", params, (error: any, response: any) => {
            if (error) {
                console.error(error);
                App.AlertManager.showFloatTip("Network error, please try again");
                return;
            }

            console.log("响应结果:", response);

            if (response.code === 0 && response.msg === "Succeed") {
                App.AlertManager.showFloatTip("Password reset successful!");
                App.StorageUtils.saveLocal("yc_pwd", newPwd);
                App.PopUpManager.closePopup(this.node);
            } else {
                App.AlertManager.showFloatTip(response.msg);
            }
        });
    }
}
