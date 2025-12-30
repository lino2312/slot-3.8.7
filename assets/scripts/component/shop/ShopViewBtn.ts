import { _decorator, Component, Button } from 'cc';
import { App } from '../../App';
const { ccclass, property, requireComponent } = _decorator;

@ccclass('ShopViewBtn')
@requireComponent(Button)
export default class ShopViewBtn extends Component {
    @property
    open: number = -1;

    private _button: Button | null = null;

    onLoad() {
        this._button = this.getComponent(Button);
    }

    onEnable() {
        this._button?.node.on(Button.EventType.CLICK, this.onClick, this);
    }

    onDisable() {
        this._button?.node.off(Button.EventType.CLICK, this.onClick, this);
    }

    private onClick() {
        App.EventUtils.dispatchEvent('HALL_OPEN_SHOP', { open: this.open });
    }
}