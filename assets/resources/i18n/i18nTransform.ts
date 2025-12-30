// // 多语言 变换属性 组件 目前List不支持虚拟Item应用
// // 更具设置的语言 控制显示

import { _decorator, Component, Label, Layout, Widget, EditBox, ProgressBar, RichText, macro } from 'cc';
const { ccclass, property, menu } = _decorator;

import { i18nLangEnum } from "./i18nConst";
import { i18nManager } from "./i18nManager";

@ccclass('I18nTransform')
@menu("多语言/i18nTransform")
export default class i18nTransform extends Component {
    private label: Label;
    private layout: Layout;
    private widget: Widget;
    private editBox: EditBox;
    private list: any;
    private progress: ProgressBar;
    private richText: RichText;
    private tempPosX: number;
    private tempAnchorX: number;
    private tempScaleX: number;
    private labelHorizontalAlign: Label.HorizontalAlign;
    private layoutHorizontalDirection: Layout.HorizontalDirection;
    private listHorizontalDirection: Layout.HorizontalDirection;
    private editBox_horizontalAlign: Label.HorizontalAlign;
    private editBox_horizontalAlignPlaceholder: Label.HorizontalAlign;
    private widgetIsAlignLeft: boolean;
    private widgetIsAlignRight: boolean;
    private widgetLeft: number;
    private widgetRight: number;
    private tempProgressReverse: boolean;
    private tempRichHorizontalAlign: macro.TextAlignment;
    private tempAngle: number;
    @property
    scaleX: boolean = false; //({ visible() { return !this.auto } })
    @property
    angle: boolean = false; //({ visible() { return !this.auto } })
    @property
    auto: boolean = true;
    @property
    L2R: boolean = false;
    @property({ visible() { return !this.auto } })
    posX: boolean = false;
    @property({ visible() { return !this.auto } })
    anchorX: boolean = false;
    @property({ visible() { return !this.auto } })
    labelAlign: boolean = false;
    @property({ visible() { return !this.auto } })
    layoutDir: boolean = false;
    @property({ visible() { return !this.auto } })
    widgetAlgin: boolean = false;
    @property({ visible() { return !this.auto } })
    editBoxAlign: boolean = false;
    @property({ visible() { return !this.auto } })
    listDir: boolean = false;
    @property({ visible() { return !this.auto } })
    progressReverse: boolean = false;
    @property({ visible() { return !this.auto } })
    richTextlAlign: boolean = false;
    onLoad() {
        // i18nManager.register(this);
        // this.label = this.getComponent(cc.Label)
        // this.layout = this.getComponent(cc.Layout)
        // this.widget = this.getComponent(cc.Widget);
        // this.editBox = this.getComponent(cc.EditBox);
        // this.list = this.getComponent("List");
        // this.progress = this.getComponent(cc.ProgressBar);
        // this.richText = this.getComponent(cc.RichText);

//        // 记录当前组件的x位置
        // this.tempPosX = this.node.x;
//        // Anchor
        // this.tempAnchorX = this.node.anchorX;
//        // scaleX
        // this.tempScaleX = this.node.scaleX;
//        // rotation
        // this.tempAngle = this.node.angle;
//        // label的对齐方式
        // if ((this.labelAlign || this.auto) && this.label) {
        // this.labelHorizontalAlign = this.label.horizontalAlign;
        // }
//        // layout的排序方式
        // if ((this.layoutDir || this.auto) && this.layout) {
        // this.layoutHorizontalDirection = this.layout.horizontalDirection;
        // }
//        // widget的对齐方式保存
        // if ((this.widgetAlgin || this.auto) && this.widget) {
        // this.widgetIsAlignLeft = this.widget.isAlignLeft;
        // this.widgetIsAlignRight = this.widget.isAlignRight;
        // this.widgetLeft = this.widget.left;
        // this.widgetRight = this.widget.right;
        // }
//        // 输入框
        // if ((this.editBoxAlign || this.auto) && this.editBox) {
        // this.editBox_horizontalAlign = this.editBox.textLabel.horizontalAlign;
        // this.editBox_horizontalAlignPlaceholder = this.editBox.placeholderLabel.horizontalAlign;
        // }
//        // list的排序方式
        // if ((this.listDir || this.auto) && this.list) {
        // this.listHorizontalDirection = this.list._layout.horizontalDirection;
        // }
//        // 进度条
        // if ((this.progressReverse || this.auto) && this.progress) {
        // this.tempProgressReverse = this.progress.reverse;
        // }
//        // 富文本
        // if ((this.richTextlAlign || this.auto) && this.richText) {
        // this.tempRichHorizontalAlign = this.richText.horizontalAlign;
        // }


//        // 刷新
        // this.updateView();
    }
    onDestroy() {
        // i18nManager.unregister(this);
    }
    updateView() {
//        // 更新
        // let lang = i18nManager.getLanguage();
//        // 默认布局是阿拉伯
        // let bool = lang == i18nLangEnum.AR;
        // if (this.L2R) {
//            // 默认布局是英语
        // bool = lang == i18nLangEnum.EN;
        // }
        // if (bool) {
        // if (this.scaleX) this.node.scaleX = this.tempScaleX;
        // if (this.angle) this.node.angle = this.tempAngle
        // if (this.posX || this.auto) this.node.x = this.tempPosX;
        // if (this.anchorX || this.auto) this.node.anchorX = this.tempAnchorX;
        // if ((this.labelAlign || this.auto) && this.label) this.label.horizontalAlign = this.labelHorizontalAlign;
        // if ((this.layoutDir || this.auto) && this.layout) this.layout.horizontalDirection = this.layoutHorizontalDirection;
        // if ((this.widgetAlgin || this.auto) && this.widget) {
        // this.widget.isAlignLeft = this.widgetIsAlignLeft;
        // this.widget.isAlignRight = this.widgetIsAlignRight;
        // this.widget.left = this.widgetLeft;
        // this.widget.right = this.widgetRight;
        // }
        // if ((this.editBoxAlign || this.auto) && this.editBox) {
        // this.editBox.textLabel.horizontalAlign = this.editBox_horizontalAlign;
        // this.editBox.placeholderLabel.horizontalAlign = this.editBox_horizontalAlignPlaceholder;
        // }
        // if ((this.listDir || this.auto) && this.list) {
        // this.list._layout.horizontalDirection = this.listHorizontalDirection;
//                // this.list.updateAll();
        // }
        // if ((this.progressReverse || this.auto) && this.progress) {
        // this.progress.reverse = this.tempProgressReverse;
        // }
        // if ((this.richTextlAlign || this.auto) && this.richText) {
        // this.richText.horizontalAlign = this.tempRichHorizontalAlign;
        // }
        // } else {
        // if (this.scaleX) this.node.scaleX = -this.tempScaleX;
        // if (this.angle) this.node.angle = -this.tempAngle
        // if (this.posX || this.auto) this.node.x = -this.tempPosX;
        // if (this.anchorX || this.auto) this.node.anchorX = 1 - this.tempAnchorX;
        // if ((this.labelAlign || this.auto) && this.label) this.label.horizontalAlign = this.getFlipLabelAlign(this.labelHorizontalAlign);
        // if ((this.layoutDir || this.auto) && this.layout) this.layout.horizontalDirection = this.getFlipLayoutDir(this.layoutHorizontalDirection);
        // if ((this.widgetAlgin || this.auto) && this.widget) {
        // this.widget.isAlignLeft = this.widgetIsAlignRight;
        // this.widget.isAlignRight = this.widgetIsAlignLeft;
        // this.widget.left = this.widgetRight;
        // this.widget.right = this.widgetLeft;
        // }
        // if ((this.editBoxAlign || this.auto) && this.editBox) {
        // this.editBox.textLabel.horizontalAlign = this.getFlipLabelAlign(this.editBox_horizontalAlign);
        // this.editBox.placeholderLabel.horizontalAlign = this.getFlipLabelAlign(this.editBox_horizontalAlignPlaceholder);
        // }
        // if ((this.listDir || this.auto) && this.list) {
        // this.list._layout.horizontalDirection = this.getFlipLayoutDir(this.listHorizontalDirection);
//                // this.list.updateAll();
        // }
        // if ((this.progressReverse || this.auto) && this.progress) {
        // this.progress.reverse = !this.tempProgressReverse;
        // }
        // if ((this.richTextlAlign || this.auto) && this.richText) {
        // this.richText.horizontalAlign = this.getFlipRichTextAlign(this.richText.horizontalAlign);
        // }
        // }

    }
//    // 获取文本对齐方式的翻转值
    getFlipLabelAlign(align: Label.HorizontalAlign) {
        // if (align == cc.Label.HorizontalAlign.LEFT) {
        // return cc.Label.HorizontalAlign.RIGHT;
        // } else if (align == cc.Label.HorizontalAlign.RIGHT) {
        // return cc.Label.HorizontalAlign.LEFT;
        // } else {
        // return align;
        // }
    }
    getFlipRichTextAlign(align: macro.TextAlignment) {
        // if (align == cc.macro.TextAlignment.LEFT) {
        // return cc.macro.TextAlignment.RIGHT;
        // } else if (align == cc.macro.TextAlignment.RIGHT) {
        // return cc.macro.TextAlignment.LEFT;
        // } else {
        // return align;
        // }
    }
//    // 获取layout方向的翻转值
    getFlipLayoutDir(dir: Layout.HorizontalDirection) {
        // if (dir == cc.Layout.HorizontalDirection.LEFT_TO_RIGHT) {
        // return cc.Layout.HorizontalDirection.RIGHT_TO_LEFT;
        // } else {
        // return cc.Layout.HorizontalDirection.LEFT_TO_RIGHT;
        // }
    }
}


