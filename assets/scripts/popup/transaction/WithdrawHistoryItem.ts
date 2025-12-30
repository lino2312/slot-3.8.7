import { _decorator, Component, Label } from 'cc';
import { App } from '../../App';
const { ccclass, property } = _decorator;

@ccclass('WithdrawHistoryItem')
export class WithdrawHistoryItem extends Component {
    @property(Label) stateLabel: Label = null!;
    @property(Label) balanceLabel: Label = null!;
    @property(Label) typeLabel: Label = null!;
    @property(Label) timeLabel: Label = null!;
    @property(Label) idLabel: Label = null!;

    public init(element: any) {
        // 0 待支付 1已充值 2支付失败
        let state = '';
        switch (element?.state) {
            case 0:
                state = 'Processing';
                break;
            case 1:
                state = 'Complete';
                break;
            case 2:
                state = 'Failed';
                break;
            default:
                state = '';
                break;
        }

        if (this.stateLabel) this.stateLabel.string = String(element?.withdrawName ?? '');
        if (this.balanceLabel) this.balanceLabel.string = String(element?.price ?? '');
        if (this.typeLabel) this.typeLabel.string = state;
        if (this.timeLabel) this.timeLabel.string = String(element?.addTime ?? '');
        if (this.idLabel) this.idLabel.string = String(element?.withdrawNumber ?? '');
    }

    onClickCopy() {
        const copiedText = this.idLabel?.string || '';
        if (!copiedText) return;
        App.AlertManager.showFloatTip("Copied");
        App.PlatformApiMgr.Copy(copiedText);
    }
}