import { Texture } from "./Texture.js"

export class CanvasDrawer {
    private canvas: HTMLCanvasElement
    private ctx: CanvasRenderingContext2D
    private pixel_width: number
    private pixel_height: number
    private grid_width: number = 1

    constructor(canvasId: string, pixel_width: number = 64, pixel_height: number = 64, grid_width: number = 1) {
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
        this.grid_width = grid_width;
    }

    clear(color: string = '#ffffff') {
        this.ctx.fillStyle = color;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        const x_offset = this.canvas.width / this.pixel_width;
        this.ctx.fillStyle = '#000'
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

export type Color = { r: number, g: number, b: number, a: number };

export type Pixel = {
    x: number;
    y: number;
    color: Color;
}

export type Pixels = Array<Pixel>;

export async function loadTexture(url: string): Promise<Texture> {
    const response = await fetch(url);
    const buffer = await response.arrayBuffer();
    return Texture.fromBMP(buffer);
}

