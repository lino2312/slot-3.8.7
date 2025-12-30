import { _decorator, Component, Node, Label, Prefab, PageView, Button, Sprite, SpriteFrame, find, instantiate, tween } from 'cc';
import { App } from '../../App';
const { ccclass, property } = _decorator;

@ccclass('LuckyWheel')
export class LuckyWheel extends Component {
    @property(Node) wheelNode: Node = null!;
    @property(Label) deposit: Label = null!;
    @property(Label) rotateNum: Label = null!;
    @property(Prefab) item: Prefab = null!;
    @property(Node) tips: Node = null!;
    @property(Node) jutNode: Node = null!;
    @property(Node) progressNode: Node = null!;

    @property(PageView) pageView: PageView = null!;
    @property([Node]) btns: Node[] = [];
    @property([Button]) btnElements: Button[] = [];
    @property(Button) btn1: Button = null!;
    @property(Button) btn2: Button = null!;
    @property(Button) btn3: Button = null!;
    @property(Button) btn4: Button = null!;
    @property([Node]) nodes: Node[] = [];
    @property([Node]) wheelNodes: Node[] = [];
    @property([Node]) outlines: Node[] = [];
    @property(Sprite) logo: Sprite = null!;
    @property([SpriteFrame]) logoBg: SpriteFrame[] = [];
    @property(Node) wheelFourLock: Node = null!;

    private luckyWheels: any[] = [];
    private data: any = null;
    private dataSource: any = {
        surplusRotateNum: 0,
        vipRating: '',
        rewardList: [],
        taskList: [],
        isPrize: false,
        rewardSetting: null,
        correctionAngle: 0,
        sumRotateNum: 0,
        drawTime: '',
        rewardType: '',
        request: false,
        bindingType: 0,
    };
    private currentPageIndex = -1;
    private id: number = 0;
    private _isClick: boolean = false;
    private _isSpin: boolean = false;

    onLoad() {
        if (this.btnElements.length > 0) {
            this.btnElements.forEach((button, index) => {
                button.node.on('click', () => {
                    if (!this.luckyWheels[index]?.isAllowToSpin && index === this.luckyWheels.length - 1) {
                        return;
                    }
                    if (this._isClick || this._isSpin)
                        return;
                    this._isClick = true;
                    this.changePage(index);
                }, this);
            });
        }
        this.pageView?.node.on(PageView.EventType.SCROLLING, this.onPageTurned, this);
        this.pageView?.node.on(PageView.EventType.PAGE_TURNING, this.onPageTurned, this);
    }

    onEnable() {
        App.ApiManager.luckyWheels().then((res: any) => {
            let data = res.data;
            this.data = res;
            if (this.deposit) this.deposit.string = data.currentDepositAmount;
            this.luckyWheels = data.luckyWheels || [];
            for (let index = 0; index < this.luckyWheels.length; index++) {
                const element = this.luckyWheels[index];
                const node = this.btns[index];
                if (!node) continue;
                const titleNode = node.getChildByName('lbl');
                titleNode?.getComponent(Label) && (titleNode.getComponent(Label)!.string = element.title || '');
                const lblSelected = find('select/lbl', node)?.getComponent(Label);
                if (lblSelected) lblSelected.string = element.title || '';
                if (!element.isAllowToSpin && index === this.luckyWheels.length - 1) {
                    if (this.outlines[index]) this.outlines[index].active = false;
                    if (this.wheelFourLock) this.wheelFourLock.active = true;
                } else {
                    if (this.outlines[index]) this.outlines[index].active = true;
                    if (this.wheelFourLock) this.wheelFourLock.active = false;
                }
            }
            this._isClick = false;
            this._isSpin = false;
            this.changePage(0);
        });
    }

