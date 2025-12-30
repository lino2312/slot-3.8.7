import BaseComponent from "db://assets/scripts/game/tsFrameCommon/Base/BaseComponent";
import Utils from "db://assets/scripts/game/tsFrameCommon/Base/MyUtils";
import { BezierCurveAnimation } from "db://assets/scripts/game/tsFrameCommon/Base/BezierCurveAnimation";
import MySpine from "db://assets/scripts/game/tsFrameCommon/Base/MySpine";
import { PoolMng } from "db://assets/scripts/game/tsFrameCommon/Base/PoolMng";
import { RollingLottery } from "db://assets/scripts/game/tsFrameCommon/Base/RollingLottery";
import SlotGameData, { SlotMapInfo, SlotStatus } from "db://assets/scripts/game/tsFrameCommon/Slot/SlotsGameData";
import GemsFrotuneIIData, { GameMapInfo, ServerGemsFrotuneIIMsgData } from "db://assets/games/GemsFrotuneII/script/GemsFrotuneIIData";
import GemsFrotuneIIGame from "db://assets/games/GemsFrotuneII/script/GemsFrotuneIIGame";
import GemsFrotuneIIItemAni from "db://assets/games/GemsFrotuneII/script/GemsFrotuneIIItemAni";

import { Label, Node, Prefab, Sprite, SpriteFrame, Tween, UIOpacity, UITransform, Vec3, _decorator, instantiate, tween, v3 } from 'cc';
const { ccclass, property } = _decorator;

const turnNumber = [6, 3];
const baseTime = [1.2, 0.6];

@ccclass('GemsFrotuneIISlots')
export default class GemsFrotuneIISlots extends BaseComponent {

    @property([Node])
    ndRollList: Node[] = [];

    @property(Node)
    ndTopAni: Node = null;

    @property(Node)
    ndExtraMultipleStart: Node = null;    

    @property(Node)
    ndMultipleKuangAni: Node = null;
    
    @property(Node)
    ndWinLabel: Node = null;   
    @property(Node)
    ndMask: Node = null;   
    @property(Node)
    ndSpicalKuanAni: Node = null;
    @property(Node)
    ndBetAni: Node = null;
    @property(Node)
    wheelAin: Node = null;
    @property(Node)
    wheelNode: Node = null;
    @property(Node)
    stopWheelTopNode: Node = null;

    @property(SpriteFrame)
    betSpriteFrameList: SpriteFrame[] = [];

    targetIndexNList: number[] = [];
    isRollListLoaded = false;
    rollListLoadedNum = 0;
    isWaitRoll = false;
    isWaitRollReady = false;
    isResetView = false;
    rollingNum = 0;
    rollItemList: Node[][] = [];
    // 滚动符号列表数据
    itemDataList: { [index: string]: { type: number, isLoaded: boolean, ndItemAni?: Node } } = {};

    spineItemList: { index: string, type: number, item: Node }[] = [];
    wheelScore = [1, 3, 5, 8, 10, 15, 20, 30, 50, 100, 200, 1000];
    data: ServerGemsFrotuneIIMsgData;

    speedEffID = 0;
    isStopRoll = false;
    rollEndList: boolean[] = [];
    isStopRollWheel = false;
    rollEffID = 0;

    // LIFE-CYCLE CALLBACKS:

    onLoad () {
        this.ndMultipleKuangAni.active = false;
        for (let i = 0; i < GemsFrotuneIIData.ITEM_NUM; i++) {
            PoolMng.newNodePool(SlotGameData.BUNDLE_NAME+'_item_'+(i+1), SlotGameData.BUNDLE_NAME, 'prefab/items/'+(i+1));
            PoolMng.newNodePool(SlotGameData.BUNDLE_NAME+'_item_ani_'+(i+1), SlotGameData.BUNDLE_NAME, 'prefab/ani/item_'+(i+1));
        }
        this.updateWheelView();
    }

    start () {
        this.rotataWheel();
        // this.scheduleOnce(()=>{
        //     this.showWheel(true,0);
        // },5)
    }

    // update (dt) {}

    onClickEvent (event, data: string) {
        switch (data) {
            case 'slot':
                this.onClickSlotBtn();
                break;
            default:
                break;
        }
    }

    onClickSlotBtn () {
        SlotGameData.scriptBottom.onClickSpin();
    }

