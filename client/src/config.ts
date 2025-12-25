import Phaser from "phaser";
import { GameScene } from "./scenes/GameScene";

export const gameConfig: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    backgroundColor: "#b6d53c",
    parent: "phaser-example",
    physics: { default: "arcade" },
    pixelArt: true,
    scene: [GameScene],
};