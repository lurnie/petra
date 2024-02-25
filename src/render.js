import {rotate} from "./math.js";

class Clipping {
    constructor(x1, y1top, y1bottom, x2, y2top, y2bottom) {
        this.x1 = x1;
        this.x2 = x2;

        this.y1top = y1top;
        this.y1bottom = y1bottom;

        this.y2top = y2top;
        this.y2bottom = y2bottom;

        this.slopeTop = (this.y2top - this.y1top) / (this.x2 - this.x1);
        this.slopeBottom = (this.y2bottom - this.y1bottom) / (this.x2 - this.x1);
    }
}

function drawPixel(canvas, x, y, r, g, b, a=255) {
    x = Math.floor(x);
    y = Math.floor(y);

    let startingPosition = y * 4 * canvas.width + x * 4;
    canvas.pixels[startingPosition] = r;
    canvas.pixels[startingPosition + 1] = g;
    canvas.pixels[startingPosition + 2] = b;
    canvas.pixels[startingPosition + 3] = a;
}

function renderCanvas(canvas) {
    let renderImageData = new ImageData(canvas.pixels, canvas.width, canvas.height);
    canvas.ctx.putImageData(renderImageData, 0, 0);
}

function screenPos(x, y, z, player, canvas) {
    // convert a point on the map onto a pixel on the screen

    let relativeX = x - player.x; // since we assume the player is facing right, the x is the depth
    let relativeY = y - player.y;
    let relativeZ = z - player.z - player.height;

    // rotate the point
    let rotated = rotate(relativeX, -relativeY, player.cosAngle, player.sinAngle);

    // fix the numbers sometimes rounding weirdly and causing the depth to go very slightly under 0
    if (rotated.x < 0) {rotated.x = Math.ceil(rotated.x);}

    // we don't wanna divide by 0 or really small numbers which cause things to glitch out
    if (rotated.x < 1 && rotated.x >= 0) {rotated.x = 1;}

    // instead of just dividing by rotatedX (the depth), it multiplies by canvas width or height divided by rotatedX
    // so that the screen position scales correctly acrosss all resolutions


    let screenX =  rotated.y / rotated.x / player.fovTan * (canvas.width/2) + canvas.width/2
    let screenY = canvas.height/2 - (relativeZ / rotated.x / player.fovTan) * (canvas.height/2) + player.upDown

    return {x: screenX, y: screenY, depth: rotated.x}; // returns the depth (rotatedX) since walls and sprites use that a bit
}

export {drawPixel, renderCanvas, Clipping, screenPos};