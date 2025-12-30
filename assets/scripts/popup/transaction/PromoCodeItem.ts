import { _decorator, Color, Component, find, Label, Node, Sprite, SpriteFrame } from 'cc';
import { App } from '../../App';
const { ccclass, property } = _decorator;

@ccclass('PromoCodeItem')
export class PromoCodeItem extends Component {
    @property(Label) lbl1: Label = null!;
    @property(Label) lbl2: Label = null!;
    @property(Label) lbl3: Label = null!;
    @property(Label) lbl4: Label = null!;
    @property(Label) lbl5: Label = null!;
    @property(Label) lbl6: Label = null!;

    @property(Sprite) logo: Sprite = null!;
    @property([SpriteFrame]) logobg: SpriteFrame[] = [];

    @property(Node) node1: Node = null!;
    @property(Node) node2: Node = null!;
    @property(Node) node3: Node = null!;
    @property(Node) node4: Node = null!;
    @property(Node) node5: Node = null!;

    @property(Node) selectNode1: Node = null!;
    @property(Node) selectNode: Node = null!;

    private data: any = null;
    private spin = false;
    private remaining = 0;

    onLoad() {
        App.EventUtils.on('rechargeInfo', this.rechargeInfo, this);
    }

    onDestroy() {
        App.EventUtils.offTarget(this);
    }

    public init(data: any) {
        this.data = data;
        if (this.isValid) this.setupFromData();
    }

    private setupFromData() {
        const ret = this.data;
        if (!ret) return;

        // 倒计时初始化（以 validTo 为截止时间）
        const validToStr = ret.validTo;
        const nowMs = Date.now();
        const validToMs = new Date(validToStr).getTime();
        this.remaining = (validToMs - nowMs) / 1000;
        const timeFormatted = this.formatHMS(this.remaining);

        if (ret.type === 'Spin') {
            if (this.node4) this.node4.active = false;
            if (this.node5) this.node5.active = true;

            if (this.lbl1) this.lbl1.color = new Color(4, 45, 158);
            const darkBlue = new Color(1, 0, 60);
            if (this.lbl2) this.lbl2.color = darkBlue;
            if (this.lbl3) this.lbl3.color = darkBlue;
            if (this.lbl4) this.lbl4.color = darkBlue;

            if (this.lbl1) this.lbl1.string = 'Power of the Kraken';
            if (this.lbl2) this.lbl2.string = `1 Free Spins: ${ret.spinCredit}`;
            if (this.lbl3) this.lbl3.string = `2 Bet Coins: ${ret.betAmount}`;

            const vf = String(ret.validFrom || '').split(' ')[0] || '';
            const vt = String(ret.validTo || '').split(' ')[0] || '';
            if (this.lbl4) this.lbl4.string = `${vf}-${vt}`;

            if (this.lbl5) this.lbl5.string = timeFormatted;
            if (this.lbl6) {
                this.lbl6.node.active = true;
                this.lbl6.string = `+${ret.bonusPercent}%`;
            }

            if (ret.activeBool === 'Completed') {
                if (this.node1) this.node1.active = false;
                if (this.node2) this.node2.active = true;
                if (this.logo && this.logobg[1]) this.logo.spriteFrame = this.logobg[1];
            } else if (ret.activeBool === 'Expired') {
                if (this.logo && this.logobg[0]) this.logo.spriteFrame = this.logobg[0];
                if (this.node1) this.node1.active = false;
                if (this.node3) this.node3.active = true;
                const gray = new Color(97, 106, 113);
                if (this.lbl1) this.lbl1.color = gray;
                if (this.lbl2) this.lbl2.color = gray;
                if (this.lbl3) this.lbl3.color = gray;
                if (this.lbl4) this.lbl4.color = gray;
            } else {
                if (this.node1) this.node1.active = true;
                if (this.logo && this.logobg[1]) this.logo.spriteFrame = this.logobg[1];
            }

            this.LoadIcon(parseInt(ret.gameCode));
            this.spin = true;
        } else if (ret.type === 'Deposit') {
            if (this.node4) this.node4.active = true;
            if (this.node5) this.node5.active = false;

            if (this.lbl1) this.lbl1.color = new Color(202, 104, 2);
            const brown = new Color(82, 21, 2);
            if (this.lbl2) this.lbl2.color = brown;
            if (this.lbl3) this.lbl3.color = brown;
            if (this.lbl4) this.lbl4.color = brown;

            if (this.lbl1) this.lbl1.string = 'Deposit Voucher';
            if (this.lbl2) this.lbl2.string = `1 Minimum Deposit: ${ret.minDeposit}`;
            if (this.lbl3) this.lbl3.string = `2 Get Extra${ret.bonusPercent}%`;

            const vf = String(ret.validFrom || '').split(' ')[0] || '';
            const vt = String(ret.validTo || '').split(' ')[0] || '';
            if (this.lbl4) this.lbl4.string = `${vf}-${vt}`;

            if (this.lbl5) this.lbl5.string = timeFormatted;
            if (this.lbl6) {
                this.lbl6.node.active = true;
                this.lbl6.string = `+${ret.bonusPercent}%`;
            }

            if (ret.activeBool === 'Completed') {
                if (this.node1) this.node1.active = false;
                if (this.node2) this.node2.active = true;
                if (this.logo && this.logobg[2]) this.logo.spriteFrame = this.logobg[2];
            } else if (ret.activeBool === 'Expired') {
                if (this.logo && this.logobg[0]) this.logo.spriteFrame = this.logobg[0];
                if (this.node1) this.node1.active = false;
                if (this.node3) this.node3.active = true;
                const gray = new Color(97, 106, 113);
                if (this.lbl1) this.lbl1.color = gray;
                if (this.lbl2) this.lbl2.color = gray;
                if (this.lbl3) this.lbl3.color = gray;
                if (this.lbl4) this.lbl4.color = gray;
            } else {
                if (this.node1) this.node1.active = true;
                if (this.logo && this.logobg[2]) this.logo.spriteFrame = this.logobg[2];
            }

            if (App.TransactionData.promoVoucher) {
                if (this.node1) this.node1.active = false;
                if (this.node2) this.node2.active = false;
                if (this.node3) this.node3.active = false;
            }
            this.spin = false;
        }

        if (this.selectNode) {
            this.rechargeInfo();
        }
    }

