import Phaser from "phaser";
import { PLAYER_VELOCITY } from "../../../shared/src/constants";
import { InputPayload } from "../../../shared/src/types";
import { SNAP_THRESHOLD, CORRECTION_SPEED, CORRECTION_THRESHOLD } from "../clientConstants";
import { CollisionManager } from "./CollisionManager";

type PlayerEntity = Phaser.Types.Physics.Arcade.ImageWithDynamicBody;

export class LocalPlayerManager {
    private entity?: PlayerEntity;
    private serverX = 0;
    private serverY = 0;
    private debugRef?: Phaser.GameObjects.Rectangle;

    constructor(
        private scene: Phaser.Scene,
        private collisionManager: CollisionManager
    ) {}

    initialize(entity: PlayerEntity, x: number, y: number, debug: boolean = false): void {
        this.entity = entity;
        this.serverX = x;
        this.serverY = y;

        if (debug) {
            this.debugRef = this.scene.add.rectangle(0, 0, entity.width, entity.height);
            this.debugRef.setStrokeStyle(1, 0xff0000);
        }
    }

    applyInput(input: InputPayload): void {
        if (!this.entity) return;

        const currentX = this.entity.x;
        const currentY = this.entity.y;

        let newX = currentX;
        let newY = currentY;

        if (input.left) newX -= PLAYER_VELOCITY;
        if (input.right) newX += PLAYER_VELOCITY;
        if (input.up) newY -= PLAYER_VELOCITY;
        if (input.down) newY += PLAYER_VELOCITY;

        if (this.collisionManager.canMoveTo(newX, newY)) {
            this.entity.x = newX;
            this.entity.y = newY;
        } else {
            if (this.collisionManager.canMoveTo(newX, currentY)) {
                this.entity.x = newX;
            }
            if (this.collisionManager.canMoveTo(this.entity.x, newY)) {
                this.entity.y = newY;
            }
        }
    }

    onServerUpdate(x: number, y: number): void {
        this.serverX = x;
        this.serverY = y;

        if (this.debugRef) {
            this.debugRef.x = x;
            this.debugRef.y = y;
        }
    }

    reconcile(): void {
        if (!this.entity) return;

        const dx = this.serverX - this.entity.x;
        const dy = this.serverY - this.entity.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > SNAP_THRESHOLD) {
            console.log(`Snapping to server position (distance: ${distance.toFixed(1)})`);
            this.entity.x = this.serverX;
            this.entity.y = this.serverY;
        } else if (distance > CORRECTION_THRESHOLD) {
            this.entity.x += dx * CORRECTION_SPEED;
            this.entity.y += dy * CORRECTION_SPEED;
        }
    }

    hasPlayer(): boolean {
        return !!this.entity;
    }

    getPosition(): { x: number; y: number } | null {
        if (!this.entity) return null;
        return { x: this.entity.x, y: this.entity.y };
    }
}