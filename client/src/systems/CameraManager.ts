import { TILE_SIZE, WORLD_WIDTH, WORLD_HEIGHT } from "../../../shared/src/constants";

export class CameraManager {
  private scene: Phaser.Scene;
  private camera: Phaser.Cameras.Scene2D.Camera;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.camera = scene.cameras.main;
  }

  setup(originX = 0, originY = 0): void {
    const worldPixelWidth = WORLD_WIDTH * TILE_SIZE;
    const worldPixelHeight = WORLD_HEIGHT * TILE_SIZE;
    this.camera.setBounds(originX, originY, worldPixelWidth, worldPixelHeight);
  }

  centerOn(x: number, y: number): void {
    this.camera.centerOn(x, y);
  }

  followTarget(target: { x: number; y: number }): void {
    this.camera.centerOn(target.x, target.y);
  }
}