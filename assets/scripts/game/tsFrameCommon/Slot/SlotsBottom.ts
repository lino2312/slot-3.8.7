import { _decorator, Button, EditBox, instantiate, Label, Node, Prefab, resources } from 'cc';
import { App } from '../../../App';
import BaseComponent from "../Base/BaseComponent";
import EventDispatcher from "../Base/EventDispatcher";
import Utils from "../Base/MyUtils";
import { RollNumber } from "../Base/RollNumber";
import SlotsBetTips from "./SlotsBetTips";
import SlotGameData, { SlotStatus } from "./SlotsGameData";
import SlotsSpinOptions from "./SlotsSpinOptions";
const { ccclass, property } = _decorator;

@ccclass
export default class SlotsBottom extends BaseComponent {

    @property(Node)
    ndWinNum: Node = null;

    @property(Node)
    ndNormalMode: Node = null;

    @property(Node)
    ndAddBetBtn: Node = null;

    @property(Node)
    ndMinusBetBtn: Node = null;

    @property(Node)
    ndSpeedBtn: Node = null;

    @property(Node)
    ndNormalBetNum: Node = null;

    @property(Node)
    ndSpeedNum: Node = null;

    @property(Node)
    ndFreeMode: Node = null;

    @property(Node)
    ndFreeBetNum: Node = null;

    @property(Node)
    ndFreeTimes: Node = null;

    @property(Node)
    ndSpinBtn: Node = null;

    @property(Node)
    ndSpinBtnAni: Node = null;

    @property(Node)
    ndAutoBtn: Node = null;

    @property(Node)
    ndStopBtn: Node = null;

    @property(Node)
    ndAutoTimes: Node = null;

    @property(Node)
    ndAutoInfiniteTimes: Node = null;

    @property(Node)
    ndAutoStopBtn: Node = null;

    @property(Node)
    ndBetTips: Node = null;

    @property(Label)
    lbTimes: Label = null;
    @property(EditBox)
    edTimes: EditBox = null;

    protected ndSpinOptions: Node = null;
    protected isWaitSpinOptions = false;
    protected MaxTimes = 10000;
    protected curTimes = 0;

    // LIFE-CYCLE CALLBACKS:

    needRefushFreeTime = false;

    onLoad() {
        EventDispatcher.getInstance().on(SlotGameData.BUNDLE_NAME + "_BetChange", this.onEventMsg_BetChange, this);

        this.showBtnsByState(SlotStatus.idle);
        this.updateSpeedNum();
        this.updateNormlModeBetCoin();
        this.updateWinNum(0);

        if (this.ndBetTips) {
            this.ndBetTips.active = false;
        }
        if (this.lbTimes) {
            this.lbTimes.string = this.MaxTimes.toString();
        }
    }

    onDestroy() {
        EventDispatcher.getInstance().off(SlotGameData.BUNDLE_NAME + "_BetChange", this.onEventMsg_BetChange, this);
    }

    start() {

    }

    // update (dt) {}

    onEventMsg_BetChange() {
        this.updateNormlModeBetCoin();
    }

    onClickEvent(event, data: string) {
        switch (data) {
            case 'spin':
                SlotGameData.isTest = false;
                this.onClickSpin();
                break;
            case 'auto':
                SlotGameData.isTest = false;
                this.onClickAuto();
                break;
            case 'stop':
                this.onClickStop();
                break;
            case 'auto_stop':
                this.onClickStopAuto();
                break;
            case 'add':
                this.onClickAddBet();
                break;
            case 'minus':
                this.onClickMinusBet();
                break;
            case 'speed':
                this.onClickSpeed();
                break;
            case 'spinTest':
                SlotGameData.isTest = true;
                this.onClickSpinTest();
                break;
            default:
                break;
        }
    }

    //播放押注变化的音效
    onPlayBetAudio() {
        let idx = SlotGameData.curBetIndex + 1
        let maxLen = SlotGameData.curBetList.length
        let filename = "bet" + idx
        if (idx == maxLen) {
            filename = "global_max_bet"
        }
        Utils.playSlotsCommonEffect('bet/' + filename)
    }

