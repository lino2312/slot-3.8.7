import { _decorator } from 'cc';
import { SlotGameLogicBase } from 'db://assets/scripts/game/slotgame/SlotGameLogicBase';
import { ThePandaGameData } from './ThePandaGameData';
import { App } from 'db://assets/scripts/App';
import { ThePandaFreeGame } from './ThePandaFreeGame';
import { ThePandaCfg } from './ThePandaCfg';
const { ccclass } = _decorator;

@ccclass('ThePandaLogic')
export class ThePandaLogic extends SlotGameLogicBase {

    onLoad() {
        console.log("[ThePandaLogic] onLoad");
        let gameDataScript = this.node.addComponent(ThePandaGameData);
        //gameDataScript一定要最先set，否则后续取不到数据
        App.SubGameManager.setSlotGameDataScript(gameDataScript);
        gameDataScript.init(App.SubGameManager.getMsgDic());
        let scriptFreegame = this.node.addComponent(ThePandaFreeGame);
        gameDataScript.setGameCfg(ThePandaCfg);
        gameDataScript.setFreeGameScript(scriptFreegame);
        super.onLoad();
    }
}
