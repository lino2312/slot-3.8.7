import { _decorator, Component, director, find, isValid, sp, tween } from 'cc';
import { App } from '../../App';
import { Config } from '../../config/Config';
import { SlotGameAssetBase } from './SlotGameAssetBase';
import { SlotGameBottomBase } from './SlotGameBottomBase';
import { SlotGameLogicBase } from './SlotGameLogicBase';
import { SlotGameTopBase } from './SlotGameTopBase';
const { ccclass, property } = _decorator;

@ccclass('SlotGameBaseData')
export class SlotGameBaseData extends Component {

    // 消息处理器ID管理（用于精确注销）
    protected readonly messageHandlerIds: Map<number, Symbol> = new Map();

    protected gameId: number = 0;   //游戏id
    protected deskInfo: any = null; //进入游戏的数据结构
    protected gameInfo: any = null; //旋转一轮的数据返回
    protected slotsScp: any = null; //slots的脚本
    protected assetScp: any = null; //资源管理脚本
    protected autoTime: number = 0;   //自动模式的次数
    protected respinTime: number = 0; //重复旋转次数
    protected topScp: SlotGameTopBase = null;   //top部分的脚本
    protected bottomScp: SlotGameBottomBase = null;    //bottom部分的脚本
    protected puzzleData: any = null;  // 拼图数据
    protected secBetVal: any = null;    //保存客户端移除的压住档位
    protected reqStartTime: number = 0;  //请求开始时间
    protected reqTotalTime: number = 0; //请求累计时间
    protected reqTotalCount: number = 0; //请求累计次数
    protected autoPlayTime: number = 5;   // 自动模式下跳过流程的时间
    public serverRawMult: number = 0;   // 服务器原始下注数据
    protected manualAutoPlayTime: number = 8; // 手动模式下跳过流程的时间
    protected bAutoGame: boolean = false;   //是否处于自动游戏（包括自动最后一局）
    protected newGameTipSpinCount: number = 0;    //推荐新游戏累计spin次数
    protected newGameTipID: number = 0;   //首次到达八级或者以上玩家处于的游戏ID
    protected isFirstPop: boolean = true;  //进入游戏首次弹弹窗
    protected canExitGame: boolean = true; //是否可以退出游戏
    protected gameJackpot: any = null; //奖池信息：{id:420, jp:[10,50,100,500], unlock:[10000,20000,50000,100000]}
    protected slotStateStr: any;
    protected isAllin: boolean = false; //是否是全压状态
    protected isReadyLeaveGame: boolean = false; //是否准备离开游戏
    public autoTotal: number = 0; //自动旋转总次数
    protected sendTimeInterval: number = 0; //发送请求时间间隔
    protected isReconnect: boolean = false; //是否是断线重连请求
    protected levelupData: any;
    protected expChangeData: any;
    protected reelIdx: any;
    protected ispuzzleModel: boolean = false; //是否是拼图模式
    protected pauseState = 0;
    othersysScp: any;
    protected allInBet: number = 0; //全压的押注额
    protected isResultFinish: boolean = false; //结果展示是否完成
    protected cfgData: any = null; //游戏配置数据


    start() {

    }

    protected onDestroy(): void {
        this.unRegisterMsg();
    }

    init(deskInfo: any, gameId: number, gameJackpot: any) {
        if (this.deskInfo) {
            return;
        }
        this.deskInfo = deskInfo
        // this.checkClientBet()

        //设置选中的档位
        this.serverRawMult = deskInfo.currmult;
        let selectBet = App.SubGameManager.getEnterSelectBet();
        if (selectBet) {
            if (!this.getFreeTime()) {
                for (let i = 0; i < deskInfo.mults.length; i++) {
                    if (deskInfo.mults[i] == selectBet) {
                        this.setBetIdx(i + 1)
                        break
                    }
                }
            }
        } else if (App.SubGameManager.getEnterMaxBet()) {
            App.SubGameManager.setEnterMaxBet(null)
            if (!this.getFreeTime()) {
                this.setBetIdx(deskInfo.mults.length)
            }
        }

        this.gameId = gameId
        this.gameJackpot = gameJackpot;
        this.clearLevelupData();
        this.registerMsg();
    }

