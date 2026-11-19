import { _decorator, Node } from 'cc';
import GameItem, { GameMapper } from '../../Common/Tea/UI/GameItem';
import { Path } from '../../Common/Tea/decorators/tea.decorators';
const { ccclass, property } = _decorator;

@ccclass('TreasureHunter')
@GameMapper('TreasureHunter', 'main')
export class TreasureHunter extends GameItem {
    @Path("quitBtn")
    quitBtn: Node = null;

    onShow(): void {
    }

    onHide(): void {
    }

    onMount(): void {
    }
}
