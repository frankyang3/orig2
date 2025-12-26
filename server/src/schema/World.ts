import { Schema, ArraySchema, type } from "@colyseus/schema";
import { Block } from "./Block";

import { WORLD_HEIGHT, WORLD_WIDTH } from "../../../shared/src/constants";

export class WorldMap extends Schema {
  @type([Block]) blocks = new ArraySchema<Block>();
  @type("uint16") width: number = WORLD_WIDTH;
  @type("uint16") height: number = WORLD_HEIGHT;

  constructor() {
    super();
    this.initializeBlocks();
  }

  private initializeBlocks(): void {
    const totalBlocks = WORLD_WIDTH * WORLD_HEIGHT;
    for (let i = 0; i < totalBlocks; i++) {
      this.blocks.push(new Block());
    }
  }

  // Convert x,y to array index
  private getIndex(x: number, y: number): number {
    return y * WORLD_WIDTH + x;
  }

  // Check if coordinates are valid
  isValidPosition(x: number, y: number): boolean {
    return x >= 0 && x < WORLD_WIDTH && y >= 0 && y < WORLD_HEIGHT;
  }

  getBlock(x: number, y: number): Block | undefined {
    if (!this.isValidPosition(x, y)) return undefined;
    return this.blocks[this.getIndex(x, y)];
  }

  setBlockType(x: number, y: number, blockType: number): boolean {
    const block = this.getBlock(x, y);
    if (!block) return false;
    block.blockType = blockType;
    block.health = 100; // reset health when block changes
    return true;
  }

  // Load world data from saved format
  loadFromData(data: { blockType: number; health: number }[]): void {
    for (let i = 0; i < data.length && i < this.blocks.length; i++) {
      this.blocks[i].blockType = data[i].blockType;
      this.blocks[i].health = data[i].health;
    }
  }

  // Export world data for saving
  toSaveData(): { blockType: number; health: number }[] {
    return this.blocks.map((block) => ({
      blockType: block.blockType,
      health: block.health,
    }));
  }
}