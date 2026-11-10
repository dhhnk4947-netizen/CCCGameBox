import { Asset, AssetManager, assetManager, resources, sys } from "cc";

// const bundleMD5Key = "LOCAL_BUNDLE_MD5_KEY";
export default class TAssetManager {
    private static bundleCanche: { [key: string]: AssetManager.Bundle } = {};
    // private static _localBundleMD5: { [key: string]: string } = null;
    // private static get localBundleMD5(){
    //     if(this._localBundleMD5 == null){
    //         const bundleStorage = localStorage.getItem(bundleMD5Key);
    //         this._localBundleMD5 = bundleStorage ? JSON.parse(bundleStorage) : {};
    //     }
    //     return this._localBundleMD5;
    // }

    // static setRemoteMD5(md5: string){
    //     if(!md5 && md5.length == 0){
    //         return;
    //     }
    //     const config = JSON.parse(md5);
    //     this.remoteBundleMD5 = config.bundles;
    //     console.log("setRemoteMD5 ====>", md5);
    // }

    static load(path: string, abPackage: string, type: typeof Asset, onProgress: ((finish: number, total: number, item: AssetManager.RequestItem) => void), onComplete: (error: Error, assets: Asset) => void): void
    static load(path: string, abPackage: string, onProgress: ((finish: number, total: number, item: AssetManager.RequestItem) => void), onComplete: (error: Error, assets: Asset) => void): void
    static load(path: string, abPackage: string, onComplete: (error: Error, assets: Asset) => void): void
    static load(path: string, abPackage: string, type: typeof Asset, onComplete: (error: Error, assets: Asset) => void): void

    static load(path: string, type: typeof Asset, onProgress: ((finish: number, total: number, item: AssetManager.RequestItem) => void), onComplete: (error: Error, assets: Asset) => void): void
    static load(path: string, onProgress: ((finish: number, total: number, item: AssetManager.RequestItem) => void), onComplete: (error: Error, assets: Asset) => void): void
    static load(path: string, onComplete: (error: Error, assets: Asset) => void): void
    static load(path: string, type: typeof Asset, onComplete: (error: Error, assets: Asset) => void): void


    static load(
        path: string,
        abPackage?: string | typeof Asset | ((finish: number, total: number, item: AssetManager.RequestItem) => void) | ((error: Error, assets: Asset) => void),
        type?: typeof Asset | ((finish: number, total: number, item: AssetManager.RequestItem) => void) | ((error: Error, assets: Asset) => void),
        onProgress?: ((finish: number, total: number, item: AssetManager.RequestItem) => void) | ((error: Error, assets: Asset) => void),
        onComplete?: (error: Error, assets: Asset) => void
    ) {
        let params: Tea.ResParams = {
            path: path
        }

        if (type) {
            if (type.length === 3) {
                params.onProgress = type as (finish: number, total: number, item: AssetManager.RequestItem) => void;
                params.onComplete = onProgress as (error: Error, assets: Asset) => void;
                if (typeof abPackage === 'string') {
                    params.abPackage = abPackage;
                } else {
                    params.type = abPackage as typeof Asset;
                }
            } else if (type.length === 2) {
                params.onComplete = type as (error: Error, assets: Asset) => void;
                switch (typeof abPackage) {
                    case 'function':
                        if (abPackage.length === 3) {
                            params.onProgress = abPackage as (finish: number, total: number, item: AssetManager.RequestItem) => void;
                        } else {
                            params.type = abPackage as typeof Asset;
                        }
                        break;
                    case 'string':
                        params.abPackage = abPackage as string;
                        break;
                }
            } else {
                params.abPackage = abPackage as string;
                params.type = type as typeof Asset;
                if (onComplete) {
                    params.onProgress = onProgress as (finish: number, total: number, item: AssetManager.RequestItem) => void;
                    params.onComplete = onComplete;
                } else {
                    params.onComplete = onProgress as (error: Error, assets: Asset) => void;
                }
            }
        } else {
            params.onComplete = abPackage as (error: Error, assets: Asset) => void;
        }


        params.type = params.type ?? Asset;
        if (!params.onProgress)
            params.onProgress = (finish: number, total: number, item: AssetManager.RequestItem) => { };

        if (!params.abPackage || params.abPackage.length == 0) {
            resources.load(params.path, params.type, params.onProgress, params.onComplete);
            return;
        }

        if (params.abPackage in this.bundleCanche) {
            const bundle: AssetManager.Bundle = this.bundleCanche[params.abPackage];
            bundle.load(params.path, params.type, params.onProgress, params.onComplete);
            return;
        }

        this.loadBundle(params.abPackage, (bundle: AssetManager.Bundle) => {
            bundle.load(params.path, params.type, params.onProgress, params.onComplete);
        }, (err: Error, res) => {
            params.onComplete(err, res);
        });
    }

