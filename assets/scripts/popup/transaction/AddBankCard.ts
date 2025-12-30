import { _decorator, Component, Node } from 'cc';
import { App } from '../../App';
const { ccclass, property } = _decorator;

@ccclass('AddBankCard')
export class AddBankCard extends Component {
    start() {

    }

    update(deltaTime: number) {
        
    }

    onBindCard() {
        App.PopUpManager.addPopup('prefabs/popup/popupBindBankCard', 'hall', null, false);
    }
}


