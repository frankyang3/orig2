/**
 * Constants for client config
 */

export const SERVER_URL = "ws://localhost:2567";
export const INTERPOLATION_SPEED = 0.3;

export const ASSETS = {
  SHIP: "https://cdn.glitch.global/3e033dcd-d5be-4db4-99e8-086ae90969ec/ship_0001.png",
} as const;

export const DISPLAY = {
  WIDTH: 800,
  HEIGHT: 600,
  BACKGROUND: "#b6d53c",
} as const;

// Threshold for position correction
export const SNAP_THRESHOLD = 50;  // If off by more than this, snap immediately
export const CORRECTION_THRESHOLD = 2;  // If off by more than this, start correcting
export const CORRECTION_SPEED = 0.2;  // How fast to correct (0-1)