    registerMsg() {
        // 使用现代化的消息注册API，存储处理器ID用于精确注销

        // 退出房间
        const exitRoomId = App.NetManager.on(App.MessageID.GAME_LEVELROOM, (msg) => {
            this.onRcvNetExitRoom(msg);
        });
        this.messageHandlerIds.set(App.MessageID.GAME_LEVELROOM, exitRoomId);

        // 旋转一次  
        const slotStartId = App.NetManager.on(App.MessageID.SLOT_START, (msg) => {
            this.onRcvNetSpine(msg);
        });
        this.messageHandlerIds.set(App.MessageID.SLOT_START, slotStartId);

        // 子游戏操作（高优先级）
        const subGameId = App.NetManager.on(App.MessageID.SLOT_SUBGAME_DATA, (msg) => {
            this.onRcvNetSubAction(msg);
        }, { priority: 'high' });
        this.messageHandlerIds.set(App.MessageID.SLOT_SUBGAME_DATA, subGameId);

        // 监听等级提升
        const levelUpId = App.NetManager.on(App.MessageID.PULL_LEVEL_UP_EXP, (msg) => {
            this.onRecvLevelupExp(msg);
        });
        this.messageHandlerIds.set(App.MessageID.PULL_LEVEL_UP_EXP, levelUpId);

        // 监听等级exp变化
        const changeExpId = App.NetManager.on(App.MessageID.PULL_CHANGE_EXP, (msg) => {
            this.onRecvChangeExp(msg);
        });
        this.messageHandlerIds.set(App.MessageID.PULL_CHANGE_EXP, changeExpId);

        // 财富改变（金币改变）
        const moneyChangedId = App.NetManager.on(App.MessageID.MONEY_CHANGED, (msg) => {
            this.onRcvNetMoneyChanged(msg);
        });
        this.messageHandlerIds.set(App.MessageID.MONEY_CHANGED, moneyChangedId);

        // 主动同步金币（金币改变）
        const syncCoinId = App.NetManager.on(App.MessageID.SYNC_COIN, (msg) => {
            this.onRcvNetMoneyChanged(msg);
        });
        this.messageHandlerIds.set(App.MessageID.SYNC_COIN, syncCoinId);

        // 主动同步引导任务
        const guideTaskId = App.NetManager.on(App.MessageID.PULL_GUIDETASK_UPDATEINFO, (msg) => {
            this.onRcvNetUpdateGuideTask(msg);
        });
        this.messageHandlerIds.set(App.MessageID.PULL_GUIDETASK_UPDATEINFO, guideTaskId);

        // 重连桌子信息
        const reconnectId = App.NetManager.on(App.MessageID.GAME_RECONNECT_DESKINFO, (msg) => {
            this.onRecvNetReconnectDeskinfo(msg);
        });
        this.messageHandlerIds.set(App.MessageID.GAME_RECONNECT_DESKINFO, reconnectId);
    }

    unRegisterMsg() {
        // 使用存储的处理器ID进行精确注销
        for (const [msgId, handlerId] of this.messageHandlerIds) {
            App.NetManager.off(msgId, handlerId);
        }

        // 清空处理器ID映射
        this.messageHandlerIds.clear();
    }

    //获取房间信息
    getDeskInfo() {
        return this.deskInfo
    }

    getGameInfo() {
        return this.gameInfo;
    }

    //获取奖池信息
    getGameJackpot() {
        return this.gameJackpot;
    }

    setTopScript(scp: SlotGameTopBase) {
        this.topScp = scp;
    }

    setBottomScript(scp: SlotGameBottomBase) {
        this.bottomScp = scp;
    }

    getTopScript(): SlotGameTopBase {
        return this.topScp;
    }

    getBottomScript(): SlotGameBottomBase {
        return this.bottomScp;
    }

    setSlotsScript(scp: any) {
        this.slotsScp = scp;
    }

    getSlotsScript() {
        return this.slotsScp;
    }

    setAssetScript(scp: SlotGameAssetBase) {
        this.assetScp = scp;
    }

    getAssetScript(): SlotGameAssetBase {
        return this.assetScp;
    }

    //获取assetbase中的预制
    getPrefabByName(name: string) {
        return this.assetScp.getPrefabByName(name);
    }

    //获取图集
    getAtlasByName(name) {
        return this.assetScp.getAtlasByName(name);
    }

    //获取spriteframe
    getSpriteFrameByName(name) {
        return this.assetScp.getSpriteByName(name);
    }

    getFontByName(name) {
        return this.assetScp.getFontByName(name);
    }

    //获取当前游戏id
    getGameId() {
        return this.gameId;
    }

    setGameCfg(cfg: any) {
        this.cfgData = cfg;
    }

    //获取游戏配置:就是配置了symbols的文件 一般命名 ***_Cfg.js
    getGameCfg() {
        return this.cfgData;
    }

    //记录slot的状态
    setSlotState(stateStr) {
        this.slotStateStr = stateStr
    }

    getSlotState() {
        return this.slotStateStr || 'idle'
    }

    //设置自己拥有的金币
    //设置后，自己需要在合适的时机刷新金币显示
    setCoins(val, bRefresh = false) {
        this.deskInfo.user.coin = val
        App.userData().coin = val
        if (bRefresh) {
            this.refushMyCoin();
        }
    }

