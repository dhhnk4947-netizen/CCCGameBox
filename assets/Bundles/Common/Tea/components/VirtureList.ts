import { v3, v2, UITransform, ViewGroup, logID, Vec2, Vec3, director, DirectorEvent, NodeEventType, Event, EventTouch, SystemEventType, Layout, Size, TransformBit, Node, EventHandler, _decorator, CCFloat, CCBoolean, Enum, Prefab, Vec4, v4, instantiate, Rect, Widget, CCInteger } from 'cc';
import { EDITOR_NOT_IN_PREVIEW } from 'cc/env';
const { ccclass, property } = _decorator;

const NUMBER_OF_GATHERED_TOUCHES_FOR_MOVE_SPEED = 5;
const OUT_OF_BOUNDARY_BREAKING_FACTOR = 0.05;
const EPSILON = 1e-4;
const TOLERANCE = 1e4;
const MOVEMENT_FACTOR = 0.7;
const _tempVec3 = v3();
const _tempVec3_1 = v3();
const _tempVec2 = v2();
const _tempVec2_1 = v2();

const quintEaseOut = (time: number): number => {
    time -= 1;
    return time * time * time * time * time + 1;
};

const getTimeInMilliseconds = (): number => {
    const currentTime = new Date();
    return currentTime.getMilliseconds();
};

const eventMap = {
    'scroll-to-top': 0,
    'scroll-to-bottom': 1,
    'scroll-to-left': 2,
    'scroll-to-right': 3,
    scrolling: 4,
    'bounce-bottom': 6,
    'bounce-left': 7,
    'bounce-right': 8,
    'bounce-top': 5,
    'scroll-ended': 9,
    'touch-up': 10,
    'scroll-ended-with-threshold': 11,
    'scroll-began': 12,
};

enum VirtureListEventType {
    NONE = '',
    SCROLL_TO_TOP = 'scroll-to-top',
    SCROLL_TO_BOTTOM = 'scroll-to-bottom',
    SCROLL_TO_LEFT = 'scroll-to-left',
    SCROLL_TO_RIGHT = 'scroll-to-right',
    SCROLL_BEGAN = 'scroll-began',
    SCROLL_ENDED = 'scroll-ended',
    BOUNCE_TOP = 'bounce-top',
    BOUNCE_BOTTOM = 'bounce-bottom',
    BOUNCE_LEFT = 'bounce-left',
    BOUNCE_RIGHT = 'bounce-right',
    SCROLLING = 'scrolling',
    SCROLL_ENG_WITH_THRESHOLD = 'scroll-ended-with-threshold',
    TOUCH_UP = 'touch-up',
}

const _moveDeltaOptions = {
    anchor: v2(),
    applyToHorizontal: false,
    applyToVertical: false,
};

const assignMoveDeltaOption = (x: number, y: number, applyToHorizontal: boolean, applyToVertical: boolean): void => {
    _moveDeltaOptions.anchor.set(x, y);
    _moveDeltaOptions.applyToHorizontal = applyToHorizontal;
    _moveDeltaOptions.applyToVertical = applyToVertical;
};

enum TepItemType {
    Item,
    Prefab
}

enum LayoutType {
    HORIZONTAL,
    VERTICAL,
    GRID_HORIZONTAL,
    GRID_VERTICAL
}

enum FlushType {
    Frame,
    Timer
}

interface ListItemLink {
    node: Node;
    prev: ListItemLink | null;
    next: ListItemLink | null;
}

@ccclass('VirtureList')
export class VirtureList extends ViewGroup {
    public static EventType = VirtureListEventType;

    @property({ type: CCBoolean, tooltip: '是否开启虚拟列表' })
    public virture: boolean = false;
    // get virture() {
    //     return this._virture;
    // }

    // set virture(val: boolean) {
    //     this._virture = val;
    // }

    // @property
    // private _virture: boolean = false;

    @property({ type: CCBoolean, tooltip: '是否开启循环列表', visible() { return this.virture } })
    get itemLoop() {
        return this.virture && this._itemLoop && this._isLegal;
    }

    set itemLoop(val: boolean) {
        this._itemLoop = val;
    }

    @property
    private _itemLoop: boolean = null;


    @property({ type: Enum(TepItemType), tooltip: '模板项类型' })
    public tepItemType = TepItemType.Item;

    @property({ type: Node, tooltip: '模板Item', visible() { return this.tepItemType === TepItemType.Item; } })
    public tepItem = null;

    @property({ type: Prefab, tooltip: '模板Prefab', visible() { return this.tepItemType === TepItemType.Prefab; } })
    public tepPrefab = null;

    @property({ type: CCBoolean, tooltip: '是否开启分帧渲染' })
    public frameRender = false;

    @property({ type: CCInteger, min: 1, tooltip: '每帧创建item数量', visible() { return this.frameRender; } })
    public generatedItemCount = 1;

    @property({ type: Enum(LayoutType), tooltip: '布局类型 [HORIZONTAL: 横向] [VERTICAL: 纵向] [GRID_HORIZONTAL: 网格横向] [GRID_VERTICAL: 网格纵向]', visible() { return this.tepItemType === TepItemType.Item; } })
    public layoutType = LayoutType.VERTICAL;

    @property({ type: CCFloat, tooltip: 'x方向间距', visible() { return this.layoutType !== LayoutType.VERTICAL; } })
    spacingX = 0;

    @property({ type: CCFloat, tooltip: 'y方向间距', visible() { return this.layoutType !== LayoutType.HORIZONTAL; } })
    spacingY = 0;

    /**
     * 边距 [x: 上] [y: 右] [z: 下] [w: 左]
     */
    @property({ type: Vec4, tooltip: '边距 [x: 上] [y: 右] [z: 下] [w: 左] 注：开启循环列表后对应方向的边距会失效' })
    margin: Vec4 = v4(0, 0, 0, 0);

    @property({ type: Enum(FlushType), tooltip: '刷新类型 [Frame: 帧刷新] [Timer: 时间刷新]' })
    flushType: FlushType = FlushType.Frame;

    @property({ type: CCFloat, tooltip: '刷新间隔(秒)', visible() { return this.flushType === FlushType.Timer; } })
    flushTimer = 0.1;
    @property({ type: CCFloat, tooltip: '刷新间隔(帧)', visible() { return this.flushType === FlushType.Frame; } })
    flushFrame = 1;

    @property({ type: CCBoolean, tooltip: '是否开启反向滚动' })
    public reverse = false;
    /**
     * @en
     * The elapse time of bouncing back. A value of 0 will bounce back immediately.
     *
     * @zh
     * 回弹持续的时间，0 表示将立即反弹。
     */
    @property({ type: CCFloat, tooltip: '回弹持续的时间，0 表示将立即反弹' })
    public bounceDuration = 1;

    /**
     * @en
     * It determines how quickly the content stop moving. A value of 1 will stop the movement immediately.
     * A value of 0 will never stop the movement until it reaches to the boundary of scrollview.
     *
     * @zh
     * 开启惯性后，在用户停止触摸后滚动多快停止，0表示永不停止，1表示立刻停止。
     */
    @property({ type: CCFloat, tooltip: '滑动阻尼' })
    public brake = 0.75;

    @property({ type: CCFloat, min: 0, tooltip: '最大滑动速度（UI单位/秒），0表示不限速；作用于拖拽、滚轮、惯性和程序跳转' })
    public maxScrollSpeed = 8000;

    /**
     * @en
     * When elastic is set, the content will be bounce back when move out of boundary.
     *
     * @zh
     * 是否允许滚动内容超过边界，并在停止触摸后回弹。
     */
    @property({ type: CCBoolean, tooltip: '是否开启弹性滚动' })
    public elastic = true;

    /**
     * @en
     * When inertia is set, the content will continue to move when touch ended.
     *
     * @zh
     * 是否开启滚动惯性。
     */
    @property({ type: CCBoolean, tooltip: '是否开启滚动惯性' })
    public inertia = true;

    /**
     * @en
     * This is a reference to the UI element to be scrolled.
     *
     * @zh
     * 可滚动展示内容的节点。
     */
    @property({ type: Node, tooltip: '可滚动展示内容的节点' })
    get content(): Node | null {
        return this._content;
    }
    set content(value) {
        if (this._content === value) {
            return;
        }
        const viewTrans = value && value.parent && value.parent.getComponent(UITransform);
        if (value && (!value || !viewTrans)) {
            logID(4302);
            return;
        }

        this._content = value;
        this._calculateBoundary();
    }

    /**
     * @en
     * Enable horizontal scroll.
     *
     * @zh
     * 是否开启水平滚动。
     */
    public get horizontal() {
        return this.layoutType == LayoutType.GRID_HORIZONTAL || this.layoutType == LayoutType.HORIZONTAL;
    }

    /**
     * @en
     * Enable vertical scroll.
     *
     * @zh
     * 是否开启垂直滚动。
     */

    public get vertical() {
        return this.layoutType == LayoutType.GRID_VERTICAL || this.layoutType == LayoutType.VERTICAL;
    }
    /**
     * @en
     * If cancelInnerEvents is set to true, the scroll behavior will cancel touch events on inner content nodes
     * It's set to true by default.
     *
     * @zh
     * 如果这个属性被设置为 true，那么滚动行为会取消子节点上注册的触摸事件，默认被设置为 true。<br/>
     * 注意，子节点上的 touchstart 事件仍然会触发，触点移动距离非常短的情况下 touchmove 和 touchend 也不会受影响。
     */
    @property({ type: CCBoolean, tooltip: '如果这个属性被设置为 true，那么滚动行为会取消子节点上注册的触摸事件，默认被设置为 true' })
    public cancelInnerEvents = true;

