import { Shape, ShapeParams } from "./Shape.js";
import { Pixels } from "../Utils.js";
import { Renderer } from "../Renderer.js";

export class Collection extends Shape {
    shapes: Shape[];

    constructor({ x, y, color }: ShapeParams) {
        super({ x, y, color });
        this.shapes = [];
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
