import { drawPixel, screenPos, Clipping } from "./render.js";
import { intersectionOfLines, lineY, rotate } from "./math.js";


function drawVerticalLineSurface(canvas, x, topY, bottomY, player, sector, shade, texture, floor) {
    // used for drawing "surfaces" (the floor and ceiling)
    
    // TODO:
    // draw horizontal lines instead of vertical ones
    let surfaceHeight;
    if (floor) {surfaceHeight = sector.floorZ} else {surfaceHeight = sector.ceilingZ}
    let scale = sector.tileScale / 100;
    let height = (player.z + player.height - surfaceHeight) * scale;
    for (let y = topY; y <= bottomY; y++) {
        let floorX = canvas.width / (y - player.upDown - canvas.height / 2) * height;
        let floorY =  (x - canvas.width/2) / (y - player.upDown - canvas.width / 2) * height;
        
        let rotated = rotate(floorX, floorY, player.cosAngle, player.sinAngle)
        
        rotated.x += (player.x + sector.textureXoffset) * scale;
        rotated.y -= (player.y + sector.textureYoffset) * scale;
        
        rotated = rotate(rotated.x, rotated.y, sector.cosAngle, sector.sinAngle)
        

        let textureX = (rotated.x - Math.floor(rotated.x)) * texture.width;
        let textureY = (rotated.y - Math.floor(rotated.y)) * texture.height;
        let textureMp = Math.floor(Math.floor(textureY) * texture.width + textureX) * 4;
        let r = texture.pixels[textureMp] * shade
        let g = texture.pixels[textureMp + 1] * shade
        let b = texture.pixels[textureMp + 2] * shade

        drawPixel(canvas, x, y, r * shade, g * shade, b * shade);
    }
}

function drawVerticalLine(canvas, x, topY, bottomY, texture, textureX, textureY, textureYStep, shade) {
    for (let y = topY; y <= bottomY; y++) {
        let textureMp = Math.floor(Math.floor(textureY) * texture.width + textureX) * 4;
        let r = texture.pixels[textureMp];
        let g = texture.pixels[textureMp + 1];
        let b = texture.pixels[textureMp + 2];
        drawPixel(canvas, x, y, r * shade, g * shade, b * shade);
        textureY += textureYStep;
    }
}

