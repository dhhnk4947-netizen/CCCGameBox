import { find, instantiate, Prefab, Node, UITransform, view, game, director, Canvas, js, ResolutionPolicy, sys, screen } from "cc";
import TAssetManager from "../Util/TAssetManager";
import SingletonFactory, { Singleton } from "../Util/SingletonFactory";
import { Cutscene, FullView, PopView, ResidentView, TipView, UIView } from "./UIView";
import GameItem from "./GameItem";

export enum TEA_UI_TYPE {
    FULL,
    POP,
    RESIDENT,
    TIP,
    CUTSCENE
}

export class UILRU {
    private _cache: { [key: string]: view } = {};
    private head: view;
    private tail: view;
    private size: number;
    constructor(size: number) {
        this.size = size;
        this.head = { prev: null, next: null, ui: null };
        this.tail = { prev: null, next: null, ui: null };
        this.head.next = this.tail;
        this.tail.prev = this.head;
    }

    private delete() {
        let ui = this.head.next;
        while (ui.ui.node.active && ui != this.tail) {
            ui = ui.next;
        }
        if (ui == this.tail) {
            return;
        }
        ui.prev.next = ui.next;
        ui.next.prev = ui.prev;
        delete this._cache[ui.ui.name];
        ui.ui = null;
        ui.prev = null;
        ui.next = null;
        SingletonFactory.getInst(UIPage)['delete'](ui.ui.name);
    }

    put(key, ui: UIView) {
        if (this.size == -1) return;
        let view = this._cache[key];
        if (view) {
            view.prev.next = view.next;
            view.next.prev = view.prev;
        }
        view = { prev: this.tail.prev, next: this.tail, ui: ui };
        this.tail.prev.next = view;
        this.tail.prev = view;
        this._cache[key] = view;
        if (this.size < Object.keys(this._cache).length) {
            this.delete();
        }
    }

    clear() {
        this._cache = {};
        this.head.next = this.tail;
        this.tail.prev = this.head;
    }
}

@Singleton()
export default class UIPage {
    private _uiTaskList: Array<UIView> = [];

    private _uiQueue: Array<Function> = [];
    private isShowing: boolean = false;
    private MountCbs: Array<Function> = [];
    private GameMount(node) { };

    private currGame: GameItem = null;

    private _uiCache: { [key: string]: UIView } = {};

    private FullLRU: UILRU;
    private PopLRU: UILRU;