    //如果信息有效就直接发送了
    onEditboxDidEnd() {
        this.MaxTimes = Number(this.edTimes.string);
        this.lbTimes.string = this.edTimes.string;
    }

    //点击旋转--测试专用接口
    onClickSpinTest() {
        console.log("开始请求测试:次数:", this.edTimes.string);
        this.MaxTimes = Number(this.edTimes.string);
        this.curTimes = 0;
        this.schedule(this.doOneSpin, 0.05);
    }

    //点击旋转
    onClickSpin() {
        if (SlotGameData.clickSpinAudio) {
            Utils.playEffect(SlotGameData.BUNDLE_NAME, SlotGameData.clickSpinAudio);
        }
        if (!SlotGameData.isSlotReady) {
            if (SlotGameData.slotState >= SlotStatus.moveing_2 && SlotGameData.slotState <= SlotStatus.stoped) {
                if (SlotGameData.isSlotSpinBtnShowByWin) {
                    this.showBtnsByState(SlotStatus.skipSpin);
                } else {
                    this.showBtnsByState(SlotStatus.waitSpin);
                }
                EventDispatcher.getInstance().emit(SlotGameData.BUNDLE_NAME + "_StopSpin");
            } else if (SlotGameData.slotState == SlotStatus.skipSpin) {
                this.showBtnsByState(SlotStatus.waitSpin);
                EventDispatcher.getInstance().emit(SlotGameData.BUNDLE_NAME + "_SkipSpin");
            }
            return;
        }

        this.doOneSpin();
    }

    //点击停止
    onClickStop() {
        if (SlotGameData.slotState >= SlotStatus.moveing_2 && SlotGameData.slotState <= SlotStatus.stoped) {
            EventDispatcher.getInstance().emit(SlotGameData.BUNDLE_NAME + "_StopSpin");
            if (SlotGameData.isSlotSpinBtnShowByWin) {
                this.showBtnsByState(SlotStatus.skipSpin);
            } else {
                this.showBtnsByState(SlotStatus.waitSpin);
            }
        }
    }

    //btn auto
    onClickAuto() {
        Utils.playSlotsCommonEffect('slot_show_autoselect');
        if (this.isWaitSpinOptions) {
            return;
        }
        this.isWaitSpinOptions = true;
        let funOpenSpinOptions = () => {
            this.isWaitSpinOptions = false;
            let script = this.ndSpinOptions.getComponent(SlotsSpinOptions);
            script.init(() => {
                this.ndSpinOptions.active = false;
            }, () => {
                this.updateSpeedNum();
            }, () => {
                SlotGameData.isAutoMode = true;
                SlotGameData.autoTimes++;
                this.updateAutoTimeLabel();
                this.doOneSpin();
            });
        };
        if (this.ndSpinOptions) {
            this.ndSpinOptions.active = true;
            funOpenSpinOptions();
        } else {
            resources.load("Ts_frame_common/prefab/SpinOptions", Prefab, (err, prefab) => {
                if (err) {
                    return;
                }
                this.ndSpinOptions = instantiate(prefab);
                this.ndSpinOptions.parent = this.node.parent;
                funOpenSpinOptions();
            })
        }
    }

    //点击停止自动
    onClickStopAuto() {
        this.showAutoModel(false)
        this.showBtnsByState(SlotGameData.slotState);
    }

    //点击加注
    onClickAddBet() {
        if (SlotGameData.curBetIndex >= SlotGameData.curBetList.length - 1) {
            return
        }
        SlotGameData.curBetIndex++

        //通知押注额修改
        this.onPlayBetAudio()
        EventDispatcher.getInstance().emit(SlotGameData.BUNDLE_NAME + "_BetChange");
        this.showBetProTip()
        this.updateNormlModeBetCoin();
    }

    //点击减注
    onClickMinusBet() {
        if (SlotGameData.curBetIndex == 0) {
            return
        }
        SlotGameData.curBetIndex--

        //通知押注额修改
        this.onPlayBetAudio()
        EventDispatcher.getInstance().emit(SlotGameData.BUNDLE_NAME + "_BetChange");
        this.showBetProTip()
        this.updateNormlModeBetCoin();
    }

