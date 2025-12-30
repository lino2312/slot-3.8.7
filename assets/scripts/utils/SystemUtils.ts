import { Component, director, native } from "cc";
import { Config } from "../config/Config";
import { App } from "../App";
import { DeviceUtils } from "./DeviceUtils";
import { StorageUtils } from "./StorageUtils";
declare let window: Window & { facade?: any };
export class SystemUtils {

    //是否开启wss 
    //不带端口的时候，就采用https
    //即当是https的时候，websocket也需要用wss
    static isUserWSS = function (pUrl = '') {
        var res = false
        let url = Config.loginServerAddress
        if (pUrl) {
            url = pUrl
        }
        if (url.indexOf(':') === -1) {
            res = true
        }
        return res
    }

    //名字不规范 要改 这什么意思
    static isLoginFun = function (isLogin: boolean) {
        if (!isLogin) {
            Config.registerAndLogin = "Login";
            App.SceneUtils.enterScene(Config.SCENE_NAME.LOGIN);
            // cc.vv.PopupManager.addPopup("BalootClient/Setting/registerAndLogin/login");
        }
    }


    static openThirdGame(url, returnUrl = null) {
        console.log("=== openThirdGame URL ===", url);
        try {
            let fixedUrl = decodeURIComponent(url);
            fixedUrl = encodeURI(fixedUrl);
            url = fixedUrl;
            console.log("=== fixedUrl URL ===", url);
        } catch (e) {
            console.error("URL decode error:", e);
        }
        if (DeviceUtils.isAndroid()) {
            let gameBut = true;
            let o = 3;
            let oc = 1;
            let initScale = 100;
            let builtInZoomCtrl = false;
            let builtInZoomCtrlDisplay = true;

            native.reflection.callStaticMethod(
                "com/cocos/game/PlatformAndroidApi",
                "openWebView",
                "(Ljava/lang/String;ZIIZZIZZ)V",
                url,
                gameBut,
                o,
                oc,
                true,   // loadWithOverviewMode
                true,   // useWideViewPort
                initScale,
                builtInZoomCtrl,
                builtInZoomCtrlDisplay
            );

        } else if (DeviceUtils.isIOS()) {
            location.href = url;
        } else {
            window.open(url);
        }
    }

    static generateFBP() {
        const timestamp = Math.floor(Date.now() / 1000); // 秒级时间戳
        const random = Math.floor(Math.random() * 9e15) + 1e15; // 16位随机数字
        const fbc = `fb.1.${timestamp}.${random}`;
        console.log(fbc)
        return fbc;
    }

    static getFullFbc() {
        let fbcId = StorageUtils.getLocal('fbcId', "");
        if (!fbcId) {
            const match = document.cookie.match(/_fbc=([^;]+)/);
            if (match) {
                return decodeURIComponent(match[1]);
            } else {
                const newFbc = this.generateFBP();
                StorageUtils.saveLocal('fbcId', newFbc);
                return newFbc;
            }
        } else {
            return fbcId
        }
    }

    /*
    ** 对象 深拷贝
    */
    static copy(obj) {
        if (typeof obj === "number" || typeof obj === "string") { //简单类型
            return obj
        }
        var newObj = obj instanceof Array ? [] : {}
        for (var item in obj) {
            if (typeof obj[item] === "object") {
                newObj[item] = this.copy(obj[item]);
            } else {
                newObj[item] = obj[item];
            }
        }
        return newObj;
    }

    static deepClone(obj) {
        var copy;
        // Handle the 3 simple types, and null or undefined
        if (null == obj || "object" != typeof obj) return obj;
        // Handle Date
        if (obj instanceof Date) {
            copy = new Date();
            copy.setTime(obj.getTime());
            return copy;
        }
        // Handle Array
        if (obj instanceof Array) {
            copy = [];
            for (var i = 0, len = obj.length; i < len; i++) {
                copy[i] = this.deepClone(obj[i]);
            }
            return copy;
        }
        // Handle Function
        if (obj instanceof Function) {
            copy = function () {
                return obj.apply(this, arguments);
            }
            return copy;
        }
        // Handle Object
        if (obj instanceof Object) {
            copy = {};
            for (var attr in obj) {
                if (obj.hasOwnProperty(attr)) copy[attr] = this.deepClone(obj[attr]);
            }
            return copy;
        }
        throw new Error("Unable to copy obj as type isn't supported " + obj.constructor.name);
    }


    // 停止当前场景的所有定时器
    static stopAllTimer() {
        // 停止网络监听
        let facade = window.facade;
        if (facade && facade.dm && facade.dm.msgHandler) {
            facade.dm.msgHandler.reset();
        }
        // if (App.GameData) {
        //     if (App.GameData.onExit) {
        //         App.GameData.onExit();
        //     }
        // }
        // 停止所有定时器
        for (const cpt of director.getScene().getComponentsInChildren(Component)) {
            cpt.unscheduleAllCallbacks();
            // cc.log(cpt.name);
            if (cpt.name != "SceneTranslate<SceneTranslate>") {
                cpt["update"] = () => { };
            }

        }
    }

    static getPromise(callback, abortFunc?) {
        let _reject;
        const promise = new Promise((resolve, reject) => {
            _reject = reject;
            callback(resolve, reject)
        });
        return {
            promise,
            abort: () => {
                abortFunc && abortFunc();
                _reject({ message: "the promise is aborted" })
            }
        }
    }

    static awaitTime(component: any, time: number): Promise<void> {
        return new Promise<void>((resolve) => {
            component.scheduleOnce(() => {
                resolve();
            }, time);
        });
    }
}