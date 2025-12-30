import { _decorator, Color, Component, instantiate, Label, Node } from 'cc';
import { App } from '../../App';
const { ccclass, property } = _decorator;

@ccclass('BoundWalletRecordAll')
export class BoundWalletRecordAll extends Component {
    @property(Node) classItem: Node = null!;
    @property(Node) classList: Node = null!;
    @property([Node]) btn: Node[] = [];
    @property([Label]) btnLabel: Label[] = [];

    @property(Node) allNode: Node = null!;
    @property(Node) addNode: Node = null!;
    @property(Node) reduceNode: Node = null!;
    @property(Node) classItem1: Node = null!;
    @property(Node) classList1: Node = null!;
    @property(Node) classItem2: Node = null!;
    @property(Node) classList2: Node = null!;

    private classData: any[] = [];
    private add: any[] = [];
    private reduce: any[] = [];
    private classData1: any[] = [];
    private classData2: any[] = [];

    private financial_log_map: Record<number, string> = {};

    onLoad() {
        this.financial_log_map = {
            0: 'Bet amount reduced',
            1: 'Agency commission',
            2: 'Jackpot increase',
            3: 'Red envelope',
            4: 'Recharge increase',
            5: 'Withdrawal reduction',
            6: 'Cash back',
            7: 'Daily check-in',
            8: 'Agent red envelope recharge',
            9: 'Withdrawal rejected',
            10: 'Recharge gift',
            11: 'Manual recharge',
            12: 'Sign up to send money',
            13: 'Bonus recharge',
            14: 'First full gift',
            15: 'First charge rebate',
            16: 'Investment and financial management',
            17: 'Financial income',
            18: 'Financial principal',
            19: 'Redemption principal',
            20: 'Invite bonus',
            21: 'Game transfer in',
            22: 'Game transfer out',
            24: 'Jackpot increase',
            25: 'Card binding gift',
            26: 'Game money refund',
            27: 'Usdt recharge',
            28: 'Betting rebate',
            29: 'Vip member upgrade package',
            30: 'Monthly rewards for VIP members',
            31: 'Recharge Rewards for VIP Members',
            32: 'LeaderBoard Bonus',
            100: 'Bonus deduction',
            101: 'Manual withdrawal',
            102: 'One key wash code reverse water',
            103: 'Electronic Awards',
            104: 'Bind Mobile Awards',
            105: 'XOSO Issue Canceled',
            106: 'Bind Email Awards',
            107: 'Weekly Awards',
            108: 'C2C Withdraw Awards',
            109: 'C2C Withdraw',
            110: 'C2C Withdraw Back',
            111: 'C2C Recharge',
            112: 'C2C Recharge Awards',
            113: 'Newbie gift pack',
            114: 'Tournament Rewards',
            116: 'New members first charge negative profit return bonus',
            117: 'New members get bonuses by playing games',
            118: 'Daily Awards',
            119: 'Turntable Awards',
            115: 'Return Awards',
            122: 'Partner Rewards',
            123: 'Buy Promotion Cards',
            124: 'Promotion Cards Bonus',
            125: 'Promotion Cards Day Bonus',
            126: 'Daily Ranksing Day Bonus',
            127: 'Weekly rewards for VIP members',
            128: 'Relief Fund',
            129: 'Lucky Wheel Reward',
            130: 'Recharge Coupon',
            131: 'Mail Reward',
            132: 'Welcome Bonus Referral Reward',
            133: 'Tax Bonus Reward',
        };

        this.getWithdrawLog(null, "-1");

        if (this.reduceNode) this.reduceNode.active = false;
        if (this.addNode) this.addNode.active = false;
    }

    getWithdrawLog(event: Event, customEventData: string) {
        var self = this;
        const numericNum = Number(customEventData);
        this.classList?.removeAllChildren();
        App.ApiManager.getFinancialLog().then((classData: any) => {
            console.log("Financial Log Data:", classData);
            this.classData = classData?.list || [];

            this.reduce = [];
            this.add = [];

            for (let i = 0; i < this.classData.length; i++) {
                const data = this.classData[i];

                const item = instantiate(this.classItem);
                item.name = String(data.type);

                // time
                const timeNode = item.getChildByName('time');
                timeNode?.getComponent(Label) && (timeNode.getComponent(Label)!.string = data.addTime);

                // amount sign
                let sign = '+';
                if ([0, 5, 16, 18, 21, 23, 109, 127].includes(data.type) || data.amount < 0) {//根据数据类型判断是否是正负。
                    sign = '-';
                    data.amount = Math.abs(data.amount);
                    this.reduce.push(data);
                }
                else {
                    this.add.push(data);
                }

                // prize
                const prizeNode = item.getChildByName('prize');
                const prizeLabel = prizeNode?.getComponent(Label);
                if (prizeLabel) {
                    prizeLabel.string = sign + data.amount;
                    if (prizeLabel.string.indexOf('-') > -1) {
                        prizeLabel.color = new Color(255, 0, 61);
                    }
                }

                // type label
                const reliefNode = item.getChildByName('ReliefFund');
                const reliefLabel = reliefNode?.getComponent(Label);
                if (reliefLabel) {
                    reliefLabel.string = 'Type:' + (this.financial_log_map[data.type] ?? String(data.type));
                }

                // order number
                const orderNode = item.getChildByName('orderNum');
                const orderLabel = orderNode?.getComponent(Label);
                if (orderLabel) {
                    orderLabel.string = data.orderNum ?? '';
                }

                item.parent = this.classList;
                item.active = true;
            }
            self.changed(numericNum);
        });

    }