    /**
     * @en
     * ScrollView events callback.
     *
     * @zh
     * 滚动视图的事件回调函数。
     */
    @property({ type: EventHandler, tooltip: '滚动视图的事件回调函数' })
    public scrollEvents: EventHandler[] = [];

    /**
     * @en The display view in the scroll view component.
     * @zh scroll view 组件中的显示区域。
     */
    get view(): UITransform | null {
        const parent = this._content && this._content.parent;
        if (!parent) {
            return null;
        }
        return parent.getComponent(UITransform);
    }

    protected _autoScrolling = false;
    protected _scrolling = false;
    @property
    protected _content: Node | null = null;

    protected _topBoundary = 0;
    protected _bottomBoundary = 0;
    protected _leftBoundary = 0;
    protected _rightBoundary = 0;

    protected _touchMoveDisplacements: Vec3[] = [];
    protected _touchMoveTimeDeltas: number[] = [];
    protected _touchMovePreviousTimestamp = 0;
    protected _touchMoved = false;
    protected _autoScrollAttenuate = false;
    protected _autoScrollStartPosition = new Vec3();
    protected _autoScrollTargetDelta = new Vec3();
    protected _autoScrollTotalTime = 0;
    protected _autoScrollAccumulatedTime = 0;
    protected _autoScrollCurrentlyOutOfBoundary = false;
    protected _autoScrollBraking = false;
    protected _autoScrollBrakingStartPosition = new Vec3();

    protected _outOfBoundaryAmount = new Vec3();
    protected _outOfBoundaryAmountDirty = true;
    protected _stopMouseWheel = false;
    protected _mouseWheelEventElapsedTime = 0.0;
    protected _isScrollEndedWithThresholdEventFired = false;
    // use bit wise operations to indicate the direction
    protected _scrollEventEmitMask = 0;
    protected _isBouncing = false;
    protected _contentPos = new Vec3();
    protected _deltaPos = new Vec3();
    protected _deltaAmount = new Vec3();

    // #region 虚拟列表相关
    private _item: Node = null;
    private _flushTimer: number = 0;
    private _pendingVirtualListDelta = new Vec3();
    private _itemRefreshFunc: (...params: any[]) => boolean;
    private _posRefreshFunc: (index: number, item: Node) => void;
    private _getItemPos: (index: number) => Vec2;
    private _itemRect: Rect;
    private _itemSize: number = 0;
    private _colCount: number = 0;
    private _rowCount: number = 0;
    private _itemMaxCount: number = 0;
    private _listItemCount: number = 0;

    private _itemHead: ListItemLink | null = null;
    private _itemTail: ListItemLink | null = null;
    private _itemCount: number = 0;
    private _isGenerating: boolean = false;

    private _isLegal: boolean = true;
    // #endregion

    // #region 视图滚动方法
    public scrollToBottom(timeInSecond?: number, attenuated = true): void {
        this._doScroll(0, 0, false, true, timeInSecond, attenuated);
    }
    public scrollToTop(timeInSecond?: number, attenuated = true): void {
        this._doScroll(0, 1, false, true, timeInSecond, attenuated);
    }
    public scrollToLeft(timeInSecond?: number, attenuated = true): void {
        this._doScroll(0, 0, true, false, timeInSecond, attenuated);
    }
    public scrollToRight(timeInSecond?: number, attenuated = true): void {
        this._doScroll(1, 0, true, false, timeInSecond, attenuated);
    }
    public scrollToTopLeft(timeInSecond?: number, attenuated = true): void {
        this._doScroll(0, 1, true, true, timeInSecond, attenuated);
    }
    public scrollToTopRight(timeInSecond?: number, attenuated = true): void {
        this._doScroll(1, 1, true, true, timeInSecond, attenuated);
    }
    public scrollToBottomLeft(timeInSecond?: number, attenuated = true): void {
        this._doScroll(0, 0, true, true, timeInSecond, attenuated);
    }
    public scrollToBottomRight(timeInSecond?: number, attenuated = true): void {
        this._doScroll(1, 0, true, true, timeInSecond, attenuated);
    }
    public scrollToOffset(offset: Vec2, timeInSecond?: number, attenuated = true): void {
        const maxScrollOffset = this.getMaxScrollOffset();

        const anchor = v2();
        // if maxScrollOffset is 0, then always align the content's top left origin to the top left corner of its parent
        if (maxScrollOffset.x === 0) {
            anchor.x = 0;
        } else {
            anchor.x = offset.x / maxScrollOffset.x;
        }

        if (maxScrollOffset.y === 0) {
            anchor.y = 1;
        } else {
            anchor.y = (maxScrollOffset.y - offset.y) / maxScrollOffset.y;
        }

        this.scrollTo(anchor, timeInSecond, attenuated);
    }
    public getScrollOffset(): Vec2 {
        const topDelta = this._getContentTopBoundary() - this._topBoundary;
        const leftDelta = this._getContentLeftBoundary() - this._leftBoundary;

        return new Vec2(leftDelta, topDelta);
    }
    public getMaxScrollOffset(): Vec2 {
        if (!this._content || !this.view) {
            return Vec2.ZERO;
        }
        const contentSize = this._content.getComponent(UITransform)!.contentSize;
        let horizontalMaximizeOffset = contentSize.width - this.view.width;
        let verticalMaximizeOffset = contentSize.height - this.view.height;
        horizontalMaximizeOffset = horizontalMaximizeOffset >= 0 ? horizontalMaximizeOffset : 0;
        verticalMaximizeOffset = verticalMaximizeOffset >= 0 ? verticalMaximizeOffset : 0;

        return new Vec2(horizontalMaximizeOffset, verticalMaximizeOffset);
    }
    public scrollToPercentHorizontal(percent: number, timeInSecond: number, attenuated: boolean): void {
        this._doScroll(percent, 0, true, false, timeInSecond, attenuated);
    }
    public scrollTo(anchor: Vec2, timeInSecond?: number, attenuated?: boolean): void {
        this._doScroll(anchor.x, anchor.y, true, true, timeInSecond, attenuated);
    }
    public scrollToPercentVertical(percent: number, timeInSecond?: number, attenuated?: boolean): void {
        this._doScroll(0, percent, false, true, timeInSecond, attenuated);
    }

    public scrollToIndex(index: number, timeInSecond?: number, attenuated?: boolean): void {
        if (this._isGenerating || !this._content || !this._getItemPos || this._itemSize <= 0 || !Number.isInteger(index)) return;

        const itemPos = this._getItemPos(index);
        const firstItemPos = this._getItemPos(0);
        if (!itemPos || !firstItemPos) return;

        const contentTrans = this._content.getComponent(UITransform);
        const view = this.view;
        const maxScrollOffset = this.getMaxScrollOffset();
        const x = maxScrollOffset.x > 0
            ? (contentTrans.width * contentTrans.anchorX - view.width * view.anchorX + itemPos.x - firstItemPos.x) / maxScrollOffset.x
            : 0;
        const y = maxScrollOffset.y > 0
            ? (contentTrans.height * contentTrans.anchorY - view.height * view.anchorY + itemPos.y - firstItemPos.y) / maxScrollOffset.y
            : 1;
        this._doScroll(x, y, this.horizontal, this.vertical, timeInSecond, attenuated);
    }

    private _doScroll(x: number, y: number, applyToHorizontal: boolean, applyToVertical: boolean, timeInSecond?: number, attenuated = true): void {
        if (this._isGenerating) return;

        this.stopAutoScroll();
        this._deltaAmount.set(0, 0, 0);

        assignMoveDeltaOption(x, y, applyToHorizontal, applyToVertical);
        const moveDelta = this._calculateMovePercentDelta(_moveDeltaOptions);

        let duration = timeInSecond;
        if (!duration && this.maxScrollSpeed > 0) {
            duration = this._flattenVectorByDirection(moveDelta).length() / this.maxScrollSpeed;
        }
        if (duration) {
            this._startAutoScroll(moveDelta, duration, attenuated);
        } else {
            this._moveContent(moveDelta);
            this._flushPendingVirtualList();
        }
    }

    /**
     * @en
     * Stop auto scroll immediately.
     *
     * @zh
     * 停止自动滚动, 调用此 API 可以让 ScrollView 立即停止滚动。
     */
    public stopAutoScroll(): void {
        this._autoScrolling = false;
        this._autoScrollAccumulatedTime = this._autoScrollTotalTime;
        this._flushPendingVirtualList();
    }
    // #endregion

    /**
     * @en
     * Modify the content position.
     *
     * @zh
     * 设置当前视图内容的坐标点。
     *
     * @param position @en Current content position. @zh 希望设置内容框体的位置。
     * @deprecated Since 3.1.0, setContentPosition is deprecated, please use scrollToOffset instead.
     */
    public setContentPosition(position: Vec3): void {
        this._setContentPosition(position);
    }

    // Should not use _tempVec3 and also can not invoke any functions that use _tempVec3 as invoker may pass _tempVec3.
    private _setContentPosition(position: Readonly<Vec3>): void {
        if (!this._content) {
            return;
        }
        const contentPos = this._getContentPosition();
        if (Math.abs(position.x - contentPos.x) < EPSILON && Math.abs(position.y - contentPos.y) < EPSILON) {
            return;
        }

        this._content.setPosition(position);
        this._outOfBoundaryAmountDirty = true;
    }

