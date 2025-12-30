import { Component, _decorator } from 'cc';
import TableRecordItem from 'db://assets/scripts/popup/HistoricalRecord/TableRecordItem';
const { ccclass } = _decorator;

/**
 * 记录item
 * 继承自 TableRecordItem，保持与原有 Table_Record_Item 的兼容性
 */
@ccclass('Table_Record_Bet_Item')
export default class SlotGameRecordBetItem extends TableRecordItem {

    start() {
        // start logic if needed
    }

    /**
     * 初始化数据
     * 直接调用父类方法，因为逻辑完全相同
     */
    public init(data: any) {
        super.init(data);
        // gameresult
        // this.showGameResult(JSON.parse(data.result))
    }

    /**
     * 根据游戏显示自己的结果
     * 子类可以重写此方法来实现特定的游戏结果显示逻辑
     */
    public showGameResult(result: any) {
        // implement game result logic
        super.showGameResult(result);
    }
}