function drawWall(wall, canvas, player, clippingWindows, textures) {
    let clipping = clippingWindows[0];

    // find the 4 points making up a wall
    let bottom = {l: screenPos(wall.x1, wall.y1, wall.z1, player, canvas), r: screenPos(wall.x2, wall.y2, wall.z1, player, canvas)};
    let top = {l: screenPos(wall.x1, wall.y1, wall.z2, player, canvas), r: screenPos(wall.x2, wall.y2, wall.z2, player, canvas)}

    if (bottom.l.depth < 0 && bottom.r.depth < 0) {return;} // the wall is fully behind the camera, so we can skip it
    
    // the original points are saved so the texture code can use them later
    let ogLeft = top.l;
    let ogRight = top.r;
    
    // if 1 point of the wall is behind the player, use the intersection between the camera plane and the wall instead
    let intersect;
    let leftPointBehind = false;
    if (bottom.l.depth < 0 || bottom.r.depth < 0) {
        intersect = intersectionOfLines(player.x, player.y, player.x + player.sinAngle, player.y + player.cosAngle, wall.x1, wall.y1, wall.x2, wall.y2);
        if (player.y === lineY(wall.slope, wall.x1, wall.y1, player.x)) {
            // if a player is ON the wall (intersects with the wall line), the intersection function can't find the right coordinates
            // it should intersect at the player's x and y, but those coordinates are extended a bit so that, if the wall has an
            // adjoin, its window will still be fully visible. otherwise, half the screen would be cut off
            // being exactly ON the wall is unlikely, since the movement code tries to stop this from happening, but it's possible (example: the player spawns on the wall)
            if (bottom.l.depth > 0) {intersect = {x: player.x + player.sinAngle * 5, y: player.y + player.cosAngle * 5};}
            else {intersect = {x: player.x - player.sinAngle, y: player.y - player.cosAngle};}
        }
        
        if (bottom.l.depth < 0) {
            leftPointBehind = true; // tracks which point is behind the player so that this doesn't need to be checked again later
            bottom.l = screenPos(intersect.x, intersect.y, wall.z1, player, canvas);
            top.l = screenPos(intersect.x, intersect.y, wall.z2, player, canvas);
            
        } else {
            bottom.r = screenPos(intersect.x, intersect.y, wall.z1, player, canvas);
            top.r = screenPos(intersect.x, intersect.y, wall.z2, player, canvas);
        }
    }

    let slopeBottom = (bottom.r.y - bottom.l.y) / (bottom.r.x - bottom.l.x);
    let slopeTop = (top.r.y - top.l.y) / (top.r.x - top.l.x);

    top.l.x = Math.floor(top.l.x);
    top.r.x = Math.floor(top.r.x);
    
    let startingX = top.l.x;
    let endingX = top.r.x;
    
    // clip the x of the wall
    let textureX;
    if ((startingX > clipping.x2) || (endingX < clipping.x1)) {return;} // wall is out of the clipping area/offscreen
    if (startingX < clipping.x1) {startingX = clipping.x1;}
    if (endingX > clipping.x2) {endingX = clipping.x2;}
    
    let sectionsToDraw = [[
        {slope: slopeTop, x: top.l.x, y: top.l.y},
        {slope: slopeBottom, x: bottom.r.x, y: bottom.r.y}
    ]]

    let adjoiningSectors = [];
    
    // goes through all of the wall's adjoins and determines where they need to be drawn
    if (wall.adjoins) {
        sectionsToDraw = [];
        for (let i = 0; i < wall.adjoins.length; i++) {
            let adjoin = wall.adjoins[i];

            // new X and Y variables are created to simplify the code for if a point is behind the player
            let adjoinX1 = wall.x1; let adjoinX2 = wall.x2; let adjoinY1 = wall.y1; let adjoinY2 = wall.y2;
    
            if (intersect) {
                // if 1 point of the wall is behind the player
                if (leftPointBehind) {
                    adjoinX1 = intersect.x;
                    adjoinY1 = intersect.y;
        
                } else {
                    adjoinX2 = intersect.x;
                    adjoinY2 = intersect.y;
                }
            }

            // find the screen location of the points
            let bottomAdj = {
                l: screenPos(adjoinX1, adjoinY1, adjoin.floorZ, player, canvas), 
                r: screenPos(adjoinX2, adjoinY2, adjoin.floorZ, player, canvas)
            };
            let topAdj = {
                l: screenPos(adjoinX1, adjoinY1, adjoin.ceilingZ, player, canvas), 
                r: screenPos(adjoinX2, adjoinY2, adjoin.ceilingZ, player, canvas)
            };
                        
            // makes sure the adjoin fits within this wall
            if (bottomAdj.l.y > bottom.l.y) {bottomAdj.l.y = bottom.l.y;}
            if (bottomAdj.r.y > bottom.r.y) {bottomAdj.r.y = bottom.r.y;}
            if (topAdj.l.y < top.l.y) {topAdj.l.y = top.l.y;}
            if (topAdj.r.y < top.r.y) {topAdj.r.y = top.r.y;}

            let slopeBottomAdj = (bottomAdj.r.y - bottomAdj.l.y) / (bottomAdj.r.x - bottomAdj.l.x);
            let slopeTopAdj = (topAdj.r.y - topAdj.l.y) / (topAdj.r.x - topAdj.l.x);         
    
            // prevents the clipping window coordinates from being larger than the screen
            // TODO: make this less repetative(?)
            
            // left
            if (topAdj.l.x < clipping.x1) {
                topAdj.l.y = lineY(slopeTopAdj, topAdj.l.x, topAdj.l.y, clipping.x1); 
                topAdj.l.x = clipping.x1; 
                bottomAdj.l.y = lineY(slopeBottomAdj, bottomAdj.l.x, bottomAdj.l.y, clipping.x1);
                bottomAdj.l.x = clipping.x1;
            }
            // right
            if (topAdj.r.x > clipping.x2) {
                topAdj.r.y = lineY(slopeTopAdj, topAdj.r.x, topAdj.r.y, clipping.x2); 
                topAdj.r.x = clipping.x2; 
                bottomAdj.r.y = lineY(slopeBottomAdj, bottomAdj.r.x, bottomAdj.r.y, clipping.x2);
                bottomAdj.r.x = clipping.x2;
            }
            
            // adds the connected sector and its clipping windows, so that it can be drawn after this sector
            adjoiningSectors.push([adjoin, [new Clipping(topAdj.l.x, topAdj.l.y, bottomAdj.l.y, topAdj.r.x, topAdj.r.y, bottomAdj.r.y), ...clippingWindows]]);
            
            // adds the "sections" that need to be drawn (the part of the wall that isn't an adjoin)
            if (i === 0) {
                sectionsToDraw.push([
                    {slope: slopeTop, x: top.l.x, y: top.l.y},
                    {slope: slopeTopAdj, x: topAdj.l.x, y: topAdj.l.y}
                ]);
            } else {
                sectionsToDraw[i][1] = {slope: slopeTopAdj, x: topAdj.l.x, y: topAdj.l.y}
            }
            
            sectionsToDraw.push([
                {slope: slopeBottomAdj, x: bottomAdj.l.x, y: bottomAdj.l.y},
                {slope: slopeBottom, x: bottom.l.x, y: bottom.l.y}
            ])  
        }
    }

    // draw the wall in vertical stripes
    for (let x = startingX; x < endingX; x++) {
        // y clipping
        let yClipTop = -Infinity;
        let yClipBottom = Infinity;
        
        for (let c of clippingWindows) {
            if (yClipTop < lineY(c.slopeTop, c.x1, c.y1top, x)) {
                yClipTop = lineY(c.slopeTop, c.x1, c.y1top, x);
            }
            if (yClipBottom >  lineY(c.slopeBottom, c.x1, c.y1bottom, x)) {
                yClipBottom = lineY(c.slopeBottom, c.x1, c.y1bottom, x) - 1;
            }
        }

        // draw every continuous "section" (sections of the wall, split up by the adjoins)
        for (let number = 0; number < sectionsToDraw.length; number++) {

            let section = sectionsToDraw[number];

            let texture;
            if (number < wall.texture.length) {texture = textures[wall.texture[number]];} 
            else {texture = textures[wall.texture[0]];} // some walls don't have different textures for all the sections

            let percentX = (x - ogLeft.x) / (ogRight.x - ogLeft.x);
            textureX = percentX * (texture.width / ogRight.depth) / ( (1-percentX) * (1/ogLeft.depth) + percentX * (1/ogRight.depth) )
            
            // calculating top and bottom
            let topY = Math.floor(lineY(section[0].slope, section[0].x, section[0].y, x));
            let bottomY = Math.floor(lineY(section[1].slope, section[1].x, section[1].y, x));
            
            let textureY = 0;
            let textureYStep = texture.height / (bottomY - topY);
            
            // the actual values are clipped now
            if (topY < yClipTop) {textureY = textureYStep * (yClipTop - topY); topY = yClipTop;}
            if (topY > yClipBottom) {topY = yClipBottom;}
            
            if (bottomY < yClipTop) {bottomY = yClipTop;}
            if (bottomY > yClipBottom) {bottomY = yClipBottom;}
            
            let floorTopY = bottomY;
            let ceilingBottomY = topY;
            if (wall.adjoins) {
                // a section that's part of a wall with an adjoin might not generate a ceiling or a floor (or both)
                // the numbers get set to infinities so that they will always fail the checks and the floor or ceiling won't be drawn
                if (number !== sectionsToDraw.length - 1) {floorTopY = Infinity}
                if (number !==  0) {ceilingBottomY = -Infinity}
            }

            let shade = wall.brightness;

            // drawing the floor
            if (floorTopY < yClipBottom) {drawVerticalLineSurface(canvas, x, floorTopY, yClipBottom, player, wall.sector, shade, textures[wall.sector.floorTexture], true);}
            // drawing the ceiling
            if (ceilingBottomY > yClipTop) {drawVerticalLineSurface(canvas, x, yClipTop, ceilingBottomY, player, wall.sector, shade, textures[wall.sector.ceilingTexture], false);}

            // drawing the actual wall
            drawVerticalLine(canvas, x, topY, bottomY, texture, textureX, textureY, textureYStep, shade);
        }
    }
    return adjoiningSectors;
}

export {drawWall, drawVerticalLine};