import { _decorator, Component, Label, Node } from 'cc';
import GameItem, { GameMapper } from '../../Common/Tea/UI/GameItem';
import { Path } from '../../Common/Tea/decorators/tea.decorators';
const { ccclass, property } = _decorator;

@ccclass('T2048')
@GameMapper('T2048', 'T2048', 'main', 'prefabs/view')
export class T2048 extends GameItem {
    @Path("gamePanel/currRecord/recordLabel", Label)
    currRecordLabel: Label = null;
    @Path("gamePanel/maxRecord/recordLabel", Label)
    maxRecordLabel: Label = null;
    @Path("gamePanel/victoryGoal/recordLabel", Label)
    victoryGoalLabel: Label = null;
    @Path("gamePanel/gameBox")
    gameBox: Node = null;

    onMount(): void {
        console.log("<-------- T2048 onMount -------->");

    }

    onInit(...params: any[]): void {
        console.log("<-------- T2048 onInit -------->");
    }

    initGame() {
        
    }
}

