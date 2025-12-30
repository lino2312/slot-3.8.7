import { Asset, assetManager, sp } from 'cc';
import { App } from '../../../App';
import { GameDataCfg } from '../../../config/GameDataCfg';
import { EventId } from '../../../constants/EventId';

export default class Utils {

    private static musicTimeout = null;

    private static curGameId = 0;
    private static isMusicAllow = false;

    static setCurGameId(gameId: number) {
        Utils.curGameId = gameId;
    }

    static getGameBundleName(gameId: number = Utils.curGameId) {
        // const cc = (globalThis as any).cc;
        // if (!cc?.vv) {
        //     return '';
        // }
        // let data = cc.vv.GameDataCfg.getGameData(gameId);
        let data = GameDataCfg.getInstance().getGameData(gameId);
        return data.subpackage;
    }

    static getMyScore() {
        // const cc = (globalThis as any).cc;
        // if (!cc?.vv) {
        //     return 0;
        // }
        // return cc.vv.gameData.GetCoin();
        const script = App.SubGameManager?.getSlotGameDataScript?.();
        return script?.getCoin?.() ?? 0;
    }

    public static async loadRes(bundleName: string, path: string, resType: typeof Asset = null) {
        return new Promise<Asset>((resolve, reject) => {
            let bundle = assetManager.getBundle(bundleName);
            if (bundle) {
                bundle.load(path, resType, (err, asset: Asset) => {
                    if (err) {
                        reject();
                        return;
                    }
                    resolve(asset)
                })
            } else {
                assetManager.loadBundle(bundleName, (err, bundle) => {
                    if (err) {
                        reject();
                        return;
                    }
                    bundle.load(path, resType, (err, asset: Asset) => {
                        resolve(asset)
                    })
                });
            }
        })
    }

    /** 获取spine动画时长 */
    public static getSpineDuration(spine: sp.Skeleton, animation: string) {
        let duration = 0;
        let aniList = spine.skeletonData['_skeletonCache'].animations;
        for (let i = 0; i < aniList.length; i++) {
            if (animation == aniList[i].name) {
                duration = aniList[i].duration;
                break;
            }
        }
        return duration;
    }

    // 保留小数点位数
    public static numToFixed(value: number, num: number = 2, isForceNum = false) {
        if (num > 0) {
            if (!isForceNum && !Number.isInteger(value)) {
                let valueList = value.toString().split('.');
                num = valueList[1].length > num ? num : valueList[1].length;
            }
            let digitNum = Math.pow(10, num);
            let strValue = Math.floor(value * digitNum).toString();
            let strFront = strValue.length - num > 0 ? strValue.slice(0, strValue.length - num) : '0';
            let strBack = strValue.slice(strValue.length - num);
            return strFront + '.' + strBack;
        } else {
            return Math.floor(value).toString();
        }
    }

    // 数额格式化显示，不处理小数点
    public static numToFormat(value: number, isShowAll = true, isSeparate = true) {
        let unit = '';
        let newValue = Math.abs(value);
        if (newValue >= 1000000000000) {
            newValue = newValue / 1000000000000;
            unit = 'T';
        }
        else if (newValue >= 1000000000) {
            newValue = newValue / 1000000000;
            unit = 'B';
        }
        else if (newValue >= 1000000) {
            newValue = newValue / 1000000;
            unit = 'M';
        }
        else if (newValue >= 10000) {
            newValue = newValue / 1000;
            unit = 'K';
        }
        let strValue = '';
        if (isShowAll) {
            strValue = (Math.floor(newValue * 100) / 100).toString();
        } else {
            let listTmp = newValue.toString().split('.');
            if (listTmp[1] && listTmp[1].length > 2) {
                strValue = this.numToFixed(newValue, 2);
            } else {
                strValue = newValue.toString();
            }
        }
        if (isSeparate && Number(strValue) >= 1000) {
            strValue = strValue.split('.').map((x, idx) => {
                if (!idx) {
                    return x.split('')
                        .reverse()
                        .map((xx, idxx) => (idxx && !(idxx % 3)) ? (xx + ',') : xx)
                        .reverse()
                        .join('')
                } else {
                    return x;
                }
            }).join('.')
        }
        if (value < 0) {
            strValue = '-' + strValue;
        }
        return strValue + unit;
    }

