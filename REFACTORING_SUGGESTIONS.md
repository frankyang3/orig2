# Refactoring Suggestions for orig2 Game

## 1. File Size Issues

### Large Files That Should Be Split:
- **`client/src/systems/PlayerManager.ts` (178 lines)** - This is the largest file and handles multiple responsibilities
- **`server/src/systems/WorldPersistance.ts` (124 lines)** - Combines persistence and world generation
- **`server/src/systems/PlayerSystem.ts` (121 lines)** - Handles both player spawning and collision detection

## 2. Magic Numbers and Constants

### Found Magic Numbers:
- **Player positioning**: `0`, `100` (fallback positions)
- **Player size**: `16` (half of player size, hardcoded in multiple places)
- **Collision corners**: Rectangle stroke width `1`
- **Percentages**: `0.05` (5% for wood), `0.03` (3% for stone)
- **Auto-save interval**: `60000` ms (60 seconds)
- **Buffer size**: `64 * 1024` (64 KB)
- **Spawn attempts**: `100` (max attempts to find spawn position)
- **Visual indicators**: `0xff0000` (red color for debug rectangle)
- **Tile borders**: `-1` for tile size adjustment
- **Opacity**: `0.2` for tile stroke

### Found Magic Strings:
- **Asset keys**: `"ship_0001"` (hardcoded in PlayerManager)
- **Server data keys**: `"serverX"`, `"serverY"` (used for entity data storage)
- **File paths**: `"game_world"` (world persistence name)
- **Routes**: `"/hello_world"` (in app.config.ts)

## 3. Code Structure Issues

### Duplicated Constants:
- `WORLD_WIDTH`, `WORLD_HEIGHT`, `TILE_SIZE`, `BLOCK_TYPE`, `BLOCK_COLORS` are duplicated in both `shared/src/constants.ts` and `server/src/serverConstants.ts`

### Mixed Responsibilities:
1. **PlayerManager** handles:
   - Entity management
   - Input processing
   - Collision detection
   - Server reconciliation
   - Debug visualization

2. **WorldPersistance** handles:
   - File I/O
   - World generation
   - Auto-save management

## 4. Recommended Refactoring Actions

### A. Split Large Files:

**PlayerManager.ts** should be split into:
```
- EntityManager.ts (entity creation/removal)
- PlayerController.ts (input handling)
- CollisionSystem.ts (collision detection)
- NetworkReconciliation.ts (server sync logic)
```

**WorldPersistance.ts** should be split into:
```
- WorldSerializer.ts (save/load logic)
- WorldGenerator.ts (world generation)
- AutoSaveManager.ts (auto-save functionality)
```

### B. Extract Constants:

Create new constant files:
```typescript
// shared/src/gameplayConstants.ts
export const PLAYER_SIZE = 32;
export const PLAYER_HALF_SIZE = 16;
export const MAX_SPAWN_ATTEMPTS = 100;
export const DEFAULT_SPAWN_X = 100;
export const DEFAULT_SPAWN_Y = 100;

// shared/src/worldGenConstants.ts
export const WOOD_SPAWN_CHANCE = 0.05;
export const STONE_SPAWN_CHANCE = 0.03;

// client/src/renderConstants.ts
export const DEBUG_STROKE_COLOR = 0xff0000;
export const DEBUG_STROKE_WIDTH = 1;
export const TILE_STROKE_OPACITY = 0.2;
export const TILE_BORDER_OFFSET = 1;

// server/src/networkConstants.ts
export const ENCODER_BUFFER_SIZE = 64 * 1024; // 64 KB
export const AUTO_SAVE_INTERVAL_MS = 60000; // 60 seconds
```

### C. Remove Duplicated Constants:

Delete `server/src/serverConstants.ts` and use only `shared/src/constants.ts` for shared constants.

### D. Create Asset Manager:

```typescript
// client/src/assets/AssetKeys.ts
export const ASSET_KEYS = {
  PLAYER_SHIP: "ship_0001",
  // Add other assets here
} as const;
```

### E. Improve Type Safety:

```typescript
// shared/src/types.ts
export interface Position {
  x: number;
  y: number;
}

export interface ServerEntityData {
  serverX: number;
  serverY: number;
}
```

### F. Configuration Objects:

```typescript
// server/src/config/worldConfig.ts
export const WORLD_CONFIG = {
  persistence: {
    defaultName: "game_world",
    autoSaveIntervalMs: 60000,
  },
  generation: {
    woodSpawnChance: 0.05,
    stoneSpawnChance: 0.03,
  }
};
```

## 5. Additional Recommendations

1. **Use Enums for Magic Strings**: Convert string literals to enums or const objects
2. **Extract Collision Logic**: Create a dedicated collision system that can be reused
3. **Centralize Debug Configuration**: Create a debug config file for all debug-related constants
4. **Implement Dependency Injection**: For better testability and modularity
5. **Add JSDoc Comments**: Document magic numbers that must remain (explain why they're those values)

## 6. Priority Order

1. **High Priority**: 
   - Remove duplicate constants
   - Extract magic numbers to named constants
   - Split PlayerManager.ts

2. **Medium Priority**:
   - Split WorldPersistance.ts
   - Create asset management system
   - Improve type safety

3. **Low Priority**:
   - Extract debug configuration
   - Add comprehensive documentation