    changed(num) {
        let numericNum = Number(num);
        if (isNaN(numericNum)) {
            // return; // stop here to avoid backend error
            numericNum = 0;
        }

        // reset buttons
        for (let index = 0; index < this.btn.length; index++) {
            const element = this.btn[index];
            const elementLabel = this.btnLabel[index];
            if (element) element.active = false;
            if (elementLabel) elementLabel.color = Color.WHITE;
        }

        if (this.btn[numericNum]) {
            this.btn[numericNum].active = true;
            if (this.btnLabel[numericNum]) {
                this.btnLabel[numericNum].color = new Color(0, 255, 197);
            }
        }

        // tabs: 0 -> add, 1 -> reduce
        if (numericNum === 0) {
            if (this.allNode) this.allNode.active = false;
            if (this.reduceNode) this.reduceNode.active = false;
            if (this.addNode) this.addNode.active = true;

            this.classData1 = this.add;

            if (this.classList1?.children.length > 1) return;

            for (let i = 0; i < this.classData1.length; i++) {
                const data = this.classData1[i];
                const item = instantiate(this.classItem1);
                item.name = String(data.type);

                const timeNode = item.getChildByName('time');
                timeNode?.getComponent(Label) && (timeNode.getComponent(Label)!.string = data.addTime);

                const prizeNode = item.getChildByName('prize');
                const prizeLabel = prizeNode?.getComponent(Label);
                if (prizeLabel) {
                    prizeLabel.string = '+' + data.amount;
                    if (prizeLabel.string.indexOf('-') > -1) {
                        prizeLabel.color = new Color(255, 0, 61);
                    }
                }

                const reliefNode = item.getChildByName('ReliefFund');
                const reliefLabel = reliefNode?.getComponent(Label);
                if (reliefLabel) {
                    reliefLabel.string = 'Type:' + (this.financial_log_map[data.type] ?? String(data.type));
                }

                const orderNode = item.getChildByName('orderNum');
                const orderLabel = orderNode?.getComponent(Label);
                if (orderLabel) {
                    orderLabel.string = data.orderNum ?? '';
                }

                item.parent = this.classList1;
                item.active = true;
            }
        } else if (numericNum === 1) {
            if (this.addNode) this.addNode.active = false;
            if (this.allNode) this.allNode.active = false;
            if (this.reduceNode) this.reduceNode.active = true;

            this.classData2 = this.reduce;

            if (this.classList2?.children.length > 1) return;

            for (let i = 0; i < this.classData2.length; i++) {
                const data = this.classData2[i];
                const item = instantiate(this.classItem2);
                item.name = String(data.type);

                const timeNode = item.getChildByName('time');
                timeNode?.getComponent(Label) && (timeNode.getComponent(Label)!.string = data.addTime);

                const prizeNode = item.getChildByName('prize');
                const prizeLabel = prizeNode?.getComponent(Label);
                if (prizeLabel) {
                    prizeLabel.string = '-' + data.amount;
                    if (prizeLabel.string.indexOf('-') > -1) {
                        prizeLabel.color = new Color(255, 0, 61);
                    }
                }

                const reliefNode = item.getChildByName('ReliefFund');
                const reliefLabel = reliefNode?.getComponent(Label);
                if (reliefLabel) {
                    reliefLabel.string = 'Type:' + (this.financial_log_map[data.type] ?? String(data.type));
                }

                const orderNode = item.getChildByName('orderNum');
                const orderLabel = orderNode?.getComponent(Label);
                if (orderLabel) {
                    orderLabel.string = data.orderNum ?? '';
                }

                item.parent = this.classList2;
                item.active = true;
            }
        }
    }
}