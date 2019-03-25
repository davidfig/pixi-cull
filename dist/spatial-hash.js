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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL2NvZGUvc3BhdGlhbC1oYXNoLmpzIl0sIm5hbWVzIjpbIlNwYXRpYWxIYXNoIiwib3B0aW9ucyIsInhTaXplIiwic2l6ZSIsInlTaXplIiwiQUFCQiIsInR5cGUiLCJzcGF0aWFsIiwiY2FsY3VsYXRlUElYSSIsInZpc2libGVUZXh0IiwidmlzaWJsZVRlc3QiLCJzaW1wbGVUZXN0IiwiZGlydHlUZXN0IiwidmlzaWJsZSIsImRpcnR5Iiwid2lkdGgiLCJoZWlnaHQiLCJoYXNoIiwib2JqZWN0cyIsImNvbnRhaW5lcnMiLCJvYmplY3QiLCJzdGF0aWNPYmplY3QiLCJoYXNoZXMiLCJ1cGRhdGVPYmplY3QiLCJwdXNoIiwic3BsaWNlIiwibGlzdCIsImluZGV4T2YiLCJyZW1vdmVGcm9tSGFzaCIsImNvbnRhaW5lciIsImFkZGVkIiwiYmluZCIsInJlbW92ZWQiLCJjaGlsZHJlbiIsImN1bGwiLCJvbiIsInN0YXRpYyIsImZvckVhY2giLCJvZmYiLCJza2lwVXBkYXRlIiwidXBkYXRlT2JqZWN0cyIsImludmlzaWJsZSIsInF1ZXJ5IiwibGFzdEJ1Y2tldHMiLCJib3giLCJnZXRMb2NhbEJvdW5kcyIsIngiLCJzY2FsZSIsInkiLCJnZXRCb3VuZHMiLCJ4U3RhcnQiLCJ5U3RhcnQiLCJ4RW5kIiwieUVuZCIsImxlbmd0aCIsImtleSIsImluc2VydCIsIm1pbmltdW0iLCJNYXRoIiwiZmxvb3IiLCJwb3AiLCJyZXN1bHRzIiwiY29uY2F0IiwiYnVja2V0cyIsImVudHJ5IiwiY2FsbGJhY2siLCJpIiwiY291bnQiLCJ0b3RhbCIsImN1bGxlZCIsIk9iamVjdCIsImtleXMiLCJnZXRCdWNrZXRzIiwibGFyZ2VzdCIsIkluZmluaXR5Iiwic3BsaXQiLCJwYXJzZUludCIsImdldFdvcmxkQm91bmRzIiwibW9kdWxlIiwiZXhwb3J0cyJdLCJtYXBwaW5ncyI6Ijs7Ozs7O0FBQUE7QUFDQTtBQUNBOztJQUVNQSxXO0FBRUY7Ozs7Ozs7Ozs7Ozs7O0FBY0EseUJB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UCxHQUE4QixLQUFLd0UsY0FBTCxFQUZ6RTtBQUFBLGdCQUVZM0IsTUFGWixRQUVZQSxNQUZaO0FBQUEsZ0JBRW9CQyxNQUZwQixRQUVvQkEsTUFGcEI7QUFBQSxnQkFFNEJDLElBRjVCLFFBRTRCQSxJQUY1QjtBQUFBLGdCQUVrQ0MsSUFGbEMsUUFFa0NBLElBRmxDOztBQUdJLGlCQUFLLElBQUlMLElBQUlHLE1BQWIsRUFBcUJILElBQUlLLElBQXpCLEVBQStCTCxHQUEvQixFQUNBO0FBQ0kscUJBQUssSUFBSUYsSUFBSUksTUFBYixFQUFxQkosSUFBSU0sSUFBekIsRUFBK0JOLEdBQS9CLEVBQ0E7QUFDSXFCLDZCQUFVLEtBQUtsRCxJQUFMLENBQVU2QixJQUFJLEdBQUosR0FBVUUsQ0FBcEIsSUFBeUIsQ0FBekIsR0FBNkIsQ0FBdkM7QUFDQW9CO0FBQ0g7QUFDSjtBQUNELG1CQUFPRCxRQUFRQyxLQUFmO0FBQ0g7Ozs7OztBQUdMOzs7Ozs7O0FBT0E7Ozs7Ozs7O0FBUUE7Ozs7Ozs7O0FBUUFVLE9BQU9DLE9BQVAsR0FBaUIvRSxXQUFqQiIsImZpbGUiOiJzcGF0aWFsLWhhc2guanMiLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAxOCBZT1BFWSBZT1BFWSBMTENcclxuLy8gRGF2aWQgRmlnYXRuZXJcclxuLy8gTUlUIExpY2Vuc2VcclxuXHJcbmNsYXNzIFNwYXRpYWxIYXNoXHJcbntcclxuICAgIC8qKlxyXG4gICAgICogY3JlYXRlcyBhIHNwYXRpYWwtaGFzaCBjdWxsXHJcbiAgICAgKiBAcGFyYW0ge29iamVjdH0gW29wdGlvbnNdXHJcbiAgICAgKiBAcGFyYW0ge251bWJlcn0gW29wdGlvbnMuc2l6ZT0xMDAwXSBjZWxsIHNpemUgdXNlZCB0byBjcmVhdGUgaGFzaCAoeFNpemUgPSB5U2l6ZSlcclxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSBbb3B0aW9ucy54U2l6ZV0gaG9yaXpvbnRhbCBjZWxsIHNpemVcclxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSBbb3B0aW9ucy55U2l6ZV0gdmVydGljYWwgY2VsbCBzaXplXHJcbiAgICAgKiBAcGFyYW0ge2Jvb2xlYW59IFtvcHRpb25zLmNhbGN1bGF0ZVBJWEk9dHJ1ZV0gY2FsY3VsYXRlIGJvdW5kaW5nIGJveCBhdXRvbWF0aWNhbGx5OyBpZiB0aGlzIGlzIHNldCB0byBmYWxzZSB0aGVuIGl0IHVzZXMgb2JqZWN0W29wdGlvbnMuQUFCQl0gZm9yIGJvdW5kaW5nIGJveFxyXG4gICAgICogQHBhcmFtIHtib29sZWFufSBbb3B0aW9ucy52aXNpYmxlPXZpc2libGVdIHBhcmFtZXRlciBvZiB0aGUgb2JqZWN0IHRvIHNldCAodXN1YWxseSB2aXNpYmxlIG9yIHJlbmRlcmFibGUpXHJcbiAgICAgKiBAcGFyYW0ge2Jvb2xlYW59IFtvcHRpb25zLnNpbXBsZVRlc3Q9dHJ1ZV0gaXRlcmF0ZSB0aHJvdWdoIHZpc2libGUgYnVja2V0cyB0byBjaGVjayBmb3IgYm91bmRzXHJcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gW29wdGlvbnMuZGlydHlUZXN0PXRydWVdIG9ubHkgdXBkYXRlIHNwYXRpYWwgaGFzaCBmb3Igb2JqZWN0cyB3aXRoIG9iamVjdFtvcHRpb25zLmRpcnR5VGVzdF09dHJ1ZTsgdGhpcyBoYXMgYSBIVUdFIGltcGFjdCBvbiBwZXJmb3JtYW5jZVxyXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IFtvcHRpb25zLkFBQkI9QUFCQl0gb2JqZWN0IHByb3BlcnR5IHRoYXQgaG9sZHMgYm91bmRpbmcgYm94IHNvIHRoYXQgb2JqZWN0W3R5cGVdID0geyB4OiBudW1iZXIsIHk6IG51bWJlciwgd2lkdGg6IG51bWJlciwgaGVpZ2h0OiBudW1iZXIgfVxyXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IFtvcHRpb25zLnNwYXRpYWw9c3BhdGlhbF0gb2JqZWN0IHByb3BlcnR5IHRoYXQgaG9sZHMgb2JqZWN0J3MgaGFzaCBsaXN0XHJcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gW29wdGlvbnMuZGlydHk9ZGlydHldIG9iamVjdCBwcm9wZXJ0eSBmb3IgZGlydHlUZXN0XHJcbiAgICAgKi9cclxuICAgIGNvbnN0cnVjdG9yKG9wdGlvbnMpXHJcbiAgICB7XHJcbiAgICAgICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge31cclxuICAgICAgICB0aGlzLnhTaXplID0gb3B0aW9ucy54U2l6ZSB8fCBvcHRpb25zLnNpemUgfHwgMTAwMFxyXG4gICAgICAgIHRoaXMueVNpemUgPSBvcHRpb25zLnlTaXplIHx8IG9wdGlvbnMuc2l6ZSB8fCAxMDAwXHJcbiAgICAgICAgdGhpcy5BQUJCID0gb3B0aW9ucy50eXBlIHx8ICdBQUJCJ1xyXG4gICAgICAgIHRoaXMuc3BhdGlhbCA9IG9wdGlvbnMuc3BhdGlhbCB8fCAnc3BhdGlhbCdcclxuICAgICAgICB0aGlzLmNhbGN1bGF0ZVBJWEkgPSB0eXBlb2Ygb3B0aW9ucy5jYWxjdWxhdGVQSVhJICE9PSAndW5kZWZpbmVkJyA/IG9wdGlvbnMuY2FsY3VsYXRlUElYSSA6IHRydWVcclxuICAgICAgICB0aGlzLnZpc2libGVUZXh0ID0gdHlwZW9mIG9wdGlvbnMudmlzaWJsZVRlc3QgIT09ICd1bmRlZmluZWQnID8gb3B0aW9ucy52aXNpYmxlVGVzdCA6IHRydWVcclxuICAgICAgICB0aGlzLnNpbXBsZVRlc3QgPSB0eXBlb2Ygb3B0aW9ucy5zaW1wbGVUZXN0ICE9PSAndW5kZWZpbmVkJyA/IG9wdGlvbnMuc2ltcGxlVGVzdCA6IHRydWVcclxuICAgICAgICB0aGlzLmRpcnR5VGVzdCA9IHR5cGVvZiBvcHRpb25zLmRpcnR5VGVzdCAhPT0gJ3VuZGVmaW5lZCcgPyBvcHRpb25zLmRpcnR5VGVzdCA6IHRydWVcclxuICAgICAgICB0aGlzLnZpc2libGUgPSBvcHRpb25zLnZpc2libGUgfHwgJ3Zpc2libGUnXHJcbiAgICAgICAgdGhpcy5kaXJ0eSA9IG9wdGlvbnMuZGlydHkgfHwgJ2RpcnR5J1xyXG4gICAgICAgIHRoaXMud2lkdGggPSB0aGlzLmhlaWdodCA9IDBcclxuICAgICAgICB0aGlzLmhhc2ggPSB7fVxyXG4gICAgICAgIHRoaXMub2JqZWN0cyA9IFtdXHJcbiAgICAgICAgdGhpcy5jb250YWluZXJzID0gW11cclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIGFkZCBhbiBvYmplY3QgdG8gYmUgY3VsbGVkXHJcbiAgICAgKiBzaWRlIGVmZmVjdDogYWRkcyBvYmplY3Quc3BhdGlhbEhhc2hlcyB0byB0cmFjayBleGlzdGluZyBoYXNoZXNcclxuICAgICAqIEBwYXJhbSB7Kn0gb2JqZWN0XHJcbiAgICAgKiBAcGFyYW0ge2Jvb2xlYW59IFtzdGF0aWNPYmplY3RdIHNldCB0byB0cnVlIGlmIHRoZSBvYmplY3QncyBwb3NpdGlvbi9zaXplIGRvZXMgbm90IGNoYW5nZVxyXG4gICAgICogQHJldHVybiB7Kn0gb2JqZWN0XHJcbiAgICAgKi9cclxuICAgIGFkZChvYmplY3QsIHN0YXRpY09iamVjdClcclxuICAgIHtcclxuICAgICAgICBvYmplY3RbdGhpcy5zcGF0aWFsXSA9IHsgaGFzaGVzOiBbXSB9XHJcbiAgICAgICAgaWYgKHRoaXMuY2FsY3VsYXRlUElYSSAmJiB0aGlzLmRpcnR5VGVzdClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIG9iamVjdFt0aGlzLmRpcnR5XSA9IHRydWVcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKHN0YXRpY09iamVjdClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIG9iamVjdC5zdGF0aWNPYmplY3QgPSB0cnVlXHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMudXBkYXRlT2JqZWN0KG9iamVjdClcclxuICAgICAgICB0aGlzLmNvbnRhaW5lcnNbMF0ucHVzaChvYmplY3QpXHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiByZW1vdmUgYW4gb2JqZWN0IGFkZGVkIGJ5IGFkZCgpXHJcbiAgICAgKiBAcGFyYW0geyp9IG9iamVjdFxyXG4gICAgICogQHJldHVybiB7Kn0gb2JqZWN0XHJcbiAgICAgKi9cclxuICAgIHJlbW92ZShvYmplY3QpXHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy5jb250YWluZXJzWzBdLnNwbGljZSh0aGlzLmxpc3RbMF0uaW5kZXhPZihvYmplY3QpLCAxKVxyXG4gICAgICAgIHRoaXMucmVtb3ZlRnJvbUhhc2gob2JqZWN0KVxyXG4gICAgICAgIHJldHVybiBvYmplY3RcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIGFkZCBhbiBhcnJheSBvZiBvYmplY3RzIHRvIGJlIGN1bGxlZFxyXG4gICAgICogQHBhcmFtIHtQSVhJLkNvbnRhaW5lcn0gY29udGFpbmVyXHJcbiAgICAgKiBAcGFyYW0ge2Jvb2xlYW59IFtzdGF0aWNPYmplY3RdIHNldCB0byB0cnVlIGlmIHRoZSBvYmplY3RzIGluIHRoZSBjb250YWluZXIncyBwb3NpdGlvbi9zaXplIGRvIG5vdCBjaGFuZ2VcclxuICAgICAqIG5vdGU6IHRoaXMgb25seSB3b3JrcyB3aXRoIHBpeGkgdjUuMC4wcmMyKyBiZWNhdXNlIGl0IHJlbGllcyBvbiB0aGUgbmV3IGNvbnRhaW5lciBldmVudHMgY2hpbGRBZGRlZCBhbmQgY2hpbGRSZW1vdmVkXHJcbiAgICAgKi9cclxuICAgIGFkZENvbnRhaW5lcihjb250YWluZXIsIHN0YXRpY09iamVjdClcclxuICAgIHtcclxuICAgICAgICBjb25zdCBhZGRlZCA9IGZ1bmN0aW9uKG9iamVjdClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIG9iamVjdFt0aGlzLnNwYXRpYWxdID0geyBoYXNoZXM6IFtdIH1cclxuICAgICAgICAgICAgdGhpcy51cGRhdGVPYmplY3Qob2JqZWN0KVxyXG4gICAgICAgIH0uYmluZCh0aGlzKVxyXG5cclxuICAgICAgICBjb25zdCByZW1vdmVkID0gZnVuY3Rpb24gKG9iamVjdClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRoaXMucmVtb3ZlRnJvbUhhc2gob2JqZWN0KVxyXG4gICAgICAgIH0uYmluZCh0aGlzKVxyXG5cclxuICAgICAgICBmb3IgKGxldCBvYmplY3Qgb2YgY29udGFpbmVyLmNoaWxkcmVuKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgb2JqZWN0W3RoaXMuc3BhdGlhbF0gPSB7IGhhc2hlczogW10gfVxyXG4gICAgICAgICAgICB0aGlzLnVwZGF0ZU9iamVjdChvYmplY3QpXHJcbiAgICAgICAgfVxyXG4gICAgICAgIGNvbnRhaW5lci5jdWxsID0ge31cclxuICAgICAgICB0aGlzLmNvbnRhaW5lcnMucHVzaChjb250YWluZXIpXHJcbiAgICAgICAgY29udGFpbmVyLm9uKCdjaGlsZEFkZGVkJywgYWRkZWQpXHJcbiAgICAgICAgY29udGFpbmVyLm9uKCdjaGlsZFJlbW92ZWQnLCByZW1vdmVkKVxyXG4gICAgICAgIGNvbnRhaW5lci5jdWxsLmFkZGVkID0gYWRkZWRcclxuICAgICAgICBjb250YWluZXIuY3VsbC5yZW1vdmVkID0gcmVtb3ZlZFxyXG4gICAgICAgIGlmIChzdGF0aWNPYmplY3QpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBjb250YWluZXIuY3VsbC5zdGF0aWMgPSB0cnVlXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogcmVtb3ZlIGFuIGFycmF5IGFkZGVkIGJ5IGFkZENvbnRhaW5lcigpXHJcbiAgICAgKiBAcGFyYW0ge1BJWEkuQ29udGFpbmVyfSBjb250YWluZXJcclxuICAgICAqIEByZXR1cm4ge1BJWEkuQ29udGFpbmVyfSBjb250YWluZXJcclxuICAgICAqL1xyXG4gICAgcmVtb3ZlQ29udGFpbmVyKGNvbnRhaW5lcilcclxuICAgIHtcclxuICAgICAgICB0aGlzLmNvbnRhaW5lcnMuc3BsaWNlKHRoaXMuY29udGFpbmVycy5pbmRleE9mKGNvbnRhaW5lciksIDEpXHJcbiAgICAgICAgY29udGFpbmVyLmNoaWxkcmVuLmZvckVhY2gob2JqZWN0ID0+IHRoaXMucmVtb3ZlRnJvbUhhc2gob2JqZWN0KSlcclxuICAgICAgICBjb250YWluZXIub2ZmKCdhZGRlZCcsIGNvbnRhaW5lci5jdWxsLmFkZGVkKVxyXG4gICAgICAgIGNvbnRhaW5lci5vZmYoJ3JlbW92ZWQnLCBjb250YWluZXIuY3VsbC5yZW1vdmVkKVxyXG4gICAgICAgIGRlbGV0ZSBjb250YWluZXIuY3VsbFxyXG4gICAgICAgIHJldHVybiBjb250YWluZXJcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIHVwZGF0ZSB0aGUgaGFzaGVzIGFuZCBjdWxsIHRoZSBpdGVtcyBpbiB0aGUgbGlzdFxyXG4gICAgICogQHBhcmFtIHtBQUJCfSBBQUJCXHJcbiAgICAgKiBAcGFyYW0ge2Jvb2xlYW59IFtza2lwVXBkYXRlXSBza2lwIHVwZGF0aW5nIHRoZSBoYXNoZXMgb2YgYWxsIG9iamVjdHNcclxuICAgICAqIEByZXR1cm4ge251bWJlcn0gbnVtYmVyIG9mIGJ1Y2tldHMgaW4gcmVzdWx0c1xyXG4gICAgICovXHJcbiAgICBjdWxsKEFBQkIsIHNraXBVcGRhdGUpXHJcbiAgICB7XHJcbiAgICAgICAgaWYgKCFza2lwVXBkYXRlKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhpcy51cGRhdGVPYmplY3RzKClcclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy5pbnZpc2libGUoKVxyXG4gICAgICAgIGNvbnN0IG9iamVjdHMgPSB0aGlzLnF1ZXJ5KEFBQkIsIHRoaXMuc2ltcGxlVGVzdClcclxuICAgICAgICBvYmplY3RzLmZvckVhY2gob2JqZWN0ID0+IG9iamVjdFt0aGlzLnZpc2libGVdID0gdHJ1ZSlcclxuICAgICAgICByZXR1cm4gdGhpcy5sYXN0QnVja2V0c1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogc2V0IGFsbCBvYmplY3RzIGluIGhhc2ggdG8gdmlzaWJsZT1mYWxzZVxyXG4gICAgICovXHJcbiAgICBpbnZpc2libGUoKVxyXG4gICAge1xyXG4gICAgICAgIGZvciAobGV0IGNvbnRhaW5lciBvZiB0aGlzLmNvbnRhaW5lcnMpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBjb250YWluZXIuY2hpbGRyZW4uZm9yRWFjaChvYmplY3QgPT4gb2JqZWN0W3RoaXMudmlzaWJsZV0gPSBmYWxzZSlcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiB1cGRhdGUgdGhlIGhhc2hlcyBmb3IgYWxsIG9iamVjdHNcclxuICAgICAqIGF1dG9tYXRpY2FsbHkgY2FsbGVkIGZyb20gdXBkYXRlKCkgd2hlbiBza2lwVXBkYXRlPWZhbHNlXHJcbiAgICAgKi9cclxuICAgIHVwZGF0ZU9iamVjdHMoKVxyXG4gICAge1xyXG4gICAgICAgIGlmICh0aGlzLmRpcnR5VGVzdClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGZvciAobGV0IG9iamVjdCBvZiB0aGlzLm9iamVjdHMpXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGlmIChvYmplY3RbdGhpcy5kaXJ0eV0pXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy51cGRhdGVPYmplY3Qob2JqZWN0KVxyXG4gICAgICAgICAgICAgICAgICAgIG9iamVjdFt0aGlzLmRpcnR5XSA9IGZhbHNlXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZm9yIChsZXQgY29udGFpbmVyIG9mIHRoaXMuY29udGFpbmVycylcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgZm9yIChsZXQgb2JqZWN0IG9mIGNvbnRhaW5lci5jaGlsZHJlbilcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAob2JqZWN0W3RoaXMuZGlydHldKVxyXG4gICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy51cGRhdGVPYmplY3Qob2JqZWN0KVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBvYmplY3RbdGhpcy5kaXJ0eV0gPSBmYWxzZVxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBmb3IgKGxldCBjb250YWluZXIgb2YgdGhpcy5jb250YWluZXJzKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBpZiAoIWNvbnRhaW5lci5jdWxsLnN0YXRpYylcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICBjb250YWluZXIuY2hpbGRyZW4uZm9yRWFjaChvYmplY3QgPT4gdGhpcy51cGRhdGVPYmplY3Qob2JqZWN0KSlcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIHVwZGF0ZSB0aGUgaGFzIG9mIGFuIG9iamVjdFxyXG4gICAgICogYXV0b21hdGljYWxseSBjYWxsZWQgZnJvbSB1cGRhdGVPYmplY3RzKClcclxuICAgICAqIEBwYXJhbSB7Kn0gb2JqZWN0XHJcbiAgICAgKiBAcGFyYW0ge2Jvb2xlYW59IFtmb3JjZV0gZm9yY2UgdXBkYXRlIGZvciBjYWxjdWxhdGVQSVhJXHJcbiAgICAgKi9cclxuICAgIHVwZGF0ZU9iamVjdChvYmplY3QpXHJcbiAgICB7XHJcbiAgICAgICAgbGV0IEFBQkJcclxuICAgICAgICBpZiAodGhpcy5jYWxjdWxhdGVQSVhJKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgY29uc3QgYm94ID0gb2JqZWN0LmdldExvY2FsQm91bmRzKClcclxuICAgICAgICAgICAgQUFCQiA9IG9iamVjdFt0aGlzLkFBQkJdID0ge1xyXG4gICAgICAgICAgICAgICAgeDogb2JqZWN0LnggKyBib3gueCAqIG9iamVjdC5zY2FsZS54LFxyXG4gICAgICAgICAgICAgICAgeTogb2JqZWN0LnkgKyBib3gueSAqIG9iamVjdC5zY2FsZS55LFxyXG4gICAgICAgICAgICAgICAgd2lkdGg6IGJveC53aWR0aCAqIG9iamVjdC5zY2FsZS54LFxyXG4gICAgICAgICAgICAgICAgaGVpZ2h0OiBib3guaGVpZ2h0ICogb2JqZWN0LnNjYWxlLnlcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBBQUJCID0gb2JqZWN0W3RoaXMuQUFCQl1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGxldCBzcGF0aWFsID0gb2JqZWN0W3RoaXMuc3BhdGlhbF1cclxuICAgICAgICBpZiAoIXNwYXRpYWwpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBzcGF0aWFsID0gb2JqZWN0W3RoaXMuc3BhdGlhbF0gPSB7IGhhc2hlczogW10gfVxyXG4gICAgICAgIH1cclxuICAgICAgICBjb25zdCB7IHhTdGFydCwgeVN0YXJ0LCB4RW5kLCB5RW5kIH0gPSB0aGlzLmdldEJvdW5kcyhBQUJCKVxyXG5cclxuICAgICAgICAvLyBvbmx5IHJlbW92ZSBhbmQgaW5zZXJ0IGlmIG1hcHBpbmcgaGFzIGNoYW5nZWRcclxuICAgICAgICBpZiAoc3BhdGlhbC54U3RhcnQgIT09IHhTdGFydCB8fCBzcGF0aWFsLnlTdGFydCAhPT0geVN0YXJ0IHx8IHNwYXRpYWwueEVuZCAhPT0geEVuZCB8fCBzcGF0aWFsLnlFbmQgIT09IHlFbmQpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBpZiAoc3BhdGlhbC5oYXNoZXMubGVuZ3RoKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnJlbW92ZUZyb21IYXNoKG9iamVjdClcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBmb3IgKGxldCB5ID0geVN0YXJ0OyB5IDw9IHlFbmQ7IHkrKylcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgZm9yIChsZXQgeCA9IHhTdGFydDsgeCA8PSB4RW5kOyB4KyspXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3Qga2V5ID0geCArICcsJyArIHlcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmluc2VydChvYmplY3QsIGtleSlcclxuICAgICAgICAgICAgICAgICAgICBzcGF0aWFsLmhhc2hlcy5wdXNoKGtleSlcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBzcGF0aWFsLnhTdGFydCA9IHhTdGFydFxyXG4gICAgICAgICAgICBzcGF0aWFsLnlTdGFydCA9IHlTdGFydFxyXG4gICAgICAgICAgICBzcGF0aWFsLnhFbmQgPSB4RW5kXHJcbiAgICAgICAgICAgIHNwYXRpYWwueUVuZCA9IHlFbmRcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiByZXR1cm5zIGFuIGFycmF5IG9mIGJ1Y2tldHMgd2l0aCA+PSBtaW5pbXVtIG9mIG9iamVjdHMgaW4gZWFjaCBidWNrZXRcclxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSBbbWluaW11bT0xXVxyXG4gICAgICogQHJldHVybiB7YXJyYXl9IGFycmF5IG9mIGJ1Y2tldHNcclxuICAgICAqL1xyXG4gICAgZ2V0QnVja2V0cyhtaW5pbXVtPTEpXHJcbiAgICB7XHJcbiAgICAgICAgY29uc3QgaGFzaGVzID0gW11cclxuICAgICAgICBmb3IgKGxldCBrZXkgaW4gdGhpcy5oYXNoKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgY29uc3QgaGFzaCA9IHRoaXMuaGFzaFtrZXldXHJcbiAgICAgICAgICAgIGlmIChoYXNoLmxlbmd0aCA+PSBtaW5pbXVtKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBoYXNoZXMucHVzaChoYXNoKVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBoYXNoZXNcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIGdldHMgaGFzaCBib3VuZHNcclxuICAgICAqIEBwYXJhbSB7QUFCQn0gQUFCQlxyXG4gICAgICogQHJldHVybiB7Qm91bmRzfVxyXG4gICAgICogQHByaXZhdGVcclxuICAgICAqL1xyXG4gICAgZ2V0Qm91bmRzKEFBQkIpXHJcbiAgICB7XHJcbiAgICAgICAgbGV0IHhTdGFydCA9IE1hdGguZmxvb3IoQUFCQi54IC8gdGhpcy54U2l6ZSlcclxuICAgICAgICBsZXQgeVN0YXJ0ID0gTWF0aC5mbG9vcihBQUJCLnkgLyB0aGlzLnlTaXplKVxyXG4gICAgICAgIGxldCB4RW5kID0gTWF0aC5mbG9vcigoQUFCQi54ICsgQUFCQi53aWR0aCkgLyB0aGlzLnhTaXplKVxyXG4gICAgICAgIGxldCB5RW5kID0gTWF0aC5mbG9vcigoQUFCQi55ICsgQUFCQi5oZWlnaHQpIC8gdGhpcy55U2l6ZSlcclxuICAgICAgICByZXR1cm4geyB4U3RhcnQsIHlTdGFydCwgeEVuZCwgeUVuZCB9XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBpbnNlcnQgb2JqZWN0IGludG8gdGhlIHNwYXRpYWwgaGFzaFxyXG4gICAgICogYXV0b21hdGljYWxseSBjYWxsZWQgZnJvbSB1cGRhdGVPYmplY3QoKVxyXG4gICAgICogQHBhcmFtIHsqfSBvYmplY3RcclxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBrZXlcclxuICAgICAqL1xyXG4gICAgaW5zZXJ0KG9iamVjdCwga2V5KVxyXG4gICAge1xyXG4gICAgICAgIGlmICghdGhpcy5oYXNoW2tleV0pXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aGlzLmhhc2hba2V5XSA9IFtvYmplY3RdXHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2VcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRoaXMuaGFzaFtrZXldLnB1c2gob2JqZWN0KVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIHJlbW92ZXMgb2JqZWN0IGZyb20gdGhlIGhhc2ggdGFibGVcclxuICAgICAqIHNob3VsZCBiZSBjYWxsZWQgd2hlbiByZW1vdmluZyBhbiBvYmplY3RcclxuICAgICAqIGF1dG9tYXRpY2FsbHkgY2FsbGVkIGZyb20gdXBkYXRlT2JqZWN0KClcclxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSBvYmplY3RcclxuICAgICAqL1xyXG4gICAgcmVtb3ZlRnJvbUhhc2gob2JqZWN0KVxyXG4gICAge1xyXG4gICAgICAgIGNvbnN0IHNwYXRpYWwgPSBvYmplY3RbdGhpcy5zcGF0aWFsXVxyXG4gICAgICAgIHdoaWxlIChzcGF0aWFsLmhhc2hlcy5sZW5ndGgpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBjb25zdCBrZXkgPSBzcGF0aWFsLmhhc2hlcy5wb3AoKVxyXG4gICAgICAgICAgICBjb25zdCBsaXN0ID0gdGhpcy5oYXNoW2tleV1cclxuICAgICAgICAgICAgbGlzdC5zcGxpY2UobGlzdC5pbmRleE9mKG9iamVjdCksIDEpXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogZ2V0IGFsbCBuZWlnaGJvcnMgdGhhdCBzaGFyZSB0aGUgc2FtZSBoYXNoIGFzIG9iamVjdFxyXG4gICAgICogQHBhcmFtIHsqfSBvYmplY3QgaW4gdGhlIHNwYXRpYWwgaGFzaFxyXG4gICAgICogQHJldHVybiB7QXJyYXl9IG9mIG9iamVjdHMgdGhhdCBhcmUgaW4gdGhlIHNhbWUgaGFzaCBhcyBvYmplY3RcclxuICAgICAqL1xyXG4gICAgbmVpZ2hib3JzKG9iamVjdClcclxuICAgIHtcclxuICAgICAgICBsZXQgcmVzdWx0cyA9IFtdXHJcbiAgICAgICAgb2JqZWN0W3RoaXMuc3BhdGlhbF0uaGFzaGVzLmZvckVhY2goa2V5ID0+IHJlc3VsdHMgPSByZXN1bHRzLmNvbmNhdCh0aGlzLmhhc2hba2V5XSkpXHJcbiAgICAgICAgcmV0dXJuIHJlc3VsdHNcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIHJldHVybnMgYW4gYXJyYXkgb2Ygb2JqZWN0cyBjb250YWluZWQgd2l0aGluIGJvdW5kaW5nIGJveFxyXG4gICAgICogQHBhcmFtIHtBQUJCfSBBQUJCIGJvdW5kaW5nIGJveCB0byBzZWFyY2hcclxuICAgICAqIEBwYXJhbSB7Ym9vbGVhbn0gW3NpbXBsZVRlc3Q9dHJ1ZV0gcGVyZm9ybSBhIHNpbXBsZSBib3VuZHMgY2hlY2sgb2YgYWxsIGl0ZW1zIGluIHRoZSBidWNrZXRzXHJcbiAgICAgKiBAcmV0dXJuIHtvYmplY3RbXX0gc2VhcmNoIHJlc3VsdHNcclxuICAgICAqL1xyXG4gICAgcXVlcnkoQUFCQiwgc2ltcGxlVGVzdClcclxuICAgIHtcclxuICAgICAgICBzaW1wbGVUZXN0ID0gdHlwZW9mIHNpbXBsZVRlc3QgIT09ICd1bmRlZmluZWQnID8gc2ltcGxlVGVzdCA6IHRydWVcclxuICAgICAgICBsZXQgYnVja2V0cyA9IDBcclxuICAgICAgICBsZXQgcmVzdWx0cyA9IFtdXHJcbiAgICAgICAgY29uc3QgeyB4U3RhcnQsIHlTdGFydCwgeEVuZCwgeUVuZCB9ID0gdGhpcy5nZXRCb3VuZHMoQUFCQilcclxuICAgICAgICBmb3IgKGxldCB5ID0geVN0YXJ0OyB5IDw9IHlFbmQ7IHkrKylcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGZvciAobGV0IHggPSB4U3RhcnQ7IHggPD0geEVuZDsgeCsrKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBlbnRyeSA9IHRoaXMuaGFzaFt4ICsgJywnICsgeV1cclxuICAgICAgICAgICAgICAgIGlmIChlbnRyeSlcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoc2ltcGxlVGVzdClcclxuICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGZvciAobGV0IG9iamVjdCBvZiBlbnRyeSlcclxuICAgICAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgYm94ID0gb2JqZWN0W3RoaXMuQUFCQl1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChib3gueCArIGJveC53aWR0aCA+IEFBQkIueCAmJiBib3gueCA8IEFBQkIueCArIEFBQkIud2lkdGggJiZcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJveC55ICsgYm94LmhlaWdodCA+IEFBQkIueSAmJiBib3gueSA8IEFBQkIueSArIEFBQkIuaGVpZ2h0KVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdHMucHVzaChvYmplY3QpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0cyA9IHJlc3VsdHMuY29uY2F0KGVudHJ5KVxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICBidWNrZXRzKytcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLmxhc3RCdWNrZXRzID0gYnVja2V0c1xyXG4gICAgICAgIHJldHVybiByZXN1bHRzXHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBpdGVyYXRlcyB0aHJvdWdoIG9iamVjdHMgY29udGFpbmVkIHdpdGhpbiBib3VuZGluZyBib3hcclxuICAgICAqIHN0b3BzIGl0ZXJhdGluZyBpZiB0aGUgY2FsbGJhY2sgcmV0dXJucyB0cnVlXHJcbiAgICAgKiBAcGFyYW0ge0FBQkJ9IEFBQkIgYm91bmRpbmcgYm94IHRvIHNlYXJjaFxyXG4gICAgICogQHBhcmFtIHtmdW5jdGlvbn0gY2FsbGJhY2tcclxuICAgICAqIEBwYXJhbSB7Ym9vbGVhbn0gW3NpbXBsZVRlc3Q9dHJ1ZV0gcGVyZm9ybSBhIHNpbXBsZSBib3VuZHMgY2hlY2sgb2YgYWxsIGl0ZW1zIGluIHRoZSBidWNrZXRzXHJcbiAgICAgKiBAcmV0dXJuIHtib29sZWFufSB0cnVlIGlmIGNhbGxiYWNrIHJldHVybmVkIGVhcmx5XHJcbiAgICAgKi9cclxuICAgIHF1ZXJ5Q2FsbGJhY2soQUFCQiwgY2FsbGJhY2ssIHNpbXBsZVRlc3QpXHJcbiAgICB7XHJcbiAgICAgICAgc2ltcGxlVGVzdCA9IHR5cGVvZiBzaW1wbGVUZXN0ICE9PSAndW5kZWZpbmVkJyA/IHNpbXBsZVRlc3QgOiB0cnVlXHJcbiAgICAgICAgY29uc3QgeyB4U3RhcnQsIHlTdGFydCwgeEVuZCwgeUVuZCB9ID0gdGhpcy5nZXRCb3VuZHMoQUFCQilcclxuICAgICAgICBmb3IgKGxldCB5ID0geVN0YXJ0OyB5IDw9IHlFbmQ7IHkrKylcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGZvciAobGV0IHggPSB4U3RhcnQ7IHggPD0geEVuZDsgeCsrKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBlbnRyeSA9IHRoaXMuaGFzaFt4ICsgJywnICsgeV1cclxuICAgICAgICAgICAgICAgIGlmIChlbnRyeSlcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGVudHJ5Lmxlbmd0aDsgaSsrKVxyXG4gICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3Qgb2JqZWN0ID0gZW50cnlbaV1cclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHNpbXBsZVRlc3QpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IEFBQkIgPSBvYmplY3QuQUFCQlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKEFBQkIueCArIEFBQkIud2lkdGggPiBBQUJCLnggJiYgQUFCQi54IDwgQUFCQi54ICsgQUFCQi53aWR0aCAmJlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgQUFCQi55ICsgQUFCQi5oZWlnaHQgPiBBQUJCLnkgJiYgQUFCQi55IDwgQUFCQi55ICsgQUFCQi5oZWlnaHQpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGNhbGxiYWNrKG9iamVjdCkpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChjYWxsYmFjayhvYmplY3QpKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB0cnVlXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIGZhbHNlXHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBnZXQgc3RhdHNcclxuICAgICAqIEByZXR1cm4ge1N0YXRzfVxyXG4gICAgICovXHJcbiAgICBzdGF0cygpXHJcbiAgICB7XHJcbiAgICAgICAgbGV0IHZpc2libGUgPSAwLCBjb3VudCA9IDBcclxuICAgICAgICBmb3IgKGxldCBsaXN0IG9mIHRoaXMuY29udGFpbmVycylcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbGlzdC5jaGlsZHJlbi5sZW5ndGg7IGkrKylcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgY29uc3Qgb2JqZWN0ID0gbGlzdC5jaGlsZHJlbltpXVxyXG4gICAgICAgICAgICAgICAgdmlzaWJsZSArPSBvYmplY3QudmlzaWJsZSA/IDEgOiAwXHJcbiAgICAgICAgICAgICAgICBjb3VudCsrXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgdG90YWw6IGNvdW50LFxyXG4gICAgICAgICAgICB2aXNpYmxlLFxyXG4gICAgICAgICAgICBjdWxsZWQ6IGNvdW50IC0gdmlzaWJsZVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIGhlbHBlciBmdW5jdGlvbiB0byBldmFsdWF0ZSBoYXNoIHRhYmxlXHJcbiAgICAgKiBAcmV0dXJuIHtudW1iZXJ9IHRoZSBudW1iZXIgb2YgYnVja2V0cyBpbiB0aGUgaGFzaCB0YWJsZVxyXG4gICAgICogKi9cclxuICAgIGdldE51bWJlck9mQnVja2V0cygpXHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuIE9iamVjdC5rZXlzKHRoaXMuaGFzaCkubGVuZ3RoXHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBoZWxwZXIgZnVuY3Rpb24gdG8gZXZhbHVhdGUgaGFzaCB0YWJsZVxyXG4gICAgICogQHJldHVybiB7bnVtYmVyfSB0aGUgYXZlcmFnZSBudW1iZXIgb2YgZW50cmllcyBpbiBlYWNoIGJ1Y2tldFxyXG4gICAgICovXHJcbiAgICBnZXRBdmVyYWdlU2l6ZSgpXHJcbiAgICB7XHJcbiAgICAgICAgbGV0IHRvdGFsID0gMFxyXG4gICAgICAgIGZvciAobGV0IGtleSBpbiB0aGlzLmhhc2gpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0b3RhbCArPSB0aGlzLmhhc2hba2V5XS5sZW5ndGhcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHRvdGFsIC8gdGhpcy5nZXRCdWNrZXRzKCkubGVuZ3RoXHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBoZWxwZXIgZnVuY3Rpb24gdG8gZXZhbHVhdGUgdGhlIGhhc2ggdGFibGVcclxuICAgICAqIEByZXR1cm4ge251bWJlcn0gdGhlIGxhcmdlc3Qgc2l6ZWQgYnVja2V0XHJcbiAgICAgKi9cclxuICAgIGdldExhcmdlc3QoKVxyXG4gICAge1xyXG4gICAgICAgIGxldCBsYXJnZXN0ID0gMFxyXG4gICAgICAgIGZvciAobGV0IGtleSBpbiB0aGlzLmhhc2gpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBpZiAodGhpcy5oYXNoW2tleV0ubGVuZ3RoID4gbGFyZ2VzdClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgbGFyZ2VzdCA9IHRoaXMuaGFzaFtrZXldLmxlbmd0aFxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBsYXJnZXN0XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBnZXRzIHF1YWRyYW50IGJvdW5kc1xyXG4gICAgICogQHJldHVybiB7Qm91bmRzfVxyXG4gICAgICovXHJcbiAgICBnZXRXb3JsZEJvdW5kcygpXHJcbiAgICB7XHJcbiAgICAgICAgbGV0IHhTdGFydCA9IEluZmluaXR5LCB5U3RhcnQgPSBJbmZpbml0eSwgeEVuZCA9IDAsIHlFbmQgPSAwXHJcbiAgICAgICAgZm9yIChsZXQga2V5IGluIHRoaXMuaGFzaClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGNvbnN0IHNwbGl0ID0ga2V5LnNwbGl0KCcsJylcclxuICAgICAgICAgICAgbGV0IHggPSBwYXJzZUludChzcGxpdFswXSlcclxuICAgICAgICAgICAgbGV0IHkgPSBwYXJzZUludChzcGxpdFsxXSlcclxuICAgICAgICAgICAgeFN0YXJ0ID0geCA8IHhTdGFydCA/IHggOiB4U3RhcnRcclxuICAgICAgICAgICAgeVN0YXJ0ID0geSA8IHlTdGFydCA/IHkgOiB5U3RhcnRcclxuICAgICAgICAgICAgeEVuZCA9IHggPiB4RW5kID8geCA6IHhFbmRcclxuICAgICAgICAgICAgeUVuZCA9IHkgPiB5RW5kID8geSA6IHlFbmRcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHsgeFN0YXJ0LCB5U3RhcnQsIHhFbmQsIHlFbmQgfVxyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogaGVscGVyIGZ1bmN0aW9uIHRvIGV2YWx1dGUgdGhlIGhhc2ggdGFibGVcclxuICAgICAqIEBwYXJhbSB7QUFCQn0gW0FBQkJdIGJvdW5kaW5nIGJveCB0byBzZWFyY2ggb3IgZW50aXJlIHdvcmxkXHJcbiAgICAgKiBAcmV0dXJuIHtudW1iZXJ9IHNwYXJzZW5lc3MgcGVyY2VudGFnZSAoaS5lLiwgYnVja2V0cyB3aXRoIGF0IGxlYXN0IDEgZWxlbWVudCBkaXZpZGVkIGJ5IHRvdGFsIHBvc3NpYmxlIGJ1Y2tldHMpXHJcbiAgICAgKi9cclxuICAgIGdldFNwYXJzZW5lc3MoQUFCQilcclxuICAgIHtcclxuICAgICAgICBsZXQgY291bnQgPSAwLCB0b3RhbCA9IDBcclxuICAgICAgICBjb25zdCB7IHhTdGFydCwgeVN0YXJ0LCB4RW5kLCB5RW5kIH0gPSBBQUJCID8gdGhpcy5nZXRCb3VuZHMoQUFCQikgOiB0aGlzLmdldFdvcmxkQm91bmRzKClcclxuICAgICAgICBmb3IgKGxldCB5ID0geVN0YXJ0OyB5IDwgeUVuZDsgeSsrKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgZm9yIChsZXQgeCA9IHhTdGFydDsgeCA8IHhFbmQ7IHgrKylcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgY291bnQgKz0gKHRoaXMuaGFzaFt4ICsgJywnICsgeV0gPyAxIDogMClcclxuICAgICAgICAgICAgICAgIHRvdGFsKytcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gY291bnQgLyB0b3RhbFxyXG4gICAgfVxyXG59XHJcblxyXG4vKipcclxuICogQHR5cGVkZWYge29iamVjdH0gU3RhdHNcclxuICogQHByb3BlcnR5IHtudW1iZXJ9IHRvdGFsXHJcbiAqIEBwcm9wZXJ0eSB7bnVtYmVyfSB2aXNpYmxlXHJcbiAqIEBwcm9wZXJ0eSB7bnVtYmVyfSBjdWxsZWRcclxuICovXHJcblxyXG4vKipcclxuICogQHR5cGVkZWYge29iamVjdH0gQm91bmRzXHJcbiAqIEBwcm9wZXJ0eSB7bnVtYmVyfSB4U3RhcnRcclxuICogQHByb3BlcnR5IHtudW1iZXJ9IHlTdGFydFxyXG4gKiBAcHJvcGVydHkge251bWJlcn0geEVuZFxyXG4gKiBAcHJvcGVydHkge251bWJlcn0geEVuZFxyXG4gKi9cclxuXHJcbi8qKlxyXG4gICogQHR5cGVkZWYge29iamVjdH0gQUFCQlxyXG4gICogQHByb3BlcnR5IHtudW1iZXJ9IHhcclxuICAqIEBwcm9wZXJ0eSB7bnVtYmVyfSB5XHJcbiAgKiBAcHJvcGVydHkge251bWJlcn0gd2lkdGhcclxuICAqIEBwcm9wZXJ0eSB7bnVtYmVyfSBoZWlnaHRcclxuICAqL1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBTcGF0aWFsSGFzaCJdfQ==