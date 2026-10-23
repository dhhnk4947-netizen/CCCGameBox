import { _decorator, AssetManager, assetManager, Component, Label, native, Node, ResolutionPolicy, Sprite, sys, view } from 'cc';
const { ccclass, property } = _decorator;

const VersionManifest = "version.manifest";
const PackagedVersionManifest = "assets/version.manifest";

@ccclass('Main')
export class Main extends Component {
    dafaultPanel: Node = null;
    downloadLayer: Node = null;
    loadingLayer: Node = null;
    downloadBtn: Node = null;
    quitBtn: Node = null;
    progressBar: Sprite = null;
    progressLabel: Label = null;

    timeStep: number = 0.05;
    progressVal: number = 0;
    finished: boolean = false;

    protected onLoad(): void {
        this.dafaultPanel = this.node.getChildByName("DefaultPanel");
        this.downloadLayer = this.dafaultPanel.getChildByName("download");
        this.loadingLayer = this.dafaultPanel.getChildByName("loading");

        this.downloadBtn = this.downloadLayer.getChildByName("download");
        this.quitBtn = this.downloadLayer.getChildByName("quit");

        this.progressBar = this.loadingLayer.getChildByName("Bar").getComponent(Sprite);
        this.progressLabel = this.loadingLayer.getChildByName("Label").getComponent(Label);

        this.downloadBtn.on(Node.EventType.TOUCH_END, null);
        this.quitBtn.on(Node.EventType.TOUCH_END, this.initGame.bind(this));
    }

    protected start(): void {
        const isApp = sys.platform == sys.Platform.ANDROID || sys.platform == sys.Platform.IOS;
        console.log("sys.platform ====>", sys.platform);
        globalThis.RemoteMD5 = {};
        isApp && this.getAppVersion();
        isApp || this.initGame();
    }

    initGame() {
        this.downloadLayer.active = false;
        this.loadingLayer.active = true;
        this.progressBar.fillRange = 0;
        this.progressLabel.string = "0%";
        this.progressVal = 0;
        this.timeStep = 0.05;
        this.finished = false;

        const bundleName = "Common";
        let bundleUrl = bundleName;
        if (globalThis.RemoteMD5[bundleName] && globalThis.RemoteMD5[bundleName].length > 0) {
            const platform = sys.platform.toLowerCase();
            bundleUrl = `${assetManager.downloader.remoteServerAddress}${platform}/${globalThis.RemoteMD5[bundleName]}`;
        }
        assetManager.loadBundle(bundleUrl, (err, bundle) => {
            if (err) {
                return console.error(err);
            }
            this.finished = true;
            this.timeStep = 0.3;
        });
    }

    getAppVersion() {
        let url = assetManager.downloader.remoteServerAddress + VersionManifest;
        url += `?t=${Date.now()}`;
        console.log("getVersion ===>", url);

        this.file(url, (res) => {
            const json = JSON.parse(res);
            console.log("<-------------- getVersion -------------->");
            console.log(res);
            console.log(json.android);
            console.log(json.ios);
            sys.platform == sys.Platform.ANDROID && this.getBundleConfig(json.android);
            sys.platform == sys.Platform.IOS && this.getBundleConfig(json.ios);
        });
    }

    private ArrayBufferToString(_data: ArrayBuffer): string {
        const uint8Array = new Uint8Array(_data)
        const decoder = new TextDecoder('utf-8')
        return decoder.decode(uint8Array)
    }

    // 读文件之前,文件一定存在
    private ReadStringFromFile(filePath: string): string {
        const fileArrayBuffer = native.fileUtils.getDataFromFile(filePath)
        return this.ArrayBufferToString(fileArrayBuffer)
    }

    getBundleConfig(version: string) {
        const platform = sys.platform.toLowerCase();
        const url = `${assetManager.downloader.remoteServerAddress}${platform}/${version}.manifest`;
        console.log("getBundleConfig ===>", url);

        this.file(url, (res) => {
            const json = JSON.parse(res);
            this.versionContrast(json);
        });
    }

    versionContrast(json) {
        const fullPath = native.fileUtils.fullPathForFilename(PackagedVersionManifest);
        console.log("fullPath =====>", fullPath);

        if (!fullPath) {
            console.error("Packaged version manifest was not found:", PackagedVersionManifest);
            return;
        }

        const pkgStrData = this.ReadStringFromFile(fullPath);
        console.log("pkgStrData =====>", pkgStrData);
        const pkgJsonData = JSON.parse(pkgStrData)
        Object.keys(json.bundles).forEach(key => {
            globalThis.RemoteMD5[key] = json.bundles[key];
        })
        if (pkgJsonData.version != json.version) {
            this.downloadLayer.active = true;
            return;
        }
        this.initGame();
    }

    file(url, sCb) {
        fetch(url, {
            cache: 'no-store',
            headers: {
                'Cache-Control': 'no-cache, no-store, max-age=0',
                'Pragma': 'no-cache',
                'Expires': '0',
            },
        }).then(response => {
            if (response.ok) {
                response.text().then(data => {
                    sCb && sCb(data);
                })
            } else {
                console.error("FILE ERROR ==>", url);
            }
        }).catch(error => {
            console.error("FILE ERROR ==>", url);
            console.error(error);
        })
    }

    protected update(dt: number): void {
        if (this.progressVal < 1) {
            this.progressVal += dt * this.timeStep;
            this.progressBar.fillRange = this.progressVal;
            this.progressLabel.string = `${~~(this.progressVal * 100)}%`;
        }
        if (this.finished && this.progressVal >= 1) {
            this.finished = false;
            this.node.addComponent("GameController");

            this.dafaultPanel.destroy();
            this.destroy();
        }
    }
}
