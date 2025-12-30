import { _decorator, Color, Component, EventTouch, instantiate, Label, Node, Prefab } from 'cc';
import { App } from '../../App';
import { PopUpAnimType } from '../../component/PopupComponent';
import { HistoryItem } from './HistoryItem';
import { WithdrawHistoryItem } from './WithdrawHistoryItem';
const { ccclass, property } = _decorator;

@ccclass('TransactionsRecord')
export class TransactionsRecord extends Component {
    @property(Prefab) itme: Prefab = null!;
    @property(Node) itmeNode: Node = null!;


    @property(Prefab) withdrawRecordItme: Prefab = null!;
    @property(Node) withdrawRecordItmeNode: Node = null!;

    @property([Node]) btn: Node[] = [];
    @property([Label]) btnLabel: Label[] = [];

    @property([Node]) btnShow: Node[] = [];
    @property([Node]) btnShowDay: Node[] = [];
    @property([Node]) nodeShow: Node[] = [];

    @property(Label) typeLbl: Label = null!;

    private dayIndex: string = '0';
    private curSelectBtnIndex: string = '0';

    public init() {

    }

    onLoad() {
        // 隐藏顶部筛选条
        // for (const n of this.btnShow || []) n.active = false;
        // for (const n of this.btnShowDay || []) n.active = false;

        // 默认选择第一个页签
        this.btnSelect(null, '0');

        // 拉取记录
        this.getRechargeRecord(null, "");

        this.dayIndex = '0';

        // 监听刷新事件
        App.EventUtils.on('RECHARGE_RECORD_REFRESH', this.refreshRechargeData, this);
    }

    onDestroy() {
        App.EventUtils.offTarget(this);
    }

    private refreshRechargeData = () => {
        console.log('REFRESH DATA from getRechargeRecord');
        this.getRechargeRecord(null, "");
    };

    // 0 待支付 1已充值 2支付失败  -1 所有
    // async getRechargeRecord(cus = -1) {
    async getRechargeRecord(event: EventTouch, customEventData: string) {
        if (event == null) customEventData = "-1";
        const numericNum = Number(customEventData);
        const stateValue = isNaN(numericNum) ? -1 : numericNum;
        this.itmeNode?.removeAllChildren();
        const [pPayTypeName, pRechargeRecord] = await Promise.all([
            App.ApiManager.getPayTypeName(),
            App.ApiManager.getRechargeRecord(stateValue, 1, 1000)
        ]);
        if (!pPayTypeName || !pPayTypeName.typelist) return;

        const payNameMap: Record<string, string> = {};
        pPayTypeName.typelist.forEach((type: any) => {
            if (type?.payName && type?.payNameUrl) {
                payNameMap[String(type.payName).trim()] = type.payNameUrl;
            }
        });
        App.TransactionData.payNameMap = payNameMap;
        App.TransactionData.recordType = 'recharge';
        App.TransactionData.rechargeRecord = pRechargeRecord?.list || [];
        for (let index = 0; index < App.TransactionData.rechargeRecord.length; index++) {
            const element = App.TransactionData.rechargeRecord[index];
            const opNode = instantiate(this.itme);
            const op: HistoryItem = opNode.getComponent(HistoryItem);
            op.init(element, App.TransactionData.payNameMap);
            this.itmeNode.addChild(opNode);
        }
        this.btnSelectDay(null, this.dayIndex);
        this.changed(numericNum);
    }

    changed(num) {
        let numericNum = Number(num) + 1;
        if (isNaN(numericNum)) numericNum = 0;
        for (let i = 0; i < this.btn.length; i++) {
            const node = this.btn[i];
            const label = this.btnLabel[i];
            if (node) node.active = false;
            if (label) label.color = new Color(255, 255, 255);
        }

        if (this.btn[numericNum]) this.btn[numericNum].active = true;
        if (this.btnLabel[numericNum]) this.btnLabel[numericNum].color = new Color(0, 255, 197);
    }

    onClickBack() {
        App.PopUpManager.closePopup(this.node, PopUpAnimType.normal);
    }

    btnSelect(event: any, index: string) {
        console.log("index:", index);
        this.curSelectBtnIndex = index;
        for (const n of this.btnShow || []) n.active = false;
        if (this.btnShow[index]) this.btnShow[index].active = true;
        console.log("this.btnShow[index]:", this.btnShow[index].name);
        for (const n of this.nodeShow || []) n.active = false;
        if (this.nodeShow[index]) this.nodeShow[index].active = true;

        if (this.typeLbl) {
            if (index === "0") {
                this.typeLbl.string = 'Deposit is usually credited in minutes';
                this.btnSelectDay(null, this.dayIndex);
            } else if (index === "1") {
                this.btnSelectDay(null, this.dayIndex);
                this.typeLbl.string = 'Withdraw is usually processed in minutes';
            } else if (index === "2") {
                this.typeLbl.string = 'All your balance records are displayed here';
            }
        }
    }

