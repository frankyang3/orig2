import { Enemy } from "../schema/Enemy";
import { WorldMap } from "../schema/World";
import { MapSchema } from "@colyseus/schema";
import { Player } from "../schema/Player";
import { TILE_SIZE, BLOCK_TYPE } from "../../../shared/src/constants";

export interface EnemyConfig {
    maxHealth: number;
    speed: number;
    damage: number;
    aggroRange: number;      // Distance to start chasing player
    attackRange: number;     // Distance to attack player
    size: number;            // Collision radius
}

export abstract class BaseEnemy {
    protected schema: Enemy;
    protected config: EnemyConfig;
    protected targetX: number = 0;
    protected targetY: number = 0;
    protected patrolCooldown: number = 0;

    constructor(
        id: string,
        x: number,
        y: number,
        enemyType: string,
        config: EnemyConfig
    ) {
        this.schema = new Enemy();
        this.schema.id = id;
        this.schema.enemyType = enemyType;
        this.schema.x = x;
        this.schema.y = y;
        this.schema.health = config.maxHealth;
        this.schema.maxHealth = config.maxHealth;
        this.config = config;
    }

    getSchema(): Enemy {
        return this.schema;
    }

    getId(): string {
        return this.schema.id;
    }

    isAlive(): boolean {
        return this.schema.health > 0;
    }

    takeDamage(amount: number): void {
        this.schema.health = Math.max(0, this.schema.health - amount);
    }

    update(deltaTime: number, worldMap: WorldMap, players: MapSchema<Player>): void {
        const nearestPlayer = this.findNearestPlayer(players);

        if (nearestPlayer && this.getDistanceTo(nearestPlayer.x, nearestPlayer.y) < this.config.aggroRange) {
            this.onChase(deltaTime, nearestPlayer, worldMap);
        } else {
            this.onPatrol(deltaTime, worldMap);
        }

        this.updatePosition(deltaTime, worldMap);
    }

    protected abstract onPatrol(deltaTime: number, worldMap: WorldMap): void;
    protected abstract onChase(deltaTime: number, target: Player, worldMap: WorldMap): void;

    protected findNearestPlayer(players: MapSchema<Player>): Player | null {
        let nearest: Player | null = null;
        let nearestDistance = Infinity;

        for (const [, player] of players.entries()) {
            const distance = this.getDistanceTo(player.x, player.y);
            if (distance < nearestDistance) {
                nearestDistance = distance;
                nearest = player;
            }
        }

        return nearest;
    }

    protected getDistanceTo(x: number, y: number): number {
        const dx = x - this.schema.x;
        const dy = y - this.schema.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    protected moveToward(targetX: number, targetY: number, speed: number): void {
        const dx = targetX - this.schema.x;
        const dy = targetY - this.schema.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > 1) {
            this.schema.velocityX = (dx / distance) * speed;
            this.schema.velocityY = (dy / distance) * speed;
        } else {
            this.schema.velocityX = 0;
            this.schema.velocityY = 0;
        }
    }

    protected updatePosition(deltaTime: number, worldMap: WorldMap): void {
        const newX = this.schema.x + this.schema.velocityX * deltaTime;
        const newY = this.schema.y + this.schema.velocityY * deltaTime;

        if (this.canMoveTo(newX, newY, worldMap)) {
            this.schema.x = newX;
            this.schema.y = newY;
        } else {
            // Try each axis separately
            if (this.canMoveTo(newX, this.schema.y, worldMap)) {
                this.schema.x = newX;
            } else if (this.canMoveTo(this.schema.x, newY, worldMap)) {
                this.schema.y = newY;
            }
            // Pick a new patrol target if stuck
            this.patrolCooldown = 0;
        }
    }

    protected canMoveTo(x: number, y: number, worldMap: WorldMap): boolean {
        const halfSize = this.config.size / 2;
        const corners = [
            { x: x - halfSize, y: y - halfSize },
            { x: x + halfSize, y: y - halfSize },
            { x: x - halfSize, y: y + halfSize },
            { x: x + halfSize, y: y + halfSize },
        ];

        for (const corner of corners) {
            const tileX = Math.floor(corner.x / TILE_SIZE);
            const tileY = Math.floor(corner.y / TILE_SIZE);
            const block = worldMap.getBlock(tileX, tileY);

            if (!block || block.blockType !== BLOCK_TYPE.GRASS) {
                return false;
            }
        }

        return true;
    }

    protected pickRandomPatrolTarget(worldMap: WorldMap): void {
        const range = 100;
        this.targetX = this.schema.x + (Math.random() - 0.5) * range * 2;
        this.targetY = this.schema.y + (Math.random() - 0.5) * range * 2;
    }
}