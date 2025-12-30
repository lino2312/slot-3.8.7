/**
* @class ImgSwitchCmp
*/
/**
* 通过纹理名字显示图片
* @param {string} name
*/
/**
* 设置下表
* @param index
*/
import { _decorator, Sprite, Component, CCInteger } from 'cc';
const { ccclass, requireComponent, executeInEditMode, property } = _decorator;

@ccclass('ImgSwitchCmp')
@requireComponent(Sprite)
@executeInEditMode
export class ImgSwitchCmp extends Component {
    @property([cc.SpriteFrame])
    public frames = [];
    @property(CCInteger)
    public currIndex = 0;

    onload () {
        // this.showSprite(); 
    }

    showSprite () {
        // if(this.frames.length>0) {  
            // this.node.getComponent(cc.Sprite).spriteFrame = this.frames[this._currIndex]; 
        // } 
    }

    showSpriteByName (name: any) {
        // this.frames.forEach(frame => { 
            // if(frame.name == name){ 
                // this.node.getComponent(cc.Sprite).spriteFrame = frame; 
            // } 
        // }); 
    }

    setIndex (index: any) {
        // this._currIndex = index; 
        // this.showSprite(); 
    }

    getIndex () {
        // return this._currIndex; 
    }

}


/**
 * 注意：已把原脚本注释，由于脚本变动过大，转换的时候可能有遗落，需要自行手动转换
 */
// /**
//  * @class ImgSwitchCmp
//  */
// cc.Class({
//     extends:cc.Component,
// 
//     editor: {
//         requireComponent:cc.Sprite,
//         executeInEditMode: true,
//     },
// 
//     properties: {
//         frames: {
//             default:[],
//             type:[cc.SpriteFrame],
//             tooltip:"图片列表"
//         },
// 
//         currIndex: {
//             default:0,
//             type:cc.Integer,
//             tooltip: "默认显示图片在列表中的下标",
// 
//             notify(oldValue) {
//                 // if(oldValue == this._currIndex) {
//                 //     return;
//                 // }
//                 this._currIndex = this.currIndex;
//                 this.showSprite();
//             }
//         }
//     },
// 
//     onload() {
//         this.showSprite();
//     },
// 
//     showSprite() {
//         if(this.frames.length>0) { 
//             this.node.getComponent(cc.Sprite).spriteFrame = this.frames[this._currIndex];
//         }
//     },
// 
//     /**
//      * 通过纹理名字显示图片
//      * @param {string} name
//      */
//     showSpriteByName(name) {
//         this.frames.forEach(frame => {
//             if(frame.name == name){
//                 this.node.getComponent(cc.Sprite).spriteFrame = frame;
//             }
//         });
//     },
// 
//     /**
//      * 设置下表
//      * @param index
//      */
//     setIndex(index) {
//         this._currIndex = index;
//         this.showSprite();
//     },
// 
//     getIndex() {
//         return this._currIndex;
//     }
// })
