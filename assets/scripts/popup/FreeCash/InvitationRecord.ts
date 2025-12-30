import { _decorator, Component, Prefab, Node, instantiate } from 'cc';
import { App } from '../../App';
import { InvitationRecordItem } from './InvitationRecordItem';

const { ccclass, property } = _decorator;

@ccclass('InvitationRecord')
export class InvitationRecord extends Component {

    @property(Prefab)
    item: Prefab | null = null;

    @property(Node)
    content: Node | null = null;



    onLoad() {
       
        App.ApiManager.getCurrentActivityLevel1People().then((ret: any) => {
          console.log("获取到的数据:", ret);

                if (!ret?.data?.data) return;

                const list = ret.data.data;

                for (let i = 0; i < list.length; i++) {
                    const prefabNode = instantiate(this.item);

                    if (!prefabNode) continue;

                    const itemComp = prefabNode.getComponent(InvitationRecordItem);

                    if (itemComp) {
                        itemComp.data = list[i];   // 传入数据
                    }

                    this.content!.addChild(prefabNode);
                }
        }).catch((error: any) => {
            App.AlertManager.getCommonAlert().showWithoutCancel(error.message);
        });
            
    }
}
