/*
** 平台API
** 主要是用到android、ios的系统接口，通过这里来转化
** Android: int(I) float(F) boolean(Z) string(Ljava/lang/String;)
** IOS中参数：NSNumber(float,int) BOOL(bool) NSString(string)
*/
/*以下是平台接口实现*/
/*==============================================================================*/

import { macro, native, screen, sys, view } from "cc";
import { Config } from "../config/Config";
import { App } from "../App";
import { StorageUtils } from "../utils/StorageUtils";

//获取app版本号
export class PlatformApiManager {
    private static _instance: PlatformApiManager = null;
    cbDataList: any;

    public static getInstance(): PlatformApiManager {
        if (this._instance == null) {
            this._instance = new PlatformApiManager();
        }
        return this._instance;
    }

    private orientation: string = Config.APP_ORIENTATION; //默认竖屏
    private backPressedCall: Function = null; //返回键回调
    callbackDic: any;
    private IOS_CLASS_NAME = 'PlatformIosApi'; //ios类名
    private AND_CLASS_NAME = 'com/cocos/game/PlatformAndroidApi'; //android类名
    private constructor() {
        this.init();
    }
    private init() {
        let self = this;
        if (sys.os === 'Android') {
            //手势操作的返回
            let backCall = function () {
                if (self.backPressedCall) {
                    self.backPressedCall();
                }
            };
            this.addCallback(backCall, "BackPressedCallback");
        }
    }

    /*以下是平台接口实现*/
    /*==============================================================================*/
    //获取app版本号
    getAppVersion() {
        if (App.DeviceUtils.isNative()) {
            return this.callPlatformApi('getAppVersion', '()Ljava/lang/String;');
        }
        else {
            console.warn('Browser call Function [getAppVersion]');
            return '1.0.0';
        }
    }

    restartApp() {
        if (App.DeviceUtils.isNative()) {
            return this.callPlatformApi('restartApp', '()V');
        }
        else {
            console.warn('Browser call Function [restartApp]');
            return '1.0.0';
        }
    }

    //获取剪切板文本
    getTxtFromClipboard() {
        if (App.DeviceUtils.isNative()) {
            return this.callPlatformApi('getTxtFromClipboard', '()Ljava/lang/String;');
        }
        else {
            console.warn('Browser call Function [getTxtFromClipboard]');
            return '';
        }
    }

    //设置文本到剪切板
    setTxtToClipboard(txtStr: string) {
        if (App.DeviceUtils.isNative()) {
            this.callPlatformApi('setTxtToClipboard', '(Ljava/lang/String;)V', txtStr);
        }
        else {
            this.webCopyString(txtStr);
        }
    }

    webCopyString(txtStr: string) {
        var input = txtStr + '';
        const el = document.createElement('textarea');
        el.value = input;
        el.setAttribute('readonly', '');
        el.style.position = 'absolute';
        el.style.left = '-9999px';
        el.style.fontSize = '12pt'; // Prevent zooming on iOS

        const selection = getSelection();
        var originalRange = null;
        if (selection.rangeCount > 0) {
            originalRange = selection.getRangeAt(0);
        }
        document.body.appendChild(el);
        el.select();
        el.selectionStart = 0;
        el.selectionEnd = input.length;

        var success = false;
        try {
            success = document.execCommand('copy');
        } catch (err) { }

        document.body.removeChild(el);

        if (originalRange) {
            selection.removeAllRanges();
            selection.addRange(originalRange);
        }

        return success;
    }

    //打开app的url数据
    getOpenAppUrlDataStr() {
        if (App.DeviceUtils.isNative() && sys.isMobile) {
            return this.callPlatformApi('getOpenAppUrlDataString', '()Ljava/lang/String;');
        }
        else {
            if (sys.isBrowser) {
                console.warn('Browser call Function [getOpenAppUrlDataStr]');
            }
            return null;
        }
    }

    clearOpenAppUrlDataStr() {
        if (App.DeviceUtils.isNative()) {
            this.callPlatformApi('clearOpenAppUrlDataString', '()V');
        }
        else {
            console.warn('Browser call Function [clearOpenAppUrlDataStr]');
        }
    }

    openRating() {
        if (App.DeviceUtils.isNative()) {
            return this.callPlatformApi('openRating', '()Z');
        }
        else {
            console.warn('Browser call Function [openRating]');
            return false;
        }
    }

    //应用内评分
    loadReview() {
        if (App.DeviceUtils.isAndroid()) {
            this.callPlatformApi('loadReviewComment', '()V');
        }
        else {
            this.openRating();
        }
    }

