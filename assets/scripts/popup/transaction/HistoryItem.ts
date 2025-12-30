import { _decorator, Button, Component, Label, Node, Sprite, SpriteFrame, UITransform, Vec3 } from 'cc';
import { App } from '../../App';
const { ccclass, property } = _decorator;


@ccclass('HistoryItem')
export class HistoryItem extends Component {
    @property(Label) stateLabel: Label = null!;
    @property(Label) balanceLabel: Label = null!;
    @property(Label) typeLabel: Label = null!;
    @property(Label) timeLabel: Label = null!;
    @property(Label) idLabel: Label = null!;

    @property(Node) nisitem: Node = null!;   // Main container
    @property(Node) SorF: Node = null!;      // Status icon
    @property(Node) WLine: Node = null!;     // Line
    @property(Label) Remark: Label = null!;  // Remark
    @property(Label) StatusLabel: Label = null!;
    @property(Button) ContactButton: Button = null!;
    @property(Node) BankIcon: Node = null!;
    @property(Node) StateParent: Node = null!;
    @property(Node) TimeParent: Node = null!;
    @property(Node) CopyNode: Node = null!;
    @property(Node) ContactUs: Node = null!;
    @property(Node) Resolved: Node = null!;
    @property(Node) Proceed: Node = null!;
    @property(Node) Balance: Node = null!;
    @property(Node) OrderNo: Node = null!;

    private rechargeNumber: string = '';
    onLoad() {
        if (this.ContactButton) {
            this.ContactButton.node.on(Button.EventType.CLICK, this.contactUsButton, this);
        } else {
            console.warn('ContactButton is not assigned.');
        }
    }

    public init(element: any, payNameMap?: Record<string, string>) {
        // States: 0=Pending, 1=Complete, 2=Failed
        console.log('element: ', element);
        console.log('payNameMap: ', payNameMap);

        this.rechargeNumber = element.rechargeNumber;
        let state = '';

        switch (element.state) {
            case 0: // Pending
                state = 'To be paid';
                this.loadAndApplySprite('base', this.nisitem);
                this.loadAndApplySprite('status', this.SorF);
                break;
            case 1: // Complete
                state = 'Complete';
                this.loadAndApplySprite('bsse02', this.nisitem);
                this.loadAndApplySprite('status02', this.SorF);

                if (this.WLine) this.WLine.active = false;
                if (this.StatusLabel) this.StatusLabel.string = 'Succeed';
                if (this.BankIcon) this.BankIcon.setPosition(new Vec3(-395.496, -26.763, 0));
                if (this.StateParent) this.StateParent.setPosition(new Vec3(-264.252, -8.381, 0));
                if (this.TimeParent) this.TimeParent.setPosition(new Vec3(-294.094, -35.339, 0));

                if (this.nisitem) {
                    const ui = this.nisitem.getComponent(UITransform);
                    if (ui) {
                        const size = ui.contentSize.clone();
                        size.height = 190;
                        ui.setContentSize(size);
                    }
                }

                if (this.SorF) this.SorF.setPosition(new Vec3(433.553, 50.193, 0));
                if (this.OrderNo) this.OrderNo.setPosition(new Vec3(-473, 49.757, 0));
                if (this.Balance) this.Balance.setPosition(new Vec3(364.812, -18.159, 0));
                break;
            case 2: // Failed
                state = 'Failed';
                this.loadAndApplySprite('base', this.nisitem);
                this.loadAndApplySprite('status', this.SorF);
                if (this.StatusLabel) this.StatusLabel.string = 'Failed';
                break;
            default:
                break;
        }

        // Feedback state
        const FBState = element.feedbackState;
        if (
            FBState === null ||
            FBState === undefined ||
            FBState === 'null' ||
            FBState === 'undefined' ||
            isNaN(Number(FBState))
        ) {
            if (this.ContactUs) this.ContactUs.active = true; // null => Contact us
        } else {
            switch (Number(FBState)) {
                case 0: // Pending
                    if (this.Proceed) this.Proceed.active = true;
                    break;
                case 1: // Success
                    break;
                case 2: // Reject
                    if (this.Resolved) this.Resolved.active = true;
                    break;
            }
        }

        // Bank logo
        if (payNameMap && element.payName && payNameMap[element.payName]) {
            const logoUrl = payNameMap[element.payName];
            console.log(`Using preloaded logo for: ${element.payName} -> ${logoUrl}`);

            const sprite = this.BankIcon?.getComponent(Sprite);
            if (sprite) sprite.spriteFrame = null;


            App.ResUtils.getRemoteSpriteFrame(logoUrl).then((sf: SpriteFrame | null) => {
                if (sf) {
                    const s = this.BankIcon.getComponent(Sprite);
                    if (s) {
                        s.spriteFrame = sf;
                    }
                    // return;
                }
            });


        }

        const truncateText = (text: string, maxLength: number) => {
            if (!text) return '';
            return text.length <= maxLength ? text : text.slice(0, maxLength) + '...';
        };

        if (this.stateLabel) this.stateLabel.string = element.payName ?? '';
        if (this.balanceLabel) this.balanceLabel.string = String(element.price ?? '');
        if (this.typeLabel) this.typeLabel.string = state;
        if (this.timeLabel) this.timeLabel.string = element.addTime ?? '';
        if (this.idLabel) this.idLabel.string = truncateText(String(element.rechargeNumber ?? ''), 20);
        if (this.Remark) {
            this.Remark.string =
                element.remark != null ? String(element.remark) : 'Need help with this order? tap to contact us.';
        }
    }

    private loadAndApplySprite(imageName: string, targetNode: Node | null) {
        if (!targetNode) {
            console.error('Target node is null for:', imageName);
            return;
        }
        const sprite = targetNode.getComponent(Sprite);
        if (!sprite) {
            console.error('No Sprite component on node:', targetNode.name);
            return;
        }
        const fullPath = `image/wallet/transaction/${imageName}/spriteFrame`;
        App.ResUtils.getSpriteFrame(fullPath).then((spriteFrame) => {
            if (spriteFrame) {
                sprite.spriteFrame = spriteFrame;
            }
        });
    }

    contactUsButton() {
        App.PopUpManager.addPopup('prefabs/popup/popupRecordFeedback', "hall", this.rechargeNumber, false);
    }

    onClickCopy() {
        const text = this.idLabel?.string;
        if (!text) {
            console.warn('Nothing to copy');
            return;
        }
        App.PlatformApiMgr.Copy(text);
        App.AlertManager.showFloatTip('Copied to clipboard!');
    }
}