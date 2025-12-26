import * as fs from "fs";
import * as path from "path";
import { WorldMap } from "../schema/World";
import { WORLD_HEIGHT, WORLD_WIDTH, BLOCK_TYPE, BlockType } from "../../../shared/src/constants";

interface SavedWorldData {
  version: number;
  width: number;
  height: number;
  blocks: { blockType: number; health: number }[];
  lastSaved: string;
}

export class WorldPersistence {
  private savePath: string;
  private autoSaveInterval: NodeJS.Timeout | null = null;

  constructor(worldName: string = "world") {
    // Save to server/data/ directory
    const dataDir = path.join(__dirname, "../../data");
    
    // Create data directory if it doesn't exist
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    this.savePath = path.join(dataDir, `${worldName}.json`);
  }

  // Load world from file, returns true if loaded successfully
  load(worldMap: WorldMap): boolean {
    try {
      if (!fs.existsSync(this.savePath)) {
        console.log("No saved world found, generating new world...");
        this.generateDefaultWorld(worldMap);
        return false;
      }

      const fileContent = fs.readFileSync(this.savePath, "utf-8");
      const savedData: SavedWorldData = JSON.parse(fileContent);

      // Validate dimensions match
      if (savedData.width !== WORLD_WIDTH || savedData.height !== WORLD_HEIGHT) {
        console.warn("Saved world dimensions don't match, generating new world...");
        this.generateDefaultWorld(worldMap);
        return false;
      }

      worldMap.loadFromData(savedData.blocks);
      console.log(`World loaded from ${this.savePath} (saved: ${savedData.lastSaved})`);
      return true;
    } catch (error) {
      console.error("Error loading world:", error);
      this.generateDefaultWorld(worldMap);
      return false;
    }
  }

  // Save world to file
  save(worldMap: WorldMap): boolean {
    try {
      const saveData: SavedWorldData = {
        version: 1,
        width: WORLD_WIDTH,
        height: WORLD_HEIGHT,
        blocks: worldMap.toSaveData(),
        lastSaved: new Date().toISOString(),
      };

      fs.writeFileSync(this.savePath, JSON.stringify(saveData), "utf-8");
      console.log(`World saved to ${this.savePath}`);
      return true;
    } catch (error) {
      console.error("Error saving world:", error);
      return false;
    }
  }

  // Start auto-saving at regular intervals
  startAutoSave(worldMap: WorldMap, intervalMs: number = 60000): void {
    this.stopAutoSave();
    this.autoSaveInterval = setInterval(() => {
      this.save(worldMap);
    }, intervalMs);
    console.log(`Auto-save enabled every ${intervalMs / 1000} seconds`);
  }

  stopAutoSave(): void {
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval);
      this.autoSaveInterval = null;
    }
  }

  // Generate a default world with some variety
  private generateDefaultWorld(worldMap: WorldMap): void {
    console.log("Generating default world...");
    
    for (let y = 0; y < WORLD_HEIGHT; y++) {
      for (let x = 0; x < WORLD_WIDTH; x++) {
        // Mostly empty (grass)
        let blockType : BlockType = BLOCK_TYPE.GRASS;

        // Add some random wood blocks (trees) - about 5% chance
        if (Math.random() < 0.05) {
          blockType = BLOCK_TYPE.WOOD;
        }
        // Add some random stone blocks - about 3% chance
        else if (Math.random() < 0.03) {
          blockType = BLOCK_TYPE.STONE;
        }

        // Create a border of stone
        if (x === 0 || x === WORLD_WIDTH - 1 || y === 0 || y === WORLD_HEIGHT - 1) {
          blockType = BLOCK_TYPE.STONE;
        }

        worldMap.setBlockType(x, y, blockType);
      }
    }

    // Save the newly generated world
    this.save(worldMap);
  }
}