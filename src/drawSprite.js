import {drawPixel, screenPos} from "./render.js";
import {lineY} from "./math.js";


function drawSprite(sprite, canvas, player, clippingWindows, textures) {
    let texture = textures[sprite.texture];
    let startingPoint = screenPos(sprite.x, sprite.y, sprite.z, player, canvas);

    let depth = startingPoint.depth;

    const scaler = sprite.scale * player.zoom;
    let width = texture.width * canvas.width * scaler / depth;
    let height = texture.height * canvas.height * scaler / depth;

    let startX = startingPoint.x;
    let endX = startingPoint.x + width;

    if (depth < 0 ) {return;}

    // x clipping
    let textureX = 0;
    let textureXStep = texture.width / width;
    let textureYStep = texture.height / height;

    let clipping = clippingWindows[0];
    if (endX < clipping.x1 || startX > clipping.x2) {return;}
    if (startX < clipping.x1) {textureX = (clipping.x1 - startX) * textureXStep; startX = clipping.x1;}
    if (endX > clipping.x2) {endX = clipping.x2;
    }
    for (let x = startX; x < endX; x++) {
        let topY = startingPoint.y;
        let bottomY = startingPoint.y + height

        // y clipping
        let textureY = 0;
        for (let c of clippingWindows) {
            let yClipTop = lineY(c.slopeTop, c.x1, c.y1top, x);
            if (topY < yClipTop) {textureY = (yClipTop - startingPoint.y) * textureYStep; topY = yClipTop;}
            let yClipBottom = lineY(c.slopeBottom, c.x1, c.y1bottom, x);
            if (bottomY > yClipBottom) {bottomY = yClipBottom;}
        }

        for (let y = topY; y <= bottomY; y++) {
            let mp = Math.floor(Math.floor(textureY) * texture.width + textureX) * 4;
            let r = texture.pixels[mp] * sprite.shade;
            let g = texture.pixels[mp + 1] * sprite.shade;
            let b = texture.pixels[mp + 2] * sprite.shade;

            drawPixel(canvas, x, y, r, g, b);
            textureY += textureYStep;
        }
        textureX += textureXStep;
    }
}

export {drawSprite};