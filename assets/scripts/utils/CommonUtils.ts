import { App } from "../App";

export class CommonUtils {
    //简单加密字符串
    static compile(code: string) {
        let c = String.fromCharCode(code.charCodeAt(0) + code.length);
        for (let i = 1; i < code.length; i++) {
            c += String.fromCharCode(code.charCodeAt(i) + code.charCodeAt(i - 1));
        }
        c = encodeURIComponent(c);
        return c;
    }

    //简单解密字符串
    static uncompile(code: string) {
        code = decodeURIComponent(code);
        let c = String.fromCharCode(code.charCodeAt(0) - code.length);
        for (let i = 1; i < code.length; i++) {
            c += String.fromCharCode(code.charCodeAt(i) - c.charCodeAt(i - 1));
        }
        return c;
    }

    /*
    ** 绑定参数
    ** 第一个参数必须是函数类型
    */
    static bindParams() {
        var args = Array.prototype.slice.call(arguments);
        var func = args.shift();
        if (typeof (func) != 'function') return;

        return function () {
            return func.apply(null, args.concat(Array.prototype.slice.call(arguments)));
        };
    }

    /*
    ** 转化value=n*256+m为字符串nm
    */
    static jsToCByShort(value: number) {
        var low1 = Math.floor(value / 256);
        var low2 = Math.floor(value % 256);
        /*var lowByte1 = GlobalFunc.charToByte(low1,low2);
        var lowByte2 = GlobalFunc.charToByte(low2);*/
        return String.fromCharCode(low1, low2);
    }

    /*
    ** 转化m+n*2^24+k*2^16+l*2^8=为字符串mnkl
    */
    static jsToCByInt(value: number) {
        var low1 = Math.floor(value / (256 * 256 * 256))
        var low2 = Math.floor(value / (256 * 256)) % 256
        var low3 = Math.floor(value / 256) % 256
        var low4 = Math.floor(value % 256)
        /*var lowByte1 = GlobalFunc.charToByte(low1);
        var lowByte2 = GlobalFunc.charToByte(low2);
        var lowByte3 = GlobalFunc.charToByte(low3);
        var lowByte4 = GlobalFunc.charToByte(low4);*/
        return String.fromCharCode(low1, low2, low3, low4);
    }

    /*
    ** 计算长度
    */
    static srcSum(strData: any[], len: number) {
        var sum = 65535;
        for (var i = 0; i < len; i++) {
            var d = strData[i];
            sum = sum ^ d;
            if ((sum & 1) == 0) {
                sum = sum >> 1;
            }
            else {
                sum = (sum >> 1) ^ (0x70B1);
            }
        }
        return sum;
    }

