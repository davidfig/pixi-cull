'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

// Copyright 2018 YOPEY YOPEY LLC
// David Figatner
// MIT License

var SpatialHash = function () {
    /**
     * creates a spatial-hash cull
     * @param {object} [options]
     * @param {number} [options.size=1000] cell size used to create hash (xSize = ySize)
     * @param {number} [options.xSize] horizontal cell size
     * @param {number} [options.ySize] vertical cell size
     * @param {boolean} [options.calculatePIXI=true] calculate bounding box automatically; if this is set to false then it uses object[options.AABB] for bounding box
     * @param {boolean} [options.visible=visible] parameter of the object to set (usually visible or renderable)
     * @param {boolean} [options.simpleTest=true] iterate through visible buckets to check for bounds
     * @param {string} [options.dirtyTest=true] only update spatial hash for objects with object[options.dirtyTest]=true; this has a HUGE impact on performance
     * @param {string} [options.AABB=AABB] object property that holds bounding box so that object[type] = { x: number, y: number, width: number, height: number }
     * @param {string} [options.spatial=spatial] object property that holds object's hash list
     * @param {string} [options.dirty=dirty] object property for dirtyTest
     */
    function SpatialHash(options) {
        _classCallCheck(this, SpatialHash);

        options = options || {};
        this.xSize = options.xSize || options.size || 1000;
        this.ySize = options.ySize || options.size || 1000;
        this.AABB = options.type || 'AABB';
        this.spatial = options.spatial || 'spatial';
        this.calculatePIXI = typeof options.calculatePIXI !== 'undefined' ? options.calculatePIXI : true;
        this.visibleText = typeof options.visibleTest !== 'undefined' ? options.visibleTest : true;
        this.simpleTest = typeof options.simpleTest !== 'undefined' ? options.simpleTest : true;
        this.dirtyTest = typeof options.dirtyTest !== 'undefined' ? options.dirtyTest : true;
        this.visible = options.visible || 'visible';
        this.dirty = options.dirty || 'dirty';
        this.width = this.height = 0;
        this.hash = {};
        this.objects = [];
        this.containers = [];
    }

    /**
     * add an object to be culled
     * side effect: adds object.spatialHashes to track existing hashes
     * @param {*} object
     * @param {boolean} [staticObject] set to true if the object's position/size does not change
     * @return {*} object
     */


    _createClass(SpatialHash, [{
        key: 'add',
        value: function add(object, staticObject) {
            object[this.spatial] = { hashes: [] };
            if (this.calculatePIXI && this.dirtyTest) {
                object[this.dirty] = true;
            }
            if (staticObject) {
                object.staticObject = true;
            }
            this.updateObject(object);
            this.containers[0].push(object);
        }

        /**
         * remove an object added by add()
         * @param {*} object
         * @return {*} object
         */

    }, {
        key: 'remove',
        value: function remove(object) {
            this.containers[0].splice(this.list[0].indexOf(object), 1);
            this.removeFromHash(object);
            return object;
        }

        /**
         * add an array of objects to be culled
         * @param {PIXI.Container} container
         * @param {boolean} [staticObject] set to true if the objects in the container's position/size do not change
         * note: this only works with pixi v5.0.0rc2+ because it relies on the new container events childAdded and childRemoved
         */

    }, {
        key: 'addContainer',
        value: function addContainer(container, staticObject) {
            var added = function (object) {
                object[this.spatial] = { hashes: [] };
                this.updateObject(object);
            }.bind(this);

            var removed = function (object) {
                this.removeFromHash(object);
            }.bind(this);

            var _iteratorNormalCompletion = true;
            var _didIteratorError = false;
            var _iteratorError = undefined;

            try {
                for (var _iterator = container.children[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                    var object = _step.value;

                    object[this.spatial] = { hashes: [] };
                    this.updateObject(object);
                }
            } catch (err) {
                _didIteratorError = true;
                _iteratorError = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion && _iterator.return) {
                        _iterator.return();
                    }
                } finally {
                    if (_didIteratorError) {
                        throw _iteratorError;
                    }
                }
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
        }

        /**
         * remove an array added by addContainer()
         * @param {PIXI.Container} container
         * @return {PIXI.Container} container
         */

    }, {
        key: 'removeContainer',
        value: function removeContainer(container) {
            var _this = this;

            this.containers.splice(this.containers.indexOf(container), 1);
            container.children.forEach(function (object) {
                return _this.removeFromHash(object);
            });
            container.off('added', container.cull.added);
            container.off('removed', container.cull.removed);
            delete container.cull;
            return container;
        }

        /**
         * update the hashes and cull the items in the list
         * @param {AABB} AABB
         * @param {boolean} [skipUpdate] skip updating the hashes of all objects
         * @return {number} number of buckets in results
         */

    }, {
        key: 'cull',
        value: function cull(AABB, skipUpdate) {
            var _this2 = this;

            if (!skipUpdate) {
                this.updateObjects();
            }
            this.invisible();
            var objects = this.query(AABB, this.simpleTest);
            objects.forEach(function (object) {
                return object[_this2.visible] = true;
            });
            return this.lastBuckets;
        }

        /**
         * set all objects in hash to visible=false
         */

    }, {
        key: 'invisible',
        value: function invisible() {
            var _this3 = this;

            var _iteratorNormalCompletion2 = true;
            var _didIteratorError2 = false;
            var _iteratorError2 = undefined;

            try {
                for (var _iterator2 = this.containers[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
                    var container = _step2.value;

                    container.children.forEach(function (object) {
                        return object[_this3.visible] = false;
                    });
                }
            } catch (err) {
                _didIteratorError2 = true;
                _iteratorError2 = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion2 && _iterator2.return) {
                        _iterator2.return();
                    }
                } finally {
                    if (_didIteratorError2) {
                        throw _iteratorError2;
                    }
                }
            }
        }

        /**
         * update the hashes for all objects
         * automatically called from update() when skipUpdate=false
         */

    }, {
        key: 'updateObjects',
        value: function updateObjects() {
            var _this4 = this;

            if (this.dirtyTest) {
                var _iteratorNormalCompletion3 = true;
                var _didIteratorError3 = false;
                var _iteratorError3 = undefined;

                try {
                    for (var _iterator3 = this.objects[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
                        var object = _step3.value;

                        if (object[this.dirty]) {
                            this.updateObject(object);
                            object[this.dirty] = false;
                        }
                    }
                } catch (err) {
                    _didIteratorError3 = true;
                    _iteratorError3 = err;
                } finally {
                    try {
                        if (!_iteratorNormalCompletion3 && _iterator3.return) {
                            _iterator3.return();
                        }
                    } finally {
                        if (_didIteratorError3) {
                            throw _iteratorError3;
                        }
                    }
                }

                var _iteratorNormalCompletion4 = true;
                var _didIteratorError4 = false;
                var _iteratorError4 = undefined;

                try {
                    for (var _iterator4 = this.containers[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
                        var container = _step4.value;
                        var _iteratorNormalCompletion5 = true;
                        var _didIteratorError5 = false;
                        var _iteratorError5 = undefined;

                        try {
                            for (var _iterator5 = container.children[Symbol.iterator](), _step5; !(_iteratorNormalCompletion5 = (_step5 = _iterator5.next()).done); _iteratorNormalCompletion5 = true) {
                                var _object = _step5.value;

                                if (_object[this.dirty]) {
                                    this.updateObject(_object);
                                    _object[this.dirty] = false;
                                }
                            }
                        } catch (err) {
                            _didIteratorError5 = true;
                            _iteratorError5 = err;
                        } finally {
                            try {
                                if (!_iteratorNormalCompletion5 && _iterator5.return) {
                                    _iterator5.return();
                                }
                            } finally {
                                if (_didIteratorError5) {
                                    throw _iteratorError5;
                                }
                            }
                        }
                    }
                } catch (err) {
                    _didIteratorError4 = true;
                    _iteratorError4 = err;
                } finally {
                    try {
                        if (!_iteratorNormalCompletion4 && _iterator4.return) {
                            _iterator4.return();
                        }
                    } finally {
                        if (_didIteratorError4) {
                            throw _iteratorError4;
                        }
                    }
                }
            } else {
                var _iteratorNormalCompletion6 = true;
                var _didIteratorError6 = false;
                var _iteratorError6 = undefined;

                try {
                    for (var _iterator6 = this.containers[Symbol.iterator](), _step6; !(_iteratorNormalCompletion6 = (_step6 = _iterator6.next()).done); _iteratorNormalCompletion6 = true) {
                        var _container = _step6.value;

                        if (!_container.cull.static) {
                            _container.children.forEach(function (object) {
                                return _this4.updateObject(object);
                            });
                        }
                    }
                } catch (err) {
                    _didIteratorError6 = true;
                    _iteratorError6 = err;
                } finally {
                    try {
                        if (!_iteratorNormalCompletion6 && _iterator6.return) {
                            _iterator6.return();
                        }
                    } finally {
                        if (_didIteratorError6) {
                            throw _iteratorError6;
                        }
                    }
                }
            }
        }

        /**
         * update the has of an object
         * automatically called from updateObjects()
         * @param {*} object
         * @param {boolean} [force] force update for calculatePIXI
         */

    }, {
        key: 'updateObject',
        value: function updateObject(object) {
            var AABB = void 0;
            if (this.calculatePIXI) {
                var box = object.getLocalBounds();
                AABB = object[this.AABB] = {
                    x: object.x + box.x * object.scale.x,
                    y: object.y + box.y * object.scale.y,
                    width: box.width * object.scale.x,
                    height: box.height * object.scale.y
                };
            } else {
                AABB = object[this.AABB];
            }

            var spatial = object[this.spatial];
            if (!spatial) {
                spatial = object[this.spatial] = { hashes: [] };
            }

            var _getBounds = this.getBounds(AABB),
                xStart = _getBounds.xStart,
                yStart = _getBounds.yStart,
                xEnd = _getBounds.xEnd,
                yEnd = _getBounds.yEnd;

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
        }

        /**
         * returns an array of buckets with >= minimum of objects in each bucket
         * @param {number} [minimum=1]
         * @return {array} array of buckets
         */

    }, {
        key: 'getBuckets',
        value: function getBuckets() {
            var minimum = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 1;

            var hashes = [];
            for (var key in this.hash) {
                var hash = this.hash[key];
                if (hash.length >= minimum) {
                    hashes.push(hash);
                }
            }
            return hashes;
        }

        /**
         * gets hash bounds
         * @param {AABB} AABB
         * @return {Bounds}
         * @private
         */

    }, {
        key: 'getBounds',
        value: function getBounds(AABB) {
            var xStart = Math.floor(AABB.x / this.xSize);
            var yStart = Math.floor(AABB.y / this.ySize);
            var xEnd = Math.floor((AABB.x + AABB.width) / this.xSize);
            var yEnd = Math.floor((AABB.y + AABB.height) / this.ySize);
            return { xStart: xStart, yStart: yStart, xEnd: xEnd, yEnd: yEnd };
        }

        /**
         * insert object into the spatial hash
         * automatically called from updateObject()
         * @param {*} object
         * @param {string} key
         */

    }, {
        key: 'insert',
        value: function insert(object, key) {
            if (!this.hash[key]) {
                this.hash[key] = [object];
            } else {
                this.hash[key].push(object);
            }
        }

        /**
         * removes object from the hash table
         * should be called when removing an object
         * automatically called from updateObject()
         * @param {object} object
         */

    }, {
        key: 'removeFromHash',
        value: function removeFromHash(object) {
            var spatial = object[this.spatial];
            while (spatial.hashes.length) {
                var key = spatial.hashes.pop();
                var list = this.hash[key];
                list.splice(list.indexOf(object), 1);
            }
        }

        /**
         * get all neighbors that share the same hash as object
         * @param {*} object in the spatial hash
         * @return {Array} of objects that are in the same hash as object
         */

    }, {
        key: 'neighbors',
        value: function neighbors(object) {
            var _this5 = this;

            var results = [];
            object[this.spatial].hashes.forEach(function (key) {
                return results = results.concat(_this5.hash[key]);
            });
            return results;
        }

        /**
         * returns an array of objects contained within bounding box
         * @param {AABB} AABB bounding box to search
         * @param {boolean} [simpleTest=true] perform a simple bounds check of all items in the buckets
         * @return {object[]} search results
         */

    }, {
        key: 'query',
        value: function query(AABB, simpleTest) {
            simpleTest = typeof simpleTest !== 'undefined' ? simpleTest : true;
            var buckets = 0;
            var results = [];

            var _getBounds2 = this.getBounds(AABB),
                xStart = _getBounds2.xStart,
                yStart = _getBounds2.yStart,
                xEnd = _getBounds2.xEnd,
                yEnd = _getBounds2.yEnd;

            for (var y = yStart; y <= yEnd; y++) {
                for (var x = xStart; x <= xEnd; x++) {
                    var entry = this.hash[x + ',' + y];
                    if (entry) {
                        if (simpleTest) {
                            var _iteratorNormalCompletion7 = true;
                            var _didIteratorError7 = false;
                            var _iteratorError7 = undefined;

                            try {
                                for (var _iterator7 = entry[Symbol.iterator](), _step7; !(_iteratorNormalCompletion7 = (_step7 = _iterator7.next()).done); _iteratorNormalCompletion7 = true) {
                                    var object = _step7.value;

                                    var box = object[this.AABB];
                                    if (box.x + box.width > AABB.x && box.x < AABB.x + AABB.width && box.y + box.height > AABB.y && box.y < AABB.y + AABB.height) {
                                        results.push(object);
                                    }
                                }
                            } catch (err) {
                                _didIteratorError7 = true;
                                _iteratorError7 = err;
                            } finally {
                                try {
                                    if (!_iteratorNormalCompletion7 && _iterator7.return) {
                                        _iterator7.return();
                                    }
                                } finally {
                                    if (_didIteratorError7) {
                                        throw _iteratorError7;
                                    }
                                }
                            }
                        } else {
                            results = results.concat(entry);
                        }
                        buckets++;
                    }
                }
            }
            this.lastBuckets = buckets;
            return results;
        }

        /**
         * iterates through objects contained within bounding box
         * stops iterating if the callback returns true
         * @param {AABB} AABB bounding box to search
         * @param {function} callback
         * @param {boolean} [simpleTest=true] perform a simple bounds check of all items in the buckets
         * @return {boolean} true if callback returned early
         */

    }, {
        key: 'queryCallback',
        value: function queryCallback(AABB, callback, simpleTest) {
            simpleTest = typeof simpleTest !== 'undefined' ? simpleTest : true;

            var _getBounds3 = this.getBounds(AABB),
                xStart = _getBounds3.xStart,
                yStart = _getBounds3.yStart,
                xEnd = _getBounds3.xEnd,
                yEnd = _getBounds3.yEnd;

            for (var y = yStart; y <= yEnd; y++) {
                for (var x = xStart; x <= xEnd; x++) {
                    var entry = this.hash[x + ',' + y];
                    if (entry) {
                        for (var i = 0; i < entry.length; i++) {
                            var object = entry[i];
                            if (simpleTest) {
                                var _AABB = object.AABB;
                                if (_AABB.x + _AABB.width > _AABB.x && _AABB.x < _AABB.x + _AABB.width && _AABB.y + _AABB.height > _AABB.y && _AABB.y < _AABB.y + _AABB.height) {
                                    if (callback(object)) {
                                        return true;
                                    }
                                }
                            } else {
                                if (callback(object)) {
                                    return true;
                                }
                            }
                        }
                    }
                }
            }
            return false;
        }

        /**
         * get stats
         * @return {Stats}
         */

    }, {
        key: 'stats',
        value: function stats() {
            var visible = 0,
                count = 0;
            var _iteratorNormalCompletion8 = true;
            var _didIteratorError8 = false;
            var _iteratorError8 = undefined;

            try {
                for (var _iterator8 = this.containers[Symbol.iterator](), _step8; !(_iteratorNormalCompletion8 = (_step8 = _iterator8.next()).done); _iteratorNormalCompletion8 = true) {
                    var list = _step8.value;

                    for (var i = 0; i < list.children.length; i++) {
                        var object = list.children[i];
                        visible += object.visible ? 1 : 0;
                        count++;
                    }
                }
            } catch (err) {
                _didIteratorError8 = true;
                _iteratorError8 = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion8 && _iterator8.return) {
                        _iterator8.return();
                    }
                } finally {
                    if (_didIteratorError8) {
                        throw _iteratorError8;
                    }
                }
            }

            return {
                total: count,
                visible: visible,
                culled: count - visible
            };
        }

        /**
         * helper function to evaluate hash table
         * @return {number} the number of buckets in the hash table
         * */

    }, {
        key: 'getNumberOfBuckets',
        value: function getNumberOfBuckets() {
            return Object.keys(this.hash).length;
        }

        /**
         * helper function to evaluate hash table
         * @return {number} the average number of entries in each bucket
         */

    }, {
        key: 'getAverageSize',
        value: function getAverageSize() {
            var total = 0;
            for (var key in this.hash) {
                total += this.hash[key].length;
            }
            return total / this.getBuckets().length;
        }

        /**
         * helper function to evaluate the hash table
         * @return {number} the largest sized bucket
         */

    }, {
        key: 'getLargest',
        value: function getLargest() {
            var largest = 0;
            for (var key in this.hash) {
                if (this.hash[key].length > largest) {
                    largest = this.hash[key].length;
                }
            }
            return largest;
        }

        /**
         * gets quadrant bounds
         * @return {Bounds}
         */

    }, {
        key: 'getWorldBounds',
        value: function getWorldBounds() {
            var xStart = Infinity,
                yStart = Infinity,
                xEnd = 0,
                yEnd = 0;
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
        }

        /**
         * helper function to evalute the hash table
         * @param {AABB} [AABB] bounding box to search or entire world
         * @return {number} sparseness percentage (i.e., buckets with at least 1 element divided by total possible buckets)
         */

    }, {
        key: 'getSparseness',
        value: function getSparseness(AABB) {
            var count = 0,
                total = 0;

            var _ref = AABB ? this.getBounds(AABB) : this.getWorldBounds(),
                xStart = _ref.xStart,
                yStart = _ref.yStart,
                xEnd = _ref.xEnd,
                yEnd = _ref.yEnd;

            for (var y = yStart; y < yEnd; y++) {
                for (var x = xStart; x < xEnd; x++) {
                    count += this.hash[x + ',' + y] ? 1 : 0;
                    total++;
                }
            }
            return count / total;
        }
    }]);

    return SpatialHash;
}();

