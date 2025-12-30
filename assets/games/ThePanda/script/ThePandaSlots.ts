import { _decorator, find, isValid } from 'cc';
import { App } from 'db://assets/scripts/App';
import { Config } from 'db://assets/scripts/config/Config';
import { SlotGameBase } from 'db://assets/scripts/game/slotgame/SlotGameBase';
import { t } from 'db://i18n/LanguageData';
const { ccclass } = _decorator;

@ccclass('ThePandaSlots')
export class ThePandaSlots extends SlotGameBase {
    private symbolCount = 14;
    private symbols = [];
    private stopAutoShowSymbol = false;
    private enterCards = [];
    private reverseSpeed = 0.2;
    enterBonusData: any;
    nextStep: () => void;



    onLoad() {
        super.onLoad();
    }

    init() {
        this.enterCards = [3, 2, 3, 4, 5, 6, 7, 2, 3, 4, 7, 2, 4, 7];
        this.topScript = this.slotGameDataScript.getTopScript();
        this.bottomScript = this.slotGameDataScript.getBottomScript();
        this.cfg = this.slotGameDataScript.getGameCfg();
        this.createSymbol();
        this.bottomScript.showBtnsByState("idle");
        this.registerEvent();
        this.reconnectShow();
        // this.node.parent.parent.getComponent("LMSlots_Puzzle").setCallback((freeInfo, chipGame) => {
        //     console.log("---1收集游戏的callback逻辑")
        //     if (this.gameInfo) {
        //         this.enterCards = this.gameInfo.resultCards;
        //         this._enterBonusData = this.gameInfo.bonusData;
        //     } else {
        //         this.enterCards = [];
        //         this._enterBonusData = this.slotGameDataScript.getBounusData();
        //     }
        //     this._enterBonusData.data = []
        //     this.slotGameDataScript.SetCollectGame(true)
        //     this.slotGameDataScript.GetFreeGameScript().enterFreeGame(null, true);
        //     for (let i = 0; i < this.symbols.length; i++) {
        //         this.symbols[i].enterCollectGame()
        //     }
        //     this.hideSymbols();
        // });
    }

    reconnectShow() {
        let selectdata = this.slotGameDataScript.getSelectData() as any;
        let bonusdata = this.slotGameDataScript.getBounusData() as any;
        if (selectdata.state || bonusdata.state) {
            for (let i = 0; i < this.symbols.length; i++) {
                let data = this.getCoinData(i + 1);
                this.symbols[i].initShowSymbol(bonusdata.cards[i], data.pool, data.coin, selectdata.state);
            }
            if (selectdata.state) {
                this.slotGameDataScript.getFreeGameScript().reConnectShowPressStart();
            } else {
                this.slotGameDataScript.getFreeGameScript().showFreeGameUI(true, bonusdata.num);
                this.autoStartSpin();
            }
        }
    }

    autoStartSpin() {
        this.scheduleOnce(() => {
            this.hideSymbols();
        }, 0.5 / Config.SLOT_GAME_SPEED)
        this.scheduleOnce(() => {
            this.canDoNextRound();
        }, 1 / Config.SLOT_GAME_SPEED)
    }

    startMove() {
        super.startMove();
        App.AudioManager.playSfx("audio/", this.cfg.normalBgm);
    }

    async onMsgSpine(msg: any) {
        this.gameInfo = msg
        if (msg.select && msg.select.state) {
            this.enterCards = msg.resultCards;
            this.enterBonusData = msg.bonusData;
        }
        this.stopAutoShowSymbol = false;
        await this.startReverseCards(this.gameInfo.bonusData);
        this.stopTime = -1;
        let bonusdata = this.slotGameDataScript.getBounusData();
        let selectdata = this.slotGameDataScript.getSelectData();
        if (selectdata.state) {
            App.AudioManager.playSfx("audio/", 'bell');
        }
        if (!bonusdata.state && !selectdata.state) {
            this.showWinTrace()
            await this.playBottomWin();
        }
        await this.slotGameDataScript.getFreeGameScript().enterFreeGame(this.symbols);
        await this.spineOver();
        this.canDoNextRound();
    }

