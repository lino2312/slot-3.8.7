/**
*
*/
import { _decorator, Component } from 'cc';
const { ccclass } = _decorator;

@ccclass('UIFixDesign')
export class UIFixDesign extends Component {

    onLoad () {
        // Global.FixDesignScale_V(this.node,true) 
    }

}


/**
 * 注意：已把原脚本注释，由于脚本变动过大，转换的时候可能有遗落，需要自行手动转换
 */
// /**
//  * 
//  */
// cc.Class({
//     extends: cc.Component,
// 
//     properties: {
//        
//     },
// 
//     // LIFE-CYCLE CALLBACKS:
// 
//     onLoad () {
//         Global.FixDesignScale_V(this.node,true)
//     },
// 
//     // start () {
// 
//     // },
// 
//     // update (dt) {},
// });