/**
 * @typedef {object} Stats
 * @property {number} total
 * @property {number} visible
 * @property {number} culled
 */

/**
 * @typedef {object} Bounds
 * @property {number} xStart
 * @property {number} yStart
 * @property {number} xEnd
 * @property {number} xEnd
 */

/**
  * @typedef {object} AABB
  * @property {number} x
  * @property {number} y
  * @property {number} width
  * @property {number} height
  */

module.exports = SpatialHash;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL2NvZGUvc3BhdGlhbC1oYXNoLmpzIl0sIm5hbWVzIjpbIlNwYXRpYWxIYXNoIiwib3B0aW9ucyIsInhTaXplIiwic2l6ZSIsInlTaXplIiwiQUFCQiIsInR5cGUiLCJzcGF0aWFsIiwiY2FsY3VsYXRlUElYSSIsInZpc2libGVUZXh0IiwidmlzaWJsZVRlc3QiLCJzaW1wbGVUZXN0IiwiZGlydHlUZXN0IiwidmlzaWJsZSIsImRpcnR5Iiwid2lkdGgiLCJoZWlnaHQiLCJoYXNoIiwib2JqZWN0cyIsImNvbnRhaW5lcnMiLCJvYmplY3QiLCJzdGF0aWNPYmplY3QiLCJoYXNoZXMiLCJ1cGRhdGVPYmplY3QiLCJwdXNoIiwic3BsaWNlIiwibGlzdCIsImluZGV4T2YiLCJyZW1vdmVGcm9tSGFzaCIsImNvbnRhaW5lciIsImFkZGVkIiwiYmluZCIsInJlbW92ZWQiLCJjaGlsZHJlbiIsImN1bGwiLCJvbiIsInN0YXRpYyIsImZvckVhY2giLCJvZmYiLCJza2lwVXBkYXRlIiwidXBkYXRlT2JqZWN0cyIsImludmlzaWJsZSIsInF1ZXJ5IiwibGFzdEJ1Y2tldHMiLCJib3giLCJnZXRMb2NhbEJvdW5kcyIsIngiLCJzY2FsZSIsInkiLCJnZXRCb3VuZHMiLCJ4U3RhcnQiLCJ5U3RhcnQiLCJ4RW5kIiwieUVuZCIsImxlbmd0aCIsImtleSIsImluc2VydCIsIm1pbmltdW0iLCJNYXRoIiwiZmxvb3IiLCJwb3AiLCJyZXN1bHRzIiwiY29uY2F0IiwiYnVja2V0cyIsImVudHJ5IiwiY2FsbGJhY2siLCJpIiwiY291bnQiLCJ0b3RhbCIsImN1bGxlZCIsIk9iamVjdCIsImtleXMiLCJnZXRCdWNrZXRzIiwibGFyZ2VzdCIsIkluZmluaXR5Iiwic3BsaXQiLCJwYXJzZUludCIsImdldFdvcmxkQm91bmRzIiwibW9kdWxlIiwiZXhwb3J0cyJdLCJtYXBwaW5ncyI6Ijs7Ozs7O0FBQUE7QUFDQTtBQUNBOztJQUVNQSxXO0FBRUY7Ozs7Ozs7Ozs7Ozs7O0FBY0EseUJB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UCxHQUE4QixLQUFLd0UsY0FBTCxFQUZ6RTtBQUFBLGdCQUVZM0IsTUFGWixRQUVZQSxNQUZaO0FBQUEsZ0JBRW9CQyxNQUZwQixRQUVvQkEsTUFGcEI7QUFBQSxnQkFFNEJDLElBRjVCLFFBRTRCQSxJQUY1QjtBQUFBLGdCQUVrQ0MsSUFGbEMsUUFFa0NBLElBRmxDOztBQUdJLGlCQUFLLElBQUlMLElBQUlHLE1BQWIsRUFBcUJILElBQUlLLElBQXpCLEVBQStCTCxHQUEvQixFQUNBO0FBQ0kscUJBQUssSUFBSUYsSUFBSUksTUFBYixFQUFxQkosSUFBSU0sSUFBekIsRUFBK0JOLEdBQS9CLEVBQ0E7QUFDSXFCLDZCQUFVLEtBQUtsRCxJQUFMLENBQVU2QixJQUFJLEdBQUosR0FBVUUsQ0FBcEIsSUFBeUIsQ0FBekIsR0FBNkIsQ0FBdkM7QUFDQW9CO0FBQ0g7QUFDSjtBQUNELG1CQUFPRCxRQUFRQyxLQUFmO0FBQ0g7Ozs7OztBQUdMOzs7Ozs7O0FBT0E7Ozs7Ozs7O0FBUUE7Ozs7Ozs7O0FBUUFVLE9BQU9DLE9BQVAsR0FBaUIvRSxXQUFqQiIsImZpbGUiOiJzcGF0aWFsLWhhc2guanMiLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAxOCBZT1BFWSBZT1BFWSBMTENcbi8vIERhdmlkIEZpZ2F0bmVyXG4vLyBNSVQgTGljZW5zZVxuXG5jbGFzcyBTcGF0aWFsSGFzaFxue1xuICAgIC8qKlxuICAgICAqIGNyZWF0ZXMgYSBzcGF0aWFsLWhhc2ggY3VsbFxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSBbb3B0aW9uc11cbiAgICAgKiBAcGFyYW0ge251bWJlcn0gW29wdGlvbnMuc2l6ZT0xMDAwXSBjZWxsIHNpemUgdXNlZCB0byBjcmVhdGUgaGFzaCAoeFNpemUgPSB5U2l6ZSlcbiAgICAgKiBAcGFyYW0ge251bWJlcn0gW29wdGlvbnMueFNpemVdIGhvcml6b250YWwgY2VsbCBzaXplXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IFtvcHRpb25zLnlTaXplXSB2ZXJ0aWNhbCBjZWxsIHNpemVcbiAgICAgKiBAcGFyYW0ge2Jvb2xlYW59IFtvcHRpb25zLmNhbGN1bGF0ZVBJWEk9dHJ1ZV0gY2FsY3VsYXRlIGJvdW5kaW5nIGJveCBhdXRvbWF0aWNhbGx5OyBpZiB0aGlzIGlzIHNldCB0byBmYWxzZSB0aGVuIGl0IHVzZXMgb2JqZWN0W29wdGlvbnMuQUFCQl0gZm9yIGJvdW5kaW5nIGJveFxuICAgICAqIEBwYXJhbSB7Ym9vbGVhbn0gW29wdGlvbnMudmlzaWJsZT12aXNpYmxlXSBwYXJhbWV0ZXIgb2YgdGhlIG9iamVjdCB0byBzZXQgKHVzdWFsbHkgdmlzaWJsZSBvciByZW5kZXJhYmxlKVxuICAgICAqIEBwYXJhbSB7Ym9vbGVhbn0gW29wdGlvbnMuc2ltcGxlVGVzdD10cnVlXSBpdGVyYXRlIHRocm91Z2ggdmlzaWJsZSBidWNrZXRzIHRvIGNoZWNrIGZvciBib3VuZHNcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gW29wdGlvbnMuZGlydHlUZXN0PXRydWVdIG9ubHkgdXBkYXRlIHNwYXRpYWwgaGFzaCBmb3Igb2JqZWN0cyB3aXRoIG9iamVjdFtvcHRpb25zLmRpcnR5VGVzdF09dHJ1ZTsgdGhpcyBoYXMgYSBIVUdFIGltcGFjdCBvbiBwZXJmb3JtYW5jZVxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBbb3B0aW9ucy5BQUJCPUFBQkJdIG9iamVjdCBwcm9wZXJ0eSB0aGF0IGhvbGRzIGJvdW5kaW5nIGJveCBzbyB0aGF0IG9iamVjdFt0eXBlXSA9IHsgeDogbnVtYmVyLCB5OiBudW1iZXIsIHdpZHRoOiBudW1iZXIsIGhlaWdodDogbnVtYmVyIH1cbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gW29wdGlvbnMuc3BhdGlhbD1zcGF0aWFsXSBvYmplY3QgcHJvcGVydHkgdGhhdCBob2xkcyBvYmplY3QncyBoYXNoIGxpc3RcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gW29wdGlvbnMuZGlydHk9ZGlydHldIG9iamVjdCBwcm9wZXJ0eSBmb3IgZGlydHlUZXN0XG4gICAgICovXG4gICAgY29uc3RydWN0b3Iob3B0aW9ucylcbiAgICB7XG4gICAgICAgIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9XG4gICAgICAgIHRoaXMueFNpemUgPSBvcHRpb25zLnhTaXplIHx8IG9wdGlvbnMuc2l6ZSB8fCAxMDAwXG4gICAgICAgIHRoaXMueVNpemUgPSBvcHRpb25zLnlTaXplIHx8IG9wdGlvbnMuc2l6ZSB8fCAxMDAwXG4gICAgICAgIHRoaXMuQUFCQiA9IG9wdGlvbnMudHlwZSB8fCAnQUFCQidcbiAgICAgICAgdGhpcy5zcGF0aWFsID0gb3B0aW9ucy5zcGF0aWFsIHx8ICdzcGF0aWFsJ1xuICAgICAgICB0aGlzLmNhbGN1bGF0ZVBJWEkgPSB0eXBlb2Ygb3B0aW9ucy5jYWxjdWxhdGVQSVhJICE9PSAndW5kZWZpbmVkJyA/IG9wdGlvbnMuY2FsY3VsYXRlUElYSSA6IHRydWVcbiAgICAgICAgdGhpcy52aXNpYmxlVGV4dCA9IHR5cGVvZiBvcHRpb25zLnZpc2libGVUZXN0ICE9PSAndW5kZWZpbmVkJyA/IG9wdGlvbnMudmlzaWJsZVRlc3QgOiB0cnVlXG4gICAgICAgIHRoaXMuc2ltcGxlVGVzdCA9IHR5cGVvZiBvcHRpb25zLnNpbXBsZVRlc3QgIT09ICd1bmRlZmluZWQnID8gb3B0aW9ucy5zaW1wbGVUZXN0IDogdHJ1ZVxuICAgICAgICB0aGlzLmRpcnR5VGVzdCA9IHR5cGVvZiBvcHRpb25zLmRpcnR5VGVzdCAhPT0gJ3VuZGVmaW5lZCcgPyBvcHRpb25zLmRpcnR5VGVzdCA6IHRydWVcbiAgICAgICAgdGhpcy52aXNpYmxlID0gb3B0aW9ucy52aXNpYmxlIHx8ICd2aXNpYmxlJ1xuICAgICAgICB0aGlzLmRpcnR5ID0gb3B0aW9ucy5kaXJ0eSB8fCAnZGlydHknXG4gICAgICAgIHRoaXMud2lkdGggPSB0aGlzLmhlaWdodCA9IDBcbiAgICAgICAgdGhpcy5oYXNoID0ge31cbiAgICAgICAgdGhpcy5vYmplY3RzID0gW11cbiAgICAgICAgdGhpcy5jb250YWluZXJzID0gW11cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBhZGQgYW4gb2JqZWN0IHRvIGJlIGN1bGxlZFxuICAgICAqIHNpZGUgZWZmZWN0OiBhZGRzIG9iamVjdC5zcGF0aWFsSGFzaGVzIHRvIHRyYWNrIGV4aXN0aW5nIGhhc2hlc1xuICAgICAqIEBwYXJhbSB7Kn0gb2JqZWN0XG4gICAgICogQHBhcmFtIHtib29sZWFufSBbc3RhdGljT2JqZWN0XSBzZXQgdG8gdHJ1ZSBpZiB0aGUgb2JqZWN0J3MgcG9zaXRpb24vc2l6ZSBkb2VzIG5vdCBjaGFuZ2VcbiAgICAgKiBAcmV0dXJuIHsqfSBvYmplY3RcbiAgICAgKi9cbiAgICBhZGQob2JqZWN0LCBzdGF0aWNPYmplY3QpXG4gICAge1xuICAgICAgICBvYmplY3RbdGhpcy5zcGF0aWFsXSA9IHsgaGFzaGVzOiBbXSB9XG4gICAgICAgIGlmICh0aGlzLmNhbGN1bGF0ZVBJWEkgJiYgdGhpcy5kaXJ0eVRlc3QpXG4gICAgICAgIHtcbiAgICAgICAgICAgIG9iamVjdFt0aGlzLmRpcnR5XSA9IHRydWVcbiAgICAgICAgfVxuICAgICAgICBpZiAoc3RhdGljT2JqZWN0KVxuICAgICAgICB7XG4gICAgICAgICAgICBvYmplY3Quc3RhdGljT2JqZWN0ID0gdHJ1ZVxuICAgICAgICB9XG4gICAgICAgIHRoaXMudXBkYXRlT2JqZWN0KG9iamVjdClcbiAgICAgICAgdGhpcy5jb250YWluZXJzWzBdLnB1c2gob2JqZWN0KVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIHJlbW92ZSBhbiBvYmplY3QgYWRkZWQgYnkgYWRkKClcbiAgICAgKiBAcGFyYW0geyp9IG9iamVjdFxuICAgICAqIEByZXR1cm4geyp9IG9iamVjdFxuICAgICAqL1xuICAgIHJlbW92ZShvYmplY3QpXG4gICAge1xuICAgICAgICB0aGlzLmNvbnRhaW5lcnNbMF0uc3BsaWNlKHRoaXMubGlzdFswXS5pbmRleE9mKG9iamVjdCksIDEpXG4gICAgICAgIHRoaXMucmVtb3ZlRnJvbUhhc2gob2JqZWN0KVxuICAgICAgICByZXR1cm4gb2JqZWN0XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogYWRkIGFuIGFycmF5IG9mIG9iamVjdHMgdG8gYmUgY3VsbGVkXG4gICAgICogQHBhcmFtIHtQSVhJLkNvbnRhaW5lcn0gY29udGFpbmVyXG4gICAgICogQHBhcmFtIHtib29sZWFufSBbc3RhdGljT2JqZWN0XSBzZXQgdG8gdHJ1ZSBpZiB0aGUgb2JqZWN0cyBpbiB0aGUgY29udGFpbmVyJ3MgcG9zaXRpb24vc2l6ZSBkbyBub3QgY2hhbmdlXG4gICAgICogbm90ZTogdGhpcyBvbmx5IHdvcmtzIHdpdGggcGl4aSB2NS4wLjByYzIrIGJlY2F1c2UgaXQgcmVsaWVzIG9uIHRoZSBuZXcgY29udGFpbmVyIGV2ZW50cyBjaGlsZEFkZGVkIGFuZCBjaGlsZFJlbW92ZWRcbiAgICAgKi9cbiAgICBhZGRDb250YWluZXIoY29udGFpbmVyLCBzdGF0aWNPYmplY3QpXG4gICAge1xuICAgICAgICBjb25zdCBhZGRlZCA9IGZ1bmN0aW9uKG9iamVjdClcbiAgICAgICAge1xuICAgICAgICAgICAgb2JqZWN0W3RoaXMuc3BhdGlhbF0gPSB7IGhhc2hlczogW10gfVxuICAgICAgICAgICAgdGhpcy51cGRhdGVPYmplY3Qob2JqZWN0KVxuICAgICAgICB9LmJpbmQodGhpcylcblxuICAgICAgICBjb25zdCByZW1vdmVkID0gZnVuY3Rpb24gKG9iamVjdClcbiAgICAgICAge1xuICAgICAgICAgICAgdGhpcy5yZW1vdmVGcm9tSGFzaChvYmplY3QpXG4gICAgICAgIH0uYmluZCh0aGlzKVxuXG4gICAgICAgIGZvciAobGV0IG9iamVjdCBvZiBjb250YWluZXIuY2hpbGRyZW4pXG4gICAgICAgIHtcbiAgICAgICAgICAgIG9iamVjdFt0aGlzLnNwYXRpYWxdID0geyBoYXNoZXM6IFtdIH1cbiAgICAgICAgICAgIHRoaXMudXBkYXRlT2JqZWN0KG9iamVjdClcbiAgICAgICAgfVxuICAgICAgICBjb250YWluZXIuY3VsbCA9IHt9XG4gICAgICAgIHRoaXMuY29udGFpbmVycy5wdXNoKGNvbnRhaW5lcilcbiAgICAgICAgY29udGFpbmVyLm9uKCdjaGlsZEFkZGVkJywgYWRkZWQpXG4gICAgICAgIGNvbnRhaW5lci5vbignY2hpbGRSZW1vdmVkJywgcmVtb3ZlZClcbiAgICAgICAgY29udGFpbmVyLmN1bGwuYWRkZWQgPSBhZGRlZFxuICAgICAgICBjb250YWluZXIuY3VsbC5yZW1vdmVkID0gcmVtb3ZlZFxuICAgICAgICBpZiAoc3RhdGljT2JqZWN0KVxuICAgICAgICB7XG4gICAgICAgICAgICBjb250YWluZXIuY3VsbC5zdGF0aWMgPSB0cnVlXG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiByZW1vdmUgYW4gYXJyYXkgYWRkZWQgYnkgYWRkQ29udGFpbmVyKClcbiAgICAgKiBAcGFyYW0ge1BJWEkuQ29udGFpbmVyfSBjb250YWluZXJcbiAgICAgKiBAcmV0dXJuIHtQSVhJLkNvbnRhaW5lcn0gY29udGFpbmVyXG4gICAgICovXG4gICAgcmVtb3ZlQ29udGFpbmVyKGNvbnRhaW5lcilcbiAgICB7XG4gICAgICAgIHRoaXMuY29udGFpbmVycy5zcGxpY2UodGhpcy5jb250YWluZXJzLmluZGV4T2YoY29udGFpbmVyKSwgMSlcbiAgICAgICAgY29udGFpbmVyLmNoaWxkcmVuLmZvckVhY2gob2JqZWN0ID0+IHRoaXMucmVtb3ZlRnJvbUhhc2gob2JqZWN0KSlcbiAgICAgICAgY29udGFpbmVyLm9mZignYWRkZWQnLCBjb250YWluZXIuY3VsbC5hZGRlZClcbiAgICAgICAgY29udGFpbmVyLm9mZigncmVtb3ZlZCcsIGNvbnRhaW5lci5jdWxsLnJlbW92ZWQpXG4gICAgICAgIGRlbGV0ZSBjb250YWluZXIuY3VsbFxuICAgICAgICByZXR1cm4gY29udGFpbmVyXG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogdXBkYXRlIHRoZSBoYXNoZXMgYW5kIGN1bGwgdGhlIGl0ZW1zIGluIHRoZSBsaXN0XG4gICAgICogQHBhcmFtIHtBQUJCfSBBQUJCXG4gICAgICogQHBhcmFtIHtib29sZWFufSBbc2tpcFVwZGF0ZV0gc2tpcCB1cGRhdGluZyB0aGUgaGFzaGVzIG9mIGFsbCBvYmplY3RzXG4gICAgICogQHJldHVybiB7bnVtYmVyfSBudW1iZXIgb2YgYnVja2V0cyBpbiByZXN1bHRzXG4gICAgICovXG4gICAgY3VsbChBQUJCLCBza2lwVXBkYXRlKVxuICAgIHtcbiAgICAgICAgaWYgKCFza2lwVXBkYXRlKVxuICAgICAgICB7XG4gICAgICAgICAgICB0aGlzLnVwZGF0ZU9iamVjdHMoKVxuICAgICAgICB9XG4gICAgICAgIHRoaXMuaW52aXNpYmxlKClcbiAgICAgICAgY29uc3Qgb2JqZWN0cyA9IHRoaXMucXVlcnkoQUFCQiwgdGhpcy5zaW1wbGVUZXN0KVxuICAgICAgICBvYmplY3RzLmZvckVhY2gob2JqZWN0ID0+IG9iamVjdFt0aGlzLnZpc2libGVdID0gdHJ1ZSlcbiAgICAgICAgcmV0dXJuIHRoaXMubGFzdEJ1Y2tldHNcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBzZXQgYWxsIG9iamVjdHMgaW4gaGFzaCB0byB2aXNpYmxlPWZhbHNlXG4gICAgICovXG4gICAgaW52aXNpYmxlKClcbiAgICB7XG4gICAgICAgIGZvciAobGV0IGNvbnRhaW5lciBvZiB0aGlzLmNvbnRhaW5lcnMpXG4gICAgICAgIHtcbiAgICAgICAgICAgIGNvbnRhaW5lci5jaGlsZHJlbi5mb3JFYWNoKG9iamVjdCA9PiBvYmplY3RbdGhpcy52aXNpYmxlXSA9IGZhbHNlKVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogdXBkYXRlIHRoZSBoYXNoZXMgZm9yIGFsbCBvYmplY3RzXG4gICAgICogYXV0b21hdGljYWxseSBjYWxsZWQgZnJvbSB1cGRhdGUoKSB3aGVuIHNraXBVcGRhdGU9ZmFsc2VcbiAgICAgKi9cbiAgICB1cGRhdGVPYmplY3RzKClcbiAgICB7XG4gICAgICAgIGlmICh0aGlzLmRpcnR5VGVzdClcbiAgICAgICAge1xuICAgICAgICAgICAgZm9yIChsZXQgb2JqZWN0IG9mIHRoaXMub2JqZWN0cylcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBpZiAob2JqZWN0W3RoaXMuZGlydHldKVxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy51cGRhdGVPYmplY3Qob2JqZWN0KVxuICAgICAgICAgICAgICAgICAgICBvYmplY3RbdGhpcy5kaXJ0eV0gPSBmYWxzZVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGZvciAobGV0IGNvbnRhaW5lciBvZiB0aGlzLmNvbnRhaW5lcnMpXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgZm9yIChsZXQgb2JqZWN0IG9mIGNvbnRhaW5lci5jaGlsZHJlbilcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChvYmplY3RbdGhpcy5kaXJ0eV0pXG4gICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMudXBkYXRlT2JqZWN0KG9iamVjdClcbiAgICAgICAgICAgICAgICAgICAgICAgIG9iamVjdFt0aGlzLmRpcnR5XSA9IGZhbHNlXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgZWxzZVxuICAgICAgICB7XG4gICAgICAgICAgICBmb3IgKGxldCBjb250YWluZXIgb2YgdGhpcy5jb250YWluZXJzKVxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGlmICghY29udGFpbmVyLmN1bGwuc3RhdGljKVxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgY29udGFpbmVyLmNoaWxkcmVuLmZvckVhY2gob2JqZWN0ID0+IHRoaXMudXBkYXRlT2JqZWN0KG9iamVjdCkpXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogdXBkYXRlIHRoZSBoYXMgb2YgYW4gb2JqZWN0XG4gICAgICogYXV0b21hdGljYWxseSBjYWxsZWQgZnJvbSB1cGRhdGVPYmplY3RzKClcbiAgICAgKiBAcGFyYW0geyp9IG9iamVjdFxuICAgICAqIEBwYXJhbSB7Ym9vbGVhbn0gW2ZvcmNlXSBmb3JjZSB1cGRhdGUgZm9yIGNhbGN1bGF0ZVBJWElcbiAgICAgKi9cbiAgICB1cGRhdGVPYmplY3Qob2JqZWN0KVxuICAgIHtcbiAgICAgICAgbGV0IEFBQkJcbiAgICAgICAgaWYgKHRoaXMuY2FsY3VsYXRlUElYSSlcbiAgICAgICAge1xuICAgICAgICAgICAgY29uc3QgYm94ID0gb2JqZWN0LmdldExvY2FsQm91bmRzKClcbiAgICAgICAgICAgIEFBQkIgPSBvYmplY3RbdGhpcy5BQUJCXSA9IHtcbiAgICAgICAgICAgICAgICB4OiBvYmplY3QueCArIGJveC54ICogb2JqZWN0LnNjYWxlLngsXG4gICAgICAgICAgICAgICAgeTogb2JqZWN0LnkgKyBib3gueSAqIG9iamVjdC5zY2FsZS55LFxuICAgICAgICAgICAgICAgIHdpZHRoOiBib3gud2lkdGggKiBvYmplY3Quc2NhbGUueCxcbiAgICAgICAgICAgICAgICBoZWlnaHQ6IGJveC5oZWlnaHQgKiBvYmplY3Quc2NhbGUueVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGVsc2VcbiAgICAgICAge1xuICAgICAgICAgICAgQUFCQiA9IG9iamVjdFt0aGlzLkFBQkJdXG4gICAgICAgIH1cblxuICAgICAgICBsZXQgc3BhdGlhbCA9IG9iamVjdFt0aGlzLnNwYXRpYWxdXG4gICAgICAgIGlmICghc3BhdGlhbClcbiAgICAgICAge1xuICAgICAgICAgICAgc3BhdGlhbCA9IG9iamVjdFt0aGlzLnNwYXRpYWxdID0geyBoYXNoZXM6IFtdIH1cbiAgICAgICAgfVxuICAgICAgICBjb25zdCB7IHhTdGFydCwgeVN0YXJ0LCB4RW5kLCB5RW5kIH0gPSB0aGlzLmdldEJvdW5kcyhBQUJCKVxuXG4gICAgICAgIC8vIG9ubHkgcmVtb3ZlIGFuZCBpbnNlcnQgaWYgbWFwcGluZyBoYXMgY2hhbmdlZFxuICAgICAgICBpZiAoc3BhdGlhbC54U3RhcnQgIT09IHhTdGFydCB8fCBzcGF0aWFsLnlTdGFydCAhPT0geVN0YXJ0IHx8IHNwYXRpYWwueEVuZCAhPT0geEVuZCB8fCBzcGF0aWFsLnlFbmQgIT09IHlFbmQpXG4gICAgICAgIHtcbiAgICAgICAgICAgIGlmIChzcGF0aWFsLmhhc2hlcy5sZW5ndGgpXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgdGhpcy5yZW1vdmVGcm9tSGFzaChvYmplY3QpXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBmb3IgKGxldCB5ID0geVN0YXJ0OyB5IDw9IHlFbmQ7IHkrKylcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBmb3IgKGxldCB4ID0geFN0YXJ0OyB4IDw9IHhFbmQ7IHgrKylcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGtleSA9IHggKyAnLCcgKyB5XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuaW5zZXJ0KG9iamVjdCwga2V5KVxuICAgICAgICAgICAgICAgICAgICBzcGF0aWFsLmhhc2hlcy5wdXNoKGtleSlcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBzcGF0aWFsLnhTdGFydCA9IHhTdGFydFxuICAgICAgICAgICAgc3BhdGlhbC55U3RhcnQgPSB5U3RhcnRcbiAgICAgICAgICAgIHNwYXRpYWwueEVuZCA9IHhFbmRcbiAgICAgICAgICAgIHNwYXRpYWwueUVuZCA9IHlFbmRcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIHJldHVybnMgYW4gYXJyYXkgb2YgYnVja2V0cyB3aXRoID49IG1pbmltdW0gb2Ygb2JqZWN0cyBpbiBlYWNoIGJ1Y2tldFxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSBbbWluaW11bT0xXVxuICAgICAqIEByZXR1cm4ge2FycmF5fSBhcnJheSBvZiBidWNrZXRzXG4gICAgICovXG4gICAgZ2V0QnVja2V0cyhtaW5pbXVtPTEpXG4gICAge1xuICAgICAgICBjb25zdCBoYXNoZXMgPSBbXVxuICAgICAgICBmb3IgKGxldCBrZXkgaW4gdGhpcy5oYXNoKVxuICAgICAgICB7XG4gICAgICAgICAgICBjb25zdCBoYXNoID0gdGhpcy5oYXNoW2tleV1cbiAgICAgICAgICAgIGlmIChoYXNoLmxlbmd0aCA+PSBtaW5pbXVtKVxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGhhc2hlcy5wdXNoKGhhc2gpXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGhhc2hlc1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIGdldHMgaGFzaCBib3VuZHNcbiAgICAgKiBAcGFyYW0ge0FBQkJ9IEFBQkJcbiAgICAgKiBAcmV0dXJuIHtCb3VuZHN9XG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBnZXRCb3VuZHMoQUFCQilcbiAgICB7XG4gICAgICAgIGxldCB4U3RhcnQgPSBNYXRoLmZsb29yKEFBQkIueCAvIHRoaXMueFNpemUpXG4gICAgICAgIGxldCB5U3RhcnQgPSBNYXRoLmZsb29yKEFBQkIueSAvIHRoaXMueVNpemUpXG4gICAgICAgIGxldCB4RW5kID0gTWF0aC5mbG9vcigoQUFCQi54ICsgQUFCQi53aWR0aCkgLyB0aGlzLnhTaXplKVxuICAgICAgICBsZXQgeUVuZCA9IE1hdGguZmxvb3IoKEFBQkIueSArIEFBQkIuaGVpZ2h0KSAvIHRoaXMueVNpemUpXG4gICAgICAgIHJldHVybiB7IHhTdGFydCwgeVN0YXJ0LCB4RW5kLCB5RW5kIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBpbnNlcnQgb2JqZWN0IGludG8gdGhlIHNwYXRpYWwgaGFzaFxuICAgICAqIGF1dG9tYXRpY2FsbHkgY2FsbGVkIGZyb20gdXBkYXRlT2JqZWN0KClcbiAgICAgKiBAcGFyYW0geyp9IG9iamVjdFxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBrZXlcbiAgICAgKi9cbiAgICBpbnNlcnQob2JqZWN0LCBrZXkpXG4gICAge1xuICAgICAgICBpZiAoIXRoaXMuaGFzaFtrZXldKVxuICAgICAgICB7XG4gICAgICAgICAgICB0aGlzLmhhc2hba2V5XSA9IFtvYmplY3RdXG4gICAgICAgIH1cbiAgICAgICAgZWxzZVxuICAgICAgICB7XG4gICAgICAgICAgICB0aGlzLmhhc2hba2V5XS5wdXNoKG9iamVjdClcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIHJlbW92ZXMgb2JqZWN0IGZyb20gdGhlIGhhc2ggdGFibGVcbiAgICAgKiBzaG91bGQgYmUgY2FsbGVkIHdoZW4gcmVtb3ZpbmcgYW4gb2JqZWN0XG4gICAgICogYXV0b21hdGljYWxseSBjYWxsZWQgZnJvbSB1cGRhdGVPYmplY3QoKVxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSBvYmplY3RcbiAgICAgKi9cbiAgICByZW1vdmVGcm9tSGFzaChvYmplY3QpXG4gICAge1xuICAgICAgICBjb25zdCBzcGF0aWFsID0gb2JqZWN0W3RoaXMuc3BhdGlhbF1cbiAgICAgICAgd2hpbGUgKHNwYXRpYWwuaGFzaGVzLmxlbmd0aClcbiAgICAgICAge1xuICAgICAgICAgICAgY29uc3Qga2V5ID0gc3BhdGlhbC5oYXNoZXMucG9wKClcbiAgICAgICAgICAgIGNvbnN0IGxpc3QgPSB0aGlzLmhhc2hba2V5XVxuICAgICAgICAgICAgbGlzdC5zcGxpY2UobGlzdC5pbmRleE9mKG9iamVjdCksIDEpXG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBnZXQgYWxsIG5laWdoYm9ycyB0aGF0IHNoYXJlIHRoZSBzYW1lIGhhc2ggYXMgb2JqZWN0XG4gICAgICogQHBhcmFtIHsqfSBvYmplY3QgaW4gdGhlIHNwYXRpYWwgaGFzaFxuICAgICAqIEByZXR1cm4ge0FycmF5fSBvZiBvYmplY3RzIHRoYXQgYXJlIGluIHRoZSBzYW1lIGhhc2ggYXMgb2JqZWN0XG4gICAgICovXG4gICAgbmVpZ2hib3JzKG9iamVjdClcbiAgICB7XG4gICAgICAgIGxldCByZXN1bHRzID0gW11cbiAgICAgICAgb2JqZWN0W3RoaXMuc3BhdGlhbF0uaGFzaGVzLmZvckVhY2goa2V5ID0+IHJlc3VsdHMgPSByZXN1bHRzLmNvbmNhdCh0aGlzLmhhc2hba2V5XSkpXG4gICAgICAgIHJldHVybiByZXN1bHRzXG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogcmV0dXJucyBhbiBhcnJheSBvZiBvYmplY3RzIGNvbnRhaW5lZCB3aXRoaW4gYm91bmRpbmcgYm94XG4gICAgICogQHBhcmFtIHtBQUJCfSBBQUJCIGJvdW5kaW5nIGJveCB0byBzZWFyY2hcbiAgICAgKiBAcGFyYW0ge2Jvb2xlYW59IFtzaW1wbGVUZXN0PXRydWVdIHBlcmZvcm0gYSBzaW1wbGUgYm91bmRzIGNoZWNrIG9mIGFsbCBpdGVtcyBpbiB0aGUgYnVja2V0c1xuICAgICAqIEByZXR1cm4ge29iamVjdFtdfSBzZWFyY2ggcmVzdWx0c1xuICAgICAqL1xuICAgIHF1ZXJ5KEFBQkIsIHNpbXBsZVRlc3QpXG4gICAge1xuICAgICAgICBzaW1wbGVUZXN0ID0gdHlwZW9mIHNpbXBsZVRlc3QgIT09ICd1bmRlZmluZWQnID8gc2ltcGxlVGVzdCA6IHRydWVcbiAgICAgICAgbGV0IGJ1Y2tldHMgPSAwXG4gICAgICAgIGxldCByZXN1bHRzID0gW11cbiAgICAgICAgY29uc3QgeyB4U3RhcnQsIHlTdGFydCwgeEVuZCwgeUVuZCB9ID0gdGhpcy5nZXRCb3VuZHMoQUFCQilcbiAgICAgICAgZm9yIChsZXQgeSA9IHlTdGFydDsgeSA8PSB5RW5kOyB5KyspXG4gICAgICAgIHtcbiAgICAgICAgICAgIGZvciAobGV0IHggPSB4U3RhcnQ7IHggPD0geEVuZDsgeCsrKVxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGNvbnN0IGVudHJ5ID0gdGhpcy5oYXNoW3ggKyAnLCcgKyB5XVxuICAgICAgICAgICAgICAgIGlmIChlbnRyeSlcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChzaW1wbGVUZXN0KVxuICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICBmb3IgKGxldCBvYmplY3Qgb2YgZW50cnkpXG4gICAgICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgYm94ID0gb2JqZWN0W3RoaXMuQUFCQl1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoYm94LnggKyBib3gud2lkdGggPiBBQUJCLnggJiYgYm94LnggPCBBQUJCLnggKyBBQUJCLndpZHRoICYmXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYm94LnkgKyBib3guaGVpZ2h0ID4gQUFCQi55ICYmIGJveC55IDwgQUFCQi55ICsgQUFCQi5oZWlnaHQpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXN1bHRzLnB1c2gob2JqZWN0KVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdHMgPSByZXN1bHRzLmNvbmNhdChlbnRyeSlcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBidWNrZXRzKytcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5sYXN0QnVja2V0cyA9IGJ1Y2tldHNcbiAgICAgICAgcmV0dXJuIHJlc3VsdHNcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBpdGVyYXRlcyB0aHJvdWdoIG9iamVjdHMgY29udGFpbmVkIHdpdGhpbiBib3VuZGluZyBib3hcbiAgICAgKiBzdG9wcyBpdGVyYXRpbmcgaWYgdGhlIGNhbGxiYWNrIHJldHVybnMgdHJ1ZVxuICAgICAqIEBwYXJhbSB7QUFCQn0gQUFCQiBib3VuZGluZyBib3ggdG8gc2VhcmNoXG4gICAgICogQHBhcmFtIHtmdW5jdGlvbn0gY2FsbGJhY2tcbiAgICAgKiBAcGFyYW0ge2Jvb2xlYW59IFtzaW1wbGVUZXN0PXRydWVdIHBlcmZvcm0gYSBzaW1wbGUgYm91bmRzIGNoZWNrIG9mIGFsbCBpdGVtcyBpbiB0aGUgYnVja2V0c1xuICAgICAqIEByZXR1cm4ge2Jvb2xlYW59IHRydWUgaWYgY2FsbGJhY2sgcmV0dXJuZWQgZWFybHlcbiAgICAgKi9cbiAgICBxdWVyeUNhbGxiYWNrKEFBQkIsIGNhbGxiYWNrLCBzaW1wbGVUZXN0KVxuICAgIHtcbiAgICAgICAgc2ltcGxlVGVzdCA9IHR5cGVvZiBzaW1wbGVUZXN0ICE9PSAndW5kZWZpbmVkJyA/IHNpbXBsZVRlc3QgOiB0cnVlXG4gICAgICAgIGNvbnN0IHsgeFN0YXJ0LCB5U3RhcnQsIHhFbmQsIHlFbmQgfSA9IHRoaXMuZ2V0Qm91bmRzKEFBQkIpXG4gICAgICAgIGZvciAobGV0IHkgPSB5U3RhcnQ7IHkgPD0geUVuZDsgeSsrKVxuICAgICAgICB7XG4gICAgICAgICAgICBmb3IgKGxldCB4ID0geFN0YXJ0OyB4IDw9IHhFbmQ7IHgrKylcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBjb25zdCBlbnRyeSA9IHRoaXMuaGFzaFt4ICsgJywnICsgeV1cbiAgICAgICAgICAgICAgICBpZiAoZW50cnkpXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGVudHJ5Lmxlbmd0aDsgaSsrKVxuICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBvYmplY3QgPSBlbnRyeVtpXVxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHNpbXBsZVRlc3QpXG4gICAgICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgQUFCQiA9IG9iamVjdC5BQUJCXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKEFBQkIueCArIEFBQkIud2lkdGggPiBBQUJCLnggJiYgQUFCQi54IDwgQUFCQi54ICsgQUFCQi53aWR0aCAmJlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIEFBQkIueSArIEFBQkIuaGVpZ2h0ID4gQUFCQi55ICYmIEFBQkIueSA8IEFBQkIueSArIEFBQkIuaGVpZ2h0KVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGNhbGxiYWNrKG9iamVjdCkpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB0cnVlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGNhbGxiYWNrKG9iamVjdCkpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZmFsc2VcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBnZXQgc3RhdHNcbiAgICAgKiBAcmV0dXJuIHtTdGF0c31cbiAgICAgKi9cbiAgICBzdGF0cygpXG4gICAge1xuICAgICAgICBsZXQgdmlzaWJsZSA9IDAsIGNvdW50ID0gMFxuICAgICAgICBmb3IgKGxldCBsaXN0IG9mIHRoaXMuY29udGFpbmVycylcbiAgICAgICAge1xuICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBsaXN0LmNoaWxkcmVuLmxlbmd0aDsgaSsrKVxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGNvbnN0IG9iamVjdCA9IGxpc3QuY2hpbGRyZW5baV1cbiAgICAgICAgICAgICAgICB2aXNpYmxlICs9IG9iamVjdC52aXNpYmxlID8gMSA6IDBcbiAgICAgICAgICAgICAgICBjb3VudCsrXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHRvdGFsOiBjb3VudCxcbiAgICAgICAgICAgIHZpc2libGUsXG4gICAgICAgICAgICBjdWxsZWQ6IGNvdW50IC0gdmlzaWJsZVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogaGVscGVyIGZ1bmN0aW9uIHRvIGV2YWx1YXRlIGhhc2ggdGFibGVcbiAgICAgKiBAcmV0dXJuIHtudW1iZXJ9IHRoZSBudW1iZXIgb2YgYnVja2V0cyBpbiB0aGUgaGFzaCB0YWJsZVxuICAgICAqICovXG4gICAgZ2V0TnVtYmVyT2ZCdWNrZXRzKClcbiAgICB7XG4gICAgICAgIHJldHVybiBPYmplY3Qua2V5cyh0aGlzLmhhc2gpLmxlbmd0aFxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIGhlbHBlciBmdW5jdGlvbiB0byBldmFsdWF0ZSBoYXNoIHRhYmxlXG4gICAgICogQHJldHVybiB7bnVtYmVyfSB0aGUgYXZlcmFnZSBudW1iZXIgb2YgZW50cmllcyBpbiBlYWNoIGJ1Y2tldFxuICAgICAqL1xuICAgIGdldEF2ZXJhZ2VTaXplKClcbiAgICB7XG4gICAgICAgIGxldCB0b3RhbCA9IDBcbiAgICAgICAgZm9yIChsZXQga2V5IGluIHRoaXMuaGFzaClcbiAgICAgICAge1xuICAgICAgICAgICAgdG90YWwgKz0gdGhpcy5oYXNoW2tleV0ubGVuZ3RoXG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRvdGFsIC8gdGhpcy5nZXRCdWNrZXRzKCkubGVuZ3RoXG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogaGVscGVyIGZ1bmN0aW9uIHRvIGV2YWx1YXRlIHRoZSBoYXNoIHRhYmxlXG4gICAgICogQHJldHVybiB7bnVtYmVyfSB0aGUgbGFyZ2VzdCBzaXplZCBidWNrZXRcbiAgICAgKi9cbiAgICBnZXRMYXJnZXN0KClcbiAgICB7XG4gICAgICAgIGxldCBsYXJnZXN0ID0gMFxuICAgICAgICBmb3IgKGxldCBrZXkgaW4gdGhpcy5oYXNoKVxuICAgICAgICB7XG4gICAgICAgICAgICBpZiAodGhpcy5oYXNoW2tleV0ubGVuZ3RoID4gbGFyZ2VzdClcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBsYXJnZXN0ID0gdGhpcy5oYXNoW2tleV0ubGVuZ3RoXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGxhcmdlc3RcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBnZXRzIHF1YWRyYW50IGJvdW5kc1xuICAgICAqIEByZXR1cm4ge0JvdW5kc31cbiAgICAgKi9cbiAgICBnZXRXb3JsZEJvdW5kcygpXG4gICAge1xuICAgICAgICBsZXQgeFN0YXJ0ID0gSW5maW5pdHksIHlTdGFydCA9IEluZmluaXR5LCB4RW5kID0gMCwgeUVuZCA9IDBcbiAgICAgICAgZm9yIChsZXQga2V5IGluIHRoaXMuaGFzaClcbiAgICAgICAge1xuICAgICAgICAgICAgY29uc3Qgc3BsaXQgPSBrZXkuc3BsaXQoJywnKVxuICAgICAgICAgICAgbGV0IHggPSBwYXJzZUludChzcGxpdFswXSlcbiAgICAgICAgICAgIGxldCB5ID0gcGFyc2VJbnQoc3BsaXRbMV0pXG4gICAgICAgICAgICB4U3RhcnQgPSB4IDwgeFN0YXJ0ID8geCA6IHhTdGFydFxuICAgICAgICAgICAgeVN0YXJ0ID0geSA8IHlTdGFydCA/IHkgOiB5U3RhcnRcbiAgICAgICAgICAgIHhFbmQgPSB4ID4geEVuZCA/IHggOiB4RW5kXG4gICAgICAgICAgICB5RW5kID0geSA+IHlFbmQgPyB5IDogeUVuZFxuICAgICAgICB9XG4gICAgICAgIHJldHVybiB7IHhTdGFydCwgeVN0YXJ0LCB4RW5kLCB5RW5kIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBoZWxwZXIgZnVuY3Rpb24gdG8gZXZhbHV0ZSB0aGUgaGFzaCB0YWJsZVxuICAgICAqIEBwYXJhbSB7QUFCQn0gW0FBQkJdIGJvdW5kaW5nIGJveCB0byBzZWFyY2ggb3IgZW50aXJlIHdvcmxkXG4gICAgICogQHJldHVybiB7bnVtYmVyfSBzcGFyc2VuZXNzIHBlcmNlbnRhZ2UgKGkuZS4sIGJ1Y2tldHMgd2l0aCBhdCBsZWFzdCAxIGVsZW1lbnQgZGl2aWRlZCBieSB0b3RhbCBwb3NzaWJsZSBidWNrZXRzKVxuICAgICAqL1xuICAgIGdldFNwYXJzZW5lc3MoQUFCQilcbiAgICB7XG4gICAgICAgIGxldCBjb3VudCA9IDAsIHRvdGFsID0gMFxuICAgICAgICBjb25zdCB7IHhTdGFydCwgeVN0YXJ0LCB4RW5kLCB5RW5kIH0gPSBBQUJCID8gdGhpcy5nZXRCb3VuZHMoQUFCQikgOiB0aGlzLmdldFdvcmxkQm91bmRzKClcbiAgICAgICAgZm9yIChsZXQgeSA9IHlTdGFydDsgeSA8IHlFbmQ7IHkrKylcbiAgICAgICAge1xuICAgICAgICAgICAgZm9yIChsZXQgeCA9IHhTdGFydDsgeCA8IHhFbmQ7IHgrKylcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBjb3VudCArPSAodGhpcy5oYXNoW3ggKyAnLCcgKyB5XSA/IDEgOiAwKVxuICAgICAgICAgICAgICAgIHRvdGFsKytcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gY291bnQgLyB0b3RhbFxuICAgIH1cbn1cblxuLyoqXG4gKiBAdHlwZWRlZiB7b2JqZWN0fSBTdGF0c1xuICogQHByb3BlcnR5IHtudW1iZXJ9IHRvdGFsXG4gKiBAcHJvcGVydHkge251bWJlcn0gdmlzaWJsZVxuICogQHByb3BlcnR5IHtudW1iZXJ9IGN1bGxlZFxuICovXG5cbi8qKlxuICogQHR5cGVkZWYge29iamVjdH0gQm91bmRzXG4gKiBAcHJvcGVydHkge251bWJlcn0geFN0YXJ0XG4gKiBAcHJvcGVydHkge251bWJlcn0geVN0YXJ0XG4gKiBAcHJvcGVydHkge251bWJlcn0geEVuZFxuICogQHByb3BlcnR5IHtudW1iZXJ9IHhFbmRcbiAqL1xuXG4vKipcbiAgKiBAdHlwZWRlZiB7b2JqZWN0fSBBQUJCXG4gICogQHByb3BlcnR5IHtudW1iZXJ9IHhcbiAgKiBAcHJvcGVydHkge251bWJlcn0geVxuICAqIEBwcm9wZXJ0eSB7bnVtYmVyfSB3aWR0aFxuICAqIEBwcm9wZXJ0eSB7bnVtYmVyfSBoZWlnaHRcbiAgKi9cblxubW9kdWxlLmV4cG9ydHMgPSBTcGF0aWFsSGFzaCJdfQ==