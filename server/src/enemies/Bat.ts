import { BaseEnemy, EnemyConfig } from "./BaseEnemy";
import { WorldMap } from "../schema/World";
import { Player } from "../schema/Player";
import { TILE_SIZE, BLOCK_TYPE } from "../../../shared/src/constants";

const BAT_CONFIG: EnemyConfig = {
    maxHealth: 30,
    speed: 70,
    damage: 8,
    aggroRange: 200,
    attackRange: 24,
    size: 20,
};

export class Bat extends BaseEnemy {
    private wobbleOffset: number = Math.random() * Math.PI * 2;

    constructor(id: string, x: number, y: number) {
        super(id, x, y, "bat", BAT_CONFIG);
    }

    protected onPatrol(deltaTime: number, worldMap: WorldMap): void {
        this.schema.state = "patrol";
        this.patrolCooldown -= deltaTime;

        if (this.patrolCooldown <= 0) {
            this.pickRandomPatrolTarget(worldMap);
            this.patrolCooldown = 1 + Math.random() * 2;
        }

        if (this.getDistanceTo(this.targetX, this.targetY) > 10) {
            this.moveToward(this.targetX, this.targetY, this.config.speed * 0.6);
            this.addWobble(deltaTime);
        } else {
            this.schema.velocityX = 0;
            this.schema.velocityY = 0;
        }
    }

    protected onChase(deltaTime: number, target: Player, worldMap: WorldMap): void {
        this.schema.state = "chase";
        this.moveToward(target.x, target.y, this.config.speed);
        this.addWobble(deltaTime);
    }

    private addWobble(deltaTime: number): void {
        this.wobbleOffset += deltaTime * 8;
        const wobble = Math.sin(this.wobbleOffset) * 20;
        
        // Add perpendicular wobble
        const speed = Math.sqrt(
            this.schema.velocityX * this.schema.velocityX +
            this.schema.velocityY * this.schema.velocityY
        );
        
        if (speed > 0) {
            this.schema.velocityX += (-this.schema.velocityY / speed) * wobble * deltaTime;
            this.schema.velocityY += (this.schema.velocityX / speed) * wobble * deltaTime;
        }
    }

    // Bats can fly over some obstacles
    protected canMoveTo(x: number, y: number, worldMap: WorldMap): boolean {
        const tileX = Math.floor(x / TILE_SIZE);
        const tileY = Math.floor(y / TILE_SIZE);
        const block = worldMap.getBlock(tileX, tileY);

        // Bats can fly over wood (trees) but not stone
        if (!block) return false;
        return block.blockType === BLOCK_TYPE.GRASS || block.blockType === BLOCK_TYPE.WOOD;
    }
}