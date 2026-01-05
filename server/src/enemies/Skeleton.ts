import { BaseEnemy, EnemyConfig } from "./BaseEnemy";
import { WorldMap } from "../schema/World";
import { Player } from "../schema/Player";

const SKELETON_CONFIG: EnemyConfig = {
    maxHealth: 80,
    speed: 50,
    damage: 15,
    aggroRange: 250,
    attackRange: 40,
    size: 30,
};

export class Skeleton extends BaseEnemy {
    private strafeDirection: number = 1;
    private strafeTimer: number = 0;

    constructor(id: string, x: number, y: number) {
        super(id, x, y, "skeleton", SKELETON_CONFIG);
    }

    protected onPatrol(deltaTime: number, worldMap: WorldMap): void {
        this.schema.state = "patrol";
        this.patrolCooldown -= deltaTime;

        if (this.patrolCooldown <= 0) {
            this.pickRandomPatrolTarget(worldMap);
            this.patrolCooldown = 3 + Math.random() * 2;
        }

        if (this.getDistanceTo(this.targetX, this.targetY) > 10) {
            this.moveToward(this.targetX, this.targetY, this.config.speed * 0.5);
        } else {
            this.schema.velocityX = 0;
            this.schema.velocityY = 0;
            this.schema.state = "idle";
        }
    }

    protected onChase(deltaTime: number, target: Player, worldMap: WorldMap): void {
        const distance = this.getDistanceTo(target.x, target.y);

        if (distance < this.config.attackRange) {
            this.schema.state = "attack";
            // Strafe around the player
            this.strafeTimer -= deltaTime;
            if (this.strafeTimer <= 0) {
                this.strafeDirection *= -1;
                this.strafeTimer = 0.5 + Math.random() * 0.5;
            }

            const dx = target.x - this.schema.x;
            const dy = target.y - this.schema.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            // Move perpendicular to player
            this.schema.velocityX = (-dy / dist) * this.config.speed * this.strafeDirection;
            this.schema.velocityY = (dx / dist) * this.config.speed * this.strafeDirection;
        } else {
            this.schema.state = "chase";
            this.moveToward(target.x, target.y, this.config.speed);
        }
    }
}