    /**
     * @en
     * Query the content's position in its parent space.
     *
     * @zh
     * 获取当前视图内容的坐标点。
     *
     * @returns @en current content position. @zh 当前视图内容的坐标点。
     * @deprecated Since 3.1.0, getContentPosition is deprecated.
     */
    public getContentPosition(): Vec3 {
        return this._getContentPosition();
    }

    private _getContentPosition(): Vec3 {
        if (!this._content) {
            return Vec3.ZERO.clone();
        }

        this._contentPos.set(this._content.position);
        return this._contentPos;
    }

    /**
     * @en
     * Query whether the user is currently dragging the ScrollView to scroll it.
     *
     * @zh
     * 用户是否在拖拽当前滚动视图。
     *
     * @returns @en If or not the current scrolling view is being dragged.  @zh 是否在拖拽当前滚动视图。
     */
    public isScrolling(): boolean {
        return this._scrolling;
    }

    /**
     * @en
     * Query whether the ScrollView is currently scrolling because of a bounceback or inertia slowdown.
     *
     * @zh
     * 当前滚动视图是否在惯性滚动。
     *
     * @returns @en Whether the scrolling view is scrolling inertially.  @zh 滚动视图是否在惯性滚动。
     */
    public isAutoScrolling(): boolean {
        return this._autoScrolling;
    }

    /**
     * @en Get the minimum precision time of the end-of-scroll event.
     * @zh 获得滚动结束的事件的最小精度时间。
     * @returns @en Minimum time. @zh 最小时间。
     */
    public getScrollEndedEventTiming(): number {
        return EPSILON;
    }

    public start(): void {
        this._calculateBoundary();
        // Because widget component will adjust content position and scrollView position is correct after visit
        // So this event could make sure the content is on the correct position after loading.
        if (this._content) {
            director.once(DirectorEvent.BEFORE_DRAW, this._adjustContentOutOfBoundary, this);
        }
    }

    public onEnable(): void {
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        const self = this;

        if (!EDITOR_NOT_IN_PREVIEW) {
            self._registerEvent();
            const content = this._content;
            if (content) {
                content.on(NodeEventType.SIZE_CHANGED, self._calculateBoundary, self);
                content.on(NodeEventType.TRANSFORM_CHANGED, self._scaleChanged, self);

                const view = self.view;
                if (view) {
                    view.node.on(NodeEventType.TRANSFORM_CHANGED, self._scaleChanged, self);
                    view.node.on(NodeEventType.SIZE_CHANGED, self._calculateBoundary, self);
                }
            }

            self._calculateBoundary();
        }
    }
    public update(dt: number): void {
        if (this._isGenerating) {
            this._instantiateItem(this.generatedItemCount);
            return;
        }
        const deltaAmount = this._deltaAmount;
        if (this._autoScrolling) {
            this._processAutoScrolling(dt);
            deltaAmount.x = 0;
            deltaAmount.y = 0;
        } else if (deltaAmount.x !== 0 || deltaAmount.y !== 0) {
            this._processDeltaMove(deltaAmount, dt);
            deltaAmount.x = 0;
            deltaAmount.y = 0;
        } else {
            this._flushPendingVirtualList();
        }
    }

    public onDisable(): void {
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        const self = this;

        if (!EDITOR_NOT_IN_PREVIEW) {
            self._unregisterEvent();

            const content = self.content;
            if (content) {
                content.off(NodeEventType.SIZE_CHANGED, self._calculateBoundary, self);
                content.off(NodeEventType.TRANSFORM_CHANGED, self._scaleChanged, self);

                const view = self.view;
                if (view) {
                    view.node.off(NodeEventType.TRANSFORM_CHANGED, self._scaleChanged, self);
                    view.node.off(NodeEventType.SIZE_CHANGED, self._calculateBoundary, self);
                }
            }
        }
        self._deltaAmount.set(0, 0);
        self.stopAutoScroll();
    }

    // private methods
    protected _registerEvent(): void {
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        const self = this;
        const node = self.node;
        node.on(NodeEventType.TOUCH_START, self._onTouchBegan, self, true);
        node.on(NodeEventType.TOUCH_MOVE, self._onTouchMoved, self, true);
        node.on(NodeEventType.TOUCH_END, self._onTouchEnded, self, true);
        node.on(NodeEventType.TOUCH_CANCEL, self._onTouchCancelled, self, true);
        node.on(NodeEventType.MOUSE_WHEEL, self._onMouseWheel, self, true);
        node.on(NodeEventType.MOUSE_DOWN, self._blockInputWhileGenerating, self, true);
        node.on(NodeEventType.MOUSE_UP, self._blockInputWhileGenerating, self, true);
    }

    protected _unregisterEvent(): void {
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        const self = this;
        const node = self.node;
        node.off(NodeEventType.TOUCH_START, self._onTouchBegan, self, true);
        node.off(NodeEventType.TOUCH_MOVE, self._onTouchMoved, self, true);
        node.off(NodeEventType.TOUCH_END, self._onTouchEnded, self, true);
        node.off(NodeEventType.TOUCH_CANCEL, self._onTouchCancelled, self, true);
        node.off(NodeEventType.MOUSE_WHEEL, self._onMouseWheel, self, true);
        node.off(NodeEventType.MOUSE_DOWN, self._blockInputWhileGenerating, self, true);
        node.off(NodeEventType.MOUSE_UP, self._blockInputWhileGenerating, self, true);
    }

    private _blockInputWhileGenerating(event: Event): boolean {
        if (!this._isGenerating || !event) {
            return false;
        }

        // 捕获阶段阻断事件，禁止 item 及其子节点的触摸、鼠标和 Button 点击。
        event.propagationStopped = true;
        event.propagationImmediateStopped = true;
        return true;
    }

    protected _onMouseWheel(event, captureListeners?: Node[]): void {
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        const self = this;

        if (self._blockInputWhileGenerating(event) || !self.enabledInHierarchy) {
            return;
        }


        if (self._hasNestedViewGroup(event, captureListeners)) {
            return;
        }

        const wheelPrecision = -0.1;
        const scrollY = event.getScrollY();

        const deltaMove = _tempVec3;
        if (self.vertical) {
            deltaMove.set(0, scrollY * wheelPrecision, 0);
        } else if (self.horizontal) {
            deltaMove.set(scrollY * wheelPrecision, 0, 0);
        }

        self._mouseWheelEventElapsedTime = 0;
        self._deltaAmount.add(deltaMove);

        if (!self._stopMouseWheel) {
            self._handlePressLogic();
            self.schedule(this._checkMouseWheel, 1.0 / 60);
            self._stopMouseWheel = true;
        }

        self._stopPropagationIfTargetIsMe(event);
    }

    protected _onTouchBegan(event, captureListeners?: Node[]): void {
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        const self = this;

        if (self._blockInputWhileGenerating(event) || !self.enabledInHierarchy || !self._content) {
            return;
        }

        if (self._hasNestedViewGroup(event, captureListeners)) {
            return;
        }

        self._handlePressLogic();

        self._touchMoved = false;
        self._stopPropagationIfTargetIsMe(event);
    }

    protected _onTouchMoved(event, captureListeners?: Node[]): void {
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        const self = this;

        if (self._blockInputWhileGenerating(event) || !self.enabledInHierarchy || !self._content) {
            return;
        }

        if (self._hasNestedViewGroup(event, captureListeners)) {
            return;
        }

        const touch = event.touch!;
        self._handleMoveLogic(touch);

        // Do not prevent touch events in inner nodes
        if (!self.cancelInnerEvents) {
            return;
        }

        const deltaMove = touch.getUILocation(_tempVec2);
        deltaMove.subtract(touch.getUIStartLocation(_tempVec2_1));
        // FIXME: touch move delta should be calculated by DPI.
        if (deltaMove.length() > 7) {
            if (!self._touchMoved && event.target !== self.node) {
                // Simulate touch cancel for target node
                const cancelEvent = new EventTouch(event.getTouches(), event.bubbles, SystemEventType.TOUCH_CANCEL);
                cancelEvent.touch = event.touch;
                cancelEvent.simulate = true;
                (event.target as Node).dispatchEvent(cancelEvent);
                self._touchMoved = true;
            }
        }
        self._stopPropagationIfTargetIsMe(event);
    }

    protected _onTouchEnded(event, captureListeners?: Node[]): void {
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        const self = this;

        if (self._blockInputWhileGenerating(event) || !self.enabledInHierarchy || !self._content || !event) {
            return;
        }

        if (self._hasNestedViewGroup(event, captureListeners)) {
            return;
        }

        self._dispatchEvent(VirtureListEventType.TOUCH_UP);

        const touch = event.touch!;
        self._handleReleaseLogic(touch);

        if (self._touchMoved) {
            event.propagationStopped = true;
        } else {
            self._stopPropagationIfTargetIsMe(event);
        }
    }

    protected _onTouchCancelled(event, captureListeners?: Node[]): void {
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        const self = this;

        if (self._blockInputWhileGenerating(event) || !self.enabledInHierarchy || !self._content) {
            return;
        }
        if (self._hasNestedViewGroup(event, captureListeners)) {
            return;
        }

        // Filter touch cancel event send from self
        if (event && !event.simulate) {
            self._handleReleaseLogic(event.touch!);
        }
        self._stopPropagationIfTargetIsMe(event);
    }

