import Phaser from "phaser";
import { ATTACK_RANGE, ATTACK_CONE_HALF_ANGLE } from "../../../shared/src/constants";

const SWING_DURATION_MS = 200;
const SWING_START_ALPHA = 0.5;
const SWING_DEPTH = 20;

interface ActiveSwing {
    graphics: Phaser.GameObjects.Graphics;
    startTime: number;
    x: number;
    y: number;
    angle: number;
}

export class AttackRenderer {
    private scene: Phaser.Scene;
    private swings: ActiveSwing[] = [];

    constructor(scene: Phaser.Scene) {
        this.scene = scene;
    }

    showSwing(x: number, y: number, angle: number): void {
        const graphics = this.scene.add.graphics();
        graphics.setDepth(SWING_DEPTH);

        this.swings.push({
            graphics,
            startTime: this.scene.time.now,
            x,
            y,
            angle,
        });
    }

    update(): void {
        const now = this.scene.time.now;

        for (let i = this.swings.length - 1; i >= 0; i--) {
            const swing = this.swings[i];
            const elapsed = now - swing.startTime;

            if (elapsed >= SWING_DURATION_MS) {
                swing.graphics.destroy();
                this.swings.splice(i, 1);
                continue;
            }

            const progress = elapsed / SWING_DURATION_MS;
            const alpha = SWING_START_ALPHA * (1 - progress);

            swing.graphics.clear();
            swing.graphics.fillStyle(0xffffff, alpha);
            swing.graphics.slice(
                swing.x,
                swing.y,
                ATTACK_RANGE,
                swing.angle - ATTACK_CONE_HALF_ANGLE,
                swing.angle + ATTACK_CONE_HALF_ANGLE,
                false
            );
            swing.graphics.fillPath();
        }
    }
}
