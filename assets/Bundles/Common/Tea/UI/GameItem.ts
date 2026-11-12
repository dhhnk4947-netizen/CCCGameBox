import { Camera, Component, UITransform, Node, director } from "cc";
import { UIBase } from "./UIBase";

export default class GameItem extends UIBase {
    is3D() {
        return this.node.getComponent(UITransform) == null;
    }

    get CameraNode(): Node {
        let symbol = Symbol.for('CameraNodeSymbol');
        if (!this[symbol]) {
            let scene = director.getScene();
            this[symbol] = scene.getComponentInChildren(Camera).node;
            let mainCameraSymbol = Symbol.for('MainCameraSymbol');
            this[mainCameraSymbol] = this[symbol].getComponent(Camera);
        }
        return this[symbol];
    }
    get Camera(): Camera {
        let symbol = Symbol.for('MainCameraSymbol');
        if (!this[symbol]) {
            let cameraNodeSymbol = Symbol.for('CameraNodeSymbol');
            let scene = director.getScene();
            this[cameraNodeSymbol] = scene.getComponentInChildren(Camera);
            this[symbol] = this[cameraNodeSymbol].getComponent(Camera);
        }
        return this[symbol];
    }

    close(cb?): void {
        stopGame(cb);
    }

    static close(cb?): void {
        stopGame(cb);
    }
}

export function GameMapper(bundleName: string, path: string) {
    return function (target) {
        target.prototype.SymbolBundleName = bundleName;
        target.prototype.SymbolPath = path;
    }
}