    private gameTrans: UITransform;
    private uiRoot: Node;
    private uiTrans: UITransform;
    init(cb?) {
        this.FullLRU = new UILRU(MaxFullPage);
        this.PopLRU = new UILRU(MaxPopPage);

        const scene = director.getScene();
        const canvas = scene.getComponentInChildren(Canvas).node;

        let oldGameRoot2D = find("GameNode2D");
        oldGameRoot2D && oldGameRoot2D.destroy();
        let oldGameRoot3D = find("GameNode3D");
        oldGameRoot3D && oldGameRoot3D.destroy();

        let gameNode2D = new Node();
        this.gameTrans = gameNode2D.addComponent(UITransform);
        gameNode2D.name = "GameNode2D";
        gameNode2D.parent = canvas;
        let gameNode3D = new Node();
        gameNode3D.name = "GameNode3D";
        gameNode3D.parent = scene;

        let oldUIRoot = find("UIRoot", canvas);
        oldUIRoot && oldUIRoot.destroy();

        this.uiRoot = new Node();
        this.uiTrans = this.uiRoot.addComponent(UITransform);
        this.uiRoot.name = "UIRoot";
        this.uiRoot.parent = canvas;

        let fullNode = new Node();
        fullNode.name = "Full";
        fullNode.parent = this.uiRoot;
        let residentNode = new Node();
        residentNode.name = "Resident";
        residentNode.parent = this.uiRoot;
        let popNode = new Node();
        popNode.name = "Pop";
        popNode.parent = this.uiRoot;
        let tipNode = new Node();
        tipNode.name = "Tip";
        tipNode.parent = this.uiRoot;

        this.MountCbs[TEA_UI_TYPE.FULL] = (view) => {
            view.setContentSize(this.uiTrans.contentSize);
            fullNode.addChild(view);
            view.setPosition(0, 0);
        }
        this.MountCbs[TEA_UI_TYPE.POP] = (view) => {
            view.setContentSize(this.uiTrans.contentSize);
            popNode.addChild(view);
            view.setPosition(0, 0);
        }
        this.MountCbs[TEA_UI_TYPE.TIP] = (view) => {
            view.setContentSize(this.uiTrans.contentSize);
            tipNode.addChild(view);
            view.setPosition(0, 0);
        }
        this.MountCbs[TEA_UI_TYPE.RESIDENT] = (view) => {
            view.setContentSize(this.uiTrans.contentSize);
            residentNode.addChild(view);
            view.setPosition(0, 0);
        }

        this.GameMount = (game: Node) => {
            gameNode2D.removeAllChildren();
            gameNode3D.removeAllChildren();

            if (game.getComponent(GameItem).is3D()) {
                gameNode3D.addChild(game);
            } else {
                gameNode2D.addChild(game);
            }

            game.setPosition(0, 0, 0);
        }

        canvas.setSiblingIndex(999);

        let size = view.getVisibleSize();
        let resolutionSize = view.getDesignResolutionSize();
        const proportion = size.height / size.width;
        if (proportion > 1.5 && proportion < 2.2) {
            view.setDesignResolutionSize(resolutionSize.width, resolutionSize.height, ResolutionPolicy.FIXED_WIDTH);
        } else {
            view.setDesignResolutionSize(resolutionSize.width, resolutionSize.height, ResolutionPolicy.SHOW_ALL);
        }
        this.uiRootAdapt();

        if (sys.platform != sys.Platform.IOS && sys.platform != sys.Platform.ANDROID) {
            view.on('canvas-resize', this.adapt, this);
        }
        cb && cb();
    }

    private adapt() {
        let size = screen.windowSize;
        let resolutionSize = view.getDesignResolutionSize();
        const proportion = size.height / size.width;
        if (proportion > 1.5 && proportion < 2.2) {
            view.setDesignResolutionSize(resolutionSize.width, resolutionSize.height, ResolutionPolicy.FIXED_WIDTH);
        } else {
            view.setDesignResolutionSize(resolutionSize.width, resolutionSize.height, ResolutionPolicy.SHOW_ALL);
        }
        this.uiRootAdapt();
    }

    private uiRootAdapt(){
        const scene = director.getScene();
        const canvas = scene.getComponentInChildren(Canvas).node;

        requestAnimationFrame(() => {
            const canvasSize = canvas.getComponent(UITransform).contentSize;
            this.uiTrans.setContentSize(canvasSize);
            this.gameTrans.setContentSize(canvasSize);
            this.uiRoot.children.forEach(node => {
                let trans = node.getComponent(UITransform);
                if(!trans){
                    trans = node.addComponent(UITransform);
                }
                trans.setContentSize(this.uiTrans.contentSize);
            });
        })
    }

    private ShowDialog(uiName: string, ...uiData: any) {
        let fun = (ui: PopView) => {
            let index = Object.keys(this._uiCache).length + 1;
            ui.node.setSiblingIndex(index);
            ui.node.active = true;
            const PageShow = ui.constructor.prototype['TeaUIPageShow'];
            PageShow && PageShow.call(ui);
            ui.onInit(...uiData);
            this.PopLRU.put(uiName, ui);
        }

        this.loadUI(uiName, fun.bind(this));
    }
    private ShowTip(uiName: string, ...uiData: any) {
        let ui = this._uiCache[uiName];
        if (ui && ui.node.active) {
            ui['queue'].push(() => {
                this.ShowTip(uiName, ...uiData);
            });
            return;
        }
        let fun = (ui: TipView) => {
            if (!ui) return;
            let index = Object.keys(this._uiCache).length + 1;
            ui.node.setSiblingIndex(index);
            ui.node.active = true;
            const PageShow = ui.constructor.prototype['TeaUIPageShow'];
            PageShow && PageShow.call(ui);
            ui.onInit(...uiData);
        }

        this.loadUI(uiName, fun.bind(this));
    }

