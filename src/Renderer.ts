import { Color, Pixels, Pixel } from './Utils.js';
import { Collection } from './shapes/Collection.js';
import { DrawOptions } from './shapes/Shape.js';

export class Renderer {
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
                const threshold = 0.999;
                if (pixel.color.a >= threshold) {
                    pixelMap.set(key, pixel);
                }
                else if (existingPixel.color.a < threshold) {
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

