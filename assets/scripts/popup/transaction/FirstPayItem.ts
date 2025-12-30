import { _decorator, Component, Node, Label, Sprite, SpriteFrame, Texture2D, ImageAsset } from 'cc';
import { App } from '../../App';
const { ccclass, property } = _decorator;

@ccclass('FirstPayItem')
export class FirstPayItem extends Component {
    @property(Label) payment: Label = null!;
    @property(Node) icon: Node = null!;

    private data: any = null;
    private rechargeInfo: any = null;
    private localUsdtInfo: any = null;
    private payID: number = 0;
    private callback: ((ret: any) => void) | null = null;

    onLoad() {
        this.loadImage();
    }

    public init(data: any, rechargeInfo: any, localUsdtInfo: any, payID: number, callback: (ret: any) => void) {
        console.log("FirstPayItem init data", data);
        console.log("FirstPayItem init payID", payID);
        console.log("FirstPayItem init localUsdtInfo", localUsdtInfo);
        console.log("FirstPayItem init rechargeInfo", rechargeInfo);
        const enumDeposit = { USDT: 19 };
        const localBanklist = [9, 18];

        this.data = data;
        this.payID = payID;
        this.localUsdtInfo = localUsdtInfo;
        this.rechargeInfo = rechargeInfo;
        this.callback = callback;

        if (!this.payment) return;

        if (localBanklist.includes(this.payID)) {
            this.payment.string = rechargeInfo?.bankName ? String(rechargeInfo.bankName) : 'UPI 02';
        } else if (payID === enumDeposit.USDT) {
            this.payment.string = localUsdtInfo?.usdtName ? String(localUsdtInfo.usdtName) : 'USDT';
        } else {
            this.payment.string = data?.payName ? String(data.payName) : 'UPI 02';
        }

        // refresh icon when init is called after onLoad
        this.loadImage();
    }

    public onSelect() {
        if (!this.callback) return;

        const enumDeposit = { USDT: 19 };
        const localBanklist = [9, 18];

        if (this.payID === enumDeposit.USDT) {
            this.callback({
                currentPaymentMethod: this.localUsdtInfo,
                currentChannel: this.rechargeInfo,
                isLocalUsdt: true,
                isBank: false,
                usdtID: this.localUsdtInfo?.usdtID,
                usdtName: this.localUsdtInfo?.usdtName,
                usdtType: this.localUsdtInfo?.usdtType,
                rechargeAddress: this.localUsdtInfo?.coding,
                payID: this.rechargeInfo?.payID,
                payTypeID: this.rechargeInfo?.payTypeID,
            });
        } else if (localBanklist.includes(this.payID)) {
            this.callback({
                currentPaymentMethod: this.localUsdtInfo,
                currentChannel: this.rechargeInfo,
                isLocalUsdt: false,
                isBank: true,
                accountName: this.rechargeInfo?.accountName,
                bankAccountNumber: this.rechargeInfo?.bankAccountNumber,
                transferType: this.rechargeInfo?.transferType,
                bankName: this.rechargeInfo?.bankName,
                payTypeID: this.localUsdtInfo?.payTypeID,
            });
        } else {
            App.ApiManager.getRechargeTypes(this.data?.payID, this.data?.payTypeID).then((ret: any) => {
                this.callback && this.callback(ret);
            });
        }
    }

    private loadImage() {
        const url = this.data?.payNameUrl;
        if (!url || !this.icon?.isValid) return;

        App.ResUtils.getRemoteSpriteFrame(url).then((spriteFrame: SpriteFrame) => {
            if (this.icon?.isValid) {
                const sp = this.icon.getComponent(Sprite);
                if (sp) sp.spriteFrame = spriteFrame;
            }
        });
    }
}