    //设置返回按钮触发函数
    setBackPressCall(call: Function) {
        this.backPressedCall = call;
    }

    getBatteyLevel() {
        if (App.DeviceUtils.isNative()) {
            return this.callPlatformApi('getBatteyLevel', '()F');
        }
        else {
            console.warn('Browser call Function [getBatteyLevel]');
        }
    }

    //网页跳转
    openURL(urlStr: string) {
        if (App.DeviceUtils.isNative()) {
            this.callPlatformApi('openURL', '(Ljava/lang/String;)V', urlStr);
        }
        else {
            sys.openURL(urlStr);
        }
    }

    //打电话
    callPhone(phonenum: string) {
        if (App.DeviceUtils.isNative()) {
            this.callPlatformApi('callPhone', '(Ljava/lang/String;)V', phonenum);
        }
    }

    // 获取游戏包名
    getPackageName() {
        if (App.DeviceUtils.isNative()) {
            return this.callPlatformApi("getAPPBundleId", "()Ljava/lang/String;");
        }
        else {
            return "";
        }
    }

    //sdk登录
    fbLogin(callback: Function) {
        if (App.DeviceUtils.isNative()) {
            this.callPlatformApi('fbSdkLogin', '()V');
            this.addCallback(callback, 'fbLoginCb');
        }
        else {
            console.warn('Browser call Function [SdkLogin]');
        }
    }

    //sdk登出
    fbLoginOut() {
        if (App.DeviceUtils.isNative()) {
            this.callPlatformApi('fbSdkLoginOut', '()V');
        }
        else {
            console.warn('Browser call Function [SdkLoginOut]');
        }
    }

    //facebook sdk分享
    fbShare(data: string, callback: any) {
        if (App.DeviceUtils.isNative()) {
            this.callPlatformApi('fbSdkShare', '(Ljava/lang/String;)V', data);
            this.addCallback(callback, 'shareSdkCallback');
        }
        else {
            console.warn('Browser call Function [SdkShare]');
        }
    }

    //打开FB
    OpenFB(data: string) {
        if (App.DeviceUtils.isNative()) {
            return this.callPlatformApi('OpenFB', '(Ljava/lang/String;)Z', data);
        }
        else {
            console.warn('Browser call Function [OpenFB]');
        }
    }

    //应用内好友
    FBFriendsInApp(callBack: Function) {
        if (App.DeviceUtils.isNative()) {
            this.callPlatformApi('FbFriendsInApp', '()V');
            this.addCallback(callBack, 'FbFriendsInAppCallback');
        }
        else {
            console.warn('Browser call Function [SdkShare]');
        }
    }

    //是否安装FB app
    isInstallFBApp() {
        if (App.DeviceUtils.isNative()) {
            return this.callPlatformApi('isInstallFB', '()I');
        }
        else {
            console.warn('Browser call Function [isInstallFB]');
        }
    }

    // 查询所有可售物品
    SdkQueryAllSKU(data: any) {
        if (App.DeviceUtils.isNative()) {
            this.callPlatformApi('queryAllSKU', '(Ljava/lang/String;)V', data);
        } else {
            console.warn('Browser call Function [SdkQueryAllSKU]');
        }
    }

    // 主动连接Google支付服务器
    startConnectBillingService(data: any) {
        if (App.DeviceUtils.isNative()) {
            if (App.DeviceUtils.isAndroid()) {
                this.callPlatformApi('startConnectBillingService', '()V');
            }
        }
    }

    // Sdk支付
    SdkPay(data: any, callback: Function = null) {
        if (App.DeviceUtils.isNative()) {
            let funName = "SdkPay";
            if (App.DeviceUtils.isIOS()) {
                funName = "IosZF";
            }
            this.callPlatformApi(funName, '(Ljava/lang/String;)V', data);
        } else {
            console.warn('Browser call Function [IosZF]');
        }
    }

    // 删除订单缓存
    SdkDelOrderCache(data: any) {
        if (App.DeviceUtils.isNative()) {
            let funName = "SdkPayResult";
            if (App.DeviceUtils.isIOS()) {
                funName = "IosZFResult";
            }
            this.callPlatformApi(funName, '(Ljava/lang/String;)V', data);
        } else {
            console.warn('Browser call Function [SdkDelOrderCache]');
        }
    }

