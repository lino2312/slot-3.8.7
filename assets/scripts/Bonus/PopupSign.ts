import { _decorator, Component, Label, Node } from 'cc';
import { App } from '../App';
const { ccclass, property } = _decorator;

@ccclass('popupSign')
export class popupSign extends Component {
    @property(Node)
    signNode: Node | null = null;

    private datasource: any = null;
    private price: number = 0;

    onLoad() {
        const self = this;

        // 请求签到奖励数据
        App.HttpUtils.sendPostRequest("GetContinuousSignInRecharges", {}, (error: any, response: any) => {
            if (error) {
                console.error(error);
                return;
            }

            console.log("获取到的数据:", response);
            self.datasource = response.data;

            if (self.datasource && self.signNode) {
                for (let i = 0; i < self.signNode.children.length; i++) {
                    const element = self.datasource.signInRechargesList[i];
                    const item = self.signNode.children[i];
                    item.active = !!element;

                    if (element) {
                        const icon = item.getChildByName("lbl_val")?.getComponent(Label);
                        if (icon) icon.string = element.bouns;
                        self.onUpdataItem(item, i);
                    }
                }
            }
        });

        // 原来的充值记录逻辑（保留）
        /*
        cc.vv.ApiMgr.getRechargeRecord(1, 1, 1000, function (data) {
            console.log(data.list)
            self.price = data.list.reduce((sum, element) => sum + Number(element.price), 0);
            for (let i = 0; i < self.signNode.children.length; i++) {
                const item = self.signNode.children[i];
                self.onUpdataItem(item, i);
            }
        });
        */
    }

    onUpdataItem(item: Node, index: number) {
        if (!this.datasource) return;

        const signInRechargesList = this.datasource.signInRechargesList[index];
        const signIn = this.datasource.signIn;

        const node_vip_lock = item.getChildByName("node_vip_lock");
        if (node_vip_lock) node_vip_lock.active = false; // signInRechargesList.amount > this.price;

        const icon_ok = item.getChildByName("icon_ok");
        if (icon_ok) icon_ok.active = signIn.signCount >= signInRechargesList.day;

        const light = item.getChildByName("light");
        if (light) light.active = signIn.signCount == 0 ? index == 0 : signIn.signCount == index;
    }

    onClickItem(event: Event) {
        // if(event){
        //     const toggle = event.target.getComponent(cc.Toggle);
        //     if (!toggle || !toggle.isChecked) return;
        // }
        if (!this.datasource || !this.signNode) return;

        const self = this;
        const url2 = "SetContinuousSinIn";

        App.HttpUtils.sendPostRequest(url2, {}, (error: any, response: any) => {
            if (error) {
                console.error(error);
                return;
            }
            if (response.code == 0 && response.msg == "Succeed") {
                const item = self.signNode.children[self.datasource.signIn.signCount];
                if (item) {
                    const icon_ok = item.getChildByName("icon_ok");
                    if (icon_ok) icon_ok.active = true;

                    const light = item.getChildByName("light");
                    if (light) light.active = false;
                }
            } else {
                App.AlertManager.showFloatTip(response.msg);
            }
        });
    }
}
