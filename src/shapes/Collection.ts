import { Shape, ShapeParams } from "./Shape.js";
import { Pixels } from "../Utils.js";
import { Renderer } from "../Renderer.js";
import { CircleCollider, Collider } from "../Collider.js";

export class Collection extends Shape {
    shapes: Shape[];

    constructor({ x, y, color }: ShapeParams) {
        super({ x, y, color });
        this.shapes = [];
    }

    defaultCollider(): Collider {
        // Collections do not have a default collider
        return new CircleCollider(0, 0, 0);
    }

    addShape(shape: Shape) {
        shape.setParent(this);
        this.shapes.push(shape);
    }

    drawAntiAliased(): Pixels {
        let pixels: Pixels = [];
        for (const shape of this.shapes.sort((a, b) => a.z - b.z)) {
            pixels = pixels.concat(shape.drawAntiAliased());
        }
        return Renderer.blendPixels(pixels);
    }

    drawAliased(): Pixels {
        let pixels: Pixels = [];
        for (const shape of this.shapes.sort((a, b) => a.z - b.z)) {
            pixels = pixels.concat(shape.drawAliased());
        }
        return Renderer.blendPixels(pixels);
    }
}