    protected _calculateBoundary(): void {
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        const self = this;

        if (self._content && self.view) {
            // refresh content size
            const layout = self._content.getComponent(Layout);
            if (layout && layout.enabledInHierarchy) {
                layout.updateLayout();
            }
            const viewTrans = self.view;

            const anchorX = viewTrans.width * viewTrans.anchorX;
            const anchorY = viewTrans.height * viewTrans.anchorY;

            self._leftBoundary = -anchorX;
            self._bottomBoundary = -anchorY;

            self._rightBoundary = self._leftBoundary + viewTrans.width;
            self._topBoundary = self._bottomBoundary + viewTrans.height;

            self._moveContentToTopLeft(viewTrans.contentSize);
        }
    }

    protected _hasNestedViewGroup(event: Event, captureListeners?: Node[]): boolean {
        if (!event || event.eventPhase !== Event.CAPTURING_PHASE) {
            return false;
        }

        if (captureListeners) {
            // captureListeners are arranged from child to parent
            for (let i = 0; i < captureListeners.length; i++) {
                const listener = captureListeners[i];
                if (this.node === listener) {
                    if (event.target && (event.target as any as Node).getComponent(ViewGroup)) {
                        return true;
                    }
                    return false;
                }

                if (listener.getComponent(ViewGroup)) {
                    return true;
                }
            }
        }
        return false;
    }

    protected _startInertiaScroll(touchMoveVelocity: Vec3): void {
        _tempVec3.set(touchMoveVelocity);
        _tempVec3.multiplyScalar(MOVEMENT_FACTOR);

        // this._startAttenuatingAutoScroll will clone _tempVec3, so can pass _tempVec3.
        this._startAttenuatingAutoScroll(_tempVec3, touchMoveVelocity);
    }

    protected _calculateAttenuatedFactor(distance: number): number {
        if (this.brake <= 0) {
            return 1 - this.brake;
        }

        // attenuate formula from: http://learnopengl.com/#!Lighting/Light-casters
        return (1 - this.brake) * (1 / (1 + distance * 0.000014 + distance * distance * 0.000000008));
    }

    protected _startAttenuatingAutoScroll(deltaMove: Vec3, initialVelocity: Vec3): void {
        const targetDelta = deltaMove.clone();
        targetDelta.normalize();
        if (this._content && this.view) {
            const contentSize = this._content.getComponent(UITransform)!.contentSize;
            const scrollViewSize = this.view.contentSize;

            const totalMoveWidth = contentSize.width - scrollViewSize.width;
            const totalMoveHeight = contentSize.height - scrollViewSize.height;

            const attenuatedFactorX = this._calculateAttenuatedFactor(totalMoveWidth);
            const attenuatedFactorY = this._calculateAttenuatedFactor(totalMoveHeight);

            targetDelta.x = targetDelta.x * totalMoveWidth * (1 - this.brake) * attenuatedFactorX;
            targetDelta.y = targetDelta.y * totalMoveHeight * attenuatedFactorY * (1 - this.brake);
            targetDelta.z = 0;
        }

        const originalMoveLength = deltaMove.length();
        let factor = targetDelta.length() / originalMoveLength;

        if (this.brake > 0 && factor > 7) {
            factor = Math.sqrt(factor);
            targetDelta.set(deltaMove);
            targetDelta.multiplyScalar(factor + 1);
        } else {
            targetDelta.add(deltaMove);
        }

        let time = this._calculateAutoScrollTimeByInitialSpeed(initialVelocity.length());
        if (this.brake > 0 && factor > 3) {
            factor = 3;
            time *= factor;
        }

        if (this.brake === 0 && factor > 1) {
            time *= factor;
        }

        this._startAutoScroll(targetDelta, time, true);
    }

    protected _calculateAutoScrollTimeByInitialSpeed(initialSpeed: number): number {
        return Math.sqrt(Math.sqrt(initialSpeed / 5));
    }

    protected _startAutoScroll(deltaMove: Vec3, timeInSecond: number, attenuated = false): void {

        if (this._isGenerating) return;

        // eslint-disable-next-line @typescript-eslint/no-this-alias
        const self = this;

        const adjustedDeltaMove = self._flattenVectorByDirection(deltaMove);

        self._autoScrolling = true;
        self._autoScrollTargetDelta = adjustedDeltaMove;
        self._autoScrollAttenuate = attenuated;
        Vec3.copy(self._autoScrollStartPosition, self._getContentPosition());
        self._autoScrollTotalTime = timeInSecond;
        self._autoScrollAccumulatedTime = 0;
        self._autoScrollBraking = false;
        self._isScrollEndedWithThresholdEventFired = false;
        self._autoScrollBrakingStartPosition.set(0, 0, 0);

        const currentOutOfBoundary = self._getHowMuchOutOfBoundary();
        if (!currentOutOfBoundary.equals(Vec3.ZERO, EPSILON)) {
            this._autoScrollCurrentlyOutOfBoundary = true;
        }
    }

    protected _calculateTouchMoveVelocity(): Vec3 {
        const out = new Vec3();
        let totalTime = 0;
        totalTime = this._touchMoveTimeDeltas.reduce((a, b) => a + b, totalTime);

        if (totalTime <= 0 || totalTime >= 0.5) {
            out.set(Vec3.ZERO);
        } else {
            let totalMovement = _tempVec3;
            totalMovement.set(0, 0, 0);
            totalMovement = this._touchMoveDisplacements.reduce((a, b) => {
                a.add(b);
                return a;
            }, totalMovement);

            // eslint-disable-next-line function-paren-newline
            out.set(totalMovement.x * (1 - this.brake) / totalTime,
                totalMovement.y * (1 - this.brake) / totalTime,
                totalMovement.z,
            );
        }
        this._limitScrollSpeed(this._flattenVectorByDirection(out), 1);
        return out;
    }

    protected _flattenVectorByDirection(vector: Vec3): Vec3 {
        if (!this.horizontal) vector.x = 0;
        if (!this.vertical) vector.y = 0;
        return vector;
    }

    private _limitScrollSpeed(deltaMove: Vec3, dt: number): boolean {
        if (!(this.maxScrollSpeed > 0)) {
            return false;
        }
        const maxDistance = this.maxScrollSpeed * Math.max(0, dt);
        const distanceSquared = deltaMove.lengthSqr();
        if (distanceSquared > maxDistance * maxDistance) {
            deltaMove.multiplyScalar(maxDistance / Math.sqrt(distanceSquared));
            return true;
        }
        return false;
    }

    protected _moveContent(deltaMove: Vec3, canStartBounceBack?: boolean): void {
        if (this._isGenerating) return;
        const adjustedMove = this._flattenVectorByDirection(deltaMove);

        _tempVec3.set(this._getContentPosition());
        _tempVec3.add(adjustedMove);
        _tempVec3.set(Math.round(_tempVec3.x * TOLERANCE) * EPSILON, Math.round(_tempVec3.y * TOLERANCE) * EPSILON, _tempVec3.z);

        this._setContentPosition(_tempVec3);
        const outOfBoundary = this._getHowMuchOutOfBoundary();
        _tempVec2.set(outOfBoundary.x, outOfBoundary.y);

        if (this.elastic && canStartBounceBack) {
            this._startBounceBackIfNeeded();
        }

        if (!this.virture) {
            return;
        }

        this._pendingVirtualListDelta.add(adjustedMove);
        let flag = false;
        if (this.flushType === FlushType.Timer) {
            flag = (Date.now() - this._flushTimer) * 0.001 >= this.flushTimer;
            flag && (this._flushTimer = Date.now());
        } else if (this.flushType === FlushType.Frame) {
            flag = director.getTotalFrames() % this.flushFrame === 0;
        }

        flag && this._flushPendingVirtualList();
    }

    private _flushPendingVirtualList(): void {
        if (this._isGenerating) return;

        const deltaMove = this._pendingVirtualListDelta;
        if (this.virture && (deltaMove.x !== 0 || deltaMove.y !== 0)) {
            this._refreshVirtualList(deltaMove);
        }
        deltaMove.set(0, 0, 0);
    }

    protected _getContentLeftBoundary(): number {
        if (!this._content) {
            return -1;
        }
        const contentPos = this._getContentPosition();
        const uiTrans = this._content.getComponent(UITransform)!;
        return contentPos.x - uiTrans.anchorX * uiTrans.width;
    }

    protected _getContentRightBoundary(): number {
        if (!this._content) {
            return -1;
        }
        const uiTrans = this._content.getComponent(UITransform)!;
        return this._getContentLeftBoundary() + uiTrans.width;
    }

    protected _getContentTopBoundary(): number {
        if (!this._content) {
            return -1;
        }
        const uiTrans = this._content.getComponent(UITransform)!;
        return this._getContentBottomBoundary() + uiTrans.height;
    }

    protected _getContentBottomBoundary(): number {
        if (!this._content) {
            return -1;
        }
        const contentPos = this._getContentPosition();
        const uiTrans = this._content.getComponent(UITransform)!;
        return contentPos.y - uiTrans.anchorY * uiTrans.height;
    }

