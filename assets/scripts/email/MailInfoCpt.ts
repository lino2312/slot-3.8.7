import { _decorator, Component, Button, Node } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('MailInfoCpt')
export default class MailInfoCpt extends Component {
//    // @property(cc.Node)
//    // infoNode: cc.Node = null;
//    // @property(cc.Node)
//    // infoNode2: cc.Node = null;
    @property(Button)
    getBtn: Button | null = null;
    @property(Node)
    okNode: Node | null = null;
    private data: any;
    protected onLoad(): void {
//        // let netListener = this.addComponent("NetListenerCmp");
//        // 领取邮件的附件成功
//        // netListener.registerMsg(MsgId.REQ_GET_MAIL_ATTACH, this.REQ_GET_MAIL_ATTACH, this);
        // this.getBtn.node.on("click", this.onClickCollectItem, this);

//        // this.infoNode.active = false;
//        // this.infoNode2.active = false;
    }
    updateView(data) {
//        // cc.vv.NetManager.send({ c: MsgId.MAIL_READ, mailid: data.mailid });

//        // this.infoNode.active = true;
//        // this.infoNode2.active = false;

        // this.data = data;
        // let infoNode = cc.find("content/infoNode",this.node)
        // cc.find('lbl_title', infoNode).getComponent(cc.Label).string = data.title;
        // cc.find('lbl_time', infoNode).getComponent(cc.Label).string = data.addTime;
        // cc.find('lbl_content', infoNode).getComponent(cc.Label).string = data.messages;
        // cc.find('sender/lbl_sender', infoNode).getComponent(cc.Label).string = Global.getHomeSettings.projectName || "";

//        //cc.find("attach2",infoNode).active = false
//       // let attachNode = cc.find("content/attach_node", this.node);
//        // 附件的奖励
        // if (data.rewards && data.rewards.length>0) {
//           // attachNode.active = true;
//           /*
        // cc.find("attach",attachNode).getComponent("RewardListCpt").updateView(data.rewards, [
        // { type: 1, scale: 0.6 },
        // { type: 25, scale: 0.6 },
        // { type: 53, scale: 0.5 },
        // { type: 40, scale: 0.5 },
        // { type: 50, scale: 0.6 },
        // { type: 54, scale: 0.9 },
        // ]);
        // for (let _node of cc.find("attach",attachNode).children) {
        // let gou = cc.find("gou", _node);
        // if (gou) {
        // gou.active = data.status <= 0;
        // }
        // }
//*/
        // this.getBtn.node.active = true;
        // this.getBtn.node.active = true;
        // Global.setLabelString("New Label", this.getBtn.node,"Receive");
        // } else {
//            //attachNode.active = false;
        // this.getBtn.node.active = false;
        // Global.setLabelString("New Label", this.getBtn.node,"Confirm");
        // }
//        // 邮件的状态
        // this.getBtn.node.active = data.status > 0;
        // this.okNode.active = false;
    }
    updateView2(data) {
//        // cc.vv.NetManager.send({ c: MsgId.MAIL_READ, mailid: data.mailid });

//        // this.infoNode.active = false;
//        // this.infoNode2.active = true;

        // let infoNode = cc.find("content/infoNode",this.node)
        // cc.find('lbl_title', infoNode).getComponent(cc.Label).string = data.title;
        // cc.find('lbl_time', infoNode).getComponent(cc.Label).string = data.addTime;
        // cc.find('lbl_content', infoNode).getComponent(cc.Label).string = data.messages;
        // cc.find('sender/lbl_sender', infoNode).getComponent(cc.Label).string = Global.getHomeSettings.projectName || "";

//       // let attachNode = cc.find("content/attach_node", this.node);
//       // attachNode.active = false
//        //let attach2 =  cc.find("attach2",infoNode)
//        // 附件的奖励
        // if (data.rewards && data.rewards.length>0) {
//           // attach2.active = true;
//           // let nodeMap = attach2.getComponent("RewardListCpt").updateView(data.rewards);
//           // if (nodeMap[51]) nodeMap[51].icon.scale = 2;
//            //if (nodeMap[52]) nodeMap[52].icon.scale = 3;

        // } else {
//           // attach2.active = false;
        // this.getBtn.node.active = false;
        // }
//        // 邮件的状态
        // this.getBtn.node.active = false;
        // this.okNode.active = false;
    }
//    // 邮件里领取按钮处理
    onClickCollectItem() {
//        // 请求领取邮件
//        // cc.vv.NetManager.send({ c: MsgId.REQ_GET_MAIL_ATTACH, mailid: this.data.mailid });
    }
//    // 请求领取邮件附件结果
    REQ_GET_MAIL_ATTACH(msg) {
        // if (msg.code == 200) {
        // Global.RewardFly(msg.rewards, this.getBtn.node.convertToWorldSpaceAR(cc.v2(0, 0)));
        // cc.vv.PopupManager.removePopup(this.node);
        // }
    }
}


/**
 * 注意：已把原脚本注释，由于脚本变动过大，转换的时候可能有遗落，需要自行手动转换
 */
