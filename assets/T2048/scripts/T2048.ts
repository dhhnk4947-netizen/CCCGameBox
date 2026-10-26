import { _decorator, EventTouch, Label, Node, Sprite, SpriteFrame } from 'cc';
import GameItem, { GameMapper } from '../../Common/Tea/UI/GameItem';
import { Path } from '../../Common/Tea/decorators/tea.decorators';
import LocallyData from '../../Common/Tea/data/LocallyData';
import { Autowired } from '../../Common/Tea/Util/SingletonFactory';
import TAssetManager from '../../Common/Tea/Util/TAssetManager';
import EventManager from '../../Common/Tea/Util/EventManager';
import { T2048GlobalContext } from './T2048GlobalContext';
import { SettlementView } from './SettlementView';
const { ccclass, property } = _decorator;

const T2048DataKey = "T2048Data";

@ccclass('T2048')
@GameMapper('T2048', 'main')
export class T2048 extends GameItem {
    @Path("gamePanel/currRecord/recordLabel", Label)
    currRecordLabel: Label = null;
    @Path("gamePanel/maxRecord/recordLabel", Label)
    maxRecordLabel: Label = null;
    @Path("gamePanel/victoryGoal/recordLabel", Label)
    victoryGoalLabel: Label = null;
    @Path("gamePanel/gamebox")
    gameBox: Node = null;

    @Path("gamePanel/btns/quitBtn")
    quitBtn: Node = null;
    @Path("gamePanel/btns/settingBtn")
    settingBtn: Node = null;
    @Path("gamePanel/btns/revokeBtn")
    revokeBtn: Node = null;
    @Path("gamePanel/btns/restartBtn")
    restartBtn: Node = null;

    @Autowired(LocallyData)
    locallyData: LocallyData = null;
    @Autowired(EventManager)
    eventManager: EventManager = null;

    storageCache: T2048Data[] = [];
    gameBoxData: number[] = [];
    spriteFrames: SpriteFrame[] = [];

    get currRecord(): number {
        return this._currRecord;
    }
    set currRecord(value: number) {
        this._currRecord = value;
        this.currRecordLabel.string = `${this._currRecord}`;
    }
    private _currRecord: number = 0;
    get maxRecord(): number {
        return this._maxRecord;
    }
    set maxRecord(value: number) {
        this._maxRecord = value;
        this.maxRecordLabel.string = `${this._maxRecord}`;
    }
    private _maxRecord: number = 0;
    private _touchStartPos: { x: number, y: number } = { x: 0, y: 0 };

    onShow(): void {
        this.eventManager.on(T2048GlobalContext.EventMsg.RESTART_GAME, this.onClickRestartBtn.bind(this));
    }

    onHide(): void {
        this.eventManager.off(T2048GlobalContext.EventMsg.RESTART_GAME, this.onClickRestartBtn.bind(this));
    }

    onMount(): void {
        this.quitBtn.on(Node.EventType.TOUCH_END, this.onClickQuitBtn, this);
        this.settingBtn.on(Node.EventType.TOUCH_END, this.onClickSettingBtn, this);
        this.revokeBtn.on(Node.EventType.TOUCH_END, this.onClickRevokeBtn, this);
        this.restartBtn.on(Node.EventType.TOUCH_END, this.onClickRestartBtn, this);

        this.gameBox.on(Node.EventType.TOUCH_START, this.onTouchGameBoxStart, this);
        this.gameBox.on(Node.EventType.TOUCH_END, this.onTouchGameBoxEnd, this);
    }

    onInit(...params: any[]): void {
        if (this.spriteFrames.length != 0) {
            this.initGameBox();
            return;
        }
        TAssetManager.loadDir("textures/nums", "T2048", SpriteFrame, (err, assets) => {
            if (err) {
                ERROR("TAssetManager.loadDir ====> err", err);
                return;
            }
            this.spriteFrames = (assets as SpriteFrame[]).sort((a, b) => {
                return parseInt(a.name, 10) - parseInt(b.name, 10);
            });
            this.initGameBox();
        })
    }

    initGameBox() {
        const gameData = this.readGameData();
        if (gameData && gameData.lastData && gameData.lastData.length != 0) {
            this.currRecord = gameData.currRecord || 0;
            this.maxRecord = gameData.maxRecord || 0;
            this.gameBoxData = gameData.lastData;
            this.refreshGameBox();
        } else {
            this.maxRecord = gameData.maxRecord || 0;
            this.initGame();
        }
    }

