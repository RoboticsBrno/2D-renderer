import { Shape, ShapeParams } from "./Shape.js";
import { Pixels } from "../Utils.js";
import { LineSegment } from "./LineSegment.js";
import { Collider, PolygonCollider } from "../Collider.js";

type PolygonParams = ShapeParams & {
    vertices: Array<{ x: number, y: number, relative?: boolean }>,
    fill?: boolean,
}

export class Polygon extends Shape {
    vertices: Array<{ x: number, y: number, relative?: boolean }>;
    fill: boolean;

    constructor({ x, y, color, vertices, fill = false }: PolygonParams) {
        super({ x, y, color });
        this.vertices = vertices.map(v => ({
            x: v.relative ? this.x + v.x : v.x,
            y: v.relative ? this.y + v.y : v.y,
            relative: false,
        }));
        this.fill = fill;
    }

    defaultCollider(): Collider {
        return new PolygonCollider(this.x, this.y, this.vertices);
    }

    private getTransformedVertices(): Array<{ x: number, y: number }> {
        return this.vertices.map(v => this.getTransformedPosition(v.x, v.y));
    }

    private getSegments(): LineSegment[] {
        const vertices = this.getTransformedVertices();
        const segments: LineSegment[] = [];

        for (let i = 0; i < vertices.length; i++) {
            const start = vertices[i];
            const end = vertices[(i + 1) % vertices.length];
            const segment = new LineSegment({ x: start.x, y: start.y, x2: end.x, y2: end.y, color: this.color, z: this.z });
            // Copy texture properties to segments
            if (this.texture) segment.setTexture(this.texture);
            segment.setTextureScale(this.uvTransform.scaleX, this.uvTransform.scaleY);
            segment.setTextureOffset(this.uvTransform.offsetX, this.uvTransform.offsetY);
            segment.setFixTexture(this.fixTexture);
            segments.push(segment);
        }

        return segments;
    }

    drawAliased(): Pixels {
        let points: Pixels = [];

        const segments = this.getSegments();

        for (const segment of segments) {
            const segmentPoints = segment.drawAliased();
            points = points.concat(segmentPoints);
        }

        if (this.fill) {
            const insidePoints: Pixels = this.getInsidePointsWithTexture(this.getTransformedVertices());
            points = points.concat(insidePoints);
        }

        return points
    }

    drawAntiAliased(): Pixels {
        let points: Pixels = [];

        const segments = this.getSegments();

        for (const segment of segments) {
            const segmentPoints = segment.drawAntiAliased();
            points = points.concat(segmentPoints);
        }

        if (this.fill) {
            const insidePoints: Pixels = this.getInsidePointsWithTexture(this.getTransformedVertices());
            points = points.concat(insidePoints);
        }

        return points
    }

    private getInsidePointsWithTexture(vertices: Array<{ x: number, y: number }>): Pixels {
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
}