    private formatHMS(sec: number) {
        const s = Math.max(0, Math.floor(sec));
        const hh = Math.floor(s / 3600).toString().padStart(2, '0');
        const mm = Math.floor((s % 3600) / 60).toString().padStart(2, '0');
        const ss = (s % 60).toString().padStart(2, '0');
        return `${hh}:${mm}:${ss}`;
    }

    update(dt: number) {
        this.remaining -= dt;
        if (this.remaining < 0) {
            this.remaining = 0;
            this.enabled = false;
        }
        if (this.lbl5) this.lbl5.string = this.formatHMS(this.remaining);
    }

    goRecharge() {
        App.TransactionData.couponCode = this.data?.code;
        App.TransactionData.claimedCoupons = this.data;

        if (this.spin) {
            const gameId = parseInt(this.data?.gameCode);
            App.ApiManager.getGameUrl(String(gameId)).then((response: any) => {
                if (response?.msg === 'Succeed') {
                    App.GameManager.EnterGame(gameId);
                    App.GameData.spinFreeGame = true;
                    App.GameData.spinFreeGameData = this.data;
                } else {
                    App.AlertManager.getCommonAlert().showWithoutCancel(response?.msg || 'Failed to get game URL');
                }
            });
        } else {
            if (App.userData().userInfo.firstRecharge && App.userData().userInfo.firstRecharge > 0) {
                App.PopUpManager.addPopup("prefabs/popup/popupRecharge", "hall", null, false);
            } else {
                App.PopUpManager.addPopup("prefabs/popup/popupFirstRecharge", "hall", null, true);
            }
        }
    }

    select() {
        if (!this.selectNode) return;
        this.selectNode.active = !this.selectNode.active;
        if (this.selectNode.active) {
            App.TransactionData.claimedCoupons = this.data;
            App.TransactionData.couponCode = this.data?.code;
            App.EventUtils.dispatchEvent('refreshCouponCode');
            App.EventUtils.dispatchEvent('rechargeInfo');
        } else {
            App.TransactionData.couponCode = null;
        }
    }

    rechargeInfo() {
        if (this.selectNode && App.TransactionData?.couponCode) {
            this.selectNode.active = App.TransactionData.couponCode === this.data?.code;
        }
    }

    private getIconUrl(cfg: any) {
        return `image/game/icon/${cfg.title.toString().trim()}/spirtFrame`;
    }

    private LoadIcon(gameId: number) {
        const icon = find('G_vouucher/PowerOfTheKraken', this.node);
        const cfg = App.GameItemCfg[gameId];
        if (!cfg) {
            console.log(`${gameId} 未配置 GameItemCfg`);
            return;
        }
        if (this.lbl1) this.lbl1.string = cfg.name;

        const path = this.getIconUrl(cfg);
        App.ResUtils.getSpriteFrame(path).then((sf) => {
            if (icon && icon.isValid) {
                const sp = icon.getComponent(Sprite);
                if (sp) sp.spriteFrame = sf;
            }
        });
    }
}