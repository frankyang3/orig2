import { Schema, type } from "@colyseus/schema";

export class Enemy extends Schema {
    @type("string") id: string = "";
    @type("string") enemyType: string = "";
    @type("number") x: number = 0;
    @type("number") y: number = 0;
    @type("number") health: number = 100;
    @type("number") maxHealth: number = 100;
    @type("number") velocityX: number = 0;
    @type("number") velocityY: number = 0;
    @type("string") state: string = "idle"; // idle, patrol, chase, attack
}