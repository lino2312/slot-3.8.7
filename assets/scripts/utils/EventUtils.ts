import { EventTarget } from "cc";

export type EventCallback = (...args: any[]) => void;

export class EventUtils {
    private static _instance: EventUtils;
    private eventTarget: EventTarget = new EventTarget();
    private targetMap: Map<any, Map<string, Set<EventCallback>>> = new Map();

    static getInstance() {
        if (!this._instance) this._instance = new EventUtils();
        return this._instance;
    }

    /**
     * 注册事件
     */
    on(event: string, callback: EventCallback, target?: any) {
        if (!callback) return;

        this.eventTarget.on(event, callback, target);

        if (target) {
            if (!this.targetMap.has(target)) {
                this.targetMap.set(target, new Map());
            }
            const eventMap = this.targetMap.get(target)!;

            if (!eventMap.has(event)) {
                eventMap.set(event, new Set());
            }
            eventMap.get(event)!.add(callback);
        }
    }

    /**
     * 移除事件
     */
    off(event: string, callback: EventCallback, target?: any) {
        this.eventTarget.off(event, callback, target);

        if (target && this.targetMap.has(target)) {
            const eventMap = this.targetMap.get(target)!;
            if (eventMap.has(event)) {
                eventMap.get(event)!.delete(callback);
                if (eventMap.get(event)!.size === 0) eventMap.delete(event);
            }
            if (eventMap.size === 0) this.targetMap.delete(target);
        }
    }

    /**
     * 广播事件
     */
    dispatchEvent(event: string, ...args: any[]) {
        this.eventTarget.emit(event, ...args);
    }

    /**
     * 移除指定 target 绑定的所有事件
     * （组件 onDestroy 时用）
     */
    offTarget(target: any) {
        const eventMap = this.targetMap.get(target);
        if (!eventMap) return;

        eventMap.forEach((cbSet, event) => {
            cbSet.forEach(cb => {
                this.eventTarget.off(event, cb, target);
            });
        });

        this.targetMap.delete(target);
    }

    /**
     * 清除所有监听器
     */
    clear() {
        this.eventTarget.removeAll(undefined as any);
        this.targetMap.clear();
    }

    /**
     * 查询某事件的监听器数量
     */
    listenerCount(event: string): number {
        // Cocos EventTarget 没有直接 API，只能手动记录的话再扩展
        let count = 0;
        this.targetMap.forEach(eventMap => {
            if (eventMap.has(event)) {
                count += eventMap.get(event)!.size;
            }
        });
        return count;
    }

    /**
     * 打印所有监听情况
     */
    printAllListeners() {
        console.log("EventUtils Listeners:");
        this.targetMap.forEach((eventMap, target) => {
            eventMap.forEach((set, event) => {
                console.log(`Event "${event}" (${set.size}) target=`, target);
            });
        });
    }
}
