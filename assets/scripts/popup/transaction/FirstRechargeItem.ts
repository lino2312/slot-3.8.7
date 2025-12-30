import { _decorator, Component, Node, Label, Prefab, find } from 'cc';
import { App } from '../../App';
const { ccclass, property } = _decorator;

type FirstRechargeData = {
    memberRewardAmount: number; // 百分比，如 20 表示 20%
    rechargeAmount: number;     // 金额
};

@ccclass('FirstRechargeItem')
export class FirstRechargeItem extends Component {
    @property(Label) coin1: Label = null!;
    @property(Label) coin2: Label = null!;
    @property(Label) coin3: Label = null!;
    @property(Label) coin4: Label = null!;
    @property(Label) coin5: Label = null!;
    @property(Label) money: Label = null!;

    @property(Prefab) firstPayItem: Prefab = null!;
    @property(Node) firstPayNode: Node = null!;

    private data: FirstRechargeData | null = null;
    private firstStr: string = '';

    onLoad() {
        // 若在实例化后才调用 init，则此时 data 可能为空
        if (this.data) this.applyData();
        // 默认隐藏选中态节点“02”
        const sel = find('02', this.node);
        if (sel) sel.active = false;
    }

    public init(data: FirstRechargeData) {
        this.data = data;
        console.log('FirstRechargeItem init data', data);
        this.applyData();
    }

    private applyData() {
        if (!this.data) return;
        const { memberRewardAmount, rechargeAmount } = this.data;

        // 百分比文本
        if (this.coin1) this.coin1.string = `${memberRewardAmount}%`;

        // 返利+本金
        const bonus = (rechargeAmount * memberRewardAmount) / 100;
        if (this.coin2) this.coin2.string = String(bonus + rechargeAmount);

        // 货币 + 充值金额
        if (this.coin3) this.coin3.string = `${App.TransactionData.currency ?? ''}${rechargeAmount}`;

        // 记录 firstStr（被其它逻辑读取）
        this.firstStr = String(rechargeAmount);

        // 纯充值金额
        if (this.coin4) this.coin4.string = String(rechargeAmount);

        // 纯返利金额
        if (this.coin5) this.coin5.string = String(bonus);
    }

    public onSelect() {
        const parent = this.node.parent;
        if (parent) {
            for (let i = 0; i < parent.children.length; i++) {
                const child = parent.children[i];
                const sel = find('02', child);
                if (sel) sel.active = false;
            }
        }
        // 写入全局所选金额
        App.TransactionData.firstStr = this.firstStr;

        // 显示本节点的选中态
        const selMe = find('02', this.node);
        if (selMe) selMe.active = true;
    }
}