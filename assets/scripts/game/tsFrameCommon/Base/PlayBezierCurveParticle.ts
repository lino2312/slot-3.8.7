import Utils from "./MyUtils";
import { _decorator, Component, Vec2, Vec3, ParticleSystem2D, v3 } from 'cc';
const { ccclass, property } = _decorator;

@ccclass
export default class PlayBezierCurveParticle extends Component {

    // LIFE-CYCLE CALLBACKS:

    isParticlePlay = false;
    cbParticleAniFinished: Function = null;
    playParticleTime = 0;
    playParticleTotalTime = 2;
    playParticlePosList: Vec2[] = [];

    onLoad () {

    }

    start () {
        
    }

    protected onDisable(): void {
        const particle = this.node.getComponent(ParticleSystem2D);
        if (particle) {
            particle.resetSystem();
        }
    }

    update (dt) {
        if (this.isParticlePlay) {
            this.playParticleTime += dt;
            if (this.playParticleTime < this.playParticleTotalTime) {
                let posIndex = Math.floor(this.playParticleTime/this.playParticleTotalTime*this.playParticlePosList.length);
                let pos = this.playParticlePosList[posIndex];
                this.node.position = v3(pos.x, pos.y, 0);
            } else {
                this.isParticlePlay = false;
                if (this.cbParticleAniFinished) {
                    this.cbParticleAniFinished();
                }
            }
        }
    }

    playParticle(aniTime: number, pointNum: number, posStart: Vec2, posEnd: Vec2, posControl: Vec2, callback: Function) {
        this.playParticleTotalTime = aniTime;
        this.cbParticleAniFinished = callback;
        this.playParticlePosList = [];
        for (let i = 0; i < pointNum; i++) {
            let point = Utils.getBezierCurve(1/(pointNum-1)*i, posStart, posEnd, posControl);
            this.playParticlePosList.push(point);
        }
        this.node.position = v3(posStart.x, posStart.y, 0);
        this.playParticleTime = 0;
        this.isParticlePlay = true;
    }

}
