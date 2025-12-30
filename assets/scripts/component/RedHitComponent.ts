import { _decorator, Component, Node, Label, Button } from 'cc';
import { App } from '../App';
const { ccclass, property } = _decorator;

@ccclass('RedHitComponent')
export class RedHitComponent extends Component {
    @property({ tooltip: '红点key，多个用逗号分隔' })
    key: string = 'mail_notify';

    @property({ type: Label, tooltip: '显示数量的Label' })
    valueLabel: Label = null;

    @property({ tooltip: '是否高级模式' })
    advanced: boolean = false;

    @property({ tooltip: '互斥key', visible() { return this.advanced; } })
    keyMutuallyExclusive: string = '';

    @property({ tooltip: '是否记录点击', visible() { return this.advanced; } })
    checkMemory: boolean = false;

    @property({ type: Button, tooltip: '记录点击的按钮', visible() { return this.advanced; } })
    btnMemory: Button = null;

    // @property({ type: Node })
    // tabbar: Node = null;

    onLoad() {
        App.RedHitManager.register(this);
        if (this.btnMemory) {
            this.btnMemory.node.on(Button.EventType.CLICK, this.onClickRecord, this);
        }
    }

    onEnable() {
        this.updateView();
    }

    onDestroy() {
        App.RedHitManager.unregister(this);
    }

    updateView() {
        const data = App.RedHitManager.data;
        if (!this.key || this.key.length === 0) {
            this.node.active = false;
            return;
        }

        const keyArr = this.key.split(',').map(k => k.trim());
        let count = 0;

        for (const k of keyArr) {
            if (data[k]) {
                count += data[k];
            }
        }

        this.node.active = count > 0;

        if (this.valueLabel) {
            this.valueLabel.string = count > 99 ? '99+' : count.toString();
        }
    }


    onClickRecord() {
        if (this.checkMemory && this.node.active) {
            if (App.RedHitManager.clickRecordList.indexOf(this.key) < 0) {
                App.RedHitManager.clickRecordList.push(this.key);
                App.RedHitManager.updateView();
            }
        }
    }
}


