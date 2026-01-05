import Phaser from "phaser";
import { INTERPOLATION_SPEED } from "../clientConstants";

type PlayerEntity = Phaser.Types.Physics.Arcade.ImageWithDynamicBody;

const SERVER_X = "serverX";
const SERVER_Y = "serverY";

export class RemotePlayersInterpolator {
    setTargetPosition(entity: PlayerEntity, x: number, y: number): void {
        entity.setData(SERVER_X, x);
        entity.setData(SERVER_Y, y);
    }

    interpolate(entity: PlayerEntity): void {
        const serverX = entity.getData(SERVER_X);
        const serverY = entity.getData(SERVER_Y);

        if (serverX !== undefined && serverY !== undefined) {
            entity.x = Phaser.Math.Linear(entity.x, serverX, INTERPOLATION_SPEED);
            entity.y = Phaser.Math.Linear(entity.y, serverY, INTERPOLATION_SPEED);
        }
    }
}