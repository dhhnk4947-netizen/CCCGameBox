import { _decorator, assetManager, AudioClip, AudioSource, Node } from 'cc';
import { Autowired, Singleton } from "./SingletonFactory";
import LocallyData from '../data/LocallyData';
import TAssetManager from './TAssetManager';
import LRU from './LRU';
const { ccclass, property } = _decorator;


const AudioConfigKey = "AUDIO_CONFIG_KEY";

interface AudioConfig {
    bgmVolume: number,
    sfxVolume: number,
    isBgmEnabled: boolean,
    isSfxEnabled: boolean,
    isMute: boolean
}

@Singleton()
export default class AudioManager {
    @Autowired(TAssetManager)
    assetManager: TAssetManager = null;
    @Autowired(LocallyData)
    locallyData: LocallyData = null;

    private _sfxCache: {[key: string] : AudioClip} = {};
    private _sfxCacheSize: number = 0;
    private _sfxLru: LRU<string> = null;

    private _bgmVolume: number = 1.0;
    private _sfxVolume: number = 1.0;
    private _isBgmEnabled: boolean = true;
    private _isSfxEnabled: boolean = true;
    private _isMute: boolean = false;

    private _audioSource: AudioSource = null;

    public init(rootNode: Node, sfxCacheSize: number = 20): void {
        this._audioSource = rootNode.getComponent(AudioSource);
        !this._audioSource && (this._audioSource = rootNode.addComponent(AudioSource));

        this._sfxCacheSize = sfxCacheSize;
        this._sfxLru = new LRU<string>(this._sfxCacheSize, this.lruDeleteFunc.bind(this));

        this.loadSettings();
    }

    private get bgmVolume(): number {
        return this._isMute ? 0 : this._bgmVolume;
    }

    private get sfxVolume(): number {
        return this._isMute ? 0 : this._sfxVolume;
    }


    public playAudio(clipOrPath: AudioClip): void;
    public playAudio(clipOrPath: string): void;
    public playAudio(clipOrPath: string, bundleName: string): void;
    public playAudio(clipOrPath: AudioClip | string, bundleName: string = ""): void {
        this.playMusic(clipOrPath, bundleName, false);
    }

    public playBgm(clipOrPath: AudioClip): void;
    public playBgm(clipOrPath: string): void;
    public playBgm(clipOrPath: string, bundleName: string): void;
    public playBgm(clipOrPath: AudioClip | string, bundleName: string = ""): void {
        this.playMusic(clipOrPath, bundleName, true);
    }

    public pauseBgm(): void {
        this._audioSource.pause();
    }

    public resumeBgm(): void {
        this._audioSource.play();
    }

    public stopBgm(): void {
        this._audioSource.stop();
    }

    public setBgmVolume(volume: number): void {
        this._bgmVolume = volume;
        this._audioSource.volume = this.bgmVolume;
        this.saveSettings();
    }

    public setBgmEnabled(enabled: boolean): void {
        this._isBgmEnabled = enabled;
        this.saveSettings();
    }

    public isBgmEnabled(): boolean {
        return this._isBgmEnabled;
    }

    public playSfx(clipOrPath: AudioClip): void;
    public playSfx(clipOrPath: string): void;
    public playSfx(clipOrPath: string, bundleName: string): void;
    public playSfx(clipOrPath: AudioClip | string, bundleName: string = ""): void {
        if (this._isMute) return;
        if (typeof clipOrPath != "string") {
            this._sfxCache[clipOrPath.name] = clipOrPath;
            this._sfxLru.put(clipOrPath.name, clipOrPath.name);
            this._audioSource.playOneShot(clipOrPath, this.sfxVolume);
            return;
        }
        let playSource = (clip: AudioClip) => {
            this._sfxCache[clipOrPath] = clip;
            this._sfxLru.put(clipOrPath, clipOrPath);
            this._audioSource.playOneShot(clip, this.sfxVolume);
        }
        let loadRemote = () => {
            const url = `${assetManager.downloader.remoteServerAddress}resources/${clipOrPath}`;
            TAssetManager.loadRemote<AudioClip>(url, (error, asset) => {
                if (!error) {
                    playSource(asset as AudioClip);
                    return;
                }
                ERROR("playSfx ERROR ===>", bundleName, clipOrPath);
            })
        }
        TAssetManager.load(clipOrPath, bundleName, AudioClip, (error, asset) => {
            if (!error) {
                playSource(asset as AudioClip);
                return;
            }
            if (bundleName.length > 0) {
                ERROR("playSfx ERROR ===>", bundleName, clipOrPath);
            }
            loadRemote();
        })
    }

    public setSfxVolume(volume: number): void {
        this._sfxVolume = volume;
        this.saveSettings();
    }


    public setSfxEnabled(enabled: boolean): void {
        this._isSfxEnabled = enabled;
        this.saveSettings();
    }

    public isSfxEnabled(): boolean {
        return this._isSfxEnabled;
    }


    public setAllMuted(muted: boolean): void {
        this._isMute = muted;
        this.saveSettings();
        if (muted) {
            this._audioSource.volume = 0;
        }
    }

    private playMusic(clipOrPath: AudioClip | string, bundleName: string, isLoop: boolean): void {
        let playSource = (clip: AudioClip) => {
            this._audioSource.clip = clip;
            this._audioSource.loop = isLoop;
            this._audioSource.volume = this.bgmVolume;
            this._audioSource.play();
        }
        this._audioSource.stop();
        this._audioSource.clip = null;

        let loadRemote = () => {
            const url = `${assetManager.downloader.remoteServerAddress}resources/${clipOrPath}`;
            TAssetManager.loadRemote<AudioClip>(url, (error, asset) => {
                if (!error) {
                    playSource(asset as AudioClip);
                    return;
                }
                ERROR("playMusic ERROR ===>", bundleName, clipOrPath);
            })
        }
        this._audioSource.stop();
        this._audioSource.clip = null;
        if (typeof clipOrPath != "string") {
            playSource(clipOrPath);
            return;
        }

        TAssetManager.load(clipOrPath, bundleName, AudioClip, (error, asset) => {
            if (!error) {
                playSource(asset as AudioClip);
                return;
            }
            if (bundleName.length > 0) {
                ERROR("playMusic ERROR ===>", bundleName, clipOrPath);
            }
            loadRemote();
        })
    }

    private saveSettings(): void {
        const audioConfig: AudioConfig = {
            bgmVolume: this._bgmVolume,
            isBgmEnabled: this._isBgmEnabled,
            isMute: this._isMute,
            isSfxEnabled: this._isSfxEnabled,
            sfxVolume: this._sfxVolume
        }
        this.locallyData.setObj(AudioConfigKey, audioConfig);
    }

    private loadSettings(): void {
        const audioConfig = this.locallyData.getObj(AudioConfigKey) as AudioConfig;
        this._bgmVolume = audioConfig.bgmVolume || 1;
        this._isBgmEnabled = audioConfig.isBgmEnabled ?? true;
        this._isMute = audioConfig.isMute ?? false;
        this._isSfxEnabled = audioConfig.isSfxEnabled ?? true;
        this._sfxVolume = audioConfig.sfxVolume || 1;
    }

    private lruDeleteFunc(key: string){
        this._sfxCache[key] = null;
        delete this._sfxCache[key];
    }
}