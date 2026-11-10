import UUID from "./UUID";

export default class SingletonFactory {
    private static _instances = new Map<string, any>();
    public static getInst<T>(classType: { new(...args): T }): T {
        let key = classType['_singletonId'];
        
        if (!key || !this._instances[key]){
            console.error("无实例");
            return null;
        }

        return this._instances[key];
    }

    static setInst(classType, ...args): void {
        if(classType._singletonId)
            return;
        let key = UUID.generateUUID();
        while (this._instances[key]) {
            key = UUID.generateUUID();
        }
        this._instances[key] = new classType(...args);
        classType._singletonId = key;
    }
}

export function Singleton(...args) {
    return function (target: any) {
        if (checkIsClass(target)){
            SingletonFactory.setInst(target, ...args);
        }
    }
}

export function Autowired<T>(constructor: new (...args) => T) {
    return function (target: any, propertyName) {
        delete target[propertyName];
        const handler: PropertyDescriptor = {
            get: function () {
                return SingletonFactory.getInst(constructor);
            },
            set: function(value) {},
            enumerable: true,
            configurable: true,
        }

        return handler as any;
    }
}

const checkIsClass = function (target: unknown): boolean {
    return (
        typeof target === "function" && 
        "prototype" in target && 
        target.prototype.constructor === target
    );
}