import { Room, Client } from "@colyseus/core";
import { GameState } from "../schema/GameState";
import { PlayerSystem } from "../systems/PlayerSystem";
import { InputPayload } from "../../../shared/src/types";
import { FIXED_TIME_STEP, MAX_CLIENTS, MESSAGE_TYPES } from "../../../shared/src/constants";

export class GameRoom extends Room<GameState> {
  maxClients = MAX_CLIENTS;
  private playerSystem!: PlayerSystem;
  private elapsedTime = 0;

  onCreate(): void {
    this.setState(new GameState());
    this.playerSystem = new PlayerSystem(this.state.players);

    this.setupMessageHandlers();
    this.setupSimulation();
  }

  private setupMessageHandlers(): void {
    this.onMessage(MESSAGE_TYPES.INPUT, (client, input: InputPayload) => {
      this.playerSystem.queueInput(client.sessionId, input);
    });
  }

  private setupSimulation(): void {
    this.setSimulationInterval((deltaTime) => {
      this.elapsedTime += deltaTime;

      while (this.elapsedTime >= FIXED_TIME_STEP) {
        this.elapsedTime -= FIXED_TIME_STEP;
        this.fixedTick();
      }
    });
  }

  private fixedTick(): void {
    this.playerSystem.processInputs();
  }

  onJoin(client: Client): void {
    console.log(`${client.sessionId} joined`);
    this.playerSystem.addPlayer(client.sessionId);
  }

  onLeave(client: Client): void {
    console.log(`${client.sessionId} left`);
    this.playerSystem.removePlayer(client.sessionId);
  }

  onDispose(): void {
    console.log(`Room ${this.roomId} disposing`);
  }
}