
type EventItem = {
    callback: Function;
    target: any;
}

/**
 * 全局事件驱动
 */
export default class EventDispatcher {

    static _instance: EventDispatcher = null;

    private __events: Map<string, EventItem[]> = new Map<string, EventItem[]>();// 事件
    private __is_emit: boolean = false

    static getInstance() {
        if (!EventDispatcher._instance) {
            EventDispatcher._instance = new EventDispatcher();
        }
        return EventDispatcher._instance;
    }

    /**
     * 派发事件
     * @param  type
     * @param  data
     */
    public emit(type: number | string, ...params: any): void {
        const list = this.__events.get(String(type));
        if (!list || list.length === 0) {
            return
        }
        this.__is_emit = true
        for (let i = 0, l = list.length; i < l; i++) {
            const it = list[i];
            if (it) {
                it.callback.call(it.target, ...params);
            }
        }
        this.__is_emit = false
    }

    /**
     * 请求事件
     * @param type 
     * @param params 
     */
    public req(type: number | string, ...params: any) {
        const list = this.__events.get(String(type));
        if (!list || list.length === 0) {
            return
        }
        this.__is_emit = true
        if (list.length > 1) {
            // cc.log('req event length > 1, the default index is 0')
        }
        const it = list[0]
        return it.callback.call(it.target, ...params)
    }

    /**
     * 监听事件
     * @param  type
     * @param  callback
     * @param  target
     */
    public on(type: number | string, callback: Function, target?: any): void {
        type = String(type);
        let list = this.__events.get(type)
        if (!list) {
            list = []
            this.__events.set(type, list)
        }
        if (list.some(m => m && m.callback.toString() == callback.toString() && m.target == target)) {
            // cc.log("'repeat listen', type, (target ? target.name : 'null') + '.' + callback.name")
            return
        }
        list.push({ callback: callback, target: target });
    }

    /**
     * 监听一次
     * @param type 
     * @param callback 
     * @param target 
     */
    public once(type: number | string, callback: Function, target?: any): void {
        type = String(type);
        let fired = false, self = this;
        function g(...params: any) {
            self.off(type, g);
            if (!fired) {
                fired = true;
                callback.call(target, ...params);
            }
        }
        this.on(type, g);
    }

    /**
     * 异步等待
     * @param type
     */
    public async wait(type: number | string) {
        type = String(type);
        this.off(type);
        return new Promise<any>(resolve => {
            let fired = false, self = this;
            function g(params: any) {
                self.off(type, g);
                if (!fired) {
                    fired = true;
                    resolve(params);
                }
            }
            this.on(type, g);
        });
    }

    /**
     * 删除一个事件
     * @param  type
     * @param  callback
     * @param  target
     */
    public off(type: number | string, callback?: Function | any, target?: any): void {
        type = String(type);
        const list = this.__events.get(type);
        if (!list) {
            return;
        }
        if (target == null && callback) {
            if (typeof callback != 'function') {
                target = callback;
                callback = null;
            }
        }
        let del = true;
        for (let i = list.length - 1; i >= 0; i--) {
            const it = list[i];
            if (it && it.target == target && (!callback || it.callback.toString() == callback.toString())) {
                if (this.__is_emit) {
                    list[i] = null;
                } else {
                    del = false
                    list.splice(i, 1);
                    break;
                }
            }
            if (!!list[i]) {
                del = false;
            }
        }
        if (del || list.length === 0) {
            this.__events.delete(type);
        }
    }

    // 打印监听列表
    public print(): void {
        console.log('events:', this.__events);
    }

    //移除监听
    public remove(target:any){
        
        this.__events.forEach((value,key)=>{
            const list = value
            if(list.length<=0){
                return
            }
            for(let i=list.length-1;i>=0;i--){
                let it=list[i]
                if(it&&target==it.target){
                    list.splice(i, 1);
                }
            }
            if(list.length==0){
                this.__events.delete(key);
            }
        })
    }

}

if (window['glGame'] == null) {
    window['glGame'] = {};
}
window['glGame']['emitter'] = EventDispatcher.getInstance()