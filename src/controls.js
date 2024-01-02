import {intersectionOfLineSegments, lineY} from "./math.js";


function move(player, amount, angle) {
    let newX = player.x + Math.cos(-angle) * amount;
    let newY = player.y + Math.sin(-angle) * amount;

    player.sector.walls.forEach((wall) => {
        if (wall.adjoins) {for (let sector of wall.adjoins) {
            if (intersectionOfLineSegments(player.x, player.y, newX, newY, wall.x1, wall.y1, wall.x2, wall.y2) && player.z >= sector.floorZ && player.z <= sector.ceilingZ) {
                if (newY === lineY(wall.slope, wall.x1, wall.y1, newX)) {
                    // if the player ends up exactly ON an adjoin, they get a tiny boost so they end up properly in the other sector
                    newX += Math.cos(-angle) * 2; newY += Math.sin(-angle) * 2;
                }
                player.sector = sector;
            }
        }}
    })
    player.x = newX;
    player.y = newY;
}

function controls(player, pressedKeys, mouse, spf, canvas) {
    let fps = 1/spf;
    if (pressedKeys.includes('KeyF')) {console.log(fps);}

    if (pressedKeys.includes('KeyW')) { move(player, player.speed, player.angle) }
    if (pressedKeys.includes('KeyS')) { move(player, -player.speed, player.angle) }
    if (pressedKeys.includes('KeyA')) { move(player, player.speed, player.angle + (Math.PI / 2)) }
    if (pressedKeys.includes('KeyD')) { move(player, -player.speed, player.angle + (Math.PI / 2)) }

    if (pressedKeys.includes('Space')) {player.z += player.speed;}
    if (pressedKeys.includes('ShiftLeft')) {player.z -= player.speed;}

    const maxUpDown = canvas.height * 1.5;

    const angleSpeed = 0.006;
    player.angle -= mouse.x * angleSpeed;
    const upDownSpeed = canvas.height / 128;
    player.upDown -= mouse.y * upDownSpeed;

    player.sinAngle = Math.sin(player.angle);
    player.cosAngle = Math.cos(player.angle);

    if (pressedKeys.includes('ArrowUp')) {player.upDown += canvas.height/30;}
    if (pressedKeys.includes('ArrowDown')) {player.upDown -= canvas.height/30;}
    if (player.upDown > maxUpDown) {player.upDown = maxUpDown;}
    if (player.upDown < -maxUpDown) {player.upDown = -maxUpDown;}

    if (pressedKeys.includes('ArrowLeft')) {player.angle += 0.03;}
    if (pressedKeys.includes('ArrowRight')) {player.angle -= 0.03;}

    while (player.angle > Math.PI * 2) {player.angle -= Math.PI * 2;}
    while (player.angle < 0) {player.angle += Math.PI * 2;}
}

export {controls};