import { StringUtils } from "./StringUtils";

export class FormatUtils {
    //将秒钟格式成：*:*:*
    //nVal 秒
    static formatSec(nVal: number, fmt: string, bShowDay: any) {
        if (!fmt) fmt = '%s:%s:%s';

        let day = Math.floor(nVal / (24 * 3600))
        if (!bShowDay) {
            day = 0
        }
        let min = Math.floor((nVal - day * 24 * 3600) % 3600);
        let nHour = Math.floor((nVal - day * 24 * 3600) / 3600);
        let nMin = Math.floor(min / 60);
        let nSec = min % 60;
        // If cc.js.formatStr is unavailable, use a simple string replacement
        let strShow = fmt
            .replace('%s', StringUtils.prefixInteger(nHour, 2))
            .replace('%s', StringUtils.prefixInteger(nMin, 2))
            .replace('%s', StringUtils.prefixInteger(nSec, 2));
        if (day > 0) { //天数超过1，则显示成天的前缀

            strShow = day + (day > 1 ? ' days' : ' day')
        }
        return strShow
    }

    //数字转换为金钱格式
    //传入1234，返回1,234
    static formatMoney(numb: { toString: () => any; }) {
        let str = numb.toString();
        let format = str.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
        return format;
    }

    static formatTime(fmt: string, timestamp: number) {
        var date = new Date(timestamp * 1000)
        if (/(y+)/.test(fmt)) {
            // $1标识第一个子串中的内容；这里当fmt格式中年份少于4位时，从后往前取
            fmt = fmt.replace(RegExp.$1, (date.getFullYear() + "").substr(4 - RegExp.$1.length));
        }
        let filterMap = {
            "M+": date.getMonth() + 1,
            "d+": date.getDate(),
            "h+": date.getHours(),
            "m+": date.getMinutes(),
            "s+": date.getSeconds()
        };
        for (let key in filterMap) {
            if (new RegExp(`(${key})`).test(fmt)) {
                let str = filterMap[key] + "";
                fmt = fmt.replace(RegExp.$1, str.length === 2 ? str : StringUtils.padLeftZero(str));
            }
        }
        return fmt;
    }
    // 将剩余秒数装换为时间格式
    static formatSecond = function (second: number, fmt: string) {
        if (!fmt) fmt = 'hh:mm:ss';
        let filterMap = {
            "h+": Math.floor(second / 3600),
            "m+": Math.floor(second % 3600 / 60),
            "s+": second % 3600 % 60
        };
        for (let key in filterMap) {
            if (new RegExp(`(${key})`).test(fmt)) {
                let str = filterMap[key] + "";
                fmt = fmt.replace(RegExp.$1, str.length === 2 ? str : StringUtils.padLeftZero(str));
            }
        }
        return fmt;
    }

    //替换自定义后缀
    static formatNumber(num: number, args: { decimal?: any; radix?: any; threshold?: any; }) {
        args = args || {};
        let unitArr = ['', 'K', 'M', 'B', 'T', 'Q'];
        let sign = num >= 0 ? 1 : -1;  //符号
        let absNum = Math.abs(num);
        let decimal = args.decimal || 2;
        let radix = args.radix || 1000;
        let threshold = args.threshold || 10000;
        if (absNum < threshold) {
            return this.FormatNumToComma(num);
            // return num;
        }
        let sum = 0;
        while (absNum >= radix) {
            sum++;
            absNum = absNum / radix;
        }
        return Number((sign * absNum).toFixed(decimal)) + unitArr[sum];
    }

    // 数字转换逗号分隔符
    static FormatNumToComma(num: number): string {
        num = Number(Number(num).toFixed(2));
        var res = num.toString().replace(/\d+/, function (n) { // 先提取整数部分
            return n.replace(/(\d)(?=(\d{3})+$)/g, function ($1) {
                return $1 + ",";
            });
        })
        return res;
    }

    //逗号分隔符数字字符串转成数字
    static FormatCommaNumToNum(numStr: string) {
        return parseInt(numStr.replace(/,/g, ""));
    }

    static formatNumShort(nVal, nPoint = 2) {
        //1000
        //1000000
        //1000000000
        //1000000000000
        let str = ''
        let pointVal = Math.pow(10, nPoint)
        // if(nVal > 1000000000000){
        //     let tVal = Math.floor((nVal/1000000000000)*100) /100
        //     str = tVal + 'T'
        // }
        // else 
        if (nVal >= 1000000000) {
            let tVal = Math.floor((nVal / 1000000000) * pointVal) / pointVal
            str = tVal + 'B'
        }
        else if (nVal >= 1000000) {
            let tVal = Math.floor((nVal / 1000000) * pointVal) / pointVal
            str = tVal + 'M'
        }
        else if (nVal >= 1000) {
            let tVal = Math.floor((nVal / 1000) * pointVal) / pointVal
            str = tVal + 'K'
        }
        else {
            str = nVal
        }

        return str

    }
}