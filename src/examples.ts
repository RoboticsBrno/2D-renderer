import { CanvasDrawer, loadTexture } from "./Utils.js";
import { Renderer } from "./Renderer.js";
import { Collection } from "./shapes/Collection.js";
import { Circle } from "./shapes/Circle.js";
import { Rectangle } from "./shapes/Rectangle.js"
import { Polygon } from "./shapes/Polygon.js";
import { RegularPolygon } from "./shapes/RegularPolygon.js";

export function runSolarSystemExample() {
    const width = 64;
    const height = 64;
    const drawer = new CanvasDrawer('myCanvas', width, height, 0);
    drawer.clear('#000'); // Black background for space

    const renderer = new Renderer(width, height, { r: 0, g: 0, b: 0, a: 1 });

    // Create the solar system collection at the center
    const solarSystem = new Collection({ x: 32, y: 32, color: { r: 0, g: 0, b: 0, a: 1 } });
    solarSystem.setPivot(32, 32); // Center of the canvas

    // SUN - The central star (doesn't rotate around anything)
    const sun = new Circle({ x: 32, y: 32, color: { r: 255, g: 204, b: 0, a: 1 }, radius: 8, fill: true });
    solarSystem.addShape(sun);

    // PLANET SYSTEM - This will rotate around the sun
    const planetSystem = new Collection({ x: 32, y: 32, color: { r: 0, g: 0, b: 0, a: 1 } });
    planetSystem.setPivot(32, 32); // Rotate around the sun (center)

    // PLANET - Positioned at a distance from the sun
    const planet = new Circle({ x: 32 + 20, y: 32, color: { r: 0, g: 100, b: 255, a: 1 }, radius: 4, fill: true });
    planetSystem.addShape(planet);

    const planter2 = new Circle({ x: 32 - 20, y: 32, color: { r: 100, g: 255, b: 100, a: 1 }, radius: 3, fill: true });
    planetSystem.addShape(planter2);

    // MOON SYSTEM - This will rotate around the planet
    const moonSystem = new Collection({ x: 32 + 20, y: 32, color: { r: 0, g: 0, b: 0, a: 1 } });
    moonSystem.setPivot(32 + 20, 32); // Rotate around the planet

    // MOON - Positioned at a distance from the planet
    const moon = new Circle({ x: 32 + 20 + 8, y: 32, color: { r: 200, g: 200, b: 200, a: 1 }, radius: 2, fill: true });
    moonSystem.addShape(moon);

    // Add moon system to planet system
    planetSystem.addShape(moonSystem);

    // Add planet system to solar system
    solarSystem.addShape(planetSystem);

    // Optional: Add orbital paths for visualization
    const sunOrbit = new Circle({ x: 32, y: 32, color: { r: 100, g: 100, b: 100, a: 0.3 }, radius: 20, fill: false });
    const planetOrbit = new Circle({ x: 32 + 20, y: 32, color: { r: 150, g: 150, b: 150, a: 0.3 }, radius: 8, fill: false });

    solarSystem.addShape(sunOrbit);
    planetSystem.addShape(planetOrbit);

    // Animation loop
    let sum = 0;
    let count = 0;
    setInterval(() => {
        // Rotate planet system around the sun (slower orbit)
        planetSystem.rotate(1.5);

        // Rotate moon system around the planet (faster orbit)
        moonSystem.rotate(3);

        const start = performance.now();
        const pixels = renderer.render([solarSystem], {
            screen_width: width,
            screen_height: height,
            antialias: true
        });
        const end = performance.now();
        sum += (end - start);
        count++;
        if (count % 60 === 0) {
            console.log(`Average render time: ${(sum / count).toFixed(2)} ms`);
            sum = 0;
            count = 0;
        }

        drawer.clear('#000'); // Clear with black for space
        for (const px of pixels) {
            drawer.setPixel(px.x, px.y, px.color);
        }
    }, 1000 / 60);
}

export function runFlagExample() {
    const width = 64;
    const height = 64;
    const drawer = new CanvasDrawer('myCanvas', width, height);
    drawer.clear('#87CEEB'); // Sky blue background

    const renderer = new Renderer(width, height, { r: 135, g: 206, b: 235, a: 1 });

    const scene = new Collection({ x: 0, y: 0, color: { r: 0, g: 0, b: 0, a: 1 } });

    // Create a flag
    const flagPole = new Rectangle({
        x: 10, y: 10,
        color: { r: 139, g: 69, b: 19, a: 1 }, // Brown
        width: 2, height: 40,
        fill: true
    });

    const flag = new Rectangle({
        x: 12, y: 10,
        color: { r: 255, g: 0, b: 0, a: 1 }, // Red flag
        width: 20, height: 12,
        fill: true
    });
    flag.setScaleOrigin(12, 10); // Scale from the flag pole


    scene.addShape(flagPole);
    scene.addShape(flag);
    // Animation loop for waving flag
    setInterval(() => {
        // Wave effect using sine waves on X scale
        const waveTime = Date.now() * 0.01;
        const waveEffect = 1 + Math.sin(waveTime) * 0.3; // Scale from 0.7 to 1.3

        flag.scaleX(waveEffect);

        // Optional: also scale Y slightly for more dynamic effect
        const verticalWave = 1 + Math.sin(waveTime * 1.5) * 0.1; // Scale from 0.9 to 1.1
        flag.scaleY(verticalWave);

        const pixels = renderer.render([scene], {
            screen_width: width,
            screen_height: height,
            antialias: true
        });

        drawer.clear('#87CEEB');
        for (const px of pixels) {
            drawer.setPixel(px.x, px.y, px.color);
        }
    }, 1000 / 30);
}

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


    setInterval(() => {
        texturedRect.rotate(1); // Rotate 2 degrees per frame
        const pixels = renderer.render([scene], {
            screen_width: width,
            screen_height: height,
            antialias: true
        });
        drawer.clear('#ffffff');
        for (const px of pixels) {
            drawer.setPixel(px.x, px.y, px.color);
        }
    }, 1000 / 60);
}