    protected _getHowMuchOutOfBoundary(addition?: Vec3): Vec3 {
        if (this.virture && this.itemLoop)
            return new Vec3();

        if (!addition) {
            addition = Vec3.ZERO;
        }
        if (addition.equals(Vec3.ZERO, EPSILON) && !this._outOfBoundaryAmountDirty) {
            return this._outOfBoundaryAmount;
        }

        const outOfBoundaryAmount = new Vec3();
        const tempLeftBoundary: number = this._getContentLeftBoundary();
        const tempRightBoundary: number = this._getContentRightBoundary();
        if (tempLeftBoundary + addition.x > this._leftBoundary) {
            outOfBoundaryAmount.x = this._leftBoundary - (tempLeftBoundary + addition.x);
        } else if (tempRightBoundary + addition.x < this._rightBoundary) {
            outOfBoundaryAmount.x = this._rightBoundary - (tempRightBoundary + addition.x);
        }

        const tempTopBoundary: number = this._getContentTopBoundary();
        const tempBottomBoundary: number = this._getContentBottomBoundary();
        if (tempTopBoundary + addition.y < this._topBoundary) {
            outOfBoundaryAmount.y = this._topBoundary - (tempTopBoundary + addition.y);
        } else if (tempBottomBoundary + addition.y > this._bottomBoundary) {
            outOfBoundaryAmount.y = this._bottomBoundary - (tempBottomBoundary + addition.y);
        }

        if (addition.equals(Vec3.ZERO, EPSILON)) {
            this._outOfBoundaryAmount = outOfBoundaryAmount;
            this._outOfBoundaryAmountDirty = false;
        }

        this._clampDelta(outOfBoundaryAmount);
        return outOfBoundaryAmount;
    }

    protected _dispatchEvent(event: string): void {
        if (event === VirtureListEventType.SCROLL_ENDED as string) {
            this._flushPendingVirtualList();
            this._scrollEventEmitMask = 0;
        } else if (event === VirtureListEventType.SCROLL_TO_TOP as string
            || event === VirtureListEventType.SCROLL_TO_BOTTOM as string
            || event === VirtureListEventType.SCROLL_TO_LEFT as string
            || event === VirtureListEventType.SCROLL_TO_RIGHT as string) {
            const flag = 1 << eventMap[event];
            if (this._scrollEventEmitMask & flag) {
                return;
            } else {
                this._scrollEventEmitMask |= flag;
            }
        }

        EventHandler.emitEvents(this.scrollEvents, this, eventMap[event]);
        this.node.emit(event, this);
    }

    protected _adjustContentOutOfBoundary(): void {
        if (!this._content) {
            return;
        }

        this._outOfBoundaryAmountDirty = true;
        const outOfBoundary = this._getHowMuchOutOfBoundary();
        const _isOutOfBoundary = !outOfBoundary.equals(Vec3.ZERO, EPSILON);
        if (_isOutOfBoundary) {
            _tempVec3.set(this._getContentPosition());
            _tempVec3.add(outOfBoundary);

            // Important: Pass a global variable _tempVec3 to other class member function is dangerous. As `this._setContentPosition`
            // doesn't use _tempVec3 and it doesn't invoke any functions that use _tempVec3. So it is safe to pass _tempVec3 here.
            this._setContentPosition(_tempVec3);
        }
    }


    // This is for ScrollView as children of a Button
    protected _stopPropagationIfTargetIsMe(event): void {
        if (event.eventPhase === Event.AT_TARGET && event.target === this.node) {
            event.propagationStopped = true;
        }
    }

    protected _processDeltaMove(deltaMove: Vec3, dt: number): void {
        this._limitScrollSpeed(this._flattenVectorByDirection(deltaMove), dt);
        this._scrollChildren(deltaMove);
        this._gatherTouchMove(deltaMove);
    }

    protected _handleMoveLogic(touch: Touch): void {
        this._getLocalAxisAlignDelta(this._deltaPos, touch);
        this._deltaAmount.add(this._deltaPos);
    }

    protected _handleReleaseLogic(touch: Touch): void {
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        const self = this;

        self._getLocalAxisAlignDelta(self._deltaPos, touch);
        self._gatherTouchMove(self._deltaPos);
        self._processInertiaScroll();

        if (self._scrolling) {
            self._scrolling = false;
            if (!self._autoScrolling) {
                self._dispatchEvent(VirtureListEventType.SCROLL_ENDED);
            }
        }
    }

    protected _getLocalAxisAlignDelta(out: Vec3, touch): void {
        const uiTransformComp = this.node.getComponent(UITransform);

        if (uiTransformComp) {
            touch.getUILocation(_tempVec2);
            touch.getUIPreviousLocation(_tempVec2_1);
            _tempVec3.set(_tempVec2.x, _tempVec2.y, 0);
            _tempVec3_1.set(_tempVec2_1.x, _tempVec2_1.y, 0);
            uiTransformComp.convertToNodeSpaceAR(_tempVec3, _tempVec3);
            uiTransformComp.convertToNodeSpaceAR(_tempVec3_1, _tempVec3_1);
            Vec3.subtract(out, _tempVec3, _tempVec3_1);
        }
    }

    protected _scrollChildren(deltaMove: Vec3): void {
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        const self = this;

        self._clampDelta(deltaMove);

        const realMove = deltaMove;
        let outOfBoundary: Vec3;
        if (self.elastic) {
            outOfBoundary = self._getHowMuchOutOfBoundary();
            realMove.x *= outOfBoundary.x === 0 ? 1 : 0.5;
            realMove.y *= outOfBoundary.y === 0 ? 1 : 0.5;
        }

        if (self._isGenerating || !self.elastic) {
            outOfBoundary = self._getHowMuchOutOfBoundary(realMove);
            realMove.add(outOfBoundary);
        }

        let verticalScrollEventType = VirtureListEventType.NONE;
        let horizontalScrollEventType = VirtureListEventType.NONE;
        if (self._content) {
            const { anchorX, anchorY, width, height } = self._content.getComponent(UITransform)!;
            const pos = self._content.position || Vec3.ZERO;

            if (self.vertical) {
                if (realMove.y > 0) { // up
                    const icBottomPos = pos.y - anchorY * height;

                    if (icBottomPos + realMove.y >= self._bottomBoundary) {
                        verticalScrollEventType = VirtureListEventType.SCROLL_TO_BOTTOM;
                    }
                } else if (realMove.y < 0) { // down
                    const icTopPos = pos.y - anchorY * height + height;

                    if (icTopPos + realMove.y <= self._topBoundary) {
                        verticalScrollEventType = VirtureListEventType.SCROLL_TO_TOP;
                    }
                }
            }

            if (self.horizontal) {
                if (realMove.x < 0) { // left
                    const icRightPos = pos.x - anchorX * width + width;
                    if (icRightPos + realMove.x <= self._rightBoundary) {
                        horizontalScrollEventType = VirtureListEventType.SCROLL_TO_RIGHT;
                    }
                } else if (realMove.x > 0) { // right
                    const icLeftPos = pos.x - anchorX * width;
                    if (icLeftPos + realMove.x >= self._leftBoundary) {
                        horizontalScrollEventType = VirtureListEventType.SCROLL_TO_LEFT;
                    }
                }
            }
        }

        self._moveContent(realMove, false);

        if ((self.horizontal && realMove.x !== 0) || (self.vertical && realMove.y !== 0)) {
            if (!self._scrolling) {
                self._scrolling = true;
                self._dispatchEvent(VirtureListEventType.SCROLL_BEGAN);
            }
            self._dispatchEvent(VirtureListEventType.SCROLLING);
        }

        if (verticalScrollEventType !== VirtureListEventType.NONE) {
            self._dispatchEvent(verticalScrollEventType);
        }
        if (horizontalScrollEventType !== VirtureListEventType.NONE) {
            self._dispatchEvent(horizontalScrollEventType);
        }
    }

    protected _handlePressLogic(): void {
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        const self = this;

        if (self._autoScrolling) {
            self._dispatchEvent(VirtureListEventType.SCROLL_ENDED);
        }

        self._autoScrolling = false;
        self._isBouncing = false;

        self._touchMovePreviousTimestamp = getTimeInMilliseconds();
        self._touchMoveDisplacements.length = 0;
        self._touchMoveTimeDeltas.length = 0;
    }

    protected _clampDelta(out: Vec3): void {
        if (this._content && this.view) {
            const scrollViewSize = this.view.contentSize;
            const uiTrans = this._content.getComponent(UITransform)!;
            if (uiTrans.width < scrollViewSize.width) {
                out.x = 0;
            }
            if (uiTrans.height < scrollViewSize.height) {
                out.y = 0;
            }
        }
    }

    protected _gatherTouchMove(delta: Vec3): void {
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        const self = this;

        const clampDt = delta.clone();
        self._clampDelta(clampDt);

        while (self._touchMoveDisplacements.length >= NUMBER_OF_GATHERED_TOUCHES_FOR_MOVE_SPEED) {
            self._touchMoveDisplacements.shift();
            self._touchMoveTimeDeltas.shift();
        }

        self._touchMoveDisplacements.push(clampDt);

        const timeStamp = getTimeInMilliseconds();
        self._touchMoveTimeDeltas.push((timeStamp - self._touchMovePreviousTimestamp) / 1000);
        self._touchMovePreviousTimestamp = timeStamp;
    }

    protected _startBounceBackIfNeeded(): boolean {
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        const self = this;

        if (!self.elastic) {
            return false;
        }

        const bounceBackAmount = self._getHowMuchOutOfBoundary();
        self._clampDelta(bounceBackAmount);

        if (bounceBackAmount.equals(Vec3.ZERO, EPSILON)) {
            return false;
        }

        const bounceBackTime = Math.max(self.bounceDuration, 0);
        self._startAutoScroll(bounceBackAmount, bounceBackTime, true);

        if (!self._isBouncing) {
            if (bounceBackAmount.y > 0) {
                self._dispatchEvent(VirtureListEventType.BOUNCE_TOP);
            }
            if (bounceBackAmount.y < 0) {
                self._dispatchEvent(VirtureListEventType.BOUNCE_BOTTOM);
            }
            if (bounceBackAmount.x > 0) {
                self._dispatchEvent(VirtureListEventType.BOUNCE_RIGHT);
            }
            if (bounceBackAmount.x < 0) {
                self._dispatchEvent(VirtureListEventType.BOUNCE_LEFT);
            }
            self._isBouncing = true;
        }

        return true;
    }

