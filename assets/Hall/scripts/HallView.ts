import { _decorator, easing, game, Mask, Node, Quat, size, tween, Tween, UITransform } from 'cc';
import { Path } from '../../Common/Tea/decorators/tea.decorators';
import { TBundleName, FullView, onMount } from '../../Common/Tea/UI/UIView';
const { ccclass, property } = _decorator;

@ccclass('HallView')
@TBundleName("Hall")
export class HallView extends FullView {
    @Path('titleBase/title')
    titleNode: Node = null;
    @Path('btns/OpenListBtn')
    openListBtn: Node = null;
    @Path('btns/QuitBtn')
    quitBtn: Node = null;
    @Path('btns/HelpBtn')
    helpBtn: Node = null;
    @Path('btns/SettingBtn')
    settingBtn: Node = null;
    @Path('loading/Mask', UITransform)
    animNode: UITransform = null;
    @Path('loading/Mask', Mask)
    animMask: Mask = null;
    @Path('loading')
    loading: Node = null;
    @Path('btns/HelpBtn')
    @onMount
    mount() {
        this.openListBtn.on(Node.EventType.TOUCH_END, this.onClickOpenListBtn.bind(this));
        this.quitBtn.on(Node.EventType.TOUCH_END, this.onClickQuitBtn.bind(this));
        this.helpBtn.on(Node.EventType.TOUCH_END, this.onClickHelpBtn.bind(this));
        this.settingBtn.on(Node.EventType.TOUCH_END, this.onClickSettingBtn.bind(this));
    }

    onShow() {
        this.titleStartAnim();
    }

    onHide() {
        this.titleStopAnim();
    }

    onClickOpenListBtn() {
        startGame("T2048");
    }

    onClickQuitBtn() {
        game.end();
    }

    onClickSettingBtn() {
    }

    onClickHelpBtn() {
    }

    titleStartAnim() {
        Tween.stopAllByTarget(this.titleNode);
        const rotationStart = Quat.fromEuler(new Quat(), 40, 6, 0);
        const rotationEnd = Quat.fromEuler(new Quat(), 0, 0, 0);
        let t = tween(this.titleNode)
            .to(1.5, { rotation: rotationStart }, { easing: easing.bounceOut })
            .to(2, { rotation: rotationEnd }, { easing: easing.bounceIn })
            .delay(0.5)

        tween(this.titleNode)
            .set({ rotation: rotationEnd })
            .repeatForever(t)
            .start();
    }

    titleStopAnim() {
        Tween.stopAllByTarget(this.titleNode);
        const rotation = Quat.fromEuler(new Quat(), 0, 0, 0);
        tween(this.titleNode)
            .set({ rotation: rotation })
            .start();
    }
}

interface ttt {
    a: string;
    b: string;
}


interface ttt {
    c: string;
    d: string;
}