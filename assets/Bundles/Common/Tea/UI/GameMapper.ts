import { SCREEN_TYPE } from "./UIPage";

export function MainScreen(screenType: number) {
    return function (target) {
        globalThis.MAIN_SCREEN_TYPE = screenType;
    }
}

export function GameMapper(bundleName: string, path: string, screenType: SCREEN_TYPE) {
    return function (target) {
        target.prototype.SymbolBundleName = bundleName;
        target.prototype.SymbolPath = path;
        target.prototype.SymbolScreenType = screenType;
    }
}