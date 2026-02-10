// Timing
export const TICK_RATE = 60;
export const FIXED_TIME_STEP = 1000 / TICK_RATE;

// Gameplay
export const PLAYER_VELOCITY = 2;

// Network
export const ROOM_NAME = "my_room";

export const MESSAGE_TYPES = {
  INPUT: 0,
  PLACE_BLOCK: 1,
  BREAK_BLOCK: 2,
  ATTACK: 3,
} as const;

// Attack
export const ATTACK_CONE_HALF_ANGLE = Math.PI / 4; // 45 degrees each side (90 total)
export const ATTACK_RANGE = 60;
export const ATTACK_COOLDOWN_MS = 500;
export const ATTACK_DAMAGE = 25;

// Map
export const MAP_WIDTH = 800;
export const MAP_HEIGHT = 600;

//num of blocks in world
export const WORLD_HEIGHT = 50;
export const WORLD_WIDTH = 50;

export const TILE_SIZE = 32;    // pixels MAYBE goes in client
export const PLAYER_SIZE = 24;  // Smaller than tile to fit through 1-wide gaps

// Block Types - should be connected integers RN, GRASS is smallest, STONE is largest
export const BLOCK_TYPE = {
  GRASS: 0,   // grass
  WOOD: 1,
  STONE: 2,
} as const;

export type BlockType = typeof BLOCK_TYPE[keyof typeof BLOCK_TYPE];

// Block Colors (for rendering without textures)
export const BLOCK_COLORS = {
  [BLOCK_TYPE.GRASS]: 0x7ec850,  // grass green
  [BLOCK_TYPE.WOOD]: 0x8b4513,   // brown
  [BLOCK_TYPE.STONE]: 0x808080,  // gray
} as const;