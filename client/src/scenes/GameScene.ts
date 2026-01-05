import Phaser from "phaser";
import { FIXED_TIME_STEP, WORLD_WIDTH } from "../../../shared/src/constants";
import { InputManager } from "../systems/InputManager";
import { PlayerRegistryManager } from "../systems/PlayerRegistryManager";
import { LocalPlayerManager } from "../systems/LocalPlayerManager";
import { RemotePlayersInterpolator } from "../systems/RemotePlayerInterpolator";
import { CollisionManager } from "../systems/CollisionManager";
import { WorldRenderer } from "../systems/WorldRenderer";
import { CameraManager } from "../systems/CameraManager";
import { EnemyRenderer } from "../systems/EnemyRenderer";
import { NetworkClient } from "../network/NetworkManager";
import { ASSETS } from "../clientConstants";

export class GameScene extends Phaser.Scene {
    private inputManager!: InputManager;
    private playerRegistryManager!: PlayerRegistryManager;
    private localPlayerManager!: LocalPlayerManager;
    private remotePlayersInterpolator!: RemotePlayersInterpolator;
    private collisionManager!: CollisionManager;
    private worldRenderer!: WorldRenderer;
    private cameraManager!: CameraManager;
    private enemyRenderer!: EnemyRenderer;
    private network!: NetworkClient;
    private elapsedTime = 0;

    preload(): void {
        this.load.image("ship_0001", ASSETS.SHIP);

        this.inputManager = new InputManager(this);
        this.inputManager.init();
    }

    async create(): Promise<void> {
        this.collisionManager = new CollisionManager();
        this.playerRegistryManager = new PlayerRegistryManager(this);
        this.localPlayerManager = new LocalPlayerManager(this, this.collisionManager);
        this.remotePlayersInterpolator = new RemotePlayersInterpolator();
        this.enemyRenderer = new EnemyRenderer(this);

        this.worldRenderer = new WorldRenderer(this);
        this.worldRenderer.initialize();

        this.cameraManager = new CameraManager(this);
        this.cameraManager.setup();

        this.network = new NetworkClient();

        await this.network.connect({
            onAdd: (sessionId, x, y, isLocal) => {
                const entity = this.playerRegistryManager.add(sessionId, x, y, isLocal);
                if (isLocal) {
                    this.localPlayerManager.initialize(entity, x, y, true);
                    this.collisionManager.setLocalPlayerId(sessionId);
                }
                this.collisionManager.updatePlayerPosition(sessionId, x, y);
            },
            onRemove: (sessionId) => {
                this.playerRegistryManager.remove(sessionId);
                this.collisionManager.removePlayer(sessionId);
            },
            onLocalUpdate: (x, y) => {
                this.localPlayerManager.onServerUpdate(x, y);
                const localSessionId = this.network.getSessionId();
                if (localSessionId) {
                    this.collisionManager.updatePlayerPosition(localSessionId, x, y);
                }
            },
            onRemoteUpdate: (sessionId, x, y) => {
                const entity = this.playerRegistryManager.get(sessionId);
                if (entity) {
                    this.remotePlayersInterpolator.setTargetPosition(entity, x, y);
                    this.collisionManager.updatePlayerPosition(sessionId, x, y);
                }
            },
            onWorldInit: (blocks) => {
                this.worldRenderer.updateAllTiles(blocks);
                this.collisionManager.setWorldData(blocks);
            },
            onBlockChange: (x, y, blockType) => {
                this.worldRenderer.updateTile(x, y, blockType);
                const index = y * WORLD_WIDTH + x;
                this.collisionManager.updateBlockType(index, blockType);
            },
            onEnemyAdd: (id, enemyType, x, y) => {
                this.enemyRenderer.add(id, enemyType, x, y);
            },
            onEnemyRemove: (id) => {
                this.enemyRenderer.remove(id);
            },
            onEnemyUpdate: (id, x, y) => {
                this.enemyRenderer.setTargetPosition(id, x, y);
            },
        });
    }

    update(_time: number, delta: number): void {
        if (!this.localPlayerManager.hasPlayer()) return;

        this.elapsedTime += delta;
        while (this.elapsedTime >= FIXED_TIME_STEP) {
            this.elapsedTime -= FIXED_TIME_STEP;
            this.fixedTick();
        }

        // Interpolate enemies every frame for smooth movement
        this.enemyRenderer.interpolateAll();

        const localPos = this.localPlayerManager.getPosition();
        if (localPos) {
            this.cameraManager.centerOn(localPos.x, localPos.y);
        }
    }

    private fixedTick(): void {
        if (!this.network.isConnected()) return;

        const input = this.inputManager.getInput();
        this.network.sendInput(input);
        this.localPlayerManager.applyInput(input);
        this.localPlayerManager.reconcile();

        for (const entity of this.playerRegistryManager.getRemotePlayers()) {
            this.remotePlayersInterpolator.interpolate(entity);
        }
    }
}