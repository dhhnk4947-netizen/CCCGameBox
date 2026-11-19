import { _decorator, Node } from 'cc';
import { Path } from '../../../Common/Tea/decorators/tea.decorators';
import { TBundleName, FullView } from '../../../Common/Tea/UI/UIView';
import { JSPChapterListView } from './JSPChapterListView';
const { ccclass, property } = _decorator;

@ccclass('JSPHomeView')
@TBundleName("JapenStudent")
export class JSPHomeView extends FullView {
    @Path('')
    quitBtn: Node = null;
    @Path('')
    randomBtn: Node = null;
    @Path('')
    dictationBtn: Node = null;
    @Path('')
    readBtn: Node = null;
    @Path('')
    reviewBtn: Node = null;
    @Path('')
    errorsBtn: Node = null;
    @Path('')
    chapterBtn: Node = null;
    @Path('')
    continueBtn: Node = null;

    onMount(): void {
        this.quitBtn.on(Node.EventType.TOUCH_END, this.onClickQuitBtn, this);
        this.randomBtn.on(Node.EventType.TOUCH_END, this.onClickRandomBtn, this);
        this.dictationBtn.on(Node.EventType.TOUCH_END, this.onClickDictationBtn, this);
        this.readBtn.on(Node.EventType.TOUCH_END, this.onClickReadBtn, this);
        this.reviewBtn.on(Node.EventType.TOUCH_END, this.onClickReviewBtn, this);
        this.errorsBtn.on(Node.EventType.TOUCH_END, this.onClickErrorsBtn, this);
        this.chapterBtn.on(Node.EventType.TOUCH_END, this.onClickChapterBtn, this);
        this.continueBtn.on(Node.EventType.TOUCH_END, this.onClickContinueBtn, this);
    }

    onShow() {
    }

    onHide() {
    }

    onInit(...params: any[]): void {
        
    }

    onClickRandomBtn(e) {
        
    }

    onClickDictationBtn(e) {
        
    }

    onClickReadBtn(e) {
        
    }

    onClickReviewBtn(e) {
        
    }

    onClickErrorsBtn(e) {
        
    }

    onClickChapterBtn(e) {
        JSPChapterListView.show();
    }

    onClickContinueBtn(e) {
        
    }

    onClickQuitBtn(e) {
        stopGame();
    }
}