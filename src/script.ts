class CanvasDrawer {
    private canvas: HTMLCanvasElement
    private ctx: CanvasRenderingContext2D
    private pixel_width: number
    private pixel_height: number
    private grid_width: number = 1

    constructor(canvasId: string, pixel_width: number = 64, pixel_height: number = 64) {
        const canvas = document.getElementById(canvasId) as HTMLCanvasElement;
        if (!canvas) {
            throw new Error('Canvas element not found');
        }
        this.canvas = canvas;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
            throw new Error('2D context not supported');
        }
        this.ctx = ctx;
        ctx.scale(0.5, 0.5);
        canvas.width *= 2;
        canvas.height *= 2;
        this.pixel_width = pixel_width;
        this.pixel_height = pixel_height;
    }

    clear(color: string = '#ffffff') {
        this.ctx.fillStyle = color;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        const x_offset = this.canvas.width / this.pixel_width;
        for (let x = 0; x < this.pixel_width; x++) {
            this.ctx.fillStyle = '#000';
            this.ctx.fillRect(x * x_offset, 0, this.grid_width, this.canvas.height);
        }

        const y_offset = this.canvas.height / this.pixel_height;
        for (let y = 0; y < this.pixel_height; y++) {
            this.ctx.fillStyle = '#000';
            this.ctx.fillRect(0, y * y_offset, this.canvas.width, this.grid_width);
        }
    }

    setPixel(x: number, y: number, color: Color) {
        const pixelWidth = this.canvas.width / this.pixel_width;
        const pixelHeight = this.canvas.height / this.pixel_height;
        this.ctx.fillStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${color.a})`;
        this.ctx.fillRect(x * pixelWidth + this.grid_width, y * pixelHeight + this.grid_width, pixelWidth - this.grid_width, pixelHeight - this.grid_width);

    }
}

type Color = { r: number, g: number, b: number, a: number };

type Pixel = {
    x: number;
    y: number;
    color: Color;
}

type Pixels = Array<Pixel>;

type DrawOptions = {
    screen_width: number,
    screen_height: number,
    antialias: boolean,
}

type ShapeParams = {
    x: number,
    y: number,
    z?: number,
    color: Color,
}

abstract class Shape {
    x: number;
    y: number
    color: Color;
    rotation: {
        x: number,
        y: number,
        angle: number,
    };
    z: number;

    constructor(params: ShapeParams) {
        this.x = params.x;
        this.y = params.y;
        this.z = params.z || 0;
        this.color = params.color;
        this.rotation = {
            x: params.x,
            y: params.y,
            angle: 0,
        }
    }

    changeColor(color: Color) {
        this.color = color;
    }

    setZ(z: number) {
        this.z = z;
    }

    setPosition(x: number, y: number) {
        this.x = x;
        this.y = y;

    }

    rotate(angle: number) {
        this.rotation.angle = (this.rotation.angle + angle) % 360;
    }

    // https://en.wikipedia.org/wiki/Rotations_and_reflections_in_two_dimensions#Mathematical_expression
    protected getRotatedPosition(x: number, y: number): { x: number, y: number } {
        const angleRad = this.rotation.angle * Math.PI / 180;
        const cos = Math.cos(angleRad);
        const sin = Math.sin(angleRad);

        const originX = this.rotation.x;
        const originY = this.rotation.y;
        const translatedX = x - originX;
        const translatedY = y - originY;

        return {
            x: Math.round(translatedX * cos + translatedY * sin + originX),
            y: Math.round(translatedX * -sin + translatedY * cos + originY),
        }
    }

    setPivot(x: number, y: number) {
        this.rotation.x = x;
        this.rotation.y = y;
    }
    draw(options: DrawOptions): Pixels {
        return options.antialias ? this.drawAntiAliased() : this.drawAliased();
    }

    abstract drawAntiAliased(): Pixels;
    abstract drawAliased(): Pixels;
}


class Circle extends Shape {
    radius: number;
    fill: boolean;

    constructor(x: number, y: number, color: string, radius: number, fill: boolean = true) {
        super(x, y, color);
        this.radius = radius;
        this.fill = fill;
    }

    draw(display_width: number, display_height: number): Pixels {
        let points: Array<{ x: number, y: number }> = [];
        return points
    }
}

type RectangleParams = ShapeParams & {
    width: number,
    height: number,
    fill?: boolean,
}

class Rectangle extends Shape {
    width: number;
    height: number
    fill: boolean;

    constructor(params: RectangleParams) {
        super({ x: params.x, y: params.y, z: params.z, color: params.color });
        this.width = params.width;
        this.height = params.height;
        this.fill = params.fill === undefined ? true : params.fill;
    }

    private getSegments(): LineSegment[] {
        const tl = this.getRotatedPosition(this.x, this.y);
        const tr = this.getRotatedPosition(this.x + this.width - 1, this.y)
        const bl = this.getRotatedPosition(this.x, this.y + this.height - 1);
        const br = this.getRotatedPosition(this.x + this.width - 1, this.y + this.height - 1);

        return [
            new LineSegment({ x: tl.x, y: tl.y, x2: tr.x, y2: tr.y, color: this.color, z: this.z }),
            new LineSegment({ x: bl.x, y: bl.y, x2: br.x, y2: br.y, color: this.color, z: this.z }),
            new LineSegment({ x: tl.x, y: tl.y, x2: bl.x, y2: bl.y, color: this.color, z: this.z }),
            new LineSegment({ x: tr.x, y: tr.y, x2: br.x, y2: br.y, color: this.color, z: this.z }),
        ];
    }

    drawAntiAliased() {
        let points: Pixels = [];
        const [top, bottom, left, right] = this.getSegments();
        const topPoints = top.drawAntiAliased();
        const bottomPoints = bottom.drawAntiAliased();
        const leftPoints = left.drawAntiAliased();
        const rightPoints = right.drawAntiAliased();

        points = points.concat(topPoints, bottomPoints, leftPoints, rightPoints);

        return points
    }

    drawAliased(): Pixels {
        let points: Pixels = [];
        const [top, bottom, left, right] = this.getSegments();
        const topPoints = top.drawAliased();
        const bottomPoints = bottom.drawAliased();
        const leftPoints = left.drawAliased();
        const rightPoints = right.drawAliased();

        points = points.concat(topPoints, bottomPoints, leftPoints, rightPoints);

        return points
    }
}

class RegularPolygon extends Shape {
    sides: number;
    sideLength: number;
    fill: boolean;

    constructor(x: number, y: number, color: string, sides: number, sideLength: number, fill: boolean = true) {
        super(x, y, color);
        this.sides = sides;
        this.sideLength = sideLength;
        this.fill = fill;
    }
}

class Polygon extends Shape {
    points: Array<{ x: number, y: number }>;
    fill: boolean;

    constructor(x: number, y: number, color: string, points: Array<{ x: number, y: number }>, fill: boolean = true) {
        super(x, y, color);
        this.points = points;
        this.fill = fill;
    }
}

type LineSegmentParams = ShapeParams & {
    x2: number,
    y2: number,
}

class LineSegment extends Shape {
    x2: number;
    y2: number;

    constructor(params: LineSegmentParams) {
        super({ x: params.x, y: params.y, color: params.color, z: params.z });
        this.x2 = params.x2;
        this.y2 = params.y2;
    }

    // https://en.wikipedia.org/wiki/Bresenham%27s_line_algorithm
    drawAliased(): Pixels {
        const transformedStart = this.getRotatedPosition(this.x, this.y);
        const transformedEnd = this.getRotatedPosition(this.x2, this.y2);


        const x0 = Math.round(transformedStart.x);
        const y0 = Math.round(transformedStart.y);
        const x1 = Math.round(transformedEnd.x);
        const y1 = Math.round(transformedEnd.y);

        const dx = Math.abs(x1 - x0);
        const dy = Math.abs(y1 - y0);
        const sx = x0 < x1 ? 1 : -1;
        const sy = y0 < y1 ? 1 : -1;

        let points: Pixels = [];
        let x = x0;
        let y = y0;
        let err = dx - dy;

        points.push({ x, y, color: this.color });

        while (x !== x1 || y !== y1) {
            const e2 = 2 * err;

            if (e2 > -dy) {
                err -= dy;
                x += sx;
            }

            if (e2 < dx) {
                err += dx;
                y += sy;
            }

            points.push({ x, y, color: this.color });
        }

        return points;
    }
    drawAntiAliased(): Pixels {
        const transformedStart = this.getRotatedPosition(this.x, this.y);
        const transformedEnd = this.getRotatedPosition(this.x2, this.y2);

        const x0 = transformedStart.x;
        const y0 = transformedStart.y;
        const x1 = transformedEnd.x;
        const y1 = transformedEnd.y;

        return this.wuLine(x0, y0, x1, y1);
    }

    // Xiaolin Wu's line algorithm
    // https://en.wikipedia.org/wiki/Xiaolin_Wu%27s_line_algorithm
    private wuLine(x0: number, y0: number, x1: number, y1: number): Pixels {
        const points: Pixels = [];

        const steep = Math.abs(y1 - y0) > Math.abs(x1 - x0);

        if (steep) {
            [x0, y0] = [y0, x0];
            [x1, y1] = [y1, x1];
        }

        if (x0 > x1) {
            [x0, x1] = [x1, x0];
            [y0, y1] = [y1, y0];
        }

        const dx = x1 - x0;
        const dy = y1 - y0;
        const gradient = dx === 0 ? 1 : dy / dx;

        let xend = Math.round(x0);
        let yend = y0 + gradient * (xend - x0);
        let xgap = 1 - (x0 + 0.5) % 1;
        let xpxl1 = xend;
        let ypxl1 = Math.floor(yend);

        if (steep) {
            this.addPixel(points, ypxl1, xpxl1, (1 - (yend % 1)) * xgap);
            this.addPixel(points, ypxl1 + 1, xpxl1, (yend % 1) * xgap);
        } else {
            this.addPixel(points, xpxl1, ypxl1, (1 - (yend % 1)) * xgap);
            this.addPixel(points, xpxl1, ypxl1 + 1, (yend % 1) * xgap);
        }

        let intery = yend + gradient;

        xend = Math.round(x1);
        yend = y1 + gradient * (xend - x1);
        xgap = (x1 + 0.5) % 1;
        let xpxl2 = xend;
        let ypxl2 = Math.floor(yend);

        if (steep) {
            this.addPixel(points, ypxl2, xpxl2, (1 - (yend % 1)) * xgap);
            this.addPixel(points, ypxl2 + 1, xpxl2, (yend % 1) * xgap);
        } else {
            this.addPixel(points, xpxl2, ypxl2, (1 - (yend % 1)) * xgap);
            this.addPixel(points, xpxl2, ypxl2 + 1, (yend % 1) * xgap);
        }

        if (steep) {
            for (let x = xpxl1 + 1; x < xpxl2; x++) {
                this.addPixel(points, Math.floor(intery), x, 1 - (intery % 1));
                this.addPixel(points, Math.floor(intery) + 1, x, intery % 1);
                intery += gradient;
            }
        } else {
            for (let x = xpxl1 + 1; x < xpxl2; x++) {
                this.addPixel(points, x, Math.floor(intery), 1 - (intery % 1));
                this.addPixel(points, x, Math.floor(intery) + 1, intery % 1);
                intery += gradient;
            }
        }

        return points;
    }

    private addPixel(points: Pixels, x: number, y: number, a: number) {
        const clampedX = Math.max(0, Math.round(x));
        const clampedY = Math.max(0, Math.round(y));

        if (a > 0.01) {
            points.push({
                x: clampedX,
                y: clampedY,
                color: {
                    r: this.color.r,
                    g: this.color.g,
                    b: this.color.b,
                    a: Math.max(0, Math.min(1, a)),
                }
            });
        }
    }
}
type PointParams = ShapeParams & {
}
class Point extends Shape {

}

class Collection extends Shape {
    shapes: Shape[];

    constructor(x: number, y: number, color: Color) {
        super({ x, y, color });
        this.shapes = [];
    }

    addShape(shape: Shape) {
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


class Renderer {
    width: number;
    height: number;
    backgroundColor: Color;

    constructor(width: number, height: number, backgroundColor: Color = { r: 255, g: 255, b: 255, a: 1 }) {
        this.width = width;
        this.height = height;
        this.backgroundColor = backgroundColor;
    }

    render(collections: Collection[], options: DrawOptions): Pixels {
        let pixels: Pixels = [];
        for (const collection of collections.sort((a, b) => a.z - b.z)) {
            pixels = pixels.concat(collection.draw(options));
        }
        return pixels;
    }

    static blendPixels(pixels: Pixels): Pixels {
        const pixelMap = new Map<string, Pixel>();

        for (const pixel of pixels) {
            const key = `${pixel.x},${pixel.y}`;

            if (pixelMap.has(key)) {
                const existingPixel = pixelMap.get(key)!;

                if (pixel.color.a >= 0.999) {
                    pixelMap.set(key, pixel);
                }
                else if (existingPixel.color.a < 0.999) {
                    const blended = Renderer.blendPixel(existingPixel, pixel);
                    pixelMap.set(key, blended);
                }
            } else {
                pixelMap.set(key, pixel);
            }
        }

        return Array.from(pixelMap.values());
    }

    static blendPixel(background: Pixel, foreground: Pixel): Pixel {

        const alpha = foreground.color.a;

        return {
            x: foreground.x,
            y: foreground.y,
            color: {
                r: Math.round(foreground.color.r * alpha + background.color.r * (1 - alpha)),
                g: Math.round(foreground.color.g * alpha + background.color.g * (1 - alpha)),
                b: Math.round(foreground.color.b * alpha + background.color.b * (1 - alpha)),
                a: Math.min(1, background.color.a + alpha * (1 - background.color.a))
            }
        };
    }
}

window.addEventListener('DOMContentLoaded', () => {
    const drawer = new CanvasDrawer('myCanvas');
    drawer.clear('#FFF');

    const renderer = new Renderer(64, 64, { r: 255, g: 255, b: 255, a: 1 });

    const scene = new Collection(0, 0, { r: 255, g: 255, b: 255, a: 1 });

    const rect = new Rectangle({ x: 30, y: 30, color: { r: 0, g: 255, b: 0, a: 1 }, width: 20, height: 10, fill: false })
    rect.rotate(30);
    rect.setPivot(20, 20);
    scene.addShape(rect);
    const rect2 = new Rectangle({ x: 30, y: 30, color: { r: 140, g: 0, b: 0, a: 1 }, width: 20, height: 10, fill: false })
    rect2.rotate(-30);
    rect2.setPivot(50, 40);
    scene.addShape(rect2);


    let line = new LineSegment({ x: 10, y: 10, color: { r: 0, g: 255, b: 255, a: 0.5 }, x2: 14, y2: 10, z: 1 });
    scene.addShape(line);

    line = new LineSegment({ x: 10, y: 10, color: { r: 0, g: 0, b: 255, a: 0.5 }, x2: 14, y2: 10, z: 2 });
    line.rotate(60);
    scene.addShape(line);

    line = new LineSegment({ x: 10, y: 10, color: { r: 255, g: 0, b: 0, a: 0.5 }, x2: 14, y2: 10 });
    line.rotate(-60);
    line.setPivot(14, 10);
    scene.addShape(line);

    const pixels = renderer.render([scene], {
        screen_width: 64,
        screen_height: 64,
        antialias: true
    });

    for (const px of pixels) {
        drawer.setPixel(px.x, px.y, px.color);
    }
});
