import Utils from "./MyUtils";
import { _decorator, Component, Label, Enum, misc, math } from 'cc';
const { ccclass, property, menu } = _decorator;

enum SCROLL_TYPE {
    /** 只会从低位递增/递减 */
    SLOW,
    /** 从地位向高位一次递增/递减*/
    NORMAL,
    /** 每一位同时递增/递减*/
    FAST,
    /** 指定滚动时间*/
    TIME,
}

enum VALUE_TYPE {
    /** 整数模式,只会以整数处理 */
    INTEGER,
    /** 整数模式,每隔三位用','隔开 */
    INTEGER_COMMA,
    /** 小数模式,最终结果保留两位小数 0.00 */
    FIXED_NUM,
    /** 整数部分每隔三位用','隔开 */
    FIXED_NUM_COMMA,
    /** 计时器模式,以计时器格式变动 00:00 */
    TIMER,
    /** 百分比模式 (百分比结果 基于小数,因此初始值必须为小数)*/
    PERCENTAGE,
    /** 缩写单位模式KMBT */
    KMBT_FIXED2,
    /** 自定义模式 (通过传入的函数,进行自定义) */
    CUSTOMER
}

type CustomCallback = (curValue: number, targetValue: number) => string;

/**
 * [滚动数字] ver 0.5.0
 * 将会使用 lerp 自动滚动数字到目标数值
 */
@ccclass
@menu("添加特殊行为/Roll Number (滚动数字)")
export class RollNumber extends Component {
    @property({
        type: Label,
        tooltip: '需要滚动的 Label 组件,如果不进行设置，就会从自己的节点自动查找'
    })
    label: Label | null = null;

    @property({
        tooltip: '当前的滚动值(开始的滚动值)'
    })
    value: number = 0;

    @property({
        tooltip: '是否显示正负符号'
    })
    showPlusSymbol: boolean = false;

    @property({
        tooltip: '滚动的目标值'
    })
    public get targetValue(): number {
        return this._targetValue;
    }
    public set targetValue(v: number) {
        this._targetValue = v;
    }
    @property
    private _targetValue: number = 0;

    @property({
        tooltip: '滚动的线性差值',
        visible: false
    })
    lerp = 0.4;

    @property({
        tooltip: '在滚动之前会等待几秒',
    })
    private runWaitTimer: number = 0;

    @property({
        type: Enum(SCROLL_TYPE),
        tooltip: '滚动方式'
    })
    private scrollType: SCROLL_TYPE = SCROLL_TYPE.NORMAL;

    @property({
        type: Enum(VALUE_TYPE),
        tooltip: '文本格式化类型'
    })
    private valueType: VALUE_TYPE = VALUE_TYPE.INTEGER;

    @property({
        tooltip: '是否等于0时显示'
    })
    private showZero: boolean = true;

    @property({
        tooltip: 'scrollType=SCROLL_TYPE.TIME时的滚动时长'
    })
    private scrollTime: number = 0;

    private valueTypeTmp = VALUE_TYPE.INTEGER;

    /** 自定义string 处理函数 */
    private _custom_callback: CustomCallback | null = null;

    private isInit = false;
    private isScrolling = false;

    private cbScrollFinished: Function = null;
    private cbScrollProgress: Function = null;

    private numRate = 0;

    private fixedNumber = 2;

    private startTargetValue = 0;
    private realTargetValue = 0;
    private startScrollTime = 0;

    onLoad() {
        if (this.label == undefined) {
            this.label = this.node.getComponent(Label);
        }

        switch (this.scrollType) {
            case SCROLL_TYPE.SLOW:
                this.lerp = 0.02;
                break;
            case SCROLL_TYPE.NORMAL:
                this.lerp = 0.3;
                break;
            case SCROLL_TYPE.FAST:
                this.lerp = 0.5;
                break;
            default:
                break;
        }
        this.valueTypeTmp = this.valueType;
    }