    onInitMapInfo (mapInfo: SlotMapInfo) {
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

    onStartSpin(data: ServerGemsFrotuneIIMsgData) {
        if (this.isStopRollWheel) {
            this.stopTopAni();
            this.rotataWheel();
        }
        SlotGameData.scriptBottom.showBtnsByState(SlotStatus.moveing_2);
        GemsFrotuneIIData.curRollServerData = data;
        this.data = data;
        this.startRoll();
    }

    initRollList() {
        for (let i = 0; i < this.ndRollList.length; i++) {
            let ndRollItem = this.ndRollList[i].children[0];
            if (ndRollItem) {
                let scriptRoll = ndRollItem.getComponent(RollingLottery);
                scriptRoll.eventItemUpdate = (node_: Node, indexN_: number) => {
                    let targetIndexN = this.targetIndexNList[i];
                    if (indexN_ >= targetIndexN - 3 && indexN_ <= targetIndexN + 3) {
                        let rowIndex = indexN_ - (targetIndexN - 3);
                        let index = `${i}_${rowIndex}`;
                        let itemData = this.itemDataList[index];
                        if (itemData) {
                            scriptRoll.initItem(node_, itemData.type);
                        } else {
                            let randomIndex = this.getRandomType(i);
                            scriptRoll.initItem(node_, randomIndex);
                        }
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
                for (let j = 0; j < GemsFrotuneIIData.ROW_NUM; j++) {
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

                });
            }
        }
    }

    updateRollEnd(rollIndex: number, callback: Function = null) {
        this.rollingNum--;
        if (this.rollingNum == 0) {
            SlotGameData.scriptBottom.showBtnsByState(SlotStatus.stoped);
            (SlotGameData.scriptGame as GemsFrotuneIIGame).onSlotEnd();
            Utils.playEffect(SlotGameData.BUNDLE_NAME, 'reel_stop');
            this.updateResultView();
        } else {
            if (SlotGameData.curSpeedIndex == 0) {
                Utils.playEffect(SlotGameData.BUNDLE_NAME, 'reel_stop');
            }
            let nextRow = GemsFrotuneIIData.COL_NUM - this.rollingNum; //准备结束旋转的列
            this.showSpecialIcon(() => {
                Utils.playEffect(SlotGameData.BUNDLE_NAME, 'showwildcion');
            }, false, nextRow - 1);
        }
    }

    updateResultView() {
        if (!this.data || !this.data.dataList) {
            // 数据未准备好，跳过
            SlotGameData.scriptBottom.canDoNextRound();
            return;
        }
        if (this.data.dataList.length > 0) {
            this.ndMask.active = true;
            for (let i = 0; i < this.data.dataList.length; i++) {
                if (i == 0) {
                    this.showLine(false, this.data.dataList[i], true);
                } else {
                    this.showLine(false, this.data.dataList[i], false);
                }
            }
            if (this.data.stopIndex >= 0) {
                Utils.playEffect(SlotGameData.BUNDLE_NAME, 'Scatter');
                (SlotGameData.scriptGame as GemsFrotuneIIGame).showWinCoin2(this.data.lWin, 1);
            } else {
                (SlotGameData.scriptGame as GemsFrotuneIIGame).showWinCoin(Utils.preciseRound(this.data.winScore / this.data.betNum), 1);
            }
        } else if (this.data.stopIndex >= 0) {
            this.ndMask.active = true;
            let line: GameMapInfo = {
                lines: {
                    lineIndex: 0,// 连线id
                    spIcon: [],
                    win: 0,//这条线赢了多少
                }
            }
            this.showLine(false, line, true);
            (SlotGameData.scriptGame as GemsFrotuneIIGame).showWinCoin2(this.data.lWin, 1);
        }
        else {
            SlotGameData.scriptBottom.canDoNextRound();
        }
    }

    initGame() {
        this.spineItemList = [];
        this.ndMask.active = false;
        this.ndSpicalKuanAni.getComponent(UIOpacity).opacity = 0;
        this.initIcon();
        let count = this.ndTopAni.children.length;
        for (let i = 0; i < count; i++) {
            let node = this.ndTopAni.children[0];
            let name = node.name.replace(/[^\d]/g, "");
            PoolMng.putNodePool(SlotGameData.BUNDLE_NAME  + '_item_ani_' + name, node);
        }
    }

    initIcon() {
        this.spineItemList.forEach((data)=>{
            data.item.active = false;
        });
        for (let i = 0; i < this.rollItemList.length; i++) {
            for (let j = 0; j < this.rollItemList[i].length; j++) {
                if (this.data && this.data.mapInfo[`${i}_${j}`].type != 0) {
                    let iconItem = this.rollItemList[i][j];
                    iconItem.active = true; //显示所有图标
                };
            }
        }
    }

    onWaitSpinMsg() {
        this.initGame();
        this.resetView();
        this.isWaitRoll = true;
        SlotGameData.curRollingIndex++;
        let rollCount = GemsFrotuneIIData.COL_NUM;
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
        (SlotGameData.scriptGame as GemsFrotuneIIGame).onSlotStart();
        Utils.playEffect(SlotGameData.BUNDLE_NAME, 'click');
    }

    startRoll() {
        this.setResultIcon();
        this.isStopRoll = false;
        let itemDataListTemp = this.itemDataList;
        this.itemDataList = {};
        this.rollListLoadedNum = 0;
        let mapInfo = this.data.mapInfo;
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
        for (let i = 0; i < this.ndRollList.length; i++) {
            let ndItem = this.ndRollList[i];
            if (ndItem) {
                this.rollingNum++;
                this.rollEndList[i] = false;
                let scriptRoll = ndItem.children[0].getComponent(RollingLottery);  
                let scriptBezi = ndItem.children[0].getComponent(BezierCurveAnimation);
                scriptBezi.tweenUnitAS[0].controlPointV3S[1].y = 0.25;
                scriptBezi.tweenUnitAS[0].controlPointV3S[2].y = 1.06;
                if (SlotGameData.curSpeedIndex == 0) {
                    scriptBezi.setAnimationTime(baseTime[SlotGameData.curSpeedIndex]+ i * 0.2);
                    this.targetIndexNList[i] -= scriptRoll.getItemNum() * turnNumber[SlotGameData.curSpeedIndex];
                    scriptRoll.move(this.targetIndexNList[i], {
                        tweenIndexNS: [0],
                    });
                    scriptBezi.tweenUnitAS[0].controlPointV3S[2].y = 1;
                } else {
                    scriptBezi.setAnimationTime(baseTime[SlotGameData.curSpeedIndex]);
                    this.targetIndexNList[i] -= scriptRoll.getItemNum()*turnNumber[SlotGameData.curSpeedIndex];
                    scriptRoll.move(this.targetIndexNList[i], {
                        tweenIndexNS: [0],
                    });
                }
            }        
        }
        (SlotGameData.scriptGame as GemsFrotuneIIGame).onSlotStart();
    }


    /** 设置结果图标 */
    setResultIcon() {
        for (let i = 0; i < this.rollItemList.length; i++) {
            for (let j = 0; j < this.rollItemList[i].length; j++) {
                if (j > 1 && j < 5) {//生成视野内的图标spine
                    let iconItem = this.rollItemList[i][j];
                    let scriptRoll = iconItem.parent.getComponent(RollingLottery);
                    let type = this.data.mapInfo[`${i}_${j}`].type;
                    if (type != 0) {
                        PoolMng.getNodePool(SlotGameData.BUNDLE_NAME + '_item_ani_' + type, (spineNode: Node) => {//生成对应的spine
                            let ndItemAni = instantiate(spineNode);
                            ndItemAni.parent = this.ndTopAni;
                            ndItemAni.active = false;
                            this.spineItemList.push({ index: `${i}_${j}`, type: type, item: ndItemAni });
                        });
                    }
                }
            }
        }
    }

    /** 展示结果线 */
    showLine(isCloseAll: boolean, lineData: GameMapInfo, isShowBet: boolean) {
        if (isCloseAll) this.initIcon();
        if (isShowBet) {//是否展示倍率图标
            lineData.lines.spIcon.push("3_3")
            this.ndSpicalKuanAni.getComponent(UIOpacity).opacity = 255;
        }
        for (let i = 0; i < lineData.lines.spIcon.length; i++) {//隐藏图标
            let index = lineData.lines.spIcon[i];
            let spineData = this.spineItemList.find(a=>a.index == index)
            let ndItemAni = spineData.item;
            if (ndItemAni) {
                let col = parseInt(index[0]);
                let row = parseInt(index[index.length - 1]);
                let iconItem = this.rollItemList[col][row]
                iconItem.active = false;
                let worldPos = this.rollItemList[col][row].getComponent(UITransform).convertToWorldSpaceAR(v3());
                let newPos = this.ndTopAni.getComponent(UITransform).convertToNodeSpaceAR(worldPos);
                ndItemAni.position = newPos;
                ndItemAni.active = true
                let sc = ndItemAni.getComponent(GemsFrotuneIIItemAni);
                if (sc) {
                    sc.playAni(0,true);
                }
            }
        }
    }

    /**展示特别图标 */
    showSpecialIcon(callback?: Function,isShowAll: boolean = true, row: number = 0) {
        let aniIconList;
        if (isShowAll) {
            aniIconList = this.spineItemList.filter(a => a.type == 8);
        } else {
            aniIconList = this.spineItemList.filter(a => a.type == 8 && parseInt(a.index[0]) == row);
        }
        if (aniIconList.length > 0) {//有特殊图标就先让图标动
            if (callback) callback();
        }
    }

    /** 倍数开关动画 */
    playExtraMultiplesAni () {
        let isShowMultipleKuang = false;
        for (let i = 0; i < 3; i++) {
            let col = GemsFrotuneIIData.COL_NUM-1;
            let row = i+2;
            let startType = GemsFrotuneIIData.ITEM_WILD_TYPE+1;
            let itemCount = GemsFrotuneIIData.ITEM_MULTIPLE_NUM
            let type = Math.floor(Math.random()*itemCount)+startType;
            PoolMng.getNodePool(SlotGameData.BUNDLE_NAME+'_item_ani_'+type, (prefab: Prefab) => {
                let ndItemAni = instantiate(prefab);
                ndItemAni.parent = this.ndTopAni;
                let worldPos = this.ndExtraMultipleStart.getComponent(UITransform).convertToWorldSpaceAR(v3());
                let newPos = this.ndTopAni.getComponent(UITransform).convertToNodeSpaceAR(worldPos);
                ndItemAni.position = newPos;
                let firstPos = v3(newPos.x - 20, newPos.y + 30, 0);
                ndItemAni.getComponent(GemsFrotuneIIItemAni).playAni(0, false, () => {
                    worldPos = this.rollItemList[col][row].getComponent(UITransform).convertToWorldSpaceAR(v3());
                    newPos = this.ndTopAni.getComponent(UITransform).convertToNodeSpaceAR(worldPos);
                    tween(ndItemAni)
                        .delay(0.4 - (0.2 * i))
                        .to(0.2, { position: firstPos })
                        .to(0.5, { position: newPos })
                        .call(() => {
                            PoolMng.putNodePool(SlotGameData.BUNDLE_NAME + '_item_ani_' + type, ndItemAni);
                        })
                        .start();
                });
                if (!isShowMultipleKuang) {
                    isShowMultipleKuang = true;
                    this.ndMultipleKuangAni.active = true;
                    this.ndMultipleKuangAni.getComponent(MySpine).playAni(0, false, () => {
                        this.ndMultipleKuangAni.active = false;
                    }, () => {
                        // console.log('111');
                    });
                }
                // this.itemDataList[`${col}_${row}`].ndItemAni = ndItemAni;
            });
        }
    }

    /** 中间倍数动画 */
    playMultiplesFlyAni() {
        let type = GemsFrotuneIIData.curRollServerData.betType;
        PoolMng.getNodePool(SlotGameData.BUNDLE_NAME + '_item_ani_' + type, (prefab: Prefab) => {
            let ndItemAni = instantiate(prefab);
            ndItemAni.parent = this.ndBetAni;
            let worldPos = this.rollItemList[3][3].getComponent(UITransform).convertToWorldSpaceAR(v3());//3-3是中奖倍数
            let newPos = this.ndBetAni.getComponent(UITransform).convertToNodeSpaceAR(worldPos);
            ndItemAni.position = newPos;
            Utils.playEffect(SlotGameData.BUNDLE_NAME, 'betshow');
            ndItemAni.getComponent(GemsFrotuneIIItemAni).playAni(0, false, () => {
                worldPos = this.ndWinLabel.getComponent(UITransform).convertToWorldSpaceAR(v3());
                newPos = this.ndBetAni.getComponent(UITransform).convertToNodeSpaceAR(worldPos);
                Utils.playEffect(SlotGameData.BUNDLE_NAME, 'Fly');
                tween(ndItemAni)
                    .to(0.2, { position: newPos })
                    .call(() => {
                        PoolMng.putNodePool(SlotGameData.BUNDLE_NAME + '_item_ani_' + type, ndItemAni);
                        (SlotGameData.scriptGame as GemsFrotuneIIGame).showWinCoin(this.data.winScore, 2);
                    })
                    .start();
            });
        })
    }

    resetView () {
        if (this.isResetView) {
            return;
        }
        this.isResetView = true;
        this.ndMask.active = false;
        this.ndSpicalKuanAni.getComponent(UIOpacity).opacity = 0;
        (SlotGameData.scriptGame as GemsFrotuneIIGame).onStopSpin();
    }

    onStopSpin() {
        if (this.isStopRoll) {
            return;
        }
        this.isStopRoll = true;
        console.log('onStopSpin');
        let rollNum = 0;
        let rollCount = SlotGameData.isRespinMode ? GemsFrotuneIIData.COL_NUM - 1 : GemsFrotuneIIData.COL_NUM;
        for (let i = 0; i < rollCount; i++) {
            let ndRollItem = this.ndRollList[i].children[0];
            if (ndRollItem && !this.rollEndList[i]) {
                rollNum++;
                this.rollEndList[i] = false;
                let scriptRoll = ndRollItem.getComponent(RollingLottery);
                scriptRoll.stop();
                scriptRoll.jump(this.targetIndexNList[i]);
                this.targetIndexNList[i] -= scriptRoll.getItemNum();
                let animationTime = 0.1;
                switch (SlotGameData.curSpeedIndex) {
                    case 0:
                        animationTime = 0.1;
                        break;
                    case 1:
                        animationTime = 0.05;
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
    }

    rotataWheel() {
        this.isStopRollWheel = false;
        let rotate = tween(this.wheelAin)
            .to(10, { angle: -360 })
            .call(() => {
                this.wheelAin.angle = 0;
            })
            .start();
        tween(this.wheelAin)
            .repeatForever(rotate)
            .start();
    }

    updateWheelView() {
        for (let i = 0; i < this.wheelScore.length; i++) {
            let score = this.wheelScore[i] * SlotGameData.getCurBetScore();
            let lab = this.wheelAin.children[0].children[i].getComponentInChildren(Label);
            lab.string = Utils.numToFormatPt(score);
        }
    }

    showWheel(isShow,stopIndex = 0) {
        let wheelNode = this.wheelNode.getChildByName("wheelNode");
        let wheelNodeSpine = wheelNode.getComponent(MySpine);
        let WheelTopSpine = this.wheelNode.getChildByName("Wheel_Top").getComponent(MySpine);
        if (isShow) {
            for (let i = 0; i < this.wheelScore.length; i++) {
                let score = this.wheelScore[i] * SlotGameData.getCurBetScore();
                let lab = wheelNode.children[0].children[i].getComponentInChildren(Label);
                lab.string = Utils.numToFormatPt(score);
            }
            Utils.playMusic(SlotGameData.BUNDLE_NAME, "Wheel_BGM");
            tween(this.wheelAin.parent)
                .to(0.3, { scale: new Vec3(0.4, 0.4, 0.4) })
                .call(() => {
                    if (SlotGameData.buyDouble) {
                        Utils.playEffect(SlotGameData.BUNDLE_NAME, 'DoubleShow_Lv2');
                    }
                    this.wheelAin.getComponent(UIOpacity).opacity = 0
                    wheelNode.angle = 45;//===============旋转转盘弹出动画
                    this.wheelNode.active = true;
                    tween(wheelNode)
                        .to(1, { angle: 0 })
                        .start();
                    wheelNodeSpine.playAni(0, false, () => {
                        wheelNodeSpine.playAni(1, true, () => {
                            this.startRollWheel(stopIndex,this.data.betPosIndexs,this.data.betlists);//===============第一个数组是位置信息，第二个数组是位置信息
                        })
                    })
                    WheelTopSpine.playAni(0, false, () => {
                        WheelTopSpine.playAni(1, true);
                    })
                })
                .start();
        } else {
            WheelTopSpine.playAni(2, false);
            wheelNodeSpine.playAni(2, false, () => {
                for (let i = 0; i < this.wheelAin.children[0].children.length; i++) {
                    let item = this.wheelAin.children[0].children[i];
                    let AniItem = wheelNode.children[0].children[i];
                    item.getChildByName('Wheel').active = false;
                    item.getChildByName('betLabel').active = false;
                    AniItem.getChildByName('Wheel').active = false;
                    AniItem.getChildByName('betLabel').active = false;
                }
                this.wheelNode.active = false;
                wheelNode.angle = 0;
                this.isStopRollWheel = true;
                Tween.stopAllByTarget(this.wheelAin);
                this.wheelAin.angle = 30 * stopIndex;
                this.stopTopAni(true);
                Utils.playEffect(SlotGameData.BUNDLE_NAME, 'Wheel_end');
                (SlotGameData.scriptGame as GemsFrotuneIIGame).showWinCoin2(this.data.rWin, 2);//===============数据接入后打开
                tween(this.wheelAin.parent)
                    .call(() => {
                        Utils.playMusic(SlotGameData.BUNDLE_NAME, "base_bgm");
                        this.wheelAin.getComponent(UIOpacity).opacity = 255;
                    })
                    .to(0.3, { scale: new Vec3(1.2, 1.2, 1.2) })
                    .start();
            })
        }
    }

    startRollWheel(stopIndex, indexList = [], betList = []) {
        let roolAngle = -3600 + 30 * stopIndex;
        let wheelNode = this.wheelNode.getChildByName("wheelNode");
        let WheelTopSpine = this.wheelNode.getChildByName("Wheel_Top").getComponent(MySpine);
        for (let i = 0; i < this.wheelAin.children[0].children.length; i++) {
            let item = this.wheelAin.children[0].children[i];
            let AniItem = wheelNode.children[0].children[i];
            item.getChildByName('Wheel').active = false;
            item.getChildByName('betLabel').active = false;
            AniItem.getChildByName('Wheel').active = false;
            AniItem.getChildByName('betLabel').active = false;
        }
        if (indexList.length > 0) {//有倍数时
            for (let i = 0; i < indexList.length; i++) {
                let item = this.wheelAin.children[0].children[indexList[i]];
                let AniItem = wheelNode.children[0].children[indexList[i]];
                let itemWheel = item.getChildByName('Wheel');
                let itemBetLabel = item.getChildByName('betLabel').getComponent(Sprite);
                let AniItemWheel = AniItem.getChildByName('Wheel');
                let AniItemBetLabel = AniItem.getChildByName('betLabel').getComponent(Sprite);
                itemBetLabel.spriteFrame = this.betSpriteFrameList[betList[i]];
                AniItemBetLabel.spriteFrame = this.betSpriteFrameList[betList[i]];
                itemWheel.active = true;
                itemBetLabel.node.active = true;
                itemWheel.getComponent(MySpine).playAni(0, false);
                tween(AniItemBetLabel.node)
                    .delay(i * 0.5)
                    .call(() => {
                        Utils.playEffect(SlotGameData.BUNDLE_NAME, 'Wheel_Extra_UP');
                        AniItemWheel.active = true;
                        AniItemBetLabel.node.active = true;
                        AniItemBetLabel.node.scale = new Vec3(2, 2, 2);
                        AniItemWheel.getComponent(MySpine).playAni(0,false);
                    })
                    .to(0.4, { scale: new Vec3(1.2, 1.2, 1.2) })
                    .call(() => {
                        if (i == indexList.length - 1) {
                            WheelTopSpine.playAni(3, false, () => {
                                WheelTopSpine.playAni(1, false);
                                Utils.playEffect(SlotGameData.BUNDLE_NAME, 'Wheel_Rotate',null,(stopId)=>{
                                    this.rollEffID = stopId;
                                });
                                tween(wheelNode)
                                    .to(7, { angle: roolAngle }, { easing: "sineInOut" })
                                    .delay(0.2)
                                    .call(() => {
                                        Utils.stopEffect(this.rollEffID);
                                        Utils.playEffect(SlotGameData.BUNDLE_NAME, 'Wheel_end');
                                        this.showWheel(false, stopIndex);
                                    })
                                    .start();
                            })
                        }
                    })
                    .start();
            }
        } else {
            Utils.playEffect(SlotGameData.BUNDLE_NAME, 'Wheel_Rotate', null, (stopId) => {
                this.rollEffID = stopId;
            });
            WheelTopSpine.playAni(3, false, () => {
                WheelTopSpine.playAni(1, false);
                tween(wheelNode)
                    .to(7, { angle: roolAngle }, { easing: "sineInOut" })
                    .delay(0.2)
                    .call(() => {
                        Utils.stopEffect(this.rollEffID);
                        Utils.playEffect(SlotGameData.BUNDLE_NAME, 'Wheel_end');
                        this.showWheel(false, stopIndex);
                    })
                    .start();
            })
        }
    }

    stopTopAni(isWin:boolean = false){
        if(isWin){
            this.stopWheelTopNode.getComponent(MySpine).playAni(3,true);
        }else{
            this.stopWheelTopNode.getComponent(MySpine).playAni(0,true);
        }
    }

    getRandomType(col) {
        let num = Utils.getRandNum(1, 8);//sc符号不随机所以只到九
        if (col == 3) num = Utils.getRandNum(9, 14);
        return num;
    }

}

