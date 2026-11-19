import { _decorator, Node } from 'cc';
import { Path } from '../../Common/Tea/decorators/tea.decorators';
import GameItem, { GameMapper } from '../../Common/Tea/UI/GameItem';
import { JSPHomeView } from './view/JSPHomeView';
const { ccclass, property } = _decorator;

@ccclass('JapenStudent')
@GameMapper('JapenStudent', 'main')
export class JapenStudent extends GameItem {
    @Path("quitBtn")
    quitBtn: Node = null;

    onShow(): void {
        JSPHomeView.resetTo();
    }

    onHide(): void {
        
    }

    onMount(): void {
        
    }
}