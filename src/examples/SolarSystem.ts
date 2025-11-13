import { CanvasDrawer } from "../Utils.js";
import { Renderer } from "../Renderer.js";
import { Collection } from "../shapes/Collection.js";
import { Circle } from "../shapes/Circle.js";

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
