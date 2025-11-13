import { Shape, ShapeParams } from "./Shape.js";
import { Pixels } from "../Utils.js";
import { Collider, PointCollider } from "../Collider.js";

export class Point extends Shape {
    constructor({ x, y, color }: ShapeParams) {
        super({ x, y, color });
    }

    drawAntiAliased(): Pixels {
        const color = this.sampleTexture(this.x, this.y);
        return [{ x: this.x, y: this.y, color }];
    }

    drawAliased(): Pixels {
        const color = this.sampleTexture(this.x, this.y);
        return [{ x: this.x, y: this.y, color }];
    }

    defaultCollider(): Collider {
        return new PointCollider(this.x, this.y);
    }
}