    onClickSpeed() {
        if (SlotGameData.curSpeedIndex < SlotGameData.curSpeedList.length - 1) {
            SlotGameData.curSpeedIndex += 1;
        } else {
            SlotGameData.curSpeedIndex = 0;
        }
        this.updateSpeedNum();
        Utils.playSlotsCommonEffect('common_click');
    }

    //发送旋转请求，并转轴转起来
    sendSpinReq() {
        console.log('sendSpinReq');
        SlotGameData.isSlotReady = false;
        let betIdx = SlotGameData.curBetIndex + 1;
        SlotGameData.scriptMsgMgr.reqSpinMsg(betIdx, null, SlotGameData.buyDouble);
        if (!SlotGameData.IS_SINGLE_MODLE) {
            // cc.vv.gameData.setCanExitGame(SlotGameData.isSlotReady);
            // cc.vv.gameData.setShowResultFinish(false);
            App.SubGameManager?.getSlotGameDataScript?.()?.setCanExitGame?.(SlotGameData.isSlotReady);
            App.SubGameManager?.getSlotGameDataScript?.()?.setShowResultFinish?.(false);
        }
        if (this.needRefushFreeTime) {
            //更新免费次数显示
            this.needRefushFreeTime = false
            // 更新免费次数
            SlotGameData.freeTimes++;
            this.showFreeModel(true, SlotGameData.freeTimes, SlotGameData.totalFreeTimes)
        }

        this.showBetProTip(false)
        this.showSpinOptions(false)

        EventDispatcher.getInstance().emit(SlotGameData.BUNDLE_NAME + "_WaitSpinMsg");
    }

    //自动
    doAutoSpine() {
        if (SlotGameData.totalAutoTimes != 0) {
            this.doOneSpin()
        } else {
            this.canDoNextRound();
        }
    }

    //免费模式请求
    doFreeSpine() {
        if (SlotGameData.totalFreeTimes > 0) {
            if (SlotGameData.totalFreeTimes != SlotGameData.freeTimes) {
                //发起旋转请求
                this.sendSpinReq()
            }
        }
    }

    doOneSpin() {
        if (this.lbTimes) {
            this.curTimes++;
            this.lbTimes.string = (this.MaxTimes - this.curTimes).toString();
            if (this.curTimes > this.MaxTimes) {
                console.log("结束测试:次数:", this.MaxTimes)
                this.unschedule(this.doOneSpin);
            }
        }
        this.unschedule(this.doAutoSpine);
        this.unschedule(this.doFreeSpine);
        this.unschedule(this.sendSpinReq);

        //是否需要押注
        let bNeedBet = this.checkNeedBet()
        if (bNeedBet) {
            //需要
            let res = this.checkCoinEnough()
            if (res) {
                this.showBtnsByState(SlotStatus.moveing_1);
                //发送请求
                this.sendSpinReq()
            }
            else {
                SlotGameData.isSlotReady = true;
                if (!SlotGameData.IS_SINGLE_MODLE) {
                    // cc.vv.gameData.setCanExitGame(SlotGameData.isSlotReady);
                    App.SubGameManager?.getSlotGameDataScript?.()?.setCanExitGame?.(SlotGameData.isSlotReady);
                }
                this.showBtnsByState(SlotStatus.idle);

                //金币不足
                //停止自动模式
                this.onClickStopAuto()

                Utils.showToRechargeTip();
            }
        }
        else {
            this.showBtnsByState(SlotStatus.moveing_1);
            //不需要花费的
            //发送请求
            this.sendSpinReq()
        }
    }

    setBtnEnable(node: Node, bEnable: boolean) {
        if (node) {
            let btn = node.getComponent(Button)
            if (btn) {
                btn.interactable = bEnable
            }
        }
    }

