export interface InputPayload {
  left: boolean;
  right: boolean;
  up: boolean;
  down: boolean;
}

export interface PlayerState {
  x: number;
  y: number;
}

export function createInputPayload(): InputPayload {
  return { left: false, right: false, up: false, down: false };
}