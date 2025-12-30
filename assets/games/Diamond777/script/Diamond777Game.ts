import BaseComponent from "db://assets/scripts/game/tsFrameCommon/Base/BaseComponent";
import MySpine from "db://assets/scripts/game/tsFrameCommon/Base/MySpine";
import Utils from "db://assets/scripts/game/tsFrameCommon/Base/MyUtils";
import SlotGameData from "db://assets/scripts/game/tsFrameCommon/Slot/SlotsGameData";
import Diamond777BigWin from "db://assets/games/Diamond777/script/Diamond777BigWin";
import Diamond777Data from "db://assets/games/Diamond777/script/Diamond777Data";
import Diamond777NiceWin from "db://assets/games/Diamond777/script/Diamond777NiceWin";

import { Label, Node, Sprite, SpriteFrame, Tween, Vec3, _decorator, js, tween } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('Diamond777Game')
export default class Diamond777Game extends BaseComponent {

    @property(Node)
    ndMain: Node = null;

    @property(Node)
    ndWelcome: Node = null;

    @property(Node)
    ndWelcomeAni: Node = null;

    @property(Node)
    ndKuangAni: Node = null;

    @property(Node)
    ndZuanAni: Node = null;
    
    @property(Node)
    ndScores: Node = null;

    @property(Node)
    ndNiceWin: Node = null;

    @property(Node)
    ndTopView: Node = null;

    @property(Node)
    ndTopViewMask: Node = null;

    @property([Node])
    ndRewardAniList: Node[] = [];

    @property([SpriteFrame])
    spfItemIconList: SpriteFrame[] = [];

    ndScoreAniList: Node[] = [];
    iconAniList = {};

    isResetView = false;

    // LIFE-CYCLE CALLBACKS:

    onLoad () {
        this.ndWelcome.active = true;
        this.ndTopViewMask.active = false;
        Utils.playEffect(SlotGameData.BUNDLE_NAME, "10108_base_enter");
        this.ndWelcomeAni.getComponent(MySpine).playAni(0, false, () => {
            this.ndWelcomeAni.getComponent(MySpine).playAni(1, false, () => {
                this.ndWelcomeAni.getComponent(MySpine).playAni(2, false, () => {
                    this.ndWelcome.active = false;
                });
            });
        });
        this.playKuangAni(0);
        this.playZuanAni(0);
        this.updateScoreList();
        SlotGameData.addDynamicLoadViewData(Diamond777Data.NICE_WIN_VIEW, {
            ndParent: this.ndNiceWin,
            viewScript: 'Diamond777NiceWin',
        });
        SlotGameData.addDynamicLoadViewData(Diamond777Data.BIG_WIN_VIEW, {
            ndParent: this.ndTopView,
            ndMask: this.ndTopViewMask,
            viewScript: 'Diamond777BigWin',
        });
    }

    start () {
        
    }

    // update (dt) {}

    updateScoreList () {
        let curBetNum = SlotGameData.getCurBetScore();
        for (let i = 0; i < this.ndScores.children.length; i++) {
            let score = curBetNum * Diamond777Data.ITEM_REWARD_CONFIG[i];
            this.ndScores.children[i].getComponent(Label).string = Utils.floatToFormat(score, 2, true, true, false);
        }
    }

    playKuangAni (index: number, callback: Function = null) {
        this.ndKuangAni.getComponent(MySpine).playAni(index, callback ? false : true, callback);
    }

    pauseKuangAni () {
        this.ndKuangAni.getComponent(MySpine).pauseAni();
    }

    getKuangAniDuration (index: number) {
        return this.ndKuangAni.getComponent(MySpine).getAniDuration(index);
    }

    playZuanAni (index: number) {
        this.ndZuanAni.getComponent(MySpine).playAni(index, true);
    }

    playRewardAni () {
        
    }

    onSlotStart () {
        this.resetView();
    }

