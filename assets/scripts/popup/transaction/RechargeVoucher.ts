import { _decorator, Component, instantiate, Node, Prefab } from 'cc';
import { App } from '../../App';
import { PromoCodeItem } from './PromoCodeItem';
const { ccclass, property } = _decorator;

@ccclass('RechargeVoucher')
export class RechargeVoucher extends Component {
    @property(Node) under: Node = null!;
    @property(Node) pop: Node = null!;
    @property(Node) addNode: Node = null!;
    @property(Prefab) promoCodeItem: Prefab = null!;
    @property
    itemType: number = 0;
    public datasource: any = null;

    private completed: any[] = [];
    private expired: any[] = [];
    private active: any[] = [];

    async onLoad() {
        // const data = App.TransactionData.claimedCoupons;
    }

    async onEnable() {
        const data = App.TransactionData.claimedCoupons;
        if (data && data.length > 0) {
            this.init(data);
            return
        }
        App.ApiManager.getClaimedCoupons().then((data: any) => {
            App.TransactionData.claimedCoupons = data;
            this.init(data);
        });
    }

    private init(data: any) {
        if (Array.isArray(data) && data.length > 0) {
            this.completed = [];
            this.expired = [];
            this.active = [];

            for (let i = 0; i < data.length; i++) {
                const element = data[i];
                element.activeBool = '';

                const validFrom = new Date(element.validFrom);
                const validTo = new Date(element.validTo);
                const now = new Date();

                if (element.isUsed) {
                    element.activeBool = 'Completed';
                    this.completed.push(element);
                } else if (!element.isUsed && now > validTo) {
                    element.activeBool = 'Expired';
                    this.expired.push(element);
                } else {
                    element.activeBool = 'Active';
                    this.active.push(element);
                }
            }
            this.btnSelect();
        }
    }



    setParams(datasource: any) {
        this.datasource = datasource;
        // App.TransactionData.claimedCoupons = this.datasource;
        // App.TransactionData.couponCode = this.datasource.code;
    }

    private btnSelect() {
        const array = this.active || [];
        const ops: Node[] = [];
        const addNode = this.addNode;
        if (!addNode) return;
        if (addNode.children.length > 0) return;

        // const itemType = App.TransactionData.promoTye;
        const itemType = this.itemType;
        if (itemType === 1) {
            const targetCode = App.TransactionData.couponCode;
            for (let i = 0; i < array.length; i++) {
                const element = array[i];
                if (element.type === 'Deposit' && (element.code === targetCode || targetCode == null || targetCode == "")) {
                    const node = instantiate(this.promoCodeItem);
                    // const voucher = node.getChildByName('voucher');
                    node.getComponent(PromoCodeItem).init(element);
                    addNode.addChild(node);
                    ops.push(node);

                    App.TransactionData.couponCode = element.code;
                    break;
                }
            }
        } else if (itemType === 2) {
            for (let i = 0; i < array.length; i++) {
                const element = array[i];
                if (element.type === 'Deposit') {
                    const node = instantiate(this.promoCodeItem);
                    // const voucher = node.getChildByName('voucher');
                    node?.getComponent(PromoCodeItem)?.init(element);
                    addNode.addChild(node);
                    ops.push(node);
                }
            }
        }

        if (ops.length > 0) {
            if (this.pop) this.pop.active = true;
            if (this.under) this.under.active = false;
        } else {
            if (this.pop) this.pop.active = false;
            if (this.under) this.under.active = true;
        }
    }

    start() {
        // noop
    }
}