/**
 * 注意：已把原脚本注释，由于脚本变动过大，转换的时候可能有遗落，需要自行手动转换
 */
// // 多语言 变换属性 组件 目前List不支持虚拟Item应用
// 
// import { i18nLangEnum } from "./i18nConst";
// import { i18nManager } from "./i18nManager";
// 
// // 更具设置的语言 控制显示
// const { ccclass, property, menu } = cc._decorator;
// @ccclass
// @menu("多语言/i18nTransform")
// export default class i18nTransform extends cc.Component {
// 
//     private label: cc.Label;
//     private layout: cc.Layout;
//     private widget: cc.Widget;
//     private editBox: cc.EditBox;
//     private list: any;
//     private progress: cc.ProgressBar;
//     private richText: cc.RichText;
// 
//     private tempPosX: number;
//     private tempAnchorX: number;
//     private tempScaleX: number;
//     private labelHorizontalAlign: cc.Label.HorizontalAlign;
//     private layoutHorizontalDirection: cc.Layout.HorizontalDirection;
//     private listHorizontalDirection: cc.Layout.HorizontalDirection;
// 
//     private editBox_horizontalAlign: cc.Label.HorizontalAlign;
//     private editBox_horizontalAlignPlaceholder: cc.Label.HorizontalAlign;
// 
//     private widgetIsAlignLeft: boolean;
//     private widgetIsAlignRight: boolean;
//     private widgetLeft: number;
//     private widgetRight: number;
// 
//     private tempProgressReverse: boolean;
//     private tempRichHorizontalAlign: cc.macro.TextAlignment;
//     private tempAngle: number;
// 
//     @property
//     scaleX: boolean = false; //({ visible() { return !this.auto } })
//     @property
//     angle: boolean = false; //({ visible() { return !this.auto } })
// 
//     @property
//     auto: boolean = true;
// 
//     @property
//     L2R: boolean = false;
// 
//     @property({ visible() { return !this.auto } })
//     posX: boolean = false;
//     @property({ visible() { return !this.auto } })
//     anchorX: boolean = false;
//     @property({ visible() { return !this.auto } })
//     labelAlign: boolean = false;
//     @property({ visible() { return !this.auto } })
//     layoutDir: boolean = false;
//     @property({ visible() { return !this.auto } })
//     widgetAlgin: boolean = false;
//     @property({ visible() { return !this.auto } })
//     editBoxAlign: boolean = false;
//     @property({ visible() { return !this.auto } })
//     listDir: boolean = false;
//     @property({ visible() { return !this.auto } })
//     progressReverse: boolean = false;
//     @property({ visible() { return !this.auto } })
//     richTextlAlign: boolean = false;
// 
// 
// 
//     onLoad() {
//         i18nManager.register(this);
//         this.label = this.getComponent(cc.Label)
//         this.layout = this.getComponent(cc.Layout)
//         this.widget = this.getComponent(cc.Widget);
//         this.editBox = this.getComponent(cc.EditBox);
//         this.list = this.getComponent("List");
//         this.progress = this.getComponent(cc.ProgressBar);
//         this.richText = this.getComponent(cc.RichText);
// 
//         // 记录当前组件的x位置
//         this.tempPosX = this.node.x;
//         // Anchor
//         this.tempAnchorX = this.node.anchorX;
//         // scaleX
//         this.tempScaleX = this.node.scaleX;
//         // rotation
//         this.tempAngle = this.node.angle;
//         // label的对齐方式
//         if ((this.labelAlign || this.auto) && this.label) {
//             this.labelHorizontalAlign = this.label.horizontalAlign;
//         }
//         // layout的排序方式
//         if ((this.layoutDir || this.auto) && this.layout) {
//             this.layoutHorizontalDirection = this.layout.horizontalDirection;
//         }
//         // widget的对齐方式保存
//         if ((this.widgetAlgin || this.auto) && this.widget) {
//             this.widgetIsAlignLeft = this.widget.isAlignLeft;
//             this.widgetIsAlignRight = this.widget.isAlignRight;
//             this.widgetLeft = this.widget.left;
//             this.widgetRight = this.widget.right;
//         }
//         // 输入框
//         if ((this.editBoxAlign || this.auto) && this.editBox) {
//             this.editBox_horizontalAlign = this.editBox.textLabel.horizontalAlign;
//             this.editBox_horizontalAlignPlaceholder = this.editBox.placeholderLabel.horizontalAlign;
//         }
//         // list的排序方式
//         if ((this.listDir || this.auto) && this.list) {
//             this.listHorizontalDirection = this.list._layout.horizontalDirection;
//         }
//         // 进度条
//         if ((this.progressReverse || this.auto) && this.progress) {
//             this.tempProgressReverse = this.progress.reverse;
//         }
//         // 富文本
//         if ((this.richTextlAlign || this.auto) && this.richText) {
//             this.tempRichHorizontalAlign = this.richText.horizontalAlign;
//         }
// 
// 
//         // 刷新
//         this.updateView();
//     }
// 
//     onDestroy() {
//         i18nManager.unregister(this);
//     }
// 
//     updateView() {
//         // 更新
//         let lang = i18nManager.getLanguage();
//         // 默认布局是阿拉伯
//         let bool = lang == i18nLangEnum.AR;
//         if (this.L2R) {
//             // 默认布局是英语
//             bool = lang == i18nLangEnum.EN;
//         }
//         if (bool) {
//             if (this.scaleX) this.node.scaleX = this.tempScaleX;
//             if (this.angle) this.node.angle = this.tempAngle
//             if (this.posX || this.auto) this.node.x = this.tempPosX;
//             if (this.anchorX || this.auto) this.node.anchorX = this.tempAnchorX;
//             if ((this.labelAlign || this.auto) && this.label) this.label.horizontalAlign = this.labelHorizontalAlign;
//             if ((this.layoutDir || this.auto) && this.layout) this.layout.horizontalDirection = this.layoutHorizontalDirection;
//             if ((this.widgetAlgin || this.auto) && this.widget) {
//                 this.widget.isAlignLeft = this.widgetIsAlignLeft;
//                 this.widget.isAlignRight = this.widgetIsAlignRight;
//                 this.widget.left = this.widgetLeft;
//                 this.widget.right = this.widgetRight;
//             }
//             if ((this.editBoxAlign || this.auto) && this.editBox) {
//                 this.editBox.textLabel.horizontalAlign = this.editBox_horizontalAlign;
//                 this.editBox.placeholderLabel.horizontalAlign = this.editBox_horizontalAlignPlaceholder;
//             }
//             if ((this.listDir || this.auto) && this.list) {
//                 this.list._layout.horizontalDirection = this.listHorizontalDirection;
//                 // this.list.updateAll();
//             }
//             if ((this.progressReverse || this.auto) && this.progress) {
//                 this.progress.reverse = this.tempProgressReverse;
//             }
//             if ((this.richTextlAlign || this.auto) && this.richText) {
//                 this.richText.horizontalAlign = this.tempRichHorizontalAlign;
//             }
//         } else {
//             if (this.scaleX) this.node.scaleX = -this.tempScaleX;
//             if (this.angle) this.node.angle = -this.tempAngle
//             if (this.posX || this.auto) this.node.x = -this.tempPosX;
//             if (this.anchorX || this.auto) this.node.anchorX = 1 - this.tempAnchorX;
//             if ((this.labelAlign || this.auto) && this.label) this.label.horizontalAlign = this.getFlipLabelAlign(this.labelHorizontalAlign);
//             if ((this.layoutDir || this.auto) && this.layout) this.layout.horizontalDirection = this.getFlipLayoutDir(this.layoutHorizontalDirection);
//             if ((this.widgetAlgin || this.auto) && this.widget) {
//                 this.widget.isAlignLeft = this.widgetIsAlignRight;
//                 this.widget.isAlignRight = this.widgetIsAlignLeft;
//                 this.widget.left = this.widgetRight;
//                 this.widget.right = this.widgetLeft;
//             }
//             if ((this.editBoxAlign || this.auto) && this.editBox) {
//                 this.editBox.textLabel.horizontalAlign = this.getFlipLabelAlign(this.editBox_horizontalAlign);
//                 this.editBox.placeholderLabel.horizontalAlign = this.getFlipLabelAlign(this.editBox_horizontalAlignPlaceholder);
//             }
//             if ((this.listDir || this.auto) && this.list) {
//                 this.list._layout.horizontalDirection = this.getFlipLayoutDir(this.listHorizontalDirection);
//                 // this.list.updateAll();
//             }
//             if ((this.progressReverse || this.auto) && this.progress) {
//                 this.progress.reverse = !this.tempProgressReverse;
//             }
//             if ((this.richTextlAlign || this.auto) && this.richText) {
//                 this.richText.horizontalAlign = this.getFlipRichTextAlign(this.richText.horizontalAlign);
//             }
//         }
// 
//     }
// 
//     // 获取文本对齐方式的翻转值
//     getFlipLabelAlign(align: cc.Label.HorizontalAlign) {
//         if (align == cc.Label.HorizontalAlign.LEFT) {
//             return cc.Label.HorizontalAlign.RIGHT;
//         } else if (align == cc.Label.HorizontalAlign.RIGHT) {
//             return cc.Label.HorizontalAlign.LEFT;
//         } else {
//             return align;
//         }
//     }
//     getFlipRichTextAlign(align: cc.macro.TextAlignment) {
//         if (align == cc.macro.TextAlignment.LEFT) {
//             return cc.macro.TextAlignment.RIGHT;
//         } else if (align == cc.macro.TextAlignment.RIGHT) {
//             return cc.macro.TextAlignment.LEFT;
//         } else {
//             return align;
//         }
//     }
//     // 获取layout方向的翻转值
//     getFlipLayoutDir(dir: cc.Layout.HorizontalDirection) {
//         if (dir == cc.Layout.HorizontalDirection.LEFT_TO_RIGHT) {
//             return cc.Layout.HorizontalDirection.RIGHT_TO_LEFT;
//         } else {
//             return cc.Layout.HorizontalDirection.LEFT_TO_RIGHT;
//         }
//     }
// }
