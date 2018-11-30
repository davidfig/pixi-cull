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
```js
    // pixi-cull.Simple
    /**
     * creates a simple cull
     * this sets the visibility
     * @param {PIXI.DisplayObject[]} [list] of objects to cull
     * @param {object} [options]
     * @param {boolean} [options.visible=visible] parameter of the object to set (usually visible or renderable)
     */
    constructor(list, options)

        /**
         * list of
         * @type {Array}
        */
        this.list = list || []

    /**
     *
     * @param {(PIXI.DisplayObject|PIXI.DisplayObject[])} objects
     */
    add(objects)

    /**
     * object to remove
     * @param {PIXI.DisplayObject} object
     */
    remove(object)

    /**
     * cull the items in the list
     * @param {object} bounds
     * @param {number} bounds.x
     * @param {number} bounds.y
     * @param {number} bounds.width
     * @param {number} bounds.height
     */
    update(bounds)

    /**
     * get stats
     * @return {SimpleStats}
     */
    stats()

    // pixi-cull.SpatialHash

    /**
     * @param {PIXI.DisplayObject[]} [list] of objects to cull
     * @param {object} [options]
     * @param {number} [options.size=1000] cell size used to create hash (xSize = ySize)
     * @param {number} [options.xSize] horizontal cell size
     * @param {number} [options.ySize] vertical cell size
     * @param {boolean} [options.calculatePIXI=true] calculate bounding box automatically
     * @param {boolean} [options.visible=visible] parameter of the object to set (usually visible or renderable)
     * @param {boolean} [options.simpleTest=true] iterate through visible buckets to check for bounds
     * @param {string} [options.dirtyTest] only update spatial hash for objects with object[options.dirtyTest]=true
     * @param {string} [options.AABB=AABB] object property that holds bounding box so that object[type] = { x: number, y: number, width: number, height: number }
     * @param {string} [options.spatial=spatial] object property that holds object's hash list
     */
    constructor(list, options)

    /**
     * inserts an object into the hash tree (also removes any existing spatialHashes)
     * side effect: adds object.spatialHashes to track existing hashes
     * @param {object} object
     */
    insert(object)

    /**
     * update the hashes and cull the items in the list
     * @param {object} bounds
     * @param {number} bounds.x
     * @param {number} bounds.y
     * @param {number} bounds.width
     * @param {number} bounds.height
     * @return {Stats} bucket count (not sprites in buckets)
     */
    update(bounds)

    /**
     * removes existing object from the hash table
     * @param {object} object
     */
    remove(object)

    /**
     * returns an array of objects contained within bounding box
     * @param {object} AABB bounding box to search
     * @param {number} AABB.x
     * @param {number} AABB.y
     * @param {number} AABB.width
     * @param {number} AABB.height
     * @return {object[]} search results
     */
    query(AABB)

    /**
     * iterates through objects contained within bounding box
     * stops iterating if the callback returns true
     * @param {object} AABB bounding box to search
     * @param {number} AABB.x
     * @param {number} AABB.y
     * @param {number} AABB.width
     * @param {number} AABB.height
     * @param {function} callback
     * @return {boolean} true if callback returned early
     */
    queryCallback(AABB, callback)

    /**
     * get stats
     * @return {Stats}
     */
    stats()

    /**
     * helper function to evaluate hash table
     * @return {number} the number of buckets in the hash table
     * */
    getBuckets()

    /**
     * helper function to evaluate hash table
     * @return {number} the average number of entries in each bucket
     */
    getAverageSize()

    /**
     * helper function to evaluate the hash table
     * @return {number} the largest sized bucket
     */
    getLargest()

    /** helper function to evalute the hash table
     * @param {object} AABB bounding box to search
     * @param {number} AABB.x
     * @param {number} AABB.y
     * @param {number} AABB.width
     * @param {number} AABB.height
     * @return {number} sparseness percentage (i.e., buckets with at least 1 element divided by total possible buckets)
     */
    getSparseness(AABB)

```
## Installation

    npm i pixi-cull

```

## license  
MIT License  
(c) 2018 [YOPEY YOPEY LLC](https://yopeyopey.com/) by [David Figatner](https://twitter.com/yopey_yopey/)
