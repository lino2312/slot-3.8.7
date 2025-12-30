import { Component, Node, _decorator, find, tween } from 'cc';
import { App } from 'db://assets/scripts/App';
import { SlotGameBaseData } from 'db://assets/scripts/game/slotgame/SlotGameBaseData';
import List from '../../component/List/List';
const { ccclass, property } = _decorator;

/**
 * 押注记录详情
 */
@ccclass('SlotGameRecordRoomPannel')
export class SlotGameRecordRoomPannel extends Component {
    @property( List )
    listview: List = null; // List 组件，需要根据实际组件类型定义

    private list_bg: Node = null;
    private _serverdata: any[] = [];
    private slotGameDataScript: SlotGameBaseData = null;

    onLoad() {
        App.ScreenUtils.FixDesignScale_V(this.node);

        this.list_bg = find("list_bg", this.node);
        // this.list_bg.x = 963
        // this.list_bg.active = false
        App.ComponentUtils.onClick(this.node, this.onClickClose, this);

        // 获取游戏数据脚本
        this.slotGameDataScript = App.SubGameManager?.getSlotGameDataScript();

        // 注册消息
        // 注意：如果 App.MessageID.GAME_BET_RECORDS 不存在，需要在 MessageId.ts 中添加
        if (App.NetManager) {
            // @ts-ignore - GAME_BET_RECORDS 可能需要在 MessageId.ts 中定义
            App.NetManager.registerMsg(App.MessageID.GAME_BET_RECORDS, this.OnRcvRecords, this);
        }
    }

    onDestroy() {
        if (App.NetManager) {
            // @ts-ignore - GAME_BET_RECORDS 可能需要在 MessageId.ts 中定义
            App.NetManager.unregisterMsg(App.MessageID.GAME_BET_RECORDS, this.OnRcvRecords, false, this);
        }
    }

    start() {
        this.sendReq();
    }

    sendReq() {
        if (!this.slotGameDataScript) {
            console.warn('SlotGameRecordRoomPannel: slotGameDataScript is null');
            return;
        }

        // @ts-ignore - GAME_BET_RECORDS 可能需要在 MessageId.ts 中定义
        let req: any = { c: App.MessageID.GAME_BET_RECORDS };
        req.gameid = this.slotGameDataScript.getGameId();
        req.limit = 30;
        
        if (App.NetManager) {
            App.NetManager.send(req);
        }
    }

    onClickClose() {
        this.node.destroy();
    }

    /**
     * 获取可以显示的记录数据
     * 如果当前还在展示结果，那就不展示当前的记录数据
     */
    _getCanShowData(val: any[]): any[] {
        if (!this.slotGameDataScript) {
            return val;
        }

        // 如果没有实现此函数
        if (!this.slotGameDataScript.getShowReulstFinish) {
            return val;
        }

        let bFinish = this.slotGameDataScript.getShowReulstFinish();
        if (bFinish) {
            return val;
        } else {
            let delkey = -1;
            let curIssue = this.slotGameDataScript.getCurRoundIssue();
            for (let i = 0; i < val.length; i++) {
                let item = val[i];
                if (item.i == curIssue) {
                    delkey = i;
                    break;
                }
            }

            if (delkey != -1) {
                val.splice(delkey, 1);
            }

            return val;
        }
    }

    OnRcvRecords(msg: any) {
        if (msg.code == 200) {
            if (!this.slotGameDataScript) {
                return;
            }

            let curgameId = this.slotGameDataScript.getGameId();
            if (curgameId == msg.gameid) {
                this._serverdata = this._getCanShowData(msg.records);
                this._showRecordsList();
                // this._showMoveIn()
            }
        }
    }

    // _showMoveIn() {
    //     if (this.list_bg.getNumberOfRunningActions() == 0) {
    //         this.list_bg.x = 963
    //         this.list_bg.active = true
    //         tween(this.list_bg)
    //         .to(0.3, { x: 163 }, { easing: "quadOut" })
    //         .start()
    //     }
    // }

    _showRecordsList() {
        // if (this.listview && this.listview.numItems !== undefined) {
            this.listview.numItems = this._serverdata.length;
        // }
    }

    onRenderList(item: Node, idx: number) {
        let itemdata = this._serverdata[idx];
        if (itemdata) {
            item.active = true;
            const itemComponent = item.getComponent("SlotGameRecordBetItem") as any;
            if (itemComponent && itemComponent.init) {
                itemComponent.init(itemdata);
            }
        } else {
            item.active = false;
        }
    }
}

