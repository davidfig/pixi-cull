var PIXI = require('pixi.js');
var Viewport = require('pixi-viewport'); // you can use any viewport/camera as long as you can get the bounding box
var Cull = require('../code/index');

window.onload = () =>
{
    var app = new PIXI.Application();
    document.body.appendChild(app.view);

    // create viewport
    var viewport = new Viewport({
        screenWidth: app.view.offsetWidth,
        screenHeight: app.view.offsetHeight,
        worldWidth: 10000,
        worldHeight: 10000
    });

    app.stage.addChild(viewport);
    viewport.drag().pinch().wheel().decelerate().moveCenter(5000, 5000);

    // add red boxes
    for (var i = 0; i < 500; i++)
    {
        var sprite = viewport.addChild(new PIXI.Sprite(PIXI.Texture.WHITE));
        sprite.tint = 0xff0000;
        sprite.width = sprite.height = 100
        sprite.position.set(Math.random() * 10000, Math.random() * 10000);
    }

    var cull = new Cull.Simple();
    cull.addList(viewport.children);
    cull.cull(viewport.getVisibleBounds());

    // cull whenever the viewport moves
    PIXI.ticker.shared.add(() =>
    {
        if (viewport.dirty)
        {
            cull.cull(viewport.getVisibleBounds());
            viewport.dirty = false;
        }
    });
}