    //获取我的金币
    getCoin() {
        return this.deskInfo.user.coin;
    }

    //增减金币
    addCoin(nVal, bRefresh = false) {
        let nCoin = this.getCoin();
        this.setCoins(nCoin + nVal, bRefresh);
    }

    //刷新金币显示
    refushMyCoin() {
        this.topScp.showCoin();
    }

    //获取我的押注额
    getTotalBet() {
        if (this.isAllin) {
            return this.allInBet;
        }
        //因为客户端是从0开始，所以-1
        let betIdx = this.getBetIdx();
        return this.deskInfo.mults[betIdx - 1];
    }

    //获取押注序号
    getBetIdx() {
        return this.deskInfo.currmult;
    }

    //将押注额度转换成押注等级
    //押注等级是从1开始，和服务端保持一致
    betToIdx(betNum) {
        let lv = 0;
        for (let i = 0; i < this.deskInfo.mults.length; i++) {
            if (this.deskInfo.mults[i] >= betNum) {
                lv = i
                break
            }
        }
        return lv + 1;
    }

    /**
     * 
     * @param {*} idx 1开始
     * @returns 
     */
    idxToBet(idx) {
        return this.deskInfo.mults[idx - 1];
    }

    //设置押注序号
    // 1开始
    setBetIdx(val) {
        this.deskInfo.currmult = val
        this.serverRawMult = val;
        App.SubGameManager.setEnterSelectBet(null);
    }

    //改变押注
    //badd:true 正向，反之负向
    changeBetIdx(isAdd) {

        let betMaxIdx = this.getBetMaxIdx();
        let betMinIdx = this.getBetMinIdx();

        if (isAdd) {
            this.deskInfo.currmult += 1
            if (this.deskInfo.currmult > betMaxIdx) {
                this.deskInfo.currmult = betMinIdx
            }
        }
        else {
            this.deskInfo.currmult -= 1
            if (this.deskInfo.currmult < betMinIdx) {
                this.deskInfo.currmult = betMaxIdx
            }
        }
        this.serverRawMult = this.deskInfo.currmult;
        App.SubGameManager.setEnterSelectBet(null);
    }

    getBetMinIdx() {
        let betMinIdx = 1;
        if (this.deskInfo.betRange) {
            betMinIdx = this.deskInfo.betRange[0];
        }
        return betMinIdx
    }

    getBetMaxIdx() {
        let mutllist = this.getBetMults();
        let betMaxIdx = mutllist.length;

        if (this.deskInfo.betRange) {
            betMaxIdx = this.deskInfo.betRange[1];

        }
        return betMaxIdx
    }

    //当前场次最大押注额
    getMaxBetVal() {
        let idx = this.getBetMaxIdx();
        return this.deskInfo.mults[idx - 1];
    }

    //押注列表
    getBetMults() {
        return this.deskInfo.mults;
    }

    //当前是否是最大押注额
    isMaxBet() {
        let betIdx = this.getBetIdx()
        let maxIdx = this.getBetMaxIdx()

        return betIdx == maxIdx
    }
    //当前是否是最小押注额
    isMinBet() {
        let betIdx = this.getBetIdx()
        let minIdx = this.getBetMinIdx()

        return betIdx == minIdx
    }

    //3级前客户端只显示第一个档位。服务端会发2个，
    //如果已经选择了最高档位就不删除了，因为3级就不出现加注引导
    checkClientBet() {
        let lv = App.GameManager.getCurLv();

        if (lv < 3 && this.deskInfo.mults.length == 2) {
            this.secBetVal = this.deskInfo.mults.pop();
        }
    }

    //本轮旋转赢钱
    getGameWin() {
        return this.gameInfo.wincoin;
    }

    //自动模式的次数
    getAutoModelTime() {
        return this.autoTime;
    }
    setAutoModelTime(val) {
        this.autoTime = (val > 0 ? val : 0);
    }

    isAutoGame() {
        return this.bAutoGame
    }

    setAutoGame(bAuto) {
        this.bAutoGame = bAuto
    }

    //重复旋转respin次数
    getRespinTime() {
        return this.respinTime;
    }
    setRespinTime(val) {
        this.respinTime = (val > 0 ? val : 0);
    }

    //获取剩余免费次数
    getFreeTime() {
        return this.deskInfo.restFreeCount
    }
    setFreeTime(val) {
        this.deskInfo.restFreeCount = val
    }

    //获取total free
    getTotalFree() {
        return this.deskInfo.allFreeCount
    }
    setTotalFree(val) {
        return this.deskInfo.allFreeCount = val
    }

