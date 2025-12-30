import { _decorator, BlockInputEvents, Button, Color, Component, EditBox, Graphics, Label, Layout, Node, UITransform, Vec2 } from 'cc';
import { App } from 'db://assets/scripts/App';
const { ccclass, property } = _decorator;

@ccclass('PhoneForget')
export class PhoneForget extends Component {
    @property(EditBox)
    phoneNumber: EditBox = null;
    @property(EditBox)
    pwd: EditBox = null;
    @property(EditBox)
    confirmPwd: EditBox = null;
    @property(EditBox)
    smsCode: EditBox = null;
    @property(Label)
    time: Label = null;
    @property(Node)
    send: Node = null;
    @property(EditBox)
    countryEditBox: EditBox = null;

    private timer: any = null;
    private countdown: number = 0;

    onLoad() {
        this.countryEditBox.node.on('editing-did-began', this.showCountryPicker, this);
    }

    async sendSMS() {
        let phoneNumber = this.countryEditBox.string + this.phoneNumber.string;
        if (phoneNumber === "") {
            App.AlertManager.showFloatTip("Please enter phone number");
            return;
        }
        if (this.pwd.string == "" || this.confirmPwd.string == "") {
            App.AlertManager.showFloatTip("Please enter password");
            return;
        }
        if (this.pwd.string !== this.confirmPwd.string) {
            App.AlertManager.showFloatTip("Passwords are inconsistent");
            return;
        }
        this.send.getComponent(Button).interactable = false;
        this.countdown = 120;
        this.time.string = this.countdown + "s";
        this.timer && clearInterval(this.timer);
        this.timer = setInterval(() => {
            this.countdown--;
            this.time.string = this.countdown + "s";
            if (this.countdown <= 0) {
                clearInterval(this.timer);
                this.send.getComponent(Button).interactable = true;
                this.time.string = "Send";
            }
        }, 1000);
        const FORGOT_PASSWORD = 2;
        const pSendSMS = await App.ApiManager.smsVerifyCode(phoneNumber, FORGOT_PASSWORD);
        if (pSendSMS.code != 0 || pSendSMS.msg != "Succeed") {
            this.send.getComponent(Button).interactable = true;
            clearInterval(this.timer);
            this.time.string = "Send";
            App.AlertManager.showFloatTip(pSendSMS.msg);
            return;
        }
    }

    async onClickConfirm() {
        let phoneNumber = this.countryEditBox.string + this.phoneNumber.string;
        if (phoneNumber === "") {
            App.AlertManager.showFloatTip("Please enter phone number");
            return;
        }
        if (this.pwd.string == "" || this.confirmPwd.string == "") {
            App.AlertManager.showFloatTip("Please enter password");
            return;
        }
        if (this.pwd.string !== this.confirmPwd.string) {
            App.AlertManager.showFloatTip("Passwords are inconsistent");
            return;
        }
        try {
            await App.ApiManager.forgetPassword(phoneNumber, this.pwd.string, this.smsCode.string, "mobile");
            App.AlertManager.showFloatTip("Succeed");
            App.PopUpManager.closeTopPopup();
        } catch (error) {
            App.AlertManager.showFloatTip("Failed to reset password");
            return;
        }
    }

    onClickClose() {
        App.PopUpManager.closeTopPopup();
    }

    showCountryPicker() {
        const old = this.node.getChildByName("country_overlay");
        if (old) old.destroy();
        this.countryEditBox.blur();
        //const list = App.userData().homeSettings.areaPhoneLenList;
        const list = App.TransactionData.homeSettings.areaPhoneLenList || [];
        if (!list || list.length === 0) {
            App.AlertManager.showFloatTip("No country list");
            return;
        }
        const overlay = new Node();
        overlay.name = "country_overlay";
        overlay.addComponent(BlockInputEvents);
        // 设置遮罩尺寸
        const overlayTransform = overlay.addComponent(UITransform);
        overlayTransform.setContentSize(this.node.getComponent(UITransform).contentSize);
        overlay.layer = this.node.layer;
        overlay.setSiblingIndex(this.node.children.length);
        this.node.addChild(overlay);
        const panel = new Node();
        overlay.addChild(panel);
        // 设置锚点
        panel.addComponent(UITransform).anchorPoint = new Vec2(0.5, 1);
        const bg = new Node();
        const g = bg.addComponent(Graphics);
        panel.addChild(bg);
        const drawBg = (w: number, h: number, r = 12) => {
            g.clear();
            g.fillColor = new Color(20, 28, 36, 230);
            g.roundRect(-w / 2, -h, w, h, r);
            g.fill();
        };
        const content = new Node();
        panel.addChild(content);
        const layout = content.addComponent(Layout);
        layout.type = Layout.Type.VERTICAL;
        layout.resizeMode = Layout.ResizeMode.CONTAINER;
        layout.spacingY = 8;
        const fieldW = this.countryEditBox.node.getComponent(UITransform).width;
        const width = fieldW + 20;
        const padX = 12;
        const padTop = 10, padBottom = 10;
        const itemH = 56;
        const fontSize = 30;
        list.forEach((item: any) => {
            const row = new Node();
            row.addComponent(UITransform).setContentSize(width - padX * 2, itemH);
            const btn = row.addComponent(Button);
            const label = row.addComponent(Label);
            label.string = `${item.area} (${item.len})`;
            label.fontSize = fontSize;
            label.horizontalAlign = Label.HorizontalAlign.LEFT;
            row.on(Button.EventType.CLICK, () => { this.applyAreaSelection(item); overlay.destroy(); }, this);
            content.addChild(row);
        });
        this.scheduleOnce(() => {
            layout.updateLayout();
            const bgW = width;
            const rows = content.children.length;
            const extraH = 30;
            const bgH = rows * itemH + padTop + padBottom + extraH;
            content.setPosition(0, -this.countryEditBox.node.getComponent(UITransform).height - padTop);
            drawBg(bgW, bgH);
        }, 0);
        // 定位panel
        const worldBottom = this.countryEditBox.node.getWorldPosition();
        const local = this.node.getComponent(UITransform).convertToNodeSpaceAR(worldBottom);
        panel.setPosition(local.x, local.y);
        overlay.on(Node.EventType.TOUCH_END, (e) => { if (e.target === overlay) overlay.destroy(); });
    }

    applyAreaSelection(item: any) {
        const code = item.area.replace(/\+/g, "");
        this.countryEditBox.string = code;
        if (this.countryEditBox.textLabel) this.countryEditBox.textLabel.string = code;
        const max = parseInt(item.len) || 0;
        if (max > 0 && this.phoneNumber) this.phoneNumber.maxLength = max;
        App.userData().phoneNumber = code;
    }
}


