import { _decorator, Component, Node, find, instantiate, Vec2, UITransform, Vec3 } from 'cc';
import { App } from '../../App';
import { SlotGameBaseData } from './SlotGameBaseData';
import { BigWinComponent } from '../../component/BigWinComponent';
import { Config } from '../../config/Config';
import { SlotGameBottomBase } from './SlotGameBottomBase';
import { SlotGameTopBase } from './SlotGameTopBase';
const { ccclass, property } = _decorator;

@ccclass('SlotGameBase')
export class SlotGameBase extends Component {
    protected topScript: SlotGameTopBase = null;
    protected bottomScript: SlotGameBottomBase = null;
    protected col: number = 0;
    protected row: number = 0;
    protected reels: any[] = [];
    protected cfg: any = null;
    protected stopTime: number | null = null;
    protected gameInfo: any = null;
    protected bStopRightNow: boolean | null = null;
    protected topAniNode: Node | null = null;
    protected moveReelLastIdx: number = -1;
    protected bBackup: boolean = false;
    protected timeScaleVal: number = 1;
    protected roundSpineTime: number = 0;
    protected slotGameDataScript: SlotGameBaseData = null;

    onLoad() {
        this.topAniNode = find("top_ani", this.node);
        this.slotGameDataScript = App.SubGameManager.getSlotGameDataScript();
    }

    start() { }

    // 初始化
    public init() {
        this.topScript = this.slotGameDataScript.getTopScript();
        this.bottomScript = this.slotGameDataScript.getBottomScript();
        this.cfg = this.slotGameDataScript.getGameCfg();
        this.col = this.cfg.col;
        this.row = this.cfg.row;
        this.createReels(this.col, this.row);
        this.bottomScript.showBtnsByState("idle");
        this.registerEvent();
        this.reconnectShow();
    }

    protected registerEvent() {
        // 事件注册（如需）
    }

    protected createReels(col: number, row: number) {
        const reelCmp = this.cfg.scripts.Reels;
        for (let i = 0; i < col; i++) {
            const node = find("reels/reel" + (i + 1), this.node);
            const scp = node.addComponent(reelCmp) as any;
            scp.init(i, row, this.topAniNode);
            this.reels.push(scp);
        }
    }

    protected reconnectShow() {
        const rest = this.slotGameDataScript.getFreeTime();
        if (rest) {
            this.showGameview(true);
            this.canDoNextRound();
        } else {
            this.showGameview(false);
        }
    }

    public showGameview(isFree: boolean) {
        if (isFree) {
            const total = this.slotGameDataScript.getTotalFree();
            const rest = this.slotGameDataScript.getFreeTime();
            this.bottomScript.showFreeModel(true, total - rest, total);
            const nTotal = this.slotGameDataScript.getTotalFreeWin();
            this.bottomScript.setWin(nTotal);
        } else {
            this.bottomScript.showFreeModel(false);
        }
        const normalBg = find("Canvas/safe_node/spr_bg_normal");
        const normalFree = find("Canvas/safe_node/spr_bg_free");
        if (normalFree) {
            if (normalBg) normalBg.active = !isFree;
            normalFree.active = isFree;
        }
    }

    public startMove() {
        this.bStopRightNow = null;
        this.gameInfo = null;
        this.topScript.startMove();
        // this.slotGameDataScript.clearOneRoundData();
        this.moveReels(this.reels);
        this.stopTime = this.getStopTime();
    }

    protected moveReels(arr: any[]) {
        this.moveReelLastIdx = -1;
        for (let i = 0; i < arr.length; i++) {
            const item = arr[i];
            item.startMove();
            const idx = item.getReelIdx();
            if (idx > this.moveReelLastIdx) {
                this.moveReelLastIdx = idx;
            }
        }
    }

    public stopMove() {
        this.bStopRightNow = true;
        this.bottomScript.showBtnsByState("moveing_1");
        this.stopTime = -1;
        for (let i = 0; i < this.reels.length; i++) {
            const item = this.reels[i];
            item.stopMove(0);
            item.stopMoveRightNow();
        }
    }

