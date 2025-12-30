import { _decorator, Component, Node, Prefab, ToggleContainer, Toggle, Widget, instantiate } from 'cc';
import { yd_bonus_model } from './bonusModel';
import { App } from '../App';
import { Config } from '../config/Config';
const { ccclass, property } = _decorator;

@ccclass('bonusTask')
export class yd_bonus_task extends Component {

    @property(Node)
    list: Node = null!;

    @property(ToggleContainer)
    taskToggle: ToggleContainer = null!;

    @property(Node)
    gameToggle: Node = null!;

    @property(ToggleContainer)
    topToggle: ToggleContainer = null!;

    @property(Node)
    profitToggle: Node = null!;

    @property(Node)
    content: Node = null!;

    @property(Node)
    betNode: Node = null!;

    @property(Prefab)
    item: Prefab = null!;

    @property([Node])
    buttonNode: Node[] = [];

    private _model: yd_bonus_model | null = null;
    private datasource: any[] = [];
    private taskType: string = '';

    private buttonNode1 = false;
    private buttonNode2 = false;
    private buttonNode3 = false;
    private buttonNode4 = false;

    private AudioManager = false;

    onLoad() {
        this.node.height = this.node.parent?.parent?.getComponent(Widget)?.node.height ?? 0;
        this._model = yd_bonus_model.getInstance();
        this.datasource = [];
    }

    start() {
        if (Config.gameChannel === 'D107') {
            this.taskToggle.node.setPosition(-299.018, 0);
            this.buttonNode.forEach(node => node.active = false);
        }
    }

    onEnable() {
        this.onClickDailyTask();
        const taskToggle = this.taskToggle.toggleItems;
        if (taskToggle.length > 0) taskToggle[0].isChecked = true;
        const topToggle = this.topToggle.toggleItems;
        if (topToggle.length > 0) topToggle[0].isChecked = true;
        this.AudioManager = true;
    }

    async onClickDailyTask(event: Event) {
        if (event) {
            const toggle = event.target.getComponent(cc.Toggle);
            if (!toggle || !toggle.isChecked) return;
        }
        if (!this.AudioManager) {
            App.AudioManager.playBtnClick();
        }
        this.AudioManager = false;
        this.content.removeAllChildren();
        try {
            const response = await this._model?.getDailyAwardList();
            console.log('RESPONSE: onClickDailyTask', response);
            this.datasource = response.data;
            this.taskType = 'day';

            if (this.taskToggle?.toggleItems?.[0]) {
                this.taskToggle.toggleItems[0].isChecked = true;
            }

            this.showButton();
        } catch (error) {
            console.error('ERROR:', error);
        }
    }


    async onClickWeeklyTask(event: Event) {
        if (event) {
            const toggle = event.target.getComponent(cc.Toggle);
            if (!toggle || !toggle.isChecked) return;
        }
        App.AudioManager.playBtnClick();
        this.content.removeAllChildren();
        try {
            const response = await this._model?.getWeeklyAwardList();
            console.log('RESPONSE: onClickWeeklyTask', response);
            this.datasource = response.data;
            this.taskType = 'week';
            if (this.taskToggle?.toggleItems?.[0]) {
                this.taskToggle.toggleItems[0].isChecked = true;
            }
            this.showButton();
        } catch (error) {
            console.error('ERROR:', error);
        }
    }

    async onClickMonthTask(event: Event) {
        if (event) {
            const toggle = event.target.getComponent(cc.Toggle);
            if (!toggle || !toggle.isChecked) return;
        }
        App.AudioManager.playBtnClick();
        this.content.removeAllChildren();
        try {
            const response = await this._model?.getMonthlyAwardList();
            console.log('RESPONSE: onClickMonthTask', response);
            this.datasource = response.data;
            this.taskType = 'month';
            if (this.taskToggle?.toggleItems?.[0]) {
                this.taskToggle.toggleItems[0].isChecked = true;
            }
            this.showButton();
        } catch (error) {
            console.error('ERROR:', error);
        }
    }

    showButton() {
        const array = this.datasource;
        this.buttonNode1 = this.buttonNode2 = this.buttonNode3 = this.buttonNode4 = false;

        for (const element of array) {
            switch (element.taskId) {
                case 'A1':
                    this.buttonNode1 = true;
                    break;
                case 'A3':
                    this.buttonNode2 = true;
                    break;
                case 'B1':
                case 'B3':
                case 'B5':
                case 'B7':
                    this.buttonNode3 = true;
                    break;
                case 'E1':
                case 'E2':
                case 'E3':
                case 'E4':
                    this.buttonNode4 = true;
                    break;
            }
        }

        const state = [this.buttonNode1, this.buttonNode2, this.buttonNode3, this.buttonNode4];
        this.buttonNode.forEach((btn, i) => {
            btn.active = state[i];
            if (state[i]) {
                // btn.children[1].active = true;
                switch (i) {
                    case 0: this.onAddItem(null, 'A1'); break;
                    case 1: this.onAddItem(null, 'A3'); break;
                    case 2: this.onAddItem(null, 'B1,B3,B5,B7'); break;
                    case 3: this.onAddItem(null, 'E1,E2,E3,E4'); break;
                }
            }
        });
    }

    onAddItem(e: Event | null, type: string) {
        if (e) {
            const toggle = e.target.getComponent(cc.Toggle);
            if (!toggle || !toggle.isChecked) return;
        }
        let types: string[] = [];
        this.content.removeAllChildren();

        const str = type.split(',');
        const widget = this.content.parent?.parent?.getComponent(Widget);
        if (!widget) return;

        widget.top = 148;
        widget.bottom = 28;
        this.betNode.active = true;

        const bet = this.betNode.getChildByName('bet');
        const profit = this.betNode.getChildByName('profit');
        const gameToggle = this.gameToggle.children;
        const profitToggle = this.profitToggle.children;

        switch (type) {
            case 'A1':
            case 'A3':
                types = str;
                this.betNode.active = false;
                widget.top = 28;
                widget.bottom = 28;
                break;
            case 'B1,B3,B5,B7':
                gameToggle.forEach(e => e.getComponent(Toggle).isChecked = true);
                bet.active = true;
                profit.active = false;
                types = str;
                break;
            case 'B1':
            case 'B3':
            case 'B5':
            case 'B7':
                gameToggle.forEach(e => {
                    if (e.getComponent(Toggle).isChecked) types.push(e.name);
                });
                break;
            case 'E1,E2,E3,E4':
                profitToggle.forEach(e => e.getComponent(Toggle).isChecked = true);
                bet.active = false;
                profit.active = true;
                types = str;
                break;
            case 'E1':
            case 'E2':
            case 'E3':
            case 'E4':
                profitToggle.forEach(e => {
                    if (e.getComponent(Toggle).isChecked) types.push(e.name);
                });
                break;
        }

        for (const element of this.datasource) {
            if (types.includes(element.taskId)) {
                const prefab = instantiate(this.item);
                if (prefab) {
                    const item = prefab.getComponent('bonusTaskItem') as any;
                    if (item) {
                        item.datasource = element;
                        item.datasource.type = this.taskType;
                        item.datasource.cb = () => element.status = 3;
                        this.content.addChild(item.node);
                    }
                }
            }
        }
        widget.updateAlignment();
    }
}
