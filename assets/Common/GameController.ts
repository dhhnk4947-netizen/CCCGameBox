import { _decorator, Component, Node, sys } from 'cc';
import { MainMapper } from './Tea/decorators/tea.decorators';
import UIPage from './Tea/UI/UIPage';
import { Autowired } from './Tea/Util/SingletonFactory';
import { ViewName } from './tools/Tools';
const { ccclass, property } = _decorator;

@ccclass('GameController')
@MainMapper({ bundleName: "Hall", uiPath: 'prefabs/view/', maxPage: 5, maxFullPage: 5, maxPopPage: 8 })
export class GameController extends Component {
    @Autowired(UIPage)
    uiPage: UIPage = null;
    mask: Node = null;
    protected start(): void {
        this.mask = this.node.getChildByName('mask');
        TEA_DEBUG = true;
        this.initGame();
    }

    initGame() {
        this.uiPage.init(this.GameStart.bind(this));
    }
    private GameStart() {
        this.mask.setSiblingIndex(999);
        ResetTo(ViewName.HallView);
    }
}