    public onMsgSpine(msg: any) {
        this.gameInfo = msg;
        const cards = msg.resultCards;
        this.setSlotsResult(cards);
        this.setReelStateInfo(cards);
    }

    protected setSlotsResult(cards: any[]) {
        const acRow = cards.length / this.col;
        const reelResults: any[] = [];
        for (let i = 0; i < cards.length; i++) {
            const row = Math.floor(i / acRow);
            const col = i % this.col;
            if (this.cfg.symbol[cards[i]]) {
                const res: any = {};
                res.sid = cards[i];
                if (!reelResults[col]) reelResults[col] = [];
                reelResults[col].unshift(res);
            }
        }
        for (let i = 0; i < this.reels.length; i++) {
            const item = this.reels[i];
            const reelRes = reelResults[i];
            item.setResult(reelRes);
        }
    }

    protected setReelStateInfo(cards: any[]) {
        if (!this.cfg.reelStateInfo) return;
        const reelResults: any[] = [];
        for (let i = 0; i < cards.length; i++) {
            const id = cards[i];
            const col = i % this.col;
            if (!reelResults[col]) reelResults[col] = [];
            reelResults[col].push(id);
        }
        for (const info of this.cfg.reelStateInfo) {
            const stateInfo = App.SystemUtils.copy(info) as any;
            stateInfo.isStop = false;
            stateInfo.isAnt = false;
            const triggerCount = stateInfo.mini;
            const countsConfig = App.SystemUtils.copy(stateInfo.counts) as any;
            let haveCount = 0;
            let isContinuous = true;
            for (let i = 0; i < reelResults.length; i++) {
                const item = this.reels[i];
                const reelRes = reelResults[i];
                stateInfo.isStop = false;
                stateInfo.isAnt = false;
                if (haveCount >= triggerCount - 1 && stateInfo.counts[i] > 0 && isContinuous) {
                    stateInfo.isAnt = true;
                }
                const reelCountOfID = reelRes.reduce((a: number, v: any) => stateInfo.id.includes(v) ? a + 1 : a, 0);
                haveCount += reelCountOfID;
                countsConfig.shift();
                const remainingCount = (countsConfig.length > 0 ? countsConfig.reduce((x: number, y: number) => x + y) : 0) + haveCount;
                if (reelCountOfID > 0 && remainingCount >= triggerCount && isContinuous) {
                    stateInfo.isStop = true;
                }
                if (stateInfo.continuous && stateInfo.counts[i] > 0 && reelCountOfID == 0) {
                    isContinuous = false;
                }
                item.addReelStateInfo(App.SystemUtils.copy(stateInfo));
            }
        }
    }

    public getResutByRowCol(cards: any[], nRow: number, nCol: number) {
        const idx = this.changeRowColToIdx(cards, nRow, nCol);
        return cards[idx];
    }

    public changeRowColToIdx(cards: any[], nRow: number, nCol: number) {
        const acRow = cards.length / this.col;
        const idx = this.col * (acRow - nRow - 1) + nCol;
        return idx;
    }

    public getSymbolByIdx(idx: number) {
        const col = (idx - 1) % this.col;
        const row = this.row - Math.floor((idx - 1) / this.col) - 1;
        return this.reels[col].getSymbolByRow(row);
    }

    public onReelSpinEnd(colIdx: number) { }

    public doCheckReelAnti(colIdx: number) {
        if (!this.bStopRightNow) {
            let isPlayAnit = false;
            for (let i = 0; i < this.reels.length; i++) {
                const idx = this.reels[i].getReelIdx();
                if (idx == colIdx + 1) {
                    isPlayAnit = this.reels[i].playAntiAnimation();
                }
                if (idx > colIdx && isPlayAnit) {
                    const nAddSpeedTime = this.slotGameDataScript.getGameCfg().AddAntiTime || 1;
                    this.reels[i].addDelayTime(nAddSpeedTime);
                }
            }
        }
    }

    public onReelReadyToStop(colIdx: number) { }

