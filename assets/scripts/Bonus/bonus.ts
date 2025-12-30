import { _decorator, Component, Prefab, Node, instantiate, ScrollView, Toggle } from 'cc';
import { yd_bonus_model } from './bonusModel';
import { App } from '../App';
import { Config } from '../config/Config';

import { yd_bonus_prom } from './bonusProm';
import { yd_bonus_login } from './bonusLogin';
import { yd_bonus_cash_back } from './bonusCashBack';
import { yd_bonus_bet_back_2 } from './bonusBetBack2';
import { yd_bonus_task } from './bonusTask';

const { ccclass, property } = _decorator;

@ccclass('yd_bonus')
export class yd_bonus extends Component {
    @property(Prefab) yd_bonus_prom: Prefab = null!;
    @property(Prefab) yd_bonus_login: Prefab = null!;
    @property(Prefab) yd_bonus_bet_back_2: Prefab = null!;
    @property(Prefab) yd_bonus_cash_back: Prefab = null!;
    @property(Prefab) yd_bonus_task: Prefab = null!;
    @property(Node) content: Node = null!;
    @property(ScrollView) scrollView: ScrollView = null!;

    private nodeCache: Record<string, Node> = {};

    onLoad() {
        this.nodeCache = {};        
        this.onClickTab(null, '0'); // 默认显示第一个
        // @ts-ignore
        App.EventUtils.on('Select_Tab_Index', this.showCashback, this);
    }

    onDestroy() {
        // @ts-ignore
        App.EventUtils.off('Select_Tab_Index', this.showCashback, this);
        this.nodeCache = {};
    }

    private showCashback() {
        this.scheduleOnce(() => {
            this.onClickTab(null, '2');
            const top = this.node.getChildByName('top');
            if (top) {
                const toggle3 = top.getChildByName('toggle3');
                if (toggle3) {
                    const toggle = toggle3.getComponent(Toggle);
                    if (toggle) toggle.isChecked = true;
                }
            }
        }, 0.2);
    }


    private getPrefabInfo(index: string): { prefab: Prefab; comp?: any } | null {
        switch (index) {
            case '0':
                return { prefab: this.yd_bonus_prom, comp: yd_bonus_prom };
            case '1':
                return { prefab: this.yd_bonus_login, comp: yd_bonus_login };
            case '2':
                // if (Config.gameChannel === 'D107' || Config.gameChannel === 'D105') {
                //     return { prefab: this.yd_bonus_cash_back, comp: yd_bonus_cash_back };
                // }
                return { prefab: this.yd_bonus_bet_back_2, comp: yd_bonus_bet_back_2 };
            case '3':
                return { prefab: this.yd_bonus_task, comp: yd_bonus_task };
            default:
                return null;
        }
    }

    onClickTab(e: Event | null, index: string) {
        if(e){
            const toggle = e.target.getComponent(cc.Toggle);
            if (!toggle || !toggle.isChecked) return;
        }
        App.AudioManager.playBtnClick();
        this.content.removeAllChildren();

        const info = this.getPrefabInfo(index);
        if (!info) return;

        // 使用缓存避免重复 instantiate
        let node = this.nodeCache[index];
        if (!node) {
            node = instantiate(info.prefab);
            this.nodeCache[index] = node;
        }

        // 确保组件存在
        const item = node.getComponent(info.comp);
        if (!item) {
            console.error(`❌ 预制体未绑定组件: index=${index}`);
            return;
        }

        // 添加到内容区域
        this.content.addChild(node);
        this.scrollView.scrollToTop(0);

        // 特殊业务逻辑
        if (index === '2' && ['D105', 'D107'].includes(Config.gameChannel)) {
            // @ts-ignore
            // App.EventUtils.emit('API');
        }
    }
}