    // 尝试补单
    SdkReplaceOrder(data: any) {
        if (App.DeviceUtils.isNative()) {
            let funName = "SdkPayReplacement";
            if (App.DeviceUtils.isIOS()) {
                funName = "IosZFReplacement";
            }
            this.callPlatformApi(funName, '(Ljava/lang/String;)V', data);
        } else {
            console.warn('Browser call Function [SdkReplaceOrder]');
        }
    }

    // 获取firebase推送的token标志
    GetFMCToken() {
        if (App.DeviceUtils.isAndroid()) {
            return this.callPlatformApi("getFMCToken", "()Ljava/lang/String;");
        }
    }

    ReGetFMCToken() {
        if (App.DeviceUtils.isAndroid()) {
            this.callPlatformApi('reGetFMCToken', '()V');
        }
    }

    // 获取渠道信息
    GetChannelStr() {
        if (App.DeviceUtils.isAndroid()) {
            return this.callPlatformApi("getChannelstr", "()Ljava/lang/String;");
        } else {
            if (!App.DeviceUtils.isNative()) {
                var url = location.search;
                var theRequest: any = {};
                if (url.indexOf("?") != -1) {
                    var str = url.substr(1);
                    var strs = str.split("&");
                    for (var i = 0; i < strs.length; i++) {
                        theRequest[strs[i].split("=")[0]] = unescape(strs[i].split("=")[1]);
                    }
                }
                return theRequest["code"];
            }
            console.warn('Browser call Function [getChannelstr]');
        }
    }

    setFacebookPixelParam(pixelId: string, accessToken: string) {
        if (App.DeviceUtils.isNative()) {
            let paramStr = `${pixelId}|${accessToken}`;
            console.log(paramStr, "===paramStr");
            this.callPlatformApi('setFacebookParam', '(Ljava/lang/String;)V', paramStr);
        }
    }

    systemShare(data: any) {
        if (App.DeviceUtils.isNative()) {
            return this.callPlatformApi('systemShare', '(Ljava/lang/String;)V', data)
        }
        else {
            console.warn('Browser call Function [systemShare]');
        }
    }

    // 获取FB pixel信息
    GetFBParam() {
        if (App.DeviceUtils.isAndroid()) {
            return this.callPlatformApi("getFBParam", "()Ljava/lang/String;");
        } else {
            return null;
        }
    }

    // 获取FB pixel信息
    domainurlAndInvitecode() {
        if (App.DeviceUtils.isAndroid()) {
            return this.callPlatformApi("domainurlAndInvitecode", "()Ljava/lang/String;");
        } else {
            return null;
        }
    }

    getPixelId() {
        if (App.DeviceUtils.isAndroid()) {
            return this.callPlatformApi("getPixelId", "()Ljava/lang/String;");
        } else {
            return null;
        }
    }

    // 获取渠道扩张信息
    GetChannelExStr() {
        if (App.DeviceUtils.isAndroid()) {
            return this.callPlatformApi("getChannelExStr", "()Ljava/lang/String;");
        } else {
            console.warn('Browser call Function [getChannelExStr]');
        }
    }

    // 复制内容
    Copy(data: string) {
        this.setTxtToClipboard(data);
    }

    // 从粘贴板获取内容
    Paste() {
        return this.getTxtFromClipboard();
    }

    // 保存图片到相册
    SaveToAlumb(file: string) {
        if (App.DeviceUtils.isNative()) {
            return this.callPlatformApi('SaveToAlumb', '(Ljava/lang/String;)I', file);
        } else {
            console.warn('Browser call Function [SaveToAlumb]');
        }
    }

    // 保存http图片到相册
    SaveUrlToAlumb(file: string) {
        if (App.DeviceUtils.isNative()) {
            return this.callPlatformApi('SaveUrlToAlumb', '(Ljava/lang/String;)I', file);
        } else {
            console.warn('Browser call Function [SaveUrlToAlumb]');
        }
    }

    // 获取唯一的设备id
    getDeviceId() {
        if (App.DeviceUtils.isNative()) {
            return this.callPlatformApi('getDeviceId', '()Ljava/lang/String;');
        } else {
            const key = 'browser_uuid';
            let uuid = StorageUtils.getLocal(key);
            if (!uuid) {
                uuid = this.generateUUID();
                StorageUtils.saveLocal(key, uuid);
            }
            return uuid;
        }
    }

    // 获取GSF ID
    getGSFId() {
        if (App.DeviceUtils.isAndroid()) {
            return this.callPlatformApi('getGSFId', '()Ljava/lang/String;');
        }
    }

