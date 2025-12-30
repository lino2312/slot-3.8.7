import { _decorator, Component, Label } from 'cc';
import { App } from '../App';
const { ccclass, property } = _decorator;

@ccclass('cashBackItem')
export class cashBackItem extends Component {

    @property(Label)
    Play: Label = null!;

    @property(Label)
    Rebate: Label = null!;

    @property(Label)
    Reward: Label = null!;

    @property(Label)
    ButtonLabel: Label = null!;

    private _data: any = null;

    onLoad() { }

    init(data: any) {
        console.log("CashBackItem: init:", data);
        this._data = data;
        this.Play.string = data.validBet;
        this.Rebate.string = data.vipRate;
        this.Reward.string = data.prize;

        let state = data.state;
        switch (state) {
            case 0:
                this.ButtonLabel.string = "Claim";
                break;
            case 1:
            case 2:
                this.ButtonLabel.string = "Claimed";
                break;
        }
    }

    async  onClaim() {
        if (!this._data) return;

        if (this._data.state === 0) {
            // @ts-ignore
            const ret = await App.ApiManager.getBonus();
            console.log("getBonus:", ret);
            this.ButtonLabel.string = "Claimed";
            // @ts-ignore
            App.EventUtils.emit("UpdateReceived");

        }
    }

    onClickBack() {
        App.PopUpManager.closeTopPopup();
    }
}
