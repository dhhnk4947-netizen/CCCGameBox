import { _decorator, Component, macro, Node, sys } from 'cc';
import { MainMapper } from './Tea/decorators/tea.decorators';
import UIPage from './Tea/UI/UIPage';
import { Autowired } from './Tea/Util/SingletonFactory';
import { ViewName } from './tools/Tools';
import AudioManager from './Tea/Util/AudioManager';
import { LoadingView } from './scripts/view/LoadingView';
import { MainScreen } from './Tea/UI/GameMapper';
const { ccclass, property } = _decorator;

@ccclass('GameController')
@MainScreen(macro.ORIENTATION_PORTRAIT)
@MainMapper({ bundleName: "Hall", uiPath: 'prefabs/view/', maxPage: 5, maxFullPage: 5, maxPopPage: 8 })
export class GameController extends Component {
    @Autowired(UIPage)
    uiPage: UIPage = null;
    @Autowired(AudioManager)
    audioManager: AudioManager = null;
    mask: Node = null;
    protected start(): void {
        this.mask = this.node.getChildByName('mask');
        TEA_DEBUG = true;
        this.audioManager.init(this.node);
        this.initGame();
    }

    initGame() {
        this.uiPage.initLoading(LoadingView);
        this.uiPage.init(this.GameStart.bind(this));
    }
    private GameStart() {
        this.mask.setSiblingIndex(999);
        ResetTo(ViewName.HallView);
    }
}