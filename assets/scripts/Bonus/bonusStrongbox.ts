import { _decorator, Component, EditBox, instantiate, Label, Node, Sprite } from 'cc';
import { App } from '../App';
import { PopUpAnimType } from '../component/PopupComponent';
const { ccclass, property } = _decorator;

@ccclass('bonusStrongbox')
export class bonusStrongbox extends Component {
    @property(Label)
    public dayShareRate = null;
    @property(Label)
    public safeAmount = null;
    @property(Label)
    public userDayShareRate = null;
    @property(Label)
    public safeTotalAmount = null;
    @property(Label)
    public safeEarnings = null;
    @property(Label)
    public addTime = null;
    @property(Label)
    public amount = null;
    @property(Label)
    public dayShareRate2 = null;
    @property(Label)
    public earnings = null;
    @property(Label)
    public orderNum = null;
    @property(Node)
    public list1Node = null;
    @property(Node)
    public list2Node = null;
    @property(Node)
    public list2List = null;
    @property(Node)
    public list2Item = null;
    @property(Node)
    public list3Node = null;
    @property(Node)
    public list3OutNode = null;
    @property(Node)
    public list3InNode = null;
    @property(Label)
    public outLbl1 = null;
    @property(EditBox)
    public outEditbox = null;
    @property(Label)
    public outLbl2 = null;
    @property(Label)
    public outLbl3 = null;
    @property(Label)
    public outLbl4 = null;
    @property(Label)
    public outLbl5 = null;
    @property(Label)
    public inLbl1 = null;
    @property(Label)
    public inLbl2 = null;
    @property(Label)
    public inLbl3 = null;
    @property(Label)
    public inLbl4 = null;
    @property(EditBox)
    public inEditbox = null;
    @property(Node)
    public classList = null;
    @property(Node)
    public classItem = null;
    @property(Label)
    public dateLbl = null;
    @property(Label)
    public jinduLbl = null;
    @property(Sprite)
    public jinduSp = null;
    @property(Node)
    public list4 = null;
    @property(Label)
    public biaoti1 = null;
    @property(Node)
    public logTop = null;
    private dateObj: any = {};
    private additionalParams: any = {};
    onLoad() {
        var self = this;
        App.HttpUtils.sendPostRequest("GetSafeInfo", "", (error: any, response: any) => {
            if (error) {
                console.error(error);
            } else {


                console.log("保险箱:", response.data);
                if (response.code == 0 && response.msg == "Succeed") {
                    self.dayShareRate.string = "Interst Rate " + (response.data.dayShareRate * 100).toFixed(2) + '%';
                    self.safeAmount.string = response.data.safeTotalAmount ?? 0;
                    self.userDayShareRate.string = "My interest rate " + (response.data.userDayShareRate * 100).toFixed(2) + '%';
                    self.safeTotalAmount.string = response.data.safeAmount ?? 0;
                    self.safeEarnings.string = response.data.safeEarnings ?? 0;
                    self.outLbl1.string = response.data.shareAmount;
                    self.outLbl2.string = response.data.safeAmount;
                    self.jinduLbl.string = Math.floor(response.data.safeAmount / 100);
                    self.outLbl4.string = (response.data.userDayShareRate * 100).toFixed(2) + '%';
                    self.outLbl5.string = response.data.safeEarnings ?? 0;
                    self.inLbl1.string = response.data.shareAmount;
                } else {
                    App.AlertManager.showFloatTip(response.msg);
                }
            }
        });

        let additionalParams = {
            pageNo: 1,
            pageSize: 100,
        };
        App.HttpUtils.sendPostRequest("GetSafeList", additionalParams, (error: any, response: any) => {
            if (error) {
                console.error(error);
            } else {
                console.log("保险箱记录:", response.data);
                if (response.code == 0 && response.msg == "Succeed") {
                    if (response.data.list.length > 0) {
                        let jilu1 = response.data.list[0];
                        self.addTime.string = jilu1.addTime;
                        self.amount.string = jilu1.amount;
                        self.dayShareRate2.string = (jilu1.dayShareRate * 100).toFixed(2) + '%';
                        self.earnings.string = jilu1.earnings;
                        self.orderNum.string = jilu1.orderNum;
                        self.biaoti1.string = jilu1.type == 18 ? "Transfet In" : "Transfet out";
                    }
                } else {
                    App.AlertManager.showFloatTip(response.msg);
                }
            }
        });


        let moneyData = [2, 5, 10, 50, 100, 200, 500, 1000];
        self.classList.removeAllChildren();
        for (let i = 0; i < moneyData.length; i++) {
            let item = instantiate(self.classItem);
            item.name = moneyData[i] + '';
            item.children[1].getComponent(Label).string = moneyData[i];
            item.parent = self.classList
            item.active = true;
        }
    }

    onClass(event: any) {
        var self = this
        let node = event.currentTarget;
        this.inEditbox.string = node.name;
        this.inLbl4.string = (parseFloat(node.name) * 100).toFixed(2);
    }

    sliderCall(slider: any, customEventData: any) {
        this.outEditbox.string = Math.floor(slider.progress * this.jinduLbl.string);
        this.jinduSp.fillRange = slider.progress;
        this.outLbl3.string = parseInt(this.outEditbox.string) * 100;
    }

    List4OpenOrClose() {
        if (this.list4.active) {
            this.list4.active = false;
        } else {
            this.list4.active = true;
        }
    }