    //免费游戏总共赢钱.断线重连免费赢钱
    getTotalFreeWin() {
        return this.deskInfo.freeWinCoin;
    }

    //免费游戏总共赢钱.当前局数免费赢钱
    getGameTotalFreeWin() {
        return this.gameInfo.freeWinCoin;
    }

    //获取100次旋转送卡包活动信息
    getSpinePackFloat() {
        return this.deskInfo.spinInfo;
    }
    setSpinePackFloat(val) {
        this.deskInfo.spinInfo = val;
    }

    //增加免费次数，并刷新显示
    addTotalFreeTime(add) {
        let old = this.getTotalFree();
        let rest = this.getFreeTime();
        let newTotalNum = old + add;
        let newRestNum = rest + add;
        this.setTotalFree(newTotalNum);
        this.setFreeTime(newRestNum);
        this.bottomScp.updateFreeTime(newTotalNum, newTotalNum - newRestNum);
    }

    //播放公共音效
    //path目录：slots_common/SlotRes/audio(默认)
    //如果自己传了path则使用传人的
    playCommAudio(path) {
        if (!path) {
            path = "audio/"
        }
        App.AudioManager.playSfx(path);
    }


    //清理一轮游戏的数据
    //每次旋转开始的时候清理
    ClearOneRoundData() {

    }

    //检查奖池是否解锁
    // return true 锁住的，反之
    isPrizePoolLock(prizeType) {
        let res = true
        let jpData = this.getGameJackpot()
        if (jpData) {
            let lockNum = jpData.unlock ? jpData.unlock[prizeType] : [100002000050000100000][prizeType]
            let curBet = this.getTotalBet()
            res = curBet < lockNum;
        }
        return res
    }

    //转一次
    //autoVal:服务端打点用all-总次数，rmd-剩余次数
    reqSpin(curBetIdx, autoVal, bAllin) {
        //已经准备离开游戏了
        if (this.isReadyLeaveGame) return;

        let req = { c: App.MessageID.SLOT_START } as any;
        req.betIndex = curBetIdx;
        if (autoVal) {
            req.bAuto = JSON.stringify(autoVal);
        }
        if (bAllin) {
            req.allin = 1;
        }
        let bottomScp = this.getBottomScript();
        if (bottomScp) {
            let autoTotal = this.getBottomScript().autoTotal;
            App.SubGameManager.setEnterSelectBet
            if (this.getBottomScript().autoTotal > 0) {
                req.isFreeSpin = true;
                autoTotal--;
                req.couponId = App.SubGameManager.getSlotGameFreeSpinData().couponId;
            }
        }
        App.NetManager.send(req, true);
        this.sendTimeInterval = 0;
        this.reqStartTime = new Date().getTime();
    }

