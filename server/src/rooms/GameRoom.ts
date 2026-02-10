import { Room, Client } from "@colyseus/core";
import { Encoder } from "@colyseus/schema";
import { GameState } from "../schema/GameState";
import { PlayerSystem } from "../systems/PlayerSystem";
import { WorldSystem } from "../systems/WorldSystem";
import { EnemySystem } from "../systems/EnemySystem";
import { CombatSystem } from "../systems/CombatSystem";
import { InputPayload, AttackPayload } from "../../../shared/src/types";
import { FIXED_TIME_STEP, MESSAGE_TYPES } from "../../../shared/src/constants";
import { MAX_CLIENTS, INITIAL_ENEMY_COUNT } from "../serverConstants";

Encoder.BUFFER_SIZE = 64 * 1024;

export class GameRoom extends Room<GameState> {
  maxClients = MAX_CLIENTS;
  private playerSystem!: PlayerSystem;
  private worldSystem!: WorldSystem;
  private enemySystem!: EnemySystem;
  private combatSystem!: CombatSystem;
  private elapsedTime = 0;

  onCreate(): void {
    this.state = new GameState();
    this.playerSystem = new PlayerSystem(this.state.players);
    this.worldSystem = new WorldSystem(this.state.worldMap);
    this.enemySystem = new EnemySystem(this.state.enemies, this.state.players);
    this.combatSystem = new CombatSystem(this.state.players, this.state.enemies);

    // Give systems access to the world for collision detection
    this.playerSystem.setWorldMap(this.state.worldMap);
    this.enemySystem.setWorldMap(this.state.worldMap);

    // Link combat system to enemy registry
    this.combatSystem.setEnemyRegistry(this.enemySystem.getEnemyRegistry());

    // Set respawn callback
    this.combatSystem.setRespawnCallback(() => {
      return this.playerSystem.findSpawnPosition();
    });

    // Initialize world (load from disk or generate new)
    this.worldSystem.initialize();

    // Spawn initial enemies
    this.enemySystem.spawnRandomEnemies(INITIAL_ENEMY_COUNT);
    console.log(`Spawned ${this.state.enemies.size} enemies`);

    this.setupMessageHandlers();
    this.setupSimulation();
  }

  private setupMessageHandlers(): void {
    this.onMessage(MESSAGE_TYPES.INPUT, (client, input: InputPayload) => {
      // Don't process input if player is dead
      if (this.combatSystem.isPlayerDead(client.sessionId)) return;
      this.playerSystem.queueInput(client.sessionId, input);
    });

    this.onMessage(MESSAGE_TYPES.PLACE_BLOCK, (client, data: { x: number; y: number; blockType: number }) => {
      if (this.combatSystem.isPlayerDead(client.sessionId)) return;
      const success = this.worldSystem.placeBlock(data.x, data.y, data.blockType);
      if (success) {
        console.log(`Player ${client.sessionId} placed block at (${data.x}, ${data.y})`);
      }
    });

    this.onMessage(MESSAGE_TYPES.BREAK_BLOCK, (client, data: { x: number; y: number }) => {
      if (this.combatSystem.isPlayerDead(client.sessionId)) return;
      const success = this.worldSystem.breakBlock(data.x, data.y);
      if (success) {
        console.log(`Player ${client.sessionId} broke block at (${data.x}, ${data.y})`);
      }
    });

    this.onMessage(MESSAGE_TYPES.ATTACK, (client, data: AttackPayload) => {
      if (this.combatSystem.isPlayerDead(client.sessionId)) return;
      this.combatSystem.handlePlayerAttack(client.sessionId, data.angle, Date.now());
    });
  }

  private setupSimulation(): void {
    this.setSimulationInterval((deltaTime) => {
      this.elapsedTime += deltaTime;

      while (this.elapsedTime >= FIXED_TIME_STEP) {
        this.elapsedTime -= FIXED_TIME_STEP;
        this.fixedTick(FIXED_TIME_STEP);
      }
    });
  }

  private fixedTick(deltaTime: number): void {
    const currentTime = Date.now();

    this.playerSystem.processInputs();
    this.enemySystem.update(deltaTime / 1000);
    this.combatSystem.update(currentTime);
  }

  onJoin(client: Client): void {
    console.log(`${client.sessionId} joined`);
    this.playerSystem.addPlayer(client.sessionId);
    this.combatSystem.addPlayer(client.sessionId);

    // Debug: verify player state
    const player = this.state.players.get(client.sessionId);
    console.log(`Player created with health: ${player?.health}/${player?.maxHealth}`);
  }

  onLeave(client: Client): void {
    console.log(`${client.sessionId} left`);
    this.playerSystem.removePlayer(client.sessionId);
    this.combatSystem.removePlayer(client.sessionId);
  }

  onDispose(): void {
    console.log(`Room ${this.roomId} disposing, saving world...`);
    this.worldSystem.shutdown();
  }
}