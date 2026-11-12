import { AudioClip, Component, js } from "cc";
import SingletonFactory, { Autowired } from "../Util/SingletonFactory";
import LocallyData from "../data/LocallyData";
import ProxyData from "../data/ProxyData";
import AudioManager from "../Util/AudioManager";

export abstract class UIBase extends Component {
    @Autowired(LocallyData)
    private locallyData: LocallyData = null;
    @Autowired(AudioManager)
    private audioManager: AudioManager = null;

    onMount(): void { };
    onInit(...params: any[]): void { };
    onShow(): void { };
    onHide(): void { };
    onCreated(): void { };

    getInst<T>(classType: { new(): T }): T {
        return SingletonFactory.getInst(classType);
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

    getInt(key: string): number {
        return this.locallyData.getInt(key);
    }

    setInt(key: string, value: number): void {
        this.locallyData.setInt(key, value);
    }

    getChars(key: string): string {
        return this.locallyData.getChars(key);
    }

    setChars(key: string, value: string): void {
        this.locallyData.setChars(key, value);
    }

    getBool(key: string): boolean {
        return this.locallyData.getBool(key);
    }

    setBool(key: string, value: boolean): void {
        this.locallyData.setBool(key, value);
    }

    getObj(key: string): any {
        return this.locallyData.getObj(key);
    }

    setObj(key: string, value: any): void {
        this.locallyData.setObj(key, value);
    }

    remove(key: string): void {
        this.locallyData.remove(key);
    }

    clear(): void {
        this.locallyData.clear();
    }

    public playAudio(clipOrPath: AudioClip): void;
    public playAudio(clipOrPath: string): void;
    public playAudio(clipOrPath: string, bundleName: string): void;
    public playAudio(clipOrPath: AudioClip | string, bundleName: string = ""): void {
        if (typeof clipOrPath != "string") {
            this.audioManager.playAudio(clipOrPath);
            return;
        }
        this.audioManager.playAudio(clipOrPath, bundleName);
    }

    public playBgm(clipOrPath: AudioClip): void;
    public playBgm(clipOrPath: string): void;
    public playBgm(clipOrPath: string, bundleName: string): void;
    public playBgm(clipOrPath: AudioClip | string, bundleName: string = ""): void {
        if (typeof clipOrPath != "string") {
            this.audioManager.playBgm(clipOrPath);
            return;
        }
        this.audioManager.playBgm(clipOrPath, bundleName);
    }

    pauseBgm(): void {
        this.audioManager.pauseBgm();
    }

    public resumeBgm(): void {
        this.audioManager.resumeBgm();
    }

    public stopBgm(): void {
        this.audioManager.stopBgm();
    }

    public setBgmVolume(volume: number): void {
        this.audioManager.setBgmVolume(volume);
    }

    public setBgmEnabled(enabled: boolean): void {
        this.audioManager.setBgmEnabled(enabled);
    }

    public isBgmEnabled(): boolean {
        return this.audioManager.isBgmEnabled();
    }

    public playSfx(clipOrPath: AudioClip): void;
    public playSfx(clipOrPath: string): void;
    public playSfx(clipOrPath: string, bundleName: string): void;
    public playSfx(clipOrPath: AudioClip | string, bundleName: string = ""): void {
        if (typeof clipOrPath != "string") {
            this.audioManager.playSfx(clipOrPath);
            return;
        }
        this.audioManager.playSfx(clipOrPath, bundleName);
    }

    public setSfxVolume(volume: number): void {
        this.audioManager.setSfxVolume(volume);
    }


    public setSfxEnabled(enabled: boolean): void {
        this.audioManager.setSfxEnabled(enabled);
    }

    public isSfxEnabled(): boolean {
        return this.audioManager.isSfxEnabled();
    }


    public setAllMuted(muted: boolean): void {
        this.audioManager.setAllMuted(muted);
    }
}