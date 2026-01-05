import { MapSchema } from "@colyseus/schema";
import { Player } from "../schema/Player";
import { WorldMap } from "../schema/World";
import { InputPayload } from "../../../shared/src/types";
import { PLAYER_VELOCITY, TILE_SIZE, BLOCK_TYPE } from "../../../shared/src/constants";
import { PLAYER_SIZE, PLAYER_SPAWN_X, PLAYER_SPAWN_Y } from "../serverConstants";
import { PlayerCollisionManager } from "./PlayerCollisionManager";

export class PlayerSystem {
    private inputQueues: Map<string, InputPayload[]> = new Map();
    private worldMap?: WorldMap;
    private playerCollisionManager: PlayerCollisionManager;

    constructor(private players: MapSchema<Player>) {
        this.playerCollisionManager = new PlayerCollisionManager(players);
    }

    setWorldMap(worldMap: WorldMap): void {
        this.worldMap = worldMap;
    }

    addPlayer(sessionId: string): void {
        const player = new Player();
        const spawnPos = this.findSpawnPosition();
        player.x = spawnPos.x;
        player.y = spawnPos.y;
        this.players.set(sessionId, player);
        this.inputQueues.set(sessionId, []);
    }

    private findSpawnPosition(): { x: number; y: number } {
        if (!this.worldMap) {
            return { x: PLAYER_SPAWN_X, y: PLAYER_SPAWN_Y };
        }

        for (let attempts = 0; attempts < 100; attempts++) {
            const tileX = Math.floor(Math.random() * this.worldMap.width);
            const tileY = Math.floor(Math.random() * this.worldMap.height);
            const block = this.worldMap.getBlock(tileX, tileY);

            if (block && block.blockType === BLOCK_TYPE.GRASS) {
                const x = tileX * TILE_SIZE + TILE_SIZE / 2;
                const y = tileY * TILE_SIZE + TILE_SIZE / 2;

                // Make sure spawn doesn't overlap with existing players
                if (!this.playerCollisionManager.checkCollision("", x, y)) {
                    return { x, y };
                }
            }
        }

        return { x: PLAYER_SPAWN_X, y: PLAYER_SPAWN_Y };
    }

    removePlayer(sessionId: string): void {
        this.players.delete(sessionId);
        this.inputQueues.delete(sessionId);
    }

    queueInput(sessionId: string, input: InputPayload): void {
        const queue = this.inputQueues.get(sessionId);
        if (queue) {
            queue.push(input);
        }
    }

    processInputs(): void {
        this.players.forEach((player, sessionId) => {
            const queue = this.inputQueues.get(sessionId);
            if (!queue) return;

            while (queue.length > 0) {
                const input = queue.shift()!;
                this.applyInput(sessionId, player, input);
            }
        });

        // Resolve any player overlaps after all movement
        this.playerCollisionManager.resolveOverlaps();
    }

    private applyInput(sessionId: string, player: Player, input: InputPayload): void {
        let newX = player.x;
        let newY = player.y;

        if (input.left) newX -= PLAYER_VELOCITY;
        if (input.right) newX += PLAYER_VELOCITY;
        if (input.up) newY -= PLAYER_VELOCITY;
        if (input.down) newY += PLAYER_VELOCITY;

        if (this.canMoveTo(sessionId, newX, newY)) {
            player.x = newX;
            player.y = newY;
        } else {
            // Try moving on each axis separately
            if (this.canMoveTo(sessionId, newX, player.y)) {
                player.x = newX;
            }
            if (this.canMoveTo(sessionId, player.x, newY)) {
                player.y = newY;
            }
        }
    }

    private canMoveTo(sessionId: string, x: number, y: number): boolean {
        // Check world collision
        if (!this.canMoveToWorld(x, y)) {
            return false;
        }

        // Check player collision
        if (this.playerCollisionManager.checkCollision(sessionId, x, y)) {
            return false;
        }

        return true;
    }

    private canMoveToWorld(x: number, y: number): boolean {
        if (!this.worldMap) return true;

        const playerSize = PLAYER_SIZE / 2;
        const corners = [
            { x: x - playerSize, y: y - playerSize },
            { x: x + playerSize, y: y - playerSize },
            { x: x - playerSize, y: y + playerSize },
            { x: x + playerSize, y: y + playerSize },
        ];

        for (const corner of corners) {
            const tileX = Math.floor(corner.x / TILE_SIZE);
            const tileY = Math.floor(corner.y / TILE_SIZE);
            const block = this.worldMap.getBlock(tileX, tileY);

            if (block && block.blockType !== BLOCK_TYPE.GRASS) {
                return false;
            }
        }

        return true;
    }
}