import { _decorator, Node } from 'cc';
import { Path } from '../../Common/Tea/decorators/tea.decorators';
import GameItem, { GameMapper } from '../../Common/Tea/UI/GameItem';
const { ccclass, property } = _decorator;

@ccclass('JapenStudent')
@GameMapper('JapenStudent', 'main')
export class JapenStudent extends GameItem {
    @Path("quitBtn")
    quitBtn: Node = null;

    onShow(): void { }

    onHide(): void { }

    onMount(): void {
        this.quitBtn.on(Node.EventType.TOUCH_END, this.onClickQuitBtn.bind(this));
    }

    onInit(...params: any[]): void { }

    onClickQuitBtn(e){
        stopGame();
    }
}