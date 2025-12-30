import { _decorator, Component, Node, EditBox, Prefab, instantiate } from 'cc';
import { App } from '../../App';
import { PromoCodeItem } from './PromoCodeItem';
const { ccclass, property } = _decorator;


@ccclass('PromoCode')
export class PromoCode extends Component {
    @property([Node]) btn: Node[] = [];
    @property([Node]) btnShow: Node[] = [];

    @property(EditBox) editboxCode: EditBox = null!;
    @property(EditBox) editboxProm: EditBox = null!;

    @property(Prefab) ydPromoCodeItem: Prefab = null!;

    private refresh = false;
    private active: any[] = [];
    private completed: any[] = [];
    private expired: any[] = [];

    onLoad() {
        // 初始化面板隐藏
        for (let i = 0; i < this.btnShow.length; i++) {
            const element = this.btnShow[i];
            if (element) element.active = false;
        }
        this.refresh = false;
        this.info();
    }

    private async info() {
        const data = await App.ApiManager.getClaimedCoupons();
        console.log('PromoCode info data=', data);
        if (!Array.isArray(data) || data.length === 0) return;
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

        this.btnSelect(null, '0');
    }

    public btnSelect(event: any, indexStr: string) {
        const index = Number(indexStr);
        // 切换面板显示
        for (let i = 0; i < this.btnShow.length; i++) {
            const element = this.btnShow[i];
            if (element) element.active = false;
        }
        if (this.btnShow[index]) this.btnShow[index].active = true;

        this.noData(index);
    }

    private renderCouponList(index: number, items: any[]) {
        const root = this.btnShow[index];
        if (!root) return;

        const scroll = root.getChildByName('New ScrollView');
        const nodata = scroll?.getChildByName('nodata');
        const content = scroll?.getChildByName('view')?.getChildByName('content');

        const isEmpty = (items?.length ?? 0) === 0;
        if (nodata) nodata.active = isEmpty;
        if (isEmpty || !content) return;

        if (content.children?.length > 0 && !this.refresh) return;

        content.removeAllChildren();
        for (let i = 0; i < items.length; i++) {
            const element = items[i];
            const node = instantiate(this.ydPromoCodeItem);
            const comp: PromoCodeItem = node.getComponent(PromoCodeItem);
            comp.init(element);
            content.addChild(node);
        }

        this.refresh = false;
    }

    private noData(index: number) {
        switch (index) {
            case 0:
                this.renderCouponList(0, this.active);
                break;
            case 1:
                this.renderCouponList(1, this.completed);
                break;
            case 2:
                this.renderCouponList(2, this.expired);
                break;
            default:
                break;
        }
    }

    public async copy(indexStr: string) {
        try {
            const pastedText = await navigator.clipboard.readText();
            if (indexStr === '1') {
                if (this.editboxCode) this.editboxCode.string = pastedText || '';
            } else {
                if (this.editboxProm) this.editboxProm.string = pastedText || '';
            }
            (globalThis as any).cc?.vv?.FloatTip?.show?.('Paste Success');
        } catch (error) {
            console.log('clipboard error', error);
            (globalThis as any).cc?.vv?.FloatTip?.show?.('Please allow permission to Clipboard');
        }
    }

    public claim() {
        const code = this.editboxCode?.string ?? '';
        App.ApiManager.claimCoupon(code).then(() => {
            App.AlertManager.showFloatTip('successful');
            this.refresh = true;
            if (this.editboxCode) this.editboxCode.string = '';
            this.info();
        });
    }

    public collect() {
        this.claim();
    }

    public telegram() {
        const url = App.TransactionData.homeSettings?.telegramPlatform ?? 'https://telegram.org';
        App.PlatformApiMgr.openURL(url);
    }

    public whatsApp() {
        const url = App.TransactionData.homeSettings?.telegramPlatform ?? 'https://www.whatsapp.com';
        App.PlatformApiMgr.openURL(url);
    }
}