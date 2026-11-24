
import { native, sys } from 'cc';

export class NativeBridge {
    public static get isNative(): boolean {
        return this.isAndroid || this.isIOS;
    }

    public static get isAndroid(): boolean {
        return sys.isNative && sys.os === sys.OS.ANDROID;
    }

    public static get isIOS(): boolean {
        return sys.isNative && sys.os === sys.OS.IOS;
    }

    public static setLandscape(): void {
        if (this.isNative) {
            native.jsbBridgeWrapper.dispatchEventToNative("setLandscape");
        }
    }

    public static setPortrait(): void {
        if (this.isNative) {
            native.jsbBridgeWrapper.dispatchEventToNative("setPortrait");
        }
    }
}
