import { _decorator, Component, find, Node, ProgressBar, tween, Tween, UIOpacity } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('SlotGameBottomBetTips')
export class SlotGameBottomBetTips extends Component {
    setBetPercent(nPer: number) {
        // 取消上一轮对本节点/透明度/进度条/指针的所有补间（包括之前安排的 hideTips 延时）
        Tween.stopAllByTarget(this.node);
        const uiOpacity = this.node.getComponent(UIOpacity) ?? this.node.addComponent(UIOpacity);
        Tween.stopAllByTarget(uiOpacity);

        // 可见并重置透明度
        this.node.active = true;
        uiOpacity.opacity = 255;

        // 进度条动画
        const betPro = find('pro_bet', this.node);
        const proCmp = betPro?.getComponent(ProgressBar);
        if (proCmp) {
            Tween.stopAllByTarget(proCmp);
            tween(proCmp).to(0.2, { progress: nPer }).start();
        }

        // 指针动画
        const nodePoint = betPro ? find('spr_point', betPro) : null;
        if (nodePoint) {
            Tween.stopAllByTarget(nodePoint);
            const toAngle = 55 + (-11) * (nPer / 0.1);
            tween(nodePoint).to(0.2, { angle: toAngle }).start();
        }

        // 重新安排隐藏
        tween(this.node)
            .delay(2.5)
            .call(() => this.hideTips())
            .start();
    }

    hideTips() {
        const uiOpacity = this.node.getComponent(UIOpacity) ?? this.node.addComponent(UIOpacity);
        // 确保不叠加旧的渐隐
        Tween.stopAllByTarget(uiOpacity);
        tween(uiOpacity)
            .to(0.3, { opacity: 0 })
            .call(() => {
                this.node.active = false;
            })
            .start();
    }
}