import { CanvasDrawer } from '../Utils.js';
import { Renderer } from '../Renderer.js';
import { Collection } from '../shapes/Collection.js';
import { Rectangle } from '../shapes/Rectangle.js';
import { Circle } from '../shapes/Circle.js';

export function runCollisionExample() {
    const width = 64;
    const height = 64;
    const drawer = new CanvasDrawer('myCanvas', width, height, 1);
    drawer.clear('#ffffff');

    const renderer = new Renderer(width, height, { r: 255, g: 255, b: 255, a: 1 });

    const scene = new Collection({ x: 0, y: 0, color: { r: 0, g: 0, b: 0, a: 1 } });

    const ground = new Rectangle({
        x: 0, y: 56,
        color: { r: 100, g: 100, b: 100, a: 1 },
        width: 64, height: 8,
        fill: true
    });
    scene.addShape(ground);
    ground.addCollider();

    const fallingBox = new Rectangle({
        x: 28, y: 0,
        color: { r: 200, g: 0, b: 0, a: 1 },
        width: 8, height: 8,
        fill: true
    });
    scene.addShape(fallingBox);
    fallingBox.addCollider();

    const fallingSphere = new Circle({
        x: 25, y: 20,
        color: { r: 0, g: 0, b: 200, a: 1 },
        radius: 6,
        fill: true
    });
    scene.addShape(fallingSphere);
    fallingSphere.addCollider();

    let count = 0;
    let sum = 0;
    setInterval(() => {
        fallingBox.translate(0, 1);
        fallingSphere.translate(0, 1);
        if (fallingBox.intersects(ground) || fallingBox.intersects(fallingSphere)) {
            fallingBox.translate(0, -1); // Move back up
        }
        if (fallingSphere.intersects(ground)) {
            fallingSphere.translate(0, -1); // Move back up
        }
        const start = performance.now();
        const pixels = renderer.render([scene], { screen_height: height, screen_width: width, antialias: true });
        const end = performance.now();
        sum += end - start;
        count++;
        if (count % 60 == 0) {
            console.log(`Avg: ${(sum / count).toFixed(2)} ms`);
            count = 0;
            sum = 0;
        }

        drawer.clear('#ffffff');
        for (const pixel of pixels) {
            drawer.setPixel(pixel.x, pixel.y, pixel.color);
        }

    }, 1000 / 10);
}
