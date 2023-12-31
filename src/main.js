'use strict';

import {renderCanvas, Clipping, drawPixel} from "./render.js";
import {controls} from "./controls.js";
import {loadTexture} from "./textures.js";
import {drawWall} from "./drawSector.js";
import {drawSprite} from "./drawSprite.js";
import {loadMap} from "./map.js";

window.addEventListener('load',
    function setupCanvas(event) {
        window.removeEventListener(event.type, setupCanvas, false);
        loadMap('./maps/level.txt').then(map => {init(map)});
    }
)
function init(loadedMap) {
    let sectors = loadedMap;
    let sectorsToDraw;

    let player = {
        x: -100,
        y: 150,
        z: 70,
        xVelocity: 0,
        yVelocity: 0,
        speed: 10,
        angle: 0,
        upDown: 0,
        height: 0, // how high the camera is compared to the player z
        zoom: 1, // NOTE: currently, changing the zoom messes up the floors
        sector: sectors['#start']
    };

    let spf = 0;
    let thisFrame;
    let lastFrame = 0;

    let canvas = {};
    canvas.canvas = document.querySelector('#render');
    canvas.ctx = canvas.canvas.getContext('2d');
    canvas.width = Number(canvas.canvas.getAttribute('width'));
    canvas.height = Number(canvas.canvas.getAttribute('height'));
    canvas.pixels = new Uint8ClampedArray(canvas.width * canvas.height * 4);

    let pressedKeys = [];
    let mouse = {x: 0, y: 0};
    // events that keep track of which keys are being pressed
    document.addEventListener('keydown', (event) => {
        if (!pressedKeys.includes(event.code)) { pressedKeys.push(event.code); }
        canvas.canvas.requestPointerLock({unadjustedMovement: true});
    });
    document.addEventListener('keyup', (event) => {
        if (pressedKeys.includes(event.code)) { pressedKeys.splice(pressedKeys.indexOf(event.code), 1); }
    });
    document.addEventListener('mousemove', (event) => {
        mouse.x = event.movementX; mouse.y = event.movementY;
    });
    document.addEventListener('click', () => {
        canvas.canvas.requestPointerLock({unadjustedMovement: true});
    });

    let textures = {};
    loadTexture('./img/cat.jpg', 'cat', textures, canvas);
    loadTexture('./img/cross.jpg', 'cross', textures, canvas);
    loadTexture('./img/gray.jpg', 'gray', textures, canvas);
    loadTexture('./img/bricks.png', 'def', textures, canvas);

    const crossHeight = canvas.height / 62;
    const crossThick = canvas.height / 500;

    function drawSector(sector, canvas, player, clipping, textures) {
        for (let i = 0; i < sector.walls.length; i++) {
            let wall = sector.walls[i];
            let addedSector = drawWall(wall, canvas, player, clipping, textures);

            // if this was an adjoin, then push the new sector to be drawn
            if (addedSector) {for (let sector of addedSector) {if (!sectorsToDraw.includes(sector)) {sectorsToDraw.push(sector)}} }
        }
    }

    const fullscreenClipping = new Clipping(0, 0, canvas.height, canvas.width, 0, canvas.height);

    player.sinAngle = Math.sin(player.angle);
    player.cosAngle = Math.cos(player.angle);

    requestAnimationFrame(tick);

    function tick() {
        if (spf < 0) {spf = 0;}
        thisFrame = Date.now()/1000;
        spf = thisFrame - lastFrame;
        for (let i = 0; i < canvas.pixels.length; i++) {canvas.pixels[i] = 0;}

        sectorsToDraw = [[player.sector, [fullscreenClipping]]];
        let spritesToDraw = [];

        while (sectorsToDraw.length > 0) {
            drawSector(sectorsToDraw[0][0], canvas, player, sectorsToDraw[0][1], textures);
            sectorsToDraw[0][0].sortSprites(player); // sort the sprites by distance to the player
            sectorsToDraw[0][0].sprites.forEach((sprite) => {spritesToDraw.push([sprite, sectorsToDraw[0][1]])});
            sectorsToDraw.splice(0, 1);
        }

        for (let i = spritesToDraw.length - 1; i >= 0; i--) {
            drawSprite(spritesToDraw[i][0], canvas, player, spritesToDraw[i][1], textures);
        }

        // draw crosshair
        for (let y = - Math.floor(crossHeight); y < Math.floor(crossHeight); y++) {
            for (let x = -Math.floor(crossThick); x < Math.floor(crossThick); x++) {
                let c = 150;
                drawPixel(canvas, canvas.width/2 + x, canvas.height/2 + y, c, c, c);
                drawPixel(canvas, canvas.width/2 + y, canvas.height/2 + x, c, c, c);
            }
        }

        controls(player, pressedKeys, mouse, spf, canvas);
        renderCanvas(canvas);

        lastFrame = thisFrame;
        mouse.x = 0; mouse.y = 0;

        requestAnimationFrame(tick);
    }
}