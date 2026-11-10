import { Button, Director, Game, _decorator, director, game, js, sp } from "cc";
import UIPage from "../UI/UIPage";
import EventManager from "../Util/EventManager";
import SingletonFactory from "../Util/SingletonFactory";
import { DEBUG, DEV, EDITOR } from "cc/env";
import { LogApi, LogApiManager } from "../Util/LogApi";

// @btnUnDots(1)
@GlobalMount
@previewSkeleton
export class Preset { }

//#region 按钮点击防抖
// function btnUnDots(timer) {
//     return function (target) {
//         let _onTouchEnded = Button.prototype['_onTouchEnded'];
//         Button.prototype['_customIsClicked'] = false;
//         Button.prototype['_onTouchEnded'] = function (event) {
//             if (this._customIsClicked) {
//                 if (!this._interactable || !this.enabledInHierarchy) {
//                     return;
//                 }

//                 this._pressed = false;
//                 this._updateState();

//                 if (event) {
//                     event.propagationStopped = true;
//                 }
//                 return
//             };
//             this._customIsClicked = true;
//             _onTouchEnded.call(this, event);
//             setTimeout(() => {
//                 this._customIsClicked = false;
//             }, 1000 * timer);
//         };
//     }
// }
// #endregion

//#region 骨骼动画预览
function previewSkeleton(target) {
    if(!EDITOR) return;
    let TrackBinding = js.getClassByName("cc.animation.TrackBinding");
    const origincreateRuntimeBinding = TrackBinding.prototype.createRuntimeBinding;
    TrackBinding.prototype.createRuntimeBinding = function (target: any, poseOutput: any, isConstant: boolean) {
        let res = origincreateRuntimeBinding.call(this, target, poseOutput, isConstant);
        const originSet = res.setValue;
        res.setValue = function (value: any) {
            if (res.target instanceof sp.Skeleton) {
                if (value != res.getValue()) {
                    originSet.call(this, value);
                }
            } else {
                originSet.call(this, value);
            }
        }

        return res;
    }

    const originProload = sp.Skeleton.prototype.__preload;
    sp.Skeleton.prototype.__preload = function () {
        originProload.call(this);
        this.paused = false;
        this._updateSkeletonData();
        this._updateDebugDraw();
    }
}
//#endregion

//#region 全局挂载
function GlobalMount(target) {
    globalThis.TEA_DEBUG = false;
    globalThis.on = (key, cb, sort?, target?) => {
        SingletonFactory.getInst(EventManager).on(key, cb, sort, target);
    }
    globalThis.once = (key, cb, sort?, target?) => {
        SingletonFactory.getInst(EventManager).once(key, cb, sort, target);
    }
    globalThis.trigger = (key: string, ...args: any[]) => {
        SingletonFactory.getInst(EventManager).trigger(key, ...args);
    }
    globalThis.off = (key, param) => {
        SingletonFactory.getInst(EventManager).off(key, param);
    }
    globalThis.clearEvent = (key) => {
        SingletonFactory.getInst(EventManager).clearEvent(key);
    }
    globalThis.getInst = (classType) => {
        return SingletonFactory.getInst(classType);
    }
    globalThis.startGame = (classType) => {
        return SingletonFactory.getInst(UIPage).startGame(classType);
    }
    globalThis.stopGame = (cb) => {
        return SingletonFactory.getInst(UIPage).stopGame(cb);
    }
    globalThis.LOG = (...args) => {
        if (!DEV && !DEBUG && !TEA_DEBUG)
            return;
        let api = LogApiManager.getMethodPath();
        LogApiManager.log(api[0], api[1], ...args)
    }
    globalThis.WARN = (...args) => {
        if (!DEV && !DEBUG && !TEA_DEBUG)
            return;
        let api = LogApiManager.getMethodPath();
        LogApiManager.warn(api[0], api[1], ...args)
    }
    globalThis.ERROR = (...args) => {
        if (!DEV && !DEBUG && !TEA_DEBUG)
            return;
        let api = LogApiManager.getMethodPath();
        LogApiManager.error(api[0], api[1], ...args)
    }

    globalThis.LogApi = LogApi;

    globalThis.ResetTo = (uiName: string, ...params)=>{
        let uiPage = SingletonFactory.getInst(UIPage);
        uiPage.constructor.prototype.ResetToView.call(uiPage, uiName, ...params);
    };
    globalThis.PopTo = (uiName: string, ...params)=>{
        let uiPage = SingletonFactory.getInst(UIPage);
        uiPage.constructor.prototype.PopView.call(uiPage, uiName, ...params);
    };
    globalThis.SwitchTo = (uiName: string, ...params)=>{
        let uiPage = SingletonFactory.getInst(UIPage);
        uiPage.constructor.prototype.SwitchView.call(uiPage, uiName, ...params);
    };
    globalThis.ShowDialog = (uiName: string, ...params)=>{
        let uiPage = SingletonFactory.getInst(UIPage);
        uiPage.constructor.prototype.ShowDialog.call(uiPage, uiName, ...params);
    };
    globalThis.ShowTip = (uiName: string, ...params)=>{
        let uiPage = SingletonFactory.getInst(UIPage);
        uiPage.constructor.prototype.ShowTip.call(uiPage, uiName, ...params);
    };
    globalThis.ShowCommon = (uiName: string, ...params)=>{
        let uiPage = SingletonFactory.getInst(UIPage);
        uiPage.constructor.prototype.ShowCommon.call(uiPage, uiName, ...params);
    };
}
//#endregion