import { Shape, ShapeParams } from "./Shape.js";
import { Pixels } from "../Utils.js";
import { Collider, RectangleCollider } from "../Collider.js";

type RectangleParams = ShapeParams & {
    width: number,
    height: number,
    fill?: boolean,
}

export class Rectangle extends Shape {
    width: number;
    height: number;
    fill: boolean;

    constructor({ x, y, color, width, height, fill = false }: RectangleParams) {
        super({ x, y, color });
        this.width = width;
        this.height = height;
        this.fill = fill;
    }

    private getVertices(): Array<{ x: number, y: number }> {
        const tl = this.getTransformedPosition(this.x, this.y);
        const tr = this.getTransformedPosition(this.x + this.width - 1, this.y);
        const bl = this.getTransformedPosition(this.x, this.y + this.height - 1);
        const br = this.getTransformedPosition(this.x + this.width - 1, this.y + this.height - 1);

        return [tl, bl, br, tr];
    }

    getInsidePoints(vertices: Array<{ x: number, y: number }>): Pixels {
        const minX = Math.min(...vertices.map(v => v.x));
        const maxX = Math.max(...vertices.map(v => v.x));
        const minY = Math.min(...vertices.map(v => v.y));
        const maxY = Math.max(...vertices.map(v => v.y));

        let points: Pixels = [];
        for (let x = minX; x <= maxX; x++) {
            for (let y = minY; y <= maxY; y++) {
                let inside = false;
                for (let i = 0, j = vertices.length - 1; i < vertices.length; j = i++) {
                    const xi = vertices[i].x, yi = vertices[i].y;
                    const xj = vertices[j].x, yj = vertices[j].y;

                    const intersect = ((yi > y) !== (yj > y)) &&
                        (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
                    if (intersect) inside = !inside;
                }

                if (inside) {
                    const color = this.sampleTexture(x, y);
                    points.push({ x, y, color });
                }
            }
        }

        return points;
    }

    defaultCollider(): Collider {
        return new RectangleCollider(this.x, this.y, this.width, this.height);
    }

    drawAntiAliased(): Pixels {
        let points: Pixels = [];
        const vertices = this.getVertices();

        if (this.fill) {
            const insidePoints: Pixels = this.getInsidePoints(vertices);
            points = points.concat(insidePoints);
        }

        const [tl, bl, br, tr] = vertices;

        const topEdge = this.wuLine(tl.x, tl.y, tr.x, tr.y);
        const bottomEdge = this.wuLine(bl.x, bl.y, br.x, br.y);
        const leftEdge = this.wuLine(tl.x, tl.y, bl.x, bl.y);
        const rightEdge = this.wuLine(tr.x, tr.y, br.x, br.y);

        points = points.concat(topEdge, bottomEdge, leftEdge, rightEdge);
        return points;
    }

    drawAliased(): Pixels {
        let points: Pixels = [];
        const vertices = this.getVertices();

        if (this.fill) {
            const insidePoints: Pixels = this.getInsidePoints(vertices);
            points = points.concat(insidePoints);
        }

        const [tl, bl, br, tr] = vertices;

        const topEdge = this.bresenhamLine(tl.x, tl.y, tr.x, tr.y);
        const bottomEdge = this.bresenhamLine(bl.x, bl.y, br.x, br.y);
        const leftEdge = this.bresenhamLine(tl.x, tl.y, bl.x, bl.y);
        const rightEdge = this.bresenhamLine(tr.x, tr.y, br.x, br.y);

        points = points.concat(topEdge, bottomEdge, leftEdge, rightEdge);

        return points;
    }
}
