import Phaser from "phaser";
import { FIXED_TIME_STEP } from "../../../shared/src/constants";
import { InputManager } from "../systems/InputManager";
import { PlayerManager } from "../systems/PlayerManager";
import { NetworkClient } from "../network/NetworkManager";

export class GameScene extends Phaser.Scene {
    private inputManager!: InputManager;
    private playerManager!: PlayerManager;
    private network!: NetworkClient;
    private elapsedTime = 0;

    preload(): void {
        this.load.image(
            "ship_0001",
            "https://cdn.glitch.global/3e033dcd-d5be-4db4-99e8-086ae90969ec/ship_0001.png"
        );

        this.inputManager = new InputManager(this);
        this.inputManager.init();
    }

    async create(): Promise<void> {
        this.playerManager = new PlayerManager(this);
        this.network = new NetworkClient();

        await this.network.connect({
            onAdd: (sessionId, x, y, isLocal) => {
                this.playerManager.addPlayer(sessionId, x, y, isLocal);
            },
            onRemove: (sessionId) => {
                this.playerManager.removePlayer(sessionId);
            },
            onLocalUpdate: (x, y) => {
                this.playerManager.updateRemoteRef(x, y);
            },
            onRemoteUpdate: (sessionId, x, y) => {
                this.playerManager.setServerPosition(sessionId, x, y);
            },
        });
    }

    update(_time: number, delta: number): void {
        if (!this.playerManager.hasLocalPlayer()) return;

        this.elapsedTime += delta;
        while (this.elapsedTime >= FIXED_TIME_STEP) {
            this.elapsedTime -= FIXED_TIME_STEP;
            this.fixedTick();
        }
    }

    private fixedTick(): void {
        if (!this.network.isConnected()) return;

        const input = this.inputManager.getInput();
        this.network.sendInput(input);
        this.playerManager.applyInput(input);
        this.playerManager.interpolateRemotePlayers();
    }
}