    async spineOver() {
        return new Promise<void>((success) => {
            this.nextStep = success;
            let bonusdata = this.slotGameDataScript.getBounusData();
            if (bonusdata && bonusdata.state) {
                console.log("####旋转结束:" + bonusdata.num);
                if (bonusdata.num > 0) {
                    this.onSpin();
                    this.scheduleOnce(() => {
                        success(void 0)
                    }, 1 / Config.SLOT_GAME_SPEED);
                } else {
                    this.slotGameDataScript.getFreeGameScript().freeGameOver(this.symbols);
                }
            } else {
                let selectdata = this.slotGameDataScript.getSelectData();
                if (selectdata.state) {
                    this.onSpin();
                }
                this.scheduleOnce(() => {
                    success(void 0)
                }, 0.5 / Config.SLOT_GAME_SPEED);
            }
        });
    }

    async playBottomWin() {
        return new Promise((success) => {
            let nWin = this.slotGameDataScript.getGameWin();
            let nTotal = nWin
            let updateAllCoin = true;
            let bonusdata = this.slotGameDataScript.getBounusData();
            let selectdata = this.slotGameDataScript.getSelectData();
            if (selectdata.state || bonusdata.state) {
                nTotal = bonusdata.coin;
                updateAllCoin = true;
            }
            this.showBottomWin(nWin, nTotal, updateAllCoin, () => {
                success(void 0);
            });
        });
    }

    async stopMove() {
        super.stopMove();
        console.log("###点击停止移动");
        this.stopAutoShowSymbol = true;
    }

    onSpin() {
        this.hideSymbols();
    }

    hideSymbols() {
        App.AudioManager.playSfx("audio/", 'reel_change');
        for (let i = 0; i < this.symbols.length; i++) {
            this.symbols[i].spineHideSymbol();
        }
        let bonusdata = this.slotGameDataScript.getBounusData();
        if (!bonusdata.state) {
            this.hideAllWinningBox();
            let select = this.slotGameDataScript.getSelectData();
            if (select && select.state) {
                this.slotGameDataScript.getFreeGameScript().updateFreetimes(2);
            }
        } else {
            this.slotGameDataScript.getFreeGameScript().updateFreetimes(bonusdata.num - 1);
        }
    }

    async startReverseCards(bonusdata: any) {
        await this.startShowCards();
        if (bonusdata.state) {
            this.showNewCoinKuangGuang();
            this.slotGameDataScript.getFreeGameScript().updateFreetimes(bonusdata.num);
        }
        if (bonusdata.state && bonusdata.num == 0) {
            App.AudioManager.playSfx("audio/", 'bouns_play_end');
        }
        await this.awaitTime(0.5 / Config.SLOT_GAME_SPEED);
    }

    showNewCoinKuangGuang() {
        for (let i = 0; i < this.symbols.length; i++) {
            this.symbols[i].newCoinShowKuang();
        }
    }

