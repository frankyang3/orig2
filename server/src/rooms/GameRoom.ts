import { Room, Client } from "@colyseus/core";
import { Encoder } from "@colyseus/schema";
import { GameState } from "../schema/GameState";
import { PlayerSystem } from "../systems/PlayerSystem";
import { WorldSystem } from "../systems/WorldSystem";
import { EnemySystem } from "../systems/EnemySystem";
import { InputPayload } from "../../../shared/src/types";
import { FIXED_TIME_STEP, MESSAGE_TYPES } from "../../../shared/src/constants";
import { MAX_CLIENTS, INITIAL_ENEMY_COUNT } from "../serverConstants";

// Increase buffer size for large world state
Encoder.BUFFER_SIZE = 64 * 1024; // 64 KB

export class GameRoom extends Room<GameState> {
    maxClients = MAX_CLIENTS;
    private playerSystem!: PlayerSystem;
    private worldSystem!: WorldSystem;
    private enemySystem!: EnemySystem;
    private elapsedTime = 0;

    onCreate(): void {
        this.state = new GameState();
        this.playerSystem = new PlayerSystem(this.state.players);
        this.worldSystem = new WorldSystem(this.state.worldMap);
        this.enemySystem = new EnemySystem(this.state.enemies, this.state.players);

        // Give systems access to the world for collision detection
        this.playerSystem.setWorldMap(this.state.worldMap);
        this.enemySystem.setWorldMap(this.state.worldMap);

        // Initialize world (load from disk or generate new)
        this.worldSystem.initialize();

        // Spawn initial enemies
        this.enemySystem.spawnRandomEnemies(INITIAL_ENEMY_COUNT);
        console.log(`Spawned ${this.state.enemies.size} enemies`);

        // Debug: log enemy positions
        this.state.enemies.forEach((enemy, id) => {
            console.log(`${id}: ${enemy.enemyType} at (${enemy.x.toFixed(0)}, ${enemy.y.toFixed(0)})`);
        });

        this.setupMessageHandlers();
        this.setupSimulation();
    }

    private setupMessageHandlers(): void {
        this.onMessage(MESSAGE_TYPES.INPUT, (client, input: InputPayload) => {
            this.playerSystem.queueInput(client.sessionId, input);
        });

        // Handle block placement
        this.onMessage(MESSAGE_TYPES.PLACE_BLOCK, (client, data: { x: number; y: number; blockType: number }) => {
            const success = this.worldSystem.placeBlock(data.x, data.y, data.blockType);
            if (success) {
                console.log(`Player ${client.sessionId} placed block at (${data.x}, ${data.y})`);
            }
        });

        // Handle block breaking
        this.onMessage(MESSAGE_TYPES.BREAK_BLOCK, (client, data: { x: number; y: number }) => {
            const success = this.worldSystem.breakBlock(data.x, data.y);
            if (success) {
                console.log(`Player ${client.sessionId} broke block at (${data.x}, ${data.y})`);
            }
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
        this.playerSystem.processInputs();
        this.enemySystem.update(deltaTime / 1000); // Convert ms to seconds
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
        console.log(`Room ${this.roomId} disposing, saving world...`);
        this.worldSystem.shutdown();
    }
}