    initGame() {
        this.gameBoxData = [
            0, 0, 0, 0,
            0, 0, 0, 0,
            0, 0, 0, 0,
            0, 0, 0, 0,
        ];
        this.currRecord = 0;
        this.generateRandomNumber();
        this.generateRandomNumber();
    }

    refreshGameBox() {
        for (let i = 0; i < this.gameBoxData.length; i++) {
            let sprite = this.gameBox.children[i].getComponent(Sprite);
            if (this.gameBoxData[i] > 0) {
                sprite.spriteFrame = this.spriteFrames[this.gameBoxData[i] - 1];
            } else {
                sprite.spriteFrame = null;
            }
        }
    }

    generateRandomNumber() {
        let emptyIndices = [];
        for (let i = 0; i < this.gameBoxData.length; i++) {
            if (this.gameBoxData[i] === 0) {
                emptyIndices.push(i);
            }
        }
        let len = emptyIndices.length;
        if (len > 0) {
            len--;
            const index = ~~(Math.random() * emptyIndices.length);
            let randomIndex = emptyIndices[index];
            this.gameBoxData[randomIndex] = Math.random() < 0.9 ? 1 : 2;
            this.refreshGameBox();
        }
        if (len == 0 && this.checkGameOver()) {
            this.gameOver();
        } else {
            this.saveGameData({
                currRecord: this.currRecord,
                maxRecord: this.maxRecord,
                lastData: this.gameBoxData
            });
        }
    }

    gameOver() {
        const maxRecord = Math.max(this.currRecord, this.maxRecord);
        this.maxRecord = maxRecord;

        SettlementView.show(this.currRecord, this.maxRecord);

        this.currRecord = 0;
        this.gameBoxData = [
            0, 0, 0, 0,
            0, 0, 0, 0,
            0, 0, 0, 0,
            0, 0, 0, 0,
        ];
        this.saveGameData({
            currRecord: this.currRecord,
            maxRecord: this.maxRecord,
            lastData: null,
        });
        this.storageCache = [];
    }

    onTouchGameBoxStart(e: EventTouch) {
        this._touchStartPos = e.getUILocation();
    }

