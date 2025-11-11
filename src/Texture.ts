import { Color } from './Utils.js';

export class Texture {
    private pixels: Color[][];
    public width: number;
    public height: number;
    public wrapMode: 'repeat' | 'clamp' = 'repeat';

    constructor(pixels: Color[][]) {
        this.pixels = pixels;
        this.height = pixels.length;
        this.width = pixels[0]?.length || 0;
    }

    static fromBMP(data: ArrayBuffer): Texture {
        const view = new DataView(data);

        if (view.getUint16(0) !== 0x424D) {
            throw new Error('Invalid BMP file');
        }

        const pixelDataOffset = view.getUint32(10, true);
        const width = view.getInt32(18, true);
        const height = view.getInt32(22, true);
        const bitsPerPixel = view.getUint16(28, true);

        const pixels: Color[][] = [];

        if (bitsPerPixel === 24) {
            const bytesPerRow = Math.ceil((width * 3) / 4) * 4;

            for (let y = 0; y < height; y++) {
                const row: Color[] = [];
                for (let x = 0; x < width; x++) {
                    const offset = pixelDataOffset + (height - 1 - y) * bytesPerRow + x * 3;
                    const b = view.getUint8(offset);
                    const g = view.getUint8(offset + 1);
                    const r = view.getUint8(offset + 2);
                    row.push({ r, g, b, a: 1 });
                }
                pixels.push(row);
            }
        } else if (bitsPerPixel === 32) {
            for (let y = 0; y < height; y++) {
                const row: Color[] = [];
                for (let x = 0; x < width; x++) {
                    const offset = pixelDataOffset + (height - 1 - y) * width * 4 + x * 4;
                    const b = view.getUint8(offset);
                    const g = view.getUint8(offset + 1);
                    const r = view.getUint8(offset + 2);
                    const a = view.getUint8(offset + 3) / 255;
                    row.push({ r, g, b, a });
                }
                pixels.push(row);
            }
        } else {
            throw new Error(`Unsupported BMP format: ${bitsPerPixel} bits per pixel`);
        }
        console.log(`Loaded BMP texture: ${width}x${height}, ${bitsPerPixel} bpp`);
        return new Texture(pixels);
    }

    sample(u: number, v: number): Color {
        let x = u;
        let y = v;
        if (this.wrapMode === 'repeat') {
            x = x % this.width;
            y = y % this.height;
            if (x < 0) x += this.width;
            if (y < 0) y += this.height;
        } else {
            x = Math.max(0, Math.min(this.width - 1, x));
            y = Math.max(0, Math.min(this.height - 1, y));
        }

        const xi = Math.floor(x);
        const yi = Math.floor(y);

        return this.pixels[yi]?.[xi] || { r: 0, g: 0, b: 0, a: 1 };
    }

    setWrapMode(mode: 'repeat' | 'clamp') {
        this.wrapMode = mode;
    }
}
