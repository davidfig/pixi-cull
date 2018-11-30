# pixi-cull
A library to visibly cull objects designed to work with pixi.js.

Includes two types of culling algorithms: simple and spatial hash.

Features include:
* automatic or manually calculate bounding box for DisplayObject
* plug in to any viewport including pixi-viewport

## Rationale
Since I maintain pixi-viewport, I was asked a number of times for a culling library. Well here it is. Choose from two drop-in algorithms to cull your stages. 

## Simple Example
```js
var PIXI = require('pixi.js');
var Viewport = require('pixi-viewport'); // you can use any viewport/camera as long as you can get the bounding box
var Cull = require('pixi-cull');

var app = new PIXI.Application();
document.body.appendChild(app.view);

// create viewport
var viewport = new Viewport({
    screenWidth: window.innerWidth,
    screenHeight: window.innerHeight,
    worldWidth: 10000,
    worldHeight: 10000
});

app.stage.addChild(viewport);
viewport.drag().pinch().wheel().decelerate();

// add red boxes
for (var i = 0; i < 100; i++)
{    
    var sprite = viewport.addChild(new PIXI.Sprite(PIXI.Texture.WHITE));
    sprite.tint = 0xff0000;
    sprite.width = sprite.height = 100
    sprite.position.set(Math.random() * 10000, Math.random() * 10000);
}

const cull = new Cull.Simple(viewport.children)
cull.update()
```

## Live Example
[https://davidfig.github.io/pixi-cull/](https://davidfig.github.io/pixi-cull/)

## API Documentation
[https://davidfig.github.io/pixi-cull/jsdoc/](https://davidfig.github.io/pixi-cull/jsdoc/)

## Installation

    npm i pixi-cull

```

## license  
MIT License  
(c) 2018 [YOPEY YOPEY LLC](https://yopeyopey.com/) by [David Figatner](https://twitter.com/yopey_yopey/)
