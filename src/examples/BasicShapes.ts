import { CanvasDrawer } from "../Utils.js";
import { Renderer } from "../Renderer.js";
import { Collection } from "../shapes/Collection.js";
import { Circle } from "../shapes/Circle.js";
import { Rectangle } from "../shapes/Rectangle.js"
import { Polygon } from "../shapes/Polygon.js";
import { RegularPolygon } from "../shapes/RegularPolygon.js";
import { LineSegment } from "../shapes/LineSegment.js";

export function runBasicShapesExample() {
    const width = 64;
    const height = 64;
    const drawer = new CanvasDrawer('myCanvas', width, height, 0);
    drawer.clear('#ffffff');

    const renderer = new Renderer(width, height, { r: 255, g: 255, b: 255, a: 1 });

    const scene = new Collection({ x: 0, y: 0, color: { r: 0, g: 0, b: 0, a: 1 } });

    // Add basic shapes
    const circle = new Circle({
        x: 16, y: 16,
        color: { r: 255, g: 0, b: 0, a: 1 },
        radius: 8,
        fill: true
    });
    scene.addShape(circle);

    const rectangle = new Rectangle({
        x: 40, y: 10,
        color: { r: 0, g: 255, b: 0, a: 1 },
        width: 12, height: 16,
        fill: true
    });
    scene.addShape(rectangle);

    const polygon = new Polygon({
        x: 20, y: 48,
        color: { r: 0, g: 0, b: 255, a: 1 },
        vertices: [
            { x: 0, y: -8, relative: true },
            { x: 8, y: 8, relative: true },
            { x: -8, y: 8, relative: true },
        ],
        fill: true
    });
    scene.addShape(polygon);

    const polygon2 = new Polygon({
        x: 35, y: 28,
        color: { r: 0, g: 255, b: 255, a: 1 },
        vertices: [
            { x: 0, y: -8, relative: true },
            { x: 8, y: 8, relative: true },
            { x: -8, y: 8, relative: true },
            { x: -16, y: 0, relative: true },
        ],
        fill: true
    });
    scene.addShape(polygon2);

    const regular_polygon = new RegularPolygon({
        x: 48,
        y: 48,
        sides: 6,
        sideLength: 8,
        fill: true,
        color: { r: 255, g: 165, b: 0, a: 1 }
    });
    scene.addShape(regular_polygon);

    const line = new LineSegment({
        x: 0, y: 20,
        x2: 33, y2: 43,
        color: { r: 125, g: 0, b: 120, a: 1 },
    });
    scene.addShape(line);
    const start = performance.now();
    const pixels = renderer.render([scene], {
        screen_width: width,
        screen_height: height,
        antialias: true
    });
    const end = performance.now();
    console.log(`Avg: ${(end - start).toFixed(2)} ms`);

    for (const px of pixels) {
        drawer.setPixel(px.x, px.y, px.color);
    }
}
