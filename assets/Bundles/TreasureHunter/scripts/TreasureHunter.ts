import { _decorator, BoxCollider2D, Collider2D, Contact2DType, easing, IPhysics2DContact, Node, sp, tween, Tween, UITransform } from 'cc';
import GameItem from '../../Common/Tea/UI/GameItem';
import { Path } from '../../Common/Tea/decorators/tea.decorators';
import { GameMapper } from '../../Common/Tea/UI/GameMapper';
import { SCREEN_TYPE } from '../../Common/Tea/UI/UIPage';
const { ccclass, property } = _decorator;

enum RopeStatus {
    DEFAULT,
    AVAILABLE,
    DOWN,
    UP,
}

const minRopeSize = 60;
const speed = 300;

@ccclass('TreasureHunter')
@GameMapper('TreasureHunter', 'main', SCREEN_TYPE.LANDSCAPE)
export class TreasureHunter extends GameItem {
    @Path("quitBtn")
    quitBtn: Node = null;
    @Path("gamePanel/player/rope")
    rope: Node = null;
    @Path("gamePanel/player/rope", UITransform)
    ropeTrans: UITransform = null;
    @Path("gamePanel/boundary")
    boundary: Node = null;
    @Path("gamePanel/player/rope/claw")
    claw: Node = null;
    @Path("gamePanel/player/rope/mineral")
    mineral: Node = null;
    @Path("gamePanel/player/rope/claw", Collider2D)
    clawCollider: Collider2D = null;
    @Path("gamePanel/player/rope/claw", sp.Skeleton)
    clawSkeleton: sp.Skeleton = null;
    @Path("gamePanel/player/miner", sp.Skeleton)
    miner: sp.Skeleton = null;

    speedMult: number = 1;
    touchTime: number = 0;

    _ropeState: RopeStatus = RopeStatus.DEFAULT;
    get ropeState() {
        return this._ropeState;
    }
    set ropeState(val: RopeStatus) {
        this._ropeState = val;
        switch (val) {
            case RopeStatus.DEFAULT:
                this.clawSkeleton.timeScale = 1;
                this.speedMult = 1;
                this.initRope();
                break;
            case RopeStatus.AVAILABLE:
                this.clawSkeleton.timeScale = 1;
                this.speedMult = 1;
                break;
            case RopeStatus.UP:
                this.clawSkeleton.timeScale = 0.5;
                this.clawSkeleton.setAnimation(0, "hold_closed", false);
                break;
            case RopeStatus.DOWN:
                this.speedMult = 1;
                this.clawSkeleton.timeScale = 1;
                this.clawSkeleton.setAnimation(0, "open", false);
                break;
        }
    }

    onMount(): void {
        this.quitBtn.on(Node.EventType.TOUCH_END, this.onClickQuitBtn, this);
        this.boundary.on(Node.EventType.TOUCH_END, this.onTouchBoundary, this);
        this.clawCollider.on(Contact2DType.BEGIN_CONTACT, this.onBeginContact, this);
    }

    initRope() {
        Tween.stopAllByTarget(this.rope);
        this.ropeTrans.height = minRopeSize;
        this.claw.y = -minRopeSize;
        this.mineral.y = -minRopeSize - 20;
        let t1 = tween(this.rope)
            .to(2.8, { angle: 75 })
            .to(2.8, { angle: -75 })
        tween(this.rope)
            .set({ angle: -75 })
            .repeatForever(t1)
            .start();
        this.scheduleOnce(() => {
            this.ropeState = RopeStatus.AVAILABLE;
        }, 0.1)
    }

    onInit(...params: any[]): void {
        this.ropeState = RopeStatus.DEFAULT;
    }

    onShow(): void {
    }

    onHide(): void {
    }

    onBeginContact(selfCollider: Collider2D, otherCollider: Collider2D, contact: IPhysics2DContact | null) {
        console.log('onBeginContact');
        if (otherCollider.tag == 3) {
            this.speedMult = 2;
            this.ropeState = RopeStatus.UP;
        }
    }

    onTouchBoundary(e) {
        switch (this.ropeState) {
            case RopeStatus.AVAILABLE:
                Tween.stopAllByTarget(this.rope);
                this.ropeState = RopeStatus.DOWN;
                break;
            case RopeStatus.UP:
                Tween.stopAllByTarget(this.rope);
                const currTime = Date.now();
                if (this.touchTime - currTime <= 300) {
                    console.log("触发炸弹💣💣💣");
                    break;
                }
                this.touchTime = currTime;
                break;
        }
    }

    onClickQuitBtn(e) {
        stopGame();
    }

    refreshRopeSize(dt: number) {
        this.ropeTrans.height += dt * speed * this.speedMult;
        this.claw.y = -this.ropeTrans.height;
        this.mineral.y = -this.ropeTrans.height - 20;
    }

    protected update(dt: number): void {
        switch (this.ropeState) {
            case RopeStatus.DOWN:
                this.refreshRopeSize(dt);
                break;
            case RopeStatus.UP:
                if (this.ropeTrans.height <= minRopeSize) {
                    this.ropeState = RopeStatus.DEFAULT;
                    break;
                }
                this.refreshRopeSize(-dt);
                break;
        }
    }
}