    private ShowCommon(uiName: string, ...uiData: any) {
        let fun = (ui: ResidentView) => {
            if (!ui) return;
            ui.node.active = true;
            const PageShow = ui.constructor.prototype['TeaUIPageShow'];
            PageShow && PageShow.call(ui);
            ui.onInit(...uiData);
        }

        this.loadUI(uiName, fun.bind(this));
    }

    private ShowCutscene(uiName: string, ...uiData: any) {
        let fun = (ui: Cutscene) => {
            if (!ui) return;
            ui.node.active = true;
            const PageShow = ui.constructor.prototype['TeaUIPageShow'];
            PageShow && PageShow.call(ui);
            ui.onInit(...uiData);
            ui.openAnim();
        }

        this.loadUI(uiName, fun.bind(this));
    }

    private loadUI(uiName: string, cb: Function): void {
        if (this.isShowing) {
            this._uiQueue.push(() => {
                this.loadUI(uiName, cb);
            });
            return;
        }
        this.isShowing = true;
        let fun = () => {
            if (this._uiQueue.length == 0) {
                this.isShowing = false;
                return;
            }

            requestAnimationFrame(() => {
                this.isShowing = false;
                this._uiQueue.shift()();
            });
        }

        let ui = this._uiCache[uiName];
        if (ui) {
            cb(ui);
            fun();
            return;
        }

        TAssetManager.load(UIPath + uiName, MainBundle, (err, assets) => {
            if (err) {
                ERROR(err);
                fun();
                return;
            }
            let node: Node = instantiate(assets as Prefab);
            ui = node.getComponent(uiName) as UIView;
            if (!ui) {
                ui = node.addComponent(uiName) as UIView;
            }
            if (!ui) {
                ERROR("UIView not found");
                return;
            }
            console.log(ui.onCreated);
            ui.onCreated();
            this.MountCbs[ui.UIType](node);
            const Mount = ui.constructor.prototype['TeaUIPageMount'];
            Mount && Mount.call(ui);
            this._uiCache[uiName] = ui;
            cb(ui);
            fun();
        })
    }

    public HideUI(uiName: string): void;
    public HideUI(target: UIView): void;
    public HideUI(param: string | UIView): void {
        let ui: UIView;
        if (typeof param === "string") {
            ui = this._uiCache[param];
        } else {
            ui = param;
        }

        if (!ui)
            return;
        ui.node.active = false;
        const PageHide = ui.constructor.prototype['TeaUIPageHide'];
        PageHide && PageHide.call(ui);
        let len = this._uiTaskList.length;
        if (this._uiTaskList[len - 1].name == param) {
            this._uiTaskList.pop();
        }
    }

    public BackUI(): void {
        if (this._uiTaskList.length <= 1)
            return;
        let ui = this._uiTaskList.pop();
        ui.node.active = false;
        const PageHide = ui.constructor.prototype['TeaUIPageHide'];
        PageHide && PageHide.call(ui);
        let backUI = this._uiTaskList[this._uiTaskList.length - 1];
        backUI.node.active = true;
        const PageShow = backUI.constructor.prototype['TeaUIPageShow'];
        PageShow && PageShow.call(backUI);
    }

