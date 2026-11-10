import SingletonFactory, { Singleton } from "./SingletonFactory";

@Singleton()
export default class BranchStrategy {
    private _cache = new Map<string, Map<string | number, Function>>();

    private _add(key: string, branch: string | number, func: Function) {
        if(!this._cache.has(key)){
            this._cache.set(key, new Map());
        }
        this._cache.get(key).set(branch, func);
    }

    private _get(key: string, branch: string | number){
        if(!this._cache.has(key) || !this._cache.get(key).has(branch))
            return null;
        return this._cache.get(key).get(branch);
    }

    public Call(target, baseKey: string, branchKey: string | number, ...args){
        let func: Function = this._get(baseKey, branchKey);
        func && func.call(target, ...args);
    }

    public remove(baseKey: string){
        if(!this._cache.has(baseKey))
            return;
        this._cache.delete(baseKey);
    }
}

export function Branch(base: string, branchKey: string | number) {
    return function (
        target: any,
        key: string,
        descriptor: PropertyDescriptor,
    ) {
        SingletonFactory.getInst(BranchStrategy)['_add'](base, branchKey, descriptor.value);
        return descriptor;
    }
}