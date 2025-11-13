import { runBasicShapesExample } from "./examples/BasicShapes.js";
import { runCollisionExample } from "./examples/Collision.js";
import { runSolarSystemExample } from "./examples/SolarSystem.js";
import { runTextureExample } from "./examples/Textures.js";

window.addEventListener('DOMContentLoaded', async () => {
    console.log("Running Solar System Example");
    runSolarSystemExample();
});
