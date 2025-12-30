import { _decorator, Button, Component, find, Node, UITransform, Vec3, view } from 'cc';
import { App } from '../App';

const { ccclass, property } = _decorator;

@ccclass('SlotGameMenuComponent')
export class SlotGameMenuComponent extends Component {

    private slotGameDataScript: any = null;
    _endCall: any;

    onLoad() {

        //关闭
        find("btn_close", this.node).on(Node.EventType.TOUCH_END, this.onBtnMenuClose, this);
        find("btn_sound", this.node).on(Node.EventType.TOUCH_END, this.onMenuSoundClicked, this);
        find("btn_music", this.node).on(Node.EventType.TOUCH_END, this.onMenuMusicClicked, this);
        find("btn_help", this.node).on(Node.EventType.TOUCH_END, this.onMenuHelpClicked, this);
        find("btn_exit", this.node).on(Node.EventType.TOUCH_END, this.onMenuExit, this);
        this.slotGameDataScript = App.SubGameManager.getSlotGameDataScript();
        App.EventUtils.on(App.EventID.SLOT_HIDE_MENU, this.onHideMenu, this);
        this.checkSoundVal();
    }

    start() {
        // 点击空白部分关闭菜单
        const outNode = new Node('node_out');
        outNode.addComponent(Button);
        outNode.parent = this.node;

        // 设置足够大的尺寸覆盖全屏
        outNode.setScale(1, 1, 1);
        outNode.setPosition(0, 0, 0);
        outNode.layer = this.node.layer;

        const { width, height } = view.getVisibleSize ? view.getVisibleSize() : { width: 1920, height: 1080 };
        const uiTransform = outNode.getComponent(UITransform) || outNode.addComponent(UITransform);
        uiTransform.setContentSize(width * 2, height * 2);

        // 居中
        const pos = this.node.getComponent(UITransform)
            ? this.node.getComponent(UITransform)!.convertToNodeSpaceAR(new Vec3(width / 2, height / 2, 0))
            : new Vec3(0, 0, 0);
        outNode.setPosition(pos);
        outNode.setSiblingIndex(0); // 保证在最底层
        outNode.on(Node.EventType.TOUCH_END, this.onBtnMenuClose, this);

        // 控制帮助按钮显示
        const help = find('btn_help', this.node);
        if (help) {
            help.active = !App.SubGameManager.isInSubGame();
        }
    }

    update(deltaTime: number) {

    }

    protected onDestroy(): void {
        App.EventUtils.offTarget(this);
        if (this._endCall) {
            this._endCall()
        }
    }

    setCloseCall(endCall) {
        this._endCall = endCall
    }

    //检查声音设置
    checkSoundVal() {
        let btnSound = find("btn_sound", this.node);
        btnSound.getChildByName("on").active = App.AudioManager.getEffVolume() > 0;
        btnSound.getChildByName("off").active = !btnSound.getChildByName("on").active;


        let btnMusic = find("btn_music", this.node);
        let musicOn = btnMusic.getChildByName("on");
        let musicOff = btnMusic.getChildByName("off");
        musicOn.active = App.AudioManager.getBgmVolume() > 0;
        musicOff.active = !musicOn.active;
    }

    //音效
    onMenuSoundClicked() {
        App.AudioManager.playSfx("audio/slotGame/", "common_click");
        let btnSound = find("btn_sound", this.node);
        btnSound.getChildByName("on").active = !btnSound.getChildByName("on").active;
        btnSound.getChildByName("off").active = !btnSound.getChildByName("on").active;

        let volume = btnSound.getChildByName("on").active ? 1 : 0;
        App.AudioManager.setEffVolume(volume);
    }

    //背景音
    onMenuMusicClicked() {
        App.AudioManager.playSfx("audio/slotGame/", "common_click");
        let btnMusic = find("btn_music", this.node);
        btnMusic.getChildByName("on").active = !btnMusic.getChildByName("on").active;
        btnMusic.getChildByName("off").active = !btnMusic.getChildByName("on").active;

        let volume = btnMusic.getChildByName("on").active ? 1 : 0;
        App.AudioManager.setBgmVolume(volume);
    }

    onMenuHelpClicked() {
        console.log("问题帮助")
        if (this.slotGameDataScript) {
            let cfg = this.slotGameDataScript.getGameCfg();
            let help_script = cfg.help_prefab_cfg;
            let help_prefab_url = cfg.help_prefab;

            if (!help_prefab_url) {//没配置就使用默认的
                help_prefab_url = "prefabs/slotgame/LMSlots_Help_prefab"
            }

            if (!help_script) {
                help_script = 'LMSlots_Help_Base';
            }

            if (!help_prefab_url) {
                console.log("未在cfg中配置help预制的路径");
                return
            }


            App.PopUpManager.addPopup(help_prefab_url, "hall");
            // App.ResUtils.getPrefab(help_prefab_url).then((prefab) => {
            //     let old = this.node.parent.getChildByName('help_node')
            //     if (!old) {
            //         old = instantiate(prefab)
            //         let script = old.getComponent(help_script);
            //         if (!script) {
            //             old.addComponent(help_script);
            //         }
            //         old.name = 'help_node'
            //         old.parent = this.node.parent
            //         old.active = true
            //     }
            //     else {
            //         old.active = true
            //     }
            //     this.node.destroy()
            // }).catch((err) => {
            //     console.warn('加载帮助预制失败:', help_prefab_url, err);
            // });
        }
    }

    setBackLobby(bEnable) {
        let menu = find("btn_exit", this.node);
        menu.getComponent(Button).interactable = bEnable;
    }

    //返回大厅
    onMenuExit() {
        App.AudioManager.playSfx("audio/slotGame/", "common_click");
        if (this.slotGameDataScript) {
            console.log("onMenuExit")
            this.slotGameDataScript.reqBackLobby()
        }
    }

    onHideMenu() {
        //按cash,只有自己关闭其它不能关
        this.node.destroy();
    }

    onBtnMenuClose() {
        App.AudioManager.playSfx("audio/slotGame/", "common_click");

        App.EventUtils.dispatchEvent("MENU_CLOSE");
        this.node.destroy()
    }
}


