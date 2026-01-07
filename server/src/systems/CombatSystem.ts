import { MapSchema } from "@colyseus/schema";
import { Player } from "../schema/Player";
import { Enemy } from "../schema/Enemy";
import { BaseEnemy } from "../enemies/BaseEnemy";
import { PLAYER_SIZE } from "../../../shared/src/constants";
import {
    ENEMY_CONTACT_DAMAGE,
    DAMAGE_COOLDOWN_MS,
    PLAYER_MAX_HEALTH,
    PLAYER_RESPAWN_DELAY_MS,
} from "../serverConstants";

interface DamageState {
    lastDamageTime: number;
    isDead: boolean;
    respawnTime: number;
}

export class CombatSystem {
    private playerDamageState: Map<string, DamageState> = new Map();
    private enemyRegistry: Map<string, BaseEnemy> = new Map();
    private respawnCallback?: (sessionId: string) => { x: number; y: number };

    constructor(
        private players: MapSchema<Player>,
        private enemies: MapSchema<Enemy>
    ) {}

    setEnemyRegistry(registry: Map<string, BaseEnemy>): void {
        this.enemyRegistry = registry;
    }

    setRespawnCallback(callback: (sessionId: string) => { x: number; y: number }): void {
        this.respawnCallback = callback;
    }

    addPlayer(sessionId: string): void {
        this.playerDamageState.set(sessionId, {
            lastDamageTime: 0,
            isDead: false,
            respawnTime: 0,
        });
    }

    removePlayer(sessionId: string): void {
        this.playerDamageState.delete(sessionId);
    }

    update(currentTime: number): void {
        this.checkEnemyPlayerCollisions(currentTime);
        this.checkRespawns(currentTime);
    }

    private checkEnemyPlayerCollisions(currentTime: number): void {
        for (const [sessionId, player] of this.players.entries()) {
            const damageState = this.playerDamageState.get(sessionId);
            if (!damageState || damageState.isDead) continue;

            // Check if still in cooldown
            if (currentTime - damageState.lastDamageTime < DAMAGE_COOLDOWN_MS) {
                continue;
            }

            for (const [enemyId, enemySchema] of this.enemies.entries()) {
                const enemy = this.enemyRegistry.get(enemyId);
                if (!enemy || !enemy.isAlive()) continue;

                const distance = this.getDistance(
                    player.x,
                    player.y,
                    enemySchema.x,
                    enemySchema.y
                );

                const collisionDistance = PLAYER_SIZE / 2 + enemy.getConfig().size / 2;

                if (distance < collisionDistance) {
                    this.damagePlayer(sessionId, player, ENEMY_CONTACT_DAMAGE, currentTime);
                    break; // Only take damage from one enemy per frame
                }
            }
        }
    }

    private damagePlayer(
        sessionId: string,
        player: Player,
        amount: number,
        currentTime: number
    ): void {
        const damageState = this.playerDamageState.get(sessionId);
        if (!damageState) return;

        player.health = Math.max(0, player.health - amount);
        damageState.lastDamageTime = currentTime;

        console.log(`Player ${sessionId} took ${amount} damage, health: ${player.health}`);

        if (player.health <= 0) {
            this.handlePlayerDeath(sessionId, damageState, currentTime);
        }
    }

    private handlePlayerDeath(
        sessionId: string,
        damageState: DamageState,
        currentTime: number
    ): void {
        damageState.isDead = true;
        damageState.respawnTime = currentTime + PLAYER_RESPAWN_DELAY_MS;
        console.log(`Player ${sessionId} died, respawning in ${PLAYER_RESPAWN_DELAY_MS}ms`);
    }

    private checkRespawns(currentTime: number): void {
        for (const [sessionId, damageState] of this.playerDamageState.entries()) {
            if (damageState.isDead && currentTime >= damageState.respawnTime) {
                this.respawnPlayer(sessionId);
            }
        }
    }

    private respawnPlayer(sessionId: string): void {
        const player = this.players.get(sessionId);
        const damageState = this.playerDamageState.get(sessionId);

        if (!player || !damageState) return;

        player.health = PLAYER_MAX_HEALTH;
        damageState.isDead = false;
        damageState.lastDamageTime = Date.now(); // Brief invulnerability after respawn

        if (this.respawnCallback) {
            const spawnPos = this.respawnCallback(sessionId);
            player.x = spawnPos.x;
            player.y = spawnPos.y;
        }

        console.log(`Player ${sessionId} respawned`);
    }

    isPlayerDead(sessionId: string): boolean {
        return this.playerDamageState.get(sessionId)?.isDead ?? false;
    }

    isPlayerInvulnerable(sessionId: string, currentTime: number): boolean {
        const damageState = this.playerDamageState.get(sessionId);
        if (!damageState) return false;
        return currentTime - damageState.lastDamageTime < DAMAGE_COOLDOWN_MS;
    }

    private getDistance(x1: number, y1: number, x2: number, y2: number): number {
        const dx = x2 - x1;
        const dy = y2 - y1;
        return Math.sqrt(dx * dx + dy * dy);
    }
}