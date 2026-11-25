import { _decorator, Component, Node } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('TreasureHunterMineral')
export class TreasureHunterMineral extends Component {
    speedMult: number = 1;
    value: number = 1;
    
    checkCb: Function = null;
}