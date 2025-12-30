import BaseComponent from "db://assets/scripts/game/tsFrameCommon/Base/BaseComponent";
import MySpine from "db://assets/scripts/game/tsFrameCommon/Base/MySpine";
import Utils from "db://assets/scripts/game/tsFrameCommon/Base/MyUtils";
import { PoolMng } from "db://assets/scripts/game/tsFrameCommon/Base/PoolMng";
import { RollNumber } from "db://assets/scripts/game/tsFrameCommon/Base/RollNumber";
import SlotGameData from "db://assets/scripts/game/tsFrameCommon/Slot/SlotsGameData";
import MoneyComingBigWin from "db://assets/games/MoneyComing/script/MoneyComingBigWin";
import MoneyComingData, { MoneyComingMode, MoneyComingWinType } from "db://assets/games/MoneyComing/script/MoneyComingData";
import MoneyComingSlots from "db://assets/games/MoneyComing/script/MoneyComingSlots";
import MoneyComingWheel from "db://assets/games/MoneyComing/script/MoneyComingWheel";

import { Node, UIOpacity, Vec3, _decorator, js, tween } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('MoneyComingGame')
export default class MoneyComingGame extends BaseComponent {

    @property(Node)
    ndStartAni: Node = null;

    @property(Node)
    ndNormalAni: Node = null;

    @property(Node)
    ndNormalTips: Node = null;

    @property([Node])
    ndNormalTipLightList: Node[] = [];

    @property([Node])
    ndNormalTipList: Node[] = [];

    @property(Node)
    ndSpecialTips: Node = null;

    @property([Node])
    ndSpecialStatusIcons: Node[] = [];

    @property([Node])
    ndSpecialRightBgs: Node[] = [];

    @property(Node)
    ndSpecialLeftNum: Node = null;

    @property(Node)
    ndSpecialRightNum: Node = null;

    @property(Node)
    ndSpecialModeParticle: Node = null;

    @property(Node)
    ndTopView: Node = null;

    @property(Node)
    ndTopViewMask: Node = null;

    @property(Node)
    ndBigWinParticle: Node = null;

    isResetView = false;
    
    // LIFE-CYCLE CALLBACKS:

    onLoad() {
        this.updateBetChange();
        this.ndTopViewMask.active = false;
        this.ndNormalAni.active = false;
        this.ndStartAni.active = true;
        this.ndStartAni.getComponent(MySpine).playAni(0, false, () => {
            this.ndStartAni.active = false;
            this.ndNormalAni.active = true;
            this.ndNormalAni.getComponent(MySpine).playAni(0, true);
        });
        this.ndBigWinParticle.active = true;
        this.ndBigWinParticle.getComponent(UIOpacity).opacity = 0;
        this.updateTipsStatus(MoneyComingMode.Normal);
        this.ndSpecialLeftNum.getComponent(RollNumber).init();
        this.ndSpecialRightNum.getComponent(RollNumber).init();
        SlotGameData.addDynamicLoadViewData(MoneyComingData.BIG_WIN_VIEW, {
            ndParent: this.ndTopView,
            ndMask: this.ndTopViewMask,
            viewScript: 'MoneyComingBigWin',
        });
    }

    start() {

    }

    // update (dt) {}

    updateBetChange() {
        let curBetNum = SlotGameData.getCurBetScore();
        (SlotGameData.scriptWheel as MoneyComingWheel).playChangeBetAni();
        if (curBetNum >= MoneyComingData.MINI_BET) {
            if ((SlotGameData.scriptWheel as MoneyComingWheel).getIsLock()) {
                (SlotGameData.scriptWheel as MoneyComingWheel).startUnLockAni();
            }
            if ((SlotGameData.scriptSlots as MoneyComingSlots).getIsLock()) {
                (SlotGameData.scriptSlots as MoneyComingSlots).startThirdUnLockAni();
            }
        } else {
            if (!(SlotGameData.scriptWheel as MoneyComingWheel).getIsLock()) {
                (SlotGameData.scriptWheel as MoneyComingWheel).startLockAni();
            }
            if (!(SlotGameData.scriptSlots as MoneyComingSlots).getIsLock()) {
                (SlotGameData.scriptSlots as MoneyComingSlots).startThirdLockAni();
            }
        }
        (SlotGameData.scriptWheel as MoneyComingWheel).updateWheelBg(curBetNum >= MoneyComingData.G_T_R_BET);
        (SlotGameData.scriptWheel as MoneyComingWheel).udpateWheelItemList();
        this.updateNormalTips();
    }

    updateTipsStatus(gameMode: MoneyComingMode) { let gameModeOld = MoneyComingData.gameMode;
        MoneyComingData.gameMode = gameMode;
        this.ndNormalTips.active = MoneyComingData.gameMode == MoneyComingMode.Normal;
        this.ndSpecialTips.active = MoneyComingData.gameMode == MoneyComingMode.Special;
        switch (MoneyComingData.gameMode) {
            case MoneyComingMode.Normal:
                Utils.playMusic(SlotGameData.BUNDLE_NAME, "bgm_normal");
                this.updateNormalTips();
                break;
            case MoneyComingMode.Special:
                Utils.playMusic(SlotGameData.BUNDLE_NAME, "bgm_wheel");
                this.updateSpecialTips();
                if (gameModeOld == MoneyComingMode.Normal) {
                    this.ndSpecialTips.setScale(1, 0);
                    tween(this.ndSpecialTips)
                        .to(0.2, { scale: new Vec3(1, 1) })
                        .start();
                }
                break;
            default:
                break;
        }
    }

