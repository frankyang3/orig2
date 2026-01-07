import Phaser from "phaser";

export class PlayerHUD {
    private scene: Phaser.Scene;
    private healthBarBackground!: Phaser.GameObjects.Rectangle;
    private healthBarFill!: Phaser.GameObjects.Rectangle;
    private healthBarBorder!: Phaser.GameObjects.Rectangle;
    private healthText!: Phaser.GameObjects.Text;

    private readonly barWidth = 200;
    private readonly barHeight = 20;
    private readonly padding = 20;
    private readonly depth = 1000;

    constructor(scene: Phaser.Scene) {
        this.scene = scene;
    }

    create(): void {
        // Background (dark gray)
        this.healthBarBackground = this.scene.add.rectangle(
            this.padding + this.barWidth / 2,
            this.padding + this.barHeight / 2,
            this.barWidth,
            this.barHeight,
            0x333333
        );
        this.healthBarBackground.setScrollFactor(0);
        this.healthBarBackground.setDepth(this.depth);

        // Health fill (green, left-aligned)
        this.healthBarFill = this.scene.add.rectangle(
            this.padding,
            this.padding + this.barHeight / 2,
            this.barWidth,
            this.barHeight,
            0x44ff44
        );
        this.healthBarFill.setOrigin(0, 0.5);
        this.healthBarFill.setScrollFactor(0);
        this.healthBarFill.setDepth(this.depth + 1);

        // Border
        this.healthBarBorder = this.scene.add.rectangle(
            this.padding + this.barWidth / 2,
            this.padding + this.barHeight / 2,
            this.barWidth,
            this.barHeight
        );
        this.healthBarBorder.setStrokeStyle(2, 0x000000);
        this.healthBarBorder.setFillStyle();
        this.healthBarBorder.setScrollFactor(0);
        this.healthBarBorder.setDepth(this.depth + 2);

        // Health text centered on bar
        this.healthText = this.scene.add.text(
            this.padding + this.barWidth / 2,
            this.padding + this.barHeight / 2,
            "100 / 100",
            {
                fontSize: "14px",
                color: "#ffffff",
                fontStyle: "bold",
            }
        );
        this.healthText.setOrigin(0.5, 0.5);
        this.healthText.setScrollFactor(0);
        this.healthText.setDepth(this.depth + 3);
    }

    updateHealth(health: number, maxHealth: number): void {
        const healthPercent = Math.max(0, Math.min(1, health / maxHealth));
        const fillWidth = this.barWidth * healthPercent;

        this.healthBarFill.width = fillWidth;

        // Change color based on health percentage
        if (healthPercent > 0.3) {
            this.healthBarFill.setFillStyle(0x44ff44); // Green
        } else {
            this.healthBarFill.setFillStyle(0xff4444); // Red
        }

        // Update text
        this.healthText.setText(`${Math.ceil(health)} / ${maxHealth}`);
    }
}