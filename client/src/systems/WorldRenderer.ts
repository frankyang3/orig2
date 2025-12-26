import Phaser from "phaser";
import { 
  TILE_SIZE, 
  WORLD_WIDTH, 
  WORLD_HEIGHT, 
  BLOCK_COLORS,
  BLOCK_TYPE 
} from "../../../shared/src/constants";

export class WorldRenderer {
  private tiles: Phaser.GameObjects.Rectangle[][] = [];
  private container: Phaser.GameObjects.Container;

  constructor(private scene: Phaser.Scene) {
    this.container = this.scene.add.container(0, 0);
    this.container.setDepth(-1);
  }

  initialize(): void {
    for (let y = 0; y < WORLD_HEIGHT; y++) {
      this.tiles[y] = [];
      for (let x = 0; x < WORLD_WIDTH; x++) {
        const tile = this.scene.add.rectangle(
          x * TILE_SIZE + TILE_SIZE / 2,
          y * TILE_SIZE + TILE_SIZE / 2,
          TILE_SIZE - 1,
          TILE_SIZE - 1,
          BLOCK_COLORS[BLOCK_TYPE.GRASS]
        );
        
        tile.setStrokeStyle(1, 0x000000, 0.2);
        
        this.tiles[y][x] = tile;
        this.container.add(tile);
      }
    }
  }

  updateTile(x: number, y: number, blockType: number): void {
    if (y < 0 || y >= WORLD_HEIGHT || x < 0 || x >= WORLD_WIDTH) {
      return;
    }

    const tile = this.tiles[y][x];
    if (tile) {
      const color = BLOCK_COLORS[blockType as keyof typeof BLOCK_COLORS] ?? BLOCK_COLORS[BLOCK_TYPE.GRASS];
      tile.setFillStyle(color);
    }
  }

  updateAllTiles(blocks: { blockType: number }[]): void {
    for (let i = 0; i < blocks.length; i++) {
      const x = i % WORLD_WIDTH;
      const y = Math.floor(i / WORLD_WIDTH);
      this.updateTile(x, y, blocks[i].blockType);
    }
  }

  worldToTile(worldX: number, worldY: number): { x: number; y: number } {
    return {
      x: Math.floor(worldX / TILE_SIZE),
      y: Math.floor(worldY / TILE_SIZE),
    };
  }

  tileToWorld(tileX: number, tileY: number): { x: number; y: number } {
    return {
      x: tileX * TILE_SIZE + TILE_SIZE / 2,
      y: tileY * TILE_SIZE + TILE_SIZE / 2,
    };
  }
}