    onSlotEnd () {
        if (Diamond777Data.curRollServerData.winScore > 0) {
            let mapInfo = Diamond777Data.curRollServerData.mapInfo;
            let rewardLineList =  Diamond777Data.curRollServerData.rewardLineInfo;
            for (let lineIndex = 0; lineIndex < rewardLineList.length; lineIndex++) {
                let lineList = rewardLineList[lineIndex].list;
                let rewardList = [];
                for (let i = 0; i < lineList.length; i++) {
                    rewardList.push(mapInfo[`${lineList[i].col}_${lineList[i].row}`].type);
                }
                let isSameThree = true;
                let exitRewardType = 0;
                for (let i = 1; i < rewardList.length; i++) {
                    let type = rewardList[i];
                    if (type > 0 && type < 6) {
                        exitRewardType = type;
                        break;
                    }
                }
                if (exitRewardType > 0) {
                    for (let i = 0; i < rewardList.length; i++) {
                        let type = rewardList[i];
                        if (type < 6 && type != exitRewardType) {
                            isSameThree = false;
                            break;
                        }
                    }
                } else {
                    isSameThree = false;
                }
                if (isSameThree) {
                    let rewardIndex = exitRewardType-1;
                    if (!this.iconAniList[rewardIndex]) {
                        this.iconAniList[rewardIndex] = {
                            list: [],
                            cbReset: () => {
                                let ndIconAni = this.ndRewardAniList[rewardIndex];
                                (ndIconAni.children[0].children[0].getComponent(Sprite) as Sprite).spriteFrame = this.spfItemIconList[rewardIndex];
                                (ndIconAni.children[1].children[0].getComponent(Sprite) as Sprite).spriteFrame = this.spfItemIconList[rewardIndex];
                                (ndIconAni.children[2].children[0].getComponent(Sprite) as Sprite).spriteFrame = this.spfItemIconList[rewardIndex];
                            }
                        };
                    }
                    let iconTypeList: number[] = [];
                    for (let i = 0; i < lineList.length; i++) {
                        let type = rewardList[i];
                        if (type == 0) {
                            type = exitRewardType;
                        }
                        iconTypeList.push(type);
                    }
                    this.iconAniList[rewardIndex].list.push(iconTypeList);
                    this.ndScoreAniList.push(this.ndScores.children[exitRewardType-1]);
                } else if (exitRewardType > 0) {
                    if (rewardList[0] >= 4 && rewardList[1] >= 4 && rewardList[2] >= 4) {
                        let rewardIndex = 5;
                        if (!this.iconAniList[rewardIndex]) {
                            this.iconAniList[rewardIndex] = {
                                list: [],
                                cbReset: () => {
                                    let ndIconAni = this.ndRewardAniList[rewardIndex];
                                    (ndIconAni.children[0].children[0].getComponent(Sprite) as Sprite).spriteFrame = this.spfItemIconList[3];
                                    (ndIconAni.children[1].children[0].getComponent(Sprite) as Sprite).spriteFrame = this.spfItemIconList[4];
                                    ndIconAni.children[0].active = true;
                                    ndIconAni.children[1].active = true;
                                    ndIconAni.children[2].active = false;
                                }
                            };
                        }
                        let iconTypeList: number[] = [];
                        for (let i = 0; i < lineList.length; i++) {
                            let type = rewardList[i];
                            iconTypeList.push(type);
                        }
                        this.iconAniList[rewardIndex].list.push(iconTypeList);
                        this.ndScoreAniList.push(this.ndScores.children[5]);
                    } else if ((rewardList[0] >= 6 || (rewardList[0] > 0 && rewardList[0] <= 3)) && 
                            (rewardList[1] >= 6 || (rewardList[1] > 0 && rewardList[1] <= 3)) && 
                            (rewardList[2] >= 6 || (rewardList[2] > 0 && rewardList[2] <= 3))) {
                        let rewardIndex = 6;
                        if (!this.iconAniList[rewardIndex]) {
                            this.iconAniList[rewardIndex] = {
                                list: [],
                                cbReset: () => {
                                    let ndIconAni = this.ndRewardAniList[rewardIndex];
                                    (ndIconAni.children[0].children[0].getComponent(Sprite) as Sprite).spriteFrame = this.spfItemIconList[2];
                                    (ndIconAni.children[1].children[0].getComponent(Sprite) as Sprite).spriteFrame = this.spfItemIconList[1];
                                    (ndIconAni.children[2].children[0].getComponent(Sprite) as Sprite).spriteFrame = this.spfItemIconList[0];
                                }
                            };
                        }
                        let iconTypeList: number[] = [];
                        for (let i = 0; i < lineList.length; i++) {
                            let type = rewardList[i];
                            iconTypeList.push(type);
                        }
                        this.iconAniList[rewardIndex].list.push(iconTypeList);
                        this.ndScoreAniList.push(this.ndScores.children[6]);
                    }
                }
            }
            if (Object.keys(this.iconAniList).length > 0) {
                let cbLoadIconList = (rewardIndex: number, index: number) => {
                    let iconAniData = this.iconAniList[rewardIndex];
                    let iconList = iconAniData.list[index];
                    for (let i = 0; i < iconList.length; i++) {
                        let type = iconList[i];
                        let ndIcon = this.ndRewardAniList[rewardIndex].children[i];
                        ndIcon.active = type > 0;
                        if (type > 0) {
                            (ndIcon.children[0].getComponent(Sprite) as Sprite).spriteFrame = this.spfItemIconList[type-1];
                        }
                    }
                };
                for (const key in this.iconAniList) {
                    if (Object.prototype.hasOwnProperty.call(this.iconAniList, key)) {
                        let rewardIndex = parseInt(key);
                        let iconAniData = this.iconAniList[key];
                        if (iconAniData.list.length > 0) {
                            let aniIndex = 0;
                            cbLoadIconList(rewardIndex, aniIndex);
                            let ndIconAni = this.ndRewardAniList[rewardIndex];
                            Tween.stopAllByTarget(ndIconAni);
                            tween(ndIconAni)
                                .to(0.3, { scale: new Vec3(1.2, 1.2, 1.2) })
                                .to(0.6, { scale: new Vec3(1, 1, 1) })
                                .call(() => {
                                    if (iconAniData.list.length > 1) {
                                        if (aniIndex < iconAniData.list.length-1) {
                                            aniIndex ++;
                                        } else {
                                            aniIndex = 0;
                                        }
                                        cbLoadIconList(rewardIndex, aniIndex);
                                    }
                                })
                                .delay(0.3)
                                .union()
                                .repeatForever()
                                .start();
                        }
                    }
                }
            }
            this.ndScoreAniList.forEach(element => {
                Tween.stopAllByTarget(element);
                tween(element)
                    .to(0.3, { scale: new Vec3(1.2, 1.2, 1.2) })
                    .to(0.6, { scale: new Vec3(1, 1, 1) })
                    .delay(0.3)
                    .union()
                    .repeatForever()
                    .start();
            });
        }
    }