    onRcvNetSpine(msg) {
        this.sendTimeInterval = 0;
        this.isReconnect = false;
        if (msg.code == 200 && this.deskInfo) {
            //msg = {"resultCards":[171061516106716867]"c":44"code":200"nextBetLine":{"spcode":500}"betcoin":10000"wincoin":9110000"scatterZJLuXian":{"mult":0"coin":0"indexs":[]}"addMult":1"allFreeCnt":0"coin":96637000"bonusGame":{"cards":[197101313191514143191341511412155111141113]"free":[]"open":1"wincoin":9110000"coins":[{"idx":22"num":1200000}{"idx":24"num":1200000}{"idx":18"num":1000000}{"idx":4"num":800000}{"idx":5"num":800000}{"idx":13"num":800000}{"idx":25"num":800000}{"idx":8"num":600000}{"idx":9"num":600000}{"idx":17"num":600000}{"idx":23"num":600000}{"idx":7"num":20000}{"idx":15"num":40000}{"idx":19"num":50000}]}"lastBetCoin":78417000"spcode":200"spEffect":{"wincoin":0"kind":0}"mults":[10000200003000050000100000]"pooljp":0"zjLuXian":[]"spLuXian":0"freeCnt":0"freeWinCoin":0"subGameInfo":{"subGamid":-1"isMustJoin":-1}"freeResult":{"freeInfo":[]"triFreeCnt":1}}
            // msg = {"select":true"resultCards":[9839994215994522]"code":200"zjLuXian":[]"betcoin":10000"wincoin":0"lastBetCoin":3361522000"subGameInfo":{"subGamid":-1"isMustJoin":-1}"mults":[10000200003000050000100000150000]"coin":3361522000"spLuXian":0"allFreeCnt":0"spcode":200"bonusGame":{"open":0}"freeCnt":0"pooljp":0"scatterZJLuXian":{"mult":0"coin":0"indexs":[81415]}"nextBetLine":{"spcode":500}"c":44"spEffect":{"wincoin":0"kind":0}"freeWinCoin":0"addMult":1"freeResult":{"freeInfo":{"idxs":[81415]"scatter":2"addMult":1"freeCnt":0}"triFreeCnt":1}}
            // msg = {"freeCnt":0"c":44"code":200"gameid":490"wincoin":0"transCards":[06010961013176101311465111014451110]"spEffect":{"wincoin":0"kind":0}"lastBetCoin":30188602526"scatterZJLuXian":{"indexs":[]"mult":0"coin":0}"bonus":{"curmult":12"frames":[1923]"randomadd":[]}"allFreeCnt":0"coin":30188602526"betcoin":900000"mults":[100002000050000100000150000200000400000500000600000700000800000900000150000020000002500000300000035000004000000500000060000007000000800000090000001000000011000000]"nextBetLine":{"spcode":500}"resultCards":[06030961013476101341465111014451110]"freeWinCoin":0"spLuXian":0"spcode":200"addMult":1"zjLuXian":[]"pooljp":0"subGameInfo":{"subGamid":-1"isMustJoin":-1}"freeResult":{"triFreeCnt":0"freeInfo":[]}}
            this.setCurRoundIssue(msg.issue)
            this.setShowResultFinish(false)
            //更新玩家RP
            if (msg.rp) {
                if (msg.rp.cur) {
                    App.userData().rp = msg.rp.cur
                }

            }

            let cfg = this.getGameCfg();
            if (cfg.isTsFramework) {
                director.emit('TsFrameMsg_Spin', msg);
            }

            this.deskInfo.user.coin = msg.coin;
            this.gameInfo = msg;
            this.deskInfo.restFreeCount = msg.freeCnt;
            this.deskInfo.allFreeCount = msg.allFreeCnt;
            if (msg.mults) {
                this.deskInfo.mults = msg.mults;
            }
            // this.checkClientBet()

            this.puzzleData = msg.chipGame;
            // if (msg.gameTask) { //更新Quest数据
            //     cc.vv.UserManager.updateQuestInfoData(msg.gameTask)
            // }

            this.getSlotsScript() && this.getSlotsScript().onMsgSpine(msg)
            // this.getTopScript() && this.getTopScript().onMsgSpine(msg)

            App.EventUtils.dispatchEvent("EVENT_SPIN_MSG", msg);

            //是否有puzzle小游戏
            // if (this.puzzleData && cfg.puzzleCfg && this.puzzleData.currChipInfo) {
            //     find("Canvas").getComponent("LMSlots_Puzzle").puzzleFly();
            // }
        }

        if (this.reqStartTime && this.reqStartTime > 0) {
            let dt = new Date().getTime() - this.reqStartTime;
            this.reqTotalTime += dt;
            this.reqTotalCount += 1;
            if (this.reqTotalCount >= 5) {
                //没5次上报平均时间
                let avgTime = Math.floor(this.reqTotalTime / this.reqTotalCount);
                this.reqTotalTime = 0;
                this.reqTotalCount = 0;
            }
            this.reqStartTime = 0;
        }
    }

    //收到子游戏消息
    onRcvNetSubAction(msg) {
        if (msg.code == 200) {
            // if (msg.gameTask) { //更新Quest数据
            //     cc.vv.UserManager.updateQuestInfoData(msg.gameTask)
            // }
        }
    }

    onRecvNetReconnectDeskinfo(msg) {
        if (msg.gameid !== this.gameId) {
            return false;
        }
        this.isReconnect = true;
        this.deskInfo = msg.deskinfo;
        this.checkReconnectNet();
        this.checkTimeout()
        return true;
    }

    checkReconnectNet() {
        if (this.isReconnect && this.getSlotsScript()) {
            this.getSlotsScript().reconnectNet();
        }
    }

    setMoveingTimeOut() {
        this.checkTimeout();
    }
    //检查超时重新进入游戏
    checkTimeout() {
        if (this.isReconnect) {
            this.isReconnect = false;
            // if (this.getIsQuestModel()) {
            //     cc.vv.GameManager.setEnterOpation({ gameTask: 1 })
            // }
            // App.SubGameManager.entrySlotGame(this.gameId)
        }
    }

    //一局结束
    canDoNextRound() {
        //更新qest进度
        App.EventUtils.dispatchEvent("EVENT_ROUND_END");
        this.setShowResultFinish(true);

        // 如果是进入免费，那么客户端的betidx信任deskinfo里面的
        if (this.deskInfo.allFreeCount > 0 && this.deskInfo.allFreeCount === this.deskInfo.restFreeCount) {
            this.bottomScp.setBetIdx(this.serverRawMult);
        } else if (this.deskInfo.allFreeCount > 0 && this.deskInfo.restFreeCount === 0) {
            // 出免费的时候设置成进游戏选择的
            let selectBet = App.SubGameManager.getEnterSelectBet();
            if (selectBet) {
                if (!this.getFreeTime()) {
                    for (let i = 0; i < this.deskInfo.mults.length; i++) {
                        if (this.deskInfo.mults[i] === selectBet) {
                            this.bottomScp.setBetIdx(i + 1);
                            this.serverRawMult = (i + 1);
                            break;
                        }
                    }
                }
            }
        }
    }

