import { Client, Room } from "colyseus.js";
import { getStateCallbacks } from "colyseus.js";
import { ROOM_NAME, MESSAGE_TYPES } from "../../../shared/src/constants";
import { InputPayload } from "../../../shared/src/types";
import { SERVER_URL } from "../clientConstants"

export interface PlayerCallbacks {
    onAdd: (sessionId: string, x: number, y: number, isLocal: boolean) => void;
    onRemove: (sessionId: string) => void;
    onLocalUpdate: (x: number, y: number) => void;
    onRemoteUpdate: (sessionId: string, x: number, y: number) => void;
}

export class NetworkClient {
    private client = new Client(SERVER_URL);
    private room?: Room;

    async connect(callbacks: PlayerCallbacks): Promise<void> {
        try {
            this.room = await this.client.joinOrCreate(ROOM_NAME);
            console.log("Joined room:", this.room.sessionId);
            this.setupCallbacks(callbacks);
        } catch (e) {
            console.error("Failed to join room:", e);
            throw e;
        }
    }

    private setupCallbacks(callbacks: PlayerCallbacks): void {
        if (!this.room) return;

        const $ = getStateCallbacks(this.room);
        const state = this.room.state as any;

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
    }

    sendInput(input: InputPayload): void {
        this.room?.send(MESSAGE_TYPES.INPUT, input);
    }

    isConnected(): boolean {
        return !!this.room;
    }
}