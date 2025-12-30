import { _decorator, Component, Node, sys } from 'cc';
import { App } from '../App';
const { ccclass, property } = _decorator;

@ccclass('RedHitManager')
export class RedHitManager extends Component {


    // 红点提示管理器
    // 存储了所有红点提示的数据,同时监听服务器的更新推送,如果服务器更新提示,则下发给所有红点组件进行更新
    data: Record<string, any> = {};
    redHidList: any[] = [];
    filterKey: any[] = [];
    clickRecordList: any[] = [];

    protected onLoad(): void {
        App.RedHitManager = this;
    }

    start() {
        this.init();
    }

    update(deltaTime: number) {

    }

    init() {
        this.data = {};
        this.redHidList = [];
        this.clickRecordList = [];
        // 红点更新推送
        App.NetManager.on(App.MessageID.PULL_RED_NOTICE, (msg) => {
            if (msg.code != 200) return;
            // for (const key of keyArr) {
            //     if (msg[key] != undefined) this.data[key] = msg[key];
            // }
            this.data = msg;
            const value = App.StorageUtils.getLocal("mail_notify_yacai");
            this.data.mail_notify_yacai = Number(value);
            this.updateLocalStorage();
            this.updateView();
        });
        // App.NetManager.registerMsg(App.MessageID.PULL_RED_NOTICE, this.PULL_RED_NOTICE, this);
    }

    protected onDestroy() {
        App.NetManager.off(App.MessageID.PULL_RED_NOTICE);
    }

    // 注册红点组件
    register(redHitComponent: any) {
        if (this.redHidList.indexOf(redHitComponent) < 0) {
            this.redHidList.push(redHitComponent);
            redHitComponent.updateView();
        }
    }

    // 注销红点组件
    unregister(redHitComponent: any) {
        let index = this.redHidList.indexOf(redHitComponent);
        if (index >= 0) {
            this.redHidList.splice(index, 1);
        }
    }

    updateView() {
        // 更新已经注册组件
        for (const redHitComponent of this.redHidList) {
            redHitComponent.updateView(this.data);
        }
    }

    // 设置红点统计过滤条件
    setFilterKeys(filterKey: any[]) {
        this.filterKey = filterKey;
        this.updateView();
    }

    // 本地设置红点数据
    setKeyVal(key: string, val: any) {
        this.data[key] = val;
        this.updateLocalStorage();
        this.updateView();
    }

    updateLocalStorage() {
        const jsonData = JSON.stringify(this.data);
        App.StorageUtils.saveLocal('redHitData', jsonData);
    }

    log() {
        console.log('data =>', this.data);
        console.log('redHidList =>', this.redHidList);
        console.log('clickRecordList =>', this.clickRecordList);
    }
}


