import { TILE_SIZE, BLOCK_TYPE, WORLD_WIDTH } from "../../../shared/src/constants";

export class CollisionManager {
    private worldBlocks?: { blockType: number }[];
    private playerPositions: Map<string, { x: number; y: number }> = new Map();
    private localPlayerId?: string;

    setWorldData(blocks: { blockType: number }[]): void {
        this.worldBlocks = blocks;
    }

    setLocalPlayerId(id: string): void {
        this.localPlayerId = id;
    }

    updatePlayerPosition(id: string, x: number, y: number): void {
        this.playerPositions.set(id, { x, y });
    }

    removePlayer(id: string): void {
        this.playerPositions.delete(id);
    }

    updateBlockType(index: number, blockType: number): void {
        if (this.worldBlocks && index < this.worldBlocks.length) {
            this.worldBlocks[index].blockType = blockType;
        }
    }

    canMoveTo(x: number, y: number, playerSize: number = 16): boolean {
        if (!this.worldBlocks) return true;

        // Check world collision
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

        // Check player collision
        for (const [playerId, playerPos] of this.playerPositions) {
            if (playerId === this.localPlayerId) continue; // Skip self

            const dx = x - playerPos.x;
            const dy = y - playerPos.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const minDistance = playerSize * 2; // Both players have same size

            if (distance < minDistance) {
                return false;
            }
        }

        return true;
    }
}