    updateNormalTips() {
        let isLastTip = SlotGameData.curBetIndex >= this.ndNormalTipList.length-1;
        this.ndNormalTipLightList[0].active = !isLastTip;
        this.ndNormalTipLightList[1].active = isLastTip;
        let startIndex = 0;
        let endIndex = 0;
        if (isLastTip) {
            startIndex = this.ndNormalTipList.length-2;
            endIndex = this.ndNormalTipList.length-1;
        } else {
            startIndex = SlotGameData.curBetIndex;
            endIndex = startIndex+1;
        }
        for (let i = 0; i < startIndex; i++) {
            this.ndNormalTipList[i].active = false;
        }
        for (let i = startIndex; i <= endIndex; i++) {
            this.ndNormalTipList[i].active = true;
        }
        for (let i = endIndex+1; i < this.ndNormalTipList.length; i++) {
            this.ndNormalTipList[i].active = false;
        }
    }

    updateSpecialTips() {
        this.ndSpecialStatusIcons.forEach((element, i) => {
            if (element) {
                element.active = i == MoneyComingData.specialStatus;
            }
        });
        this.ndSpecialRightBgs.forEach((element, i) => {
            if (element) {
                element.active = i == MoneyComingData.specialRightBg;
            }
        });
    }

    updateSpecialLeftNum(num: number, callback: Function = null, isScroll = true) {
        let rmNum = this.ndSpecialLeftNum.getComponent(RollNumber);
        if (!rmNum.getIsInit()) {
            rmNum.init();
        }
        if (num > 0 && isScroll) {
            rmNum.setScrollTime(0.5);
            rmNum.scrollTo(num, callback);
        } else {
            rmNum.reset(num);
        }
    }

    updateSpecialRightNum(num: number, callback: Function = null, isScroll = true) {
        let rmNum = this.ndSpecialRightNum.getComponent(RollNumber);
        if (!rmNum.getIsInit()) {
            rmNum.init();
        }
        if (num > 0 && isScroll) {
            rmNum.setScrollTime(0.5);
            rmNum.scrollTo(num, callback);
        } else {
            rmNum.reset(num);
        }
    }

    onSlotStart() {
        this.resetView();
        this.isResetView = false;
    }

    onSlotEnd(cbFinished: Function = null) {
        let cbDoNextRound = () => {
            if (cbFinished) {
                cbFinished();
            }
            if (!this.isResetView) {
                SlotGameData.scriptBottom.canDoNextRound();
            }
        };
        let cbNextRound = () => {
            cbDoNextRound();
        };
        if (MoneyComingData.curRollServerData.winScore > 0) {
            let curBet = SlotGameData.getCurBetScore();
            let cbUpdateWinNum = () => {
                let isBigWin = false;
                if (MoneyComingData.curRollServerData.winScore >= curBet*MoneyComingData.BIG_WIN_MIN_REWARD) {
                    isBigWin = true;
                    let winType = MoneyComingWinType.Big;
                    if (MoneyComingData.curRollServerData.winScore >= curBet*MoneyComingData.SUPER_WIN_MIN_REWARD) {
                        winType = MoneyComingWinType.Super;
                    } else if (MoneyComingData.curRollServerData.winScore >= curBet*MoneyComingData.MAGA_WIN_MIN_REWARD) {
                        winType = MoneyComingWinType.Mega;
                    }
                    SlotGameData.showDynamicLoadView(MoneyComingData.BIG_WIN_VIEW, null, () => {
                        SlotGameData.hideDynamicLoadView(MoneyComingData.BIG_WIN_VIEW);
                        SlotGameData.scriptBottom.readyNextRound();
                        cbNextRound();
                    }, MoneyComingData.curRollServerData.winScore, winType, null, this.ndBigWinParticle);
                }
                if (!isBigWin) {
                    let audioNameStart = 'win1';
                    let audioNameEnd = 'win1end';
                    if (MoneyComingData.curRollServerData.winScore > curBet*5) {
                        audioNameStart = 'win2';
                        audioNameEnd = 'win2end';
                    }
                    Utils.playEffect(SlotGameData.BUNDLE_NAME, audioNameStart);
                    SlotGameData.scriptBottom.updateWinNum(MoneyComingData.curRollServerData.winScore, () => {
                        Utils.playEffect(SlotGameData.BUNDLE_NAME, audioNameEnd);
                        SlotGameData.scriptBottom.readyNextRound();
                        this.setTimeout(() => {
                            cbNextRound();
                        }, 1000);
                    });
                }
            };
            if (MoneyComingData.gameMode == MoneyComingMode.Special) {
                (SlotGameData.scriptGame as MoneyComingGame).updateSpecialRightNum(MoneyComingData.curRollServerData.rightWinScore, () => {
                    cbUpdateWinNum();
                });
            } else {
                cbUpdateWinNum();
            }
        } else {
            cbNextRound();
        }
    }

    onStopSpin() {
        this.resetView();
    }

    resetView() {
        if (this.isResetView) {
            return;
        }
        this.isResetView = true;
    }

}