    //退出游戏返回大厅
    reqBackLobby() {
        let req = { c: App.MessageID.GAME_LEVELROOM } as any;
        req.deskid = this.gameId;
        App.NetManager.send(req);

        this.isReadyLeaveGame = true
        //
        App.StorageUtils.saveLocal('extfromgame', 'true');
    }

    //兼容老的设置界面的退出接口
    requestExit() {
        this.reqBackLobby();
    }

    onRcvNetExitRoom(msg) {
        if (msg.code === 200) {
            App.StorageUtils.saveLocal("SAVE_FROM_SUBGAME_ID", String(this.gameId));
            App.PopUpManager.addPopup("prefabs/SceneTranslate", "hall", null, false);
            // App.PopUpManager.addPopup("prefabs/SceneTranslate", "hall", {
            //     onShow: (node) => {
            //         node.getComponent("SceneTranslate").toHall();
            //     }
            // }, false, null);
        }
    }

    onRecvLevelupExp(msg) {
        if (msg.code == 200) {
            //更新经验
            this.levelupData = msg.info
            App.GameManager.setCurLv(msg.info.level)
            App.userData()._curExp = msg.info.levelexp;
            App.userData()._updateExp = msg.info.levelexp;
            App.userData()._nextLvReward = msg.info.levelup;

            this.levelupData.totalCoin = msg.coin;
            //通知升级了
            App.EventUtils.dispatchEvent(App.EventID.PULL_LV_UP, msg.info);
            //Global.SYS_OPEN.GUIDE_CHANGEBET 3
            if (msg.info.level == 3) {
                if (this.secBetVal) {
                    if (this.deskInfo.mults.length == 1) {
                        this.deskInfo.mults.push(this.secBetVal)
                        this.secBetVal = null
                    }
                }
            }

            if (msg.cashback) {
                this.deskInfo.cashBackInfo = msg.cashback
            }

            //onetimeonly替换levelgift
            if (msg.onetimeleft && msg.onetimeleft > 0) {
                App.userData()._levelGift = msg.onetimeleft;
            }
        }
    }

    getPuzzleData() {
        return this.puzzleData;
    }

    /**
     * 升级数据
     */
    getLevelupExp() {
        return this.levelupData
    }

    /**
     * 清理升级数据
     */
    clearLevelupData() {
        this.levelupData = null
    }

    /**
     * 经验变化数据
     */
    getExpChangeData() {
        return this.expChangeData;
    }

    clearExpChangeData() {
        this.expChangeData = null
    }

    onRecvChangeExp(msg) {
        if (msg.code == 200) {
            App.userData()._curExp = msg.info.levelexp;
            App.userData()._nextLvReward = msg.info.levelup;
            this.expChangeData = msg.info;
            App.EventUtils.dispatchEvent(App.EventID.REFUSH_LV_EXP, msg.info);
        }
    }

    onRcvNetMoneyChanged(msg) {
        if (msg.code === 200) {
            if (msg.uid === App.userData().uid) {
                this.setCoins(msg.coin)
                if (this.topScp) {
                    this.topScp.showCoin();
                }

            }
        }
    }

    //退出游戏清理数据
    onExit() {
        this.onDestroy();
    }
    //退出游戏
    clear() {
        this.onExit();

        //释放子游戏目录
        // cc.loader.releaseResDir(this.getGameDir())

        // if (cc.vv.QueueWinMrg) {
        //     cc.vv.QueueWinMrg.clearQueueList()
        // }

        this.deskInfo = null
        App.SubGameManager.existSlotGame();
    }

    //sync的延迟
    awaitTime(nTime): Promise<void> {
        return new Promise<void>((res, rej) => {
            //绑定在logic上
            let can = find("Canvas")
            if (isValid(can)) {
                let logicCmp = can.getComponent(SlotGameLogicBase)
                if (isValid(logicCmp)) {
                    logicCmp.scheduleOnce(() => { res(); }, nTime / Config.SLOT_GAME_SPEED);
                }
                else {
                    // 如果没有 logic 组件，立即 resolve 避免悬挂
                    res();
                }
            }
            else {
                // 如果找不到 Canvas，也立即 resolve
                res();
            }
        });
    }

