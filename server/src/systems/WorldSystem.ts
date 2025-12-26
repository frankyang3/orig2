import { WorldMap } from "../schema/World";
import { WorldPersistence } from "./WorldPersistance";
import { BLOCK_TYPE, BlockType } from "../../../shared/src/constants";

export class WorldSystem {
    private persistence: WorldPersistence;

    constructor(private worldMap: WorldMap) {
        this.persistence = new WorldPersistence("game_world");
    }

    // Initialize world - load from disk or generate new
    initialize(): void {
        this.persistence.load(this.worldMap);
        // Auto-save every 60 seconds
        this.persistence.startAutoSave(this.worldMap, 60000);
    }

    // Save world immediately (call on room dispose)
    saveNow(): void {
        this.persistence.save(this.worldMap);
    }

    // Stop auto-save (call on room dispose)
    shutdown(): void {
        this.persistence.stopAutoSave();
        this.saveNow();
    }

    // Place a block at position
    placeBlock(x: number, y: number, blockType: number): boolean {
        if (!this.worldMap.isValidPosition(x, y)) {
            return false;
        }

        // Validate blockType is in valid range 
        if (blockType < BLOCK_TYPE.GRASS || blockType > BLOCK_TYPE.STONE) {
            return false;
        }

        const currentBlock = this.worldMap.getBlock(x, y);
        if (!currentBlock) return false;

        // Only allow placing on empty tiles
        if (currentBlock.blockType !== BLOCK_TYPE.GRASS) {
            return false;
        }

        return this.worldMap.setBlockType(x, y, blockType);
    }

    // Break a block at position
    breakBlock(x: number, y: number): boolean {
        if (!this.worldMap.isValidPosition(x, y)) {
            return false;
        }

        const currentBlock = this.worldMap.getBlock(x, y);
        if (!currentBlock) return false;

        // Can't break empty tiles
        if (currentBlock.blockType === BLOCK_TYPE.GRASS) {
            return false;
        }

        return this.worldMap.setBlockType(x, y, BLOCK_TYPE.GRASS);
    }

    // Get block type at position
    getBlockType(x: number, y: number): BlockType | undefined {
        const block = this.worldMap.getBlock(x, y);
        return block?.blockType as BlockType | undefined;
    }
}