    async startShowCards() {
        return new Promise((success) => {
            let cards = this.gameInfo.resultCards;
            let index = 0;
            let self = this;
            let coincount = 0;
            this.reverseSpeed = 0.2 / Config.SLOT_GAME_SPEED;
            let showcards = function () {
                for (let i = 0; i < self.symbols.length; i++) {
                    self.showSymbols(self.symbols[i], cards[i], i + 1);
                    self.symbols[i].coinSpeedLightShow(false);
                }
            }
            let bonusnum = this.slotGameDataScript.getNeedBonusIconNum() - 1;
            let autoshowcards = () => {
                if (self.symbols[index]) {
                    if (cards[index] == 8) {
                        coincount++;
                        if (coincount >= bonusnum) {
                            App.AudioManager.playSfx("audio/", 'bonus_land_3');
                        } else {
                            if (this.slotGameDataScript.isFreeGame() as any) {
                                App.AudioManager.playSfx("audio/", 'bonus_land_2');
                            } else {
                                App.AudioManager.playSfx("audio/", 'bonus_land_1');
                            }
                        }
                    } else {
                        App.AudioManager.playSfx("audio/", 'reel_stop');
                    }
                    let bonusdata = this.slotGameDataScript.getBounusData();
                    if (coincount >= bonusnum && !bonusdata.state) {
                        self.reverseSpeed = 1.2 / Config.SLOT_GAME_SPEED;
                        if (self.symbols.length > index + 1) {
                            self.symbols[index + 1].coinSpeedLightShow(true);
                        }
                    }
                    self.symbols[index].coinSpeedLightShow(false);
                    self.showSymbols(self.symbols[index], cards[index], index + 1);
                    index++;
                    self.scheduleOnce(() => {
                        if (self.stopAutoShowSymbol) {
                            showcards();
                            success(void 0);
                        } else {
                            autoshowcards();
                        }
                    }, self.reverseSpeed);
                } else {
                    success(void 0);
                }
            }
            autoshowcards();
        })
    }

    showSymbols(symscript: any, id: any, index: any) {
        let data = this.getCoinData(index);
        symscript.reverseSymbol(id, data);
    }

    getCoinData(index: any) {
        let bonusdata = this.slotGameDataScript.getBounusData().data;
        if (bonusdata) {
            for (let key in bonusdata) {
                if (bonusdata[key].idx == index) {
                    return bonusdata[key];
                }
            }
        }
        return 0;
    }

    createSymbol() {
        let symbol = this.cfg.scripts.Symbols;
        for (let idx = 0; idx < this.symbolCount; idx++) {
            let node = find("reels/Panda_Symbol" + (idx + 1), this.node);
            if (isValid(node, true)) {
                let scp = node.addComponent(symbol) as any;
                scp.init(idx);
                this.symbols.push(scp);
            }
        }
    }

    showWinTrace() {
        let allWinIdx = []
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
        for (const key in allWinIdx) {
            let symbol = this.getSymbolByIdx(Number(key));
            if (symbol) {
                symbol.playWinAnimation()
            }
        }
        this.showWinningBox(allWinIdx);
    }

    showWinningBox(allwinidx: any) {
        let boxcfg = this.slotGameDataScript.getGameCfg().winningBox;
        let winbox = {};
        for (let idx in allwinidx) {
            let box = boxcfg[Number(idx) - 1];
            box.forEach(name => {
                if (winbox[name]) {
                    winbox[name] += 1;
                } else {
                    winbox[name] = 1;
                }
            });
        }
        let framenode = find('node_frame', this.node);
        for (let key in winbox) {
            if (winbox[key] == 1) {
                framenode.getChildByName(key).active = true;
            }
        }
    }

    hideAllWinningBox() {
        let framenode = find('node_frame', this.node);
        let children = framenode.children;
        for (let i = 0, count = children.length; i < count; i++) {
            children[i].active = false;
        }
    }

    async freeOverHideObj() {
        this.hideAllWinningBox();
        await this.playBottomWin();
        if (this.nextStep) {
            this.nextStep();
        }
    }

    GetSymbolByIdx(idx: any) {
        return this.symbols[idx - 1];
    }

    resetEnterFreeCards() {
        for (let i = 0; i < this.symbols.length; i++) {
            let data = this.getEnterBonusData(i + 1);
            this.symbols[i].resetEnterFreeSymbol(this.enterCards[i], data);
        }
    }

    getEnterBonusData(index: any) {
        if (this.enterBonusData && this.enterBonusData.data) {
            let data = this.enterBonusData.data;
            for (let key in data) {
                if (data[key].idx == index) {
                    return data[key];
                }
            }
        }
        return 0;
    }

    awaitTime(time: any) {
        return new Promise((success) => {
            this.scheduleOnce(() => {
                success(void 0)
            }, time / Config.SLOT_GAME_SPEED);
        });
    }

}

