import { _decorator, Node } from 'cc';
import { Path } from '../../../Common/Tea/decorators/tea.decorators';
import UIPage from '../../../Common/Tea/UI/UIPage';
import { TBundleName, FullView } from '../../../Common/Tea/UI/UIView';
import { Autowired } from '../../../Common/Tea/Util/SingletonFactory';
import { VirtureList } from '../../../Common/Tea/components/VirtureList';
const { ccclass, property } = _decorator;

@ccclass('JSPChapterStudyView')
@TBundleName("JapenStudent")
export class JSPChapterStudyView extends FullView {
    @Path('')
    quitBtn: Node = null;
    @Path('')
    chapterList: VirtureList = null;

    @Autowired(UIPage)
    uiPage: UIPage = null;

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