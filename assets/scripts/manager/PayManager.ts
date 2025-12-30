import { init } from "db://i18n/LanguageData";
import { App } from "../App";
import { Config } from "../config/Config";
import { sys } from "cc";

export class PayManager {
    private static _instance: PayManager = null;
    private localPrices: any;
    public static getInstance(): PayManager {
        if (this._instance == null) {
            this._instance = new PayManager();
        }
        return this._instance;
    }


    public init() {
        this.registerAllMsg();
    }

    registerAllMsg() {
        //注册sdk支付回调
        App.NetManager.registerMsg(App.MessageID.PURCHASE_CHECK_ORDER,this.onRcvMsgCheckOrder.bind(this));
        //获取订单
        App.NetManager.registerMsg(App.MessageID.PURCHASE_GET_ORDER, this.onRcvNetGetChargeOrder, this);

        App.PlatformApiMgr.addCallback(this.paySdkCallback.bind(this), "paySdkCallback")
        App.PlatformApiMgr.addCallback(this.onPaymentErrorCallback.bind(this), "PaymentErrorCallback");
        App.PlatformApiMgr.addCallback(this.queryAllSKUCallback.bind(this), "queryAllSKUCallback");
        if (App.DeviceUtils.isArabHero()) {
            App.PlatformApiMgr.addCallback(this.onBillingSetupFinished.bind(this), "onBillingSetupFinished");
            // App.PlatformApiMgr.addCallback(this.onGooglePayInfoToJS.bind(this), "onGooglePayInfoToJS");
        }
    }

    // 支付报错
    onPaymentErrorCallback(dataDic: any) {
        if (dataDic.code == "0") {
            App.EventUtils.dispatchEvent(App.EventID.PAY_RESULT, 0);
            App.AlertManager.getLoadingTip().hideAll();
            if (dataDic.errCode == 18) {
                //用户取消支付
            } else {
                let str = dataDic.msg
                // ___("Purchase Cancelled");
                // ___("Billing service DisConnected");
                // ___("Unsuccessful Purchase \nUnknown error");
                // ___("Unsuccessful Purchase \nVerification failed");
                // ___("Unsuccessful Purchase \niTunes Store verification failed");
                // ___("Unsuccessful Purchase \nCannot connect to iTunes Store");
                // ___("Unsuccessful Purchase \nThe product cannot be purchased");
                if (str.indexOf("Item is not owned by the user") == -1) {
                    // App.AlertManager.getLoadingTip().showWithTip(str);
                    App.AlertManager.getCommonAlert().showWithoutCancel(str);
                    // cc.vv.LoadingTip.hide(0.1, true);
                    // cc.vv.AlertView.showTips(___(str), () => {
                    //     cc.vv.LoadingTip.hide(0.1, true);
                    // });
                } else {

                }
            }
        }
        else if (dataDic.code == "100") {
            //支付连接成功
        }
    }

    // 下单
    reqPurchaseOrder(goodsId) {
        let self = this
        // cc.vv.LoadingTip.showAndClose(cc.vv.Language.Purchasing);
        //下单打点
        let eventval = {
            "$Revenue": 0,
            "$CurrName": "SAR",
            "$TransactionId": 0,
            "$RoleName": App.userData().nickName,
            "$Vouchers": "0",
            "$MaterialSlot": "0",
            "$MaterialName": "0",
            "$Keywords": goodsId,
            "$Content": "0",
            "$PromotionName": "0",
            "$Medium": "SHOP",
            "$Source": "0",
            "$Voucher": "0",
            "$Class": "0",
            "$EndDate": sys.now(),
            "$BeginDate": sys.now(),
            "$Destination": "0",
            "$OriginatingPlace": "0",
            "$PassengersNumber": "0",
            "$BookingRooms": "0",
            "$BookingDays": "0",
        }

        let sureCall = function () {
            var req: any = { c: App.MessageID.PURCHASE_GET_ORDER };
            req.id = goodsId;
            req.appId = Config.appId
            var plat = 0;
            if (App.DeviceUtils.isAndroid()) {
                plat = 1;
            }
            else if (App.DeviceUtils.isIOS()) {
                plat = 2;
            }
            if (App.DeviceUtils.isBrowser()) {
                plat = 3; //网页下单
            }
            if (Config.isSingleVersion) {
                req.view = 1;
            }
            req.platform = plat;
            req.version = App.PlatformApiMgr.getAppVersion();
            App.NetManager.send(req);
        }
        sureCall()
    }


    // 下单成功
    onRcvNetGetChargeOrder(msg) {
        if (msg.code === 200) {
            if (App.DeviceUtils.isBrowser()) {
                //h5直接跳转
                var url = msg.paymentUrl;
                //window.location.href=url    //同窗口打开
                window.open(url);   //新窗口打开
            }
            else {
                // cc.vv.LoadingTip.show(cc.vv.Language.Purchasing, true);
                //获取到订单号
                let data = {} as any;
                data.Pid = msg.productid;
                data.OrderId = msg.orderid; //订单号这个到时候回从服务器获取
                if (App.DeviceUtils.IsHuawei()) {
                    data.rolename = App.userData().nickName;
                    data.rolelv = App.userData().level;
                }
                App.PlatformApiMgr.SdkPay(JSON.stringify(data));

                this.saveOrderInfo(msg.productid, msg.orderid);
            }
        }
        else {
            App.AlertManager.getLoadingTip().hideAll();
        }
    }

