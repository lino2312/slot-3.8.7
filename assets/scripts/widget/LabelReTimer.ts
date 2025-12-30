import { _decorator, Component, Label, Node } from 'cc';
const { ccclass, property } = _decorator;

/**
 * 倒计时组件
 */
@ccclass('LabelReTimer')
export class LabelReTimer extends Component {
    private _nInter: number = 0;
    private _nTime: number = 0;
    private _nStep: number = 1;
    private _bStop: boolean = false;
    private _endCall: (() => void) | null = null;
    private _perCall: ((nTime: number) => void) | null = null;
    private _formatStr: string | null = null;

    start() {
        // Initialization logic if needed
    }

    /**
     * 设置倒计时
     * @param nTime 倒计时(单位s)
     * @param nStep 步长（单位s）
     * @param endCall 结束回调
     * @param formatStr 显示样式: "(%ss)"
     * @param perCall 每步的回调
     */
    public setReTimer(
        nTime: number,
        nStep: number = 1,
        endCall?: () => void,
        formatStr?: string,
        perCall?: (nTime: number) => void
    ) {
        this._bStop = false;
        this._nInter = 0;
        this._nTime = nTime;
        this._nStep = nStep;
        this._endCall = endCall || null;
        this._perCall = perCall || null;
        this._formatStr = formatStr || null;
        this._showTime(this._nTime);
    }

    private _showTime(val: number) {
        const label = this.node.getComponent(Label);
        if (!label) return;
        if (this._formatStr) {
            label.string = this._formatStr.replace('%s', val.toString());
        } else {
            label.string = this._formatSec(val);
        }
    }

    // 默认格式化秒为 mm:ss
    private _formatSec(val: number): string {
        const m = Math.floor(val / 60);
        const s = val % 60;
        return m > 0 ? `${m}:${s.toString().padStart(2, '0')}` : `${s}`;
    }

    update(dt: number) {
        if (this._bStop) return;
        this._nInter += dt;
        if (this._nInter >= this._nStep) {
            this._nInter = 0;
            this._nTime -= 1;
            if (this._nTime < 0) {
                this._nTime = 0;
            }
            this._showTime(this._nTime);
            if (this._perCall) this._perCall(this._nTime);
            if (this._nTime <= 0) {
                this._bStop = true;
                if (this._endCall) {
                    this._endCall();
                }
            }
        }
    }
}