    onTouchGameBoxEnd(e: EventTouch) {
        const touchEndPos = e.getUILocation();
        const deltaX = touchEndPos.x - this._touchStartPos.x;
        const deltaY = touchEndPos.y - this._touchStartPos.y;

        let newGameBoxData: number[];
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
            if (Math.abs(deltaX) < 100) {
                return;
            }
            if (deltaX > 0) {
                newGameBoxData = this.moveRight();
            } else {
                newGameBoxData = this.moveLeft();
            }
        } else {
            if (Math.abs(deltaY) < 100) {
                return;
            }
            if (deltaY > 0) {
                newGameBoxData = this.moveUp();
            } else {
                newGameBoxData = this.moveDown();
            }
        }
        if (this.checkGameBoxDataChange(newGameBoxData)) {
            this.gameBoxData = newGameBoxData;
            this.generateRandomNumber();
        }
    }

    moveLeft() {
        console.log("MOVE_LEFT");
        const newGameBoxData: number[] = [];
        for (let i = 0; i < 4; i++) {
            const row = [];
            for (let j = 0; j < 4; j++) {
                const x = i * 4 + j;
                this.gameBoxData[x] && row.push(this.gameBoxData[x]);
            }
            if (row.length == 0) {
                newGameBoxData.push(...[0, 0, 0, 0]);
                continue
            };
            const newRow = this.mergeRow(row);
            newGameBoxData.push(...newRow);
        }

        return newGameBoxData;
    }

    moveRight() {
        console.log("MOVE_RIGHT");
        const newGameBoxData: number[] = [];
        for (let i = 0; i < 4; i++) {
            const row = [];
            for (let j = 3; j >= 0; j--) {
                const x = i * 4 + j;
                this.gameBoxData[x] && row.push(this.gameBoxData[x]);
            }
            if (row.length == 0) {
                newGameBoxData.push(...[0, 0, 0, 0]);
                continue
            };
            const newRow = this.mergeRow(row);
            newRow.reverse();
            newGameBoxData.push(...newRow);
        }

        return newGameBoxData;
    }

    moveUp() {
        console.log("MOVE_UP");
        const tempGameBoxData: number[] = [];
        for (let i = 0; i < 4; i++) {
            const row = [];
            for (let j = 0; j < 4; j++) {
                const x = j * 4 + i;
                this.gameBoxData[x] && row.push(this.gameBoxData[x]);
            }
            if (row.length == 0) {
                tempGameBoxData.push(...[0, 0, 0, 0]);
                continue
            };
            const newRow = this.mergeRow(row);
            tempGameBoxData.push(...newRow);
        }

        const newGameBoxData = [];
        for (let i = 0; i < 4; i++) {
            for (let j = 0; j < 4; j++) {
                const num = tempGameBoxData[j * 4 + i];
                newGameBoxData.push(num);
            }
        }

        return newGameBoxData;
    }

    moveDown() {
        console.log("MOVE_DOWN");
        const tempGameBoxData: number[] = [];
        for (let i = 0; i < 4; i++) {
            const row = [];
            for (let j = 3; j >= 0; j--) {
                const x = j * 4 + i;
                this.gameBoxData[x] && row.push(this.gameBoxData[x]);
            }
            if (row.length == 0) {
                tempGameBoxData.push(...[0, 0, 0, 0]);
                continue
            };
            const newRow = this.mergeRow(row);
            newRow.reverse();
            tempGameBoxData.push(...newRow);
        }

        const newGameBoxData = [];
        for (let i = 0; i < 4; i++) {
            for (let j = 0; j < 4; j++) {
                const num = tempGameBoxData[j * 4 + i];
                newGameBoxData.push(num);
            }
        }
        return newGameBoxData;
    }

    mergeRow(row: number[]): number[] {
        const changes = [false];
        const newRow = [row[0], 0, 0, 0];
        const currRecord = this.currRecord;
        let x = 0;
        for (let i = 1; i < 4; i++) {
            if (changes[i - 1]) {
                x++;
                newRow[x] = row[i] || 0;
                changes[i] = false;
                continue;
            }
            if (row[i] == newRow[x]) {
                newRow[x]++;
                changes[i] = true;
                this.currRecord += 2 ** +newRow[x];
            } else {
                x++;
                newRow[x] = row[i] || 0;
                changes[i] = false;
            }
        }
        this.storageCache.push({
            currRecord: currRecord,
            maxRecord: this.maxRecord,
            lastData: [...this.gameBoxData]
        })
        this.storageCache.length > 5 && this.storageCache.shift();
        return newRow;
    }

    checkGameBoxDataChange(newGameBoxData: number[]) {
        if (this.gameBoxData.length != newGameBoxData.length) {
            return true;
        }
        for (let i = 0; i < this.gameBoxData.length; i++) {
            if (this.gameBoxData[i] != newGameBoxData[i]) {
                return true;
            }
        }
        return false;
    }

    checkGameOver(): boolean {
        for (let i = 0; i < 4; i++) {
            for (let j = 0; j < 4; j++) {
                let onIndex = i * 4 + j;
                if (i < 3 && this.gameBoxData[onIndex] == this.gameBoxData[onIndex + 4]) {
                    return false;
                }
                if (j < 3 && this.gameBoxData[onIndex] == this.gameBoxData[onIndex + 1]) {
                    return false;
                }
            }
        }
        return true;
    }

    onClickQuitBtn(e) {
        this.close(() => {
            ResetTo("HallView");
        });
    }

    onClickSettingBtn(e) {
    }

    onClickRevokeBtn(e) {
        if (this.storageCache.length == 0)
            return;
        const data: T2048Data = this.storageCache.pop();
        this.currRecord = data.currRecord;
        this.maxRecord = data.maxRecord;
        this.gameBoxData = data.lastData;
        this.refreshGameBox();
    }

    onClickRestartBtn(e) {
        this.initGame();
    }

    saveGameData(data: T2048Data) {
        this.locallyData.setObj(T2048DataKey, data);
    }

    readGameData(): T2048Data {
        return this.locallyData.getObj(T2048DataKey) as T2048Data;
    }
}

interface T2048Data {
    currRecord: number;
    maxRecord: number;
    lastData: number[];
}
