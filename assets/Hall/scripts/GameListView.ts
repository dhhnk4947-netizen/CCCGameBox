import { _decorator, isValid, Node, Sprite, SpriteFrame } from 'cc';
import { TBundleName, FullView, onMount } from '../../Common/Tea/UI/UIView';
import { HallView } from './HallView';
import { VirtureList } from '../../Common/Tea/components/VirtureList';
import { Path } from '../../Common/Tea/decorators/tea.decorators';
import TAssetManager from '../../Common/Tea/Util/TAssetManager';
const { ccclass, property } = _decorator;

const GameList = [
    {icon: "10001", name: "T2048"},
]

@ccclass('GameListView')
@TBundleName("Hall")
export class GameListView extends FullView {
    @Path("ScrollView", VirtureList)
    virtureList: VirtureList;
    @Path("item")
    item: Node;
    @Path("backBtn")
    backBtn: Node;

    @onMount
    mount() {
        this.backBtn.on(Node.EventType.TOUCH_END, this.onClickQuitBtn, this);
    }

    onShow() {
        this.virtureList.initList( GameList.length, this.onRegisterItemRefreshFunc.bind(this));
    }

    onRegisterItemRefreshFunc(index: number, item: Node) {
            if (index >= GameList.length) {
                return false;
            }
            let data = GameList[index];
            let iconNode = item.getChildByName("icon").getComponent(Sprite);
            let unload = item.getChildByName("unload");
            unload.active = false;
            item.on(Node.EventType.TOUCH_END, () => {
                startGame(data.name);
            }, this);
            TAssetManager.load("textures/gameIcon/" + data.icon + "/spriteFrame", "Common", SpriteFrame, (err, res) => {
                if(err){
                    ERROR(err);
                    return;
                }
                iconNode.spriteFrame = res as SpriteFrame;
            })
            return true;
    }

    onHide() {
    }

    onClickQuitBtn() {
        HallView.resetTo();
    }
}
