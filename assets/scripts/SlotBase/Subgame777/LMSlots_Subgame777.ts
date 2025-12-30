import { Button, Component, Label, Node, _decorator, find, instantiate } from 'cc';
import { App } from '../../App';
import LmslotsSubgame777Reel from './LMSlots_Subgame777_reel';
const { ccclass, property } = _decorator;
/**
 * 777小游戏
 */

let Game777Cfg = {
    [1]: { normal: 'theme160_s_104', win_node: 's104' }, //2x
    [2]: { normal: 'theme160_s_103', win_node: 's103' }, //3x
    [3]: { normal: 'theme160_s_102', win_node: 's102' }, //5x
    [4]: { normal: 'theme160_s_105', win_node: 's105' }, //红7
    [5]: { normal: 'theme160_s_106', win_node: 's106' }, //蓝7
    [6]: { normal: 'theme160_s_107', win_node: 's107' }, //3bar
    [7]: { normal: 'theme160_s_108', win_node: 's108' }, //2bar
    [8]: { normal: 'theme160_s_109', win_node: 's109' }, //bar
}

let Game777Mul = {
    [1]: 3117,  //任意*X同类型元素,
    [2]: 25,    //3个红7
    [3]: 9,     //3个蓝7
    [4]: 7.5,    //任意3个7，
    [5]: 9.4,   //3个3bar
    [6]: 7.5,   //2个2bar
    [7]: 5,     //3个1bar
    [8]: 2.5,   //任意3个bar

}

@ccclass('LmslotsSubgame777')
export default class LmslotsSubgame777 extends Component {
    private _pop_win: Node;
    private _soundCfg: any;
    private _subGameData: any;
    private _bSendReq: boolean;
    private _startRound: number;
    private _stopReelNum: number;
    private _stop77Btn: any;

    onLoad() {
        let btnstart = find('node_pop_ui/node_start/btn_start', this.node)
        btnstart.on(Node.EventType.TOUCH_END, function () {
            this.onClickStart();
        }, this)
        let btnend = find('node_pop_ui/node_end/btn_collect', this.node)
        btnend.on(Node.EventType.TOUCH_END, function () {
            this.onClickCollect();
        }, this)

        this._pop_win = find('node_pop_ui', this.node)
        this._pop_win.active = false

        this.showInitReel()

        App.EventUtils.on('REEL_STOP', this.recvReelStop, this);
        this._soundCfg = (App.GameData.getGameCfg() as any).soundCfg;
    }

    start() {
    }

    update(dt) {
    }

    onEnable() {
        App.EventUtils.on(App.EventID.SLOT_SUBGAME_DATA, this.onRcvSubGameAction, this);
    }

    onDisable() {
        App.EventUtils.off(App.EventID.SLOT_SUBGAME_DATA, this.onRcvSubGameAction, this);
    }

    ReconnectNet(avgBet) {
        if (this._subGameData) {
        } else {
            this.showEnter(avgBet)
        }
    }

    showEnter(avgBet) {
        this.node.active = true
        this._bSendReq = false;
        this._subGameData = null;
        const bottomScp = (App.GameData as any).GetBottomScript?.();
        if (bottomScp && typeof bottomScp.ShowBtnsByState === "function") {
            bottomScp.ShowBtnsByState("moveing_1");
        }

        if (this._pop_win.active)
            return;
        this._pop_win.active = true
        let node_start = find('node_start', this._pop_win)
        let node_end = find('node_end', this._pop_win)
        node_end.active = false
        node_start.active = true
        this._startRound = 0;
        this.hideAllSubNode();
        this._showPopWinAction(this._pop_win, () => { })

        this.ShowAvgReward(avgBet)

        // cc.vv.gameData.checkAutoPlay(node_start,this.onClickStart.bind(this));
        if (App.SubGameManager.getSlotGameDataScript().checkAutoPlay) {
            App.SubGameManager.getSlotGameDataScript().checkAutoPlay(node_start, this.onClickStart.bind(this));
        } else {
            throw new Error('App.GameData.checkAutoPlay is not a function');
        }
    }
    hideAllSubNode() {
        throw new Error('Method not implemented.');
    }

    showEnd() {
        let node_start = find('node_start', this._pop_win)
        let node_end = find('node_end', this._pop_win)
        node_end.active = true
        node_start.active = false
        //设置金币
        let coin = this._subGameData.wincoin
        let lbl_coin = find('lbl_win', node_end)
        App.AnimationUtils.doRoallNumEff(lbl_coin, 0, coin, 1.5, null, null, 0, true)
        this._showPopWinAction(this._pop_win, () => { })
        if (App.SubGameManager.getSlotGameDataScript().checkAutoPlay) {
            App.SubGameManager.getSlotGameDataScript().checkAutoPlay(node_end, this.onClickCollect.bind(this));
        } else {
            throw new Error('App.GameData.checkAutoPlay is not a function');
        }
    }

