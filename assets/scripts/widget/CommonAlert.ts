import { _decorator, Component, Button, Label, Vec3, Widget } from 'cc';
import { App } from '../App';
const { ccclass, property } = _decorator;

@ccclass('CommonAlert')
export class CommonAlert extends Component {
    @property(Button)
    public closeButton: Button | null = null;
    @property(Button)
    public confirmButton: Button | null = null;
    @property(Button)
    public cancelButton: Button | null = null;
    @property(Label)
    public contentLabel: Label | null = null;
    @property(Label)
    public titleLabel: Label | null = null;
    @property(Label)
    public confirmButtonLabel: Label | null = null
    @property(Label)
    public cancelButtonLabel: Label | null = null
    @property(Widget)
    public midNode: Widget = null;

    private confirmCallback: Function | null = null;
    private cancelCallback: Function | null = null;
    private confirmButtmPos: Vec3 = Vec3.ZERO;

    onLoad() {
        // Set as last sibling to bring to front (simulate high z-order)
        // App.ScreenUtils.FixDesignScale_V(this.node);
    }

    start() {
        this.confirmButtmPos = this.confirmButton.node.position.clone();
    }

    onEnable() {
        // this.node.x = App.ScreenUtils.getScreenWidth() / 2;
        // this.node.y = App.ScreenUtils.getScreenHeight() / 2;
        App.ComponentUtils.showAlertAction(this.node, true, null);
    }

    show(tips: string, confirmCallback?: Function, cancelCallback?: Function, showCancel = true) {
        this.node.active = true;
        this.node.setSiblingIndex(this.node.parent ? this.node.parent.children.length - 1 : 0);
        this.contentLabel.string = (tips && tips.length > 0) ? tips : '';
        this.confirmCallback = confirmCallback;
        this.cancelCallback = cancelCallback;
        if (showCancel) {
            this.cancelButton.node.active = true;
            this.scheduleOnce(() => {
                this.confirmButton.node.setPosition(this.confirmButtmPos);
            }, 0.01);
        } else {
            this.cancelButton.node.active = false;
            this.scheduleOnce(() => {
                this.confirmButton.node.setPosition(0, this.confirmButtmPos.y, this.confirmButtmPos.z);
            }, 0.01);
        }
    }

    showWithoutCancel(tips: string, confirmCallback?: Function) {
        this.show(tips, confirmCallback, null, false);
    }

    onDisable() {
        this.clearCallbacks();
    }

    showCloseIcon() {
        this.closeButton.node.active = true;
    }

    hide() {
        this.clearCallbacks();
        this.node.active = false;
    }

    clearCallbacks() {
        this.confirmCallback = null;
        this.cancelCallback = null;
    }

    onConfirmBtnClicked() {
        App.AudioManager.playBtnClick();
        this.confirmCallback && this.confirmCallback();
        this.hide();
    }

    onCancelBtnClicked() {
        App.AudioManager.playBtnClick();
        this.cancelCallback && this.cancelCallback();
        this.hide();
    }

    setTitle(strTitle: string): this {
        let title = App.i18n.t('label_text.' + strTitle.toLowerCase());
        this.titleLabel.string = (title && title.length > 0) ? title : '';
        this.titleLabel.string = strTitle;
        return this;
    }

    setCancelLabel(strCancel: string): this {
        let cancel = App.i18n.t('label_text.' + strCancel.toLowerCase());
        this.cancelButtonLabel.string = (cancel && cancel.length > 0) ? cancel : '';
        this.cancelButtonLabel.string = strCancel;
        return this;
    }

    setConfirmLabel(strConfirm: string): this {
        let confirm = App.i18n.t('label_text.' + strConfirm.toLowerCase());
        this.confirmButtonLabel.string = (confirm && confirm.length > 0) ? confirm : '';
        return this;
    }
}