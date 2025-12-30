import { _decorator, Component, Node, Label } from 'cc';
import { App } from 'db://assets/scripts/App';
import { SlotGameBaseData } from '../game/slotgame/SlotGameBaseData';
const { ccclass, property } = _decorator;

const UPDATE_INTERVAL = 0.1;

@ccclass('JackpotPrizePool')
export class JackpotPrizePool extends Component {
    @property({ tooltip: 'jackpot默认显示比例' })
    jMult: number = 1;

    @property({ tooltip: '-1随机,0 mini,1 minior,2 major,3 grand(mega)' })
    dataType: number = 0;

    @property(Label)
    jackpotLabel: Label = null;

    jackpotBase: number = 0;
    jackpotNum: number = 0;
    jackpotMax: number = 0;
    updateTime: number = 0.1;
    unlockBetNum: number = 0;
    bet: number = 10000;
    gameId: number = -1;
    pauseNum: number = null;
    isPause: boolean = false;
    bLock: boolean = false;
    private slotGameDataScript: SlotGameBaseData = null;

    onLoad() {
        if (this.gameId === -1) {
            this.gameId = App.SubGameManager.getGameid();
        }
        this.slotGameDataScript = App.SubGameManager.getSlotGameDataScript();
        if (this.slotGameDataScript && this.gameId > 0) {
            this.bet = this.slotGameDataScript.getTotalBet();
            App.EventUtils.on(App.EventID.SLOT_TOTALBET_UPDATED, this.onEventTotalbetUpdated, this);
            let gameJackpot = this.slotGameDataScript.getGameJackpot();
            if (gameJackpot && gameJackpot.unlock && this.dataType < gameJackpot.unlock.length) {
                this.unlockBetNum = gameJackpot.unlock[this.dataType];
            }
        }
        this.initData();
        App.EventUtils.on(App.EventID.REFUSH_GAME_JP, this.onEventRefushJPData, this);
        this.updateJackpot();
    }

    protected onDestroy(): void {
        App.EventUtils.offTarget(this);
    }

    getPoolType() {
        return this.dataType;
    }

    getUnlockNum() {
        return this.unlockBetNum;
    }

    isLocked() {
        return this.bet < this.unlockBetNum;
    }

    init(gameId: number, maxBet: number = 10000) {
        this.gameId = gameId;
        this.bet = maxBet;
        this.initData();
        this.updateJackpot();
    }

    onEventTotalbetUpdated(data: any, bInit: boolean) {
        this.bet = data.detail;
        let bInitCheck = bInit;
        this.initData();
        if (this.isLocked() !== this.bLock) {
            this.bLock = this.isLocked();
            App.EventUtils.dispatchEvent(App.EventID.SLOT_JACKPOOL_LOCK_CHANGE, {
                poolIdx: this.dataType,
                val: this.bLock,
                unLockBet: this.unlockBetNum,
                bInit: bInitCheck
            });
        }
    }

    setMult(mult: number) {
        this.jMult = mult;
    }

    pausePrizePool(pauseNum: number) {
        this.pauseNum = pauseNum;
        this.isPause = true;
        this.updateJackpot();
    }

    restPrizePool() {
        this.pauseNum = null;
        this.isPause = false;
    }

    initData() {
        this.jackpotBase = Math.floor((0.9 + Math.random() * 0.2) * 100);
        // let gameList = App.userData().gameList;
        // console.log("当前游戏ID", gameList);
        // for(let key in a)
        // let val = (window as any).AppData?.getGameJackpot?.(this.gameId) ?? [];
        // if (this.dataType < val.length) {
        //     this.jackpotBase = val[this.dataType];
        // }
        this.jackpotNum = this.bet * this.jackpotBase * (0.95 + Math.random() * 0.1);
        this.jackpotMax = this.jackpotNum * (1.05 + Math.random() * 0.05);
    }

    update(dt: number) {
        if (this.jackpotNum > 0 && !this.isPause) {
            this.updateTime += dt;
            if (this.updateTime < UPDATE_INTERVAL) return;
            this.updateTime = 0;
            let add = this.jackpotNum * (1 + Math.random() * 4) / 10000;
            if (add > 10000000) add /= 2;
            this.jackpotNum += add;
            if (this.jackpotNum > this.jackpotMax) {
                this.initData();
            }
            this.updateJackpot();
        }
    }

    updateJackpot() {
        if (this.jackpotLabel) {
            if (this.pauseNum) {
                let str = this.S2P(this.pauseNum * this.jMult);
                this.jackpotLabel.string = App.FormatUtils.FormatNumToComma(str);
            } else {
                let str = this.S2P(this.jackpotNum * this.jMult);
                this.jackpotLabel.string = App.FormatUtils.FormatNumToComma(str);
            }
        }
    }

    onEventRefushJPData() {
        this.initData();
    }

    getJackpotLabel() {
        return this.jackpotLabel;
    }

    S2P(val, nPoint = 0) {
        if (nPoint >= 0) {
        }
        else {
            nPoint = 0
        }

        //因客户端自己累加的时候可能会出现很多.9999999的情况，
        //服务端最多只有4位小数点，所以4位小数点后的采取四舍五入
        let pointSave = function (input) {
            //按4位小数点后面四舍五入
            let fixNum = Math.round(Number(input) * Math.pow(10, 4))
            return fixNum / Math.pow(10, 4)
        }
        val = pointSave(val)

        let nRate = Math.pow(10, nPoint) //保留2位
        let temp = Number(val)
        temp = Math.floor(pointSave(temp * nRate)) / nRate
        temp = Number(temp.toFixed(nPoint))
        return temp
    }
}


