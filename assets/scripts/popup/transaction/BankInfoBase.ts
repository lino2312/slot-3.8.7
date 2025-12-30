import { _decorator, Component, Label, Node } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('BankInfoBase')
export class BankInfoBase extends Component {
    @property(Label) bankName: Label = null!;
    @property(Label) accountNo: Label = null!;
    @property(Label) phone: Label = null!;

    private data: any = null;
    private callback: (() => void) | null = null;

    onLoad() {
        // this.applyData();
    }

    start() {}

    public init(data: any, callback?: () => void) {
        this.data = data;
        this.callback = callback || null;
        this.applyData();
    }

    public onSelect() {
        if (this.callback) this.callback();
    }

    private applyData() {
        if (!this.data) return;
        if (this.bankName) this.bankName.string = this.data.bankName || '';
        if (this.accountNo) this.accountNo.string = this.data.accountNo || '';
        if (this.phone) this.phone.string = this.data.mobileNo || this.data.mobileNO || '';
    }
}