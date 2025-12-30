import { _decorator, Component, Label } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('InvitationRecordItem')
export class InvitationRecordItem extends Component {

    private _data: any = null;

    @property(Label)
    uid: Label | null = null;

    @property(Label)
    time: Label | null = null;

    @property(Label)
    money: Label | null = null;

    get data() {
        return this._data;
    }

    set data(value: any) {
        this._data = value;
        this.initItem();
    }

    private initItem() {
        if (!this._data) return;

        if (this.uid) {
            this.uid.string = this._data.userID || "-";
        }

        if (this.time) {
            this.time.string = this._data.createTime || "-";
        }

        if (this.money) {
            this.money.string = "$" + (this._data.rechargeAmount_All || "0");
        }
    }
}