    /** 开始滚动数字 */
    scroll() {
        if (this.isScrolling) return;       //  已经在滚动了就返回
        if (this.value == this.targetValue) return;
        if (this.runWaitTimer > 0) {
            this.scheduleOnce(() => {
                this.isScrolling = true;
            }, this.runWaitTimer);
        }
        else {
            this.isScrolling = true;
        }
    }

    /** 停止滚动数字 */
    stop() {
        this.numRate = 0;
        this.targetValue = this.realTargetValue;
        this.value = this.realTargetValue;
        this.updateLabel();
        if (!this.isScrolling) {
            return;
        }
        this.isScrolling = false;
        if (this.cbScrollFinished) {
            this.cbScrollFinished();
            this.cbScrollFinished = null;
        }
    }

    reset(targetValue: number) {
        this.realTargetValue = targetValue;
        this.stop();
    }

    getIsInit() {
        return this.isInit;
    }

    getIsScrolling() {
        return this.isScrolling;
    }

    /** 初始化数值,不填写则全部按默认值处理 */
    init(value?: number, target?: number, lerp?: number) {
        this.isInit = true;
        this.realTargetValue = target || 0;
        this.targetValue = target || 0;
        this.value = value || 0;
        if (lerp) {
            this.lerp = lerp;
        }
        switch (this.valueType) {
            case VALUE_TYPE.FIXED_NUM:
            case VALUE_TYPE.FIXED_NUM_COMMA:
                if (Number.isInteger(target)) {
                    this.valueTypeTmp = VALUE_TYPE.INTEGER+(this.valueType-VALUE_TYPE.FIXED_NUM);
                } else {
                    this.valueTypeTmp = this.valueType;
                }
                break;
            default:
                this.valueTypeTmp = this.valueType;
                break;
        }
        this.isScrolling = false;
        this.numRate = 0;
        this.updateLabel();
    }

    setFixedNumber(num: number) {
        this.fixedNumber = num;
    }

    setScrollTime(time: number) {
        this.scrollTime = time;
    }

    /** 滚动到指定数字 */
    scrollTo(target: number, callback: Function = null, cbScrollProgress: Function = null) {
        if (target === null || target === undefined) return;
        this.startTargetValue = this.targetValue;
        this.realTargetValue = target;
        this.cbScrollFinished = callback;
        this.cbScrollProgress = cbScrollProgress;
        if (this.numRate > 0) {
            this.value /= Math.pow(10, this.numRate);
            this.numRate = 0;
        }
        if (this.value == target) {
            if (this.cbScrollFinished) {
                this.cbScrollFinished();
            }
            return;
        }
        this.targetValue = target;
        if (!Number.isInteger(this.targetValue)) {
            let listTmp = this.targetValue.toString().split('.');
            if (listTmp.length > 1) {
                this.numRate = listTmp[1].length;
            }
        }
        if (this.numRate > 0) {
            this.value *= Math.pow(10, this.numRate);
            this.targetValue *= Math.pow(10, this.numRate);
        }
        this.startScrollTime = Date.now();
        this.scroll();
    }

