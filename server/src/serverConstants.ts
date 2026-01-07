/**
 * Constants for server config
 */

// export const PORT = 2567; // not used, saved for reference
export const MAX_CLIENTS = 4;
export const SIM_LATENCY_MS = 30;

export const AUTOSAVE_INTERVAL_MS = 60000; // Save world every 60 seconds
export const AUTOSAVE_INTERVAL_MS_DEFAULT = 60000;

export const BLOCK_HEALTH = 100;

//temp player spawn position
export const PLAYER_SPAWN_X = 100;
export const PLAYER_SPAWN_Y = 100;

//World gen
export const WOOD_SPAWN_CHANCE = 0.05; // 5% chance of wood block when generating world
export const STONE_SPAWN_CHANCE = 0.02; // 2% chance of stone block when generating world
export const INITIAL_ENEMY_COUNT = 10;

// Damage
export const PLAYER_MAX_HEALTH = 100;
export const ENEMY_CONTACT_DAMAGE = 10;
export const DAMAGE_COOLDOWN_MS = 1000; // 1 second invulnerability after taking damage
export const PLAYER_RESPAWN_DELAY_MS = 3000;