    public onReelBounsActionEnd(colIdx: number) { }

    public onReelBounsActionDeep(colIdx: number) { }

    public onReelBounsActionBefore(colIdx: number) {
        this.doCheckReelAnti(colIdx);
    }

    public async onSpinEnd() {
        const self = this;
        this.showWinTrace();
        const nWin = this.slotGameDataScript.getGameWin();
        const pEndCall = function () {
            const bHit = self.checkSpecialReward();
            if (bHit) {
                self.bottomScript.showBtnsByState("moveing_1");
            } else {
                self.canDoNextRound();
                self.checkExitFreeGame();
            }
        };
        let nTotal = nWin;
        if (
            this.slotGameDataScript.getTotalFree() > 0 &&
            this.slotGameDataScript.getTotalFree() != this.slotGameDataScript.getFreeTime()
        ) {
            nTotal = this.slotGameDataScript.getGameTotalFreeWin();
        }
        try {
            await this.showBottomWin(nWin, nTotal, true, pEndCall);
        } catch (e) {
            console.warn('[SlotGameBase.onSpinEnd] showBottomWin rejected:', e);
            pEndCall && pEndCall();
        }
    }

    public async showBottomWin(nAddWin: number, nTotalWin: number, bUpdateBalance: boolean, pEndCall?: Function, nRollBegin?: number) {
        const self = this;
        const nTotalBet = (this.gameInfo && this.gameInfo.betcoin) || this.slotGameDataScript.getTotalBet();
        const nMul = nAddWin / nTotalBet;

        if (nMul < 10 && nMul > 0) {
            try {
                if (nMul >= 5) {
                    await this.bottomScript.showWin(nTotalWin, 2, nRollBegin, null);
                } else {
                    let roTime: number | null = null;
                    if (nMul < 1) roTime = 1;
                    await this.bottomScript.showWin(nTotalWin, 1, nRollBegin, null, roTime as any);
                }
            } finally {
                if (bUpdateBalance) self.topScript.showCoinByRoll();
                if (pEndCall) pEndCall();
            }
        } else if (nMul >= 10) {
            const bigWinScript = find('Canvas')?.getComponent(BigWinComponent);
            if (bigWinScript) {
                let bigType = 0;
                if (nMul >= 80) bigType = 5;
                else if (nMul >= 60) bigType = 4;
                else if (nMul >= 40) bigType = 3;
                else if (nMul > 20) bigType = 2;
                else bigType = 1;

                if (bigType) {
                    return await new Promise<void>((resolve) => {
                        const end = () => {
                            try {
                                self.bottomScript.showWin(nTotalWin, 3, nRollBegin, null, 0.3);
                                if (bUpdateBalance) self.topScript.showCoinByRoll();
                                if (pEndCall) pEndCall();
                            } finally {
                                resolve();
                            }
                        };
                        try {
                            bigWinScript.showBigWin(bigType, nAddWin, end);
                        } catch (err) {
                            console.warn('[SlotGameBase.showBottomWin] showBigWin error:', err);
                            end();
                        }
                    });
                }
            } else {
                console.log('未添加BigWin组件');
            }
        } else {
            if (pEndCall) pEndCall();
        }
    }

    public checkSpecialReward() {
        let res = false;
        const res1 = this.checkEnterFreeGame();
        const res2 = this.checkTriggerSubGame();
        res = res1 || res2;
        return res;
    }

    public checkExitFreeGame() { }

    public checkEnterFreeGame(): boolean {
        return false;
    }

    public checkTriggerSubGame() {
        return false;
    }

    public getStopTime() {
        return 0.1;
    }

    public setStopTime(val: number) {
        this.stopTime = val / Config.SLOT_GAME_SPEED;
    }

    public getReelStopInter(reelIdx: number) {
        const nIter = this.cfg.reelStopInter || 0.6;
        return reelIdx * nIter;
    }

    public getLastStopReelIdx() {
        return this.moveReelLastIdx;
    }