    /**慎用，需要考虑到最大层级 */
    public PopView(uiName: string, ...uiData: any): void {
        if (this._uiTaskList.length >= MaxPage)
            return;
        if (this._uiTaskList.length > 0 && this._uiTaskList[this._uiTaskList.length - 1].name == uiName && !this._uiTaskList[this._uiTaskList.length - 1].node.active) {
            this._uiTaskList[this._uiTaskList.length - 1].node.active = true;
            const PageShow = this._uiTaskList[this._uiTaskList.length - 1].constructor.prototype['TeaUIPageShow'];
            PageShow && PageShow.call(this._uiTaskList[this._uiTaskList.length - 1]);
            return;
        }
        let fun = (ui: FullView) => {
            if (!ui) return;
            Object.keys(this._uiCache).forEach(key => {
                if (this._uiCache[key].UIType != TEA_UI_TYPE.RESIDENT && ui != this._uiCache[key]) {
                    this._uiCache[key].node.active = false;
                    const PageHide = this._uiCache[key].constructor.prototype['TeaUIPageHide'];
                    PageHide && PageHide.call(this._uiCache[key]);
                }
            })
            ui.node.active = true;
            const PageShow = ui.constructor.prototype['TeaUIPageShow'];
            PageShow && PageShow.call(ui);
            ui.onInit(...uiData);
            this._uiTaskList.push(ui);
            this.FullLRU.put(uiName, ui);
        }

        this.loadUI(uiName, fun.bind(this));
    }
    public SwitchView(uiName: string, ...uiData: any): void {
        let fun = (ui: FullView) => {
            if (!ui) return;
            Object.keys(this._uiCache).forEach(key => {
                if (this._uiCache[key].UIType != TEA_UI_TYPE.RESIDENT && ui != this._uiCache[key]) {
                    this._uiCache[key].node.active = false;
                    const PageHide = this._uiCache[key].constructor.prototype['TeaUIPageHide'];
                    PageHide && PageHide.call(this._uiCache[key]);
                }
            })

            if (this._uiTaskList.length > 0) {
                this._uiTaskList.pop();
            }

            ui.node.active = true;
            const PageShow = ui.constructor.prototype['TeaUIPageShow'];
            PageShow && PageShow.call(ui);
            ui.onInit(...uiData);
            this._uiTaskList.push(ui);
            this.FullLRU.put(uiName, ui);
        }

        this.loadUI(uiName, fun.bind(this));
    }
    public ResetToView(uiName: string, ...uiData: any): void {
        let fun = (ui: FullView) => {
            if (!ui) return;
            Object.keys(this._uiCache).forEach(key => {
                if (this._uiCache[key].UIType != TEA_UI_TYPE.RESIDENT && ui != this._uiCache[key]) {
                    this._uiCache[key].node.active = false;
                    const PageHide = this._uiCache[key].constructor.prototype['TeaUIPageHide'];
                    PageHide && PageHide.call(this._uiCache[key]);
                }
            })
            this._uiTaskList.length = 0;
            ui.node.active = true;
            const PageShow = ui.constructor.prototype['TeaUIPageShow'];
            PageShow && PageShow.call(ui);
            ui.onInit(...uiData);
            this._uiTaskList.push(ui);
            this.FullLRU.put(uiName, ui);
        }

        this.loadUI(uiName, fun.bind(this));
    }

    public preLoadUI(uiList: Array<Tea.PreLoadUI>, cb: Function = null): void {
        if (uiList.length == 0) {
            cb && cb();
            return;
        }
        let len = uiList.length;
        let index = 0;

        uiList.forEach(ui => {
            ui.abPackage = ui.abPackage ?? '';
            TAssetManager.loadDir(ui.path, ui.abPackage, (err, assets) => {
                if (err) {
                    ERROR("loadDir error:", err);
                    return;
                }
                assets.forEach(asset => {
                    let node: Node = instantiate(asset as Prefab);
                    node.active = false;
                    let ui = node.getComponent(asset.name) as UIView;
                    if (!ui) {
                        const clazz = js.getClassByName(asset.name) as any;
                        ui = node.addComponent(clazz) as UIView;
                    }
                    if (!ui) {
                        ERROR("UIView not found");
                        return;
                    }
                    ui.onCreated();
                    this.MountCbs[ui.UIType](node);
                    const Mount = ui.constructor.prototype['TeaUIPageMount'];
                    Mount && Mount.call(ui);
                    this._uiCache[node.name] = ui;
                })
                index++;
                index >= len && cb && cb();
            })
        })
    }