    // 数额格式化显示，不处理小数点, 用到的是逗号不是点
    public static numToFormatPt(value: number, isShowAll = true, isSeparate = true) {
        let unit = '';
        let newValue = Math.abs(value);
        let strValue = '';
        if (isShowAll) {
            strValue = (Math.floor(newValue * 100) / 100).toString();
        } else {
            let listTmp = newValue.toString().split('.');
            if (listTmp[1] && listTmp[1].length > 2) {
                strValue = this.numToFixed(newValue, 2);
            } else {
                strValue = newValue.toString();
            }
        }
        if (isSeparate && Number(strValue) >= 1000) {
            strValue = strValue.split('.').map((x, idx) => {
                if (!idx) {
                    return x.split('')
                        .reverse()
                        .map((xx, idxx) => (idxx && !(idxx % 3)) ? (xx + ',') : xx)
                        .reverse()
                        .join('')
                } else {
                    return x;
                }
            }).join(',')
        }
        if (value < 0) {
            strValue = '-' + strValue;
        }
        return strValue + unit;
    }

    // 浮点型运算格式化显示
    public static floatToFormat(value: number, num = 2, isCheckInteger = true, isFormat = false, isSeparate = true) {
        if (isNaN(value)) return
        let newValue = Math.abs(value);
        let strValue = '';
        let unit = '';
        if (isFormat) {
            // if (newValue >= 1000000000000) {
            // 	newValue = newValue / 1000000000000;
            // 	unit = 'T';
            // }
            // else if (newValue >= 1000000000) {
            // 	newValue = newValue / 1000000000;
            // 	unit = 'B';
            // }
            // else if (newValue >= 1000000) {
            // 	newValue = newValue / 1000000;
            // 	unit = 'M';
            // }
            // else 
            if (newValue >= 1000) {
                newValue = newValue / 1000;
                unit = 'K';
            }
        }
        if (isCheckInteger && Number.isInteger(newValue)) {
            strValue = newValue.toString()
        } else {
            strValue = this.numToFixed(newValue, num);
        }
        if (isSeparate && Number(strValue) >= 1000) {
            strValue = strValue.split('.').map((x, idx) => {
                if (!idx) {
                    return x.split('')
                        .reverse()
                        .map((xx, idxx) => (idxx && !(idxx % 3)) ? (xx + ',') : xx)
                        .reverse()
                        .join('')
                } else {
                    return x;
                }
            }).join('.')
        }
        if (value < 0) {
            strValue = '-' + strValue;
        }
        return strValue + unit;
    }

    /** 获取音频声音时长 */
    public static getAudioDuration(audioId: number) {
        // 在 Cocos Creator 3.x 中，音频 API 已改变，需要根据实际项目调整
        // return cc.audioEngine.getDuration(audioId);
        return 0;
    }

    /** 播放音效 */
    public static playSlotsCommonEffect(name: string | string[], cbEnd: Function = null, cbLoaded: Function = null) {
        const cc = (globalThis as any).cc;
        if (!cc?.vv) {
            return;
        }
        let audioName = '';
        if (typeof name === 'string') {
            audioName = name;
        } else {
            if (name.length > 0) {
                let index = Math.floor(Math.random() * name.length);
                audioName = name[index];
            }
        }
        if (audioName) {
            cc.vv.AudioManager.playEff("slots_common/SlotRes/", audioName, true, false, cbEnd, null, (effectId: number) => {
                if (cbLoaded) {
                    cbLoaded(effectId);
                }
            })
        }
    }

    /** 播放音效 */
    public static playEffect(bundle: string, name: string | string[], cbEnd: Function = null, cbLoaded: Function = null, loop = false) {
        let audioName = '';
        if (typeof name === 'string') {
            audioName = name;
        } else {
            if (name.length > 0) {
                let index = Math.floor(Math.random() * name.length);
                audioName = name[index];
            }
        }
        if (audioName) {
            App.AudioManager.playSfx("audio/", audioName, cbLoaded, cbEnd);
        }

    }