    static preLoad(paths: string | string[], abPackage: string, type: typeof Asset, onProgress: (finish: number, total: number, item: AssetManager.RequestItem) => void, onComplete: (error: Error, items: AssetManager.RequestItem[]) => void): void;
    static preLoad(paths: string | string[], abPackage: string, onProgress: (finish: number, total: number, item: AssetManager.RequestItem) => void, onComplete: (error: Error, items: AssetManager.RequestItem[]) => void): void;
    static preLoad(paths: string | string[], abPackage: string, onComplete: (error: Error, items: AssetManager.RequestItem[]) => void): void;
    static preLoad(paths: string | string[], abPackage: string, type: typeof Asset, onComplete: (error: Error, items: AssetManager.RequestItem[]) => void): void;

    static preLoad(paths: string | string[], type: typeof Asset, onProgress: (finish: number, total: number, item: AssetManager.RequestItem) => void, onComplete: (error: Error, items: AssetManager.RequestItem[]) => void): void;
    static preLoad(paths: string | string[], onProgress: (finish: number, total: number, item: AssetManager.RequestItem) => void, onComplete: (error: Error, items: AssetManager.RequestItem[]) => void): void;
    static preLoad(paths: string | string[], onComplete: (error: Error, items: AssetManager.RequestItem[]) => void): void;
    static preLoad(paths: string | string[], type: typeof Asset, onComplete: (error: Error, items: AssetManager.RequestItem[]) => void): void;

    static preLoad(
        paths: string | string[],
        abPackage?: string | typeof Asset | ((finish: number, total: number, item: AssetManager.RequestItem) => void) | ((error: Error, items: AssetManager.RequestItem[]) => void),
        type?: typeof Asset | ((finish: number, total: number, item: AssetManager.RequestItem) => void) | ((error: Error, items: AssetManager.RequestItem[]) => void),
        onProgress?: ((finish: number, total: number, item: AssetManager.RequestItem) => void) | ((error: Error, items: AssetManager.RequestItem[]) => void),
        onComplete?: (error: Error, items: AssetManager.RequestItem[]) => void
    ) {
        const params: Tea.PreResParams = {
            paths: paths
        };

        if (type) {
            if (type.length === 3) {
                params.onProgress = type as (finish: number, total: number, item: AssetManager.RequestItem) => void;
                params.onComplete = onProgress as (error: Error, items: AssetManager.RequestItem[]) => void;
                if (typeof abPackage === 'string') {
                    params.abPackage = abPackage;
                } else {
                    params.type = abPackage as typeof Asset;
                }
            } else if (type.length === 2) {
                params.onComplete = type as (error: Error, items: AssetManager.RequestItem[]) => void;
                switch (typeof abPackage) {
                    case 'function':
                        if (abPackage.length === 3) {
                            params.onProgress = abPackage as (finish: number, total: number, item: AssetManager.RequestItem) => void;
                        } else {
                            params.type = abPackage as typeof Asset;
                        }
                        break;
                    case 'string':
                        params.abPackage = abPackage as string;
                        break;
                }
            } else {
                params.abPackage = abPackage as string;
                params.type = type as typeof Asset;
                if (onComplete) {
                    params.onProgress = onProgress as (finish: number, total: number, item: AssetManager.RequestItem) => void;
                    params.onComplete = onComplete;
                } else {
                    params.onComplete = onProgress as (error: Error, items: AssetManager.RequestItem[]) => void;
                }
            }
        } else {
            params.onComplete = abPackage as (error: Error, items: AssetManager.RequestItem[]) => void;
        }

        params.type = params.type ?? Asset;
        if (!params.onProgress) {
            params.onProgress = (finish: number, total: number, item: AssetManager.RequestItem) => { };
        }

        if (!params.abPackage) {
            resources.preload(params.paths, params.type, params.onProgress, params.onComplete);
            return;
        }

        if (params.abPackage in this.bundleCanche) {
            const bundle: AssetManager.Bundle = this.bundleCanche[params.abPackage];
            bundle.preload(params.paths, params.type, params.onProgress, params.onComplete);
            return;
        }

        this.loadBundle(params.abPackage, (bundle: AssetManager.Bundle) => {
            bundle.preload(params.paths, params.type, params.onProgress, params.onComplete);
        }, (error: Error, assets: AssetManager.RequestItem[]) => {
            params.onComplete(error, assets);
        });
    }

