import { Asset, AssetManager } from "cc";
import GameItem from "../UI/GameItem";

declare global {
    var TEA_DEBUG: boolean;
    var MainBundle: string;
    var UIPath: string;
    var MaxPage: number;
    var MaxFullPage: number;
    var MaxPopPage: number;
    var RemoteMD5: { [key: string]: string };

    function initGame(path: string, bundle: string, cb: (...args: any[]) => void);
    function initGame(path: string, cb: (...args: any[]) => void);
    function initGame(path: string);
    function initGame(path: string, bundle: string);

    function unMountGame();

    function on(key: string, cb: (...args: any[]) => void);
    function on(key: string, cb: (...args: any[]) => void, sort: number);
    function on(key: string, cb: (...args: any[]) => void, target);
    function on(key: string, cb: (...args: any[]) => void, sort: number, target);
    function once(key: string, cb: (...args: any[]) => void);
    function once(key: string, cb: (...args: any[]) => void, sort: number);
    function once(key: string, cb: (...args: any[]) => void, target);
    function once(key: string, cb: (...args: any[]) => void, sort: number, target);
    function trigger(key: string, ...args: any[]);
    function off(key: string, param: string);
    function off(key: string, param: (...args: any[]) => void);
    function off(key: string, param: string | ((...args: any[]) => void));
    function clearEvent(key: string);
    function clearEvent(key: string);

    function getInst<T>(classType: { new(): T }): T;

    function startGame<T extends GameItem>(classType: { new(): T }, ...args: any[])
    function startGame(classType: string, ...args: any[])
    function stopGame(cb?);

    function LOG(...args: any[]);
    function WARN(...args: any[]);
    function ERROR(...args: any[]);

    function ResetTo(uiName: string, ...params);
    function PopTo(uiName: string, ...params);
    function SwitchTo(uiName: string, ...params);
    function ShowDialog(uiName: string, ...params);
    function ShowTip(uiName: string, ...params);
    function ShowCommon(uiName: string, ...params);


    namespace Tea {
        interface AssetInfo {
            path: string;
            type?: typeof Asset;
        }

        interface Event {
            cb: (...args: any[]) => void;
            id?: string;
            target?: any;
            sort?: number;
            once: boolean;
        }

        interface ResParams {
            path: string;
            abPackage?: string;
            type?: typeof Asset;
            onProgress?: (finish: number, total: number, item: AssetManager.RequestItem) => void;
            onComplete?: (error: Error, assets: Asset) => void;
        }

        interface PreResParams {
            paths: string | string[];
            abPackage?: string;
            type?: typeof Asset;
            onProgress?: (finish: number, total: number, item: AssetManager.RequestItem) => void;
            onComplete?: (error: Error, items: AssetManager.RequestItem[]) => void
        }

        interface ReleaseParams {
            path: string;
            type: typeof Asset;
            abPackage?: string;
        }

        interface ResDirParams {
            path: string;
            abPackage?: string;
            type?: typeof Asset;
            onProgress?: (finish: number, total: number, item: AssetManager.RequestItem) => void;
            onComplete?: (error: Error, assets: Asset[]) => void;
        }

        interface PreResDirParams {
            paths: string[],
            abPackage?: string,
            onProgress?: ((finish: number, total: number, item: AssetManager.RequestItem) => void),
            onComplete?: (error: Error, items: Asset[]) => void
        }

        interface PreLoadUI {
            path: string;
            abPackage?: string;
        }

        interface ObjPoolParams {
            name: string;
            path?: string;
            abPackage?: string;
            size?: number;
            maxSize?: number;
        }

        interface NavNode {
            x: number;
            y: number;
            g: number;
            h: number;
            f: number;
            parent: NavNode;
        }
    }
}
export { };