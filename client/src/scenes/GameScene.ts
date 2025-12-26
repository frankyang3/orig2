import Phaser from "phaser";
import { FIXED_TIME_STEP, TILE_SIZE, WORLD_WIDTH, WORLD_HEIGHT } from "../../../shared/src/constants";
import { InputManager } from "../systems/InputManager";
import { PlayerManager } from "../systems/PlayerManager";
import { WorldRenderer } from "../systems/WorldRenderer";
import { NetworkClient } from "../network/NetworkManager";
import { ASSETS } from "../clientConstants";

export class GameScene extends Phaser.Scene {
    private inputManager!: InputManager;
    private playerManager!: PlayerManager;
    private worldRenderer!: WorldRenderer;
    private network!: NetworkClient;
    private elapsedTime = 0;

    preload(): void {
        this.load.image(
            "ship_0001",
            ASSETS.SHIP
        );

        this.inputManager = new InputManager(this);
        this.inputManager.init();
    }

    async create(): Promise<void> {
        this.playerManager = new PlayerManager(this);
        this.worldRenderer = new WorldRenderer(this);
        this.worldRenderer.initialize();

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
                this.playerManager.onServerUpdate(x, y);
            },
            onRemoteUpdate: (sessionId, x, y) => {
                this.playerManager.setServerPosition(sessionId, x, y);
            },
            onWorldInit: (blocks) => {
                this.worldRenderer.updateAllTiles(blocks);
                this.playerManager.setWorldData(blocks);

            },
            onBlockChange: (x, y, blockType) => {
                this.worldRenderer.updateTile(x, y, blockType);
                const index = y * WORLD_WIDTH + x;
                this.playerManager.updateBlockType(index, blockType);
            },
        });

        this.setupCamera();
    }

    private setupCamera(): void {
        const worldPixelWidth = WORLD_WIDTH * TILE_SIZE;
        const worldPixelHeight = WORLD_HEIGHT * TILE_SIZE;
        this.cameras.main.setBounds(0, 0, worldPixelWidth, worldPixelHeight);
    }

    update(_time: number, delta: number): void {
        if (!this.playerManager.hasLocalPlayer()) return;

        this.elapsedTime += delta;
        while (this.elapsedTime >= FIXED_TIME_STEP) {
            this.elapsedTime -= FIXED_TIME_STEP;
            this.fixedTick();
        }

        // Follow local player
        const localPos = this.playerManager.getLocalPlayerPosition();
        if (localPos) {
            this.cameras.main.centerOn(localPos.x, localPos.y);
        }
    }

    private fixedTick(): void {
        if (!this.network.isConnected()) return;

        const input = this.inputManager.getInput();
        this.network.sendInput(input);
        this.playerManager.applyInput(input);
        this.playerManager.reconcileWithServer();
        this.playerManager.interpolateRemotePlayers();
    }
}