    // 获取simcard id
    getSimcardid() {
        if (App.DeviceUtils.isAndroid()) {
            return this.callPlatformApi('getSimacardid', '()Ljava/lang/String;');
        }
    }

    // Returns the MCC+MNC
    getSimOperator() {
        if (App.DeviceUtils.isAndroid()) {
            return this.callPlatformApi('getSimOperator', '()Ljava/lang/String;');
        }
    }

    requestContracts() {
        if (App.DeviceUtils.isAndroid()) {
            return this.callPlatformApi('requestContracts', '()V');
        }
    }

    getContracts() {
        if (App.DeviceUtils.isAndroid()) {
            return this.callPlatformApi('getContracts', '()Ljava/lang/String;');
        }
    }

    // 获取设备品牌
    getDeviceBrand() {
        if (App.DeviceUtils.isNative()) {
            return this.callPlatformApi('getDeviceBrand', '()Ljava/lang/String;');
        } else {
            return 'web';
        }
    }

    // 获取设备操作系统版本
    getDeviceOpSysVision() {
        if (App.DeviceUtils.isNative()) {
            return this.callPlatformApi('getDeviceOpSysVision', '()Ljava/lang/String;');
        } else {
            return 'web';
        }
    }

    // 关闭闪屏
    closeSplash() {
        if (App.DeviceUtils.isNative()) {
            this.callPlatformApi('closeSpalsh', '()V');
        }
    }

    // 手机震动一下
    deviceShock(nDur = 500) {
        if (App.DeviceUtils.isNative()) {
            this.callPlatformApi('phoneShock', '(Ljava/lang/String;)V', "" + nDur);
        }
    }

    setAppIconBadgeNumber(num: number) {
        if (App.DeviceUtils.isIOS()) {
            this.callPlatformApi('closeSpalsh', '(Ljava/lang/String;)V', JSON.stringify({ badgeNum: num }));
        } else {
            console.warn('Only IOS can call Function [setAppIconBadgeNumber]');
        }
    }

    // ios 获取设备令牌
    getDeviceToken() {
        if (App.DeviceUtils.isIOS()) {
            return this.callPlatformApi('getDeviceToken', '()Ljava/lang/String;');
        } else {
            return '0';
        }
    }

    // 谷歌检查未消耗的订单
    GPCheckUnComsumerOrder() {
        if (App.DeviceUtils.isAndroid()) {
            this.callPlatformApi('gpCheckOwned', '()V');
        }
    }

    // google登录
    startGoogleLogin(callBack: Function) {
        if (App.DeviceUtils.isNative()) {
            this.addCallback(callBack, 'googleLoginCallback');
            this.callPlatformApi('googleLogin', '()V');
        } else {
            console.warn('Browser call Function [startGoogleLogin]');
        }
    }

    // huawei
    isHuaweiServerAvailble() {
        if (App.DeviceUtils.isAndroid()) {
            return this.callPlatformApi('isHuaweiServerAvailble', '()I');
        } else {
            console.warn('Browser call Function [isHuaweiServerAvailble]');
        }
    }

    // bSilent: 1 静默， 0反之
    doHuaweiLogin(callBack: Function, bSilent: number) {
        if (App.DeviceUtils.isAndroid()) {
            this.addCallback(callBack, 'HuaweiLoginCallback');
            this.callPlatformApi('doHuaweiLogin', '(I)V', bSilent);
        }
    }

    // 华为内购消耗
    doHuaweiPayComsumerOrder(data: any) {
        if (App.DeviceUtils.isAndroid() && data) {
            this.callPlatformApi('doHuaweiPayComsumerOrder', '(Ljava/lang/String;)V', data);
        }
    }

    // 华为数据打点
    doHuaweiTrackEvent(data: any) {
        if (App.DeviceUtils.IsHuawei() && data) {
            var jsonStr = JSON.stringify(data);
            this.callPlatformApi('doHuaweiTrackEvent', '(Ljava/lang/String;)V', jsonStr);
        }
    }

    // 苹果登录
    startAppleLogin(callback: Function) {
        if (App.DeviceUtils.isIOS()) {
            this.addCallback(callback, 'appleLoginCallback');
            this.callPlatformApi('appleSignIn', '()V');
        } else {
            console.warn('Browser call Function [startAppleLogin]');
        }
    }

    setClientIP(ipaddress: string) {
        if (App.DeviceUtils.isNative()) {
            this.callPlatformApi('SetClientIP', '(Ljava/lang/String;)V', ipaddress);
        }
    }

