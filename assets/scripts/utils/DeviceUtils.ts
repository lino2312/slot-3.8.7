import { find, sys, UITransform, view, screen } from 'cc';
import { Config } from '../config/Config';
import { App } from '../App';
import { ScreenUtils } from './ScreenUtils';
import { JSB } from 'cc/env';
export class DeviceUtils {
    //是否是原生app端
    static isNative(): boolean {
        return sys.isNative;
    }

    // 设置是否震动
    static setShake(value: boolean) {
        sys.localStorage.setItem("shake", String(value));
    }

    // 获取是否震动
    static getShake(): boolean {
        return sys.localStorage.getItem("shake", false);
    }

    //是否是Adnroid
    static isAndroid(): boolean {
        return sys.os === 'Android';
    }

    //是否是iOS
    static isIOS(): boolean {
        return sys.os === 'iOS' && sys.isNative ;
    }

    static isBrowser(): boolean {
        return sys.isBrowser;
    }

    //是否是iOS审核
    static isIOSReview(): boolean {
        return this.isIOS() ? Config.isReview : false;
    }

    //是否是iOS或Android审核
    static isIOSAndroidReview(): boolean {
        return this.isNative() ? (this.isIOSReview() || (Config.isAndroidReview && this.isAndroid())) : false;
    }

    // 是否关闭购买
    static isClosePurchase(): boolean {
        return Config.appId == Config.APPID.HuaweiDRM;
    }

    // 获取设备ID
    static getDeviceId(): string {
        return App.PlatformApiMgr.getDeviceId();
    }

    //自动适配设备
    static autoAdaptDevices() {
        var canvasNode = find('Canvas');
        var frameWidth = canvasNode.getComponent(UITransform).width;
        var frameHeight = canvasNode.getComponent(UITransform).height;
        var screenWidth = ScreenUtils.getScreenWidth();
        var screenHeight = ScreenUtils.getScreenHeight();
        if ((frameWidth / frameHeight) < (screenWidth / screenHeight)) { //按照宽来适配
            view.setDesignResolutionSize(screenWidth, screenHeight, 1); // 1 = SHOW_ALL
        }
        else { //按照高来适配
            view.setDesignResolutionSize(screenHeight, screenWidth, 2); // 2 = NO_BORDER
        }
    }

    //获取设备信息
    //用于后台上报

    static getDeviceInfo() {
        let info = { osValue: 'web', frameSize: { width: 0, height: 0 }, phoneBrand: '', phoneSystemVision: '', phoneUuid: '', netType: 0 }
        if (sys.isNative) {
            //分辨率
            info.frameSize = screen.windowSize
            //系统:ios android
            info.osValue = sys.os
            //手机型号 android:手机品牌_手机型号(小米_xiaomi)  ios:iphne6_ios12
            info.phoneBrand = App.PlatformApiMgr.getDeviceBrand()
            //手机操作系统版本
            info.phoneSystemVision = App.PlatformApiMgr.getDeviceOpSysVision()
            //手机唯一识别码
            info.phoneUuid = this.getDeviceId()

            //网络：0未知，1Wi-Fi，2移动网络
            info.netType = sys.getNetworkType()

        }
        return info
    }

    //是否是华为渠道包
    static IsHuawei() {
        if (this.isAndroid()) {
            let bHuawei = (Config.appId == Config.APPID.SouthAmerica
                || Config.appId == Config.APPID.HuaweiDRM
                || Config.appId == Config.APPID.Baloot_HW
                || Config.appId == Config.APPID.PokerHero_HW
                || Config.appId == Config.APPID.PokerHero_Durak_HW
                || Config.appId == Config.APPID.PokerHero_HW_CardMaster)
            return bHuawei
        }

    }

    static isDurakApp() {
        return Config.appId == Config.APPID.PokerHero_Durak_HW
    }

    static isYDApp() {
        return Config.appId == Config.APPID.YonoGames
    }

    static isArabHero() {
        return Config.appId == Config.APPID.PokerHero || Config.appId == Config.APPID.PokerHero_HW;
    }
}