    protected _processInertiaScroll(): void {
        const bounceBackStarted = this._startBounceBackIfNeeded();
        if (!bounceBackStarted && this.inertia) {
            const touchMoveVelocity = this._calculateTouchMoveVelocity();
            if (!touchMoveVelocity.equals(Vec3.ZERO, EPSILON) && this.brake < 1) {
                this._startInertiaScroll(touchMoveVelocity);
            }
        }
    }

    protected _isOutOfBoundary(): boolean {
        const outOfBoundary = this._getHowMuchOutOfBoundary();
        return !outOfBoundary.equals(Vec3.ZERO, EPSILON);
    }

    protected _isNecessaryAutoScrollBrake(): boolean {
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        const self = this;

        if (self._autoScrollBraking) {
            return true;
        }

        if (self._isOutOfBoundary()) {
            if (!self._autoScrollCurrentlyOutOfBoundary) {
                self._autoScrollCurrentlyOutOfBoundary = true;
                self._autoScrollBraking = true;
                Vec3.copy(self._autoScrollBrakingStartPosition, self._getContentPosition());
                return true;
            }
        } else {
            self._autoScrollCurrentlyOutOfBoundary = false;
        }

        return false;
    }

    protected _processAutoScrolling(dt): void {
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        const self = this;

        const isAutoScrollBrake = self._isNecessaryAutoScrollBrake();
        const brakingFactor = isAutoScrollBrake ? OUT_OF_BOUNDARY_BREAKING_FACTOR : 1;
        self._autoScrollAccumulatedTime += dt * (1 / brakingFactor);

        let percentage = Math.min(1, self._autoScrollAccumulatedTime / self._autoScrollTotalTime);
        if (self._autoScrollAttenuate) {
            percentage = quintEaseOut(percentage);
        }

        const clonedAutoScrollTargetDelta = self._autoScrollTargetDelta.clone();
        clonedAutoScrollTargetDelta.multiplyScalar(percentage);
        const clonedAutoScrollStartPosition = self._autoScrollStartPosition.clone();
        clonedAutoScrollStartPosition.add(clonedAutoScrollTargetDelta);
        let reachedEnd = Math.abs(percentage - 1) <= EPSILON;

        if (self.elastic) {
            const brakeOffsetPosition = clonedAutoScrollStartPosition.clone();
            brakeOffsetPosition.subtract(self._autoScrollBrakingStartPosition);
            if (isAutoScrollBrake) {
                brakeOffsetPosition.multiplyScalar(brakingFactor);
            }
            clonedAutoScrollStartPosition.set(self._autoScrollBrakingStartPosition);
            clonedAutoScrollStartPosition.add(brakeOffsetPosition);
        } else {
            const moveDelta = clonedAutoScrollStartPosition.clone();
            moveDelta.subtract(self.getContentPosition());
            const outOfBoundary = self._getHowMuchOutOfBoundary(moveDelta);
            if (!outOfBoundary.equals(Vec3.ZERO, EPSILON)) {
                clonedAutoScrollStartPosition.add(outOfBoundary);
                reachedEnd = true;
            }
        }

        const deltaMove = clonedAutoScrollStartPosition.clone();
        deltaMove.subtract(self._getContentPosition());
        self._clampDelta(deltaMove);
        const speedLimited = self._limitScrollSpeed(deltaMove, dt);
        // 限速后继续追赶原目标，实际到达前不结束滚动。
        reachedEnd = reachedEnd && !speedLimited;

        const fireEvent = !speedLimited && Math.abs(percentage - 1) <= self.getScrollEndedEventTiming();
        if (fireEvent && !self._isScrollEndedWithThresholdEventFired) {
            self._dispatchEvent(VirtureListEventType.SCROLL_ENG_WITH_THRESHOLD);
            self._isScrollEndedWithThresholdEventFired = true;
        }
        if (reachedEnd) {
            self._autoScrolling = false;
        }

        self._moveContent(deltaMove, reachedEnd);
        self._dispatchEvent(VirtureListEventType.SCROLLING);

        if (!self._autoScrolling) {
            self._isBouncing = false;
            self._scrolling = false;
            self._dispatchEvent(VirtureListEventType.SCROLL_ENDED);
        }
    }

    protected _checkMouseWheel(dt: number): void {
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        const self = this;

        if (self._isGenerating) {
            self.unschedule(self._checkMouseWheel);
            self._stopMouseWheel = false;
            return;
        }

        const currentOutOfBoundary = self._getHowMuchOutOfBoundary();
        const maxElapsedTime = 0.1;

        if (!currentOutOfBoundary.equals(Vec3.ZERO, EPSILON)) {
            self._processInertiaScroll();
            if (self._scrolling) {
                self._scrolling = false;
                if (!self._autoScrolling) {
                    self._dispatchEvent(VirtureListEventType.SCROLL_ENDED);
                }
            }
            self.unschedule(self._checkMouseWheel);
            self._stopMouseWheel = false;
            return;
        }

        self._mouseWheelEventElapsedTime += dt;

        // mouse wheel event is ended
        if (self._mouseWheelEventElapsedTime > maxElapsedTime) {
            if (self._scrolling) {
                self._scrolling = false;
                if (!self._autoScrolling) {
                    self._dispatchEvent(VirtureListEventType.SCROLL_ENDED);
                }
            }
            self.unschedule(self._checkMouseWheel);
            self._stopMouseWheel = false;
        }
    }

    protected _calculateMovePercentDelta(options): Vec3 {
        const anchor = options.anchor;
        const applyToHorizontal = options.applyToHorizontal;
        const applyToVertical = options.applyToVertical;
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        const self = this;
        self._calculateBoundary();

        if (!self.virture || !self.itemLoop) anchor.clampf(Vec2.ZERO, Vec2.ONE);

        let bottomDelta = self._getContentBottomBoundary() - self._bottomBoundary;
        bottomDelta = -bottomDelta;

        let leftDelta = self._getContentLeftBoundary() - self._leftBoundary;
        leftDelta = -leftDelta;

        const moveDelta = new Vec3();
        if (self._content && self.view) {
            let totalScrollDelta = 0;
            const uiTrans = self._content.getComponent(UITransform)!;
            const contentSize = uiTrans.contentSize;
            const scrollSize = self.view.contentSize;
            if (applyToHorizontal) {
                totalScrollDelta = contentSize.width - scrollSize.width;
                moveDelta.x = leftDelta - totalScrollDelta * anchor.x;
            }
            if (applyToVertical) {
                totalScrollDelta = contentSize.height - scrollSize.height;
                moveDelta.y = bottomDelta - totalScrollDelta * anchor.y;
            }
        }

        return moveDelta;
    }

    protected _moveContentToTopLeft(scrollViewSize: Size): void {
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        const self = this;

        let bottomDelta = self._getContentBottomBoundary() - self._bottomBoundary;
        bottomDelta = -bottomDelta;
        const moveDelta = new Vec3();
        let totalScrollDelta = 0;

        let leftDelta = self._getContentLeftBoundary() - self._leftBoundary;
        leftDelta = -leftDelta;

        // 是否限制在上视区上边
        if (self._content) {
            const uiTrans = self._content.getComponent(UITransform)!;
            const contentSize = uiTrans.contentSize;
            if (contentSize.height < scrollViewSize.height) {
                totalScrollDelta = contentSize.height - scrollViewSize.height;
                moveDelta.y = bottomDelta - totalScrollDelta;
            }

            // 是否限制在上视区左边
            if (contentSize.width < scrollViewSize.width) {
                totalScrollDelta = contentSize.width - scrollViewSize.width;
                moveDelta.x = leftDelta;
            }
        }

        self._moveContent(moveDelta);
        self._adjustContentOutOfBoundary();
    }

    protected _scaleChanged(value: TransformBit): void {
        if (value === TransformBit.SCALE) {
            this._calculateBoundary();
        }
    }

    //#region 虚拟列表相关逻辑
    public initList(size: number, refreshFunc: (...params) => boolean);
    public initList(size: number, refreshFunc: (...params) => boolean, item: Node);
    /**
     * 
     * @param refreshFunc 返回值表示是否存在当前数据
     * @param item 
     */
    public initList(size: number, refreshFunc: (...params) => boolean, item?: Node) {
        this._pendingVirtualListDelta.set(0, 0, 0);
        this._isLegal = true;
        this._itemSize = size;
        this._itemHead = null;
        this._itemTail = null;
        this._itemCount = 0;
        const oldItems = this.content.children;
        this.content.removeAllChildren();
        oldItems.forEach(item => item.destroy());
        this._itemRefreshFunc = refreshFunc;
        this._item = item;
        if (!this._item) {
            this.tepItemType == TepItemType.Item ? (this._item = this.tepItem) : (this._item = instantiate(this.tepPrefab));
        }

        this.initAnchor();
        this.generateItem();
    }

