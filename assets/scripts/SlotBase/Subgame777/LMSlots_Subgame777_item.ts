import { Component, Sprite, SpriteAtlas, _decorator } from 'cc';
import { CommonUtils } from '../../utils/CommonUtils';
const { ccclass, property } = _decorator;

@ccclass('LmslotsSubgame777Item')
export default class LmslotsSubgame777Item extends Component {
    private _itemIndex: number;
    private _reelIdx: number;
    private _cfg: any;
    private _round: number;
    @property(SpriteAtlas)
    itemAtlas:SpriteAtlas = null;
    private _moveState: any;

    onLoad() {
    }

    start() {
    }

    update(dt) {
    }

    resetItem(idx: number, reelIdx: number, cfg: any) {
        this._itemIndex = idx;
        this._reelIdx = reelIdx;
        this._cfg = cfg;
    }

    getItemIdx() {
        return this._itemIndex
    }

    clrearItemData() {
        this._round = 0;
    }

    showRandSprite() {
        let cfg = this.getItemCfg()
        let randIdx = CommonUtils.random(1, 8);
        let item = cfg[randIdx];
        (this.node.getComponent(Sprite) as Sprite).spriteFrame = this.itemAtlas.getSpriteFrame(item.normal);
    }

    showResultSprite(itemId) {
        let cfg = this.getItemById(itemId)
        if (cfg) {
            let sp = this.itemAtlas.getSpriteFrame(cfg.normal)
            if (sp) {
        (this.node.getComponent(Sprite) as Sprite).spriteFrame = sp
            }
        }
    }

    setMoveState(strState) {
        this._moveState = strState
    }

    getMoveState() {
        return this._moveState as string
    }

    getRound() {
        return this._round
    }

    setRound(val) {
        this._round = val
    }

    addRound() {
        this._round += 1
    }

    getItemCfg() {
        return this._cfg
    }

    getItemById(id) {
        let cfg = this.getItemCfg()
        for (let i in cfg) {
            let item = cfg[i]
            if (i == id) {
        return item
            }
        }
    }

}
