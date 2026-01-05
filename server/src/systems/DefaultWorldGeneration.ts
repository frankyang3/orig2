import { WORLD_WIDTH, WORLD_HEIGHT, BLOCK_TYPE, BlockType } from "../../../shared/src/constants";
import { STONE_SPAWN_CHANCE, WOOD_SPAWN_CHANCE } from "../serverConstants";

export interface GeneratedBlock {
    x: number;
    y: number;
    blockType: BlockType;
}

export function generateDefaultWorld(): GeneratedBlock[] {
    console.log("Generating default world...");

    const blocks: GeneratedBlock[] = [];

    for (let y = 0; y < WORLD_HEIGHT; y++) {
        for (let x = 0; x < WORLD_WIDTH; x++) {
            let blockType: BlockType = BLOCK_TYPE.GRASS;

            if (Math.random() < WOOD_SPAWN_CHANCE) {
                blockType = BLOCK_TYPE.WOOD;
            } else if (Math.random() < STONE_SPAWN_CHANCE) {
                blockType = BLOCK_TYPE.STONE;
            }

            // Create a border of stone
            if (x === 0 || x === WORLD_WIDTH - 1 || y === 0 || y === WORLD_HEIGHT - 1) {
                blockType = BLOCK_TYPE.STONE;
            }

            blocks.push({ x, y, blockType });
        }
    }

    return blocks;
}