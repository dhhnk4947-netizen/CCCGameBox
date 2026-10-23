import { _decorator, easing, game, Mask, Node, Quat, size, tween, Tween, UITransform } from 'cc';
import { Path } from '../../Common/Tea/decorators/tea.decorators';
import { TBundleName, Cutscene } from '../../Common/Tea/UI/UIView';
const { ccclass, property } = _decorator;

@ccclass('LoadingView')
@TBundleName("Common")
export class LoadingView extends Cutscene {
    @Path('Mask', UITransform)
    animNode: UITransform = null;
    @Path('Mask', Mask)
    animMask: Mask = null;

    onInit(time: number) {
        this.animTime = time;
    }

    openAnim(): void {
        Tween.stopAllByTarget(this.animNode);
        Tween.stopAllByTarget(this.animMask);
        tween(this.animMask)
            .set({ segments: 10 })
            .to(this.animTime, { segments: 2 })
            .start();

        tween(this.animNode)
            .set({ contentSize: size(2000, 2000) })
            .to(this.animTime, { contentSize: size(0, 0) })
            .start();
    }

    closeAnim(): void {
        Tween.stopAllByTarget(this.animNode);
        Tween.stopAllByTarget(this.animMask);
        tween(this.animMask)
            .set({ segments: 3 })
            .to(this.animTime, { segments: 5 })
            .start();
        tween(this.animNode)
            .set({ contentSize: size(0, 0) })
            .to(this.animTime, { contentSize: size(2000, 2400) })
            .start();
    }
}