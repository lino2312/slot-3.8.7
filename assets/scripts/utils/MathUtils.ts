import { Vec2 } from "cc";

export class MathUtils {

    /*
        ** 生成任意值到任意值（也就是指定范围内）的随机数
        ** max期望的最大值
        ** min期望的最小值
        */
    static random(min: number, max: number) {
        return Math.floor(Math.random() * (max - min + 1) + min);
    }

    /**
     * 随机多个数
     * @returns 
     */
    static randomArray(n: number, min: any, max: any) {
        let arr = []
        let isExist = function (val) {
            for (let i = 0; i < arr.length; i++) {
                if (val == arr[i]) {
                    return true
                }
            }
            return false
        }
        for (let i = 0; i < n; i++) {
            let item = this.random(min, max)
            while (isExist(item)) {
                item = this.random(min, max)
            }
            arr[i] = item
        }
        return arr
    }

    /*
    ** 随机-1到1
    */
    static random1To1() {
        return (Math.random() - 0.5) * 2;
    }

    /*
    ** 随机0到1
    */
    static random0To1() {
        return Math.random();
    }

    /*
        ** 转化数字为万、亿为单位的字符串
        ** num需转化的数字
        ** radix进制
        ** decimal 小数点后保留位数
        ** costomunitArr 自定义后缀 ['','W','Y','H']
        ** criticalValue 触发转换的临界值；默认等于进制 例如 10000才会触发 10k转换；1000不会转换成1k
        */
    static convertNumToShort(num: number, radix: number, decimal: number, costomunitArr: string[] = null, criticalValue = null) {
        // var unitArr = ['', '万', '亿', '万亿'];
        var unitArr = ['', 'K', 'M', 'B', 'T', 'Q'];
        var sign = (num != 0) ? num / Math.abs(num) : 1;  //符号
        num = Math.abs(num);

        //替换自定义后缀
        if (costomunitArr) {
            unitArr = costomunitArr
        }

        radix = (radix == null) ? 1000 : radix; //默认值  10000万亿
        decimal = (decimal == null) ? 1 : decimal; //默认值
        criticalValue = (criticalValue == null) ? radix : criticalValue; //默认值  进制
        var sum = 0;
        while (num >= criticalValue) {
            sum++;
            num = num / radix;
        }
        num = Math.floor(num * Math.pow(10, decimal)) / Math.pow(10, decimal);

        return num * sign + unitArr[sum];
    }

    //逗号分隔符数字字符串转成数字
    static FormatCommaNumToNum(numStr: string) {
        return parseInt(numStr.replace(/,/g, ""));
    }

    //保留小数点不足补0
    static SavePoints(num: string, pt = 2) {
        //1. 可能是字符串，转换为浮点数
        //2. 乘以100 小数点向右移动两位
        //3. Math.round 进行四舍五入
        //4. 除以100 小数点向左移动两位 实现保留小数点后两位
        var value = Math.round(parseFloat(num) * 100) / 100;
        // 去掉小数点 存为数组
        var arrayNum = value.toString().split(".");
        //只有一位（整数）
        if (arrayNum.length == 1) {
            let addstr = "."
            for (let i = 0; i < pt; i++) {
                addstr += "0"
            }
            return value.toString() + addstr;
        }
        if (arrayNum.length > 1) {
            //小数点右侧 如果小于两位 则补一个0
            if (arrayNum[1].length < pt) {
                let addstr = ""
                for (let i = 0; i < pt - arrayNum[1].length; i++) {
                    addstr += "0"
                }
                return value.toString() + addstr;
            }
            return value;
        }
    }

    /**
      * 获取规范的金币显示文本,每隔三位加个逗号
      * @param digit 保留小数点后面几位小数
      * @param money 传入的金币数
      */
    static getMoney(digit: number, money: number) {
        let moneyText = Math.abs(money).toFixed(digit).toString().split('.').map((x, idx) => {
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
        if (money >= 0) { return moneyText; }
        else { return `-${moneyText}`; }
    }

    static isRealNum(val) {
        // isNaN()函数 把空串 空格 以及NUll 按照0来处理 所以先去除
        if (val === "" || val == null) {
            return false;
        }
        if (!isNaN(val)) {
            return true;
        } else {
            return false;
        }
    }

    // 贝塞尔 1个控制点 计算公式
    static bezier3(start, mid, end, t) {
        // P = (1−t)2P1 + 2(1−t)tP2 + t2P3
        return start.mul(Math.pow(1 - t, 2)).add(mid.mul(2 * (1 - t) * t)).add(end.mul(Math.pow(t, 2)));
    }
    // 贝塞尔 2个控制点 计算公式
    static bezier4(start, mid, mid2, end, t) {
        // P = (1−t)3P1 + 3(1−t)2tP2 +3(1−t)t2P3 + t3P4
        return start.mul(Math.pow(1 - t, 3)).add(mid.mul(3 * Math.pow(1 - t, 2) * t)).add(mid2.mul(3 * (1 - t) * Math.pow(t, 2))).add(end.mul(Math.pow(t, 3)));
    }
    // 根据起点和终点 获取中间控制点
    static getBezier2Mid(startPos, endPos, midLen, m1len, m2len) {
        let toEndDir = endPos.sub(startPos);
        let toMidDir = toEndDir.mul(midLen);
        // 根据角度 确定曲线控制点 (弧度计算)
        let midAngle = toEndDir.signAngle(Vec2.UNIT_X);
        let pDir = toMidDir.rotate(Math.PI / 2);
        if (Math.abs(midAngle) <= Math.PI / 2) {
            // 第1,4象限
            pDir = toMidDir.rotate(Math.PI / 2);
        } else if (Math.abs(midAngle) > Math.PI / 2) {
            // 第2,3象限
            pDir = toMidDir.rotate(-Math.PI / 2);
        }
        // 计算 控制点
        let m1Pos = startPos.add(toEndDir.mul(m1len)).add(pDir);
        let m2Pos = startPos.add(toEndDir.mul(m2len)).add(pDir);
        return [m1Pos, m2Pos]
    }

    static isNumber(val: any): boolean {
        return typeof val === 'number' && !isNaN(val);
    }
}