import { _decorator, UIRenderer, Component, Color, clamp, director, Director, Sprite, Label } from 'cc';
import { DEV, JSB } from 'cc/env';
const { ccclass, property, executeInEditMode, requireComponent, menu } = _decorator;
@ccclass
@executeInEditMode
@requireComponent(UIRenderer)
@menu('Public/Palette')
export class Palette extends Component {
    @property
    private _colorLB: Color = new Color(255, 255, 255, 255);
    @property({ displayName: DEV && 'LB' })
    private get colorLB() { return this._colorLB };
    private set colorLB(value: Color) {
        this._colorLB = value;
        this.updateColor();
    }
    @property
    private _colorRB: Color = new Color(255, 255, 255, 255);
    @property({ displayName: DEV && 'RB' })
    private get colorRB() { return this._colorRB };
    private set colorRB(value: Color) {
        this._colorRB = value;
        this.updateColor();
    }
    @property
    private _colorLT: Color = new Color(255, 255, 255, 255);
    @property({ displayName: DEV && 'LT' })
    private get colorLT() { return this._colorLT };
    private set colorLT(value: Color) {
        this._colorLT = value;
        this.updateColor();
    }
    @property
    private _colorRT: Color = new Color(255, 255, 255, 255);
    @property({ displayName: DEV && 'RT' })
    private get colorRT() { return this._colorRT };
    private set colorRT(value: Color) {
        this._colorRT = value;
        this.updateColor();
    }

    private ur: UIRenderer = null;
    private hue: number[] = [1, 1, 1];
    protected onLoad() {
        this.ur = this.node.getComponent(UIRenderer);
        if (!(this.ur instanceof Sprite || this.ur instanceof Label)) {
            WARN('Palette 需要一个 Sprite 或 Label');
            this.destroy();
            return;
        }
        this.ur['_useVertexOpacity'] = true;
    }
    protected onEnable() {
        director.once(Director.EVENT_AFTER_DRAW, this.updateColor, this);
    }
    protected onDisable() {
        if (!this.ur['_renderData']) return;
        let vb = this.ur['_renderData'].chunk.vb;
        let color = this.ur.color;
        vb[5] = vb[14] = vb[23] = vb[32] = color.r / 255;
        vb[6] = vb[15] = vb[24] = vb[33] = color.g / 255;
        vb[7] = vb[16] = vb[25] = vb[34] = color.b / 255;
        vb[8] = vb[17] = vb[26] = vb[35] = color.a / 255;
    }
    private updateColor() {
        let vb = this.ur['_renderData'].chunk.vb;
        let lb = this._colorLB, rb = this._colorRB, lt = this._colorLT, rt = this._colorRT;
        let d = 1 / 255, h = this.hue, r = h[0] * d, g = h[1] * d, b = h[2] * d;
        vb[5] = lb.r * r; vb[6] = lb.g * g; vb[7] = lb.b * b; vb[8] = lb.a / 255;
        vb[14] = rb.r * r; vb[15] = rb.g * g; vb[16] = rb.b * b; vb[17] = rb.a / 255;
        vb[23] = lt.r * r; vb[24] = lt.g * g; vb[25] = lt.b * b; vb[26] = lt.a / 255;
        vb[32] = rt.r * r; vb[33] = rt.g * g; vb[34] = rt.b * b; vb[35] = rt.a / 255;
    }
}