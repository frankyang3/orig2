import { Schema, type } from "@colyseus/schema";

export class Block extends Schema {
  @type("uint8") blockType: number = 0;  // 0=empty, 1=wood, 2=stone
  @type("uint8") health: number = 100;   // for future use
  
  // Reserved for future metadata - not synced yet but easy to add
  // @type("uint8") metadata: number = 0;
}