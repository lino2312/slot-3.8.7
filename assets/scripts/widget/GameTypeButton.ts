import { _decorator, Button, Color, Component, find, Label, Node, Sprite, isValid } from 'cc';
import { Config } from '../config/Config';
import { App } from '../App';
import { GameItemData } from '../data/GameItemData';
const { ccclass, property } = _decorator;

@ccclass('GameTypeButton')
export class GameTypeButton extends Component {

    @property(Label)
    typeLabel: Label | null = null;

    @property(Button)
    typeButton: Button | null = null;

    @property(Sprite)
    selectedSprite: Sprite | null = null;

    private data: any = null;

    /** 必须缓存事件回调，避免 onDestroy 时 bind 新函数 */
    private _clickHandler: Function | null = null;

    onLoad() {
        // 缓存同一个引用
        this._clickHandler = this.onClick.bind(this);

        App.ComponentUtils.onClick(this.typeButton, this._clickHandler, this);
    }

    init(data: any) {
        this.setUp(data);
    }

    setUp(data: any) {
        this.data = data;
        this.typeLabel.string = data.slotsName;

        if (this.typeLabel.string == "InHouse" && Config.gameChannel === "D105") this.typeLabel.string = "MiGame";
        if (this.typeLabel.string == "InHouse" && Config.gameChannel === "D106") this.typeLabel.string = "SwertePlay";
        if (this.typeLabel.string == "PGE") this.typeLabel.string = "PG";
        if (this.typeLabel.string == "PPE") this.typeLabel.string = "PP";
        if (this.typeLabel.string == "JILIE") this.typeLabel.string = "JILI";
        if (this.typeLabel.string == "JDBE") this.typeLabel.string = "JDB";

        this.selectedSprite.node.active = false;
    }

    /** 安全解绑，避免报错 */
    onDestroy() {
        if (this._clickHandler && isValid(this.typeButton, true)) {
            App.ComponentUtils.offClick(this.typeButton, this._clickHandler, this);
        }
        this._clickHandler = null;
    }

    async onClick() {
        let parent = this.node.parent;
        if (parent) {
            for (let index = 0; index < parent.children.length; index++) {
                const element = parent.children[index];

                const sel = find("selectedSprite", element);
                if (sel) sel.active = false;

                const label = find("vendorLabel", element)?.getComponent(Label);
                if (label) {
                    label.color = new Color(143, 217, 199);
                }
            }

            if (this.typeLabel) {
                this.typeLabel.color = new Color(252, 223, 39);
            }
        }

        if (this.selectedSprite) {
            this.selectedSprite.node.active = true;
        }

        const slotsTypeID = this.data.slotsTypeID;
        const gameList = GameItemData.slotVendorGameMap.get(slotsTypeID) || [];

        App.EventUtils.dispatchEvent("setupGameItem", slotsTypeID, gameList);
    }
}