    List2OpenOrClose() {
        this.list2Node.active = !this.list2Node.active;
        this.list1Node.active = !this.list2Node.active;
        this.list2List.children.length && this.list2List.removeAllChildren();
        if (this.list2Node.active) {
            var today = new Date();
            this.dateObj = {
                year: today.getFullYear(),
                month: today.getMonth() + 1,
                // day: today.getDate()
            };
            this.dateLbl.string = this.dateObj.year + ' Year ' + this.dateObj.month + " Month";
            this.additionalParams = {
                pageNo: 1,
                pageSize: 999,
                month: this.dateObj.year + '-' + this.dateObj.month,
            };
            this.onGetSafeLogList()
        }
    }

    OutOrIn(e: any, id: any) {
        var self = this;
        this.list3Node.active = true;
        if (id == 0) {
            this.list3OutNode.active = true;
            this.list3InNode.active = false;
        } else {

            App.HttpUtils.sendPostRequest("GetSafeList", "", (error: any, response: any) => {
                if (error) {
                    console.error(error);
                } else {
                    if (response.code == 0 && response.msg == "Succeed") {
                        self.inLbl2.string = response.data.balance ?? 0;
                        self.inLbl3.string = response.data.amountOfCode ?? 0;
                    } else {
                        App.AlertManager.showFloatTip(response.msg);
                    }
                }
            });
            this.list3OutNode.active = false;
            this.list3InNode.active = true;
        }
    }

    closeList3() {
        this.list3Node.active = false;
    }

    outMoney() {
        this.outLbl3.string = parseInt(this.outEditbox.string) * 100;
    }

    inMoney() {
        this.inLbl4.string = (parseFloat(this.inEditbox.string) * 100).toFixed(2)
    }

    clickOutSub() {
        var self = this;
        let additionalParams = {
            amount: parseInt(this.outLbl3.string)
        };

        App.HttpUtils.sendPostRequest("SetSafeBack", additionalParams, (error: any, response: any) => {
            if (error) {
                console.error(error);
            } else {
                if (response.code == 0 && response.msg == "Succeed") {
                    self.closeList3();
                    self.onLoad();
                    App.AlertManager.showFloatTip(response.msg);
                    this.getBalance();
                } else {
                    App.AlertManager.showFloatTip(response.msg);
                }
            }
        });

    }

    clickInSub() {
        var self = this;
        let additionalParams = {
            amount: parseFloat(this.inLbl4.string).toFixed(2)
        };

        App.HttpUtils.sendPostRequest("SetSafeInto", additionalParams, (error: any, response: any) => {
            if (error) {
                console.error(error);
            } else {
                if (response.code == 0 && response.msg == "Succeed") {
                    self.closeList3();
                    self.onLoad();
                    App.AlertManager.showFloatTip(response.msg);
                    this.getBalance();

                } else {
                    App.AlertManager.showFloatTip(response.msg);
                }
            }
        });


    }

    async getBalance() {
        const data = await App.ApiManager.getBalance();
        App.userData().userInfo.amount = data.amount;
        App.EventUtils.dispatchEvent(App.EventID.UPATE_COINS);
    }


    async selectDate() {
        var self = this;
        const params = {
            cb: (newDate: { year: number; month: number; day: number }) => {
                this.dateObj = newDate;
                this.dateLbl.string = this.dateObj.year + ' Year ' + this.dateObj.month + " Month";
                self.additionalParams.month = newDate.year + "-" + newDate.month;
                self.onGetSafeLogList()
            },
            dateObj: { type: 0, year: this.dateObj.year, month: this.dateObj.month }
            // dateObj: this.dateObj as SelectDateObj
        };
        App.PopUpManager.allowMultiple = true;
        App.PopUpManager.addPopup("prefabs/popup/popupSelectDate", "hall", params, false,
            null, PopUpAnimType.fromBottom, PopUpAnimType.fromBottom);
    }


    onDestroy() {
        App.EventUtils.dispatchEvent(App.EventID.UPATE_SAFE);
    }

    onClickBack() {
        App.PopUpManager.closePopup(this.node, PopUpAnimType.normal);
    }

    onGetSafeLogList() {
        const self = this;
        App.HttpUtils.sendPostRequest("GetSafeLogList", self.additionalParams, (error: any, response: any) => {
            if (error) {
                console.error(error);
            } else {

                console.log("保险箱记录:", response.data);
                if (response.code == 0 && response.msg == "Succeed") {
                    self.list2List.removeAllChildren();
                    if (response.data.list.length > 0) {
                        let iOut = 0;
                        let iIn = 0;
                        let income = 0;
                        let data = response.data.list;
                        for (let i = 0; i < data.length; i++) {
                            let item = instantiate(self.list2Item);
                            item.children[0].getComponent(Label).string = data[i].type == 18 ? "Transfet In" : "Transfet out";
                            item.children[3].getComponent(Label).string = data[i].amount;
                            item.children[4].getComponent(Label).string = (data[i].dayShareRate * 100).toFixed(2) + '%';
                            item.children[5].getComponent(Label).string = data[i].earnings;
                            item.children[6].getComponent(Label).string = data[i].orderNum;
                            item.children[7].getComponent(Label).string = data[i].addTime;
                            item.parent = self.list2List;
                            item.active = true;
                            if (data[i].type == 18) {
                                iIn = iIn + data[i].amount;
                            } else {
                                iOut = iOut + data[i].amount;
                            }
                            income = income + data[i].earnings;
                        };
                        self.logTop.children[1].getComponent(Label).string = iIn;
                        self.logTop.children[2].getComponent(Label).string = iOut;
                        self.logTop.children[3].getComponent(Label).string = income;
                    };
                } else {
                    App.AlertManager.showFloatTip(response.msg);
                };
            }
        });

    }

}

