import { SlotGameLoding } from "db://assets/scripts/game/slotgame/SlotGameLoding";
import Utils from "../../../scripts/game/tsFrameCommon/Base/MyUtils";
import JungleDelightData from "./JungleDelightData";
import { _decorator, Component } from 'cc';

const {ccclass, property} = _decorator;

@ccclass('JungleDelightLoading')
export default class JungleDelightLoading extends SlotGameLoding {

    start () {
        Utils.playMusic(JungleDelightData.BUNDLE_NAME, "bgm_fs_loading");
    }
    // update (dt) {}
}
