import { _decorator, Component, Label } from 'cc';
import { App } from '../App';
const { ccclass, property } = _decorator;

@ccclass('ReferRecordItem')
export class ReferRecordItem extends Component {

    private _datasource: any = null;

    @property(Label)
    uid: Label = null!;

    @property(Label)
    lv: Label = null!;

    @property(Label)
    deposit_amount: Label = null!;

    @property(Label)
    commsssion: Label = null!;

    @property(Label)
    time: Label = null!;

    set datasource(value: any) {
        this._datasource = value;
        this.initItem();
    }

    get datasource() {
        return this._datasource;
    }

    private initItem() {
        const datasource = this._datasource;
        console.log("datasource InvitationLinkItem", datasource);
        if (datasource) {
            this.uid.string = datasource.userID || '';
            this.lv.string = datasource.lv || '';
            this.deposit_amount.string = datasource.rechargeAmount || '';
            this.commsssion.string = datasource.rebateAmount || '';
            this.time.string = datasource.searchTime || '';
        }
    }

    onClickCopy() {
        // @ts-ignore
        App.PlatformApiMgr.Copy(this._datasource.userID);
        // @ts-ignore
        App.AlertManager.showFloatTip(('Copy successfully! Share to your friends now!'));
    }
}
