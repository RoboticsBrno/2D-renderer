import { Shape, ShapeParams } from './Shape.js';
import { Pixels } from '../Utils.js';

type CircleParams = ShapeParams & {
    radius: number;
    fill?: boolean;
};

export class Circle extends Shape {
    radius: number;
    fill: boolean;

    constructor({ x, y, color, radius, fill = false }: CircleParams) {
        super({ x, y, color });
        this.radius = radius;
        this.fill = fill;
    }

    drawAliased(): Pixels {
        let points: Pixels = [];
        const center = this.getTransformedPosition(this.x, this.y);
        const r = this.radius;

        let x = 0;
        let y = r;
        let d = 1 - r;

        while (x <= y) {
            this.drawCirclePoints(points, center.x, center.y, x, y);

            if (d < 0) {
                d = d + 2 * x + 3;
            } else {
                d = d + 2 * (x - y) + 5;
                y--;
            }
            x++;
        }

        if (this.fill) {
            this.fillCircle(points, center.x, center.y, r);
        }

        return points;
    }

    drawAntiAliased(): Pixels {
        let points: Pixels = [];
        const center = this.getTransformedPosition(this.x, this.y);
        const r = this.radius;

        // Xiaolin Wu's circle algorithm for anti-aliased rendering
        for (let x = 0; x <= r / Math.sqrt(2); x++) {
            const y = Math.sqrt(r * r - x * x);

            const error = y - Math.floor(y);
            const intensity = error;
            const intensity2 = 1 - error;

            const y1 = Math.floor(y);
            const y2 = y1 + 1;

            this.drawAntiAliasedPoint(points, center.x, center.y, x, y1, intensity2);
            this.drawAntiAliasedPoint(points, center.x, center.y, x, y2, intensity);
            this.drawAntiAliasedPoint(points, center.x, center.y, y1, x, intensity2);
            this.drawAntiAliasedPoint(points, center.x, center.y, y2, x, intensity);
        }

        if (this.fill) {
            this.fillCircleAntiAliased(points, center.x, center.y, r);
        }

        return points;
    }

    private getPointsToDraw(cx: number, cy: number, x: number, y: number) {
        return [
            { x: cx + x, y: cy + y },
            { x: cx - x, y: cy + y },
            { x: cx + x, y: cy - y },
            { x: cx - x, y: cy - y },
            { x: cx + y, y: cy + x },
            { x: cx - y, y: cy + x },
            { x: cx + y, y: cy - x },
            { x: cx - y, y: cy - x }
        ];
    }

    private drawCirclePoints(points: Pixels, cx: number, cy: number, x: number, y: number) {
        const pointsToDraw = this.getPointsToDraw(cx, cy, x, y);
        for (const point of pointsToDraw) {
            const color = this.sampleTexture(point.x, point.y);
            points.push({
                x: Math.round(point.x),
                y: Math.round(point.y),
                color
            });
        }
    }

    private drawAntiAliasedPoint(points: Pixels, cx: number, cy: number, x: number, y: number, intensity: number) {
        const pointsToDraw = this.getPointsToDraw(cx, cy, x, y);

        for (const point of pointsToDraw) {
            const clampedX = Math.max(0, Math.round(point.x));
            const clampedY = Math.max(0, Math.round(point.y));

            if (intensity > 0.01) {
                const color = this.sampleTexture(point.x, point.y);
                points.push({
                    x: clampedX,
                    y: clampedY,
                    color: {
                        r: color.r,
                        g: color.g,
                        b: color.b,
                        a: Math.max(0, Math.min(1, intensity * color.a)),
                    }
                });
            }
        }
    }

    private fillCircle(points: Pixels, cx: number, cy: number, r: number) {
        for (let y = -r; y <= r; y++) {
            const x = Math.sqrt(r * r - y * y);
            const startX = Math.ceil(cx - x);
            const endX = Math.floor(cx + x);

            for (let x = startX; x <= endX; x++) {
                const color = this.sampleTexture(x, cy + y);
                points.push({
                    x: Math.round(x),
                    y: Math.round(cy + y),
                    color
                });
            }
        }
    }

    private fillCircleAntiAliased(points: Pixels, cx: number, cy: number, r: number) {
        // Anti-aliased circle fill using distance field
        for (let y = Math.ceil(cy - r); y <= Math.floor(cy + r); y++) {
            for (let x = Math.ceil(cx - r); x <= Math.floor(cx + r); x++) {
                const dx = x - cx;
                const dy = y - cy;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance <= r) {
                    const color = this.sampleTexture(x, y);
                    let alpha = color.a;

                    // Soft edges for anti-aliasing
                    if (distance > r - 1) {
                        alpha *= (r - distance);
                    }

                    if (alpha > 0.01) {
                        points.push({
                            x: Math.round(x),
                            y: Math.round(y),
                            color: {
                                r: color.r,
                                g: color.g,
                                b: color.b,
                                a: alpha
                            }
                        });
                    }
                }
            }
        }
    }
}
