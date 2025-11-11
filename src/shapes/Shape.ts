import { Texture } from "../Texture.js";
import { Color, Pixels } from "../Utils.js";

export type DrawOptions = {
    screen_width: number,
    screen_height: number,
    antialias: boolean,
}

export type ShapeParams = {
    x: number,
    y: number,
    z?: number,
    color: Color,
}


export abstract class Shape {
    x: number;
    y: number;
    color: Color;
    rotation: {
        x: number,
        y: number,
        angle: number,
    };
    z: number;
    parent: Shape | null = null;
    scale: {
        x: number,
        y: number,
        originX: number,
        originY: number,
    };
    texture: Texture | null = null;
    fixTexture: boolean = false;
    uvTransform: {
        scaleX: number,
        scaleY: number,
        offsetX: number,
        offsetY: number,
        rotation: number
    }

    constructor(params: ShapeParams) {
        this.x = params.x;
        this.y = params.y;
        this.z = params.z || 0;
        this.color = params.color;
        this.rotation = {
            x: params.x,
            y: params.y,
            angle: 0,
        };
        this.scale = {
            x: 1,
            y: 1,
            originX: params.x,
            originY: params.y,
        };
        this.uvTransform = {
            scaleX: 1,
            scaleY: 1,
            offsetX: 0,
            offsetY: 0,
            rotation: 0,
        }
    }

    setTexture(texture: Texture) {
        this.texture = texture;
    }

    setTextureScale(scaleX: number, scaleY: number) {
        this.uvTransform.scaleX = scaleX;
        this.uvTransform.scaleY = scaleY;
    }

    setTextureOffset(offsetX: number, offsetY: number) {
        this.uvTransform.offsetX = offsetX;
        this.uvTransform.offsetY = offsetY;
    }

    setFixTexture(fixed: boolean) {
        this.fixTexture = fixed;
    }

    setTextureRotation(rotation: number) {
        this.uvTransform.rotation = rotation;
    }

    sampleTexture(x: number, y: number) {
        if (!this.texture) {
            return this.color;
        }

        let localX = x - this.x;
        let localY = y - this.y;

        if (this.fixTexture && this.rotation.angle !== 0) {
            const angleRad = -this.rotation.angle * Math.PI / 180;
            const cos = Math.cos(angleRad);
            const sin = Math.sin(angleRad);

            const rotationOriginX = this.rotation.x;
            const rotationOriginY = this.rotation.y;

            const translatedX = localX - (rotationOriginX - this.x);
            const translatedY = localY - (rotationOriginY - this.y);

            localX = translatedX * cos + translatedY * sin;
            localY = -translatedX * sin + translatedY * cos;

            localX += (rotationOriginX - this.x);
            localY += (rotationOriginY - this.y);
        }

        let u = (localX / this.uvTransform.scaleX + this.uvTransform.offsetX);
        let v = (localY / this.uvTransform.scaleY + this.uvTransform.offsetY);

        if (this.uvTransform.rotation !== 0) {
            const texAngleRad = this.uvTransform.rotation * Math.PI / 180;
            const texCos = Math.cos(texAngleRad);
            const texSin = Math.sin(texAngleRad);

            const texCenterX = 0.5;
            const texCenterY = 0.5;

            const texTranslatedU = u - texCenterX;
            const texTranslatedV = v - texCenterY;

            u = texTranslatedU * texCos - texTranslatedV * texSin + texCenterX;
            v = texTranslatedU * texSin + texTranslatedV * texCos + texCenterY;
        }

        const texColor = this.texture.sample(u, v);

        return {
            r: Math.round((this.color.r * texColor.r) / 255),
            g: Math.round((this.color.g * texColor.g) / 255),
            b: Math.round((this.color.b * texColor.b) / 255),
            a: this.color.a * texColor.a,
        };
    }


    setParent(parent: Shape) {
        this.parent = parent;
    }

    protected getTransformedPosition(x: number, y: number): { x: number, y: number } {
        let currentX = x;
        let currentY = y;

        const scaleOriginX = this.scale.originX;
        const scaleOriginY = this.scale.originY;

        currentX = (currentX - scaleOriginX) * this.scale.x + scaleOriginX;
        currentY = (currentY - scaleOriginY) * this.scale.y + scaleOriginY;

        const angleRad = this.rotation.angle * Math.PI / 180;
        const cos = Math.cos(angleRad);
        const sin = Math.sin(angleRad);

        const rotationOriginX = this.rotation.x;
        const rotationOriginY = this.rotation.y;

        const translatedX = currentX - rotationOriginX;
        const translatedY = currentY - rotationOriginY;

        currentX = translatedX * cos + translatedY * sin + rotationOriginX;
        currentY = -translatedX * sin + translatedY * cos + rotationOriginY;


        if (this.parent) {
            const parentTransformed = this.parent.getTransformedPosition(currentX, currentY);
            currentX = parentTransformed.x;
            currentY = parentTransformed.y;
        }

        return {
            x: Math.round(currentX),
            y: Math.round(currentY),
        }
    }