    // 记录ko打点
    KoSDKTrackEvent(eventName: string, eventData: any) {
        var data: any = {};
        data.EventName = eventName;
        data.EventValue = eventData;
        if ((window as any).wine) {
            var jsonStr: any = {};
            if (eventData) {
                jsonStr = eventData;
                if (eventName == 'Purchase' || eventName == 'FirstPurchase') {
                    jsonStr = eventData.value;
                }
            }
            console.warn('window.wine call Function:' + jsonStr);
            (window as any).wine.callWine(eventName, JSON.stringify(jsonStr));
        }

        if (App.DeviceUtils.isNative()) {
            if (data) {
                var jsonStr: any = JSON.stringify(data);
                this.callPlatformApi('KoTrackEvent', '(Ljava/lang/String;)V', jsonStr);
            }
        } else {
            if ((window as any).dataLayer) {
                if (eventData) {
                    (window as any).dataLayer.push({ event: eventName, data: eventData });
                } else {
                    (window as any).dataLayer.push({ event: eventName });
                }
            }
            if ((window as any).fbq) {
                var target = 'track';
                if (eventName == 'LoginSuccess' || eventName == 'FirstPurchase') {
                    target = 'trackCustom';
                }
                if (eventData) {
                    (window as any).fbq(target, eventName, eventData);
                } else {
                    (window as any).fbq(target, eventName);
                }
            }
        }
    }

    // 获取KO打点的唯一用户标志
    GetKoUUID() {
        if (App.DeviceUtils.isNative()) {
            return this.callPlatformApi('getKoTrackUUID', '()Ljava/lang/String;');
        }
    }

    SendMail(data: any) {
        if (App.DeviceUtils.isNative()) {
            return this.callPlatformApi('sendMail', '(Ljava/lang/String;)V', data)
        } else {
            console.warn('Browser call Function [sendMail]');
        }
    }

    // google广告 激励广告
    showAdmobReward(callback: Function) {
        if (App.DeviceUtils.isNative()) {
            this.addCallback(callback, 'ShowAdmobCallback');
            this.callPlatformApi('loadAdMobRewardAd', '()V');
        } else {
            console.warn('Browser call Function [showAdmobReward]');
        }
    }

    // google广告 横幅广告
    showAdmobBanner(bShow: boolean, pos: any) {
        if (App.DeviceUtils.isNative()) {
            if (bShow) {
                let param = JSON.stringify(pos);
                console.warn("bannerad:" + param);
                if (App.DeviceUtils.isAndroid()) {
                    this.callPlatformApi('loadAdmobBannerAd', '(Ljava/lang/String;)V', param);
                } else {
                    this.callPlatformApi('showAdmobBannerAd', '(Ljava/lang/String;)V', param);
                }
            } else {
                this.callPlatformApi('hideAdmobBannerAd', '()V');
            }
        } else {
            console.warn('Browser call Function [showAdmobBanner]');
        }
    }

    // 屏幕旋转
    setOrientation(orientation: string) {
        if (orientation != 'portrait' && orientation != 'landscape') return false;
        if (orientation == (this as any)._orientation) return false;
        (this as any)._orientation = orientation;
        if (App.DeviceUtils.isNative()) {
            this.callPlatformApi('setOrientation', '(Ljava/lang/String;)V', orientation);
        }
        let frameSize = screen.windowSize;
        if (orientation == 'portrait') {
            view.setOrientation(macro.ORIENTATION_PORTRAIT);
            if (frameSize.width > frameSize.height) {
                // view.setFrameSize(frameSize.height, frameSize.width);
                screen.windowSize = frameSize;
            }
        } else if (orientation == 'landscape') {
            view.setOrientation(macro.ORIENTATION_LANDSCAPE);
            if (frameSize.height > frameSize.width) {
                // view.setFrameSize(frameSize.height, frameSize.width);
                screen.windowSize.height = frameSize.width;
                screen.windowSize.width = frameSize.height;
            }
        }

        if (sys.isNative) {
            window.dispatchEvent(new Event('resize'));
        }
        return true;
    }

    // 回调在注册到dic中
    addCallback(callback: Function, callbackkey: string) {
        this.callbackDic = this.callbackDic || {};
        this.callbackDic[callbackkey] = callback;
    }

    //删除回调函数
    delCallback(callbackkey: string) {
        delete this.callbackDic[callbackkey];
    }

