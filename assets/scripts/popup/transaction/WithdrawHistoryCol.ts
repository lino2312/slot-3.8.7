import { _decorator, Component, Label } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('WithdrawHistoryCol')
export class WithdrawHistoryCol extends Component {
    @property(Label) typeLabel: Label = null!;
    @property(Label) amountLabel: Label = null!;
    @property(Label) timeLabel: Label = null!;
    @property(Label) statusLabel: Label = null!;
    @property(Label) orderLabel: Label = null!;

    start() {
        // init if needed
    }

    public init(data: any) {
        // 0: Processing, 1: Complete, 2: Failed
        let stateText = '';
        switch (data?.state) {
            case 0:
                stateText = 'Processing';
                break;
            case 1:
                stateText = 'Complete';
                break;
            case 2:
                stateText = 'Failed';
                break;
            default:
                stateText = '';
                break;
        }

        if (this.typeLabel) this.typeLabel.string = String(data?.withdrawName ?? '');
        if (this.amountLabel) this.amountLabel.string = String(data?.price ?? '');
        if (this.timeLabel) this.timeLabel.string = String(data?.addTime ?? '');
        if (this.statusLabel) this.statusLabel.string = stateText;
        if (this.orderLabel) this.orderLabel.string = String(data?.withdrawNumber ?? '');
    }
}