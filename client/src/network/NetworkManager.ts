import { Client, Room } from "colyseus.js";
import { getStateCallbacks } from "colyseus.js";
import { ROOM_NAME, MESSAGE_TYPES, WORLD_WIDTH } from "../../../shared/src/constants";
import { InputPayload } from "../../../shared/src/types";
import { SERVER_URL } from "../clientConstants";

export interface NetworkCallbacks {
    // Player callbacks
    onAdd: (sessionId: string, x: number, y: number, health: number, maxHealth: number, isLocal: boolean) => void;
    onRemove: (sessionId: string) => void;
    onLocalUpdate: (x: number, y: number, health: number, maxHealth: number) => void;
    onRemoteUpdate: (sessionId: string, x: number, y: number, health: number, maxHealth: number) => void;
    // World callbacks
    onWorldInit: (blocks: { blockType: number }[]) => void;
    onBlockChange: (x: number, y: number, blockType: number) => void;
    // Enemy callbacks
    onEnemyAdd: (id: string, enemyType: string, x: number, y: number, health: number, maxHealth: number) => void;
    onEnemyRemove: (id: string) => void;
    onEnemyUpdate: (id: string, x: number, y: number, health: number, maxHealth: number) => void;
}

export class NetworkClient {
    private client = new Client(SERVER_URL);
    private room?: Room;

    async connect(callbacks: NetworkCallbacks): Promise<void> {
        try {
            this.room = await this.client.joinOrCreate(ROOM_NAME);
            console.log("Joined room:", this.room.sessionId);

            // Wait for state to be ready
            this.room.onStateChange.once((state) => {
                console.log("State ready:", state);
                this.setupCallbacks(callbacks);
            });
        } catch (e) {
            console.error("Failed to join room:", e);
            throw e;
        }
    }

    private setupCallbacks(callbacks: NetworkCallbacks): void {
        if (!this.room) return;

        const $ = getStateCallbacks(this.room);
        const state = this.room.state as any;

        // Debug: see what's in the state
        console.log("State:", state);
        console.log("State.worldMap:", state.worldMap);
        console.log("State.players:", state.players);
        console.log("State.enemies:", state.enemies);

        // Player Callbacks
        $(state).players.onAdd((player: any, sessionId: string) => {

            // Debug: log all player properties
            console.log("Player object received:", player);
            console.log("Player properties:", {
                x: player.x,
                y: player.y,
                health: player.health,
                maxHealth: player.maxHealth
            });
            const isLocal = sessionId === this.room!.sessionId;
            callbacks.onAdd(sessionId, player.x, player.y, player.health, player.maxHealth, isLocal);

            $(player).onChange(() => {
                if (isLocal) {
                    callbacks.onLocalUpdate(player.x, player.y, player.health, player.maxHealth);
                } else {
                    callbacks.onRemoteUpdate(sessionId, player.x, player.y, player.health, player.maxHealth);
                }
            });
        });

        $(state).players.onRemove((_: any, sessionId: string) => {
            callbacks.onRemove(sessionId);
        });

        // World callbacks
        const blocksArray: { blockType: number }[] = [];
        let initialized = false;

        $(state).worldMap.blocks.onAdd((block: any, index: number) => {
            blocksArray[index] = { blockType: block.blockType };

            $(block).onChange(() => {
                const x = index % WORLD_WIDTH;
                const y = Math.floor(index / WORLD_WIDTH);
                callbacks.onBlockChange(x, y, block.blockType);
            });

            if (!initialized && blocksArray.length === state.worldMap.blocks.length) {
                initialized = true;
                callbacks.onWorldInit(blocksArray);
            }
        });

        // Enemy callbacks
        $(state).enemies.onAdd((enemy: any, id: string) => {
            console.log(`Enemy added: ${id} (${enemy.enemyType}) at (${enemy.x}, ${enemy.y})`);
            callbacks.onEnemyAdd(id, enemy.enemyType, enemy.x, enemy.y, enemy.health, enemy.maxHealth);

            $(enemy).onChange(() => {
                callbacks.onEnemyUpdate(id, enemy.x, enemy.y, enemy.health, enemy.maxHealth);
            });
        });

        $(state).enemies.onRemove((_: any, id: string) => {
            console.log(`Enemy removed: ${id}`);
            callbacks.onEnemyRemove(id);
        });
    }

    sendInput(input: InputPayload): void {
        this.room?.send(MESSAGE_TYPES.INPUT, input);
    }

    getSessionId(): string | undefined {
        return this.room?.sessionId;
    }

    isConnected(): boolean {
        return !!this.room;
    }
}