    /** 更新文本 */
    updateLabel() {
        let value = this.value;
        if (this.numRate > 0) {
            value = this.value / Math.pow(10, this.numRate);
        }
        let string = '';

        switch (this.valueTypeTmp) {
            case VALUE_TYPE.INTEGER:                        // 最终显示整数类型
                string = Math.floor(value) + '';
                break;
            case VALUE_TYPE.INTEGER_COMMA:                  // 最终显示整数类型，每隔三位用','隔开
                string = this.getNumCommaText(Math.floor(value));
                break;
            case VALUE_TYPE.FIXED_NUM:                        // 最终显示两位小数类型
                string = Utils.numToFixed(value, this.fixedNumber);
                break;
            case VALUE_TYPE.FIXED_NUM_COMMA:
                string = this.getNumCommaText(Utils.numToFixed(value, this.fixedNumber));
                break;
            case VALUE_TYPE.TIMER:                          // 最终显示 计时器类型
                string = parseTimer(value);
                break;
            case VALUE_TYPE.PERCENTAGE:                     // 最终显示 百分比
                string = Math.floor(value * 100) + '%';
                break;
            case VALUE_TYPE.KMBT_FIXED2:                    // 长单位缩放,只计算到 KMBT
                if (value >= Number.MAX_VALUE) {
                    string = 'MAX';
                }
                else if (value > 1000000000000) {
                    string = Utils.numToFixed(value / 1000000000000, this.fixedNumber) + 'T';
                }
                else if (value > 1000000000) {
                    string = Utils.numToFixed(value / 1000000000, this.fixedNumber) + 'B';
                }
                else if (value > 1000000) {
                    string = Utils.numToFixed(value / 1000000, this.fixedNumber) + 'M';
                }
                else if (value > 1000) {
                    string = Utils.numToFixed(value / 1000, this.fixedNumber) + "K";
                }
                else {
                    string = Math.floor(value).toString();
                }
                break;
            case VALUE_TYPE.CUSTOMER: // 自定义设置模式 (通过给定的自定义函数..处理)
                if (this._custom_callback) {
                    string = this._custom_callback(this.value, this.targetValue);
                }
                break;
            default:
                break;
        }

        // 显示正负符号

        if (this.showPlusSymbol) {
            if (value > 0) {
                string = '+' + string;
            }
            else if (value < 0) {
                string = '-' + string;
            }
        }

        if (this.label) {
            if (this.isScrolling) {
            } else {
                if (this.realTargetValue == 0 && !this.showZero) {
                    string = '';
                } else {
                    let ndPreText = this.label.string;
                    if (ndPreText) {
                        if (string === ndPreText) return;   // 保证效率,如果上次赋值过,就不重复赋值
                    } else {
                        if (string === this.label.string) return;   // 保证效率,如果上次赋值过,就不重复赋值
                    }
                }
            }
            this.label.string = string;
        }
    }

    getNumCommaText(num: number | string) {
        let strValue = num.toString();
        if (parseInt(strValue) >= 1000) {
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
        return strValue;
    }

    update(dt: number) {
        if (this.isScrolling == false) return;
        if (this.value != this.targetValue) {
            if (this.scrollType != SCROLL_TYPE.TIME) {
                this.value = math.lerp(this.value, this.targetValue, this.lerp);

                if (this.targetValue > this.value) {
                    if (this.targetValue - this.value <= 1/Math.pow(10, this.numRate)) {
                        this.value = this.targetValue;
                    }
                } else {
                    if (this.targetValue - this.value >= -1/Math.pow(10, this.numRate)) {
                        this.value = this.targetValue;
                    }
                }
            } else {
                let curTime = Date.now();
                if (this.startScrollTime+this.scrollTime*1000 > curTime) {
                    this.value = this.startTargetValue+(this.targetValue-this.startTargetValue)*(Date.now()-this.startScrollTime)/(this.scrollTime*1000);
                } else {
                    this.value = this.targetValue;
                }
            }
        }
        if (this.cbScrollProgress) {
            this.cbScrollProgress(this.value);
        }
        if (this.value == this.targetValue) {
            this.stop();
        } else {
            this.updateLabel();
        }
    }
}

/** 时间格式转换 */
function parseTimer(timer: number = 0, isFullTimer: boolean = true) {
    let t: number = Math.floor(timer);
    let hours: number = Math.floor(t / 3600);
    let mins: number = Math.floor((t % 3600) / 60);
    let secs: number = t % 60;
    let m = '' + mins;
    let s = '' + secs;
    if (secs < 10) s = '0' + secs;

    // full timer 按小时算,无论有没有小时
    if (isFullTimer) {
        if (mins < 10) m = '0' + mins;
        return hours + ':' + m + ':' + s;
    }
    else {
        m = '' + (mins + hours * 60);
        if (mins < 10) m = '0' + mins;
        return m + ':' + s;
    }
}