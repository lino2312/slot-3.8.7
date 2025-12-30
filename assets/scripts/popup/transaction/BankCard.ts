import { _decorator, Component, Label } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('BankCard')
export class BankCard extends Component {
    @property(Label) bankName: Label = null!;
    @property(Label) accountNo: Label = null!;

    private data: any = null;
    private callback: (() => void) | null = null;

    onLoad() {
       
    }

    start() {}

    public init(data: any, callback?: () => void) {
        this.data = data;
        this.callback = callback || null;
        this.applyData();
    }

    public onSelect(_event?: any, _custom?: any) {
        if (this.callback) this.callback();
    }

    private applyData() {
        if (!this.data) return;
        if (this.bankName) this.bankName.string = this.data.bankName || '';
        if (this.accountNo) this.accountNo.string = this.data.accountNo || '';
    }
}