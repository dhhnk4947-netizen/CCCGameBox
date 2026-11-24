import { _decorator, easing, Node, tween, Tween } from 'cc';
import GameItem from '../../Common/Tea/UI/GameItem';
import { Path } from '../../Common/Tea/decorators/tea.decorators';
import { GameMapper } from '../../Common/Tea/UI/GameMapper';
import { SCREEN_TYPE } from '../../Common/Tea/UI/UIPage';
const { ccclass, property } = _decorator;

@ccclass('TreasureHunter')
@GameMapper('TreasureHunter', 'main', SCREEN_TYPE.LANDSCAPE)
export class TreasureHunter extends GameItem {
    @Path("quitBtn")
    quitBtn: Node = null;
    @Path("gamePanel/player/rope")
    rope: Node = null;

    onMount(): void {
        this.quitBtn.on(Node.EventType.TOUCH_END, this.onClickQuitBtn, this);
    }

    onInitRope() {
        Tween.stopAllByTarget(this.rope);
        let t1 = tween(this.rope)
            .to(2.5, { angle: 70 })
            .to(2.5, { angle: -70 })
        tween(this.rope)
            .set({ angle: -70 })
            .repeatForever(t1)
            .start();
    }

    onShow(): void {
        this.onInitRope();
    }

    onHide(): void {
    }

    onClickQuitBtn(e) {
        stopGame();
    }
}