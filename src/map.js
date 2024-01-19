import {Wall, Sector, Sprite} from "./levelData.js";
function num(input) {
    // converts input to a number, unless the input is false
    // if the numbers were always converted, then undefined values would turn into NaN, which we don't want
    return input ? Number(input) : input
}
// loads the map from a file
function createStructure(map) {
    // goes through the map file to find all the sectors, floors, their attributes, etc.
    let lines = map.split(/\r\n|\n/); // splits it into newlines
    let sectorsToCreate = {};
    let current; // current sector
    let adjoins = {};
    for (let line of lines) {
        if (line.slice(0, 2) === '//' || line === '') {continue;}
        let parts = line.split(', ');
        if (line[0] === '#') {
            // new sector
            for (let i = 0; i < parts.length; i++) {
                let part = parts[i];
                if (i === 0) {current = part; sectorsToCreate[current] = {}; continue;}
                let keyVal = part.split(' ');
                sectorsToCreate[current][keyVal[0]] = keyVal[1];
            }
        } else if (line.slice(0, 6) === 'SPRITE') {
            // adding sprites
            // TODO: add sprite IDs
            let sprites = [];
            let currentSprite = {};
            for (let i = 0; i < parts.length; i++) {
                let part = parts[i];
                let split = part.split(' ');
                if (!isNaN(split[0])) {
                    currentSprite.x = Number(split[0]);
                    currentSprite.y = Number(split[1]);
                    currentSprite.z = Number(split[2]);
                } else if (part !== 'SPRITE') {
                    currentSprite[split[0]] = split[1];
                }
                if (part === 'SPRITE' || i + 1 === parts.length) {
                    if (i > 0) {sprites.push(currentSprite)};
                    currentSprite = {};
                }
            }
            sectorsToCreate[current].sprites = sprites;
        } else {
            // walls
            let walls = [];
            for (let i = 0; i < parts.length; i++) {
                let part = parts[i];
                let split = part.split(' ');
                if (!isNaN(split[0])) { // current value is a vertex
                    if (walls.length > 0) {
                        // second vertex of old wall
                        walls[walls.length-1].x2 = Number(split[0]); walls[walls.length-1].y2 = Number(split[1])
                    }

                    walls.push({TEXTURES: []});

                    // first vertex of new wall
                    walls[walls.length - 1].x1 = Number(split[0]); walls[walls.length - 1].y1 = Number(split[1]);
                }

                // if this is the last vertex, it needs to be connected to the first one
                if (i + 1 === parts.length) {walls[walls.length-1].x2 = walls[0].x1; walls[walls.length-1].y2 = walls[0].y1;}
                if (!isNaN(split[0])) {continue;}
                if (split[0] === 'ADJ') {for (let j = 1; j < split.length; j++) {
                    // adding all the adjoins

                    if (!adjoins.hasOwnProperty(current)) {adjoins[current] = {};}
                    if (!adjoins[current].hasOwnProperty(walls.length-1)) {adjoins[current][walls.length-1] = [];}
                    adjoins[current][walls.length-1].push(split[j]);
                    continue;
                }} else {
                    // the current value is the texture
                    for (let texture of split) {walls[walls.length-1].TEXTURES.push(texture);}
                }
            }
            sectorsToCreate[current].walls = walls;
        }
    }
    return {sectors: sectorsToCreate, adjoins: adjoins};
}
function createSectors(map) {
    let structure = createStructure(map);
    let sectorsToCreate = structure.sectors;
    let adjoins = structure.adjoins;
    let sectors = {}
    for (let name in sectorsToCreate) {
        let sector = sectorsToCreate[name];
        let walls = [];
        for (let wall of sector.walls) {walls.push(new Wall(wall.x1, wall.y1, wall.x2, wall.y2, wall.TEXTURES));}
        sectors[name] = new Sector(num(sector.FLOORZ), num(sector.CEILINGZ), num(sector.SHADE), walls, sector.FLOORT, sector.CEILINGT, num(sector.TILESCALE), num(sector.XOFFSET), num(sector.YOFFSET), num(sector.ANGLEOFFSET), sector.SKY, name)
        if (sectorsToCreate[name].hasOwnProperty('sprites')) {
            sectorsToCreate[name].sprites.forEach(sprite => {new Sprite(sprite.x, sprite.y, sprite.z, sectors[name], sprite.TEXTURE, num(sprite.SCALE), num(sprite.SHADE), (sprite.UPDATESHADE === 'false') ? false : true)});
        }

    }
    for (let name in adjoins) {
        for (let wall in adjoins[name]) {
            let currentAdjoins = adjoins[name][wall];
            for (let i = 0; i < currentAdjoins.length; i++) {currentAdjoins[i] = sectors[currentAdjoins[i]];}

            // sorts the adjoins by height
            currentAdjoins.sort((a, b) => {return (a.ceilingZ < b.ceilingZ) ? 1 : a.ceilingZ === b.ceilingZ ? 0 : -1});

            sectors[name].walls[wall].adjoins = currentAdjoins;
        }
    }
    return sectors
}
function loadMap(source) {
    let map = new Promise(resolve => fetch(source).then(content => content.text().then(text => resolve(text))));
    return new Promise(resolve => map.then(string => resolve(createSectors(string))));
}
export {loadMap};