    static spcode2String(spcode) {
        if (spcode == 804) {
            App.AlertManager.getCommonAlert().setTitle("提示").setCancelLabel("取消").setConfirmLabel("Deposit")
            .show("金币不足", () => {
                App.EventUtils.dispatchEvent("HALL_OPEN_SHOP", { open: 1 });
            });
            return "";
        }
        const config = [
            { spcode: 625, get errMsg() { return ("VIP等级不够") } },
            { spcode: 649, get errMsg() { return ("房间号错误或者游戏已经开始") } },
            { spcode: 651, get errMsg() { return ("您还不是VIP") } },
            { spcode: 652, get errMsg() { return ("钻石不足") } },
            { spcode: 814, get errMsg() { return ("商品不存在") } },
            { spcode: 653, get errMsg() { return ("今日已不能参加排位赛") } },
            { spcode: 654, get errMsg() { return ("队友金币不足") } },
            { spcode: 655, get errMsg() { return ("队友钻石不足") } },
            { spcode: 656, get errMsg() { return ("队友今日已不能参加排位赛") } },
            { spcode: 657, get errMsg() { return ("队友已离开") } },
            { spcode: 665, get errMsg() { return ("好友不是VIP") } },
            // { spcode: 804, get errMsg() { return ("金币不足") } },
            { spcode: 950, get errMsg() { return ("道具不存在") } },
            { spcode: 815, get errMsg() { return ("兑换码已被使用") } },
            { spcode: 816, get errMsg() { return ("兑换码不存在") } },
            { spcode: 817, get errMsg() { return ("兑换错误次数太多，请稍后再试") } },
            { spcode: 818, get errMsg() { return ("使用过于频繁，请稍后再试") } },
            { spcode: 1094, get errMsg() { return ("找不到该用户") } },
            { spcode: 925, get errMsg() { return ("房主才可以解散") } },
            { spcode: 659, get errMsg() { return ("房间号不存在") } },
            { spcode: 660, get errMsg() { return ("房间已满") } },
            { spcode: 661, get errMsg() { return ("房间已开始") } },
            { spcode: 662, get errMsg() { return ("还在游戏中,不能加入其它房间") } },


            { spcode: 649, get errMsg() { return ("游戏已开始,无法解散") } },
            { spcode: 636, get errMsg() { return ("商品不存在") } },
            { spcode: 637, get errMsg() { return ("rp值不足") } },
            { spcode: 974, get errMsg() { return ("已投票,不能重复投票") } },
            { spcode: 753, get errMsg() { return ("用户已报名联赛") } },
            { spcode: 9933, get errMsg() { return ("获取免费类型错误") } },
            { spcode: 9934, get errMsg() { return ("今日已经领取") } },
            { spcode: 423, get errMsg() { return ("未找到好友信息") } },
            { spcode: 1096, get errMsg() { return ("没有可以参加的房间") } },
            { spcode: 1093, get errMsg() { return ("任务未完成") } },
            { spcode: 1451, get errMsg() { return ("道具不存在") } },
            { spcode: 1073, get errMsg() { return ("This username is not available") } },

            { spcode: 638, get errMsg() { return ("未完成") } },
            { spcode: 945, get errMsg() { return ("玩家等级不够") } },
            { spcode: 819, get errMsg() { return ("您被禁言了") } },
            { spcode: 1098, get errMsg() { return ("玩家已在房间内") } },
            { spcode: 923, get errMsg() { return ("房间人数已满") } },

            { spcode: 1452, get errMsg() { return ("已经绑定过邀请码") } },
            { spcode: 1453, get errMsg() { return ("不能绑定自己的邀请码") } },
            { spcode: 1454, get errMsg() { return ("不能绑定下级的邀请码") } },
            { spcode: 1455, get errMsg() { return ("绑定错误") } },

            { spcode: 398, get errMsg() { return ("已发送过邀请,请稍后再试") } },
            { spcode: 3008, get errMsg() { return ("无法重复领取沙龙体验卡") } },
            { spcode: 1102, get errMsg() { return ("已发送过邀请,请10s后再试") } },
            { spcode: 976, get errMsg() { return ("无法重复领取") } },
            { spcode: 754, get errMsg() { return ("破产金币已领完") } },


            { spcode: 551, get errMsg() { return ("Phone cannot be empty") } },
            { spcode: 851, get errMsg() { return ("Email cannot be empty") } },
            { spcode: 552, get errMsg() { return ("Invalid OTP") } },
            { spcode: 553, get errMsg() { return ("Password Error") } },
            { spcode: 554, get errMsg() { return ("This account has already been bound") } },
            { spcode: 555, get errMsg() { return ("The phone number has been bound") } },
            { spcode: 855, get errMsg() { return ("The email address has been bound") } },
            { spcode: 333, get errMsg() { return ("Wrong password!") } },
            { spcode: 955, get errMsg() { return ("Account does not exist!") } },


            { spcode: 1055, get errMsg() { return ("Parameters are missing!") } },
            { spcode: 484, get errMsg() { return ("You are prohibited from adding friends") } },
            { spcode: 490, get errMsg() { return ("Friends don't exist!") } },
            { spcode: 495, get errMsg() { return ("添加好友，错误次数过于频繁") } },
            { spcode: 619, get errMsg() { return ("您的好友数量已达上限") } },
            { spcode: 620, get errMsg() { return ("好友关系已经存在") } },
            { spcode: 621, get errMsg() { return ("对方好友数量已达上限") } },
            { spcode: 622, get errMsg() { return ("对方已经是你的好友了") } },
            { spcode: 623, get errMsg() { return ("不能加自己为好友") } },
            { spcode: 557, get errMsg() { return ("Need to bind phone!") } },
            { spcode: 664, get errMsg() { return ("Your friend is offline!") } },

            { spcode: 535, get errMsg() { return ("Have abstained!") } },

        ]
        for (const _cfg of config) {
            if (_cfg.spcode == spcode) {
                return _cfg.errMsg;
            }
        }
        return "";
    }
}