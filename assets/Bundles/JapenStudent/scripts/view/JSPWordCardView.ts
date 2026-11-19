import { _decorator, Node } from 'cc';
import { Path } from '../../../Common/Tea/decorators/tea.decorators';
import { TBundleName, FullView } from '../../../Common/Tea/UI/UIView';
const { ccclass, property } = _decorator;

@ccclass('JSPWordCardView')
@TBundleName("JapenStudent")
export class JSPWordCardView extends FullView {
    @Path('')
    quitBtn: Node = null;

    onMount(): void {
        this.quitBtn.on(Node.EventType.TOUCH_END, this.onClickQuitBtn, this);
    }

    onShow() {
    }

    onHide() {
    }

    onInit(words: string) {
        
    }
    
    onClickQuitBtn() {
        this.back();
    }
}