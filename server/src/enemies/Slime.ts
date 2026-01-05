import { BaseEnemy, EnemyConfig } from "./BaseEnemy";
import { WorldMap } from "../schema/World";
import { Player } from "../schema/Player";

const SLIME_CONFIG: EnemyConfig = {
    maxHealth: 50,
    speed: 30,
    damage: 10,
    aggroRange: 150,
    attackRange: 32,
    size: 28,
};

export class Slime extends BaseEnemy {
    constructor(id: string, x: number, y: number) {
        super(id, x, y, "slime", SLIME_CONFIG);
    }

    protected onPatrol(deltaTime: number, worldMap: WorldMap): void {
        this.schema.state = "patrol";
        this.patrolCooldown -= deltaTime;

        if (this.patrolCooldown <= 0) {
            this.pickRandomPatrolTarget(worldMap);
            this.patrolCooldown = 2 + Math.random() * 3; // 2-5 seconds
        }

        if (this.getDistanceTo(this.targetX, this.targetY) > 10) {
            this.moveToward(this.targetX, this.targetY, this.config.speed);
        } else {
            this.schema.velocityX = 0;
            this.schema.velocityY = 0;
            this.schema.state = "idle";
        }
    }

    protected onChase(deltaTime: number, target: Player, worldMap: WorldMap): void {
        this.schema.state = "chase";
        this.moveToward(target.x, target.y, this.config.speed * 1.2);
    }
}