    btnSelectDay(event: any, index: string | number) {
        this.dayIndex = String(index);
        const idx = Number(index);

        // Show / Hide day buttons
        for (const n of this.btnShowDay || []) n.active = false;
        if (this.btnShowDay[idx]) this.btnShowDay[idx].active = true;

        // If withdrawal data exists, filter it
        if (this.curSelectBtnIndex == '0') {
            // Otherwise use recharge data
            if (App.TransactionData.rechargeRecord && App.TransactionData.rechargeRecord.length > 0) {
                this.renderByDay(App.TransactionData.rechargeRecord, idx);
            }
        }
        else if (this.curSelectBtnIndex == '1') {
            if (App.TransactionData.withdrawRecord && App.TransactionData.withdrawRecord.length > 0) {
                this.renderByWithdrawRecordDay(App.TransactionData.withdrawRecord, idx);
                return;
            }
        }

    }


    private renderByDay(data: any[], idx: number) {
        this.itmeNode.removeAllChildren();
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
                const op = opNode.getComponent(HistoryItem);
                op.init(element, App.TransactionData.payNameMap);
                this.itmeNode.addChild(opNode);
            }
        }
    }

    private renderByWithdrawRecordDay(data: any[], idx: number) {
        this.withdrawRecordItmeNode.removeAllChildren();
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
                const opNode = instantiate(this.withdrawRecordItme);
                const op = opNode.getComponent(WithdrawHistoryItem);
                op.init(element);
                this.withdrawRecordItmeNode.addChild(opNode);
            }
        }
    }

    // btnSelectDay(event: any, index: string | number) {
    //     this.dayIndex = String(index);
    //     const idx = Number(index);

    //     for (const n of this.btnShowDay || []) n.active = false;
    //     if (this.btnShowDay[idx]) this.btnShowDay[idx].active = true;

    //     if (App.TransactionData.withdrawRecord && App.TransactionData.withdrawRecord.length > 0) {
    //         const data = App.TransactionData.withdrawRecord;
    //         this.itmeNode.removeAllChildren();

    //         for (let i = 0; i < data.length; i++) {
    //             const element = data[i];

    //             const addTime = new Date(String(element.addTime || '').replace(/-/g, '/'));
    //             const currentTime = new Date();
    //             const timeDiff = Number(currentTime) - Number(addTime);
    //             const diffInDays = timeDiff / (1000 * 3600 * 24);

    //             const isWithin1Day = diffInDays <= 1;
    //             const isWithin7Days = diffInDays <= 7;
    //             const isWithin30Days = diffInDays <= 30;

    //             if ((idx === 0 && isWithin1Day) ||
    //                 (idx === 1 && isWithin7Days) ||
    //                 (idx === 2 && isWithin30Days)) {
    //                 const opNode = instantiate(this.itme);
    //                 const op =
    //                     opNode.getComponent(HistoryItem);
    //                 op.init(element, App.TransactionData.payNameMap);
    //                 this.itmeNode.addChild(opNode);
    //             }
    //         }
    //         return;
    //     }

    //     // 过滤充值记录
    //     if (App.TransactionData.rechargeRecord && App.TransactionData.rechargeRecord.length > 0) {
    //         const data = App.TransactionData.rechargeRecord;
    //         this.itmeNode.removeAllChildren();

    //         for (let i = 0; i < data.length; i++) {
    //             const element = data[i];

    //             const addTime = new Date(String(element.addTime || '').replace(/-/g, '/'));
    //             const currentTime = new Date();
    //             const timeDiff = Number(currentTime) - Number(addTime);
    //             const diffInDays = timeDiff / (1000 * 3600 * 24);

    //             const isWithin1Day = diffInDays <= 1;
    //             const isWithin7Days = diffInDays <= 7;
    //             const isWithin30Days = diffInDays <= 30;

    //             if ((idx === 0 && isWithin1Day) ||
    //                 (idx === 1 && isWithin7Days) ||
    //                 (idx === 2 && isWithin30Days)) {
    //                 const opNode = instantiate(this.itme);
    //                 const op: HistoryItem = opNode.getComponent(HistoryItem);
    //                 op.init(element, App.TransactionData.payNameMap);
    //                 this.itmeNode.addChild(opNode);
    //             }
    //         }
    //     }
    // }
}