    /** 停止音效 */
    public static stopEffect(effectId: number) {
        // const cc = (globalThis as any).cc;
        // if (!cc?.vv) {
        //     return;
        // }
        // cc.vv.AudioManager.stopAudio(effectId);
        App.AudioManager.stopAll();
    }

    /** 停止音效 */
    public static stopAllEffect() {
        App.AudioManager.stopAll();
    }

    /** 播放音效 */
    public static playMusic(bundle: string, name: string | string[], loop = true, cbLoaded: Function = null) {
        const cc = (globalThis as any).cc;
        if (!cc?.vv) {
            return;
        }
        let audioName = '';
        if (typeof name === 'string') {
            audioName = name;
        } else {
            if (name.length > 0) {
                let index = Math.floor(Math.random() * name.length);
                audioName = name[index];
            }
        }
        if (audioName) {
            cc.vv.AudioManager.playMusic1(bundle, audioName, loop, cbLoaded)
        }
    }

    // 提示
    public static showFadeTip(strTip: string) {
        const cc = (globalThis as any).cc;
        if (!cc?.vv) {
            return;
        }
        // cc.vv.AlertView.showTips(strTip)
        App.AlertManager.showFloatTip(strTip);
    }

    // 提示
    public static showRechargeTip() {
        // const cc = (globalThis as any).cc;
        // if (!cc?.vv) {
        //     return;
        // }
        // cc.vv.AlertView.showTips("Please go to the lobby to recharge")
        App.AlertManager.showFloatTip("Please go to the lobby to recharge.");
    }

    // 提示
    public static showToRechargeTip() {
        const cc = (globalThis as any).cc;
        if (!cc?.vv) {
            return;
        }
        // cc.vv.AlertView.show(("金币不足"), () => {
        //     this.showRechargeTip()
        // }, () => {
        // }, false, () => { }, ("提示"), ("取消"), ("Deposit"))
        App.AlertManager.getCommonAlert().show("Your balance is insufficient, please recharge!", () => {
            this.showRechargeTip()
        });

    }

    // 是否有强制弹窗
    public static checkForsePoptips() {
        const cc = (globalThis as any).cc;
        if (!cc?.vv) {
            return;
        }
        let serverData = cc.vv.UserManager.getNotEncoughCoinPoplist()
        if (serverData && serverData.bforse) {
            //强制弹出
            cc.vv.EventManager.emit(EventId.NOT_ENOUGH_COIN_POP_UI);
            cc.vv.UserManager.setNotEncoughPopForceFlag(0)
        }
    }

    // 发送旋转消息
    public static reqSpin(betIdx: number, autoVal: any, isAllIn = false, buyDouble = false) {
        // const cc = (globalThis as any).cc;
        // if (!cc?.vv) {
        //     return;
        // }
        // cc.vv.gameData.ReqSpin(betIdx, autoVal, isAllIn, buyDouble)
        App.SubGameManager.getSlotGameDataScript().reqSpin(betIdx, autoVal, isAllIn);
    }

    /**
    * 获取一个指定范围的随机数 [min, max]
    * @param min 随机范围的最小值(>=min)
    * @param max 随机范围的最大值(<=max)
    */
    public static getRandNum(min: number, max: number): number {
        if (min === max) {
            return min;
        }
        const minNum: number = min < max ? min : max;
        const val: number = Math.abs(max - min);
        const num = minNum + Math.floor(Math.random() * (val + 1));
        return num;
    }

    /**
    * 处理精度问题
    * @param num
    * @returns
    */
    public static preciseRound(num) {
        return Math.round((num + Number.EPSILON) * 100) / 100;
    }

    /**
    * 获得一条贝塞尔曲线上的点
    * @param t  x比例
    * @param p0 起点
    * @param p1 重点
    * @param p2 控制点
    * @returns 对应的坐标
    */
    static getBezierCurve(t: number, p0: any, p1: any, p2: any = null) {
        let a0 = p0.clone().multiplyScalar((1 - t ** 2));
        let a1 = p1.clone().multiplyScalar(t ** 2);
        if (p2) {
            let a2 = p2.clone().multiplyScalar((2 * t * (1 - t)));
            return a0.add(a2.add(a1));
        } else {
            return a0.add(a1);
        }
    }
}