import * as fs from "fs";
import * as path from "path";
import { WorldMap } from "../schema/World";
import { WORLD_HEIGHT, WORLD_WIDTH } from "../../../shared/src/constants";
import { AUTOSAVE_INTERVAL_MS_DEFAULT } from "../serverConstants";
import { generateDefaultWorld } from "./DefaultWorldGeneration";

interface SavedWorldData {
    version: number;
    width: number;
    height: number;
    blocks: { blockType: number; health: number }[];
    lastSaved: string;
}

export class WorldPersistence {
    private savePath: string;
    private autoSaveInterval: NodeJS.Timeout | null = null;

    constructor(worldName: string = "world") {
        const dataDir = path.join(__dirname, "../../data");

        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }

        this.savePath = path.join(dataDir, `${worldName}.json`);
    }

    load(worldMap: WorldMap): boolean {
        try {
            if (!fs.existsSync(this.savePath)) {
                console.log("No saved world found, generating new world...");
                this.initializeWithDefaultWorld(worldMap);
                return false;
            }

            const fileContent = fs.readFileSync(this.savePath, "utf-8");
            const savedData: SavedWorldData = JSON.parse(fileContent);

            if (savedData.width !== WORLD_WIDTH || savedData.height !== WORLD_HEIGHT) {
                console.warn("Saved world dimensions don't match, generating new world...");
                this.initializeWithDefaultWorld(worldMap);
                return false;
            }

            worldMap.loadFromData(savedData.blocks);
            console.log(`World loaded from ${this.savePath} (saved: ${savedData.lastSaved})`);
            return true;
        } catch (error) {
            console.error("Error loading world:", error);
            this.initializeWithDefaultWorld(worldMap);
            return false;
        }
    }

    save(worldMap: WorldMap): boolean {
        try {
            const saveData: SavedWorldData = {
                version: 1,
                width: WORLD_WIDTH,
                height: WORLD_HEIGHT,
                blocks: worldMap.toSaveData(),
                lastSaved: new Date().toISOString(),
            };

            fs.writeFileSync(this.savePath, JSON.stringify(saveData), "utf-8");
            console.log(`World saved to ${this.savePath}`);
            return true;
        } catch (error) {
            console.error("Error saving world:", error);
            return false;
        }
    }

    startAutoSave(worldMap: WorldMap, intervalMs: number = AUTOSAVE_INTERVAL_MS_DEFAULT): void {
        this.stopAutoSave();
        this.autoSaveInterval = setInterval(() => {
            this.save(worldMap);
        }, intervalMs);
        console.log(`Auto-save enabled every ${intervalMs / 1000} seconds`);
    }

    stopAutoSave(): void {
        if (this.autoSaveInterval) {
            clearInterval(this.autoSaveInterval);
            this.autoSaveInterval = null;
        }
    }

    private initializeWithDefaultWorld(worldMap: WorldMap): void {
        const blocks = generateDefaultWorld();

        for (const block of blocks) {
            worldMap.setBlockType(block.x, block.y, block.blockType);
        }

        this.save(worldMap);
    }
}