    onStopSpin () {
        this.resetView();
        this.isResetView = false;
    }

    playRespinWinAni () {
        let scaleTmp = this.ndMain.scale;
        tween(this.ndMain)
            .parallel(
                tween()
                    .to(0.05, { x: -5 })
                    .to(0.05, { x: 5 })
                    .union()
                    .repeat(18)
                    .to(0.05, { x: 0 }),
                tween()
                    .to(2, { scale: new Vec3(scaleTmp.x * 1.2, scaleTmp.y * 1.2, scaleTmp.z * 1.2) })
            )
            .to(1, { scale: scaleTmp })
            .start();
    }

    resetView () {
        if (this.isResetView) {
            return;
        }
        this.isResetView = true;
        this.ndScoreAniList.forEach(element => {
            Tween.stopAllByTarget(element);
            element.scale = new Vec3(1, 1, 1);
        });
        this.ndScoreAniList = [];
        this.ndRewardAniList.forEach(element => {
            Tween.stopAllByTarget(element);
            element.scale = new Vec3(1, 1, 1);
        });
        if (Object.keys(this.iconAniList).length > 0) {
            for (const key in this.iconAniList) {
                if (Object.prototype.hasOwnProperty.call(this.iconAniList, key)) {
                    let iconAniData = this.iconAniList[key];
                    if (iconAniData.cbReset) {
                        iconAniData.cbReset();
                    }
                }
            }
        }
        this.iconAniList = {};
    }

}
