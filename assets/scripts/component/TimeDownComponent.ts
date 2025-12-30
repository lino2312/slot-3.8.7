import { _decorator, Component, Label, Node, RichText } from 'cc';
import { App } from '../App';
const { ccclass, property } = _decorator;

@ccclass('TimeDownComponent')
export class TimeDownComponent extends Component {
    @property(Label)
    label: Label = null;
    @property(RichText)
    richText: RichText = null;


    pause: boolean = false;

    private _timelife = 0;

    private callback: Function;
    private updateFunc: Function;
    private formatStr = "hh:mm:ss";

    set timelife(value) {
        this._timelife = value;
        if (this.label) {
            this.label.string = value > 0 ? App.FormatUtils.formatSecond(value, this.formatStr) : "";
            if (this.updateFunc) this.updateFunc(value, this.label);
        }
        if (this.richText) {
            this.richText.string = value > 0 ? App.FormatUtils.formatSecond(value, this.formatStr) : "";
            if (this.updateFunc) this.updateFunc(value, this.richText);
        }
    }
    get timelife() {
        return this._timelife;
    }

    onLoad() {
        this.schedule(() => {
            if (this.pause) return;
            if (this.timelife > 0) {
                this.timelife--;
                if (this.timelife <= 0 && this.callback) this.callback();
            }
        }, 1)
    }

    setUpdateFunc(updateFunc) {
        this.updateFunc = updateFunc;
    }
    setCallback(callback) {
        this.callback = callback;
    }
    setTimeFormatStr(formatStr) {
        this.formatStr = formatStr;
    }
}


