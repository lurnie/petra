function getTextures(textures, canvas) {
    loadTexture('./img/cat.jpg', 'cat', textures, canvas);
    loadTexture('./img/cross.jpg', 'cross', textures, canvas);
    loadTexture('./img/gray.jpg', 'gray', textures, canvas);
    loadTexture('./img/bricks.png', 'def', textures, canvas);
    loadTexture('./img/grass.png', 'grass', textures, canvas);
    loadTexture('./img/wood.jpg', 'wood', textures, canvas);
    loadTexture('./img/mountains.jpg', 'mountains', textures, canvas);
}

function loadTexture(source, name, textures, canvas) {
    // set the texture as some temporary placeholder value
    textures[name] = {
        pixels: 0,
        width: 1,
        height: 1,
        averageTop: [0, 0, 0],
        averageBottom: [0, 0, 0]
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

        let width = textures[name].width;
        let pixels = textures[name].pixels;
        // finds the average rgb value for the top and bottom of the texture
        // this is used in skyboxes to fade the texture out
        let r = 0; let r2 = 0;
        let g = 0; let g2 = 0;
        let b = 0; let b2 = 0;
        for (let i = 0; i < width; i++) {
            r += pixels[i*4]/width;
            r2 += pixels[pixels.length - (i+1)*4]/width;
            g += pixels[i*4+1]/width;
            g2 += pixels[pixels.length-(i+1)*4+1]/width;
            b += pixels[i*4+2]/width;
            b2 += pixels[pixels.length-(i+1)*4+2]/width;
        }
        textures[name].averageTop = [r, g, b];
        textures[name].averageBottom = [r2, g2, b2];
        // resets the screen
        canvas.ctx.clearRect(0, 0, canvas.width, canvas.height);
        canvas.canvas.setAttribute('width', canvas.width);
        canvas.canvas.setAttribute('height', canvas.height);
    }
}

export {getTextures};