    static releaseAll(abPackage: string | AssetManager.Bundle){
        if(abPackage instanceof AssetManager.Bundle){
            abPackage.releaseAll();
            return;
        }

        if (!(abPackage in this.bundleCanche))
            return;

        const bundle: AssetManager.Bundle = this.bundleCanche[abPackage];
        bundle.releaseAll();
    }

    static removeBundle(abPackage: string | AssetManager.Bundle) {
        if(abPackage instanceof AssetManager.Bundle){
            abPackage.releaseAll();
            assetManager.removeBundle(abPackage);
            return;
        }

        if (!(abPackage in this.bundleCanche))
            return;

        const bundle: AssetManager.Bundle = this.bundleCanche[abPackage];
        this.releaseAll(bundle);
        assetManager.removeBundle(bundle);
        delete this.bundleCanche[abPackage];
    }

    static release(path: string, abPackage: string, type: typeof Asset): void;
    static release(path: string, abPackage: string): void;
    static release(path: string, type: typeof Asset): void;
    static release(path: string): void;

    static release(
        path: string,
        abPackage?: string | typeof Asset,
        type?: typeof Asset
    ) {
        const params: Tea.ReleaseParams = {
            path: path,
            type: Asset
        };

        if (typeof abPackage === 'string') {
            params.abPackage = abPackage;
            if (type) {
                params.type = type;
            }
        } else if (abPackage) {
            params.type = abPackage;
        }

        if (!params.abPackage) {
            resources.release(params.path, params.type);
            return;
        }

        if (params.abPackage in this.bundleCanche) {
            const bundle: AssetManager.Bundle = this.bundleCanche[params.abPackage];
            bundle.release(params.path, params.type);
            return;
        }

        this.loadBundle(params.abPackage, (bundle: AssetManager.Bundle) => {
            bundle.release(params.path, params.type);
        });
    }

    static loadDir(path: string, abPackage: string, type: typeof Asset, onProgress: (finish: number, total: number, item: AssetManager.RequestItem) => void, onComplete: (error: Error, assets: Asset[]) => void): void;
    static loadDir(path: string, abPackage: string, onProgress: (finish: number, total: number, item: AssetManager.RequestItem) => void, onComplete: (error: Error, assets: Asset[]) => void): void;
    static loadDir(path: string, abPackage: string, onComplete: (error: Error, assets: Asset[]) => void): void;
    static loadDir(path: string, abPackage: string, type: typeof Asset, onComplete: (error: Error, assets: Asset[]) => void): void;

    static loadDir(path: string, type: typeof Asset, onProgress: (finish: number, total: number, item: AssetManager.RequestItem) => void, onComplete: (error: Error, assets: Asset[]) => void): void;
    static loadDir(path: string, onProgress: (finish: number, total: number, item: AssetManager.RequestItem) => void, onComplete: (error: Error, assets: Asset[]) => void): void;
    static loadDir(path: string, onComplete: (error: Error, assets: Asset[]) => void): void;
    static loadDir(path: string, type: typeof Asset, onComplete: (error: Error, assets: Asset[]) => void): void;

    static loadDir(
        path: string,
        abPackage?: string | typeof Asset | ((finish: number, total: number, item: AssetManager.RequestItem) => void) | ((error: Error, assets: Asset[]) => void),
        type?: typeof Asset | ((finish: number, total: number, item: AssetManager.RequestItem) => void) | ((error: Error, assets: Asset[]) => void),
        onProgress?: ((finish: number, total: number, item: AssetManager.RequestItem) => void) | ((error: Error, assets: Asset[]) => void),
        onComplete?: (error: Error, assets: Asset[]) => void
    ) {
        const params: Tea.ResDirParams = {
            path: path
        };

        if (type) {
            if (type.length === 3) {
                params.onProgress = type as (finish: number, total: number, item: AssetManager.RequestItem) => void;
                params.onComplete = onProgress as (error: Error, assets: Asset[]) => void;
                if (typeof abPackage === 'string') {
                    params.abPackage = abPackage;
                } else {
                    params.type = abPackage as typeof Asset;
                }
            } else if (type.length === 2) {
                params.onComplete = type as (error: Error, assets: Asset[]) => void;
                switch (typeof abPackage) {
                    case 'function':
                        if (abPackage.length === 3) {
                            params.onProgress = abPackage as (finish: number, total: number, item: AssetManager.RequestItem) => void;
                        } else {
                            params.type = abPackage as typeof Asset;
                        }
                        break;
                    case 'string':
                        params.abPackage = abPackage as string;
                        break;
                }
            } else {
                params.abPackage = abPackage as string;
                params.type = type as typeof Asset;
                if (onComplete) {
                    params.onProgress = onProgress as (finish: number, total: number, item: AssetManager.RequestItem) => void;
                    params.onComplete = onComplete;
                } else {
                    params.onComplete = onProgress as (error: Error, assets: Asset[]) => void;
                }
            }
        } else {
            params.onComplete = abPackage as (error: Error, assets: Asset[]) => void;
        }

        params.type = params.type ?? Asset;
        if (!params.onProgress) {
            params.onProgress = (finish: number, total: number, item: AssetManager.RequestItem) => { };
        }

        if (!params.abPackage) {
            resources.loadDir(params.path, params.type, params.onProgress, params.onComplete);
            return;
        }

        if (params.abPackage in this.bundleCanche) {
            const bundle: AssetManager.Bundle = this.bundleCanche[params.abPackage];
            bundle.loadDir(params.path, params.type, params.onProgress, params.onComplete);
            return;
        }

        this.loadBundle(params.abPackage, (bundle: AssetManager.Bundle) => {
            bundle.loadDir(params.path, params.type, params.onProgress, params.onComplete);
        }, (error: Error, assets: Asset[]) => {
            params.onComplete(error, assets);
        });
    }