    /**
     * 
     * @param {*} val 音量.
     * 降低背景音，需要背景音乐是开启的状态
     */
    setBgmVol(val) {
        App.AudioManager.setBgmVolume(val);
    }

    //设置引导选择5次
    // setGuideId(val) {
    //     this.newGuideSpine = val
    // }
    // getGuideId() {
    //     return this._newGuideSpine || 0
    // }

    //获取卷轴的随机的序号
    getReelRandomIdx(nReel) {
        this.reelIdx = this.reelIdx || []

        return this.reelIdx[nReel]
    }
    //设置卷轴的随机序号
    setReelRandomIdx(nReel, idx) {
        if (this.reelIdx) {
            this.reelIdx[nReel] = idx
        }
    }
    //设置是否是Quest任务模式
    getIsQuestModel() {
        return this.deskInfo.gameTask
    }

    //临时设置一下模式
    setIsQuestModel(val) {
        this.deskInfo.gameTask = val
    }

    /**
     * 获取新手任务信息
     */
    getGuideTask() {
        return this.deskInfo.newbieTask
    }
    //更新引导任务
    onRcvNetUpdateGuideTask(msg) {
        if (msg.code == 200) {
            if (msg.newbieTask) {
                this.deskInfo.newbieTask.state = msg.newbieTask.state;
                this.deskInfo.newbieTask.count = msg.newbieTask.count;
                App.EventUtils.dispatchEvent(App.EventID.GET_GUIDETASK_REFUSH);
            }

        }
    }

    //清理掉本次的弹窗数据
    clearServerInitpop() {
        this.deskInfo.popInfo = null
    }


    /**
     * 暂停slot界面动画/逻辑
     */
    pauseSlot() {
        this.doPauseAction(false);

    }

    /**
     * 恢复slot界面的动画/逻辑
     */
    resumeSlot() {
        this.doPauseAction(true);
    }

    /**
     * 
     * @param {true/false} val 
     */
    setIsPuzzleModel(val) {
        this.ispuzzleModel = val;
    }

    getIsPuzzleModel() {
        return this.ispuzzleModel;
    }

    //bPause false 表示暂停 true 表示恢复
    doPauseAction(bPause) {
        let pCanvas = find('Canvas')
        if (!isValid(pCanvas, true)) return

        let logicCmp = pCanvas.getComponent(SlotGameLogicBase)
        if (!isValid(logicCmp)) {
            return
        }

        if (!bPause) {
            this.pauseState = this.pauseState || 0
            this.pauseState++
            if (this.pauseState > 1) {
                return
            }
        }
        else {
            if (this.pauseState) {
                this.pauseState--
                if (this.pauseState > 0) {
                    return
                }
            }

        }


        let pauseActionNode = []
        let pauseSpinNode = []
        let pauscriptFun = function (scp, pause) {
            if (isValid(scp)) {
                scp.enabled = pause
                var scheduler = director.getScheduler();
                if (pause) {
                    scheduler.resumeTarget(scp);
                }
                else {
                    scheduler.pauseTarget(scp);
                }

            }
        }
        //公共组建的暂停
        pauscriptFun(logicCmp, bPause)

        let tSlotCmp = this.getSlotsScript();
        pauscriptFun(tSlotCmp, bPause);

        pauscriptFun(this.bottomScp, bPause);
        // this._topScp.enabled = bPause

        let reels = tSlotCmp._reels

        for (let i = 0; i < reels.length; i++) {
            let item = reels[i]
            pauscriptFun(item, bPause)
            let symbols = item._symbols
            if (symbols) {
                for (let j = 0; j < symbols.length; j++) {
                    let sysItem = symbols[j]
                    pauscriptFun(sysItem, bPause)
                    pauseActionNode.push(sysItem.node)

                }
            }

        }
        if (!bPause) {
            let bgmVol = App.AudioManager.getBgmVolume();
            this.setBgmVol(bgmVol * 0.5);
            App.AudioManager.pauseAllSfx();
        }
        else {
            App.AudioManager.resumeAllSfx();
        }
        //1暂停Action数据整理
        pauseActionNode.push(this.bottomScp.node);


        //2暂停Spin数据整理
        let slotNode = tSlotCmp.node;

        pauseActionNode.push(slotNode);
        pauseSpinNode.push(slotNode);
        let bottomChilds = this.bottomScp.node;
        pauseSpinNode.push(bottomChilds);

        //用户自定义的需要暂停的组建
        // let userDefCmp = find('safe_node', pCanvas).getComponentsInChildren('LMSlots_PauseUI_Base')
        // for (let i = 0; i < userDefCmp.length; i++) {
        //     let itemScp = userDefCmp[i]
        //     pauscriptFun(itemScp, bPause)

        //     pauseActionNode.push(itemScp.node)
        //     pauseSpinNode.push(itemScp.node)
        // }

        //开始执行暂停操作
        for (let it = 0; it < pauseActionNode.length; it++) {
            if (pauseActionNode[it].active) {
                if (!bPause) {
                    pauseActionNode[it].pauseAllActions()       //暂停此节点action

                }
                else {
                    pauseActionNode[it].resumeAllActions()       //恢复此节点action

                }

            }

            let symChild = pauseActionNode[it].children //暂停子节点action
            for (let k = 0; k < symChild.length; k++) {
                if (symChild[k].active) {

                    if (!bPause) {
                        symChild[k].pauseAllActions()
                    }
                    else {
                        symChild[k].resumeAllActions()
                    }
                }

            }
        }

        for (let it = 0; it < pauseSpinNode.length; it++) {

            let allSpines = pauseSpinNode[it].getComponentsInChildren(sp.Skeleton) //暂停子节点的spin 播放
            for (let i = 0; i < allSpines.length; i++) {
                if (allSpines[i].node.active) {

                    allSpines[i].paused = !bPause
                }
                else {
                    if (allSpines[i].paused == true && bPause) { //有些因为逻辑没有暂停导致，节点被隐藏了，恢复的时候也需要恢复
                        allSpines[i].paused = !bPause
                    }
                }

            }
        }
    }

