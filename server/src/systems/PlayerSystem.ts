import { MapSchema } from "@colyseus/schema";
import { Player } from "../schema/Player";
import { WorldMap } from "../schema/World";
import { InputPayload } from "../../../shared/src/types";
import { PLAYER_VELOCITY, TILE_SIZE, BLOCK_TYPE } from "../../../shared/src/constants";

export class PlayerSystem {
  private inputQueues: Map<string, InputPayload[]> = new Map();
  private worldMap?: WorldMap;

  constructor(private players: MapSchema<Player>) {}

  setWorldMap(worldMap: WorldMap): void {
    this.worldMap = worldMap;
  }

  addPlayer(sessionId: string): void {
    const player = new Player();
    // Spawn at a random grass tile
    const spawnPos = this.findSpawnPosition();
    player.x = spawnPos.x;
    player.y = spawnPos.y;
    this.players.set(sessionId, player);
    this.inputQueues.set(sessionId, []);
  }

  private findSpawnPosition(): { x: number; y: number } {
    if (!this.worldMap) {
      return { x: 100, y: 100 };
    }

    // Try to find an empty grass tile
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

    // Fallback
    return { x: 100, y: 100 };
  }

  removePlayer(sessionId: string): void {
    this.players.delete(sessionId);
    this.inputQueues.delete(sessionId);
  }

  queueInput(sessionId: string, input: InputPayload): void {
    const queue = this.inputQueues.get(sessionId);
    if (queue) {
      queue.push(input);
    }
  }

  processInputs(): void {
    this.players.forEach((player, sessionId) => {
      const queue = this.inputQueues.get(sessionId);
      if (!queue) return;

      while (queue.length > 0) {
        const input = queue.shift()!;
        this.applyInput(player, input);
      }
    });
  }

  private applyInput(player: Player, input: InputPayload): void {
    let newX = player.x;
    let newY = player.y;

    if (input.left) newX -= PLAYER_VELOCITY;
    if (input.right) newX += PLAYER_VELOCITY;
    if (input.up) newY -= PLAYER_VELOCITY;
    if (input.down) newY += PLAYER_VELOCITY;

    // Check collision and update position
    if (this.canMoveTo(newX, newY)) {
      player.x = newX;
      player.y = newY;
    } else {
      // Try moving on each axis separately
      if (this.canMoveTo(newX, player.y)) {
        player.x = newX;
      }
      if (this.canMoveTo(player.x, newY)) {
        player.y = newY;
      }
    }
  }

  private canMoveTo(x: number, y: number): boolean {
    if (!this.worldMap) return true;

    // Check all four corners of the player (assuming 32x32 player size)
    const playerSize = 16; // Half of player size
    const corners = [
      { x: x - playerSize, y: y - playerSize }, // top-left
      { x: x + playerSize, y: y - playerSize }, // top-right
      { x: x - playerSize, y: y + playerSize }, // bottom-left
      { x: x + playerSize, y: y + playerSize }, // bottom-right
    ];

    for (const corner of corners) {
      const tileX = Math.floor(corner.x / TILE_SIZE);
      const tileY = Math.floor(corner.y / TILE_SIZE);
      const block = this.worldMap.getBlock(tileX, tileY);

      if (block && block.blockType !== BLOCK_TYPE.GRASS) {
        return false; // Collision with solid block
      }
    }

    return true;
  }
}