    showBtnsByState(slotState: SlotStatus) {
        let isShowAutoStop = SlotGameData.isAutoMode;
        SlotGameData.slotState = slotState
        if (slotState == SlotStatus.idle) {
            this.ndSpinBtn.active = true
            this.ndSpinBtnAni.active = true
            this.ndStopBtn.active = false
            this.ndAutoStopBtn.active = false
            let bHasChange = this.checkBetsChange()
            this.setBtnEnable(this.ndSpinBtn, true)
            this.setBtnEnable(this.ndAutoBtn, true)
            this.setBtnEnable(this.ndAddBetBtn, true && bHasChange)
            this.setBtnEnable(this.ndMinusBetBtn, true && bHasChange)
            this.setBtnEnable(this.ndSpeedBtn, true)
        }
        else if (slotState == SlotStatus.moveing_1) {
            this.ndSpinBtn.active = !isShowAutoStop
            this.ndSpinBtnAni.active = false
            this.ndStopBtn.active = false
            this.ndAutoStopBtn.active = isShowAutoStop
            this.setBtnEnable(this.ndSpinBtn, false)
            this.setBtnEnable(this.ndAutoBtn, false)
            this.setBtnEnable(this.ndAutoStopBtn, true)
            this.setBtnEnable(this.ndAddBetBtn, false)
            this.setBtnEnable(this.ndMinusBetBtn, false)
            this.setBtnEnable(this.ndSpeedBtn, false)
        }
        else if (slotState == SlotStatus.moveing_2) {
            this.ndSpinBtn.active = false
            this.ndSpinBtnAni.active = false
            this.ndStopBtn.active = !isShowAutoStop
            this.ndAutoStopBtn.active = isShowAutoStop
            this.setBtnEnable(this.ndStopBtn, true)
            this.setBtnEnable(this.ndAutoStopBtn, true)
            this.setBtnEnable(this.ndAddBetBtn, false)
            this.setBtnEnable(this.ndMinusBetBtn, false)
            this.setBtnEnable(this.ndSpeedBtn, true)
        }
        else if (slotState == SlotStatus.stoped) {
            this.ndSpinBtn.active = false
            this.ndSpinBtnAni.active = false
            this.ndStopBtn.active = !isShowAutoStop
            this.ndAutoStopBtn.active = isShowAutoStop
            this.setBtnEnable(this.ndStopBtn, true)
            this.setBtnEnable(this.ndAutoStopBtn, true)
            this.setBtnEnable(this.ndAddBetBtn, false)
            this.setBtnEnable(this.ndMinusBetBtn, false)
            this.setBtnEnable(this.ndSpeedBtn, true)
        }
        else if (slotState == SlotStatus.unstoped) {
            this.ndSpinBtn.active = false
            this.ndSpinBtnAni.active = false
            this.ndStopBtn.active = true
            this.ndAutoStopBtn.active = false
            this.setBtnEnable(this.ndStopBtn, false)
            this.setBtnEnable(this.ndAutoStopBtn, false)
            this.setBtnEnable(this.ndAddBetBtn, false)
            this.setBtnEnable(this.ndMinusBetBtn, false)
            this.setBtnEnable(this.ndSpeedBtn, true)
        } else if (slotState == SlotStatus.skipSpin) {
            this.ndSpinBtn.active = true
            this.ndSpinBtnAni.active = false
            this.ndStopBtn.active = false
            this.ndAutoStopBtn.active = false
            this.setBtnEnable(this.ndSpinBtn, true)
            this.setBtnEnable(this.ndAutoBtn, false)
            this.setBtnEnable(this.ndAddBetBtn, false)
            this.setBtnEnable(this.ndMinusBetBtn, false)
            this.setBtnEnable(this.ndSpeedBtn, true)
        } else if (slotState == SlotStatus.waitSpin) {
            this.ndSpinBtn.active = true
            this.ndSpinBtnAni.active = false
            this.ndStopBtn.active = false
            this.ndAutoStopBtn.active = false
            this.setBtnEnable(this.ndSpinBtn, false)
            this.setBtnEnable(this.ndAutoBtn, false)
            this.setBtnEnable(this.ndAddBetBtn, false)
            this.setBtnEnable(this.ndMinusBetBtn, false)
            this.setBtnEnable(this.ndSpeedBtn, true)
        }
    }