    ShowAvgReward(avgBet) {
        if (!avgBet) avgBet = 0
        for (let i = 1; i <= 8; i++) {
            let lblM = find('spr_machine/node_mult/M' + i, this.node)
            if (lblM) {
                lblM.getComponent(Label).string = App.FormatUtils.formatNumShort(Game777Mul[i] * avgBet, 1)
            }
        }
    }

    hidePopWin() {
        let self = this
        App.ComponentUtils.showAlertAction(self._pop_win, false, () => {
            self._pop_win.active = false
        })
    }

    onClickStart() {
        if (this._bSendReq) {
            return
        }
        this._bSendReq = true;
        let req: any = {
            c: App.MessageID.SLOT_SUBGAME_DATA,
            data: {
                rtype: 1
            },
            gameid: App.SubGameManager.getGameid()
        };
        App.NetManager.send(req, true);
        this.hidePopWin()
        App.AudioManager.playSfx('audio/slotGame/', 'common_click');
    }

    onClickCollect() {
        let lbl_coin = find('node_pop_ui/node_end/lbl_win', this.node)
        lbl_coin.getComponent(Label).string = App.FormatUtils.FormatNumToComma(this._subGameData.wincoin)

        //刷新金币
        App.AudioManager.playSfx('audio/slotGame/', 'common_click');
        App.EventUtils.dispatchEvent(App.EventID.SLOT_ENERGYGAME_OperationOVER, { isshow: false, etype: 0 });
        this._pop_win.active = false;
        this.showTranse()
    }
    showTranse() {
        throw new Error('Method not implemented.');
    }

    onRcvSubGameAction(msg) {
        console.log("接收游戏动作数据");
        if (msg.code == 200) {
            this._subGameData = msg.data
            //延时一秒开始
            this.scheduleOnce(() => {
                this.startMoveReel()
            }, 1)
        }
    }

    showInitReel() {
        for (let i = 0; i < 3; i++) {
            let reel = find('spr_machine/node_content/reel' + (i + 1), this.node)
            let reelCmp = reel.getComponent(LmslotsSubgame777Reel);
            reelCmp.createItems(Game777Cfg);
        }
    }

    startMoveReel() {
        this._stopReelNum = 0
        if (this._subGameData) {
            for (let i = 0; i < 3; i++) {
                let reelResult = [0, 0, 0]
                let roudData = this._subGameData.cardsList[this._startRound]
                reelResult[1] = roudData[i]
                let reel = find('spr_machine/node_content/reel' + (i + 1), this.node)
                let reelCmp = reel.getComponent(LmslotsSubgame777Reel);
                reelCmp.startMove(reelResult);
            }
        }
        App.AudioManager.playSfx('audio/slotGame/', 'slot_spin');
        //显示一个stop按钮
        this.showBottomStop()
    }

    showBottomStop() {
        let stop: any = null;
        const bottomScp = (App.GameData as any).GetBottomScript?.();
        if (bottomScp && typeof bottomScp.ShowBtnsByState === "function") {
            bottomScp.GetBottomScript().getStopBtnObj()
        }
        let stop777 = instantiate(stop)
        stop777.active = true
        stop777.getComponent(Button).interactable = true
        this._stop77Btn = stop777
        stop777.parent = stop.parent
        stop777.on('click', this.stop777Call, this)
    }

    stop777Call() {
        this._stop77Btn.destroy()
        for (let i = 0; i < 3; i++) {
            let reel = find('spr_machine/node_content/reel' + (i + 1), this.node)
            let reelCmp = reel.getComponent(LmslotsSubgame777Reel);
            reelCmp.stopMove();
        }
    }

    _showPopWinAction(node: Node, endCall: () => void) {
        node.active = true
        App.ComponentUtils.showAlertAction(node, true, endCall)
        App.AudioManager.playSfx('audio/slotGame/', 'slot_popup');
    }

    recvReelStop() {
        let self = this
        this._stopReelNum += 1
        if (this._stopReelNum == 3) {
            if (this._stop77Btn) {
                this._stop77Btn.destroy()
            }

            //看是否是最终的结果
            let next = this._subGameData.cardsList[this._startRound]
            this._startRound += 1
            if (this._startRound < this._subGameData.cardsList.length) {
                //还可以转
                let delaycall = function () {
                    self.startMoveReel()
                }
                this.scheduleOnce(delaycall, 1)
            } else {
                //展示结果
                App.AudioManager.stopAllSfx();
                App.AudioManager.playSfx('audio/slotGame/', 'slot_win');
                this.showResultAnimation(next);
                this.scheduleOnce(() => {
                    this.showEnd()
                }, 3);
            }
        }
    }
    showResultAnimation(next: any) {
        throw new Error('Method not implemented.');
    }

}
