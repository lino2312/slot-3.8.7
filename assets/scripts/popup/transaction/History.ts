import { _decorator, Component, Label } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('History')
export class History extends Component {
    @property(Label) Type: Label = null!;
    @property(Label) Amount: Label = null!;
    @property(Label) Time: Label = null!;
    @property(Label) Status: Label = null!;
    @property(Label) Order: Label = null!;

    public init(data: {
        state: number;
        payName?: string;
        price?: string | number;
        addTime?: string;
        rechargeNumber?: string | number;
    }) {
        let stateText = '';
        switch (data?.state) {
            case 0: stateText = 'To be paid'; break;
            case 1: stateText = 'Complete'; break;
            case 2: stateText = 'Failed'; break;
            default: stateText = ''; break;
        }

        if (this.Type) this.Type.string = String(data?.payName ?? '');
        if (this.Amount) this.Amount.string = String(data?.price ?? '');
        if (this.Time) this.Time.string = String(data?.addTime ?? '');
        if (this.Status) this.Status.string = stateText;
        if (this.Order) this.Order.string = String(data?.rechargeNumber ?? '');
    }
}