    //查看可售商品详细
    //需要在各自项目中配置Global.pid_cfg数据。为字符串数组：["com.rummyfree.7","com.rummyfree.8"]
    //google会在连接成功后调用,iOS的话可初始化直接调用
    queryAllSKUByProductids(pids) {
        if (!!pids) {
            let data = {} as any;
            data.Pids = pids;
            App.PlatformApiMgr.SdkQueryAllSKU(JSON.stringify(data))
        }
    }

    //sdk充值完成，发送协议给服务端校验
    sendCheckOrder(data) {
        App.AlertManager.getLoadingTip().hideAll();
        var req = null
        if (App.DeviceUtils.isAndroid()) {
            //google pay 回调
            var strResult = data.result;
            if (strResult === "1") {
                var msg = data.message;
                var sign = data.signature;
                var pid = data.pid;
                req = { c: App.MessageID.PURCHASE_CHECK_ORDER }
                // 如果有透传orderid，就用透传的，没有就用自己生成的
                if (data.orderid) {
                    req.orderid = data.orderid;
                } else {
                    req.orderid = this.getOrderId(pid);
                }
                req.platform = 1;
                req.data = msg;
                req.sign = sign;
            }
            else {
                //支付异常
                var strErr = data.errInfo;
                App.AlertManager.getLoadingTip().showWithTip(strErr);
                App.EventUtils.dispatchEvent(App.EventID.PAY_RESULT, 0);
            }
        }
        else if (App.DeviceUtils.isIOS()) {
            //apple pay 回调
            var receipt = data.receipt
            var orderid = data.orderid

            req = { c: App.MessageID.PURCHASE_CHECK_ORDER }
            req.orderid = orderid
            req.platform = 2
            req.data = receipt
            req.sign = ''
        }

        if (req) {
            req.appId = Config.appId
            if (Config.isSingleVersion) {
                req.view = 1;
            }
            App.NetManager.send(req)
        }
    }

    // 支付连接成功
    onBillingSetupFinished() {
        // 连接成功后 进行商品更新
        let productIds = App.userData().productids;
        if (productIds) {
            this.queryAllSKUByProductids(productIds);
        }
    }

    //sdk支付回调
    paySdkCallback(data) {
        console.log("支付成功回调服务端:" + JSON.stringify(data))
        this.sendCheckOrder(data);
    }

    queryAllSKUCallback(data) {
        let details = data.price_detail
        if (details) {
            this.localPrices = details
        }
    }

    /**
         * 
         * @param {string} pid 获取当地显示价格 
         * @return {string} 显示价格,带了当地货币符号的.需要判断返回值,如果为假,则用默认价格表示形式
         */
    getLocalPrice(pid) {
        let res = null
        if (this.localPrices) {
            for (let i = 0; i < this.localPrices.length; i++) {
                let item = this.localPrices[i]
                if (item.pid == pid) {
                    res = item.price
                    break;
                }
            }
        }
        return res
    }

    //补单
    doReplaceOrder() {
        var self = this
        if (App.DeviceUtils.isIOS()) {
            App.PlatformApiMgr.addCallback(self.paySdkReplacementCallback.bind(this), "paySdkReplacementCallback")
            var data = "abc"//空的字符
            App.PlatformApiMgr.SdkReplaceOrder(data)
        }
        else if (App.DeviceUtils.isAndroid()) {
            if (App.DeviceUtils.IsHuawei()) {
                if (!App.PlatformApiMgr.isHuaweiServerAvailble()) {
                    return
                }
            }
            App.PlatformApiMgr.GPCheckUnComsumerOrder();
        }
    }

    //支付校验成功
    onRcvMsgCheckOrder(msg) {
        if (msg.code === 200) {
            App.EventUtils.dispatchEvent(App.EventID.PAY_RESULT, 1)
            if (App.DeviceUtils.isIOS()) {
                //删除订单缓存
                var data = {} as any;
                data.Flag = msg.flag
                data.OrderId = msg.orderid
                App.PlatformApiMgr.SdkDelOrderCache(JSON.stringify(data));
            }
            else if (App.DeviceUtils.isAndroid()) {
                //消耗产品
                let token = msg.purchaseTokenData
                let bHuawei = App.DeviceUtils.IsHuawei()
                if (bHuawei) {
                    App.PlatformApiMgr.doHuaweiPayComsumerOrder(token)
                }
            }
        }
    }

    //补单回调
    paySdkReplacementCallback(data) {
        var self = this
        self.sendCheckOrder(data)
    }

    //考虑补单问题，android不能透传
    //自己存一份
    saveOrderInfo(productid, orderid) {
        let orderData = JSON.parse(App.StorageUtils.getLocal("PURCHASE_ORDER_DATA", "{}"));
        let curOrderList = orderData[productid] || [];
        curOrderList.push(orderid);
        orderData[productid] = curOrderList;
        App.StorageUtils.saveLocal("PURCHASE_ORDER_DATA", JSON.stringify(orderData));
    }

    getOrderId(productid) {
        let orderData = JSON.parse(App.StorageUtils.getLocal("PURCHASE_ORDER_DATA", "{}"));
        let curOrderList = orderData[productid];
        if (curOrderList && curOrderList.length > 0) {
            let orderId = curOrderList.pop();
            orderData[productid] = []; //清空
            App.StorageUtils.saveLocal("PURCHASE_ORDER_DATA", JSON.stringify(orderData));
            return orderId;
        }
        else {
            console.warn("没有找到" + productid + "对应订单");
        }
    }
}