// const { ccclass, property } = cc._decorator;
// 
// @ccclass
// export default class MailInfoCpt extends cc.Component {
// 
//     // @property(cc.Node)
//     // infoNode: cc.Node = null;
//     // @property(cc.Node)
//     // infoNode2: cc.Node = null;
//     @property(cc.Button)
//     getBtn: cc.Button = null;
//     @property(cc.Node)
//     okNode: cc.Node = null;
//     private data: any;
// 
//     protected onLoad(): void {
//         // let netListener = this.addComponent("NetListenerCmp");
//         // 领取邮件的附件成功
//         // netListener.registerMsg(MsgId.REQ_GET_MAIL_ATTACH, this.REQ_GET_MAIL_ATTACH, this);
//         this.getBtn.node.on("click", this.onClickCollectItem, this);
// 
//         // this.infoNode.active = false;
//         // this.infoNode2.active = false;
//     }
// 
//     updateView(data) {
//         // cc.vv.NetManager.send({ c: MsgId.MAIL_READ, mailid: data.mailid });
// 
//         // this.infoNode.active = true;
//         // this.infoNode2.active = false;
//         
//         this.data = data;
//         let infoNode = cc.find("content/infoNode",this.node)
//         cc.find('lbl_title', infoNode).getComponent(cc.Label).string = data.title;
//         cc.find('lbl_time', infoNode).getComponent(cc.Label).string = data.addTime;
//         cc.find('lbl_content', infoNode).getComponent(cc.Label).string = data.messages;
//         cc.find('sender/lbl_sender', infoNode).getComponent(cc.Label).string = Global.getHomeSettings.projectName || "";
//         
//         //cc.find("attach2",infoNode).active = false
//        // let attachNode = cc.find("content/attach_node", this.node);
//         // 附件的奖励
//         if (data.rewards && data.rewards.length>0) {
//            // attachNode.active = true;
//            /*
//             cc.find("attach",attachNode).getComponent("RewardListCpt").updateView(data.rewards, [
//                 { type: 1, scale: 0.6 },
//                 { type: 25, scale: 0.6 },
//                 { type: 53, scale: 0.5 },
//                 { type: 40, scale: 0.5 },
//                 { type: 50, scale: 0.6 },
//                 { type: 54, scale: 0.9 },
//             ]);
//             for (let _node of cc.find("attach",attachNode).children) {
//                 let gou = cc.find("gou", _node);
//                 if (gou) {
//                     gou.active = data.status <= 0;
//                 }
//             }
// */
//             this.getBtn.node.active = true;
//             this.getBtn.node.active = true;
//             Global.setLabelString("New Label", this.getBtn.node,"Receive");
//         } else {
//             //attachNode.active = false;
//             this.getBtn.node.active = false;
//             Global.setLabelString("New Label", this.getBtn.node,"Confirm");
//         }
//         // 邮件的状态
//         this.getBtn.node.active = data.status > 0;
//         this.okNode.active = false;
//     }
// 
//     updateView2(data) {
//         // cc.vv.NetManager.send({ c: MsgId.MAIL_READ, mailid: data.mailid });
// 
//         // this.infoNode.active = false;
//         // this.infoNode2.active = true;
// 
//         let infoNode = cc.find("content/infoNode",this.node)
//         cc.find('lbl_title', infoNode).getComponent(cc.Label).string = data.title;
//         cc.find('lbl_time', infoNode).getComponent(cc.Label).string = data.addTime;
//         cc.find('lbl_content', infoNode).getComponent(cc.Label).string = data.messages;
//         cc.find('sender/lbl_sender', infoNode).getComponent(cc.Label).string = Global.getHomeSettings.projectName || "";
//         
//        // let attachNode = cc.find("content/attach_node", this.node);
//        // attachNode.active = false
//         //let attach2 =  cc.find("attach2",infoNode)
//         // 附件的奖励
//         if (data.rewards && data.rewards.length>0) {
//            // attach2.active = true;
//            // let nodeMap = attach2.getComponent("RewardListCpt").updateView(data.rewards);
//            // if (nodeMap[51]) nodeMap[51].icon.scale = 2;
//             //if (nodeMap[52]) nodeMap[52].icon.scale = 3;
// 
//         } else {
//            // attach2.active = false;
//             this.getBtn.node.active = false;
//         }
//         // 邮件的状态
//         this.getBtn.node.active = false;
//         this.okNode.active = false;
//     }
// 
// 
//     // 邮件里领取按钮处理
//     onClickCollectItem() {
//         // 请求领取邮件
//         // cc.vv.NetManager.send({ c: MsgId.REQ_GET_MAIL_ATTACH, mailid: this.data.mailid });
//     }
// 
//     // 请求领取邮件附件结果
//     REQ_GET_MAIL_ATTACH(msg) {
//         if (msg.code == 200) {
//             Global.RewardFly(msg.rewards, this.getBtn.node.convertToWorldSpaceAR(cc.v2(0, 0)));
//             cc.vv.PopupManager.removePopup(this.node);
//         }
//     }
// 
// }
