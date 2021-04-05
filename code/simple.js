"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
exports.__esModule = true;
exports.Simple = void 0;
var defaultSimpleOptions = {
    visible: 'visible',
    calculatePixi: true,
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
     * @param {boolean} [options.calculatePIXI=true] calculate pixi.js bounding box automatically; if this is set to false then it uses object[options.AABB] for bounding box
     * @param {string} [options.dirtyTest=false] only update the AABB box for objects with object[options.dirtyTest]=true; this has a HUGE impact on performance
     */
    function Simple(options) {
        if (options === void 0) { options = {}; }
        options = __assign(__assign({}, defaultSimpleOptions), options);
        this.visible = options.visible;
        this.calculatePIXI = options.calculatePixi;
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
        if (this.calculatePIXI && this.dirtyTest) {
            var length_1 = array.length;
            for (var i = 0; i < length_1; i++) {
                this.updateObject(array[i]);
            }
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
        if (this.calculatePIXI && (this.dirtyTest || staticObject)) {
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
        if (this.calculatePIXI && !skipUpdate) {
            this.updateObjects();
        }
        var visible = this.visible;
        for (var _i = 0, _a = this.lists; _i < _a.length; _i++) {
            var list = _a[_i];
            var length_2 = list.length;
            for (var i = 0; i < length_2; i++) {
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
                    var length_3 = list.length;
                    for (var i = 0; i < length_3; i++) {
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
                    var length_4 = list.length;
                    for (var i = 0; i < length_4; i++) {
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
exports.Simple = Simple;
//# sourceMappingURL=simple.js.map