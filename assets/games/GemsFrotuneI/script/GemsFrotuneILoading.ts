import Utils from "../../../scripts/game/tsFrameCommon/Base/MyUtils";
import GemsFrotuneIData from "./GemsFrotuneIData";
import { _decorator, Component } from 'cc';

import { SlotGameLoding } from 'db://assets/scripts/game/slotgame/SlotGameLoding';
const { ccclass, property } = _decorator;

@ccclass('GemsFrotuneILoading')
export default class GemsFrotuneILoading extends SlotGameLoding {

    start() {
        Utils.playMusic(GemsFrotuneIData.BUNDLE_NAME, "bgm_fs_loading");
    }
}