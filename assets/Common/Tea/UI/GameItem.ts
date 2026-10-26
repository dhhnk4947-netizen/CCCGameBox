import { Camera, Component, UITransform, Node, director } from "cc";
import ProxyData from "../data/ProxyData";

export default class GameItem extends Component {
    onMount(): void { };
    onInit(...params: any[]): void { };
    onShow(): void { };
    onHide(): void { };
    onCreated(): void { };

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

    private TeaUIPageMount() {
        let onMounts = Symbol.for('TeaMounts');
        let onShows = Symbol.for('TeaShows');
        let onHides = Symbol.for('TeaHides');
        this[onMounts] = this[onMounts] || [];
        this[onShows] = this[onShows] || [];
        this[onHides] = this[onHides] || [];

        this[onMounts].push(this.onMount.bind(this));
        this[onShows].push(this.onShow.bind(this));
        this[onHides].push(this.onHide.bind(this));

        this[onMounts].forEach((fun) => {
            fun();
        });
    }
    private TeaUIPageShow() {
        let symbol = Symbol.for('observers');
        let TargetClass = this.constructor;
        if (TargetClass.prototype[symbol]) {
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
        let onShows = Symbol.for('TeaShows');
        this[onShows].forEach((fun) => {
            fun();
        });
    }
    private TeaUIPageHide() {
        let symbol = Symbol.for('observers');
        let TargetClass = this.constructor;
        if (TargetClass.prototype[symbol]) {
            let map: Map<string, Array<string>> = TargetClass.prototype[symbol];
            let keys = Array.from(map.keys());
            keys.forEach((key) => {
                let list = TargetClass.prototype[symbol].get(key);
                list.forEach((prop) => {
                    ProxyData.removeObserver(key, this, prop);
                });
            });
        }
        let onHides = Symbol.for('TeaHides');
        this[onHides].forEach((fun) => {
            fun();
        });
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