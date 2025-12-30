import { _decorator, sp } from 'cc';
import { SlotGameBaseData } from 'db://assets/scripts/game/slotgame/SlotGameBaseData';
const { ccclass } = _decorator;

@ccclass('ThePandaGameData')
export class ThePandaGameData extends SlotGameBaseData {
    private needBonusNum = 6;
    private isCollectGame = false;
    private bonusData: any = null;
    private selectData: any = null
    private poolList: any = null;
    private freeGame: any = null;

    init(msgDic: any) {
        console.log("ThePandaGameData init msgDic:", msgDic);
        let deskInfo = msgDic.deskinfo;
        let gameId = msgDic.gameid;
        let gameJackpot = msgDic.gameJackpot;
        super.init(deskInfo, gameId, gameJackpot);
        this.bonusData = deskInfo.bonusData;
        this.selectData = deskInfo.select;
        this.poolList = this.bonusData.poolList;
    }

    onRcvNetSpine(msg: any) {
        if (msg.code == 200) {
            this.bonusData = msg.bonusData;
            this.selectData = msg.select;
            if (this.bonusData) {
                this.poolList = this.bonusData.poolList;
            }
            super.onRcvNetSpine(msg);
        }
    }

    getPoolbyType(type: any) {
        if (this.poolList)
            return this.poolList[type - 1];
        return 0;
    }

    getBounusData() {
        return this.bonusData;
    }

    clearBonusState() {
        this.bonusData.state = false;
    }

    getSelectData() {
        return this.selectData;
    }

    clearSelectState() {
        this.selectData.state = false;
    }

    setFreeGameScript(fgame: any) {
        this.freeGame = fgame;
    }

    getFreeGameScript() {
        return this.freeGame;
    }

    setCollectGame(isCollectGame: any) {
        this.isCollectGame = isCollectGame;
    }

    getCollectGame() : boolean {
        return this.isCollectGame
    }

    isFreeGame() {
        return this.bonusData.state;
    }

    getNeedBonusIconNum() {
        return this.needBonusNum;
    }

    setBonusIconNum(num: any) {
        this.needBonusNum = num;
    }

    clearBonusDataPool(index: any) {
        let bonusdata = this.bonusData.data;
        for (let key in bonusdata) {
            if (bonusdata[key].idx == index) {
                bonusdata[key].pool = 0;
                break;
            }
        }
    }

    playSpine(node: any, aniName: any, loop: any, endCall: any) {
        if (node) {
            node.active = true
            let ske = node.getComponent(sp.Skeleton)
            if (ske) {
                ske.setAnimation(0, aniName, loop)
                ske.setCompleteListener(() => {
                    if (endCall) {
                        endCall()
                    }
                })
            }
        }
    }

}