    public CloseAllUI(): void {
        this._uiQueue = [];
        this._uiTaskList = [];
        Object.keys(this._uiCache).forEach(key => {
            this._uiCache[key].node.active = false;
            const PageHide = this._uiCache[key].constructor.prototype['TeaUIPageHide'];
            PageHide && PageHide.call(this._uiCache[key]);
        })
        this.FullLRU.clear();
        this.PopLRU.clear();
    }

    public preLoadAllUI(cb: Function = null): void {
        TAssetManager.loadDir(UIPath, MainBundle, (err, assets) => {
            if (err) {
                ERROR("loadDir error:", err);
                return;
            }
            assets.forEach(asset => {
                let uiName = asset.name;
                if (!this._uiCache[uiName]) {
                    let node: Node = instantiate(asset as Prefab);
                    node.active = false;
                    let ui = node.getComponent(uiName) as UIView;
                    if (!ui) {
                        const clazz = js.getClassByName(asset.name) as any;
                        ui = node.addComponent(clazz) as UIView;
                    }
                    if (!ui) {
                        ERROR("UIView not found");
                        return;
                    }
                    ui.onCreated();
                    this.MountCbs[ui.UIType](node);
                    const Mount = ui.constructor.prototype['TeaUIPageMount'];
                    Mount && Mount.call(ui);
                    this._uiCache[node.name] = ui;
                }
            })
            cb && cb();
        })
    }

    public checkUI(uiName: string): boolean {
        return this._uiCache[uiName] && this._uiCache[uiName].node.active;
    }

    public ClearUI(): void {
        this._uiTaskList = [];
        this._uiCache = {};
        this._uiQueue = [];
        this.isShowing = false;
    }

    private delete(view: string) {
        let ui = this._uiCache[view];
        if (ui) {
            (!ui.constructor.prototype.SymbolBundleName) && (ui.node.destroy(), delete this._uiCache[view]);
            (ui.constructor.prototype.SymbolBundleName) && (ui.node.removeFromParent());
        }
    }

    public addUI(prefabs: Prefab[], cb) {
        prefabs.forEach(prefab => {
            let uiName = prefab.name;
            let node: Node = this._uiCache[uiName] ? this._uiCache[uiName].node : instantiate(prefab);
            node.active = false;
            let ui = node.getComponent(uiName) as UIView;
            if (!ui) {
                ui = node.addComponent(uiName) as UIView;
            }
            if (!ui) {
                ERROR("UIView not found");
                return;
            }
            this.MountCbs[ui.UIType](node);
            const Mount = ui.constructor.prototype['TeaUIPageMount'];
            Mount && Mount.call(ui);
            this._uiCache[uiName] = ui;
        })
        cb();
    }

