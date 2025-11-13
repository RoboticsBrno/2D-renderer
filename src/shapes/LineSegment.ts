import { Shape, ShapeParams } from "./Shape.js";
import { Pixels } from "../Utils.js";
import { Collider, LineSegmentCollider } from "../Collider.js";

type LineSegmentParams = ShapeParams & {
    x2: number,
    y2: number,
}

export class LineSegment extends Shape {
    x2: number;
    y2: number;

    constructor({ x, y, color, z = 0, x2, y2 }: LineSegmentParams) {
        super({ x, y, color, z });
        this.x2 = x2;
        this.y2 = y2;
    }

    defaultCollider(): Collider {
        return new LineSegmentCollider(this.x, this.y, this.x2, this.y2);
    }

    // https://en.wikipedia.org/wiki/Bresenham%27s_line_algorithm
    drawAliased(): Pixels {
        const transformedStart = this.getTransformedPosition(this.x, this.y);
        const transformedEnd = this.getTransformedPosition(this.x2, this.y2);
        const x0 = transformedStart.x;
        const y0 = transformedStart.y;
        const x1 = transformedEnd.x;
        const y1 = transformedEnd.y;

        const points = this.bresenhamLine(x0, y0, x1, y1);

        return points;
    }

    drawAntiAliased(): Pixels {
        const transformedStart = this.getTransformedPosition(this.x, this.y);
        const transformedEnd = this.getTransformedPosition(this.x2, this.y2);

        const x0 = transformedStart.x;
        const y0 = transformedStart.y;
        const x1 = transformedEnd.x;
        const y1 = transformedEnd.y;

        const points: Pixels = this.wuLine(x0, y0, x1, y1)
        return points;
    }
}
