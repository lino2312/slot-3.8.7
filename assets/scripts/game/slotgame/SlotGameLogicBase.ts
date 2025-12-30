import { _decorator, Component, find, Node } from 'cc';
import { BigWinComponent } from '../../component/BigWinComponent';
import { SlotGameAssetBase } from './SlotGameAssetBase';
import { App } from '../../App';
import { SlotGameTopBase } from './SlotGameTopBase';
import { SlotGameBottomBase } from './SlotGameBottomBase';
const { ccclass, property } = _decorator;

@ccclass('SlotGameLogicBase')
export class SlotGameLogicBase extends Component {

    protected onLoad(): void {
        this.initCommComponent();
    }

    start() {
        this.startSlot();
    }


    initCommComponent() {
        //BigWin
        this.node.addComponent(BigWinComponent);
        //资源加载脚本
        let assetScp = find("Canvas").getComponent(SlotGameAssetBase);
        App.SubGameManager.getSlotGameDataScript().setAssetScript(assetScp);

        let safeNode = find('safe_node', this.node);
        let cfg = App.SubGameManager.getSlotGameDataScript().getGameCfg();

        // //顶部
        let nodeTop = find('LMSlots_Top', safeNode);
        let scriptTop = nodeTop.addComponent(cfg.scripts.Top) as SlotGameTopBase;
        scriptTop.init();
        // //底部
        let nodeBottom = find('LMSlots_Bottom', safeNode);
        let scriptBottom = nodeBottom.addComponent(cfg.scripts.Bottom) as SlotGameBottomBase;
        scriptBottom.init();
        //存到gamedata里面
        App.SubGameManager.getSlotGameDataScript().setTopScript(scriptTop);
        App.SubGameManager.getSlotGameDataScript().setBottomScript(scriptBottom);

        //slots
        let nodeSlots = find('slots', safeNode);
        if (nodeSlots) {
            let scriptSlots = nodeSlots.addComponent(cfg.scripts.Slots);
            //存到gamedata里面
            App.SubGameManager.getSlotGameDataScript().setSlotsScript(scriptSlots);
        }


        // //slot外的系统功能组建
        // let othersys = this.node.addComponent('LMSots_OtherSys')
        // cc.vv.gameData.SetOtherSysScript(othersys)

        // // 拼图功能
        // if (cfg.puzzleCfg) {
        //     this.node.addComponent("LMSlots_Puzzle");
        // }
    }

    //开始游戏
    startSlot() {
        let scriptSlots = App.SubGameManager.getSlotGameDataScript().getSlotsScript();
        if (scriptSlots) {
            scriptSlots.init();
        }

    }
}


