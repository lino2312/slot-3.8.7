import { _decorator, Component, Node } from 'cc';
import SlotsBottom from '../Slot/SlotsBottom';
import SlotGameData from '../Slot/SlotsGameData';
import SlotsTop from '../Slot/SlotsTop';
import EventDispatcher from './EventDispatcher';
import { PoolMng } from './PoolMng';
const { ccclass, property } = _decorator;

@ccclass('GameEnter')
export default class GameEnter extends Component {

    @property(Node)
    ndGame: Node = null;

    @property(Node)
    ndSlots: Node = null;

    @property(Node)
    ndWheel: Node = null;

    @property(Node)
    ndTop: Node = null;

    @property(Node)
    ndBottom: Node = null;

    // LIFE-CYCLE CALLBACKS:

    onLoad() {
        SlotGameData.scriptTop = this.ndTop.getComponent(SlotsTop);
        SlotGameData.scriptBottom = this.ndBottom.getComponent(SlotsBottom);
    }

    start() {

    }

    onEnable() {

    }

    onDisable() {

    }

    onDestroy() {
        EventDispatcher.getInstance().remove(this);
        PoolMng.clearNodePoolList();
    }

    update(dt) { }

}
