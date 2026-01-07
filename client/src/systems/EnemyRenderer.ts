import Phaser from "phaser";
import { INTERPOLATION_SPEED } from "../clientConstants";
import { HealthBarRenderer } from "./HealthBarRenderer";

interface EnemyEntity {
    sprite: Phaser.GameObjects.Arc;
    id: string;
    health: number;
    maxHealth: number;
}

const SERVER_X = "serverX";
const SERVER_Y = "serverY";

const ENEMY_COLORS: Record<string, number> = {
    slime: 0x44ff44,
    skeleton: 0xcccccc,
    bat: 0x8844aa,
};

const ENEMY_SIZES: Record<string, number> = {
    slime: 14,
    skeleton: 15,
    bat: 10,
};

export class EnemyRenderer {
    private scene: Phaser.Scene;
    private enemies: Map<string, EnemyEntity> = new Map();
    private healthBarRenderer: HealthBarRenderer;

    constructor(scene: Phaser.Scene) {
        this.scene = scene;
        this.healthBarRenderer = new HealthBarRenderer(scene);
    }

    add(id: string, enemyType: string, x: number, y: number, health: number, maxHealth: number): void {
        if (this.enemies.has(id)) return;

        const color = ENEMY_COLORS[enemyType] ?? 0xff0000;
        const radius = ENEMY_SIZES[enemyType] ?? 12;

        const sprite = this.scene.add.circle(x, y, radius, color);
        sprite.setStrokeStyle(2, 0x000000);
        sprite.setDepth(5);
        sprite.setData(SERVER_X, x);
        sprite.setData(SERVER_Y, y);

        this.enemies.set(id, { sprite, id, health, maxHealth });
        this.healthBarRenderer.add(id, x, y, health, maxHealth);
    }

    remove(id: string): void {
        const enemy = this.enemies.get(id);
        if (enemy) {
            enemy.sprite.destroy();
            this.healthBarRenderer.remove(id);
            this.enemies.delete(id);
        }
    }

    setTargetPosition(id: string, x: number, y: number): void {
        const enemy = this.enemies.get(id);
        if (enemy) {
            enemy.sprite.setData(SERVER_X, x);
            enemy.sprite.setData(SERVER_Y, y);
        }
    }

    updateHealth(id: string, health: number, maxHealth: number): void {
        const enemy = this.enemies.get(id);
        if (enemy) {
            enemy.health = health;
            enemy.maxHealth = maxHealth;
        }
    }

    interpolateAll(): void {
        for (const [id, enemy] of this.enemies) {
            const serverX = enemy.sprite.getData(SERVER_X);
            const serverY = enemy.sprite.getData(SERVER_Y);

            if (serverX !== undefined && serverY !== undefined) {
                enemy.sprite.x = Phaser.Math.Linear(enemy.sprite.x, serverX, INTERPOLATION_SPEED);
                enemy.sprite.y = Phaser.Math.Linear(enemy.sprite.y, serverY, INTERPOLATION_SPEED);

                this.healthBarRenderer.update(
                    id,
                    enemy.sprite.x,
                    enemy.sprite.y,
                    enemy.health,
                    enemy.maxHealth
                );
            }
        }
    }

    clear(): void {
        for (const [id] of this.enemies) {
            this.remove(id);
        }
    }
}