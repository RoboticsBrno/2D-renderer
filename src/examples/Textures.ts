import { CanvasDrawer, loadTexture } from "../Utils.js";
import { Renderer } from "../Renderer.js";
import { Collection } from "../shapes/Collection.js";
import { Circle } from "../shapes/Circle.js";
import { Rectangle } from "../shapes/Rectangle.js"
import { Polygon } from "../shapes/Polygon.js";
import { RegularPolygon } from "../shapes/RegularPolygon.js";

export async function runTextureExample() {
    const width = 64;
    const height = 64;
    const drawer = new CanvasDrawer('myCanvas', width, height, 1);
    drawer.clear('#ffffff');

    const renderer = new Renderer(width, height, { r: 255, g: 255, b: 255, a: 1 });

    const texture = await loadTexture('/textures/brick.bmp');
    texture.setWrapMode('repeat');

    const scene = new Collection({ x: 0, y: 0, color: { r: 0, g: 0, b: 0, a: 1 } });

    const texturedRect = new Rectangle({
        x: 6, y: 6,
        color: { r: 255, g: 255, b: 255, a: 1 },
        width: 32, height: 32,
        fill: true,
    });
    texturedRect.setPivot(19, 19); // Rotate around center
    texturedRect.setTexture(texture);
    texturedRect.setTextureOffset(0, 1);
    texturedRect.setTextureScale(3, 3);
    texturedRect.setFixTexture(true);

    scene.addShape(texturedRect);

    const circle = new Circle({
        x: 48, y: 48,
        color: { r: 255, g: 255, b: 255, a: 1 },
        radius: 8,
        fill: true
    });
    circle.setTexture(texture);
    circle.setTextureScale(2, 1);
    scene.addShape(circle);

    const polygon = new Polygon({
        x: 48, y: 16,
        color: { r: 255, g: 255, b: 255, a: 1 },
        vertices: [
            { x: 0, y: -8, relative: true },
            { x: 7, y: 4, relative: true },
            { x: -7, y: 4, relative: true },
            { x: -5, y: -9, relative: true },
        ],
        fill: true
    });
    polygon.setTexture(texture);
    scene.addShape(polygon);

    const regular_polygon = new RegularPolygon({
        x: 10,
        y: 50,
        sides: 5,
        sideLength: 8,
        fill: true,
        color: { r: 255, g: 255, b: 255, a: 1 }
    });
    regular_polygon.setTexture(texture);
    scene.addShape(regular_polygon);

    let count = 0;
    let sum = 0;
    setInterval(() => {
        texturedRect.rotate(1); // Rotate 2 degrees per frame
        const start = performance.now();
        const pixels = renderer.render([scene], {
            screen_width: width,
            screen_height: height,
            antialias: true
        });
        const end = performance.now();
        sum += end - start;
        count++;
        if (count % 60 === 0) {
            console.log(`Avg: ${(sum / count).toFixed(2)} ms`);
            sum = 0;
            count = 0;
        }
        drawer.clear('#ffffff');
        for (const px of pixels) {
            drawer.setPixel(px.x, px.y, px.color);
        }
    }, 1000 / 60);
}