    startGame<T extends GameItem>(classType: { new(): T }, ...uiData)
    startGame(classType: string, ...uiData)
    async startGame<T extends GameItem>(classType: { new(): T } | string, ...uiData) {
        let clazz = null;
        if (typeof classType == 'string') {
            const bundle = await TAssetManager.getBundle(classType);
            if (!bundle) {
                ERROR("Bundle not found: " + classType);
                return;
            }
            clazz = js.getClassByName(classType) as any;
        } else {
            clazz = classType;
        }
        let name = clazz.prototype['SymbolName'];
        let bundleName = clazz.prototype['SymbolBundleName'];
        let path = clazz.prototype['SymbolPath'];
        let viewPath = clazz.prototype['SymbolViewPath'];
        let fun = (gameItem: GameItem) => {
            if (!gameItem) return;
            gameItem.node.active = true;
            const PageShow = gameItem.constructor.prototype['TeaUIPageShow'];
            PageShow && PageShow.call(gameItem);
            gameItem.onInit(...uiData);
        }
        let loadView = new Promise((resolve, reject) => {
            TAssetManager.loadDir(viewPath, bundleName, Prefab, (err, assets) => {
                if (err) {
                    ERROR(err);
                    return;
                }
                assets.forEach(asset => {
                    let node: Node = instantiate(asset as Prefab);
                    let name = node.name;
                    node.active = false;
                    let ui: UIView = node.getComponent(name) as UIView;
                    let SymbolBundleName = Symbol.for('SymbolBundleName');
                    if (!ui) {
                        const clazz = js.getClassByName(asset.name) as any;
                        ui = node.addComponent(clazz) as UIView;
                    }
                    if (!ui) {
                        ERROR(name + " not found");
                        return;
                    }
                    ui.constructor.prototype[SymbolBundleName] = bundleName;
                    ui.onCreated();
                    this.MountCbs[ui.UIType](node);
                    const Mount = ui.constructor.prototype['TeaUIPageMount'];
                    Mount && Mount.call(ui);
                    this._uiCache[name] = ui;
                })
                resolve(null);
            })
        });


        let loadGame = new Promise((resolve, reject) => {
            if (this.currGame) {
                let gameNode = this.currGame.node;
                let currBundleName = this.currGame['SymbolBundleName'];
                gameNode.destroy();
                this.currGame = null;
                currBundleName == bundleName || setTimeout(() => {
                    this.clearUIByBundle(currBundleName);
                }, game.frameTime);
            }
            TAssetManager.load(path, bundleName, Prefab, (err, assets) => {
                if (err) {
                    ERROR(err);
                    return;
                }
                LOG("loadGame", assets);
                let node: Node = instantiate(assets as Prefab);
                let gameItem = node.getComponent(GameItem);
                if (!gameItem) {
                    gameItem = node.addComponent(clazz) as GameItem;
                }
                if (!gameItem) {
                    ERROR("GameItem not found: " + name);
                    return;
                }

                this.CloseAllUI();

                gameItem.onCreated();
                this.GameMount(node);
                const Mount = gameItem.constructor.prototype['TeaUIPageMount'];
                Mount && Mount.call(gameItem);
                this.currGame = gameItem;
                fun(gameItem);
                resolve(null);
            })
        });

        Promise.resolve().then(() => {
            LOG("Promise.resolve ====> loadView");
            return loadView;
        }).then(() => {
            LOG("Promise.resolve ====> loadGame");
            return loadGame;
        }).catch(err => {
            ERROR(err);
        });
    }

    stopGame(cb?) {
        if (!this.currGame) {
            cb && cb();
            return;
        }
        let gameNode = this.currGame.node;
        gameNode.active = false;
        this.currGame['TeaUIPageHide']();
        cb && cb();
    }

    clearUIByBundle(bundleName: string) {
        let SymbolBundleName = Symbol.for('SymbolBundleName');
        const keys = Object.keys(this._uiCache).filter(key =>
            this._uiCache[key][SymbolBundleName] === bundleName
        );

        const fun = () => {
            const MAX_DESTROY_NUM = game.frameTime < 16 ? 10 : game.frameTime < 33 ? 8 : 5;
            let processed = 0;

            while (keys.length > 0) {
                const k = keys.shift()!;
                this._uiCache[k].node.destroy();
                delete this._uiCache[k];
                processed++;

                if (processed >= MAX_DESTROY_NUM) {
                    break;
                }
            }

            if (keys.length > 0) {
                requestAnimationFrame(fun.bind(this));
            } else {
                TAssetManager.releaseAll(bundleName)
            }
        };

        fun();
    }
}

interface view {
    prev: view,
    next: view,
    ui: UIView
}