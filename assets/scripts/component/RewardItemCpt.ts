import { _decorator, Component, find, Label, sp, Sprite, SpriteAtlas } from 'cc';
import { App } from '../App';
import { FormatUtils } from '../utils/FormatUtils';
const { ccclass, property, menu } = _decorator;

@ccclass('RewardItemCpt')
@menu("UI/奖励组件")
export default class RewardItemCpt extends Component {
        //    // 聊天纹理
        @property(SpriteAtlas)
        commonAtlas: SpriteAtlas | null = null;
        //    // 聊天纹理
        @property(SpriteAtlas)
        chatBoxAtlas: SpriteAtlas | null = null;
        //    // 牌背纹理
        @property(SpriteAtlas)
        pokerBackAtlas: SpriteAtlas | null = null;
        //    // 纹理
        @property(SpriteAtlas)
        skinShopAtlas: SpriteAtlas | null = null;
        //    // 纹理
        @property(SpriteAtlas)
        userCommonAtlas: SpriteAtlas | null = null;
        //    // LIFE-CYCLE CALLBACKS:
        //    // onLoad () {}
        updateView(config) {
                let item = config;
                // 数据处理
                let iconNode = find("icon", this.node);
                let avatarNode = find("avatar", this.node);
                let hddjNode = find("hddj", this.node);
                let valueNode = find("value", this.node);

                if (!iconNode) return;

                let iconSprite = iconNode.getComponent(Sprite);

                iconNode.active = false;
                if (hddjNode) hddjNode.active = false;
                if (avatarNode) avatarNode.active = false;

                valueNode.active = true;
                // 显示处理
                if (item.type == 43) {
                        avatarNode.active = true;
                        // 头像框
                        let ske = avatarNode.getComponent(sp.Skeleton);
                        if (ske && !!item.img) {
                                // ske.setAnimation(0, item.img, true);
                                // vv.UserConfig.setAvatarFrame(ske, item.img);
                                // ComponentUtils.setAvatarFrame(ske, item.img);
                        }
                } else if (item.type == 1) {
                        // 金币
                        iconNode.active = true;
                        let icon_sp = this.commonAtlas.getSpriteFrame("icon_coin_3");
                        if (!icon_sp) {
                                icon_sp = this.commonAtlas.getSpriteFrame("icon_coin")
                        }
                        iconSprite.spriteFrame = icon_sp;
                } else if (item.type == 2) {
                        // VIP经验值
                } else if (item.type == 25) {
                        // 钻石
                        iconNode.active = true;
                        iconSprite.spriteFrame = this.commonAtlas.getSpriteFrame("icon_diamond_3");
                } else if (item.type == 44) {
                        // 聊天框
                        iconNode.active = true;
                        iconSprite.spriteFrame = this.chatBoxAtlas.getSpriteFrame(item.img);
                } else if (item.type == 40) {
                        // 牌桌
                        iconNode.active = true;
                        iconSprite.spriteFrame = this.skinShopAtlas.getSpriteFrame(item.img);
                } else if (item.type == 39) {
                        // 牌背
                        if (this.pokerBackAtlas) {
                                iconNode.active = true;
                                iconSprite.spriteFrame = this.pokerBackAtlas.getSpriteFrame(item.img);
                        }
                } else if (item.type == 53) {
                        // 牌花
                        iconNode.active = true;
                        iconSprite.spriteFrame = this.skinShopAtlas.getSpriteFrame(item.img);
                } else if (item.type == 42) {
                        // RP
                        iconNode.active = true;
                        iconSprite.spriteFrame = this.commonAtlas.getSpriteFrame("icon_rp");
                } else if (item.type == 50) {
                        // 表情
                        iconNode.active = true;
                        iconSprite.spriteFrame = this.skinShopAtlas.getSpriteFrame(item.img);
                } else if (item.type == 54) {
                        // 魅力值礼物
                        if (hddjNode) {
                                hddjNode.active = true;
                                let ske = hddjNode.getComponent(sp.Skeleton);
                                if (ske) {
                                        ske.setAnimation(0, item.img, true);
                                }
                        } else {
                                iconNode.active = true;
                                iconSprite.spriteFrame = this.userCommonAtlas.getSpriteFrame(item.img);
                        }
                } else if (item.type == 51) {
                        // VIP 等级
                        iconNode.active = true;
                        App.ComponentUtils.setVipFrame(iconSprite, item.lv || item.count);
                        valueNode.active = false;
                } else if (item.type == 52) {
                        // 段位等级
                        iconNode.active = true;
                        App.ComponentUtils.setRankFrame(iconSprite, item.lv || item.count);

                        valueNode.active = false;
                } else if (item.type == 55) {
                        // 经验值道具
                        iconNode.active = true;
                        iconSprite.spriteFrame = this.userCommonAtlas.getSpriteFrame(item.img);
                } else if (item.type == 57) {
                        // 金银喇叭道具
                        iconNode.active = true;
                        iconSprite.spriteFrame = this.userCommonAtlas.getSpriteFrame(item.img);
                }
                // 文本显示处理
                let valueLabel = find("value", this.node).getComponent(Label);
                let count = item.count || item.num || item.prize;
                if (count > 0) {
                        valueLabel.string = FormatUtils.FormatNumToComma(count);
                        valueLabel.string = FormatUtils.formatNumber(count, { threshold: 10000 });
                }
                let min = item.min;
                let max = item.max;
                if (max > 0) {
                        if (min == max) {
                                valueLabel.string = FormatUtils.formatNumber(max, { threshold: 10000 });
                        } else {
                                valueLabel.string = FormatUtils.formatNumber(min, { threshold: 10000 }) + " - " + FormatUtils.formatNumber(max, { threshold: 10000 });
                        }
                }
                if (item.days && item.days > 0) {
                        // valueLabel.string = ___("{1}天", item.days);
                        valueLabel.string = item.days + "day";
                }
                if (item.day && item.day > 0) {
                        // valueLabel.string = ___("{1}天", item.day);
                        valueLabel.string = item.days + "day";
                }

                // icon图片 大小自适应 TODO

        }
}
