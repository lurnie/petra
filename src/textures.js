function getTextures(textures, canvas) {
    loadTexture('./img/cat.jpg', 'cat', textures, canvas);
    loadTexture('./img/cross.jpg', 'cross', textures, canvas);
    loadTexture('./img/gray.jpg', 'gray', textures, canvas);
    loadTexture('./img/bricks.png', 'def', textures, canvas);
    loadTexture('./img/grass.png', 'grass', textures, canvas);
    loadTexture('./img/wood.jpg', 'wood', textures, canvas);
}

function loadTexture(source, name, textures, canvas) {
    // set the texture as some temporary placeholder value
    textures[name] = {
        pixels: 0,
        width: 1,
        height: 1
    };

    let img = new Image();
    img.src = source;

    img.onload = () => {
        // draws the texture on the screen, then gets the rgba values for that texture
        canvas.canvas.setAttribute('width', img.width);
        canvas.canvas.setAttribute('height', img.height);
        canvas.ctx.drawImage(img, 0, 0);
        let imageData = canvas.ctx.getImageData(0, 0, img.width, img.height).data;
        textures[name].pixels = imageData;
        textures[name].width = img.width;
        textures[name].height = img.height;

        // resets the screen
        canvas.ctx.clearRect(0, 0, canvas.width, canvas.height);
        canvas.canvas.setAttribute('width', canvas.width);
        canvas.canvas.setAttribute('height', canvas.height);
    }
}

export {getTextures};