import { _decorator, game, isValid, Node, Prefab, Sprite, SpriteFrame, sys } from 'cc';
import { VirtureList } from '../../../Common/Tea/components/VirtureList';
import { Path } from '../../../Common/Tea/decorators/tea.decorators';
import { TBundleName, FullView, onMount } from '../../../Common/Tea/UI/UIView';
import TAssetManager from '../../../Common/Tea/Util/TAssetManager';
import { HallView } from './HallView';
const { ccclass, property } = _decorator;

interface GameListItem {
    icon: string,
    name: string,
    unlock: boolean,
    remoteMD5: string
}

const GameList: GameListItem[] = [
    { icon: "10001", name: "T2048", unlock: false, remoteMD5: "" },
    { icon: "10002", name: "JapenStudent", unlock: false, remoteMD5: "" },
    { icon: "10003", name: "TreasureHunter", unlock: false, remoteMD5: "" },
]

const GameListKey = "GAME_LIST_KEY";

@ccclass('GameListView')
@TBundleName("Hall")
export class GameListView extends FullView {
    @Path("ScrollView", VirtureList)
    virtureList: VirtureList;
    @Path("item")
    item: Node;
    @Path("backBtn")
    backBtn: Node;

    private _gameList: GameListItem[] = [];

    @onMount
    mount() {
        this.backBtn.on(Node.EventType.TOUCH_END, this.onClickQuitBtn, this);
    }

    onShow() {
        if (sys.platform != sys.Platform.ANDROID && sys.platform != sys.Platform.IOS) {
            this._gameList = [];
            GameList.forEach(game => {
                game.unlock = true;
                this._gameList.push(game)
            })
        } else {
            this._gameList = this.checkMd5(GameList);
            this.setObj(GameListKey, this._gameList);
        }
        this.virtureList.initList(this._gameList.length, this.onRegisterItemRefreshFunc.bind(this));
    }

    onRegisterItemRefreshFunc(index: number, item: Node) {
        if (index >= this._gameList.length) {
            return false;
        }
        let data = this._gameList[index];
        let iconNode = item.getChildByName("icon").getComponent(Sprite);
        let unload = item.getChildByName("unload");
        unload.active = !data.unlock;
        item.off(Node.EventType.TOUCH_END);
        item.on(Node.EventType.TOUCH_END, this.onClickItemBtn, this);
        TAssetManager.load("textures/gameIcon/" + data.icon + "/spriteFrame", "Common", SpriteFrame, (err, res) => {
            if (err) {
                ERROR(err);
                return false;
            }
            iconNode.spriteFrame = res as SpriteFrame;
        })
        return true;
    }

    onClickItemBtn(e) {
        let index = +e.target.name;
        if (index < 0) {
            index = (0 - index) % this._gameList.length;
        } else {
            index = index % this._gameList.length;
        }
        const data = this._gameList[index];
        if (data.unlock) {
            startGame(data.name);
            return;
        }
        const unlock: Node = (e.target as Node).getChildByName("unload");
        const unlockRange: Sprite = unlock.getComponent(Sprite);
        TAssetManager.preLoad("main", data.name, Prefab, (finish: number, total: number, item) => {
            unlockRange.fillRange = 1 - finish / total;
        }, (err, items) => {
            data.remoteMD5 = globalThis.RemoteMD5[data.name];
            data.unlock = true;
            this.setObj(GameListKey, this._gameList);
            if (!isValid(this, true))
                return;
            unlock.active = false;
        });
    }

    checkMd5(games: GameListItem[]): GameListItem[] {
        if (games == null) return [];
        const results: GameListItem[] = JSON.parse(JSON.stringify(games));
        let datas = this.getObj(GameListKey);
        datas = Array.isArray(datas) ? datas : [];
        datas.forEach(data => {
            if (data.unlock && data.remoteMD5 == globalThis.RemoteMD5[data.name]) {
                const index = results.findIndex(item => item.name == data.name);
                results[index].unlock = true;
                results[index].remoteMD5 = data.remoteMD5;
            }
        })
        return results;
    }

    onHide() {
    }

    onClickQuitBtn() {
        HallView.resetTo();
    }
}