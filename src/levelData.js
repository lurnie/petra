class Wall {
    constructor(x1, y1, x2, y2, texture='def', adjoins=false, z1, z2, scaleX=1, scaleY=1, tx=0, ty=0, stretchX=false, stretchY=false) {
        this.x1 = x1;
        this.y1 = y1;
        this.x2 = x2;
        this.y2 = y2;
        this.z1 = z1;
        this.z2 = z2;
        this.slope = (y2 - y1) / (x2 - x1);
        this.adjoins = adjoins;
        if (adjoins.length === 0) {this.adjoins = false;}
        this.texture = texture;
        if (texture.length === 0) {texture = 'def';}

        // all the tiling-related attributes
        this.scaleX = scaleX;
        this.scaleY = scaleY;
        this.tx = tx;
        this.ty = ty;
        this.stretchX = stretchX;
        this.stretchY = stretchY;

        if (!(texture instanceof Array)) {
            this.texture = [texture, ];
        }
        this.length = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
    }
}

class Sector {
    constructor(floorZ, ceilingZ, brightness, walls, floorTexture='def', ceilingTexture='def', tileScale=1, textureXoffset=0, textureYoffset=0, textureAngleOffset=0, sky=false, name) {
        this.floorZ = floorZ;
        this.ceilingZ = ceilingZ;
        this.brightness = brightness
        this.tileScale = tileScale;
        this.textureXoffset = textureXoffset;
        this.textureYoffset = textureYoffset
        this.textureAngleOffset = textureAngleOffset;
        this.sinAngle = Math.sin(textureAngleOffset);
        this.cosAngle = Math.cos(textureAngleOffset);
        this.floorTexture = floorTexture;
        this.ceilingTexture = ceilingTexture;
        this.sprites = [ ];
        this.sky = sky;
        this.name = name;

        // sky sectors go up infinitely high, so some equations (like how high to draw adjoins) use top instead of ceilingZ
        // you can't just set ceilingZ to infinity, since ceilingZ is also used to draw walls
        this.top = this.ceilingZ;
        if (this.sky) {this.top = Infinity;}

        this.walls = walls;
        this.walls.forEach((wall) => {wall.z1 = this.floorZ; wall.z2 = this.ceilingZ; wall.brightness = this.brightness; wall.sector = this;})
    }
    sortSprites(player) {
        this.sprites.sort((a, b) => {
            // not the real distance since it's not square-rooted, but it still tells us which is closer
            let aDist = Math.abs((player.x - a.x) + (player.y - a.y) + (player.z + player.height - a.z));
            let bDist = Math.abs((player.x - b.x) + (player.y - b.y) + (player.z + player.height - b.z));
            // returns -1 if aDist is smaller, and 1 if bDist is smaller, and 0 if they're equal
            return aDist < bDist ? -1 : aDist > bDist ? 1 : 0;
        })
    }
}

class Sprite {
    constructor(x, y, z, sector, texture, scale, shade=1, updateShade=true) {
        this.x = x;
        this.y = y;
        this.z = z;
        this.sectorOwn = sector;
        this.sectorOwn.sprites.push(this);
        this.updateShade = updateShade
        this.shade = shade;
        if (this.updateShade) {this.shade = sector.brightness;}

        this.texture = texture;
        this.scale = scale;
    }
    set sector(newSector) {
        let oldList = this.sectorOwn.sprites;
        oldList.splice(oldList.indexOf(this), 1);
        this.sectorOwn = newSector;
        this.sectorOwn.sprites.push(this);
        if (this.updateShade) {this.shade = this.sectorOwn.brightness}
    }
}

export {Wall, Sector, Sprite};