import { _decorator, Color, Component, EventTouch, instantiate, Label, Node, Prefab } from 'cc';
import { App } from '../../App';
import { WithdrawHistoryItem } from './WithdrawHistoryItem';
const { ccclass, property } = _decorator;

@ccclass('WithdrawRecord')
export class WithdrawRecord extends Component {
    @property(Prefab) itme: Prefab = null!;
    @property(Node) itmeNode: Node = null!;

    @property([Node]) btn: Node[] = [];
    @property([Label]) btnLabel: Label[] = [];

    public init() {
        // noop
    }

    onLoad() {
        console.log("WithdrawRecord onLoad");
        this.getWithdrawLog(null, "-1");
    }

    getWithdrawLog(event: EventTouch, customEventData: string) {
        let numericNum = Number(customEventData);
        if (isNaN(numericNum)) {
            // console.warn("[WithdrawRecord] cus produced NaN, forcing numericNum = -1");
            numericNum = -1;
        }
        this.itmeNode?.removeAllChildren();
        App.ApiManager.getWithdrawLog(numericNum, 1, 1000).then((res: any) => {
            console.log('WithdrawRecord.ts getWithdrawLog', res);
            const list = res?.list || [];
            App.TransactionData.withdrawRecord = list;
            this.renderByWithdrawRecordDay(list, 0);
            // for (let index = 0; index < list.length; index++) {
            //     const element = list[index];
            //     if (!this.itme) continue;
            //     const node = instantiate(this.itme);
            //     const comp: WithdrawHistoryItem = node.getComponent(WithdrawHistoryItem);
            //     comp.init(element);
            //     this.itmeNode.addChild(node);
            // }
        })
        this.changed(numericNum);
    }


    private renderByWithdrawRecordDay(data: any[], idx: number) {

        const now = Date.now();
        for (let i = 0; i < data.length; i++) {
            const element = data[i];
            const addTime = new Date(String(element.addTime || '').replace(/-/g, '/')).getTime();
            const diffInDays = (now - addTime) / (1000 * 3600 * 24);
            const isWithin1 = diffInDays <= 1;
            const isWithin7 = diffInDays <= 7;
            const isWithin30 = diffInDays <= 30;
            if ((idx === 0 && isWithin1) ||
                (idx === 1 && isWithin7) ||
                (idx === 2 && isWithin30)) {
                const opNode = instantiate(this.itme);
                const op = opNode.getComponent(WithdrawHistoryItem);
                op.init(element);
                this.itmeNode.addChild(opNode);
            }
        }
    }

    changed(num) {

        let numericNum = Number(num) + 1;
        console.log("Numeric num is", numericNum);
        // if (isNaN(numericNum)) numericNum = 0;
        for (let i = 0; i < this.btn.length; i++) {
            const b = this.btn[i];
            const lbl = this.btnLabel[i];
            if (b) b.active = false;
            if (lbl) lbl.color = Color.WHITE;
        }
        if (this.btn[numericNum]) this.btn[numericNum].active = true;
        if (this.btnLabel[numericNum]) this.btnLabel[numericNum].color = new Color(0, 255, 197);
    }

    onClickBack() {
        App.PopUpManager.closePopup(this.node);
    }
}