    private onWheel(index: number) {
        const response: any = { data: this.data?.data?.luckyWheels?.[index] };
        if (!response.data) return;

        this.id = response.data.id;
        this.dataSource.surplusRotateNum = response.data.totalSpinChances - response.data.spinChancesUsed;

        if (this.dataSource.surplusRotateNum > 0) {
            if (this.logo) this.logo.spriteFrame = this.logoBg?.[1] || null;
            this.logo?.node.getComponent(Button) && (this.logo.node.getComponent(Button)!.interactable = true);
        } else {
            this.dataSource.surplusRotateNum = 0;
            this.logo?.node.getComponent(Button) && (this.logo.node.getComponent(Button)!.interactable = false);
            if (this.logo) this.logo.spriteFrame = this.logoBg?.[0] || null;
        }

        if (this.rotateNum) this.rotateNum.string = String(this.dataSource.surplusRotateNum);

        // reward list and icons
        this.dataSource.taskList = response.data.spinRulesList || [];
        const rewardList = (this.dataSource.rewardList = response.data.priceSettingsList || []);
        if (rewardList && this.wheelNode) {
            for (let i = 0; i < rewardList.length; i++) {
                const element = rewardList[i];
                const node = this.wheelNode.children[i];
                if (!node) continue;

                node.getComponent(Label) && (node.getComponent(Label)!.string = element.name || '');
                const icon = find('icon', node);
                // 只有当iconUrl存在且不为空时才加载远程图片
                if (element.iconUrl && element.iconUrl.length > 0) {
                    App.ResUtils.getRemoteSpriteFrame(element.iconUrl).then((spriteFrame: SpriteFrame) => {
                        if (icon && icon.isValid && spriteFrame) {
                            icon.getComponent(Sprite) && (icon.getComponent(Sprite)!.spriteFrame = spriteFrame);
                            icon.active = true;
                        } else if (icon) {
                            icon.active = false;
                        }
                    }).catch(() => {
                        // 加载失败时忽略
                    }).finally(() => {
                        this._isClick = false;
                    });
                }
            }
        }

        // task progress
        const taskList = response.data.spinRulesList || [];
        if (taskList) {
            const len = taskList.length > 5 ? 5 : taskList.length;
            this.jutNode?.removeAllChildren();

            const progress = instantiate(this.progressNode);
            if (progress) {
                progress.getComponent(Sprite) && (progress.getComponent(Sprite)!.fillRange =
                    Number(this.deposit?.string || 0) / (taskList[taskList.length - 1]?.depositAmount || 1));
                progress.active = true;
                progress.setPosition(0, 0, 0);
                this.jutNode.addChild(progress);
            }

            for (let i = 0; i < len; i++) {
                const element = taskList[i];
                const prefab = instantiate(this.item);
                if (prefab) {
                    const base = taskList[taskList.length - 1]?.depositAmount || 1;
                    prefab.setPosition((1255 * element.depositAmount) / base, prefab.position.y, 0);
                    prefab.children[0]?.getComponent(Label) && (prefab.children[0].getComponent(Label)!.string = `₹${element.depositAmount}`);
                    prefab.children[1]?.children[0]?.getComponent(Label) &&
                        (prefab.children[1].children[0].getComponent(Label)!.string = `+${element.spinCount}SPIN`);
                    this.jutNode.addChild(prefab);
                }
            }
        }
    }

    private onPageTurned = (_event?: any) => {
        if (!this.pageView) return;
        const idx = this.pageView.getCurrentPageIndex();
        if (!this.luckyWheels[idx]?.isAllowToSpin && idx === this.luckyWheels.length - 1) {
            return;
        }
        if (this.currentPageIndex === idx) return;
        this.currentPageIndex = idx;
        this.changePage(idx);
    };

    public showTips() {
        if (this.tips) this.tips.active = false;
        App.AudioManager.playBtnClick();
        App.EventUtils.dispatchEvent('HALL_OPEN_SHOP');
    }

    public closeTips() {
        App.AudioManager.playBtnClick();
        if (this.tips) this.tips.active = false;
    }

