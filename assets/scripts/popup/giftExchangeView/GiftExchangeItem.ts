import { _decorator, Component, Label } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('GiftExchangeItem')
export class GiftExchangeItem extends Component {
    @property(Label)
    public date = null;
    @property(Label)
    public coin = null;
    @property
    public data;

    onLoad() {
        this.date.string = this.data.date;
        this.coin.string = this.data.coin;
    }

    start() {
    }

}

