import { _decorator, Label, Node } from 'cc';
import { Path } from 'db://assets/Common/Tea/decorators/tea.decorators';
import { TBundleName, PopView } from 'db://assets/Common/Tea/UI/UIView';
import EventManager from 'db://assets/Common/Tea/Util/EventManager';
import { Autowired } from 'db://assets/Common/Tea/Util/SingletonFactory';
import { T2048GlobalContext } from '../T2048GlobalContext';
const { ccclass, property } = _decorator;

@ccclass('T2048SettlementView')
@TBundleName("T2048")
export class T2048SettlementView extends PopView {
    @Path("quitBtn")
    quitBtn: Node = null;
    @Path("restartBtn")
    restartBtn: Node = null;
    @Path("currRecord/val")
    currRecordLabel: Label = null;
    @Path("maxRecord/val")
    maxRecordLabel: Label = null;

    @Autowired(EventManager)
    eventManager: EventManager = null;

    onMount(): void {
        this.quitBtn.on(Node.EventType.TOUCH_END, this.onClickQuitBtn.bind(this));
        this.restartBtn.on(Node.EventType.TOUCH_END, this.onClickRestarBtn.bind(this));
    }

    onInit(currRecord: number, maxRecoed: number): void {
        this.currRecordLabel.string = `${currRecord}`;
        this.maxRecordLabel.string = `${maxRecoed}`;
    }

    onClickQuitBtn(e) {
        this.hide();
        stopGame();
    }

    onClickRestarBtn(e) {
        this.eventManager.trigger(T2048GlobalContext.EventMsg.RESTART_GAME);
        this.hide();
    }
}