    public onClickSpin() {
        if (this.dataSource.isPrize) {
            App.AlertManager.getCommonAlert().show('The lottery is in progress, please wait');
            return;
        }
        if (this.dataSource.request) return;

        if (!this.dataSource.surplusRotateNum) {
            App.AudioManager.playBtnClick();
            if (this.tips) this.tips.active = true;
            return;
        }

        const type = this.dataSource.bindingType;
        if (type > 0) {
            App.ApiManager.getWithdrawals(type).then((data: any) => { }).catch((error: any) => {
                const str = type == 1 ? 'bank card' : type == 3 ? 'USDT' : type == 4 ? 'E-Wallet' : '';
                App.AlertManager.getCommonAlert().show(`Your account is not yet linked ${str}. Please proceed to link it`,
                    () => {
                        App.PopUpManager.addPopup('prefabs/popup/popupWithdraw', "hall", null, false);
                    });
            });
        }

        this.dataSource.request = true;
        App.ApiManager.spinLuckyWheel(this.id).then((res: any) => {
            let data = res.data;
            this.dataSource.rewardSetting = data.priceValue;
            this.dataSource.rewardType = data.priceType;
            this.onStartSpin(this.id);
        }).catch((error: any) => {
            this.dataSource.request = false;
            App.AlertManager.getCommonAlert().showWithoutCancel(error.message || 'Spin failed, please try again later');
        });
    }


    private onStartSpin(i: number) {
        if (this._isSpin) return;
        this._isSpin = true;
        const list = this.dataSource.rewardList || [];
        const prizeIndex = list.findIndex(
            (item: any) => item.priceType === this.dataSource.rewardType && item.priceValue === this.dataSource.rewardSetting
        );

        const fullCircles = 4;
        const skewing = -22.5;
        const prizePosition = prizeIndex * (360 / 8);
        const totalRotation = 360 * fullCircles + prizePosition + skewing;

        this.dataSource.isPrize = true;

        tween(this.wheelNode)
            .to(5, { angle: totalRotation }, { easing: 'quartInOut' })
            .call(() => {
                this.dataSource.isPrize = false;
                this.dataSource.request = false;

                const rewardTypeLabels: Record<number, string> = {
                    0: 'Cash',
                    1: 'Bonus',
                    2: 'other wheel Spin chance',
                    3: 'current wheel Spin chance',
                };
                const label = rewardTypeLabels[this.dataSource.rewardType] || 'Unknown';
                App.AlertManager.getCommonAlert().showWithoutCancel(`Congratulations, you have won a prize of ${label} ${this.dataSource.rewardSetting}!`);
                this.wheelNode.angle = totalRotation% 360;
                this._isSpin = false;
            })
            .start();

        this.dataSource.correctionAngle = prizePosition;

        // refresh chances after spin
        const num = i - 1;
        App.ApiManager.luckyWheels().then((res: any) => {
            this.data = res;
            let data = res.data;
            if (this.deposit) this.deposit.string = data.currentDepositAmount;
            for (let index = 0; index < data.luckyWheels.length; index++) {
                const element = data.luckyWheels[index];
                if (index === num) {
                    this.dataSource.surplusRotateNum = element.totalSpinChances - element.spinChancesUsed;
                    if (this.rotateNum) this.rotateNum.string = String(this.dataSource.surplusRotateNum);
                    if (this.dataSource.surplusRotateNum === 0) {
                        this.logo?.node.getComponent(Button) && (this.logo.node.getComponent(Button)!.interactable = false);
                        if (this.logo) this.logo.spriteFrame = this.logoBg?.[0] || null;
                    }
                }
            }
        });
    }

    public onClickOpen(url: string) {
        App.PopUpManager.addPopup(`prefabs/luckyWheel/${url}`, "hall", null, true);
    }

   public onClickDeposit() {
        // firstRecharge > 0 → 首充已用完 → 直接跳转充值页面
        // firstRecharge = 0 → 首充还有 → 显示首充活动页面
        const firstRecharge = App.userData().userInfo?.firstRecharge;
        if (firstRecharge && firstRecharge > 0) {
            App.PopUpManager.addPopup("prefabs/popup/popupRecharge", "hall", null, false);
        } else {
            App.PopUpManager.addPopup("prefabs/popup/popupFirstRecharge", "hall", null, true);
        }
    }

    public changePage(index: number) {
        if (this.pageView) {
            this.pageView.scrollToPage(index, 0.3);
        }
        for (let i = 0; i < this.nodes.length; i++) {
            this.nodes[i].active = i === index;
        }
        this.wheelNode = this.wheelNodes[index];
        this.onWheel(index);
    }

    onDestroy() {
        // this.pageView?.node.off('scrolling', this.onPageTurned, this);
    }
}