    private static loadBundle(abPackage: string, succCb?: Function, failCb?: Function) {
        const platform = sys.platform.toLowerCase();
        const remoteBundleMD5 = globalThis.RemoteMD5 || {};
        const remoteBundle: string = remoteBundleMD5[abPackage] || "";
        const url = `${assetManager.downloader.remoteServerAddress}${platform}/${remoteBundle}`;
        const bundleStr = remoteBundle.length == 0 ? abPackage : url;
        
        assetManager.loadBundle(bundleStr, (err, bundle) => {
            if (err) {
                failCb && failCb(err, null);
                return;
            }

            this.bundleCanche[abPackage] = bundle;
            succCb && succCb(bundle)
        });
    }

    static getBundle(abPackage: string): Promise<AssetManager.Bundle> {
        return new Promise<AssetManager.Bundle>((resolve, reject) => {
            if (abPackage in this.bundleCanche) {
                resolve(this.bundleCanche[abPackage]);
                return;
            }
            this.loadBundle(abPackage, (bundle: AssetManager.Bundle) => {
                resolve(bundle);
            }, (error: Error, assets: Asset[]) => {
                reject(error);
            });
        })
    }

    static preLoadDir(paths: string[], abPackage: string, onComplete: (error: Error, items: Asset[]) => void);
    static preLoadDir(paths: string[], onComplete: (error: Error, items: Asset[]) => void);
    static preLoadDir(paths: string[], onProgress: (finish: number, total: number, item: AssetManager.RequestItem) => void, onComplete: (error: Error, items: Asset[]) => void);

    static preLoadDir(paths: string[], abPackage: string, onProgress: (finish: number, total: number, item: AssetManager.RequestItem) => void, onComplete: (error: Error, items: Asset[]) => void);
    static preLoadDir(
        paths: string[],
        abPackage: string | ((finish: number, total: number, item: AssetManager.RequestItem) => void) | ((error: Error, items: Asset[]) => void),
        onProgress?: ((finish: number, total: number, item: AssetManager.RequestItem) => void) | ((error: Error, items: Asset[]) => void),
        onComplete?: (error: Error, items: Asset[]) => void) {
        let params: Tea.PreResDirParams = {
            paths: paths
        }
        if (typeof abPackage === 'string') {
            params.abPackage = abPackage
        } else if (abPackage.length == 3) {
            params.onProgress = abPackage as (finish: number, total: number, item: AssetManager.RequestItem) => void;
        } else {
            params.onComplete = abPackage as (error: Error, items: Asset[]) => void;
        }
        if (onProgress && onProgress.length == 3) {
            params.onProgress = onProgress as (finish: number, total: number, item: AssetManager.RequestItem) => void;
        } else if (onProgress && onProgress.length == 2) {
            params.onComplete = onProgress as (error: Error, items: Asset[]) => void;
        }
        if (onComplete) {
            params.onComplete = onComplete;
        }

        if(!params.onProgress){
            params.onProgress = (finish: number, total: number, item: AssetManager.RequestItem) => { };
        }

        let finishs = new Array(params.paths.length).fill(0);
        let totals = new Array(params.paths.length).fill(0);
        let onProgressFunc = (index: number, finish: number, total: number, item: AssetManager.RequestItem) => {
            finishs[index] = finish;
            totals[index] = total;
            params.onProgress(finishs.reduce((a, b) => a + b), totals.reduce((a, b) => a + b), item);
        };

        params.paths.forEach((path, index) => {
            this.loadDir(path, params.abPackage, (finish: number, total: number, item: AssetManager.RequestItem) => {
                onProgressFunc(index, finish, total, item);
            }, params.onComplete);
        });
    }
}