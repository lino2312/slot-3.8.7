import { _decorator, Component, Node, Sprite, Label, Button, SpriteFrame, isValid, assetManager, ImageAsset } from 'cc';
import { App } from '../App';
import { GameItemData } from '../data/GameItemData';
const { ccclass, property } = _decorator;


@ccclass('ThirdGameItemComponent')
export class ThirdGameItemComponent extends Component {
    @property(Sprite)
    icon: Sprite | null = null;

    @property(Label)
    lotteryNameLabel: Label | null = null;

    @property(Label)
    lotteryInfoLabel1: Label | null = null;

    @property(Label)
    lotteryInfoLabel2: Label | null = null;

    private data: any;
    private index: number = -1;

    // 供外部设置数据
    init(index: number, data: any) {
        this.data = data;
        this.index = index;
        this.trySetup(index);
    }

    onLoad() {
        App.ComponentUtils.onClick(this.node, this.onClick, this)
    }

    onDisable() {

    }

    onDestroy() {
        App.ComponentUtils.offClick(this.node, this.onClick, this);
    }

    onClick() {
        this.showItem(this.data.slotsTypeID);
    }

    private trySetup(index: number) {
        if (index === 0 && isValid(this.lotteryNameLabel) && isValid(this.lotteryInfoLabel1) && isValid(this.lotteryInfoLabel2)) {
            this.showLotteryInfo();
        }
        
        const vendorImg = this.data?.vendorImg;
        const slotsName = this.data?.slotsName;
        
        // 如果有远程图片URL，优先加载远程图片
        if (vendorImg && vendorImg.length > 0) {
            App.ResUtils.getRemoteSpriteFrame(vendorImg)
                .then((sf) => {
                    if (sf) {
                        this.icon.spriteFrame = sf;
                    } else {
                        this.loadLocalIcon(slotsName);
                    }
                })
                .catch(() => {
                    this.loadLocalIcon(slotsName);
                });
        } else {
            // vendorImg为空，加载本地图片
            this.loadLocalIcon(slotsName);
        }
    }

    private loadLocalIcon(slotsName: string) {
        if (!slotsName) return;
        App.ResUtils.getSpriteFrame(`image/thirdGame/${slotsName}/spriteFrame`)
            .then((sf) => {
                if (sf) {
                    this.icon.spriteFrame = sf;
                }
            })
            .catch((err) => {
                console.warn("本地厂商图片加载失败:", slotsName, err);
            });
    }

    private showLotteryInfo() {
        this.lotteryNameLabel.string = this.data.categoryCode;
        let newStr = [];
        switch (this.lotteryNameLabel.string) {
            case 'Win Go':
            case 'Trx Win Go':
                newStr = ["Guess Number", "Green/Red/Purple to win"]
                break
            case '5D':
            case 'K3':
                // 				newStr = `猜猜 数字
                // 高/低/奇数/偶数`
                newStr = ["Guess Number", 'Big/Small/Odd/Even']
                break
            case 'XOSO':
            case 'FXOSO':
                newStr = ['Vietnam Lottery', 'Fairness/Justice/Openness']
                break
            case 'Bingo18':
                newStr = ['Vietnam Lottery', 'Fairness/Justice/Openness']
                break
            case '4D':
                newStr = ['4D official color', 'Fairness/Justice/Openness']
                break
            default:
                newStr = []
        }
        this.lotteryInfoLabel1.string = newStr[0];
        this.lotteryInfoLabel2.string = newStr[1];
    }


    async showItem(slotsTypeId: number) {
        // index 0(lottery)、5(sport)、6(video) 直接跳转第三方游戏
        if (this.index === 0 || this.index === 5 || this.index === 6) {
            this.openThirdGame();
        } else {
            const gameList = GameItemData.slotVendorGameMap.get(slotsTypeId) || [];
            App.EventUtils.dispatchEvent("setupGameItem", slotsTypeId, gameList);
        }
    }

    private async openThirdGame() {
        const gameCode = this.data?.gameID || this.data?.gameCode || this.data?.slotsTypeID;
        const vendorId = this.data?.vendorId || this.data?.slotsTypeID || '';
        try {
            const pGameUrlThird = await App.ApiManager.getGameUrlThird(String(gameCode), String(vendorId));
            if (pGameUrlThird?.url) {
                App.SystemUtils.openThirdGame(pGameUrlThird.url);
            }
        } catch (err) {
            console.warn("获取第三方游戏URL失败:", err);
        }
    }
}