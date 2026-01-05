import { TILE_SIZE, BLOCK_TYPE, WORLD_WIDTH } from "../../../shared/src/constants";

export class CollisionManager {
    private worldBlocks?: { blockType: number }[];

    setWorldData(blocks: { blockType: number }[]): void {
        this.worldBlocks = blocks;
    }

    updateBlockType(index: number, blockType: number): void {
        if (this.worldBlocks && index < this.worldBlocks.length) {
            this.worldBlocks[index].blockType = blockType;
        }
    }

    canMoveTo(x: number, y: number, playerSize: number = 16): boolean {
        if (!this.worldBlocks) return true;

        const corners = [
            { x: x - playerSize, y: y - playerSize },
            { x: x + playerSize, y: y - playerSize },
            { x: x - playerSize, y: y + playerSize },
            { x: x + playerSize, y: y + playerSize },
        ];

        for (const corner of corners) {
            const tileX = Math.floor(corner.x / TILE_SIZE);
            const tileY = Math.floor(corner.y / TILE_SIZE);

            if (tileX < 0 || tileY < 0) return false;

            const index = tileY * WORLD_WIDTH + tileX;
            const block = this.worldBlocks[index];

            if (block && block.blockType !== BLOCK_TYPE.GRASS) {
                return false;
            }
        }

        return true;
    }
}