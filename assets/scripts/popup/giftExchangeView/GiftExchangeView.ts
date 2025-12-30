import { _decorator, Component, EditBox, instantiate, Node, Prefab } from 'cc';
const { ccclass, property } = _decorator;

import { App } from '../../App';
import { GiftExchangeVo } from './GiftExchangeVo';
@ccclass('GiftExchangeView')
export class GiftExchangeView extends Component {
    @property(EditBox)
    public codeEditBox = null;
    @property(Prefab)
    public item = null;
    @property(Node)
    public content = null;
    private vo = null;
    onLoad() {
        this.vo = {};
        this.getAwardRecordData();
    }

    onClick() {
        this.receiveAward();
    }

    addRecordChild(data: any) {
        const prefab = instantiate(this.item);
        if (prefab) {
            const item = prefab.getComponent("GiftExchangeItem");
            if (item) {
                item.data = data;
                this.content.node.addChild(item);
            }
        }
    }

    getAwardRecordData() {
        const self = this;
        let params = {
            pageSize: 1,
            pageNo: 1,
            startDate: null,
            endDate: null
        }


        App.HttpUtils.sendPostRequest("GetRedpagePageList", params, (error: any, response: any) => {
            if (error) {
                console.error(error);
            } else {
                console.log("响应结果:", response);
                if (response.code == 0 && response.msg == "Succeed") {
                    self.vo = new GiftExchangeVo(response.data);
                    self.vo.getList && self.vo.getList.forEach(el => {
                        self.addRecordChild(el);
                    });
                } else {
                    App.AlertManager.showFloatTip(response.msg);
                }
            }
        });

    }

    receiveAward() {
        const self = this;
        let params = {
            giftCode: this.codeEditBox.string
        }

        App.HttpUtils.sendPostRequest("ConversionRedpage", params, (error: any, response: any) => {
            if (error) {
                console.error(error);
            } else {
                console.log("响应结果:", response);
                if (response.code == 0 && response.msg == "Succeed") {
                    self.addRecordChild(response.data);
                } else {
                    App.AlertManager.showFloatTip(response.msg);
                }
            }
        });

    }

}

