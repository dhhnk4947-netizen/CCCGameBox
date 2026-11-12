import { _decorator, assetManager, AudioClip, easing, game, Mask, Node, Quat, size, tween, Tween, UITransform } from 'cc';
import { Path } from '../../../Common/Tea/decorators/tea.decorators';
import UIPage from '../../../Common/Tea/UI/UIPage';
import { TBundleName, FullView, onMount } from '../../../Common/Tea/UI/UIView';
import { Autowired } from '../../../Common/Tea/Util/SingletonFactory';
import { GameListView } from './GameListView';
import TAssetManager from '../../../Common/Tea/Util/TAssetManager';
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

    @Autowired(UIPage)
    uiPage: UIPage = null;

    @onMount
    mount() {
        this.openListBtn.on(Node.EventType.TOUCH_END, this.onClickOpenListBtn.bind(this));
        this.quitBtn.on(Node.EventType.TOUCH_END, this.onClickQuitBtn.bind(this));
        this.helpBtn.on(Node.EventType.TOUCH_END, this.onClickHelpBtn.bind(this));
        this.settingBtn.on(Node.EventType.TOUCH_END, this.onClickSettingBtn.bind(this));
    
        this.uiPage.registerStopGameCb(()=>{
            HallView.resetTo();
        })
    }

    onShow() {
        this.titleStartAnim();
    }

    onHide() {
        this.titleStopAnim();
    }

    onClickOpenListBtn() {
        GameListView.resetTo();
    }

    onClickQuitBtn() {
        game.end();
    }

    onClickSettingBtn() {
        // const url = `${assetManager.downloader.remoteServerAddress}resources/JPS_AUDIOS/${"JPS00001_31_1"}.mp3`
        // TAssetManager.loadRemote<AudioClip>(url, (err, clip)=>{
        //     if(err){
        //         ERROR(err)
        //         return;
        //     }
        //     this.playAudio(clip);
        // })
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