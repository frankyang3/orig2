import { MapSchema } from "@colyseus/schema";
import { Player } from "../schema/Player";
import { PLAYER_SIZE } from "../../../shared/src/constants";

export class PlayerCollisionManager {
    private playerRadius: number;

    constructor(
        private players: MapSchema<Player>,
        playerRadius: number = PLAYER_SIZE / 2
    ) {
        this.playerRadius = playerRadius;
    }

    checkCollision(sessionId: string, newX: number, newY: number): boolean {
        const minDistance = this.playerRadius * 2;

        for (const [otherId, other] of this.players.entries()) {
            if (otherId === sessionId) continue;

            const dx = newX - other.x;
            const dy = newY - other.y;
            const distanceSquared = dx * dx + dy * dy;

            if (distanceSquared < minDistance * minDistance) {
                return true;
            }
        }

        return false;
    }

    resolveOverlaps(): void {
        const playerList = Array.from(this.players.entries());
        const minDistance = this.playerRadius * 2;

        for (let i = 0; i < playerList.length; i++) {
            for (let j = i + 1; j < playerList.length; j++) {
                const [, playerA] = playerList[i];
                const [, playerB] = playerList[j];

                const dx = playerB.x - playerA.x;
                const dy = playerB.y - playerA.y;
                const distanceSquared = dx * dx + dy * dy;

                if (distanceSquared < minDistance * minDistance && distanceSquared > 0) {
                    const distance = Math.sqrt(distanceSquared);
                    const overlap = (minDistance - distance) / 2;
                    const normalX = dx / distance;
                    const normalY = dy / distance;

                    playerA.x -= normalX * overlap;
                    playerA.y -= normalY * overlap;
                    playerB.x += normalX * overlap;
                    playerB.y += normalY * overlap;
                }
            }
        }
    }
}