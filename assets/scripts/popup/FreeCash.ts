import { _decorator, Component, PageView, Sprite, Label, Node, find, Button, EventTouch, RichText } from 'cc';
import { App } from '../App';
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
            if (button) { button.interactable = this.taskState === 1; }
            this.level && (this.level.string = (this.currentTaskIndex + 1).toString());
            this.money && (this.money.string = currentTask?.taskAmount.toFixed(2));
            this.info && (this.info.string = `Number of invitees <color=#FEEE39>${currentTask?.efficientPeople}/${currentTask?.taskPeople}</c>, Recharge per people <color=#FEEE39>$${currentTask?.rechargeAmount}</color>;<color=#FEEE39>${currentTask?.rechargePeople}/${currentTask?.taskRechargePeople}</color>`)
        }
    }

    onClickWithdraw() {
        if (!this.datasArray || this.datasArray.length === 0) {
            App.AlertManager.getCommonAlert().showWithoutCancel("non-task");
            return;
        }
        if (this.taskState === 1) {
            const currentTask = this.datasArray[this.currentTaskIndex];
            const self = this;
           
            // 点击后先禁用按钮并变灰，防止重复点击
            const button = this.event.getComponent(Button);
            if (button) { button.interactable = false; }
            const sprite = this.event.getComponent(Sprite);
            if (sprite) { sprite.grayscale = true; }
            
            // 更新本地状态
            this.taskState = 2;
            this.type.string = this.getEventText(2);
            currentTask.isReceive = 1;
           
            App.ApiManager.setTaskOrder(currentTask?.taskID).then((ret: any) => {
               App.AlertManager.getCommonAlert().showWithoutCancel(ret.msg);
                if (ret.msg === 'Succeed') {
                    // 刷新任务列表（不调用 onClickLeftOrRight 避免覆盖状态）
                    App.ApiManager.getTaskList().then((TaskList: any) => {
                        self.datasArray = TaskList?.taskList || [];
                    });
                } else {
                    if (button) { button.interactable = true; }
                    if (sprite) { sprite.grayscale = false; }
                    self.taskState = 1;
                    self.type.string = self.getEventText(1);
                    currentTask.isReceive = 0;
                }
            }).catch((err: any) => {
                console.warn('领取失败:', err);
                // 失败时恢复按钮和状态
                if (button) { button.interactable = true; }
                if (sprite) { sprite.grayscale = false; }
                self.taskState = 1;
                self.type.string = self.getEventText(1);
                currentTask.isReceive = 0;
            });
        }
    }

    async onClickSharetoFriend() {
        // App.AlertManager.getCommonAlert().showWithoutCancel("no prefab yet")
        App.PopUpManager.addPopup("prefabs/freeCash/shareFriend", "hall", null, true);
    }

    async onClickShareToPlayer() {
        // App.AlertManager.getCommonAlert().showWithoutCancel("no prefab yet")
        App.PopUpManager.addPopup("prefabs/freeCash/sharePlayer", "hall", null, true);
    }

   async onClickRecordBtn(){
   
App.PopUpManager.addPopup("prefabs/freeCash/InvitationRecord", "hall", null, true);
    }
}