    //显示自动模式
    showAutoModel(isShow: boolean) {
        this.ndAutoStopBtn.active = isShow
        if (isShow) {
            this.updateAutoTimeLabel()
        } else {
            SlotGameData.totalAutoTimes = 0;
            SlotGameData.autoTimes = 0;
            SlotGameData.isAutoMode = false;
        }
    }

    //显示免费模式
    //bShow:true的时候，需要设置used,total, false的时候不需要
    //used:已经使用的免费次数，服务端就是记录已经使用过的
    //total:总的免费次数
    showFreeModel(isShow: boolean, used: number, total: number) {
        //设置免费模式状态
        SlotGameData.isFreeMode = isShow
        this.ndNormalMode.active = !isShow;
        if (this.ndFreeMode) {
            this.ndFreeMode.active = isShow
        }

        if (isShow) { //显示免费的时候才需要
            this.updateFreeModeBetCoin();
            this.updateFreeTime(total, used);
        } else {
            this.updateNormlModeBetCoin();
        }
    }

    onSlotEnd() {
        if (!SlotGameData.IS_SINGLE_MODLE) {
            // cc.vv.gameData.setShowResultFinish(true);
            App.SubGameManager.getSlotGameDataScript().setShowResultFinish(true);
        }
    }

    //可以进行下一轮
    canDoNextRound() {
        console.log('canDoNextRound');
        //是否有强制弹窗
        Utils.checkForsePoptips()
        //是否有免费游戏
        if (SlotGameData.totalFreeTimes > 0) {
            SlotGameData.isFreeInFreeMode = false;
            if (SlotGameData.freeTimes == SlotGameData.totalFreeTimes) {
                SlotGameData.totalFreeTimes = 0;
                SlotGameData.freeTimes = 0;
                SlotGameData.isFreeMode = false;
                this.needRefushFreeTime = false;
                this.showFreeModel(false, SlotGameData.freeTimes, SlotGameData.totalFreeTimes)
            } else {
                this.showBtnsByState(SlotStatus.moveing_1);
                // 这里只是打标记，需要更新免费次数。在SendSpinReq才刷新
                this.needRefushFreeTime = true
                SlotGameData.isFreeMode = true;
                this.scheduleOnce(this.doFreeSpine, SlotGameData.nextSpinDelayTime)
                return;
            }
        }

        //自定义旋转次数。不花费金币
        if (SlotGameData.totalRespinTimes > 0) {
            if (SlotGameData.respinTimes == SlotGameData.totalRespinTimes) {
                SlotGameData.totalRespinTimes = 0;
                SlotGameData.respinTimes = 0;
                SlotGameData.isRespinMode = false;
            } else {
                SlotGameData.isRespinMode = true;
                this.showBtnsByState(SlotStatus.moveing_1);
                this.scheduleOnce(this.sendSpinReq, SlotGameData.nextSpinDelayTime)
                return;
            }
        }

        if (SlotGameData.totalAutoTimes != 0) {
            if (SlotGameData.autoTimes == SlotGameData.totalAutoTimes) {
                SlotGameData.totalAutoTimes = 0;
                SlotGameData.autoTimes = 0;
                SlotGameData.isAutoMode = false;
            } else {
                if (SlotGameData.totalAutoTimes != SlotGameData.AUTO_INFINITE_TIMES) {
                    SlotGameData.autoTimes++;
                }
                this.updateAutoTimeLabel();
                this.showBtnsByState(SlotStatus.moveing_1);
                this.scheduleOnce(this.doAutoSpine, SlotGameData.nextSpinDelayTime);
                return
            }
        }

        this.readyNextRound();
    }

    readyNextRound() {
        console.warn('readyNextRound');
        SlotGameData.isSlotReady = true;
        if (!SlotGameData.IS_SINGLE_MODLE) {
            // cc.vv.gameData.setCanExitGame(SlotGameData.isSlotReady);
            App.SubGameManager?.getSlotGameDataScript?.()?.setCanExitGame?.(SlotGameData.isSlotReady);
        }
        this.showBtnsByState(SlotStatus.idle)
    }

