import { _decorator, Component, PageView, Sprite, Label, Node, find, Button, EventTouch, RichText } from 'cc';
import { App } from '../../App';
const { ccclass, property } = _decorator;

@ccclass('FreeCash')
export class FreeCash extends Component {
    @property(Label)
    money: Label = null!;
    @property(Label)
    level: Label = null!;
    @property(RichText)
    info: RichText = null!;
    @property(Label)
    type: Label = null!;
    @property(Node)
    event: Node = null!;
    private datasArray: any[] = [];
    private currentTaskIndex: number = 0;
    private taskState: number = 0;

    onLoad() {
        this.getTaskList();
    }
    async getTaskList() {
        try {
            if (!App.userData().isLogin) return;
            const ret = await App.ApiManager.getTaskList();
            console.log("TaskList:", ret);
            this.datasArray = ret?.taskList || [];
            this.onClickLeftOrRight(null, 0);
        } catch (err) {
            console.warn("Failed to get TaskList:", err);
        }
    }

    getTaskState(isFinished: boolean, isReceive: number): number {
        let type = 0;
        if (isFinished && isReceive == 0) {
            type = 1;
        }
        if (isFinished && isReceive == 1) {
            type = 2;
        }
        return type;
    }

    getEventText(type: number): string {
        let lab = "Unfinished";
        switch (type) {
            case 0:
                break;
            case 1:
                lab = "Withdraw"
                break;
            case 2:
                lab = "Finished"
                break;
        }
        return lab;
    }

    onClickLeftOrRight(e: EventTouch, index: number) {
        if (this.datasArray && this.datasArray.length > 0) {
            const taskList = this.datasArray;
            this.currentTaskIndex = (this.currentTaskIndex + Number(index) + taskList.length) % taskList.length;
            const currentTask = taskList[this.currentTaskIndex];
            this.taskState = this.getTaskState(currentTask?.isFinshed || false, currentTask?.isReceive || 0);
            this.type.string = this.getEventText(this.taskState);
            const sprite = this.event.getComponent(Sprite);
            if (sprite) { sprite.grayscale = this.taskState !== 1; }
            const button = this.event.getComponent(Button);
            if (button) { button.interactable = this.taskState !== 1; }
            this.level && (this.level.string = (this.currentTaskIndex + 1).toString());
            this.money && (this.money.string = currentTask?.taskAmount.toFixed(2));
            this.info && (this.info.string = `Number of invitees <color=#FEEE39>${currentTask?.efficientPeople}/${currentTask?.taskPeople}</c>, Recharge per people <color=#FEEE39>$${currentTask?.rechargeAmount}</color>;<color=#FEEE39>${currentTask?.rechargePeople}/${currentTask?.taskRechargePeople}</color>`)
        }
    }

    async onClickWithdraw() {
        if (!this.datasArray && this.datasArray.length === 0) {
            App.AlertManager.getCommonAlert().showWithoutCancel("non-task")
            return
        }
        if (this.taskState === 1) {
            const currentTask = this.datasArray[this.currentTaskIndex];
            const ret = await App.ApiManager.setTaskOrder(currentTask?.taskID);
            App.AlertManager.getCommonAlert().showWithoutCancel(ret?.msg)
            const TaskList = await App.ApiManager.getTaskList();
            this.datasArray = TaskList?.taskList || [];
            this.onClickLeftOrRight(null, 0);
        }
    }

    async onClickSharetoFriend() {
        App.AlertManager.getCommonAlert().showWithoutCancel("no prefab yet")
        // App.PopUpManager.addPopup("prefabs/ShareToFriend", "hall", null, true);
    }

    async onClickShareToPlayer() {
        App.AlertManager.getCommonAlert().showWithoutCancel("no prefab yet")
        // App.PopUpManager.addPopup("prefabs/ShareToPlayer", "hall", null, true);
    }
}