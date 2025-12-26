import { Schema, MapSchema, type } from "@colyseus/schema";
import { Player } from "./Player";
import { WorldMap } from "./World";

export class GameState extends Schema {
  @type({ map: Player }) players = new MapSchema<Player>();
  @type(WorldMap) worldMap = new WorldMap();
}