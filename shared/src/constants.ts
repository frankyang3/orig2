// Timing
export const TICK_RATE = 60;
export const FIXED_TIME_STEP = 1000 / TICK_RATE;

// Gameplay
export const PLAYER_VELOCITY = 2;
export const INTERPOLATION_SPEED = 0.3;

// Network
export const SERVER_URL = "ws://localhost:2567";
export const ROOM_NAME = "my_room";
export const MAX_CLIENTS = 4;

export const MESSAGE_TYPES = {
  INPUT: 0,
} as const;

// Map
export const MAP_WIDTH = 800;
export const MAP_HEIGHT = 600;