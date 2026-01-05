import { MapSchema } from "@colyseus/schema";
import { Enemy } from "../schema/Enemy";
import { Player } from "../schema/Player";
import { WorldMap } from "../schema/World";
import { BaseEnemy } from "../enemies/BaseEnemy";
import { Slime } from "../enemies/Slime";
import { Skeleton } from "../enemies/Skeleton";
import { Bat } from "../enemies/Bat";
import { TILE_SIZE, BLOCK_TYPE } from "../../../shared/src/constants";

type EnemyConstructor = new (id: string, x: number, y: number) => BaseEnemy;

const ENEMY_TYPES: Record<string, EnemyConstructor> = {
    slime: Slime,
    skeleton: Skeleton,
    bat: Bat,
};

export class EnemySystem {
    private enemies: Map<string, BaseEnemy> = new Map();
    private nextEnemyId: number = 0;
    private worldMap?: WorldMap;

    constructor(
        private enemySchemas: MapSchema<Enemy>,
        private players: MapSchema<Player>
    ) {}

    setWorldMap(worldMap: WorldMap): void {
        this.worldMap = worldMap;
    }

    spawnEnemy(type: string, x: number, y: number): BaseEnemy | null {
        const EnemyClass = ENEMY_TYPES[type];
        if (!EnemyClass) {
            console.warn(`Unknown enemy type: ${type}`);
            return null;
        }

        const id = `enemy_${this.nextEnemyId++}`;
        const enemy = new EnemyClass(id, x, y);

        this.enemies.set(id, enemy);
        this.enemySchemas.set(id, enemy.getSchema());

        return enemy;
    }

    spawnRandomEnemies(count: number): void {
        if (!this.worldMap) return;

        const types = Object.keys(ENEMY_TYPES);

        for (let i = 0; i < count; i++) {
            const spawnPos = this.findSpawnPosition();
            if (spawnPos) {
                const type = types[Math.floor(Math.random() * types.length)];
                this.spawnEnemy(type, spawnPos.x, spawnPos.y);
            }
        }
    }

    private findSpawnPosition(): { x: number; y: number } | null {
        if (!this.worldMap) return null;

        for (let attempts = 0; attempts < 100; attempts++) {
            const tileX = Math.floor(Math.random() * this.worldMap.width);
            const tileY = Math.floor(Math.random() * this.worldMap.height);
            const block = this.worldMap.getBlock(tileX, tileY);

            if (block && block.blockType === BLOCK_TYPE.GRASS) {
                return {
                    x: tileX * TILE_SIZE + TILE_SIZE / 2,
                    y: tileY * TILE_SIZE + TILE_SIZE / 2,
                };
            }
        }

        return null;
    }

    removeEnemy(id: string): void {
        this.enemies.delete(id);
        this.enemySchemas.delete(id);
    }

    update(deltaTime: number): void {
        if (!this.worldMap) return;

        for (const [id, enemy] of this.enemies.entries()) {
            if (!enemy.isAlive()) {
                this.removeEnemy(id);
                continue;
            }

            enemy.update(deltaTime, this.worldMap, this.players);
        }
    }

    damageEnemy(id: string, amount: number): boolean {
        const enemy = this.enemies.get(id);
        if (enemy) {
            enemy.takeDamage(amount);
            return true;
        }
        return false;
    }

    getEnemy(id: string): BaseEnemy | undefined {
        return this.enemies.get(id);
    }
}