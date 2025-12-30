import { _decorator, Label, Node, Tween, tween, Vec3 } from 'cc';
import BaseComponent from '../../../scripts/game/tsFrameCommon/Base/BaseComponent';
import MySpine from "../../../scripts/game/tsFrameCommon/Base/MySpine";
import Utils from "../../../scripts/game/tsFrameCommon/Base/MyUtils";
import { RollNumber } from "../../../scripts/game/tsFrameCommon/Base/RollNumber";
import SlotGameData from "../../../scripts/game/tsFrameCommon/Slot/SlotsGameData";
import Crazy777IData from "./Crazy777IData";
const { ccclass, property } = _decorator;

@ccclass('Crazy777IGame')
export default class Crazy777IGame extends BaseComponent {
    @property(Node)
    ndScores: Node | null = null;
    @property([Node])
    ndNormalIconList: Node[] = [];
    @property(Node)
    ndAnySymbol: Node | null = null;
    @property([Node])
    ndSpecialIconList: Node[] = [];
    @property(Node)
    ndFreeTimeAnis: Node | null = null;
    @property(Node)
    ndWinScore: Node | null = null;
    @property(Node)
    ndRespinStart: Node | null = null;
    @property(Node)
    ndRespinEnd: Node | null = null;
    ndScoreAniList: Node[] = [];
    isResetView = false;
    //    // LIFE-CYCLE CALLBACKS:
    onLoad() {
        this.updateScoreList();
        this.ndNormalIconList.forEach(element => {
            element.active = false
        });
        this.ndSpecialIconList.forEach(element => {
            element.active = false
        });
        this.ndFreeTimeAnis?.children.forEach(element => {
            element.active = false
        });
        this.ndWinScore?.getComponent(RollNumber)?.init();
        if (this.ndWinScore) this.ndWinScore.active = false;
        if (this.ndRespinStart) this.ndRespinStart.active = false;
        if (this.ndRespinEnd) this.ndRespinEnd.active = false;
    }
    start() {

    }
    //    // update (dt) {}
    updateScoreList() {
        if (!this.ndScores) return;
        let curBetNum = SlotGameData.getCurBetScore();
        for (let i = 0; i < this.ndScores.children.length; i++) {
            let score = curBetNum / 3 * Crazy777IData.ITEM_REWARD_CONFIG[i];
            this.ndScores.children[i].getComponent(Label).string = Utils.floatToFormat(score, 1, true, true, false);
        }
    }
    onSlotStart() {
        this.resetView();
        this.isResetView = false;
        this.ndRespinStart.active = false;
        this.ndRespinEnd.active = false;
        this.ndWinScore.getComponent(RollNumber).reset(0);
        this.ndWinScore.active = false;
        if (SlotGameData.isRespinMode) {
            for (let i = 0; i < SlotGameData.respinTimes; i++) {
                let ndFreeAni = this.ndFreeTimeAnis.children[i];
                ndFreeAni.active = true
                let nodeSp = ndFreeAni.getComponent(MySpine)
                if (nodeSp) {
                    nodeSp.playAni(0, true)
                }
            }
        }
    }
    onSlotEnd() {
        let rewardRow = 2;
        let mapInfo = Crazy777IData.curRollServerData.mapInfo;
        if (Crazy777IData.curRollServerData.winScore > 0) {
            let aniTime = this.ndNormalIconList[0].children[0].getComponent(MySpine).getAniDuration(0);
            let ndIconAni: Node = null;
            let reward0 = mapInfo[`${0}_${rewardRow}`].type;
            let reward1 = mapInfo[`${1}_${rewardRow}`].type;
            let reward2 = mapInfo[`${2}_${rewardRow}`].type;
            if (reward0 == reward1 && reward1 == reward2) {
                ndIconAni = this.ndNormalIconList[reward0 - 1];
                this.ndScoreAniList.push(this.ndScores.children[reward0 - 1]);
            } else if (reward0 <= 3 && reward1 <= 3 && reward2 <= 3) {
                ndIconAni = this.ndNormalIconList[5];
                this.ndScoreAniList.push(this.ndScores.children[5]);
            } else if (reward0 >= 4 && reward0 <= 5 && reward1 >= 4 && reward1 <= 5 && reward2 >= 4 && reward2 <= 5) {
                ndIconAni = this.ndNormalIconList[6];
                this.ndScoreAniList.push(this.ndScores.children[6]);
            } else {
                tween(this.ndAnySymbol)
                    .to(2 / 9 * aniTime, { scale: new Vec3(1.2, 1.2, 1.2) })
                    .to(1 / 9 * aniTime, { scale: new Vec3(1.1, 1.1, 1.1) })
                    .to(2 / 9 * aniTime, { scale: new Vec3(1.3, 1.3, 1.3) })
                    .to(1 / 9 * aniTime, { scale: new Vec3(1, 1, 1) })
                    .delay(1 / 3 * aniTime)
                    .union()
                    .repeatForever()
                    .start();
                this.ndScoreAniList.push(this.ndScores.children[7]);
            }
            let specialReward = mapInfo[`${Crazy777IData.COL_NUM - 1}_${2}`].type;
            if (specialReward > 0) {
                switch (specialReward) {
                    case 9:
                        this.ndScoreAniList.push(this.ndScores.children[8]);
                        break;
                    case 10:
                        this.ndScoreAniList.push(this.ndScores.children[9]);
                        break;
                    default:
                        break;
                }
            }
            if (ndIconAni) {
                ndIconAni.active = true;
                ndIconAni.children.forEach(element => {
                    element.getComponent(MySpine).playAni(0, true);
                });
            }
            if (this.ndScoreAniList) {
                this.ndScoreAniList.forEach(element => {
                    tween(element)
                        .to(2 / 9 * aniTime, { scale: new Vec3(1.2, 1.2, 1.2) })
                        .to(1 / 9 * aniTime, { scale: new Vec3(1.1, 1.1, 1.1) })
                        .to(2 / 9 * aniTime, { scale: new Vec3(1.3, 1.3, 1.3) })
                        .to(1 / 9 * aniTime, { scale: new Vec3(1, 1, 1) })
                        .delay(0.3)
                        .union()
                        .repeatForever()
                        .start();
                });
            }
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
        Tween.stopAllByTarget(this.ndAnySymbol);
        this.ndAnySymbol.scale = new Vec3(1, 1, 1);
        if (this.ndScoreAniList.length > 0) {
            this.ndScoreAniList.forEach(element => {
                Tween.stopAllByTarget(element);
                element.scale = new Vec3(1, 1, 1);
            });
            this.ndScoreAniList = [];
        }
        this.ndNormalIconList.forEach(element => {
            element.active = false
        });
        if (!SlotGameData.isRespinMode) {
            this.ndFreeTimeAnis.children.forEach(element => {
                element.active = false
            });
            this.ndSpecialIconList.forEach(element => {
                element.active = false
            });
        }
    }
}


