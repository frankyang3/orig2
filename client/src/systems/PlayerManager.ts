import Phaser from "phaser";
import { PLAYER_VELOCITY, TILE_SIZE, BLOCK_TYPE, WORLD_WIDTH } from "../../../shared/src/constants";
import { InputPayload } from "../../../shared/src/types";
import { INTERPOLATION_SPEED, SNAP_THRESHOLD, CORRECTION_SPEED, CORRECTION_THRESHOLD } from "../clientConstants";


type PlayerEntity = Phaser.Types.Physics.Arcade.ImageWithDynamicBody;



export class PlayerManager {
    private entities: Map<string, PlayerEntity> = new Map();
    private localPlayer?: PlayerEntity;
    private localSessionId?: string;
    private worldBlocks?: { blockType: number }[];

    // Server reconciliation
    private serverX = 0;
    private serverY = 0;

    // Debug visualization
    private remoteRef?: Phaser.GameObjects.Rectangle;

    constructor(private scene: Phaser.Scene) { }

    setWorldData(blocks: { blockType: number }[]): void {
        this.worldBlocks = blocks;
    }

    updateBlockType(index: number, blockType: number): void {
        if (this.worldBlocks && index < this.worldBlocks.length) {
            this.worldBlocks[index].blockType = blockType;
        }
    }

    addPlayer(sessionId: string, x: number, y: number, isLocal: boolean): PlayerEntity {
        const entity = this.scene.physics.add.image(x, y, "ship_0001");
        this.entities.set(sessionId, entity);

        if (isLocal) {
            this.localPlayer = entity;
            this.localSessionId = sessionId;
            this.serverX = x;
            this.serverY = y;
            this.remoteRef = this.scene.add.rectangle(0, 0, entity.width, entity.height);
            this.remoteRef.setStrokeStyle(1, 0xff0000);
        }

        return entity;
    }

    removePlayer(sessionId: string): void {
        const entity = this.entities.get(sessionId);
        if (entity) {
            entity.destroy();
            this.entities.delete(sessionId);
        }
    }

    updateRemoteRef(x: number, y: number): void {
        if (this.remoteRef) {
            this.remoteRef.x = x;
            this.remoteRef.y = y;
        }
    }

    // Called when we receive server position for local player
    onServerUpdate(x: number, y: number): void {
        this.serverX = x;
        this.serverY = y;
    }

    setServerPosition(sessionId: string, x: number, y: number): void {
        const entity = this.entities.get(sessionId);
        if (entity) {
            entity.setData("serverX", x);
            entity.setData("serverY", y);
        }
    }

    applyInput(input: InputPayload): void {
        if (!this.localPlayer) return;

        const currentX = this.localPlayer.x;
        const currentY = this.localPlayer.y;

        let newX = currentX;
        let newY = currentY;

        if (input.left) newX -= PLAYER_VELOCITY;
        if (input.right) newX += PLAYER_VELOCITY;
        if (input.up) newY -= PLAYER_VELOCITY;
        if (input.down) newY += PLAYER_VELOCITY;

        // Check collision and update position
        if (this.canMoveTo(newX, newY)) {
            this.localPlayer.x = newX;
            this.localPlayer.y = newY;
        } else {
            // Try moving on each axis separately
            if (this.canMoveTo(newX, currentY)) {
                this.localPlayer.x = newX;
            }
            if (this.canMoveTo(this.localPlayer.x, newY)) {
                this.localPlayer.y = newY;
            }
        }
    }

    // Call this every frame to reconcile with server
    reconcileWithServer(): void {
        if (!this.localPlayer) return;

        const dx = this.serverX - this.localPlayer.x;
        const dy = this.serverY - this.localPlayer.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > SNAP_THRESHOLD) {
            // Too far off - snap immediately
            console.log(`Snapping to server position (distance: ${distance.toFixed(1)})`);
            this.localPlayer.x = this.serverX;
            this.localPlayer.y = this.serverY;
        } else if (distance > CORRECTION_THRESHOLD) {
            // Gradually correct towards server position
            this.localPlayer.x += dx * CORRECTION_SPEED;
            this.localPlayer.y += dy * CORRECTION_SPEED;
        }
    }

    private canMoveTo(x: number, y: number): boolean {
        if (!this.worldBlocks) return true;

        const playerSize = 16;
        const corners = [
            { x: x - playerSize, y: y - playerSize },
            { x: x + playerSize, y: y - playerSize },
            { x: x - playerSize, y: y + playerSize },
            { x: x + playerSize, y: y + playerSize },
        ];

        for (const corner of corners) {
            const tileX = Math.floor(corner.x / TILE_SIZE);
            const tileY = Math.floor(corner.y / TILE_SIZE);
            
            if (tileX < 0 || tileY < 0) return false;
            
            const index = tileY * WORLD_WIDTH + tileX;
            const block = this.worldBlocks[index];

            if (block && block.blockType !== BLOCK_TYPE.GRASS) {
                return false;
            }
        }

        return true;
    }

    interpolateRemotePlayers(): void {
        for (const [sessionId, entity] of this.entities) {
            if (sessionId === this.localSessionId) continue;

            const serverX = entity.getData("serverX");
            const serverY = entity.getData("serverY");
            if (serverX !== undefined && serverY !== undefined) {
                entity.x = Phaser.Math.Linear(entity.x, serverX, INTERPOLATION_SPEED);
                entity.y = Phaser.Math.Linear(entity.y, serverY, INTERPOLATION_SPEED);
            }
        }
    }

    hasLocalPlayer(): boolean {
        return !!this.localPlayer;
    }

    getLocalPlayerPosition(): { x: number; y: number } | null {
        if (!this.localPlayer) return null;
        return { x: this.localPlayer.x, y: this.localPlayer.y };
    }
}