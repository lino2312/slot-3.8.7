import Utils from "./MyUtils";
import { NodePool, Node, Prefab, instantiate } from 'cc';

export class PoolMng  {

    private static poolList: {[name:string]:{
        nodepool:NodePool,
        resBundle?:string,
        resPath?:string,
        node?:Node,
    }} = {};
    
    static newNodePool(name: string, resBundle: string, resPath: string, num: number = 0) {
        if (PoolMng.poolList[name]) {
            return;
        }
        PoolMng.poolList[name] = {
            nodepool: new NodePool(),
            resBundle: resBundle,
            resPath: resPath
        };
        if (num > 0) {
            Utils.loadRes(resBundle, resPath).then((prefab: Prefab) => {
                for (let i = 0; i < num; i++) {
                    let obj = instantiate(prefab);
                    PoolMng.putNodePool(name, obj);
                }
            })
        }
    }

    static newNodePoolByPrefab(name: string, prefab: Prefab, num: number = 0) {
        if (PoolMng.poolList[name]) {
            return;
        }
        PoolMng.poolList[name] = {
            nodepool: new NodePool(),
        };
        if (num > 0) {
            for (let i = 0; i < num; i++) {
                let obj = instantiate(prefab);
                PoolMng.putNodePool(name, obj);
            }
        }
    }

    static getNodePool(name: string, callback: Function) {
        let poolData = this.poolList[name];
        if (poolData) {
            if(poolData.nodepool.size()>0){
                let obj = poolData.nodepool.get()
                if (callback) {
                    callback(obj)
                }
            }
            else{
                if (poolData.node) {
                    let obj = instantiate(poolData.node);
                    obj.active = true;
                    if (callback) {
                        callback(obj);
                    }
                } else {
                    Utils.loadRes(poolData.resBundle, poolData.resPath).then((prefab: Prefab) => {
                        let obj = instantiate(prefab);
                        if (callback) {
                            callback(obj);
                        }
                    })
                }
            }
        } else {
            if (callback) {
                callback();
            }
        }
    }

    static putNodePool(name: string, item: Node) {
        if (!item) {
            return;
        }
        item.removeFromParent();
        let poolData = this.poolList[name];
        if (poolData) {
            poolData.nodepool.put(item);
        }
    }

    static destoryNodePool(name: string) {
        let poolData = this.poolList[name];
        if (!poolData) {
            return;
        }
        poolData.nodepool.clear();
        delete this.poolList[name];
    }

    static clearNodePoolList() {
        for (const key in this.poolList) {
            if (Object.prototype.hasOwnProperty.call(this.poolList, key)) {
                const element = this.poolList[key];
                if (element) {
                    element.nodepool.clear();
                }
            }
        }
        this.poolList = {};
    }

}
window["poolMng"] = PoolMng