import { Schema, type } from "@colyseus/schema";
import { InputPayload } from "../../../shared/src/types";

export class Player extends Schema {
  @type("number") x: number = 0;
  @type("number") y: number = 0;
  @type("number") health: number = 100;
  @type("number") maxHealth: number = 100;
  @type("number") rotation: number = 0;

  inputQueue: InputPayload[] = [];
}