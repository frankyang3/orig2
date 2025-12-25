import Phaser from "phaser";
import { PLAYER_VELOCITY, INTERPOLATION_SPEED } from "../../../shared/src/constants";
import { InputPayload } from "../../../shared/src/types";

type PlayerEntity = Phaser.Types.Physics.Arcade.ImageWithDynamicBody;

export class PlayerManager {
    private entities: Map<string, PlayerEntity> = new Map();
    private localPlayer?: PlayerEntity;
    private localSessionId?: string;

    // Debug visualization
    private remoteRef?: Phaser.GameObjects.Rectangle;

    constructor(private scene: Phaser.Scene) { }

    addPlayer(sessionId: string, x: number, y: number, isLocal: boolean): PlayerEntity {
        const entity = this.scene.physics.add.image(x, y, "ship_0001");
        this.entities.set(sessionId, entity);

        if (isLocal) {
            this.localPlayer = entity;
            this.localSessionId = sessionId;
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

    setServerPosition(sessionId: string, x: number, y: number): void {
        const entity = this.entities.get(sessionId);
        if (entity) {
            entity.setData("serverX", x);
            entity.setData("serverY", y);
        }
    }

    applyInput(input: InputPayload): void {
        if (!this.localPlayer) return;

        if (input.left) this.localPlayer.x -= PLAYER_VELOCITY;
        else if (input.right) this.localPlayer.x += PLAYER_VELOCITY;

        if (input.up) this.localPlayer.y -= PLAYER_VELOCITY;
        else if (input.down) this.localPlayer.y += PLAYER_VELOCITY;
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
}