    // 触发回调（oc，java）
    trigerCallback(cbDataDic: any) {
        console.log("CallBackData:" + JSON.stringify(cbDataDic));
        this.pushCallbackDataToList(cbDataDic);
    }

    //paraments 参数，当多个参数时，用json字符串传入，平台端解开（多个返回值亦是如此）
    callPlatformApi(methodName: string, methodSignature: string, paraments?: any) {
        console.log("PlatformApiManager callPlatformApi:" + this.AND_CLASS_NAME);
        console.log("callPlatformApi:" + methodName + ", paraments:" + paraments);
        if (App.DeviceUtils.isAndroid()) {
            if (paraments) {
                return native.reflection.callStaticMethod(this.AND_CLASS_NAME, methodName, methodSignature, paraments);
            }
            else {
                return native.reflection.callStaticMethod(this.AND_CLASS_NAME, methodName, methodSignature);
            }
        }
        else if (App.DeviceUtils.isIOS()) {
            if (paraments) {
                return native.reflection.callStaticMethod(this.IOS_CLASS_NAME, methodName + ':', paraments);
            }
            else {
                return native.reflection.callStaticMethod(this.IOS_CLASS_NAME, methodName, null);
            }
        }
        else {
            return "";
        }
    }

    pushCallbackDataToList(cbDataDic: any) {
        this.cbDataList = this.cbDataList || [];
        this.cbDataList.push(cbDataDic);
    }

    //放到刷新函数中，防止异步线程直接回调，造成UI更新问题
    update() {
        if (this.cbDataList != null && this.cbDataList.length > 0) {
            var cbDataDic = this.cbDataList.shift();
            if (cbDataDic.cbName) {
                if (this.callbackDic[cbDataDic.cbName]) {
                    this.callbackDic[cbDataDic.cbName](cbDataDic);
                }
                else {
                    console.warn('Has not add ' + cbDataDic.cbName + ' in the cbDataDic!');
                }
            }
            else {
                console.warn('The callback data (cbDataDic.cbName) is not exist!');
            }
        }
    }
    async goLobbyPlatform() {
        console.log("goLobbyPlatform");
        let bgmVolume = App.StorageUtils.getLocal("bgmVolume");
        let bgmVolumeNum = bgmVolume !== undefined ? Number(bgmVolume) : undefined;
        if (bgmVolumeNum === undefined || bgmVolumeNum === 1) {
            App.AudioManager.setMusicVolume(1);
        }

        const userAmount = await App.ApiManager.getUserAmount();
        if (userAmount) {
            App.userData().userInfo.amount = userAmount;
            App.EventUtils.dispatchEvent(App.EventID.UPATE_COINS);
        }
    }


    //获取剪切板
    getPasteBoard() {
        if (sys.isNative && App.DeviceUtils.isAndroid()) {
            console.log("=====安卓调用getPasteBoard====");
            return this.callPlatformApi('getPasteBoard', '()Ljava/lang/String;');
        } else {
            return "";
        }
    }

    pickImageFromGallery(callback) {
        if (App.DeviceUtils.isNative()) {
            if (App.DeviceUtils.isAndroid()) {
                this.addCallback(callback, "pickImage");
                this.callPlatformApi("pickImageFromGallery", "()V");
            } else if (App.DeviceUtils.isIOS()) {
                this.addCallback(callback, "pickImage");
                this.callPlatformApi("pickImageFromGallery", "()V");
            }
        } else {
            console.warn("Browser call Function [pickImageFromGallery]");
        }
    }

    onImagePicked(imagePath) {
        console.log("PlatformApi.onImagePicked => " + imagePath);
        if (!imagePath) return;

        try {
            this.pushCallbackDataToList({
                cbName: "pickImage",
                data: imagePath
            });
        } catch (e) {
            console.warn("PlatformApi.onImagePicked: pushCallbackDataToList failed", e);
        }
    }

    onImageCancel() {
        console.log("PlatformApi.onImageCancel() called");
        try {
            this.pushCallbackDataToList({
                cbName: "pickImage",
                data: null
            });
        } catch (e) {
            console.warn("PlatformApi.onImageCancel: pushCallbackDataToList failed", e);
        }
    }

    // 生成兼容的UUID
    private generateUUID(): string {
        // 优先使用crypto.randomUUID()
        if (typeof crypto !== 'undefined' && crypto.randomUUID) {
            try {
                return crypto.randomUUID();
            } catch (e) {
                console.warn('crypto.randomUUID() failed:', e);
            }
        }

        // 备用方案：使用Math.random()生成UUID v4格式
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }
}
