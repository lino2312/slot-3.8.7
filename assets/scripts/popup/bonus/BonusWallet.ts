import { _decorator, Component, Node, Label, instantiate } from 'cc';
import { App } from '../../App';
const { ccclass, property } = _decorator;

@ccclass('BonusWallet')
export class BonusWallet extends Component {
    @property(Label) prizeLbl: Label = null!;
    @property(Label) prizeLbl2: Label = null!;
    @property(Node) btn1: Node = null!;
    @property(Node) btn2: Node = null!;

    @property(Node) classItem: Node = null!;
    @property(Node) classList: Node = null!;

    @property(Label) get: Label = null!;
    @property(Label) globalRatio: Label = null!;


    start() {
        this.prizeLbl.string = String(App.TransactionData.bonusWalletSettings.unlockedBonusBalance || '0');
        this.prizeLbl2.string = String(App.TransactionData.bonusWalletSettings.lockedBonusBalance || '0');
        this.globalRatio.string = `2. When you lose in event games, up to ${App.TransactionData.bonusWalletSettings.globalRatio}% Bonus will be released and made Transferable.`;
        this.vipInfo();
    }


    private vipInfo() {
        if (!App.TransactionData.bonusWalletSettings?.vipBonusUnlockRatios || !this.classItem || !this.classList) return;

        for (let i = 0; i < App.TransactionData.bonusWalletSettings.vipBonusUnlockRatios.length; i++) {
            const info = App.TransactionData.bonusWalletSettings.vipBonusUnlockRatios[i];
            const item = instantiate(this.classItem);
            item.children[0]?.getComponent(Label) && (item.children[0].getComponent(Label)!.string = info.vipName || '');
            item.children[1]?.getComponent(Label) && (item.children[1].getComponent(Label)!.string = `${info.bonusUnlockRatio || 0}%`);
            item.parent = this.classList;
            item.active = true;
        }
    }

    public getReliefFundAllPrize() {
        const amount = parseInt(this.prizeLbl?.string || '0', 10);
        if (amount <= 0) {
            App.AlertManager.getCommonAlert().showWithoutCancel('No prize to claim');
            return;
        }
        App.ApiManager.getClaimUnlockBonus().then((data) => {
            this.prizeLbl.string = '0';
            App.AlertManager.showFloatTip('Succeed');
            App.EventUtils.dispatchEvent('RefreshtotalBalanceLabel');
            App.EventUtils.dispatchEvent('UPATE_COINS');
        });
    }

    public getBonus() {
        App.GameManager.jumpTo(11.3);
    }
}