    protected bresenhamLine(x0: number, y0: number, x1: number, y1: number): Pixels {
        const dx = Math.abs(x1 - x0);
        const dy = Math.abs(y1 - y0);
        const sx = x0 < x1 ? 1 : -1;
        const sy = y0 < y1 ? 1 : -1;

        let points: Pixels = [];
        let x = x0;
        let y = y0;
        let err = dx - dy;

        points.push({ x, y, color: this.sampleTexture(x, y) });

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

            points.push({ x, y, color: this.sampleTexture(x, y) });
        }

        return points;
    }

    // Xiaolin Wu's line algorithm
    // https://en.wikipedia.org/wiki/Xiaolin_Wu%27s_line_algorithm
    protected wuLine(x0: number, y0: number, x1: number, y1: number): Pixels {
        console.log('Drawing Wu line from', x0, y0, 'to', x1, y1);
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

        const rfpart = (x: number) => 1 - (x - Math.floor(x));
        const fpart = (x: number) => x - Math.floor(x);

        xgap = rfpart(x0 + 0.5);
        let xpxl1 = xend;
        let ypxl1 = Math.floor(yend);

        if (steep) {
            this.addPixel(points, ypxl1, xpxl1, rfpart(yend) * xgap, true);
            this.addPixel(points, ypxl1 + 1, xpxl1, fpart(yend) * xgap, true);
        } else {
            this.addPixel(points, xpxl1, ypxl1, rfpart(yend) * xgap, true);
            this.addPixel(points, xpxl1, ypxl1 + 1, fpart(yend) * xgap, true);
        }

        let intery = yend + gradient;

        xend = Math.round(x1);
        yend = y1 + gradient * (xend - x1);
        xgap = fpart(x1 + 0.5);
        let xpxl2 = xend;
        let ypxl2 = Math.floor(yend);

        if (steep) {
            this.addPixel(points, ypxl2, xpxl2, rfpart(yend) * xgap, true);
            this.addPixel(points, ypxl2 + 1, xpxl2, fpart(yend) * xgap, true);
        } else {
            this.addPixel(points, xpxl2, ypxl2, rfpart(yend) * xgap, true);
            this.addPixel(points, xpxl2, ypxl2 + 1, fpart(yend) * xgap, true);
        }

        if (steep) {
            for (let x = xpxl1 + 1; x < xpxl2; x++) {
                this.addPixel(points, Math.floor(intery), x, rfpart(intery));
                this.addPixel(points, Math.floor(intery) + 1, x, fpart(intery));
                intery += gradient;
            }
        } else {
            for (let x = xpxl1 + 1; x < xpxl2; x++) {
                this.addPixel(points, x, Math.floor(intery), rfpart(intery));
                this.addPixel(points, x, Math.floor(intery) + 1, fpart(intery));
                intery += gradient;
            }
        }



        return points;
    }
    protected addPixel(points: Pixels, x: number, y: number, alpha: number, isEndpoint: boolean = false) {
        const clampedX = Math.max(0, Math.round(x));
        const clampedY = Math.max(0, Math.round(y));

        const finalAlpha = isEndpoint ? 1 : Math.max(0, Math.min(1, alpha));

        if (alpha > 0.01) {
            let color;

            if (!this.texture) {
                color = {
                    r: this.color.r,
                    g: this.color.g,
                    b: this.color.b,
                    a: Math.max(0, Math.min(1, finalAlpha * this.color.a)),
                };
            } else {
                const texColor = this.sampleTexture(clampedX, clampedY);
                color = {
                    r: texColor.r,
                    g: texColor.g,
                    b: texColor.b,
                    a: Math.max(0, Math.min(1, finalAlpha * texColor.a)),
                };
            }

            points.push({
                x: clampedX,
                y: clampedY,
                color
            });
        }
    }

    setScale(scaleX: number, scaleY: number, originX?: number, originY?: number) {
        this.scale.x = scaleX;
        this.scale.y = scaleY;
        if (originX !== undefined) this.scale.originX = originX;
        if (originY !== undefined) this.scale.originY = originY;
    }

    scaleX(scaleX: number, originX?: number) {
        this.scale.x = scaleX;
        if (originX !== undefined) this.scale.originX = originX;
    }

    scaleY(scaleY: number, originY?: number) {
        this.scale.y = scaleY;
        if (originY !== undefined) this.scale.originY = originY;
    }

    setScaleOrigin(x: number, y: number) {
        this.scale.originX = x;
        this.scale.originY = y;
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

    setPivot(x: number, y: number) {
        this.rotation.x = x;
        this.rotation.y = y;
    }

    draw(options: DrawOptions): Pixels {
        return options.antialias ? this.drawAntiAliased() : this.drawAliased();
    }

    abstract drawAntiAliased(): Pixels;
    abstract drawAliased(): Pixels;

    protected getInsidePoints(vertices: Array<{ x: number, y: number }>): Pixels {
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
                    points.push({ x, y, color: this.color });
                }
            }
        }

        return points;
    }
}
