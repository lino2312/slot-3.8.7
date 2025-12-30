import { Component, UITransform, _decorator, instantiate, tween, v2 } from 'cc';
import LmslotsSubgame777Item from './LMSlots_Subgame777_item';
import { App } from '../../App';
const { ccclass, property } = _decorator;
const itemScriptName: string = 'LmslotsSubgame777Item';
@ccclass('LmslotsSubgame777Reel')
export default class LmslotsSubgame777Reel extends Component {

    @property
    prefab_item: any = null;
    _bStartMove: any;
    _curInterv: any;
    _moveIntervCfg: any;
    _allItems: any;
    _roundMax: any;
    reelIdx: any;
    _moveSpeed: any;
    _resultReel: any;
    _gamecfg: any;
    _num: number;
    _stopNum: number;

    onLoad() {
    }

    start() {
    }

    update(dt) {
        let self = this
        if (this._bStartMove) {
            // this.checkItemBottom()
            this._curInterv += dt
            if (this._curInterv >= this._moveIntervCfg) {
        this._curInterv = 0
        let minY = this.getBottomPosY()
        let items = this._allItems
        for (let i = 0; i < items.length; i++) {
        let obj = items[i]
        let scriptcmp: LmslotsSubgame777Item = obj.getComponent(itemScriptName);
        if (scriptcmp) {
        let state = scriptcmp.getMoveState()
        if (state == "moveing") {

        //是否已经转到最大圈数
        let nRound = scriptcmp.getRound()
        if (nRound < this._roundMax + this.reelIdx) {
        obj.y -= this._moveSpeed
        if (obj.y <= minY) {
        obj.y = this.getTopPosY()
        scriptcmp.addRound()
        scriptcmp.showRandSprite()
        }
        }
        else {
        //到达最大圈数
        //设置结果图片
        scriptcmp.showResultSprite(this._resultReel[i])
        let tarPos = this.getItemPosition(scriptcmp.getItemIdx())
        let nDur = (obj.y - tarPos.y) / ((1 / this._moveIntervCfg) * this._moveSpeed)
        scriptcmp.setMoveState("easing")
        tween(obj)
        .to(nDur, { position: tarPos }, { easing: 'elasticIn' })
        .call(() => {
        scriptcmp.setMoveState('idle')
        self.addStopItemNum()
        })
        .start()
        }

        }
        }
        }
            }
        }
    }

    createItems(cfg) {
        this._gamecfg = cfg
        //多创建一列，是为了旋转时循序转的效果
        for (let i = 0; i < this._num + 1; i++) {
            let obj = instantiate(this.prefab_item)
            obj.position = this.getItemPosition(i)
            this.node.addChild(obj)
            let scriptcmp = obj.getComponent(itemScriptName)
            if (scriptcmp) {
        scriptcmp.resetItem(i, this.reelIdx, this._gamecfg)
        scriptcmp.showRandSprite()
            }
            this._allItems.push(obj)

        }
    }

    getItemPosition(idx) {
        let height = this.node.getComponent(UITransform).contentSize.height
        let xPos = 0
        let yPos = height / (this._num - 1) * (idx)
        return v2(xPos, yPos)
    }

    startMove(resultReel) {
        this._resultReel = resultReel

        let items = this._allItems
        for (let i = 0; i < items.length; i++) {
            let obj = items[i]
            let scriptcmp = obj.getComponent(itemScriptName)
            if (scriptcmp) {
        scriptcmp.setMoveState('moveing')
        scriptcmp.clrearItemData()
            }
        }
        this._bStartMove = true
        this._curInterv = 0
        this._moveIntervCfg = 1 / 60
        let cfg = App.GameData.getGameCfg()
        this._moveSpeed = (cfg as any).sub777_speed || 40
        this._roundMax = 5
        this._stopNum = 0
    }

    stopMove() {
        let items = this._allItems
        this._moveSpeed = this._moveSpeed * 10
        for (let i = 0; i < items.length; i++) {
            let obj = items[i]
            let scriptcmp = obj.getComponent(itemScriptName)
            if (scriptcmp) {
        scriptcmp.setRound(this._roundMax - 1)
            }
        }
    }

    addStopItemNum() {
        this._stopNum += 1
        if (this._stopNum == this._allItems.length) {
            this.doReelStopAction()
        }
    }

    doReelStopAction() {
        // Global.dispatchEvent(cc.vv.gameData._EventId.REEL_STOP);
        App.EventUtils.dispatchEvent('REEL_STOP');
    }

    getBottomPosY() {
        return -this.getItemPosition(1).y
    }

    getTopPosY() {
        return this.getItemPosition(this._num).y
    }

}
