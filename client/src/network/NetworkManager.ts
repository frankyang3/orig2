import { Client, Room } from "colyseus.js";
import { getStateCallbacks } from "colyseus.js";
import { ROOM_NAME, MESSAGE_TYPES, WORLD_WIDTH } from "../../../shared/src/constants";
import { InputPayload } from "../../../shared/src/types";
import { SERVER_URL } from "../clientConstants";

export interface NetworkCallbacks {
    // Player callbacks
    onAdd: (sessionId: string, x: number, y: number, isLocal: boolean) => void;
    onRemove: (sessionId: string) => void;
    onLocalUpdate: (x: number, y: number) => void;
    onRemoteUpdate: (sessionId: string, x: number, y: number) => void;
    // World callbacks
    onWorldInit: (blocks: { blockType: number }[]) => void;
    onBlockChange: (x: number, y: number, blockType: number) => void;
    // Enemy callbacks
    onEnemyAdd: (id: string, enemyType: string, x: number, y: number) => void;
    onEnemyRemove: (id: string) => void;
    onEnemyUpdate: (id: string, x: number, y: number) => void;
}

export class NetworkClient {
    private client = new Client(SERVER_URL);
    private room?: Room;

    async connect(callbacks: NetworkCallbacks): Promise<void> {
        try {
            this.room = await this.client.joinOrCreate(ROOM_NAME);
            console.log("Joined room:", this.room.sessionId);

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

        console.log("State:", state);
        console.log("State.worldMap:", state.worldMap);
        console.log("State.players:", state.players);
        console.log("State.enemies:", state.enemies);

        // Player callbacks
        $(state).players.onAdd((player: any, sessionId: string) => {
            const isLocal = sessionId === this.room!.sessionId;
            callbacks.onAdd(sessionId, player.x, player.y, isLocal);

            $(player).onChange(() => {
                if (isLocal) {
                    callbacks.onLocalUpdate(player.x, player.y);
                } else {
                    callbacks.onRemoteUpdate(sessionId, player.x, player.y);
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
            callbacks.onEnemyAdd(id, enemy.enemyType, enemy.x, enemy.y);

            $(enemy).onChange(() => {
                callbacks.onEnemyUpdate(id, enemy.x, enemy.y);
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