    private generateItem() {
        const itemTrans = this._item.getComponent(UITransform);
        const listTrans = this.node.getComponent(UITransform);
        this._itemRect = new Rect(itemTrans.anchorX, itemTrans.anchorY, itemTrans.width, itemTrans.height);
        this._listItemCount = 0;
        this._itemMaxCount = 0;
        let difference = 0;
        switch (this.layoutType) {
            case LayoutType.VERTICAL:
                this._itemMaxCount = Math.ceil((listTrans.height + this.spacingY) / (this._itemRect.height + this.spacingY)) + 1;
                this._listItemCount = this._itemMaxCount;
                this._colCount = 1;
                this._listItemCount = Math.min(this._listItemCount, this._itemSize);
                this._rowCount = this._listItemCount;
                this._posRefreshFunc = this._generateVertical;
                this._getItemPos = this._getVerticalPos;
                difference = this._colCount;
                break;
            case LayoutType.HORIZONTAL:
                this._itemMaxCount = Math.ceil((listTrans.width + this.spacingX) / (this._itemRect.width + this.spacingX)) + 1;
                this._listItemCount = this._itemMaxCount
                this._rowCount = 1;
                this._listItemCount = Math.min(this._listItemCount, this._itemSize);
                this._colCount = this._listItemCount;
                this._posRefreshFunc = this._generateHorizontal;
                this._getItemPos = this._getHorizontalPos;
                difference = this._rowCount;
                break;
            case LayoutType.GRID_VERTICAL:
                const listWidth = listTrans.width - this.margin.w - this.margin.y;
                this._colCount = ~~((listWidth + this.spacingX) / (this._itemRect.width + this.spacingX));
                this._rowCount = Math.ceil((listTrans.height + this.spacingY) / (this._itemRect.height + this.spacingY)) + 1;
                this._itemMaxCount = this._colCount * this._rowCount;
                this._listItemCount = this._itemMaxCount
                this._listItemCount = Math.min(this._listItemCount, this._itemSize);
                this._posRefreshFunc = this._generateGridVertical;
                this._getItemPos = this._getGridVerticalPos;
                difference = this._colCount;
                break;
            case LayoutType.GRID_HORIZONTAL:
                const listHeight = listTrans.height - this.margin.z - this.margin.x;
                this._rowCount = ~~((listHeight + this.spacingY) / (this._itemRect.height + this.spacingY));
                this._colCount = Math.ceil((listTrans.width + this.spacingX) / (this._itemRect.width + this.spacingX)) + 1;
                this._itemMaxCount = this._colCount * this._rowCount;
                this._listItemCount = this._itemMaxCount
                this._listItemCount = Math.min(this._listItemCount, this._itemSize);
                this._posRefreshFunc = this._generateGridHorizontal;
                this._getItemPos = this._getGridHorizontalPos;
                difference = this._rowCount;
                break;
        }

        if (this.virture) {
            this._isLegal = (this._itemMaxCount - this._listItemCount) <= difference
            this._itemLoop && this._isLegal && (this._listItemCount = this._itemMaxCount);
        } else {
            this._listItemCount = this._itemSize;
        }

        const contentTrans = this.content.getComponent(UITransform);
        if (this.layoutType == LayoutType.VERTICAL || this.layoutType == LayoutType.GRID_VERTICAL) {
            const contentHeight = (this._itemRect.height + this.spacingY) * Math.ceil(this._itemSize / this._colCount) + this.margin.x + this.margin.z - this.spacingY;
            contentTrans.height = contentHeight;
            contentTrans.width = listTrans.width;
        }
        if (this.layoutType == LayoutType.HORIZONTAL || this.layoutType == LayoutType.GRID_HORIZONTAL) {
            const contentWidth = (this._itemRect.width + this.spacingX) * Math.ceil(this._itemSize / this._rowCount) + this.margin.w + this.margin.y - this.spacingX;
            contentTrans.width = contentWidth;
            contentTrans.height = listTrans.height;
        }

        this._itemCount = 0;
        if (this.frameRender) {
            this._isGenerating = true;
            return;
        };

        this._isGenerating = false;
        this._instantiateItem(this._listItemCount);
    }

    private _instantiateItem(count: number) {
        for (let i = 0; i < count; i++) {
            if (this._itemCount >= this._listItemCount) {
                this._isGenerating = false;
                return;
            }
            const itemNode = instantiate(this._item);
            this._posRefreshFunc(this._itemCount, itemNode);
            if (itemNode.parent === this.content) {
                const link: ListItemLink = { node: itemNode, prev: this._itemTail, next: null };
                if (this._itemTail) {
                    this._itemTail.next = link;
                } else {
                    this._itemHead = link;
                }
                this._itemTail = link;
                this._itemCount++;
            }
        }
    }

    private initAnchor() {
        const contentTrans = this.content.getComponent(UITransform);
        const parentNode = this.content.parent;
        const parentTrans = parentNode.getComponent(UITransform);
        let parentWidget = parentTrans.getComponent(Widget);
        if (!parentWidget) {
            parentWidget = parentNode.addComponent(Widget);
        }
        parentWidget.isAlignTop = true;
        parentWidget.isAlignBottom = true;
        parentWidget.isAlignLeft = true;
        parentWidget.isAlignRight = true;
        parentWidget.left = 0;
        parentWidget.right = 0;
        parentWidget.top = 0;
        parentWidget.bottom = 0;

        switch (this.layoutType) {
            case LayoutType.HORIZONTAL:
                parentTrans.anchorX = this.reverse ? 1 : 0;
                contentTrans.anchorX = this.reverse ? 1 : 0;
                parentTrans.anchorY = 0.5;
                contentTrans.anchorY = 0.5;
                break;
            case LayoutType.VERTICAL:
                parentTrans.anchorY = this.reverse ? 0 : 1;
                contentTrans.anchorY = this.reverse ? 0 : 1;
                parentTrans.anchorX = 0.5;
                contentTrans.anchorX = 0.5;
                break;
            case LayoutType.GRID_HORIZONTAL:
                parentTrans.anchorY = 1;
                contentTrans.anchorY = 1;
                parentTrans.anchorX = this.reverse ? 1 : 0;
                contentTrans.anchorX = this.reverse ? 1 : 0;
                break;
            case LayoutType.GRID_VERTICAL:
                parentTrans.anchorX = 0;
                contentTrans.anchorX = 0;
                parentTrans.anchorY = this.reverse ? 0 : 1;
                contentTrans.anchorY = this.reverse ? 0 : 1;
                break;
        }
        parentWidget.updateAlignment();
        this.scheduleOnce(() => this.content.setPosition(0, 0));
    }
    private _generateGridHorizontal(index: number, item: Node) {
        let dataIndex: number = index;
        let posIndex: number = index;
        if (this.virture && this.itemLoop) {
            dataIndex = this._countLoopIndex(index);
            index < 0 && (posIndex = Math.abs(index) - 1);
        }
        const exists = this._itemRefreshFunc(dataIndex, item);
        if (!exists) {
            item.active = false;
            return;
        }
        item.name = `${index}`;
        item.active = true;
        item.setParent(this.content);
        const itemTrans = item.getComponent(UITransform);
        const row = posIndex % this._rowCount;
        const col = ~~(posIndex / this._rowCount);
        let margin = this.reverse ? this.margin.y : this.margin.w;
        this.virture && this.itemLoop && (margin = 0);
        let xPos = margin + (this._itemRect.width + this.spacingX) * col + this._itemRect.width * itemTrans.anchorX;
        let yPos = this.margin.x + (this._itemRect.height + this.spacingY) * row + this._itemRect.height * itemTrans.anchorY;
        xPos = this.reverse ? -xPos : xPos;
        yPos = -yPos;
        if (index < 0 && this.itemLoop) {
            this.reverse && (xPos = -xPos + this.spacingX);
            !this.reverse && (xPos = -xPos - this.spacingX);
        }
        item.setPosition(xPos, yPos);
    }
    private _generateGridVertical(index: number, item: Node) {
        let dataIndex: number = index;
        let posIndex: number = index;
        if (this.virture && this.itemLoop) {
            dataIndex = this._countLoopIndex(index);
            index < 0 && (posIndex = Math.abs(index) - 1);
        }
        const exists = this._itemRefreshFunc(dataIndex, item);
        if (!exists) {
            item.active = false;
            return;
        }
        item.name = `${index}`;
        item.active = true;
        item.setParent(this.content);
        const itemTrans = item.getComponent(UITransform);
        const row = ~~(posIndex / this._colCount);
        const col = posIndex % this._colCount;
        let margin = this.reverse ? this.margin.z : this.margin.x;
        this.virture && this.itemLoop && (margin = 0);
        let xPos = this.margin.w + (this._itemRect.width + this.spacingX) * col + this._itemRect.width * itemTrans.anchorX;
        let yPos = margin + (this._itemRect.height + this.spacingY) * row + this._itemRect.height * itemTrans.anchorY;
        yPos = this.reverse ? yPos : -yPos;
        if (index < 0 && this.itemLoop) {
            this.reverse && (yPos = -yPos - this.spacingY);
            !this.reverse && (yPos = -yPos + this.spacingY);
        }
        item.setPosition(xPos, yPos);
    }
    private _generateVertical(index: number, item: Node) {
        let dataIndex: number = index;
        let posIndex: number = index;
        if (this.virture && this.itemLoop) {
            dataIndex = this._countLoopIndex(index);
            index < 0 && (posIndex = Math.abs(index) - 1);
        }
        const exists = this._itemRefreshFunc(dataIndex, item);
        if (!exists) {
            item.active = false;
            return;
        }
        item.name = `${index}`;
        item.active = true;
        item.setParent(this.content);
        const itemTrans = item.getComponent(UITransform);
        let margin = this.reverse ? this.margin.z : this.margin.x;
        this.virture && this.itemLoop && (margin = 0);
        let colPos = margin + (this._itemRect.height + this.spacingY) * posIndex + this._itemRect.height * itemTrans.anchorY;
        colPos = this.reverse ? colPos : -colPos;
        if (index < 0 && this.itemLoop) {
            this.reverse && (colPos = -colPos - this.spacingY);
            !this.reverse && (colPos = -colPos + this.spacingY);
        }
        item.setPosition(0, colPos);
    }
    private _generateHorizontal(index: number, item: Node) {
        let dataIndex: number = index;
        let posIndex: number = index;
        if (this.virture && this.itemLoop) {
            dataIndex = this._countLoopIndex(index);
            index < 0 && (posIndex = Math.abs(index) - 1);
        }
        const exists = this._itemRefreshFunc(dataIndex, item);
        if (!exists) {
            item.active = false;
            return;
        }
        item.name = `${index}`;
        item.active = true;
        item.setParent(this.content);
        const itemTrans = item.getComponent(UITransform);
        let margin = this.reverse ? this.margin.y : this.margin.w;
        this.virture && this.itemLoop && (margin = 0);
        let rowPos = margin + (this._itemRect.width + this.spacingX) * posIndex + this._itemRect.width * itemTrans.anchorX;
        rowPos = this.reverse ? -rowPos : rowPos;
        if (index < 0 && this.itemLoop) {
            this.reverse && (rowPos = -rowPos + this.spacingX);
            !this.reverse && (rowPos = -rowPos - this.spacingX);
        }
        item.setPosition(rowPos, 0);
    }

