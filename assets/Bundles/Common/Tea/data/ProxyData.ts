import { Component, Node, isValid } from "cc";

export default class ProxyData {
    private static dataSources: Map<string, any> = new Map();
    private static observers: Map<string, Array<{inst, key}>> = new Map();
    public static setDataSource(name: string, dataSource: any) {
        this.dataSources.set(name, dataSource);
    }
    public static addObserver(name: string, inst: any, key: string) {
        if (!this.observers.has(name)) {
            this.observers.set(name, []);
        }
        if (this.observers.get(name).some((observer) => observer.inst === inst && observer.key === key))
            return;
        this.observers.get(name).push({inst, key});
    }
    public static removeObserver(name: string, inst: any, key: string) {
        if (this.observers.has(name)) {
            const observers = this.observers.get(name);
            const index = observers.findIndex((observer) => observer.inst === inst && observer.key === key);
            if (index >= 0) {
                observers.splice(index, 1);
            }
        }
    }
    public static notifyObservers(name: string) {
        if (this.observers.has(name)) {
            const observers = this.observers.get(name);
            let filters = [];
            observers.forEach((observer) => {
                if(!observer.inst || (observer.inst instanceof Component && !isValid(observer.inst))){
                    filters.push(observer);
                    return;
                }
                observer.inst[observer.key] = this.dataSources.get(name);
            });
            let newObservers = observers.filter((observer) => {
                return filters.indexOf(observer) === -1;
            });
            this.observers.set(name, newObservers);
        }
    }
    public static getDataSource(name: string) {
        return this.dataSources.get(name);
    }
}

export function ProxyAware<T extends { new(...args: any[]): {} }>(TargetClass: T) {
    let symbol = Symbol.for('observers');
    if (!TargetClass.prototype[symbol]) {
        TargetClass.prototype[symbol] = new Map<string, Array<string>>();
    }
    return class extends TargetClass {
        constructor(...args: any[]) {
            super(...args);
            let map: Map<string, Array<string>> = TargetClass.prototype[symbol];
            let keys = Array.from(map.keys());
            keys.forEach((key) => {
                let list = TargetClass.prototype[symbol].get(key);
                let val = ProxyData.getDataSource(key);
                list.forEach((prop) => {
                    ProxyData.addObserver(key, this, prop);
                    this[prop] = val;
                });
            });
        }
    } as any;
}

export function ProxySource(ProxyKey, DefaultValue?){
    ProxyData.setDataSource(ProxyKey, DefaultValue);
    return function(target, key) {
        delete target[key];
        const handler: PropertyDescriptor = {
            get: function () {
                return ProxyData.getDataSource(ProxyKey);
            },
            set: function (value) {
                ProxyData.setDataSource(ProxyKey, value);
                ProxyData.notifyObservers(ProxyKey);
            },
            enumerable: true,
            configurable: true,
        }

        return handler as any;
    }
}

export function ProxyObserver(ProxyKey: string) {
    return function(target: any, key: string) {
        let symbol = Symbol.for('observers');

        if (!target[symbol]) {
            target[symbol] = new Map<string, Array<string>>();
        }

        if (!target[symbol].has(ProxyKey)) {
            target[symbol].set(ProxyKey, []);
        }

        target[symbol].get(ProxyKey).push(key);
    };
}