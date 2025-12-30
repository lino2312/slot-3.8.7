import { _decorator, Component, Node, Color, Label, find } from 'cc';
import { ComponentUtils } from '../../utils/ComponenUtils';
import { FormatUtils } from '../../utils/FormatUtils';
import { DateUtils } from '../../utils/DateUtils';
const { ccclass, property } = _decorator;

@ccclass('TableRecordItem')
export default class TableRecordItem extends Component {

    private _itemdata: any;

    start() {
        // start logic if needed
    }

    public init(data: any) {
        this._itemdata = data;

        // 时间
        ComponentUtils.setLabelString('lbl_time', this.node, DateUtils.getTimeStr(data.t));

        // 押注额
        ComponentUtils.setLabelString('lbl_amount', this.node, FormatUtils.FormatNumToComma(data.bet));

        // win
        const lbl_win = find('lbl_win', this.node);
        if (lbl_win) {
            let numPre = '';
            let color = new Color(0, 255, 0); // green

            if (data.win > 0) {
                numPre = '+';
                color = new Color(255, 165, 0); // orange
            }

            ComponentUtils.setLabelString('lbl_win', this.node, numPre + FormatUtils.FormatNumToComma(data.win));

            const lblComp = lbl_win.getComponent(Label);
            if (lblComp) {
                lblComp.color = color;
            }
        }

        // ID
        ComponentUtils.setLabelString('lbl_id', this.node, String(data.i));

        // game result
        // this.showGameResult(JSON.parse(data.result))
    }

    public showGameResult(result: any) {
        // implement game result logic
    }
}