    //是否需要扣押注
    //1 免费游戏也是不需要花费的
    //2 自定义的旋转模式也是不花费的
    checkNeedBet() {
        let bNeed = true
        //是否是自定义旋转模式
        if (SlotGameData.totalRespinTimes > 0) {
            bNeed = false
        }
        //是否是免费模式
        if (SlotGameData.isFreeMode) {
            bNeed = false
        }
        return bNeed
    }

    //检查押注额是否足够
    checkCoinEnough() {
        let nTotalCoin = SlotGameData.playerInfo.score
        let nTotalBet = SlotGameData.getCurBetScore()
        if (nTotalBet <= nTotalCoin) {
            return true //足够
        }
        else {
            return false //不够
        }
    }

    //是否有可以切换的押注档位
    checkBetsChange() {
        //只有一个档位就没必要切换了
        let nLen = SlotGameData.curBetList.length
        return nLen > 1
    }

    //是否能显示自动选择
    isCanShowAutoSelect() {
        let btnEnable
        if (this.ndSpinBtn.getComponent(Button)) {
            btnEnable = this.ndSpinBtn.getComponent(Button).interactable
        }
        if (btnEnable && !SlotGameData.isFreeMode) {
            return true
        }
        return false
    }

    showBetProTip(isShow = true) {
        if (this.ndBetTips) {
            let scp = this.ndBetTips.getComponent(SlotsBetTips)
            if (scp) {
                if (isShow) {
                    this.ndBetTips.active = true

                    let curIdx = SlotGameData.curBetIndex
                    let nPer = (curIdx + 1) / SlotGameData.curBetList.length
                    scp.setBetPercent(nPer)
                }
                else {
                    scp.HideTips()
                }
            }
        }
    }

    //显示选择自动面板
    showSpinOptions(isShow: boolean) {

    }

    updateSpeedNum() {
        this.ndSpeedNum.getComponent(Label).string = SlotGameData.curSpeedList[SlotGameData.curSpeedIndex];
    }

    //更新自动模式的次数
    updateAutoTimeLabel() {
        let bShowInfinity = SlotGameData.totalAutoTimes == SlotGameData.AUTO_INFINITE_TIMES ? true : false
        this.ndAutoTimes.active = !bShowInfinity
        this.ndAutoInfiniteTimes.active = bShowInfinity
        if (!bShowInfinity) {
            this.ndAutoTimes.getComponent(Label).string = (SlotGameData.totalAutoTimes - SlotGameData.autoTimes).toString()
        }
    }

    updateNormlModeBetCoin() {
        if (SlotGameData.buyDouble) {
            this.ndNormalBetNum.getComponent(Label).string = Utils.floatToFormat(SlotGameData.getCurBetScore() * 1.5)
        } else {
            this.ndNormalBetNum.getComponent(Label).string = Utils.floatToFormat(SlotGameData.getCurBetScore())
        }
    }

    updateFreeModeBetCoin() {
        this.ndFreeBetNum.getComponent(Label).string = Utils.floatToFormat(SlotGameData.getCurBetScore())
    }

    updateFreeTime(total: number, used: number) {
        let showTimesStr = `${used} / ${total}`
        this.ndFreeTimes.getComponent(Label).string = showTimesStr
    }

    updateWinNum(winNum: number, callback: Function = null, isScroll = true, scrollTime = 0.5) {
        if (!SlotGameData.IS_SINGLE_MODLE) {
            SlotGameData.playerInfo.score = Utils.getMyScore();
            EventDispatcher.getInstance().emit(SlotGameData.BUNDLE_NAME + '_PlayerScoreChange');
        }
        let snWinNum = this.ndWinNum.getComponent(RollNumber);
        if (!snWinNum.getIsInit()) {
            snWinNum.init();
        }
        if (winNum > 0 && isScroll) {
            snWinNum.setScrollTime(scrollTime);
            snWinNum.scrollTo(winNum, callback);
        } else {
            snWinNum.reset(winNum);
        }
    }

    stopWinNum() {
        let snWinNum = this.ndWinNum.getComponent(RollNumber);
        snWinNum.stop();
    }

    getIsWinNumScrolling() {
        let snWinNum = this.ndWinNum.getComponent(RollNumber);
        return snWinNum.getIsScrolling();
    }

}
