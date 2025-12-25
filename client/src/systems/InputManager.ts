import Phaser from "phaser";
import { InputPayload, createInputPayload } from "../../../shared/src/types";

export class InputManager {
    private cursorKeys!: Phaser.Types.Input.Keyboard.CursorKeys;
    private wasd!: Record<string, Phaser.Input.Keyboard.Key>;
    private payload: InputPayload = createInputPayload();

    constructor(private scene: Phaser.Scene) { }

    init(): boolean {
        const keyboard = this.scene.input.keyboard;
        if (!keyboard) {
            console.warn("Keyboard input disabled");
            return false;
        }

        this.cursorKeys = keyboard.createCursorKeys();
        this.wasd = keyboard.addKeys("w,a,s,d") as Record<string, Phaser.Input.Keyboard.Key>;
        return true;
    }

    getInput(): InputPayload {
        this.payload.left = this.cursorKeys.left.isDown || this.wasd.a.isDown;
        this.payload.right = this.cursorKeys.right.isDown || this.wasd.d.isDown;
        this.payload.up = this.cursorKeys.up.isDown || this.wasd.w.isDown;
        this.payload.down = this.cursorKeys.down.isDown || this.wasd.s.isDown;
        return this.payload;
    }
}