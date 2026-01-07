import Phaser from "phaser";
import { GameScene } from "./scenes/GameScene";
import { DISPLAY } from "./clientConstants";

export const gameConfig: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    width: DISPLAY.WIDTH,
    height: DISPLAY.HEIGHT,
    backgroundColor: DISPLAY.BACKGROUND,
    parent: "phaser-example",
    pixelArt: true,
    physics: { default: "arcade" },
    scene: [GameScene],
};