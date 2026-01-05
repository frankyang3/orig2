import Phaser from "phaser";
import { INTERPOLATION_SPEED } from "../clientConstants";

interface EnemyEntity {
    sprite: Phaser.GameObjects.Arc;
    label?: Phaser.GameObjects.Text;
}

const SERVER_X = "serverX";
const SERVER_Y = "serverY";

const ENEMY_COLORS: Record<string, number> = {
    slime: 0x44ff44,    // Green
    skeleton: 0xcccccc, // Gray
    bat: 0x8844aa,      // Purple
};

const ENEMY_SIZES: Record<string, number> = {
    slime: 14,
    skeleton: 15,
    bat: 10,
};

export class EnemyRenderer {
    private scene: Phaser.Scene;
    private enemies: Map<string, EnemyEntity> = new Map();

    constructor(scene: Phaser.Scene) {
        this.scene = scene;
    }

    add(id: string, enemyType: string, x: number, y: number): void {
        if (this.enemies.has(id)) return;

        const color = ENEMY_COLORS[enemyType] ?? 0xff0000;
        const radius = ENEMY_SIZES[enemyType] ?? 12;

        const sprite = this.scene.add.circle(x, y, radius, color);
        sprite.setStrokeStyle(2, 0x000000);
        sprite.setDepth(5);
        sprite.setData(SERVER_X, x);
        sprite.setData(SERVER_Y, y);

        // Optional: add enemy type label for debugging
        // const label = this.scene.add.text(x, y - radius - 10, enemyType, {
        //     fontSize: '10px',
        //     color: '#ffffff',
        // }).setOrigin(0.5).setDepth(6);

        this.enemies.set(id, { sprite });
    }

    remove(id: string): void {
        const enemy = this.enemies.get(id);
        if (enemy) {
            enemy.sprite.destroy();
            enemy.label?.destroy();
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

    interpolateAll(): void {
        for (const [, enemy] of this.enemies) {
            const serverX = enemy.sprite.getData(SERVER_X);
            const serverY = enemy.sprite.getData(SERVER_Y);

            if (serverX !== undefined && serverY !== undefined) {
                enemy.sprite.x = Phaser.Math.Linear(enemy.sprite.x, serverX, INTERPOLATION_SPEED);
                enemy.sprite.y = Phaser.Math.Linear(enemy.sprite.y, serverY, INTERPOLATION_SPEED);

                // Update label position if present
                if (enemy.label) {
                    enemy.label.x = enemy.sprite.x;
                    enemy.label.y = enemy.sprite.y - (enemy.sprite.radius ?? 12) - 10;
                }
            }
        }
    }

    clear(): void {
        for (const [id] of this.enemies) {
            this.remove(id);
        }
    }
}