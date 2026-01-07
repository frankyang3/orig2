import Phaser from "phaser";

interface HealthBar {
    background: Phaser.GameObjects.Rectangle;
    fill: Phaser.GameObjects.Rectangle;
    border: Phaser.GameObjects.Rectangle;
}

export class HealthBarRenderer {
    private scene: Phaser.Scene;
    private healthBars: Map<string, HealthBar> = new Map();

    private readonly barWidth = 40;
    private readonly barHeight = 6;
    private readonly barOffsetY = -25;

    constructor(scene: Phaser.Scene) {
        this.scene = scene;
    }

    add(id: string, x: number, y: number, health: number, maxHealth: number): void {
        if (this.healthBars.has(id)) return;

        const barY = y + this.barOffsetY;

        // Background (dark gray)
        const background = this.scene.add.rectangle(
            x,
            barY,
            this.barWidth,
            this.barHeight,
            0x333333
        );
        background.setDepth(10);
        background.setOrigin(0.5, 0.5);

        // Health fill (green) - origin at left side for easier width updates
        const healthPercent = Math.max(0, Math.min(1, health / maxHealth));
        const fill = this.scene.add.rectangle(
            x - this.barWidth / 2,
            barY,
            this.barWidth * healthPercent,
            this.barHeight,
            0x44ff44
        );
        fill.setDepth(11);
        fill.setOrigin(0, 0.5); // Left-aligned origin

        // Border
        const border = this.scene.add.rectangle(
            x,
            barY,
            this.barWidth,
            this.barHeight
        );
        border.setStrokeStyle(1, 0x000000);
        border.setFillStyle();
        border.setDepth(12);
        border.setOrigin(0.5, 0.5);

        this.healthBars.set(id, { background, fill, border });
    }

    update(id: string, x: number, y: number, health: number, maxHealth: number): void {
        const bar = this.healthBars.get(id);
        if (!bar) return;

        const barY = y + this.barOffsetY;
        const healthPercent = Math.max(0, Math.min(1, health / maxHealth));
        const fillWidth = Math.max(0, this.barWidth * healthPercent);

        // Update positions
        bar.background.setPosition(x, barY);
        bar.border.setPosition(x, barY);
        bar.fill.setPosition(x - this.barWidth / 2, barY);

        // Update fill width
        bar.fill.width = fillWidth;

        // Update fill visibility (hide if zero health)
        bar.fill.setVisible(fillWidth > 0);

        // Change color based on health percentage
        if (healthPercent > 0.6) {
            bar.fill.setFillStyle(0x44ff44); // Green
        } else if (healthPercent > 0.3) {
            bar.fill.setFillStyle(0xffff44); // Yellow
        } else {
            bar.fill.setFillStyle(0xff4444); // Red
        }
    }

    remove(id: string): void {
        const bar = this.healthBars.get(id);
        if (bar) {
            bar.background.destroy();
            bar.fill.destroy();
            bar.border.destroy();
            this.healthBars.delete(id);
        }
    }

    clear(): void {
        for (const [id] of this.healthBars) {
            this.remove(id);
        }
    }
}