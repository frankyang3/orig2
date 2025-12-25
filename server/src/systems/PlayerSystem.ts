import { MapSchema } from "@colyseus/schema";
import { Player } from "../schema/Player";
import { InputPayload } from "../../../shared/src/types";
import { PLAYER_VELOCITY, MAP_WIDTH, MAP_HEIGHT } from "../../../shared/src/constants";

export class PlayerSystem {
  constructor(private players: MapSchema<Player>) {}

  createPlayer(): Player {
    const player = new Player();
    player.x = Math.random() * MAP_WIDTH;
    player.y = Math.random() * MAP_HEIGHT;
    return player;
  }

  addPlayer(sessionId: string): Player {
    const player = this.createPlayer();
    this.players.set(sessionId, player);
    return player;
  }

  removePlayer(sessionId: string): void {
    this.players.delete(sessionId);
  }

  getPlayer(sessionId: string): Player | undefined {
    return this.players.get(sessionId);
  }

  queueInput(sessionId: string, input: InputPayload): void {
    const player = this.players.get(sessionId);
    if (player) {
      player.inputQueue.push(input);
    }
  }

  processInputs(): void {
    this.players.forEach((player) => {
      let input: InputPayload | undefined;

      while ((input = player.inputQueue.shift())) {
        this.applyInput(player, input);
      }
    });
  }

  private applyInput(player: Player, input: InputPayload): void {
    if (input.left) {
      player.x -= PLAYER_VELOCITY;
    } else if (input.right) {
      player.x += PLAYER_VELOCITY;
    }

    if (input.up) {
      player.y -= PLAYER_VELOCITY;
    } else if (input.down) {
      player.y += PLAYER_VELOCITY;
    }
  }
}