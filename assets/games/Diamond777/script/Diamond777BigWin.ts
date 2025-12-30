import MySpine from "db://assets/scripts/game/tsFrameCommon/Base/MySpine";
import Utils from "db://assets/scripts/game/tsFrameCommon/Base/MyUtils";
import { RollNumber } from "db://assets/scripts/game/tsFrameCommon/Base/RollNumber";
import ViewComponent from "db://assets/scripts/game/tsFrameCommon/Base/ViewComponent";
import SlotGameData from "db://assets/scripts/game/tsFrameCommon/Slot/SlotsGameData";
import Diamond777Data, { Diamond777WinType } from "db://assets/games/Diamond777/script/Diamond777Data";

import { Node, UIOpacity, _decorator } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('Diamond777BigWin')
export default class Diamond777BigWin extends ViewComponent {

    @property(Node)
	ndAni: Node = null;

    @property(Node)
	ndWin: Node = null;

    private curRollingIndex = 0;
    private winScore = 0;
    private cbRollComplete: Function = null;
    private isClicked = false;
    private isStartAniEnd = false;
    private isEndAniReady = false;
    private isStartEnd = false;
    private winType = Diamond777WinType.big;
    private readyTime = 0;
    private timeout = null;

    private ndParticle: Node = null;

    private isHugeWinReady = false;
    private isMassiveWinReady = false;
    private isLegendaryWinReady = false;

    // LIFE-CYCLE CALLBACKS:

    onLoad () {
        super.onLoad();
    }

    start () {
        super.start();
    }

    // update (dt) {}

    onInit (cbClose: Function, curRollingIndex: number, win: number, cbRollComplete: Function, ndParticle: Node) {
        this.cbClose = cbClose;
        this.curRollingIndex = curRollingIndex;
        this.winScore = win;
        this.cbRollComplete = cbRollComplete;
        this.isClicked = false;
        this.isStartAniEnd = false;
        this.isEndAniReady = false;
        this.isHugeWinReady = false;
        this.isMassiveWinReady = false;
        this.isLegendaryWinReady = false;
        this.isStartEnd = false;
        this.readyTime = 0;
        this.winType = Diamond777WinType.big;
        this.ndParticle = ndParticle;
        this.ndParticle.getComponent(UIOpacity).opacity = 0;
        this.node.getComponent(UIOpacity).opacity = 0;
        let rnWin = this.ndWin.getComponent(RollNumber);
        rnWin.init();
        this.ndAni.getComponent(MySpine).setSkinIndex(0);
        this.ndAni.getComponent(MySpine).playAni(0, false, () => {
            this.ndAni.getComponent(MySpine).playAni(1, true);
        });
        let audioWin = '';
        if (this.winScore >= 1000000) {
            audioWin = 'win4';
        } else if (this.winScore >= 10000) {
            audioWin = 'win3';
        } else if (this.winScore >= 100) {
            audioWin = 'win2';
        } else {
            audioWin = 'win1';
        }
        Utils.playEffect(SlotGameData.BUNDLE_NAME, audioWin, null, (effectId: number) => {
            this.node.getComponent(UIOpacity).opacity = 255;
            this.ndParticle.getComponent(UIOpacity).opacity = 255;
            Utils.playEffect(SlotGameData.BUNDLE_NAME, 'human_big_win');
            this.isStartAniEnd = true;
            rnWin.setScrollTime(Utils.getAudioDuration(effectId));
            rnWin.scrollTo(this.winScore, () => {
                this.onScrollEnd();
            });
            if (this.isClicked) {
                setTimeout(() => {
                    rnWin.stop();
                }, 100);
            }
        });
    }

    onClickClose () {
        if (this.isClicked) {
            return;
        }
        this.isClicked = true;
        if (!this.isStartAniEnd) {
            
        } else if (!this.isEndAniReady) {
            let rnWin = this.ndWin.getComponent(RollNumber);
            if (rnWin.getIsScrolling()) {
                rnWin.stop();
            } else {
                switch (this.winType) {
                    case Diamond777WinType.huge:
                        if (this.isHugeWinReady) {
                            this.onHugeWinEnd();
                        }
                        break;
                    case Diamond777WinType.massive:
                        if (this.isMassiveWinReady) {
                            this.onMassiveWinEnd();
                        }
                        break;
                    case Diamond777WinType.legendary:
                        if (this.isLegendaryWinReady) {
                            this.onLegendaryWinEnd();
                        }
                        break;
                    default:
                        break;
                }
            }
        }
    }