    //自己模拟的1s执行一次
    update(dt) {
        this.sendTimeInterval += 1
        if (this.sendTimeInterval == 20) {
            this.sendTimeInterval = 0;
            this.setMoveingTimeOut();
        }
    }

    /**
     * 是否需要跳过部分点击操作，如进入免费，结算等等
     * @returns {*}
     */
    isNeedAutoPlay() {
        return this.isAutoGame();
    }

    /**
     * 跳过部分流程的延时时间，在gamedata初始化中定义，不需要自行修改，直接获取即可
     * @returns {number}
     */
    getAutoPlayTime() {
        return this.autoPlayTime;
    }

    /**
     *
     * @param node
     * @param func
     * @param bManual 手动模式是否可跳过
     * @param manualTime 手动模式等待时间
     */
    checkAutoPlay(node, func, bManual = false, manualTime = 8) {
        if (this.isNeedAutoPlay()) {
            node.stopAllActions();
            tween(node)
                .delay(this.autoPlayTime / Config.SLOT_GAME_SPEED)
                .call(() => {
                    func()
                })
                .start();
        } else {
            if (bManual) {
                node.stopAllActions();
                tween(node)
                    .delay(manualTime / Config.SLOT_GAME_SPEED)
                    .call(() => {
                        func()
                    })
                    .start();
            }
        }
    }

    getManualAutoPlayTime() {
        return this.manualAutoPlayTime;
    }

    addNewGameTipSpinCount() {
        this.newGameTipSpinCount++
    }

    getNewGameTipSpinCount() {
        return this.newGameTipSpinCount
    }

    //获取外围系统入口脚本
    getOtherSysScript() {
        return this.othersysScp
    }
    setOtherSysScript(val) {
        this.othersysScp = val
    }

    /**
     * 是否显示系统浮窗节点
     * @param {*} bShow 
     */
    showOtherSysNode(bShow) {
        let sysscp = this.getOtherSysScript()
        if (sysscp) {
            let sysNode = sysscp.getSysNode()
            if (isValid(sysNode)) {
                sysNode.active = bShow
            }
        }

    }

    /**
     * 设置Allin开关
     */
    setAllInVal(val, coin) {
        this.isAllin = val;
        this.allInBet = coin;
    }

    //获取当前的轮次
    getCurRoundIssue() {
        return this.deskInfo.issue
    }
    //设置当前轮次
    setCurRoundIssue(val) {
        this.deskInfo && (this.deskInfo.issue = val);
    }
    //设置结果展示完成了
    setShowResultFinish(val) {
        this.isResultFinish = val
    }
    getShowReulstFinish() {
        return this.isResultFinish
    }
    //设置是否可以退出游戏
    setCanExitGame(val) {
        this.canExitGame = val;
    }
    getCanExitGame() {
        return this.canExitGame;
    }

    setFreeGameScript(scp) {

    }

    getFreeGameScript(): any { }

    getSelectData(): any { }

    getBounusData(): any { }

    getNeedBonusIconNum(): any { }

    playSpine(node: any, aniName: any, loop: any, endCall: any) { }

    getPoolbyType(type: any) { }

    clearBonusDataPool(index: any) { }

    clearBonusState() { }

    setBonusIconNum(num: any) { }
    getCollectGame() { }
    setCollectGame(isCollectGame: any) { }
    isFreeGame() { }
}



