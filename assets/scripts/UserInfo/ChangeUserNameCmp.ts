import { _decorator, Component, EditBox, Button, Label, Node } from 'cc';
import { App } from '../App';
const { ccclass, property } = _decorator;

@ccclass('PopupChangeName')
export class PopupChangeName extends Component {

    @property(EditBox)
    inputEdit: EditBox = null!;

    @property(Button)
    button: Button = null!;

    onLoad() {
        this.button.interactable = false;
        const placeholderNode = this.inputEdit.node.getChildByName('PLACEHOLDER_LABEL');
        if (placeholderNode) {
            const placeholderLabel = placeholderNode.getComponent(Label);
            if (placeholderLabel) {
                // show user nickname in placeholder
                placeholderLabel.string = App.userData()?.userInfo?.nickName ?? '';
            }
        }
        this.inputEdit.node.on('text-changed', this.onEditChange, this);
    }

    private onEditChange(editBox: EditBox) {
        // editBox.string 才是真正的文本
        const text = editBox.string;

        // 设置回输入框
        this.inputEdit.string = text;

        // 控制按钮是否启用
        this.button.interactable = text.trim().length > 0;
    }

    /** 点击保存昵称 */
    private async onClickSave() {

        const newName = this.inputEdit.string.trim();
        if (!newName) return;

        try {
            const res = await App.ApiManager.editNickName(newName);

            if (!res || res.code !== 0) {
                App.AlertManager.showFloatTip(res ?.msg || "Failed");
                return;
            }

            // 更新本地信息
            App.userData().userInfo.nickName = newName;

            // 通知外部更新
            App.EventUtils.dispatchEvent("USER_INFO_CHANGE");

            App.AlertManager.showFloatTip("Updated Successfully");

            // 关闭弹窗
            App.PopUpManager.closePopup(this.node);

        } catch (e) {
            App.AlertManager.showFloatTip("Failed");
        }
    }
}
