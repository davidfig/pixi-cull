# pixi-cull

A library to visibly cull objects designed to work with pixi.js (but not dependent on pixi.js).

Includes two types of culling algorithms: simple and spatial hash. The spatial hash may be also be used for collision detection, AI, etc.

Features include:

- automatic calculate bounding boxes for pixi.js objects
- also allow manual calculation for objects
- bounds calculated from any viewport including pixi-viewport (pixi-viewport.getVisibleBounds())

## Moving from v1 to v2

pixi-cull has been reworked and ported to typescript. The following functionality was removed:
- removed the options to change the object's parameter names for AABB, dirty, spatial, and visible (this greatly simplified) the code
- removed calculatePIXI as an option, since this library is now solely designed for pixi.js

## Rationale

Since I maintain pixi-viewport, I was asked a number of times for a culling library. Well here it is. Choose from two drop-in algorithms to cull your objects.

## Simple Example

```js
var PIXI = require("pixi.js");
var Viewport = require("pixi-viewport"); // you can use any viewport/camera as long as you can get the bounding box
var Cull = require("pixi-cull");

var app = new PIXI.Application();
document.body.appendChild(app.view);

// create viewport
var viewport = new Viewport({
  screenWidth: app.view.offsetWidth,
  screenHeight: app.view.offsetHeight,
  worldWidth: 10000,
  worldHeight: 10000,
});

app.stage.addChild(viewport);
viewport.drag().pinch().wheel().decelerate().moveCenter(5000, 5000);

// add red boxes
for (var i = 0; i < 500; i++) {
  var sprite = viewport.addChild(new PIXI.Sprite(PIXI.Texture.WHITE));
  sprite.tint = 0xff0000;
  sprite.width = sprite.height = 100;
  sprite.position.set(Math.random() * 10000, Math.random() * 10000);
}

var cull = new Cull.Simple();
cull.addList(viewport.children);
cull.cull(viewport.getVisibleBounds());

// cull whenever the viewport moves
PIXI.ticker.shared.add(() => {
  if (viewport.dirty) {
    cull.cull(viewport.getVisibleBounds());
    viewport.dirty = false;
  }
});
```

## Live Example

[https://davidfig.github.io/pixi-cull/](https://davidfig.github.io/pixi-cull/)

## API Documentation

[https://davidfig.github.io/pixi-cull/jsdoc/](https://davidfig.github.io/pixi-cull/jsdoc/)

## Installation

```
npm i pixi-cull
```

or [grab the latest release](https://github.com/davidfig/pixi-viewport/releases/) and use it:

```html
<script src="/directory-to-file/pixi.js"></script>
<script src="/directory-to-file/pixi-cull.min.js"></script>
<script>
  var SimpleCull = new PIXI.extras.Cull.Simple();
</script>
```

## license

MIT License
(c) 2018 [YOPEY YOPEY LLC](https://yopeyopey.com/) by [David Figatner](https://twitter.com/yopey_yopey/)
