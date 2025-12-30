import {
    _decorator,
    Component,
    Node,
    Label,
    Button,
} from 'cc';
import { App } from '../App';
const { ccclass, property } = _decorator;

@ccclass('MailInfo')
export class MailInfo extends Component {

    private data: any = null;

    onLoad() {
        // 可以在这里测试：this.init({title: 'test', ...});

        this.init(App.userData().mailData);
    }

    /** ✅ 初始化数据 */
    public init(data: any): void {
        this.data = data;
        console.log('init() data:', this.data);
        this.updateInfo();
    }

    /** ✅ 更新邮件信息展示 */
    private updateInfo(): void {
        const data = this.data;
        if (!data) {
            console.warn('[MailInfo] data 为空，无法更新UI');
            return;
        }

        // 找到 infoNode 节点
        const infoNode = this.node.getChildByPath('content/infoNode');
        if (!infoNode) {
            console.warn('[MailInfo] 未找到 content/infoNode 节点');
            return;
        }

        // ✅ 设置标题、时间、内容、发件人
        const lblTitle = infoNode.getChildByPath('lbl_title') ?.getComponent(Label);
        const lblTime = infoNode.getChildByPath('lbl_time') ?.getComponent(Label);
        const lblContent = infoNode.getChildByPath('lbl_content') ?.getComponent(Label);
        const lblSender = infoNode.getChildByPath('sender/lbl_sender') ?.getComponent(Label);

        if (lblTitle) lblTitle.string = data.title || '';
        if (lblTime) lblTime.string = data.addTime || '';
        if (lblContent) lblContent.string = data.messages || '';
        if (lblSender) lblSender.string = App.TransactionData.homeSettings.projectName || '';

        // ✅ 处理奖励展示
        const bottomNode = this.node.getChildByPath('content/bottom_node');
        if (!bottomNode) return;

        if (data.type === 3 && data.mailReward) {
            bottomNode.active = true;

            const coinLabel = bottomNode.getChildByPath('000/coin') ?.getComponent(Label);
            if (coinLabel) coinLabel.string = data.mailReward.amount ?.toString() || '0';

            const tick = bottomNode.getChildByPath('000/tick');
            const btnCollect = bottomNode.getChildByPath('btn_collect');

            if (data.claimStatus) {
                if (tick) tick.active = true;
                if (btnCollect) btnCollect.active = false;
            } else {
                if (tick) tick.active = false;
                if (btnCollect) btnCollect.active = true;
            }
        } else {
            bottomNode.active = false;
        }
    }

    /** ✅ 领取按钮点击事件 */
    public async receive(): Promise<void> {
        if (!this.data) return;
        const messageId = this.data.messageID;
        
        try {
            await App.ApiManager.claimMailReward(messageId);
            App.AlertManager.showFloatTip('Claimed Successful');

            const bottomNode = this.node.getChildByPath('content/bottom_node');
            if (!bottomNode) return;

            const tick = bottomNode.getChildByPath('000/tick');
            const btnCollect = bottomNode.getChildByPath('btn_collect')?.getComponent(Button);

            if (tick) tick.active = true;
            if (btnCollect) btnCollect.interactable = false;

            // 更新本地数据状态
            this.data.claimStatus = 1;

            // 通知刷新邮件列表
            App.EventUtils.dispatchEvent('refreshMail', this.data);
        } catch (err) {
            console.warn('领取失败:', err);
            App.AlertManager.showFloatTip('Claim Failed');
        }
    }
}
