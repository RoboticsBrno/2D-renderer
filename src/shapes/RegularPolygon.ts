import { Shape, ShapeParams } from './Shape.js';
import { Pixels } from '../Utils.js';
import { LineSegment } from './LineSegment.js';
import { Collider, RegularPolygonCollider } from '../Collider.js';

type RegularPolygonParams = ShapeParams & {
    sides: number,
} & (
        { sideLength: number, fill?: boolean } |
        { radius: number, fill?: boolean }
    );

export class RegularPolygon extends Shape {
    sides: number;
    type: 'sideLength' | 'radius';
    sideLength?: number;
    radius?: number;
    fill: boolean;

    constructor({ x, y, color, sides, ...config }: RegularPolygonParams) {
        super({ x, y, color });
        this.sides = sides;
        this.fill = config.fill ?? true;

        if ('sideLength' in config) {
            this.type = 'sideLength';
            this.sideLength = config.sideLength;
        } else {
            this.type = 'radius';
            this.radius = config.radius;
        }
    }

    private calculateRadiusFromSideLength(sideLength: number): number {
        return sideLength / (2 * Math.sin(Math.PI / this.sides));
    }

    defaultCollider(): Collider {
        return new RegularPolygonCollider(this.x, this.y, this.sides, this.type === 'radius' ? this.radius! : this.calculateRadiusFromSideLength(this.sideLength!));
    }

    private getVertices(): Array<{ x: number, y: number }> {
        let radius: number;
        if (this.type === 'radius' && this.radius !== undefined) {
            radius = this.radius;
        } else if (this.type === 'sideLength' && this.sideLength !== undefined) {
            radius = this.sideLength / (2 * Math.sin(Math.PI / this.sides));
        } else {
            throw new Error('Invalid configuration for RegularPolygon');
        }

        const vertices: Array<{ x: number, y: number }> = [];
        for (let i = 0; i < this.sides; i++) {
            const angle = 2 * Math.PI / this.sides * i - Math.PI / 2;
            const x = this.x + radius * Math.cos(angle);
            const y = this.y + radius * Math.sin(angle);
            const rotated = this.getTransformedPosition(x, y);
            vertices.push(rotated);
        }
        return vertices;
    }

    private getSegments(): LineSegment[] {
        const vertices = this.getVertices();
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
            const insidePoints: Pixels = this.getInsidePointsWithTexture(this.getVertices());
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
            const insidePoints: Pixels = this.getInsidePointsWithTexture(this.getVertices());
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