    onReadyEnd () {
        this.readyTime = Date.now();
        this.isEndAniReady = true;
        if (this.cbRollComplete) {
            this.cbRollComplete();
        }
        this.playEndAni();
    }

    onScrollEnd () {
        let isHugeWin = false;
        let curBet = SlotGameData.getCurBetScore();
        if (curBet == 1) {
            if (Diamond777Data.curRollServerData.winScore > curBet*20) {
                isHugeWin = true;
            }
        } else if (curBet == 2) {
            if (Diamond777Data.curRollServerData.winScore > curBet*10) {
                isHugeWin = true;
            }
        } else {
            if (Diamond777Data.curRollServerData.winScore > curBet*5) {
                isHugeWin = true;
            }
        }
        if (isHugeWin) {
            this.winType = Diamond777WinType.huge;
            Utils.playEffect(SlotGameData.BUNDLE_NAME, 'human_huge_win', () => {
                if (!this.isClicked) {
                    this.onHugeWinEnd();
                }
            });
            this.ndAni.getComponent(MySpine).setSkinIndex(1);
            this.ndAni.getComponent(MySpine).playAni(0, false, () => {
                this.isHugeWinReady = true;
                this.ndAni.getComponent(MySpine).playAni(1, true);
                if (this.isClicked) {
                    this.onHugeWinEnd();
                }
            });
        } else {
            this.onReadyEnd();
        }
    }

    onHugeWinEnd () {
        let isAniEnd = true;
        let curBet = SlotGameData.getCurBetScore();
        if (curBet == 1) {
            if (Diamond777Data.curRollServerData.winScore > curBet*200) {
                isAniEnd = false;
            }
        } else if (curBet == 2) {
            if (Diamond777Data.curRollServerData.winScore > curBet*100) {
                isAniEnd = false;
            }
        } else {
            if (Diamond777Data.curRollServerData.winScore > curBet*20) {
                isAniEnd = false;
            }
        }
        if (isAniEnd) {
            this.onReadyEnd();
        } else {
            this.winType = Diamond777WinType.massive;
            Utils.playEffect(SlotGameData.BUNDLE_NAME, 'human_massive_win', () => {
                if (!this.isClicked) {
                    this.onMassiveWinEnd();
                }
            });
            this.ndAni.getComponent(MySpine).setSkinIndex(2);
            this.ndAni.getComponent(MySpine).playAni(0, false, () => {
                this.isMassiveWinReady = true;
                this.ndAni.getComponent(MySpine).playAni(1, true);
                if (this.isClicked) {
                    this.onMassiveWinEnd();
                }
            });
        }
    }

    onMassiveWinEnd () {
        this.winType = Diamond777WinType.legendary;
        Utils.playEffect(SlotGameData.BUNDLE_NAME, 'human_legendary_win', () => {
            if (!this.isClicked) {
                this.onLegendaryWinEnd();
            }
        });
        this.ndAni.getComponent(MySpine).setSkinIndex(3);
        this.ndAni.getComponent(MySpine).playAni(0, false, () => {
            this.isLegendaryWinReady = true;
            this.ndAni.getComponent(MySpine).playAni(1, true);
            if (this.isClicked) {
                this.onLegendaryWinEnd();
            }
        });
    }

    onLegendaryWinEnd () {
        this.onReadyEnd();
    }

    playEndAni() {
        if (this.isStartEnd) {
            return;
        }
        this.isStartEnd = true;
        if (this.timeout) {
            clearTimeout(this.timeout);
            this.timeout = null;
        }
        Utils.stopAllEffect();
        Utils.playEffect(SlotGameData.BUNDLE_NAME, `win${this.winType}_end`, () => {
            this.ndAni.getComponent(MySpine).playAni(2, false);
            setTimeout(() => {
                this.ndParticle.getComponent(UIOpacity).opacity = 0;
                if (this.cbClose) {
                    this.cbClose();
                }
            }, 100);
        });
    }

}
