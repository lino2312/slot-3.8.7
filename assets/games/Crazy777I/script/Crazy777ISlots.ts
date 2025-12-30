// import { _decorator, instantiate, Node } from 'cc';
import { _decorator, instantiate, Node, Prefab, UIOpacity, UITransform, Vec3 } from 'cc';
import { App } from 'db://assets/scripts/App';
import { RollNumber } from 'db://assets/scripts/game/tsFrameCommon/Base/RollNumber';
import BaseComponent from '../../../scripts/game/tsFrameCommon/Base/BaseComponent';
import { BezierCurveAnimation } from "../../../scripts/game/tsFrameCommon/Base/BezierCurveAnimation";
import MySpine from "../../../scripts/game/tsFrameCommon/Base/MySpine";
import Utils from "../../../scripts/game/tsFrameCommon/Base/MyUtils";
import { PoolMng } from "../../../scripts/game/tsFrameCommon/Base/PoolMng";
import { RollingLottery } from "../../../scripts/game/tsFrameCommon/Base/RollingLottery";
import SlotGameData, { SlotMapInfo, SlotSpinMsgData, SlotStatus } from "../../../scripts/game/tsFrameCommon/Slot/SlotsGameData";
import Crazy777IData from './Crazy777IData';
import Crazy777IGame from "./Crazy777IGame";
import Crazy777IItemAni from './Crazy777IItemAni';
const { ccclass, property } = _decorator;
@ccclass('Crazy777ISlots')
export default class Crazy777ISlots extends BaseComponent {
    @property(Node)
    ndSlotBtnAni: Node | null = null;
    @property([Node])
    ndRollList: Node[] = [];
    @property(Node)
    ndTopAni: Node | null = null;
    @property(Node)
    ndWinScore: Node | null = null;
    targetIndexNList: number[] = [];
    isRollListLoaded = false;
    rollListLoadedNum = 0;
    isWaitRoll = false;
    isWaitRollReady = false;
    isStopRoll = false;
    rollingNum = 0;
    rollEndList: boolean[] = [];
    rollItemList: Node[][] = [];
    //    // 滚动符号列表数据
    itemDataList: { [index: string]: { type: number, isLoaded: boolean, ndItemAni?: Node } } = {};
    isSpecialIconList = false;
    specialIconAudioNum = 0;
    isWinBeiAni = false;
    //    // LIFE-CYCLE CALLBACKS:
    onLoad() {
        for (let i = 0; i < Crazy777IData.ITEM_NUM; i++) {
            PoolMng.newNodePool(SlotGameData.BUNDLE_NAME + '_item_' + (i + 1), SlotGameData.BUNDLE_NAME, 'prefab/items/' + (i + 1));
            PoolMng.newNodePool(SlotGameData.BUNDLE_NAME + '_item_ani_' + (i + 1), SlotGameData.BUNDLE_NAME, 'prefab/ani/item_' + (i + 1));
        }
        this.playSlotAni(0);
        SlotGameData.clickSpinAudio = "2";
    }
    onDestroy() {

    }
    start() {

    }
    //    // update (dt) {}
    onClickEvent(event, data: string) {
        switch (data) {
            case 'slot':
                this.onClickSlotBtn();
                break;
            default:
                break;
        }
    }
    onClickSlotBtn() {
        SlotGameData.scriptBottom.onClickSpin();
    }
    onInitMapInfo(mapInfo: SlotMapInfo) {
        // 初始化列表数据
        for (const index in mapInfo) {
            if (Object.prototype.hasOwnProperty.call(mapInfo, index)) {
                const element = mapInfo[index];
                if (element) {
                    this.itemDataList[index] = {
                        type: element.type,
                        isLoaded: false,
                    }
                }
            }
        }
        this.initRollList();
    }
    onWaitSpinMsg() {
        this.resetView();
        //移除上一轮符号动画 add by peter
        for (const key in this.itemDataList) {
            const itemData = this.itemDataList[key];
            if (itemData.ndItemAni) {
                let scriptItemAni = itemData.ndItemAni.getComponent(Crazy777IItemAni);
                if (itemData.type != scriptItemAni.type) {
                    PoolMng.putNodePool(SlotGameData.BUNDLE_NAME + '_item_ani_' + scriptItemAni.type, itemData.ndItemAni);
                    itemData.ndItemAni = null;
                }
            }
        }
        this.isWaitRoll = true;
        SlotGameData.curRollingIndex++;
        let rollCount = SlotGameData.isRespinMode ? Crazy777IData.COL_NUM - 1 : Crazy777IData.COL_NUM;
        for (let i = 0; i < rollCount; i++) {
            let ndRollItem = this.ndRollList[i].children[0];
            if (ndRollItem) {
                let scriptRoll = ndRollItem.getComponent(RollingLottery);
                let gapTime = 0;
                switch (SlotGameData.curSpeedIndex) {
                    case 0:
                        gapTime = 0;
                        break;
                    case 1:
                        gapTime = 0;
                        break;
                    default:
                        break;
                }
                this.setTimeout(() => {
                    scriptRoll.loop(2500);
                }, gapTime * i);
            }
        }
        (SlotGameData.scriptGame as Crazy777IGame).onSlotStart();
        this.playSlotAni(1);
    }
    onStartSpin(data: SlotSpinMsgData) {
        Crazy777IData.curRollServerData = data;
        SlotGameData.scriptBottom.showBtnsByState(SlotStatus.moveing_2);
        this.startRoll();
    }
    onStopSpin() {
        if (this.isStopRoll) {
            return;
        }
        if (!Crazy777IData.curRollServerData || Crazy777IData.curRollServerData.winScore > 0) {
            return;
        }
        let rollCount = SlotGameData.isRespinMode ? Crazy777IData.COL_NUM - 1 : Crazy777IData.COL_NUM;
        if (this.rollingNum < rollCount) {
            return;
        }
        this.isStopRoll = true;
        console.log('onStopSpin');
        let rollNum = 0;
        for (let i = 0; i < rollCount; i++) {
            let ndRollItem = this.ndRollList[i].children[0];
            if (ndRollItem && !this.rollEndList[i]) {
                rollNum++;
                let scriptRoll = ndRollItem.getComponent(RollingLottery);
                scriptRoll.stop();
                scriptRoll.jump(this.targetIndexNList[i]);
                this.targetIndexNList[i] -= scriptRoll.getItemNum();
                let animationTime = 0.1;
                switch (SlotGameData.curSpeedIndex) {
                    case 0:
                        animationTime = 0.1 * i;
                        break;
                    case 1:
                        animationTime = 0.05 * i;
                        break;
                    default:
                        break;
                }
                ndRollItem.getComponent(BezierCurveAnimation).setAnimationTime(animationTime);
                scriptRoll.move(this.targetIndexNList[i], {
                    tweenIndexNS: [0],
                });
            }
        }
        if (rollNum == 0) {
            this.skipSlot();
        }
    }
    initRollList() {
        let funLoadFinished = () => {
            if (this.rollListLoadedNum < Crazy777IData.COL_NUM * Crazy777IData.ROW_NUM) {
                this.rollListLoadedNum++;
                if (this.rollListLoadedNum == Crazy777IData.COL_NUM * Crazy777IData.ROW_NUM) {
                    if (!this.isRollListLoaded) {
                        this.setTimeout(() => {
                            this.isRollListLoaded = true;
                            if (this.isWaitRollReady) {
                                this.isWaitRollReady = false;
                                this.startRoll();
                            }
                        }, 500);
                    }
                }
            }
        };
        for (let i = 0; i < this.ndRollList.length; i++) {
            let ndRollItem = this.ndRollList[i].children[0];
            if (ndRollItem) {
                let scriptRoll = ndRollItem.getComponent(RollingLottery);
                scriptRoll.eventItemUpdate = (node_: Node, indexN_: number) => {
                    let targetIndexN = this.targetIndexNList[i];
                    if (!this.isWaitRoll && indexN_ >= targetIndexN - 2 && indexN_ <= targetIndexN + 2) {
                        let rowIndex = indexN_ - (targetIndexN - 2);
                        this.updateRollItem(i, rowIndex, node_, () => {
                            funLoadFinished();
                            if (this.isRollListLoaded) {
                                if (SlotGameData.isRespinMode) {
                                    if (i < Crazy777IData.COL_NUM - 1 && indexN_ == targetIndexN + 2) {
                                        Utils.playEffect(SlotGameData.BUNDLE_NAME, 'end_4_respin');
                                        this.setTimeout(() => {
                                            Utils.playEffect(SlotGameData.BUNDLE_NAME, 'reel_end_win');
                                        }, 300);
                                    }
                                } else if (i == Crazy777IData.COL_NUM - 1) {
                                    Utils.playEffect(SlotGameData.BUNDLE_NAME, 'reel_end_lose', () => {
                                        if (rowIndex == 2) {
                                            let mapInfo = Crazy777IData.curRollServerData.mapInfo;
                                            let audioName;
                                            let specialReward = mapInfo[`${Crazy777IData.COL_NUM - 1}_${2}`].type;
                                            if (specialReward > 0) {
                                                switch (specialReward) {
                                                    case 6:
                                                        audioName = 'end_4_2x';
                                                        break;
                                                    case 7:
                                                        audioName = 'end_4_5x';
                                                        break;
                                                    case 8:
                                                        audioName = 'end_4_10x';
                                                        break;
                                                    case 9:
                                                        audioName = 'end_4_ss+';
                                                        break;
                                                    case 10:
                                                        audioName = 'end_4_ssx';
                                                        break;
                                                    case 11:
                                                        audioName = 'end_4_respin';
                                                        break;
                                                    default:
                                                        break;
                                                }
                                            }
                                            if (audioName) {
                                                this.setTimeout(() => {
                                                    Utils.playEffect(SlotGameData.BUNDLE_NAME, audioName);
                                                }, 200);
                                            }
                                        }
                                    });
                                }
                            }
                        });
                    } else {
                        let type = 0;
                        if (this.isSpecialIconList) {
                            switch (indexN_ - targetIndexN) {
                                case 15:
                                    type = 9;
                                    break;
                                case 16:
                                    type = 10;
                                    break;
                                case 17:
                                    type = 11;
                                    break;
                                default:
                                    break;
                            }
                            if (this.specialIconAudioNum < 2) {
                                setTimeout(() => {
                                    Utils.playEffect(SlotGameData.BUNDLE_NAME, 'endrow1win');
                                }, 100 * this.specialIconAudioNum);
                                this.specialIconAudioNum++;
                            }
                        }
                        if (!type) {
                            let isBlank = Math.random() > 0.5;
                            if (!isBlank) {
                                let startIndex = 1;
                                let itemCount = Crazy777IData.ITEM_NORMAL_NUM;
                                if (i == Crazy777IData.COL_NUM - 1) {
                                    startIndex = Crazy777IData.ITEM_NORMAL_NUM + 1;
                                    itemCount == Crazy777IData.SPECIAL_ITEM_NUM;
                                }
                                type = Math.floor(Math.random() * itemCount) + startIndex;
                            }
                        }
                        this.updateItem(node_, type);
                    }
                }
                scriptRoll.eventScrollEnd = () => {
                    SlotGameData.scriptBottom.onSlotEnd();
                    this.rollEndList[i] = true;
                    this.updateRollEnd(i);
                }
                this.targetIndexNList.push(scriptRoll.firstIndexN);
                this.rollEndList.push(false);
                let itemList = [];
                for (let j = 0; j < Crazy777IData.ROW_NUM; j++) {
                    let index = `${i}_${j}`;
                    itemList.push(this.itemDataList[index].type);
                }
                scriptRoll.initList(i, itemList, () => { // 列表加载完成

                }, (row: number, node: Node) => { // 符号加载完成
                    if (this.rollItemList[i] == null) {
                        this.rollItemList[i] = [];
                    }
                    this.rollItemList[i][row] = node;
                }, (row: number) => { // 符号位置发生变动回调
                    let index = `${i}_${row}`;
                    if (this.itemDataList[index] && this.rollItemList[i]) {
                        let item = this.rollItemList[i][row];
                        if (item) {
                            let ndItemAni = this.itemDataList[index].ndItemAni;
                            if (ndItemAni) {
                                // let worldPos = item.convertToWorldSpaceAR(v3());
                                // ndItemAni.position = this.ndTopAni.convertToNodeSpaceAR(worldPos);
                                const worldPos = item.getWorldPosition(new Vec3());
                                const localPos = this.ndTopAni.getComponent(UITransform)!.convertToNodeSpaceAR(worldPos);
                                ndItemAni.setPosition(localPos);

                            }
                        }
                    }
                });
            }
        }
    }

