/*! *****************************************************************************
Copyright (c) Microsoft Corporation.

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.
***************************************************************************** */

var __assign = function() {
    __assign = Object.assign || function __assign(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};

var defaultSimpleOptions = {
    visible: 'visible',
    dirtyTest: false
};
var Simple = /** @class */ (function () {
    /**
     * Creates a simple cull
     * Note, options.dirtyTest defaults to false. Set to true for much better performance--this requires
     * additional work to ensure displayObject.dirty is set when objects change)
     *
     * @param {object} [options]
     * @param {boolean} [options.visible=visible] parameter of the object to set (usually visible or renderable)
     * @param {string} [options.dirtyTest=false] only update the AABB box for objects with object[options.dirtyTest]=true; this has a HUGE impact on performance
     */
    function Simple(options) {
        if (options === void 0) { options = {}; }
        options = __assign(__assign({}, defaultSimpleOptions), options);
        this.visible = options.visible;
        this.dirtyTest = typeof options.dirtyTest !== 'undefined' ? options.dirtyTest : true;
        this.lists = [[]];
    }
    /**
     * add an array of objects to be culled, eg: `simple.addList(container.children)`
     * @param {Array} array
     * @param {boolean} [staticObject] set to true if the object's position/size does not change
     * @return {Array} array
     */
    Simple.prototype.addList = function (array, staticObject) {
        this.lists.push(array);
        if (staticObject) {
            array.staticObject = true;
        }
        var length = array.length;
        for (var i = 0; i < length; i++) {
            this.updateObject(array[i]);
        }
        return array;
    };
    /**
     * remove an array added by addList()
     * @param {Array} array
     * @return {Array} array
     */
    Simple.prototype.removeList = function (array) {
        this.lists.splice(this.lists.indexOf(array), 1);
        return array;
    };
    /**
     * add an object to be culled
     * NOTE: for implementation, add and remove uses this.lists[0]
     *
     * @param {DisplayObjectWithCulling} object
     * @param {boolean} [staticObject] set to true if the object's position/size does not change
     * @return {DisplayObjectWithCulling} object
     */
    Simple.prototype.add = function (object, staticObject) {
        if (staticObject) {
            object.staticObject = true;
        }
        if (this.dirtyTest || staticObject) {
            this.updateObject(object);
        }
        this.lists[0].push(object);
        return object;
    };
    /**
     * remove an object added by add()
     * NOTE: for implementation, add and remove uses this.lists[0]
     *
     * @param {DisplayObjectWithCulling} object
     * @return {DisplayObjectWithCulling} object
     */
    Simple.prototype.remove = function (object) {
        this.lists[0].splice(this.lists[0].indexOf(object), 1);
        return object;
    };
    /**
     * cull the items in the list by changing the object.visible
     * @param {AABB} bounds
     * @param {boolean} [skipUpdate] skip updating the AABB bounding box of all objects
     */
    Simple.prototype.cull = function (bounds, skipUpdate) {
        if (!skipUpdate) {
            this.updateObjects();
        }
        var visible = this.visible;
        for (var _i = 0, _a = this.lists; _i < _a.length; _i++) {
            var list = _a[_i];
            var length_1 = list.length;
            for (var i = 0; i < length_1; i++) {
                var object = list[i];
                var box = object.AABB;
                object[visible] =
                    box.x + box.width > bounds.x && box.x < bounds.x + bounds.width &&
                        box.y + box.height > bounds.y && box.y < bounds.y + bounds.height;
            }
        }
    };
    /**
     * update the AABB for all objects
     * automatically called from update() when calculatePIXI=true and skipUpdate=false
     */
    Simple.prototype.updateObjects = function () {
        if (this.dirtyTest) {
            for (var _i = 0, _a = this.lists; _i < _a.length; _i++) {
                var list = _a[_i];
                if (!list.staticObject) {
                    var length_2 = list.length;
                    for (var i = 0; i < length_2; i++) {
                        var object = list[i];
                        if (!object.staticObject && object.dirty) {
                            this.updateObject(object);
                            object.dirty = false;
                        }
                    }
                }
            }
        }
        else {
            for (var _b = 0, _c = this.lists; _b < _c.length; _b++) {
                var list = _c[_b];
                if (!list.staticObject) {
                    var length_3 = list.length;
                    for (var i = 0; i < length_3; i++) {
                        var object = list[i];
                        if (!object.staticObject) {
                            this.updateObject(object);
                        }
                    }
                }
            }
        }
    };
    /**
     * update the has of an object
     * automatically called from updateObjects()
     * @param {DisplayObjectWithCulling} object
     */
    Simple.prototype.updateObject = function (object) {
        var box = object.getLocalBounds();
        object.AABB = object.AABB || { x: 0, y: 0, width: 0, height: 0 };
        object.AABB.x = object.x + (box.x - object.pivot.x) * object.scale.x;
        object.AABB.y = object.y + (box.y - object.pivot.y) * object.scale.y;
        object.AABB.width = box.width * object.scale.x;
        object.AABB.height = box.height * object.scale.y;
    };
    /**
     * returns an array of objects contained within bounding box
     * @param {AABB} bounds bounding box to search
     * @return {DisplayObjectWithCulling[]} search results
     */
    Simple.prototype.query = function (bounds) {
        var results = [];
        for (var _i = 0, _a = this.lists; _i < _a.length; _i++) {
            var list = _a[_i];
            for (var _b = 0, list_1 = list; _b < list_1.length; _b++) {
                var object = list_1[_b];
                var box = object.AABB;
                if (box.x + box.width > bounds.x && box.x - box.width < bounds.x + bounds.width &&
                    box.y + box.height > bounds.y && box.y - box.height < bounds.y + bounds.height) {
                    results.push(object);
                }
            }
        }
        return results;
    };
    /**
     * iterates through objects contained within bounding box
     * stops iterating if the callback returns true
     * @param {AABB} bounds bounding box to search
     * @param {function} callback
     * @return {boolean} true if callback returned early
     */
    Simple.prototype.queryCallback = function (bounds, callback) {
        for (var _i = 0, _a = this.lists; _i < _a.length; _i++) {
            var list = _a[_i];
            for (var _b = 0, list_2 = list; _b < list_2.length; _b++) {
                var object = list_2[_b];
                var box = object.AABB;
                if (box.x + box.width > bounds.x && box.x - box.width < bounds.x + bounds.width &&
                    box.y + box.height > bounds.y && box.y - box.height < bounds.y + bounds.height) {
                    if (callback(object)) {
                        return true;
                    }
                }
            }
        }
        return false;
    };
    /**
     * get stats (only updated after update() is called)
     * @return {SimpleStats}
     */
    Simple.prototype.stats = function () {
        var visible = 0, count = 0;
        for (var _i = 0, _a = this.lists; _i < _a.length; _i++) {
            var list = _a[_i];
            list.forEach(function (object) {
                visible += object.visible ? 1 : 0;
                count++;
            });
        }
        return { total: count, visible: visible, culled: count - visible };
    };
    return Simple;
}());

var SpatialHashDefaultOptions = {
    xSize: 1000,
    ySize: 1000,
    simpleTest: true,
    dirtyTest: true
};
var SpatialHash = /** @class */ (function () {
    /**
     * creates a spatial-hash cull
     * Note, options.dirtyTest defaults to false. To greatly improve performance set to true and set
     * displayObject.dirty=true when the displayObject changes)
     *
     * @param {object} [options]
     * @param {number} [options.size=1000] cell size used to create hash (xSize = ySize)
     * @param {number} [options.xSize] horizontal cell size (leave undefined if size is set)
     * @param {number} [options.ySize] vertical cell size (leave undefined if size is set)
     * @param {boolean} [options.simpleTest=true] after finding visible buckets, iterates through items and tests individual bounds
     * @param {string} [options.dirtyTest=false] only update spatial hash for objects with object.dirty=true; this has a HUGE impact on performance
     */
    function SpatialHash(options) {
        options = __assign(__assign({}, SpatialHashDefaultOptions), options);
        if (options && typeof options.size !== 'undefined') {
            this.xSize = this.ySize = options.size;
        }
        else {
            this.xSize = options.xSize;
            this.ySize = options.ySize;
        }
        this.simpleTest = options.simpleTest;
        this.dirtyTest = options.dirtyTest;
        this.width = this.height = 0;
        this.hash = {};
        this.containers = [];
        this.elements = [];
    }
    /**
     * add an object to be culled
     * side effect: adds object.spatialHashes to track existing hashes
     * @param {DisplayObjectWithCulling} object
     * @param {boolean} [staticObject] set to true if the object's position/size does not change
     * @return {DisplayObjectWithCulling} object
     */
    SpatialHash.prototype.add = function (object, staticObject) {
        object.spatial = { hashes: [] };
        if (this.dirtyTest) {
            object.dirty = true;
        }
        if (staticObject) {
            object.staticObject = true;
        }
        this.updateObject(object);
        this.elements.push(object);
        return object;
    };
    /**
     * remove an object added by add()
     * @param {*} object
     * @return {*} object
     */
    SpatialHash.prototype.remove = function (object) {
        this.elements.splice(this.elements.indexOf(object), 1);
        this.removeFromHash(object);
        return object;
    };
    /**
     * add an array of objects to be culled
     * @param {PIXI.Container} container
     * @param {boolean} [staticObject] set to true if the objects in the container's position/size do not change
     * note: this only works with pixi v5.0.0rc2+ because it relies on the new container events childAdded and childRemoved
     */
    SpatialHash.prototype.addContainer = function (container, staticObject) {
        var _this = this;
        var added = function (object) {
            object.spatial = { hashes: [] };
            _this.updateObject(object);
        };
        var removed = function (object) {
            _this.removeFromHash(object);
        };
        var length = container.children.length;
        for (var i = 0; i < length; i++) {
            var object = container.children[i];
            object.spatial = { hashes: [] };
            this.updateObject(object);
        }
        container.cull = {};
        this.containers.push(container);
        container.on('childAdded', added);
        container.on('childRemoved', removed);
        container.cull.added = added;
        container.cull.removed = removed;
        if (staticObject) {
            container.cull.static = true;
        }
    };
    /**
     * remove an array added by addContainer()
     * @param {PIXI.Container} container
     * @return {PIXI.Container} container
     */
    SpatialHash.prototype.removeContainer = function (container) {
        var _this = this;
        this.containers.splice(this.containers.indexOf(container), 1);
        container.children.forEach(function (object) { return _this.removeFromHash(object); });
        container.off('childAdded', container.cull.added);
        container.off('removedFrom', container.cull.removed);
        delete container.cull;
        return container;
    };
    /**
     * update the hashes and cull the items in the list
     * @param {AABB} AABB
     * @param {boolean} [skipUpdate] skip updating the hashes of all objects
     * @param {Function} [callback] callback for each item that is not culled - note, this function is called before setting `object.visible=true`
     * @return {number} number of buckets in results
     */
    SpatialHash.prototype.cull = function (AABB, skipUpdate, callback) {
        if (!skipUpdate) {
            this.updateObjects();
        }
        this.invisible();
        var objects;
        if (callback) {
            objects = this.queryCallbackAll(AABB, this.simpleTest, callback);
        }
        else {
            objects = this.query(AABB, this.simpleTest);
        }
        objects.forEach(function (object) { return object.visible = true; });
        return this.lastBuckets;
    };
    /**
     * set all objects in hash to visible=false
     */
    SpatialHash.prototype.invisible = function () {
        var length = this.elements.length;
        for (var i = 0; i < length; i++) {
            this.elements[i].visible = false;
        }
        for (var _i = 0, _a = this.containers; _i < _a.length; _i++) {
            var container = _a[_i];
            var length_1 = container.children.length;
            for (var i = 0; i < length_1; i++) {
                container.children[i].visible = false;
            }
        }
    };
    /**
     * update the hashes for all objects
     * automatically called from update() when skipUpdate=false
     */
    SpatialHash.prototype.updateObjects = function () {
        if (this.dirtyTest) {
            var length_2 = this.elements.length;
            for (var i = 0; i < length_2; i++) {
                var object = this.elements[i];
                if (object.dirty) {
                    this.updateObject(object);
                    object.dirty = false;
                }
            }
            for (var _i = 0, _a = this.containers; _i < _a.length; _i++) {
                var container = _a[_i];
                if (!container.cull.static) {
                    var length_3 = container.children.length;
                    for (var i = 0; i < length_3; i++) {
                        var object = container.children[i];
                        if (object.dirty) {
                            this.updateObject(object);
                            object.dirty = false;
                        }
                    }
                }
            }
        }
        else {
            var length_4 = this.elements.length;
            for (var i = 0; i < length_4; i++) {
                var object = this.elements[i];
                if (!object.staticObject) {
                    this.updateObject(object);
                }
            }
            for (var _b = 0, _c = this.containers; _b < _c.length; _b++) {
                var container = _c[_b];
                if (!container.cull.static) {
                    var length_5 = container.children.length;
                    for (var i = 0; i < length_5; i++) {
                        this.updateObject(container.children[i]);
                    }
                }
            }
        }
    };
    /**
     * update the has of an object
     * automatically called from updateObjects()
     * @param {DisplayObjectWithCulling} object
     */
    SpatialHash.prototype.updateObject = function (object) {
        var AABB;
        var box = object.getLocalBounds();
        AABB = object.AABB = {
            x: object.x + (box.x - object.pivot.x) * object.scale.x,
            y: object.y + (box.y - object.pivot.y) * object.scale.y,
            width: box.width * object.scale.x,
            height: box.height * object.scale.y
        };
        var spatial = object.spatial;
        if (!spatial) {
            spatial = object.spatial = { hashes: [] };
        }
        var _a = this.getBounds(AABB), xStart = _a.xStart, yStart = _a.yStart, xEnd = _a.xEnd, yEnd = _a.yEnd;
        // only remove and insert if mapping has changed
        if (spatial.xStart !== xStart || spatial.yStart !== yStart || spatial.xEnd !== xEnd || spatial.yEnd !== yEnd) {
            if (spatial.hashes.length) {
                this.removeFromHash(object);
            }
            for (var y = yStart; y <= yEnd; y++) {
                for (var x = xStart; x <= xEnd; x++) {
                    var key = x + ',' + y;
                    this.insert(object, key);
                    spatial.hashes.push(key);
                }
            }
            spatial.xStart = xStart;
            spatial.yStart = yStart;
            spatial.xEnd = xEnd;
            spatial.yEnd = yEnd;
        }
    };
    /**
     * returns an array of buckets with >= minimum of objects in each bucket
     * @param {number} [minimum=1]
     * @return {array} array of buckets
     */
    SpatialHash.prototype.getBuckets = function (minimum) {
        if (minimum === void 0) { minimum = 1; }
        var hashes = [];
        for (var key in this.hash) {
            var hash = this.hash[key];
            if (hash.length >= minimum) {
                hashes.push(hash);
            }
        }
        return hashes;
    };
    /**
     * gets hash bounds
     * @param {AABB} AABB
     * @return {SpatialHashBounds}
     */
    SpatialHash.prototype.getBounds = function (AABB) {
        var xStart = Math.floor(AABB.x / this.xSize);
        var yStart = Math.floor(AABB.y / this.ySize);
        var xEnd = Math.floor((AABB.x + AABB.width) / this.xSize);
        var yEnd = Math.floor((AABB.y + AABB.height) / this.ySize);
        return { xStart: xStart, yStart: yStart, xEnd: xEnd, yEnd: yEnd };
    };
    /**
     * insert object into the spatial hash
     * automatically called from updateObject()
     * @param {DisplayObjectWithCulling} object
     * @param {string} key
     */
    SpatialHash.prototype.insert = function (object, key) {
        if (!this.hash[key]) {
            this.hash[key] = [object];
        }
        else {
            this.hash[key].push(object);
        }
    };
    /**
     * removes object from the hash table
     * should be called when removing an object
     * automatically called from updateObject()
     * @param {object} object
     */
    SpatialHash.prototype.removeFromHash = function (object) {
        var spatial = object.spatial;
        while (spatial.hashes.length) {
            var key = spatial.hashes.pop();
            var list = this.hash[key];
            list.splice(list.indexOf(object), 1);
        }
    };
    /**
     * get all neighbors that share the same hash as object
     * @param {*} object in the spatial hash
     * @return {Array} of objects that are in the same hash as object
     */
    SpatialHash.prototype.neighbors = function (object) {
        var _this = this;
        var results = [];
        object.spatial.hashes.forEach(function (key) { return results = results.concat(_this.hash[key]); });
        return results;
    };
    /**
     * returns an array of objects contained within bounding box
     * @param {AABB} AABB bounding box to search
     * @param {boolean} [simpleTest=true] perform a simple bounds check of all items in the buckets
     * @return {object[]} search results
     */
    SpatialHash.prototype.query = function (AABB, simpleTest) {
        if (simpleTest === void 0) { simpleTest = true; }
        var buckets = 0;
        var results = [];
        var _a = this.getBounds(AABB), xStart = _a.xStart, yStart = _a.yStart, xEnd = _a.xEnd, yEnd = _a.yEnd;
        for (var y = yStart; y <= yEnd; y++) {
            for (var x = xStart; x <= xEnd; x++) {
                var entry = this.hash[x + ',' + y];
                if (entry) {
                    if (simpleTest) {
                        var length_6 = entry.length;
                        for (var i = 0; i < length_6; i++) {
                            var object = entry[i];
                            var box = object.AABB;
                            if (box.x + box.width > AABB.x && box.x < AABB.x + AABB.width &&
                                box.y + box.height > AABB.y && box.y < AABB.y + AABB.height) {
                                results.push(object);
                            }
                        }
                    }
                    else {
                        results = results.concat(entry);
                    }
                    buckets++;
                }
            }
        }
        this.lastBuckets = buckets;
        return results;
    };
    /**
     * returns an array of objects contained within bounding box with a callback on each non-culled object
     * this function is different from queryCallback, which cancels the query when a callback returns true
     *
     * @param {AABB} AABB bounding box to search
     * @param {boolean} [simpleTest=true] perform a simple bounds check of all items in the buckets
     * @param {Function} callback - function to run for each non-culled object
     * @return {object[]} search results
     */
    SpatialHash.prototype.queryCallbackAll = function (AABB, simpleTest, callback) {
        if (simpleTest === void 0) { simpleTest = true; }
        var buckets = 0;
        var results = [];
        var _a = this.getBounds(AABB), xStart = _a.xStart, yStart = _a.yStart, xEnd = _a.xEnd, yEnd = _a.yEnd;
        for (var y = yStart; y <= yEnd; y++) {
            for (var x = xStart; x <= xEnd; x++) {
                var entry = this.hash[x + ',' + y];
                if (entry) {
                    if (simpleTest) {
                        var length_7 = entry.length;
                        for (var i = 0; i < length_7; i++) {
                            var object = entry[i];
                            var box = object.AABB;
                            if (box.x + box.width > AABB.x && box.x < AABB.x + AABB.width &&
                                box.y + box.height > AABB.y && box.y < AABB.y + AABB.height) {
                                results.push(object);
                                callback(object);
                            }
                        }
                    }
                    else {
                        results = results.concat(entry);
                        for (var _i = 0, entry_1 = entry; _i < entry_1.length; _i++) {
                            var object = entry_1[_i];
                            callback(object);
                        }
                    }
                    buckets++;
                }
            }
        }
        this.lastBuckets = buckets;
        return results;
    };
    /**
     * iterates through objects contained within bounding box
     * stops iterating if the callback returns true
     * @param {AABB} AABB bounding box to search
     * @param {function} callback
     * @param {boolean} [simpleTest=true] perform a simple bounds check of all items in the buckets
     * @return {boolean} true if callback returned early
     */
    SpatialHash.prototype.queryCallback = function (AABB, callback, simpleTest) {
        if (simpleTest === void 0) { simpleTest = true; }
        var _a = this.getBounds(AABB), xStart = _a.xStart, yStart = _a.yStart, xEnd = _a.xEnd, yEnd = _a.yEnd;
        for (var y = yStart; y <= yEnd; y++) {
            for (var x = xStart; x <= xEnd; x++) {
                var entry = this.hash[x + ',' + y];
                if (entry) {
                    for (var i = 0; i < entry.length; i++) {
                        var object = entry[i];
                        if (simpleTest) {
                            var AABB_1 = object.AABB;
                            if (AABB_1.x + AABB_1.width > AABB_1.x && AABB_1.x < AABB_1.x + AABB_1.width &&
                                AABB_1.y + AABB_1.height > AABB_1.y && AABB_1.y < AABB_1.y + AABB_1.height) {
                                if (callback(object)) {
                                    return true;
                                }
                            }
                        }
                        else {
                            if (callback(object)) {
                                return true;
                            }
                        }
                    }
                }
            }
        }
        return false;
    };
    /**
     * Get stats
     * @return {SpatialHashStats}
     */
    SpatialHash.prototype.stats = function () {
        var visible = 0, count = 0;
        var length = this.elements.length;
        for (var i = 0; i < length; i++) {
            var object = this.elements[i];
            visible += object.visible ? 1 : 0;
            count++;
        }
        for (var _i = 0, _a = this.containers; _i < _a.length; _i++) {
            var list = _a[_i];
            var length_8 = list.children.length;
            for (var i = 0; i < length_8; i++) {
                var object = list.children[i];
                visible += object.visible ? 1 : 0;
                count++;
            }
        }
        return {
            buckets: this.lastBuckets,
            total: count,
            visible: visible,
            culled: count - visible
        };
    };
    /**
     * helper function to evaluate hash table
     * @return {number} the number of buckets in the hash table
     * */
    SpatialHash.prototype.getNumberOfBuckets = function () {
        return Object.keys(this.hash).length;
    };
    /**
     * helper function to evaluate hash table
     * @return {number} the average number of entries in each bucket
     */
    SpatialHash.prototype.getAverageSize = function () {
        var total = 0;
        for (var key in this.hash) {
            total += this.hash[key].length;
        }
        return total / this.getBuckets().length;
    };
    /**
     * helper function to evaluate the hash table
     * @return {number} the largest sized bucket
     */
    SpatialHash.prototype.getLargest = function () {
        var largest = 0;
        for (var key in this.hash) {
            if (this.hash[key].length > largest) {
                largest = this.hash[key].length;
            }
        }
        return largest;
    };
    /**
     * gets quadrant bounds
     * @return {SpatialHashBounds}
     */
    SpatialHash.prototype.getWorldBounds = function () {
        var xStart = Infinity, yStart = Infinity, xEnd = 0, yEnd = 0;
        for (var key in this.hash) {
            var split = key.split(',');
            var x = parseInt(split[0]);
            var y = parseInt(split[1]);
            xStart = x < xStart ? x : xStart;
            yStart = y < yStart ? y : yStart;
            xEnd = x > xEnd ? x : xEnd;
            yEnd = y > yEnd ? y : yEnd;
        }
        return { xStart: xStart, yStart: yStart, xEnd: xEnd, yEnd: yEnd };
    };
    /**
     * helper function to evaluate the hash table
     * @param {AABB} [AABB] bounding box to search or entire world
     * @return {number} sparseness percentage (i.e., buckets with at least 1 element divided by total possible buckets)
     */
    SpatialHash.prototype.getSparseness = function (AABB) {
        var count = 0, total = 0;
        var _a = AABB ? this.getBounds(AABB) : this.getWorldBounds(), xStart = _a.xStart, yStart = _a.yStart, xEnd = _a.xEnd, yEnd = _a.yEnd;
        for (var y = yStart; y < yEnd; y++) {
            for (var x = xStart; x < xEnd; x++) {
                count += (this.hash[x + ',' + y] ? 1 : 0);
                total++;
            }
        }
        return count / total;
    };
    return SpatialHash;
}());

export { Simple, SpatialHash };
//# sourceMappingURL=pixi-cull.es.js.map
