import { _decorator, Component } from 'cc';
import { App } from '../App';
const { ccclass, property } = _decorator;

@ccclass('bonusLogin')
export class yd_bonus_login extends Component {

    onClickLuckyWheel() {
        // @ts-ignore
        App.PopUpManager.addPopup("BalootClient/LuckyWheel/LuckyWheel");
    }

}