    playSfx(name: string, callback?: Function) {
        App.AudioManager.playSfx("audio/", name, callback);
    }

    updateRollItem(col: number, row: number, node: Node, callback: Function) {
        let index = `${col}_${row}`;
        let itemData = this.itemDataList[index];
        let funLoadFinished = () => {
            if (callback) {
                callback();
            }
        }
        if (!itemData.isLoaded) {
            itemData.isLoaded = true;
            // 移除上一轮符号动画
            if (itemData.ndItemAni) {
                let scriptItemAni = itemData.ndItemAni.getComponent(Crazy777IItemAni);
                if (itemData.type != scriptItemAni.type) {
                    PoolMng.putNodePool(SlotGameData.BUNDLE_NAME + '_item_ani_' + scriptItemAni.type, itemData.ndItemAni);
                    itemData.ndItemAni = null;
                } else {
                    scriptItemAni.index = index;
                }
            }
            this.updateItem(node, itemData.type, funLoadFinished);
        } else {
            funLoadFinished();
        }
    }
    updateRollEnd(rollIndex: number, callback: Function = null) {
        this.rollingNum--;
        if (this.rollingNum == 0) {
            if (this.isStopRoll) {
                this.skipSlot();
            } else {
                (SlotGameData.scriptGame as Crazy777IGame).onSlotEnd();
                if (Crazy777IData.curRollServerData.winScore > 0) {
                    SlotGameData.scriptBottom.showBtnsByState(SlotStatus.waitSpin);
                } else {
                    SlotGameData.scriptBottom.showBtnsByState(SlotStatus.stoped);
                }
                let curRollingIndexTmp = SlotGameData.curRollingIndex;
                let cbDoNextRound = () => {
                    if (curRollingIndexTmp != SlotGameData.curRollingIndex) {
                        return;
                    }
                    SlotGameData.scriptBottom.canDoNextRound();
                };
                let cbNextRound = () => {
                    if (curRollingIndexTmp != SlotGameData.curRollingIndex) {
                        return;
                    }
                    if (SlotGameData.isRespinMode) {
                        if (SlotGameData.respinTimes < SlotGameData.totalRespinTimes) {
                            this.setTimeout(() => {
                                cbDoNextRound();
                            }, 500);
                        } else {
                            (SlotGameData.scriptGame as Crazy777IGame).ndWinScore.active = false;
                            (SlotGameData.scriptGame as Crazy777IGame).ndRespinEnd.active = true;
                            this.setTimeout(() => {
                                // Utils.playMusic(SlotGameData.BUNDLE_NAME, "bgm");
                                App.AudioManager.playBGM('audio/bgm')
                                cbDoNextRound();
                            }, 500);
                        }
                    } else {
                        if (SlotGameData.totalRespinTimes > 0) {
                            // Utils.playMusic(SlotGameData.BUNDLE_NAME, "bgm_respin");
                            Utils.playEffect(SlotGameData.BUNDLE_NAME, "join_respin_model");
                            App.AudioManager.playBGM('audio/bgm_respin')
                            this.setTimeout(() => {
                                (SlotGameData.scriptGame as Crazy777IGame).ndWinScore.active = false;
                                (SlotGameData.scriptGame as Crazy777IGame).ndRespinStart.active = true;
                                this.setTimeout(() => {
                                    cbDoNextRound();
                                }, 500);
                            }, 1500);
                        } else {
                            cbDoNextRound();
                        }
                    }
                };
                if (Crazy777IData.curRollServerData.winScore > 0) {
                    let specialCol = Crazy777IData.COL_NUM - 1;
                    let mapInfo = Crazy777IData.curRollServerData.mapInfo;
                    let colNum = SlotGameData.isRespinMode ? Crazy777IData.COL_NUM - 1 : Crazy777IData.COL_NUM;
                    let rewardRow = 2;
                    for (let col = 0; col < colNum; col++) {
                        let index = `${col}_${rewardRow}`;
                        let type = this.itemDataList[index].type;
                        if (type > 0) {
                            PoolMng.getNodePool(SlotGameData.BUNDLE_NAME + '_item_ani_' + type, (prefab: Prefab) => {
                                let ndItemAni = instantiate(prefab);
                                ndItemAni.parent = this.ndTopAni;
                                // let worldPos = this.rollItemList[col][rewardRow].convertToWorldSpaceAR(v3());
                                // let newPos = this.ndTopAni.convertToNodeSpaceAR(worldPos);
                                // ndItemAni.position = newPos;
                                const worldPos = this.rollItemList[col][rewardRow].getWorldPosition(new Vec3());
                                const localPos = this.ndTopAni.getComponent(UITransform)!.convertToNodeSpaceAR(worldPos);
                                ndItemAni!.setPosition(localPos);
                                ndItemAni.getComponent(Crazy777IItemAni).playAni(0, true);
                                this.itemDataList[index].ndItemAni = ndItemAni;
                            });
                        }
                    }
                    if (!SlotGameData.isRespinMode) {
                        let specialReward = mapInfo[`${specialCol}_${rewardRow}`].type;
                        if (specialReward > 0) {
                            let spcialIndex = specialReward - 6
                            if (!(SlotGameData.scriptGame as Crazy777IGame).ndSpecialIconList[spcialIndex].active) {
                                (SlotGameData.scriptGame as Crazy777IGame).ndSpecialIconList[spcialIndex].active = true
                            }
                        }
                    }
                    SlotGameData.scriptBottom.updateWinNum(SlotGameData.totalWinScore);
                    (SlotGameData.scriptGame as Crazy777IGame).ndWinScore.active = true;
                    (SlotGameData.scriptGame as Crazy777IGame).ndWinScore.getComponent(RollNumber).scrollTo(Crazy777IData.curRollServerData.winScore, () => {
                        this.setTimeout(() => {
                            (SlotGameData.scriptGame as Crazy777IGame).ndWinScore.active = false;
                        }, 1000);
                    });
                    let funStartAudio = () => {
                        let audioList = [];
                        let iconReward = 0;
                        if (!SlotGameData.isRespinMode) {
                            let reward0 = mapInfo[`${0}_${rewardRow}`].type;
                            let reward1 = mapInfo[`${1}_${rewardRow}`].type;
                            let reward2 = mapInfo[`${2}_${rewardRow}`].type;
                            if (reward0 == reward1 && reward1 == reward2) {
                                iconReward = reward0 - 1;
                            } else if (reward0 <= 3 && reward1 <= 3 && reward2 <= 3) {
                                iconReward = 5;
                            } else if (reward0 >= 4 && reward0 <= 5 && reward1 >= 4 && reward1 <= 5 && reward2 >= 4 && reward2 <= 5) {
                                iconReward = 6;
                            } else {
                                iconReward = 7;
                            }
                            if (iconReward <= 5) {
                                if (iconReward < 5) {
                                    audioList.push('win_3_xiangtong');
                                } else {
                                    audioList.push('win_7x7x7');
                                }
                            }
                        }
                        if (Crazy777IData.curRollServerData.winScore < SlotGameData.getCurBetScore() * 6) {
                            if (SlotGameData.isRespinMode || iconReward > 5) {
                                audioList.push('respin_end_reward');
                            }
                        } else if (Crazy777IData.curRollServerData.winScore <= SlotGameData.getCurBetScore() * 13) {
                            audioList.push('win_coin_x20');
                        } else {
                            audioList.push('win_coin_x10');
                        }
                        let index = 0;
                        for (let i = 0; i < audioList.length; i++) {
                            Utils.playEffect(SlotGameData.BUNDLE_NAME, audioList[i], () => {
                                index++;
                                if (index == audioList.length) {
                                    cbNextRound();
                                }
                            });
                        }
                    };
                    if (this.isWinBeiAni) {
                        Utils.playEffect(SlotGameData.BUNDLE_NAME, 'win_beilv2', () => {
                            funStartAudio();
                        });
                    } else {
                        funStartAudio();
                    }
                } else {
                    cbNextRound();
                }
            }
            if (callback) {
                callback();
            }
        }
    }
    updateItem(node: Node, type: number, callback: Function = null) {
        let funLoadFinished = () => {
            if (callback) {
                callback();
            }
        }
        let scriptRoll = node.parent.getComponent(RollingLottery);
        scriptRoll.initItem(node, type, () => {
            funLoadFinished();
        });
        // node.opacity = 255;
        let opacityComp = node.getComponent(UIOpacity);
        if (!opacityComp) {
            opacityComp = node.addComponent(UIOpacity);
            console.log(`UIOpacity component added to node: ${node.name}`);
        }
        opacityComp.opacity = 255;
    }
    startRoll() {
        this.isStopRoll = false;
        this.isWinBeiAni = false;
        this.isSpecialIconList = false;
        this.specialIconAudioNum = 0;
        this.isWaitRoll = false;
        let itemDataListTemp = this.itemDataList;
        this.itemDataList = {};
        this.rollListLoadedNum = 0;
        let mapInfo = Crazy777IData.curRollServerData.mapInfo;
        for (const index in mapInfo) {
            if (Object.prototype.hasOwnProperty.call(mapInfo, index)) {
                const element = mapInfo[index];
                if (element) {
                    this.itemDataList[index] = {
                        type: element.type,
                        isLoaded: false
                    }
                    if (itemDataListTemp[index]) {
                        this.itemDataList[index].ndItemAni = itemDataListTemp[index].ndItemAni;
                    }
                }
            }
        }
        let rollCount = SlotGameData.isRespinMode ? Crazy777IData.COL_NUM - 1 : Crazy777IData.COL_NUM;
        for (let i = 0; i < rollCount; i++) {
            let ndRollItem = this.ndRollList[i].children[0];
            if (ndRollItem) {
                this.rollingNum++;
                this.rollEndList[i] = false;
                let animationTime = 1;
                let tweenIndex = 0;
                switch (SlotGameData.curSpeedIndex) {
                    case 0:
                        if (SlotGameData.isRespinMode) {
                            animationTime = 0.5 + 0.5 * i;
                        } else {
                            animationTime = 0.5 + 0.1 * i;
                        }
                        break;
                    case 1:
                        if (SlotGameData.isRespinMode) {
                            animationTime = 0.3 + 0.3 * i;
                        } else {
                            animationTime = 0.3 + 0.05 * i;
                        }
                        break;
                    default:
                        break;
                }
                let scriptRoll = ndRollItem.getComponent(RollingLottery);
                if (i == Crazy777IData.COL_NUM - 1) {
                    if (Crazy777IData.curRollServerData.winScore > 0) {
                        let specialReward = mapInfo[`${Crazy777IData.COL_NUM - 1}_${2}`].type;
                        switch (specialReward) {
                            case 6:
                            case 7:
                            case 8:
                                this.isWinBeiAni = Math.random() < 0.5;
                                break;
                            default:
                                break;
                        }
                    }
                    if (this.isWinBeiAni) {
                        this.targetIndexNList[i] -= scriptRoll.getItemNum() * 1;
                        animationTime *= 1.5;
                        tweenIndex = 1;
                    } else {
                        this.isSpecialIconList = Math.random() <= 0.2;
                        if (this.isSpecialIconList) {
                            this.targetIndexNList[i] -= scriptRoll.getItemNum() * 3;
                            animationTime *= 2;
                        } else {
                            this.targetIndexNList[i] -= scriptRoll.getItemNum() * 1;
                        }
                    }
                }
                scriptRoll.stop();
                let targetLastIndexN = this.targetIndexNList[i];
                let loopNum = Math.ceil((targetLastIndexN - scriptRoll.currIndexN) / scriptRoll.getItemNum());
                this.targetIndexNList[i] = targetLastIndexN - scriptRoll.getItemNum() * loopNum - scriptRoll.getItemNum() * 5;
                ndRollItem.getComponent(BezierCurveAnimation).setAnimationTime(animationTime, tweenIndex);
                scriptRoll.move(this.targetIndexNList[i], {
                    tweenIndexNS: [tweenIndex],
                });
            }
        }
    }
    skipSlot() {
        Utils.stopAllEffect();
        this.closeAllTimeout();
        (SlotGameData.scriptGame as Crazy777IGame).closeAllTimeout();
        this.resetView();
        this.setTimeout(() => {
            if (SlotGameData.totalAutoTimes != 0 || SlotGameData.totalRespinTimes > 0) {
                SlotGameData.scriptBottom.canDoNextRound();
            } else {
                SlotGameData.scriptBottom.readyNextRound();
            }
        }, 10);
    }
    playSlotAni(index: number) {
        let spine = this.ndSlotBtnAni.getComponent(MySpine);
        spine.playAni(index, false);
    }
    resetView() {
        (SlotGameData.scriptGame as Crazy777IGame).onStopSpin();
    }
}