    public showSymbolTopAni(nRow: number, nCol: number) {
        if (this.topAniNode) {
            const cfg = this.slotGameDataScript.getGameCfg();
            const symScp = cfg.scripts.Symbols;
            const showNode = find(`top_symbol_${nRow}_${nCol}`, this.topAniNode);
            if (showNode) {
                showNode.active = true;
                return showNode.getComponent(symScp);
            } else {
                const reel = this.reels[nCol];
                const symbol = reel.getSymbolByRow(nRow);
                if (symbol) {
                    // get world position of the symbol node (Vec3)
                    const worldPos = symbol.node.getWorldPosition(new Vec3());
                    const newNode = instantiate(symbol.node);
                    newNode.parent = this.topAniNode;
                    newNode.name = `top_symbol_${nRow}_${nCol}`;
                    // convert world position to local space of topAniNode using its UITransform
                    const uiTrans = this.topAniNode.getComponent(UITransform);
                    if (uiTrans) {
                        const localPos = uiTrans.convertToNodeSpaceAR(worldPos);
                        newNode.setPosition(localPos);
                    } else {
                        // fallback: set to zero if UITransform not present
                        newNode.setPosition(new Vec3());
                    }
                    return newNode.getComponent(symScp);
                }
            }
        }
    }

    public clearAllTopShow() {
        if (this.topAniNode) {
            this.topAniNode.destroyAllChildren();
        }
    }

    public backup() {
        this.bBackup = true;
        for (let i = 0; i < this.reels.length; i++) {
            this.reels[i].Backup();
        }
    }

    public resume() {
        if (!this.bBackup) return;
        this.bBackup = false;
        this.clearAllTopShow();
        for (let i = 0; i < this.reels.length; i++) {
            this.reels[i].resume();
        }
    }

    public setTimeScale(val: number) {
        this.timeScaleVal = val;
    }

    public getTimeScale() {
        return this.timeScaleVal || 1;
    }

    public canStopSlot() {
        return this.gameInfo != null;
    }

    update(dt: number) {
        if (this.stopTime && this.stopTime > 0) {
            this.stopTime = this.stopTime - dt;
            if (this.stopTime <= 0) {
                if (this.canStopSlot()) {
                    this.roundSpineTime = 0;
                    this.bottomScript.showBtnsByState("moveing_2");
                    for (let i = 0; i < this.reels.length; i++) {
                        const item = this.reels[i];
                        const reelStopInterv = this.getReelStopInter(i);
                        item.stopMove(reelStopInterv);
                    }
                } else {
                    this.stopTime = dt;
                    this.roundSpineTime = this.roundSpineTime || 0;
                    this.roundSpineTime += dt;
                    if (this.roundSpineTime > 20) {
                        this.topScript.setBackLobby(true);
                    }
                }
            }
        }
    }

    //可以进入下一局
    //如果是自动模式/免费模式，调用此接口会开始自动旋转，
    //普通模式的话，调用此接口。按钮都会变成可点击状态
    canDoNextRound() {
        this.slotGameDataScript.canDoNextRound();
        this.topScript.stopMove();
        this.bottomScript.canDoNextRound();
    }

    //显示中奖路线
    //竞品中的显示线路是：先总，后单条循环。目前我们只显示总的
    showWinTrace() {
        let allWinIdx = []

        //中奖位置
        for (let i = 0; i < this.gameInfo.zjLuXian.length; i++) {
            let item = this.gameInfo.zjLuXian[i]
            for (let idx = 0; idx < item.indexs.length; idx++) {
                allWinIdx[item.indexs[idx]] = 1
            }
        }
        if (this.gameInfo.scatterZJLuXian && this.gameInfo.scatterZJLuXian.indexs) {
            for (let i = 0; i < this.gameInfo.scatterZJLuXian.indexs.length; i++) {
                let val = this.gameInfo.scatterZJLuXian.indexs[i]
                allWinIdx[val] = 1
            }
        }

        //总
        for (const key in allWinIdx) {
            let symbol = this.getSymbolByIdx(Number(key))
            if (symbol) {
                symbol.playWinAnimation()
                symbol.showKuang()
            }
        }
    }
}