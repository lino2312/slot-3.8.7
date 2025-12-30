import { _decorator, Button, Component, Node } from 'cc';
import { App } from '../../App';
const { ccclass, property } = _decorator;

@ccclass('SlotGamePanelClick')
export class SlotGamePanelClick extends Component {

    @property(Button)
    btnPanel: Button = null;

    protected onLoad(): void {
        this.btnPanel.node.on(Node.EventType.TOUCH_END, this.onClickPanelBtn, this);
    }

    start() {

    }

    update(deltaTime: number) {
        
    }

    onClickPanelBtn(){
        if(App.SubGameManager.getSlotGameDataScript().getAutoModelTime() > 0){
            return
        }
        let state = App.SubGameManager.getSlotGameDataScript().getSlotState();
        if(state == "idle"){
            this.sendSpinEvent();
        } else if(state == "moveing_2"){
            this.sendStopEvent();
        }
 
    }

    sendSpinEvent(){
        App.SubGameManager.getSlotGameDataScript().getBottomScript().onClickSpin();
    }

    sendStopEvent(){
        App.SubGameManager.getSlotGameDataScript().getBottomScript().onClickSpin();
    }
}


