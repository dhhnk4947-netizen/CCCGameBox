import { _decorator, Node } from 'cc';
import { Path } from '../../Common/Tea/decorators/tea.decorators';
import GameItem from '../../Common/Tea/UI/GameItem';
import { JSPHomeView } from './view/JSPHomeView';
import { GameMapper } from '../../Common/Tea/UI/GameMapper';
import { SCREEN_TYPE } from '../../Common/Tea/UI/UIPage';
const { ccclass, property } = _decorator;

@ccclass('JapenStudent')
@GameMapper('JapenStudent', 'main', SCREEN_TYPE.PORTRAIT)
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