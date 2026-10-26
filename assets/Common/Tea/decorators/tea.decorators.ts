import { Component, find, isValid } from "cc";

export function MainCamera(cameraPath) {
    globalThis.MainCamera = cameraPath;
}
export function MainMapper(preset?: { bundleName?: string, uiPath?: string, maxPage?: number, maxFullPage?: number, maxPopPage?: number }) {
    return function (target: any) {
        globalThis.MainBundle = preset.bundleName || null;
        globalThis.UIPath = preset.uiPath || "";
        globalThis.MaxPage = preset.maxPage || 10;
        globalThis.MaxFullPage = preset.maxFullPage || 5;
        globalThis.MaxPopPage = preset.maxPopPage || 5;
    };
}

export function Value(val);
export function Value(val, isDefault);
export function Value(value, isDefault = false) {
    return function (target, key) {
        const symbol = Symbol.for(key);
        delete target[key];
        const handler: PropertyDescriptor = {
            get: function () {
                if (!isDefault || this[symbol] === undefined)
                    return value;
                return this[symbol] || value;
            },
            set: function (value) {
                if (isDefault)
                    this[symbol] = value;
            },
            enumerable: true,
            configurable: true,
        }
        // Object.defineProperty(target, key, handler);

        return handler as any;
    }
}

export function DefaultValue(value) {
    return function (target, key) {
        const symbol = Symbol.for(key);
        delete target[key];
        const handler: PropertyDescriptor = {
            get: function () {
                return this[symbol] || value;
            },
            set: function (value) {
                this[symbol] = value;
            },
            enumerable: true,
            configurable: true,
        }
        // Object.defineProperty(target, key, handler);

        return handler as any;
    }
}

export function Path(path: string);
export function Path<T extends typeof Component>(path: string, component: T);
export function Path<T extends typeof Component>(path: string, component?: T) {
    return function (target, key) {
        const symbol = Symbol.for(key);
        // delete target[key];
        const handler: PropertyDescriptor = {
            get: function () {
                if(this.name == "T2048"){
                    console.log("this.name == T2048");
                }
                if (!this[symbol]) {
                    let parent = this.node;
                    let node = find(path, parent);
                    this[symbol] = component ? node.getComponent(component) : node;
                }
                return this[symbol];
            },
            set: function (value) { },
            enumerable: true,
            configurable: true,
        }
        // Object.defineProperty(target, key, handler);

        return handler;
    }
}