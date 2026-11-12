import { js } from "cc";
import SingletonFactory from "../Util/SingletonFactory";
import UIPage, { TEA_UI_TYPE } from "./UIPage";
import GameItem from "./GameItem";
import { UIBase } from "./UIBase";

export abstract class UIView extends UIBase implements IUIView {
    abstract UIType: TEA_UI_TYPE;

    /**
     * Full视图建议调用pop、switch、resetTo方法或重写ShowType类型后调用show，否则show方法会使用默认的ShowType
     * @param params
     */
    static show(...params: any) { };

    hide(): void {
        SingletonFactory.getInst(UIPage).HideUI(this);
    }

    static hide() {
        SingletonFactory.getInst(UIPage).HideUI(js.getClassName(this));
    }
}

export abstract class FullView extends UIView {
    ShowType: ShowType = ShowType.Stack;
    UIType: TEA_UI_TYPE = TEA_UI_TYPE.FULL;

    protected back(): void {
        SingletonFactory.getInst(UIPage).BackUI();
    }
    static show(...uiData: any) {
        SingletonFactory.getInst(UIPage).PopView(js.getClassName(this), ...uiData);
    }
    static switch(...uiData: any): void {
        SingletonFactory.getInst(UIPage).SwitchView(js.getClassName(this), ...uiData);
    }
    static resetTo(...uiData: any): void {
        SingletonFactory.getInst(UIPage).ResetToView(js.getClassName(this), ...uiData);
    }
}
export abstract class PopView extends UIView {
    UIType: TEA_UI_TYPE = TEA_UI_TYPE.POP;
    static show(...params: any) {
        SingletonFactory.getInst(UIPage)['ShowDialog'](js.getClassName(this), ...params);
    }
}
export abstract class TipView extends UIView {
    UIType: TEA_UI_TYPE = TEA_UI_TYPE.TIP;
    private queue: Array<Function> = [];
    protected timer: number = 3;
    static show(...params: any) {
        SingletonFactory.getInst(UIPage)['ShowTip'](js.getClassName(this), ...params);
    }
}
export abstract class ResidentView extends UIView {
    UIType: TEA_UI_TYPE = TEA_UI_TYPE.RESIDENT;
    static show(...params: any) {
        SingletonFactory.getInst(UIPage)['ShowCommon'](js.getClassName(this), ...params);
    }
}
export abstract class Cutscene extends UIView implements ICutscene {
    UIType: TEA_UI_TYPE = TEA_UI_TYPE.CUTSCENE;
    animTime: number = 1;
    abstract openAnim(): void;
    abstract closeAnim(): void;
    static show(...params: any) {
        SingletonFactory.getInst(UIPage)['ShowCutscene'](js.getClassName(this), ...params);
    }
}

export interface IUIView {
    UIType: TEA_UI_TYPE;
    /**生命周期方法：挂载后*/
    onMount(): void;
    /**生命周期方法：初始化后 */
    onInit(...params: any[]): void;
    /**生命周期方法：显示后*/
    onShow(): void;
    /**生命周期方法：隐藏后*/
    onHide(): void;
    /**生命周期方法：创建后，注意此时没有挂载完成，勿进行节点操作*/
    onCreated(): void;
}

export interface ICutscene {
    animTime: number;
    openAnim(): void;
    closeAnim(): void;
}

export enum ShowType {
    Stack,
    Switch,
    ResetTo
}

export function onMount(target: UIView | GameItem, key: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    const originaOnMount = target.onMount;
    target.onMount = function () {
        originaOnMount && originaOnMount.apply(this);
        return originalMethod.apply(this);
    };

    delete target[key];

    return descriptor;
}

export function onInit(target: UIView | GameItem, key: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    const originaOnInit = target.onInit;
    target.onInit = function (...params: any[]) {
        originaOnInit && originaOnInit.apply(this);
        return originalMethod.apply(this, params);
    };

    delete target[key];

    return descriptor;
}

export function onShow(target: UIView | GameItem, key: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    const originaOnShow = target.onShow;
    target.onShow = function () {
        originaOnShow && originaOnShow.apply(this);
        return originalMethod.apply(this);
    };

    delete target[key];

    return descriptor;
}

export function onHide(target: UIView | GameItem, key: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    const originaOnHide = target.onHide;
    target.onHide = function () {
        originaOnHide && originaOnHide.apply(this);
        return originalMethod.apply(this);
    };

    delete target[key];

    return descriptor;
}

export function onCreated(target: UIView | GameItem, key: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    const originaOnCreated = target.onCreated;
    target.onCreated = function () {
        originaOnCreated && originaOnCreated.apply(this);
        return originalMethod.apply(this);
    };

    delete target[key];

    return descriptor;
}

export function TBundleName(bundleName: string) {
    return function (target: typeof UIView) {
        let SymbolBundleName = Symbol.for('BundleName');
        target.prototype[SymbolBundleName] = bundleName;
    };
}
