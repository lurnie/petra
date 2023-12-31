function crossProduct(x1, y1, x2, y2) {
    return x1 * y2 - x2 * y1;
}

function intersectionOfLines(x1, y1, x2, y2, x3, y3, x4, y4) {
    // I looked at bisqwit's Doom-style engine video to figure out this one
    // https://youtu.be/HQYsFshbkYw?t=170

    let x = crossProduct(x1, y1, x2, y2);
    let y = crossProduct(x3, y3, x4, y4);
    let denominator = crossProduct(x1-x2, y1-y2, x3-x4, y3-y4);
    let newX = crossProduct(x, x1-x2, y, x3-x4) / denominator;
    let newY = crossProduct(x, y1-y2, y, y3-y4) / denominator;
    if (isNaN(newX) || isNaN(newY)) {return false;} // the lines are parallel
    return {x: newX, y: newY};
}

function intersectionOfLineSegments(x1, y1, x2, y2, x3, y3, x4, y4) {
    // just returns where the lines intersect, or false if they're out of range
    let coords = intersectionOfLines(x1, y1, x2, y2, x3, y3, x4, y4);
    // this code can probably be simplified...
    let leftX1 = x1;
    let rightX1 = x2;
    if (x2 < x1) {leftX1 = x2; rightX1 = x1;}
    let leftX2 = x3;
    let rightX2 = x4;
    if (x4 < x3) {leftX2 = x4; rightX2 = x3;}

    let topY1 = y1;
    let bottomY1 = y2;
    if (y2 < y1) {topY1 = y2; bottomY1 = y1;}
    let topY2 = y3;
    let bottomY2 = y4;
    if (y4 < y3) {topY2 = y4; bottomY2 = y3;}

    let leftX = leftX1;
    if (leftX2 > leftX1) {leftX = leftX2;}
    let rightX = rightX1;
    if (rightX2 < rightX1) {rightX = rightX2;}
    let topY = topY1;
    if (topY2 > topY1) {topY = topY2;}
    let bottomY = bottomY1;
    if (bottomY2 < bottomY1) {bottomY = bottomY2;}

    if (coords.x >= leftX && coords.x <= rightX && coords.y <= bottomY && coords.y >= topY) {return coords} else {return false}
}
function lineY(slope, x1, y1, x) {
    // finds the y position of an x coordinate on a line
    return (slope * (x - x1) + y1);
}
function rotate(x, y, cos, sin) {
    let rotatedX = x * cos + y * sin;
    let rotatedY = x * sin - y * cos;
    return {x: rotatedX, y: rotatedY};
}

export {intersectionOfLines, lineY, intersectionOfLineSegments, rotate};