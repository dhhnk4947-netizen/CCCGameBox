import { _decorator, Node } from 'cc';
import { Path } from '../../../Common/Tea/decorators/tea.decorators';
import { TBundleName, FullView } from '../../../Common/Tea/UI/UIView';
const { ccclass, property } = _decorator;

@ccclass('JapenStudentWordsListView')
@TBundleName("JapenStudent")
export class JapenStudentWordsListView extends FullView {
    @Path('')
    quitBtn: Node = null;

    onMount(): void {
        this.quitBtn.on(Node.EventType.TOUCH_END, this.onClickQuitBtn, this);
    }

    onShow() {
    }

    onHide() {
    }

    onInit(chapterName: string) {
        
    }

    onClickQuitBtn() {
        this.back();
    }
}