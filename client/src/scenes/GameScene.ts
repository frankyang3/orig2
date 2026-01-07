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
import { HealthBarRenderer } from "../systems/HealthBarRenderer";
import { PlayerHUD } from "../systems/PlayerHUD";
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
    private playerHealthBars!: HealthBarRenderer;
    private playerHUD!: PlayerHUD;
    private network!: NetworkClient;
    private elapsedTime = 0;

    private localHealth = 100;
    private localMaxHealth = 100;

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
        this.playerHealthBars = new HealthBarRenderer(this);

        this.worldRenderer = new WorldRenderer(this);
        this.worldRenderer.initialize();

        this.cameraManager = new CameraManager(this);
        this.cameraManager.setup();

        // Create HUD after camera setup
        this.playerHUD = new PlayerHUD(this);
        this.playerHUD.create();

        this.network = new NetworkClient();

        await this.network.connect({
            // Player callbacks
            onAdd: (sessionId, x, y, health, maxHealth, isLocal) => {
                const entity = this.playerRegistryManager.add(sessionId, x, y, isLocal);
                if (isLocal) {
                    this.localPlayerManager.initialize(entity, x, y, true);
                    this.collisionManager.setLocalPlayerId(sessionId);
                    this.localHealth = health;
                    this.localMaxHealth = maxHealth;
                    this.playerHUD.updateHealth(health, maxHealth);
                }
                this.collisionManager.updatePlayerPosition(sessionId, x, y);
                this.playerHealthBars.add(sessionId, x, y, health, maxHealth);
            },
            onRemove: (sessionId) => {
                this.playerRegistryManager.remove(sessionId);
                this.collisionManager.removePlayer(sessionId);
                this.playerHealthBars.remove(sessionId);
            },
            onLocalUpdate: (x, y, health, maxHealth) => {
                this.localPlayerManager.onServerUpdate(x, y);
                this.localHealth = health;
                this.localMaxHealth = maxHealth;
                this.playerHUD.updateHealth(health, maxHealth);

                const localSessionId = this.network.getSessionId();
                if (localSessionId) {
                    this.collisionManager.updatePlayerPosition(localSessionId, x, y);
                }
            },
            onRemoteUpdate: (sessionId, x, y, health, maxHealth) => {
                const entity = this.playerRegistryManager.get(sessionId);
                if (entity) {
                    this.remotePlayersInterpolator.setTargetPosition(entity, x, y);
                    this.collisionManager.updatePlayerPosition(sessionId, x, y);
                    this.playerHealthBars.update(sessionId, entity.x, entity.y, health, maxHealth);
                }
            },
            // World callbacks
            onWorldInit: (blocks) => {
                this.worldRenderer.updateAllTiles(blocks);
                this.collisionManager.setWorldData(blocks);
            },
            onBlockChange: (x, y, blockType) => {
                this.worldRenderer.updateTile(x, y, blockType);
                const index = y * WORLD_WIDTH + x;
                this.collisionManager.updateBlockType(index, blockType);
            },
            // Enemy callbacks
            onEnemyAdd: (id, enemyType, x, y, health, maxHealth) => {
                this.enemyRenderer.add(id, enemyType, x, y, health, maxHealth);
            },
            onEnemyRemove: (id) => {
                this.enemyRenderer.remove(id);
            },
            onEnemyUpdate: (id, x, y, health, maxHealth) => {
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

        // Update local player health bar and camera
        const localPos = this.localPlayerManager.getPosition();
        const localSessionId = this.network.getSessionId();
        if (localPos && localSessionId) {
            this.playerHealthBars.update(localSessionId, localPos.x, localPos.y, this.localHealth, this.localMaxHealth);
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