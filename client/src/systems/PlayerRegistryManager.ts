import Phaser from "phaser";
import { PLAYER_SIZE } from "../../../shared/src/constants";

type PlayerEntity = Phaser.Types.Physics.Arcade.ImageWithDynamicBody;

export class PlayerRegistryManager {
    private entities: Map<string, PlayerEntity> = new Map();
    private localSessionId?: string;

    constructor(private scene: Phaser.Scene) {}

    add(sessionId: string, x: number, y: number, isLocal: boolean = false): PlayerEntity {
        const entity = this.scene.physics.add.image(x, y, "ship_0001");

        // Scale sprite to match PLAYER_SIZE and set physics body
        entity.setDisplaySize(PLAYER_SIZE, PLAYER_SIZE);
        entity.body.setSize(PLAYER_SIZE, PLAYER_SIZE);

        this.entities.set(sessionId, entity);

        if (isLocal) {
            this.localSessionId = sessionId;
        }

        return entity;
    }

    remove(sessionId: string): void {
        const entity = this.entities.get(sessionId);
        if (entity) {
            entity.destroy();
            this.entities.delete(sessionId);
        }
    }

    get(sessionId: string): PlayerEntity | undefined {
        return this.entities.get(sessionId);
    }

    getRemotePlayers(): PlayerEntity[] {
        const remote: PlayerEntity[] = [];
        for (const [sessionId, entity] of this.entities) {
            if (sessionId !== this.localSessionId) {
                remote.push(entity);
            }
        }
        return remote;
    }
}