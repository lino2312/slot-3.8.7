import { _decorator, Component, instantiate, Label, Node } from 'cc';
import { App } from '../../App';
const { ccclass, property } = _decorator;

@ccclass('DailyProfitRank')
export class DailyProfitRank extends Component {
    @property(Node)
    public rankItem = null;
    @property(Node)
    public rankList = null;
    @property(Node)
    public rankFirst = null;
    @property(Node)
    public rankSecond = null;
    @property(Node)
    public rankThird = null;

    onLoad() {
        // this.netListener = this.node.addComponent("NetListenerCmp");
    }

    onEnable() {
        let msg = {
            list: [{
                "rankID": 0,
                "userID": 0,
                "userName": "string",
                "winAmount": 0
            }, {
                "rankID": 0,
                "userID": 0,
                "userName": "string",
                "winAmount": 0
            }, {
                "rankID": 0,
                "userID": 0,
                "userName": "string",
                "winAmount": 0
            }, {
                "rankID": 0,
                "userID": 0,
                "userName": "string",
                "winAmount": 0
            }, {
                "rankID": 0,
                "userID": 0,
                "userName": "string",
                "winAmount": 0
            }, {
                "rankID": 0,
                "userID": 0,
                "userName": "string",
                "winAmount": 0
            }]
        }
        var self = this
        let additionalParams = "";

        App.HttpUtils.sendPostRequest("GetDailyProfitRank", additionalParams, (error: any, response: any) => {
            if (error) {
                console.error(error);
            } else {
                console.log("排行榜:", response);
                if (response.code == 0 && response.msg == "Succeed") {
                    self.EVENT_GET_RANK_INFO(response.data)
                } else {
                    App.AlertManager.showFloatTip(response.msg);
                }
            }
        });


    }

    onDisable() {
        // this.netListener.clear(); 
    }

    start() {
    }

    onClickBack() {
        App.PopUpManager.closePopup(this.node);
    }

    EVENT_GET_RANK_INFO(msg: any) {
        this.rankList.removeAllChildren();
        if (!msg) return;
        if (msg.length < 1) return;
        for (let i = 0; i < msg.penarikanList.length; i++) {
            if (i < 3) {
                if (i == 0) {
                    this.rankFirst.children[2].getComponent(Label).string = msg.penarikanList[i].nickName;
                    this.rankFirst.children[3].getComponent(Label).string = msg.penarikanList[i].price;
                } else if (i == 1) {
                    this.rankSecond.children[2].getComponent(Label).string = msg.penarikanList[i].nickName;
                    this.rankSecond.children[3].getComponent(Label).string = msg.penarikanList[i].price;
                } else if (i == 2) {
                    this.rankThird.children[2].getComponent(Label).string = msg.penarikanList[i].nickName;
                    this.rankThird.children[3].getComponent(Label).string = msg.penarikanList[i].price;
                }
            } else {
                break;
            }
        }
        for (let i = 0; i < msg.dataList.length; i++) {
            let item = instantiate(this.rankItem);
            item.children[0].getComponent(Label).string = i + 1;
            item.children[2].getComponent(Label).string = msg.dataList[i].nickName;
            item.children[3].getComponent(Label).string = msg.dataList[i].betAmount;
            item.parent = this.rankList;
            item.active = true;
        }
    }

}