    private _getGridHorizontalPos(index: number): Vec2 {
        let dataIndex: number = index;
        let posIndex: number = index;
        if (this.virture && this.itemLoop) {
            dataIndex = this._countLoopIndex(index);
            index < 0 && (posIndex = Math.abs(index) - 1);
        }
        if (dataIndex < 0 || dataIndex >= this._itemSize) {
            return;
        }
        const itemTrans = this._item.getComponent(UITransform);
        const row = posIndex % this._rowCount;
        const col = ~~(posIndex / this._rowCount);
        let margin = this.reverse ? this.margin.y : this.margin.w;
        this.virture && this.itemLoop && (margin = 0);
        let xPos = margin + (this._itemRect.width + this.spacingX) * col + this._itemRect.width * itemTrans.anchorX;
        xPos = this.reverse ? -xPos : xPos;
        if (index < 0 && this.itemLoop) {
            this.reverse && (xPos = -xPos + this.spacingX);
            !this.reverse && (xPos = -xPos - this.spacingX);
        }
        return v2(xPos, 0);
    }
    private _getGridVerticalPos(index: number) {
        let dataIndex: number = index;
        let posIndex: number = index;
        if (this.virture && this.itemLoop) {
            dataIndex = this._countLoopIndex(index);
            index < 0 && (posIndex = Math.abs(index) - 1);
        }
        if (dataIndex < 0 || dataIndex >= this._itemSize) {
            return;
        }
        const itemTrans = this._item.getComponent(UITransform);
        const row = ~~(posIndex / this._colCount);
        let margin = this.reverse ? this.margin.z : this.margin.x;
        this.virture && this.itemLoop && (margin = 0);
        let yPos = margin + (this._itemRect.height + this.spacingY) * row + this._itemRect.height * itemTrans.anchorY;
        yPos = this.reverse ? yPos : -yPos;
        if (index < 0 && this.itemLoop) {
            this.reverse && (yPos = -yPos - this.spacingY);
            !this.reverse && (yPos = -yPos + this.spacingY);
        }
        return v2(0, yPos);
    }
    private _getVerticalPos(index: number) {
        let dataIndex: number = index;
        let posIndex: number = index;
        if (this.virture && this.itemLoop) {
            dataIndex = this._countLoopIndex(index);
            index < 0 && (posIndex = Math.abs(index) - 1);
        }
        if (dataIndex < 0 || dataIndex >= this._itemSize) {
            return;
        }
        const itemTrans = this._item.getComponent(UITransform);
        let margin = this.reverse ? this.margin.z : this.margin.x;
        this.virture && this.itemLoop && (margin = 0);
        let colPos = margin + (this._itemRect.height + this.spacingY) * posIndex + this._itemRect.height * itemTrans.anchorY;
        colPos = this.reverse ? colPos : -colPos;
        if (index < 0 && this.itemLoop) {
            this.reverse && (colPos = -colPos - this.spacingY);
            !this.reverse && (colPos = -colPos + this.spacingY);
        }
        return v2(0, colPos);
    }
    private _getHorizontalPos(index: number) {
        let dataIndex: number = index;
        let posIndex: number = index;
        if (this.virture && this.itemLoop) {
            dataIndex = this._countLoopIndex(index);
            index < 0 && (posIndex = Math.abs(index) - 1);
        }
        if (dataIndex < 0 || dataIndex >= this._itemSize) {
            return;
        }
        const itemTrans = this._item.getComponent(UITransform);
        let margin = this.reverse ? this.margin.y : this.margin.w;
        this.virture && this.itemLoop && (margin = 0);
        let rowPos = margin + (this._itemRect.width + this.spacingX) * posIndex + this._itemRect.width * itemTrans.anchorX;
        rowPos = this.reverse ? -rowPos : rowPos;
        if (index < 0 && this.itemLoop) {
            this.reverse && (rowPos = -rowPos + this.spacingX);
            !this.reverse && (rowPos = -rowPos - this.spacingX);
        }
        return v2(rowPos, 0);
    }

    private _countLoopIndex(index: number): number {
        if (index >= 0) return index % this._itemSize;
        const reverseIndex = Math.abs(index) % this._itemSize;
        return this._itemSize - reverseIndex - 1;
    }

    private _moveItemToEnd(toTail: boolean): void {
        if (!this._itemHead || this._itemHead === this._itemTail) return;
        if (toTail) {
            const link = this._itemHead;
            this._itemHead = link.next;
            this._itemHead.prev = null;
            link.prev = this._itemTail;
            link.next = null;
            this._itemTail.next = link;
            this._itemTail = link;
        } else {
            const link = this._itemTail;
            this._itemTail = link.prev;
            this._itemTail.next = null;
            link.prev = null;
            link.next = this._itemHead;
            this._itemHead.prev = link;
            this._itemHead = link;
        }
    }

    private _refreshVirtualList(deltaMove: Vec3) {
        if (!this.content || !this._itemRect) return;
        const len = this._itemCount;
        const capacity = this._rowCount * this._colCount;
        if (len === 0 || len < capacity) {
            return;
        }
        const pos = this.content.position;

        const top = this._topBoundary - pos.y;
        const bottom = this._bottomBoundary - pos.y;
        const left = this._leftBoundary - pos.x;
        const right = this._rightBoundary - pos.x;

        const width = this._itemRect.width;
        const height = this._itemRect.height;
        const anchorX = this._itemRect.x;
        const anchorY = this._itemRect.y;

        let itemNode: Node = null;
        let itemX: number = 0;
        let itemY: number = 0;
        let itemIndex: number = 0;
        let toTail: boolean = false;
        let increment: number = 0;

        if (deltaMove.x < 0) {
            toTail = !this.reverse;
            increment = this.reverse ? -capacity : capacity;
            while (true) {
                itemNode = (toTail ? this._itemHead : this._itemTail).node;
                itemX = itemNode.x + width * (1 - anchorX);
                if (itemX >= left) {
                    break;
                }
                itemIndex = +itemNode.name + increment;
                if (!this.itemLoop && (itemIndex >= this._itemSize || itemIndex < 0)) {
                    break;
                }
                this._posRefreshFunc(itemIndex, itemNode);
                this._moveItemToEnd(toTail);
            }
        }

        if (deltaMove.x > 0) {
            toTail = this.reverse;
            increment = this.reverse ? capacity : -capacity;
            while (true) {
                itemNode = (toTail ? this._itemHead : this._itemTail).node;
                itemX = itemNode.x - width * anchorX;
                if (itemX <= right) {
                    break;
                }
                itemIndex = +itemNode.name + increment;
                if (!this.itemLoop && (itemIndex >= this._itemSize || itemIndex < 0)) {
                    break;
                }
                this._posRefreshFunc(itemIndex, itemNode);
                this._moveItemToEnd(toTail);
            }
        }
        if (deltaMove.y > 0) {
            toTail = !this.reverse;
            increment = this.reverse ? -capacity : capacity;
            while (true) {
                itemNode = (toTail ? this._itemHead : this._itemTail).node;
                itemY = itemNode.y - height * (1 - anchorY);
                if (itemY <= top) {
                    break;
                }
                itemIndex = +itemNode.name + increment;
                if (!this.itemLoop && (itemIndex >= this._itemSize || itemIndex < 0)) {
                    break;
                }
                this._posRefreshFunc(itemIndex, itemNode);
                this._moveItemToEnd(toTail);
            }
        };

        if (deltaMove.y < 0) {
            toTail = this.reverse;
            increment = this.reverse ? capacity : -capacity;
            while (true) {
                itemNode = (toTail ? this._itemHead : this._itemTail).node;
                itemY = itemNode.y + height * anchorY;
                if (itemY >= bottom) {
                    break;
                }
                itemIndex = +itemNode.name + increment;
                if (!this.itemLoop && (itemIndex >= this._itemSize || itemIndex < 0)) {
                    break;
                }
                this._posRefreshFunc(itemIndex, itemNode);
                this._moveItemToEnd(toTail);
            }
        };
    }
    //#endregion
}
