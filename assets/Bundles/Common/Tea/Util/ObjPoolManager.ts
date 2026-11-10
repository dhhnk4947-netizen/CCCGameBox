import { NodePool, Prefab, instantiate, Node } from "cc";
import TAssetManager from "./TAssetManager";
import { Singleton } from "./SingletonFactory";
import { DefaultValue, Value } from "../decorators/tea.decorators";

@Singleton()
export default class ObjPoolManager {
    @Value(new Map())
    private _pools: Map<string, NodePool>;
    @Value(new Map())
    private _poolMaxSize: Map<string, number>;
    @Value(new Map())
    private _prefabMap: Map<string, Prefab | Node>;

    @DefaultValue(10)
    private defaultMaxSize;

    initPool(objs: Tea.ObjPoolParams[], onComplete: (error: Error) => void);
    initPool(objs: Tea.ObjPoolParams[]);
    initPool(objs: Tea.ObjPoolParams[], onProgress: ((finish: number, total: number, item: NodePool) => void), onComplete: (error: Error) => void);
    initPool(
        objs: Tea.ObjPoolParams[],
        onProgress?: ((finish: number, total: number, item: NodePool) => void) | ((error: Error) => void),
        onComplete?: (error: Error) => void
    ) {
        this.clear();
        let total = objs.length;
        let finish = 0;
        let progressCb, completeCb;
        if (onProgress && onProgress.length === 3) {
            progressCb = onProgress;
        }
        if (onProgress && onProgress.length === 1) {
            completeCb = onProgress;
        }
        if (onComplete) {
            completeCb = onComplete;
        }

        progressCb && progressCb(0, total, null);
        objs.forEach(obj => {
            let name = obj.name;
            let path = obj.path || obj.name;
            let abPackage = obj.abPackage || "";
            let size = obj.size || 0;
            let maxSize = obj.maxSize || this.defaultMaxSize;
            TAssetManager.load(path, abPackage, Prefab, (err, prefab) => {
                if (err) {
                    completeCb && completeCb(err);
                    return;
                }
                this._poolMaxSize.set(name, maxSize);
                this._prefabMap.set(name, prefab as Prefab);
                let pool = new NodePool(name);
                for (let i = 0; i < size; i++) {
                    let node = instantiate(prefab as Prefab);
                    node.name = name;
                    pool.put(node);
                }
                this._pools.set(obj.name, pool);
                progressCb && progressCb(0, total, pool);
                finish++;
                finish === total && completeCb && completeCb(null);
            })
        })
    }

    addRef(node: Node | Prefab, name: string, capacity: { size?: number, maxSize?: number });
    addRef(node: Node | Prefab, name: string);
    addRef(node: Node | Prefab);
    addRef(node: Node | Prefab, name?: string, capacity?: { size?: number, maxSize?: number }) {
        let objName = node.name;
        let size = 0;
        let maxSize = this.defaultMaxSize;
        if (typeof name === "string") {
            objName = name.length > 0 ? name : node.name;
        }
        if (typeof name === "object") {
            size = capacity.size || 0;
            maxSize = capacity.maxSize || this.defaultMaxSize;
        }
        if (capacity) {
            size = capacity.size || 0;
            maxSize = capacity.maxSize || this.defaultMaxSize;
        }

        let pool = new NodePool(objName);

        for (let index = 0; index < size; index++) {
            let item: Node = instantiate(node) as Node;
            item.name = objName;
            pool.put(item);
        }

        this._pools.set(objName, pool);
        this._poolMaxSize.set(objName, maxSize);
        this._prefabMap.set(objName, node);
        node instanceof Prefab || node.parent.removeChild(node);
    }

    get(name: string) {
        let pool = this._pools.get(name);
        if (!pool) {
            console.error(`can not find node pool ${name}`);
            return null;
        }
        if (pool.size() > 0) {
            return pool.get();
        }
        let prefab = this._prefabMap.get(name);
        if (!prefab) {
            console.error(`can not find prefab ${name}`);
            return null;
        }
        let node = instantiate(prefab) as Node;
        node.name = name;
        return node;
    }

    put(node: Node) {
        let name = node.name;
        let pool = this._pools.get(name);
        if (!pool) {
            console.error(`can not find node pool ${name}`);
            node.destroy();
            return;
        }
        if (pool.size() >= this._poolMaxSize.get(name)) {
            node.destroy();
            return;
        }
        pool.put(node);
    }

    delete(name: string) {
        let pool = this._pools.get(name);
        if (!pool) {
            console.error(`can not find node pool ${name}`);
            return;
        }
        pool.clear();
        this._pools.delete(name);
        this._poolMaxSize.delete(name);
        this._prefabMap.delete(name);
    }

    clear() {
        this._pools.forEach(pool => {
            pool.clear();
        });
        this._pools.clear();
        this._poolMaxSize.clear();
        this._prefabMap.clear();
    }
}