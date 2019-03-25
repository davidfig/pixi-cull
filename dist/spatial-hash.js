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

                    list.forEach(function (object) {
                        visible += object.visible ? 1 : 0;
                        count++;
                    });
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
            return total / this.getBuckets();
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

        /** helper function to evalute the hash table
         * @param {AABB} AABB bounding box to search
         * @return {number} sparseness percentage (i.e., buckets with at least 1 element divided by total possible buckets)
         */

    }, {
        key: 'getSparseness',
        value: function getSparseness(AABB) {
            var count = 0,
                total = 0;

            var _getBounds4 = this.getBounds(AABB),
                xStart = _getBounds4.xStart,
                yStart = _getBounds4.yStart,
                xEnd = _getBounds4.xEnd,
                yEnd = _getBounds4.yEnd;

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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL2NvZGUvc3BhdGlhbC1oYXNoLmpzIl0sIm5hbWVzIjpbIlNwYXRpYWxIYXNoIiwib3B0aW9ucyIsInhTaXplIiwic2l6ZSIsInlTaXplIiwiQUFCQiIsInR5cGUiLCJzcGF0aWFsIiwiY2FsY3VsYXRlUElYSSIsInZpc2libGVUZXh0IiwidmlzaWJsZVRlc3QiLCJzaW1wbGVUZXN0IiwiZGlydHlUZXN0IiwidmlzaWJsZSIsImRpcnR5Iiwid2lkdGgiLCJoZWlnaHQiLCJoYXNoIiwib2JqZWN0cyIsImNvbnRhaW5lcnMiLCJvYmplY3QiLCJzdGF0aWNPYmplY3QiLCJoYXNoZXMiLCJ1cGRhdGVPYmplY3QiLCJwdXNoIiwic3BsaWNlIiwibGlzdCIsImluZGV4T2YiLCJyZW1vdmVGcm9tSGFzaCIsImNvbnRhaW5lciIsImFkZGVkIiwiYmluZCIsInJlbW92ZWQiLCJjaGlsZHJlbiIsImN1bGwiLCJvbiIsInN0YXRpYyIsImZvckVhY2giLCJvZmYiLCJza2lwVXBkYXRlIiwidXBkYXRlT2JqZWN0cyIsImludmlzaWJsZSIsInF1ZXJ5IiwibGFzdEJ1Y2tldHMiLCJib3giLCJnZXRMb2NhbEJvdW5kcyIsIngiLCJzY2FsZSIsInkiLCJnZXRCb3VuZHMiLCJ4U3RhcnQiLCJ5U3RhcnQiLCJ4RW5kIiwieUVuZCIsImxlbmd0aCIsImtleSIsImluc2VydCIsIm1pbmltdW0iLCJNYXRoIiwiZmxvb3IiLCJwb3AiLCJyZXN1bHRzIiwiY29uY2F0IiwiYnVja2V0cyIsImVudHJ5IiwiY2FsbGJhY2siLCJpIiwiY291bnQiLCJ0b3RhbCIsImN1bGxlZCIsIk9iamVjdCIsImtleXMiLCJnZXRCdWNrZXRzIiwibGFyZ2VzdCIsIm1vZHVsZSIsImV4cG9ydHMiXSwibWFwcGluZ3MiOiI7Ozs7OztBQUFBO0FBQ0E7QUFDQTs7SUFFTUEsVztBQUVGOzs7Ozs7Ozs7Ozs7OztBQWNBLHlCQUFZQyxPQUFaLEVBQ0E7QUFBQTs7QUFDSUEsa0JBQVVBLFdBQVcsRUFBckI7QUFD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QUFVc0MsR0FBVixFQUFlRCxNQUF6QjtBQUNIO0FBQ0o7QUFDRCxtQkFBT21CLE9BQVA7QUFDSDs7QUFFRDs7Ozs7OztzQ0FJY3BFLEksRUFDZDtBQUNJLGdCQUFJOEQsUUFBUSxDQUFaO0FBQUEsZ0JBQWVDLFFBQVEsQ0FBdkI7O0FBREosOEJBRTJDLEtBQUtuQixTQUFMLENBQWU1QyxJQUFmLENBRjNDO0FBQUEsZ0JBRVk2QyxNQUZaLGVBRVlBLE1BRlo7QUFBQSxnQkFFb0JDLE1BRnBCLGVBRW9CQSxNQUZwQjtBQUFBLGdCQUU0QkMsSUFGNUIsZUFFNEJBLElBRjVCO0FBQUEsZ0JBRWtDQyxJQUZsQyxlQUVrQ0EsSUFGbEM7O0FBR0ksaUJBQUssSUFBSUwsSUFBSUcsTUFBYixFQUFxQkgsSUFBSUssSUFBekIsRUFBK0JMLEdBQS9CLEVBQ0E7QUFDSSxxQkFBSyxJQUFJRixJQUFJSSxNQUFiLEVBQXFCSixJQUFJTSxJQUF6QixFQUErQk4sR0FBL0IsRUFDQTtBQUNJcUIsNkJBQVUsS0FBS2xELElBQUwsQ0FBVTZCLElBQUksR0FBSixHQUFVRSxDQUFwQixJQUF5QixDQUF6QixHQUE2QixDQUF2QztBQUNBb0I7QUFDSDtBQUNKO0FBQ0QsbUJBQU9ELFFBQVFDLEtBQWY7QUFDSDs7Ozs7O0FBR0w7Ozs7Ozs7QUFPQTs7Ozs7Ozs7QUFRQTs7Ozs7Ozs7QUFRQU0sT0FBT0MsT0FBUCxHQUFpQjNFLFdBQWpCIiwiZmlsZSI6InNwYXRpYWwtaGFzaC5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDE4IFlPUEVZIFlPUEVZIExMQ1xyXG4vLyBEYXZpZCBGaWdhdG5lclxyXG4vLyBNSVQgTGljZW5zZVxyXG5cclxuY2xhc3MgU3BhdGlhbEhhc2hcclxue1xyXG4gICAgLyoqXHJcbiAgICAgKiBjcmVhdGVzIGEgc3BhdGlhbC1oYXNoIGN1bGxcclxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSBbb3B0aW9uc11cclxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSBbb3B0aW9ucy5zaXplPTEwMDBdIGNlbGwgc2l6ZSB1c2VkIHRvIGNyZWF0ZSBoYXNoICh4U2l6ZSA9IHlTaXplKVxyXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IFtvcHRpb25zLnhTaXplXSBob3Jpem9udGFsIGNlbGwgc2l6ZVxyXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IFtvcHRpb25zLnlTaXplXSB2ZXJ0aWNhbCBjZWxsIHNpemVcclxuICAgICAqIEBwYXJhbSB7Ym9vbGVhbn0gW29wdGlvbnMuY2FsY3VsYXRlUElYST10cnVlXSBjYWxjdWxhdGUgYm91bmRpbmcgYm94IGF1dG9tYXRpY2FsbHk7IGlmIHRoaXMgaXMgc2V0IHRvIGZhbHNlIHRoZW4gaXQgdXNlcyBvYmplY3Rbb3B0aW9ucy5BQUJCXSBmb3IgYm91bmRpbmcgYm94XHJcbiAgICAgKiBAcGFyYW0ge2Jvb2xlYW59IFtvcHRpb25zLnZpc2libGU9dmlzaWJsZV0gcGFyYW1ldGVyIG9mIHRoZSBvYmplY3QgdG8gc2V0ICh1c3VhbGx5IHZpc2libGUgb3IgcmVuZGVyYWJsZSlcclxuICAgICAqIEBwYXJhbSB7Ym9vbGVhbn0gW29wdGlvbnMuc2ltcGxlVGVzdD10cnVlXSBpdGVyYXRlIHRocm91Z2ggdmlzaWJsZSBidWNrZXRzIHRvIGNoZWNrIGZvciBib3VuZHNcclxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBbb3B0aW9ucy5kaXJ0eVRlc3Q9dHJ1ZV0gb25seSB1cGRhdGUgc3BhdGlhbCBoYXNoIGZvciBvYmplY3RzIHdpdGggb2JqZWN0W29wdGlvbnMuZGlydHlUZXN0XT10cnVlOyB0aGlzIGhhcyBhIEhVR0UgaW1wYWN0IG9uIHBlcmZvcm1hbmNlXHJcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gW29wdGlvbnMuQUFCQj1BQUJCXSBvYmplY3QgcHJvcGVydHkgdGhhdCBob2xkcyBib3VuZGluZyBib3ggc28gdGhhdCBvYmplY3RbdHlwZV0gPSB7IHg6IG51bWJlciwgeTogbnVtYmVyLCB3aWR0aDogbnVtYmVyLCBoZWlnaHQ6IG51bWJlciB9XHJcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gW29wdGlvbnMuc3BhdGlhbD1zcGF0aWFsXSBvYmplY3QgcHJvcGVydHkgdGhhdCBob2xkcyBvYmplY3QncyBoYXNoIGxpc3RcclxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBbb3B0aW9ucy5kaXJ0eT1kaXJ0eV0gb2JqZWN0IHByb3BlcnR5IGZvciBkaXJ0eVRlc3RcclxuICAgICAqL1xyXG4gICAgY29uc3RydWN0b3Iob3B0aW9ucylcclxuICAgIHtcclxuICAgICAgICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fVxyXG4gICAgICAgIHRoaXMueFNpemUgPSBvcHRpb25zLnhTaXplIHx8IG9wdGlvbnMuc2l6ZSB8fCAxMDAwXHJcbiAgICAgICAgdGhpcy55U2l6ZSA9IG9wdGlvbnMueVNpemUgfHwgb3B0aW9ucy5zaXplIHx8IDEwMDBcclxuICAgICAgICB0aGlzLkFBQkIgPSBvcHRpb25zLnR5cGUgfHwgJ0FBQkInXHJcbiAgICAgICAgdGhpcy5zcGF0aWFsID0gb3B0aW9ucy5zcGF0aWFsIHx8ICdzcGF0aWFsJ1xyXG4gICAgICAgIHRoaXMuY2FsY3VsYXRlUElYSSA9IHR5cGVvZiBvcHRpb25zLmNhbGN1bGF0ZVBJWEkgIT09ICd1bmRlZmluZWQnID8gb3B0aW9ucy5jYWxjdWxhdGVQSVhJIDogdHJ1ZVxyXG4gICAgICAgIHRoaXMudmlzaWJsZVRleHQgPSB0eXBlb2Ygb3B0aW9ucy52aXNpYmxlVGVzdCAhPT0gJ3VuZGVmaW5lZCcgPyBvcHRpb25zLnZpc2libGVUZXN0IDogdHJ1ZVxyXG4gICAgICAgIHRoaXMuc2ltcGxlVGVzdCA9IHR5cGVvZiBvcHRpb25zLnNpbXBsZVRlc3QgIT09ICd1bmRlZmluZWQnID8gb3B0aW9ucy5zaW1wbGVUZXN0IDogdHJ1ZVxyXG4gICAgICAgIHRoaXMuZGlydHlUZXN0ID0gdHlwZW9mIG9wdGlvbnMuZGlydHlUZXN0ICE9PSAndW5kZWZpbmVkJyA/IG9wdGlvbnMuZGlydHlUZXN0IDogdHJ1ZVxyXG4gICAgICAgIHRoaXMudmlzaWJsZSA9IG9wdGlvbnMudmlzaWJsZSB8fCAndmlzaWJsZSdcclxuICAgICAgICB0aGlzLmRpcnR5ID0gb3B0aW9ucy5kaXJ0eSB8fCAnZGlydHknXHJcbiAgICAgICAgdGhpcy53aWR0aCA9IHRoaXMuaGVpZ2h0ID0gMFxyXG4gICAgICAgIHRoaXMuaGFzaCA9IHt9XHJcbiAgICAgICAgdGhpcy5vYmplY3RzID0gW11cclxuICAgICAgICB0aGlzLmNvbnRhaW5lcnMgPSBbXVxyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogYWRkIGFuIG9iamVjdCB0byBiZSBjdWxsZWRcclxuICAgICAqIHNpZGUgZWZmZWN0OiBhZGRzIG9iamVjdC5zcGF0aWFsSGFzaGVzIHRvIHRyYWNrIGV4aXN0aW5nIGhhc2hlc1xyXG4gICAgICogQHBhcmFtIHsqfSBvYmplY3RcclxuICAgICAqIEBwYXJhbSB7Ym9vbGVhbn0gW3N0YXRpY09iamVjdF0gc2V0IHRvIHRydWUgaWYgdGhlIG9iamVjdCdzIHBvc2l0aW9uL3NpemUgZG9lcyBub3QgY2hhbmdlXHJcbiAgICAgKiBAcmV0dXJuIHsqfSBvYmplY3RcclxuICAgICAqL1xyXG4gICAgYWRkKG9iamVjdCwgc3RhdGljT2JqZWN0KVxyXG4gICAge1xyXG4gICAgICAgIG9iamVjdFt0aGlzLnNwYXRpYWxdID0geyBoYXNoZXM6IFtdIH1cclxuICAgICAgICBpZiAodGhpcy5jYWxjdWxhdGVQSVhJICYmIHRoaXMuZGlydHlUZXN0KVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgb2JqZWN0W3RoaXMuZGlydHldID0gdHJ1ZVxyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAoc3RhdGljT2JqZWN0KVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgb2JqZWN0LnN0YXRpY09iamVjdCA9IHRydWVcclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy51cGRhdGVPYmplY3Qob2JqZWN0KVxyXG4gICAgICAgIHRoaXMuY29udGFpbmVyc1swXS5wdXNoKG9iamVjdClcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIHJlbW92ZSBhbiBvYmplY3QgYWRkZWQgYnkgYWRkKClcclxuICAgICAqIEBwYXJhbSB7Kn0gb2JqZWN0XHJcbiAgICAgKiBAcmV0dXJuIHsqfSBvYmplY3RcclxuICAgICAqL1xyXG4gICAgcmVtb3ZlKG9iamVjdClcclxuICAgIHtcclxuICAgICAgICB0aGlzLmNvbnRhaW5lcnNbMF0uc3BsaWNlKHRoaXMubGlzdFswXS5pbmRleE9mKG9iamVjdCksIDEpXHJcbiAgICAgICAgdGhpcy5yZW1vdmVGcm9tSGFzaChvYmplY3QpXHJcbiAgICAgICAgcmV0dXJuIG9iamVjdFxyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogYWRkIGFuIGFycmF5IG9mIG9iamVjdHMgdG8gYmUgY3VsbGVkXHJcbiAgICAgKiBAcGFyYW0ge1BJWEkuQ29udGFpbmVyfSBjb250YWluZXJcclxuICAgICAqIEBwYXJhbSB7Ym9vbGVhbn0gW3N0YXRpY09iamVjdF0gc2V0IHRvIHRydWUgaWYgdGhlIG9iamVjdHMgaW4gdGhlIGNvbnRhaW5lcidzIHBvc2l0aW9uL3NpemUgZG8gbm90IGNoYW5nZVxyXG4gICAgICovXHJcbiAgICBhZGRDb250YWluZXIoY29udGFpbmVyLCBzdGF0aWNPYmplY3QpXHJcbiAgICB7XHJcbiAgICAgICAgY29uc3QgYWRkZWQgPSBmdW5jdGlvbihvYmplY3QpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBvYmplY3RbdGhpcy5zcGF0aWFsXSA9IHsgaGFzaGVzOiBbXSB9XHJcbiAgICAgICAgICAgIHRoaXMudXBkYXRlT2JqZWN0KG9iamVjdClcclxuICAgICAgICB9LmJpbmQodGhpcylcclxuXHJcbiAgICAgICAgY29uc3QgcmVtb3ZlZCA9IGZ1bmN0aW9uIChvYmplY3QpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aGlzLnJlbW92ZUZyb21IYXNoKG9iamVjdClcclxuICAgICAgICB9LmJpbmQodGhpcylcclxuXHJcbiAgICAgICAgZm9yIChsZXQgb2JqZWN0IG9mIGNvbnRhaW5lci5jaGlsZHJlbilcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIG9iamVjdFt0aGlzLnNwYXRpYWxdID0geyBoYXNoZXM6IFtdIH1cclxuICAgICAgICAgICAgdGhpcy51cGRhdGVPYmplY3Qob2JqZWN0KVxyXG4gICAgICAgIH1cclxuICAgICAgICBjb250YWluZXIuY3VsbCA9IHt9XHJcbiAgICAgICAgdGhpcy5jb250YWluZXJzLnB1c2goY29udGFpbmVyKVxyXG4gICAgICAgIGNvbnRhaW5lci5vbignY2hpbGRBZGRlZCcsIGFkZGVkKVxyXG4gICAgICAgIGNvbnRhaW5lci5vbignY2hpbGRSZW1vdmVkJywgcmVtb3ZlZClcclxuICAgICAgICBjb250YWluZXIuY3VsbC5hZGRlZCA9IGFkZGVkXHJcbiAgICAgICAgY29udGFpbmVyLmN1bGwucmVtb3ZlZCA9IHJlbW92ZWRcclxuICAgICAgICBpZiAoc3RhdGljT2JqZWN0KVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgY29udGFpbmVyLmN1bGwuc3RhdGljID0gdHJ1ZVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIHJlbW92ZSBhbiBhcnJheSBhZGRlZCBieSBhZGRDb250YWluZXIoKVxyXG4gICAgICogQHBhcmFtIHtQSVhJLkNvbnRhaW5lcn0gY29udGFpbmVyXHJcbiAgICAgKiBAcmV0dXJuIHtQSVhJLkNvbnRhaW5lcn0gY29udGFpbmVyXHJcbiAgICAgKi9cclxuICAgIHJlbW92ZUNvbnRhaW5lcihjb250YWluZXIpXHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy5jb250YWluZXJzLnNwbGljZSh0aGlzLmNvbnRhaW5lcnMuaW5kZXhPZihjb250YWluZXIpLCAxKVxyXG4gICAgICAgIGNvbnRhaW5lci5jaGlsZHJlbi5mb3JFYWNoKG9iamVjdCA9PiB0aGlzLnJlbW92ZUZyb21IYXNoKG9iamVjdCkpXHJcbiAgICAgICAgY29udGFpbmVyLm9mZignYWRkZWQnLCBjb250YWluZXIuY3VsbC5hZGRlZClcclxuICAgICAgICBjb250YWluZXIub2ZmKCdyZW1vdmVkJywgY29udGFpbmVyLmN1bGwucmVtb3ZlZClcclxuICAgICAgICBkZWxldGUgY29udGFpbmVyLmN1bGxcclxuICAgICAgICByZXR1cm4gY29udGFpbmVyXHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiB1cGRhdGUgdGhlIGhhc2hlcyBhbmQgY3VsbCB0aGUgaXRlbXMgaW4gdGhlIGxpc3RcclxuICAgICAqIEBwYXJhbSB7QUFCQn0gQUFCQlxyXG4gICAgICogQHBhcmFtIHtib29sZWFufSBbc2tpcFVwZGF0ZV0gc2tpcCB1cGRhdGluZyB0aGUgaGFzaGVzIG9mIGFsbCBvYmplY3RzXHJcbiAgICAgKiBAcmV0dXJuIHtudW1iZXJ9IG51bWJlciBvZiBidWNrZXRzIGluIHJlc3VsdHNcclxuICAgICAqL1xyXG4gICAgY3VsbChBQUJCLCBza2lwVXBkYXRlKVxyXG4gICAge1xyXG4gICAgICAgIGlmICghc2tpcFVwZGF0ZSlcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRoaXMudXBkYXRlT2JqZWN0cygpXHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMuaW52aXNpYmxlKClcclxuICAgICAgICBjb25zdCBvYmplY3RzID0gdGhpcy5xdWVyeShBQUJCLCB0aGlzLnNpbXBsZVRlc3QpXHJcbiAgICAgICAgb2JqZWN0cy5mb3JFYWNoKG9iamVjdCA9PiBvYmplY3RbdGhpcy52aXNpYmxlXSA9IHRydWUpXHJcbiAgICAgICAgcmV0dXJuIHRoaXMubGFzdEJ1Y2tldHNcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIHNldCBhbGwgb2JqZWN0cyBpbiBoYXNoIHRvIHZpc2libGU9ZmFsc2VcclxuICAgICAqL1xyXG4gICAgaW52aXNpYmxlKClcclxuICAgIHtcclxuICAgICAgICBmb3IgKGxldCBjb250YWluZXIgb2YgdGhpcy5jb250YWluZXJzKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgY29udGFpbmVyLmNoaWxkcmVuLmZvckVhY2gob2JqZWN0ID0+IG9iamVjdFt0aGlzLnZpc2libGVdID0gZmFsc2UpXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogdXBkYXRlIHRoZSBoYXNoZXMgZm9yIGFsbCBvYmplY3RzXHJcbiAgICAgKiBhdXRvbWF0aWNhbGx5IGNhbGxlZCBmcm9tIHVwZGF0ZSgpIHdoZW4gc2tpcFVwZGF0ZT1mYWxzZVxyXG4gICAgICovXHJcbiAgICB1cGRhdGVPYmplY3RzKClcclxuICAgIHtcclxuICAgICAgICBpZiAodGhpcy5kaXJ0eVRlc3QpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBmb3IgKGxldCBvYmplY3Qgb2YgdGhpcy5vYmplY3RzKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBpZiAob2JqZWN0W3RoaXMuZGlydHldKVxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMudXBkYXRlT2JqZWN0KG9iamVjdClcclxuICAgICAgICAgICAgICAgICAgICBvYmplY3RbdGhpcy5kaXJ0eV0gPSBmYWxzZVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGZvciAobGV0IGNvbnRhaW5lciBvZiB0aGlzLmNvbnRhaW5lcnMpXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGZvciAobGV0IG9iamVjdCBvZiBjb250YWluZXIuY2hpbGRyZW4pXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKG9iamVjdFt0aGlzLmRpcnR5XSlcclxuICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMudXBkYXRlT2JqZWN0KG9iamVjdClcclxuICAgICAgICAgICAgICAgICAgICAgICAgb2JqZWN0W3RoaXMuZGlydHldID0gZmFsc2VcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgZm9yIChsZXQgY29udGFpbmVyIG9mIHRoaXMuY29udGFpbmVycylcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgaWYgKCFjb250YWluZXIuY3VsbC5zdGF0aWMpXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29udGFpbmVyLmNoaWxkcmVuLmZvckVhY2gob2JqZWN0ID0+IHRoaXMudXBkYXRlT2JqZWN0KG9iamVjdCkpXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiB1cGRhdGUgdGhlIGhhcyBvZiBhbiBvYmplY3RcclxuICAgICAqIGF1dG9tYXRpY2FsbHkgY2FsbGVkIGZyb20gdXBkYXRlT2JqZWN0cygpXHJcbiAgICAgKiBAcGFyYW0geyp9IG9iamVjdFxyXG4gICAgICogQHBhcmFtIHtib29sZWFufSBbZm9yY2VdIGZvcmNlIHVwZGF0ZSBmb3IgY2FsY3VsYXRlUElYSVxyXG4gICAgICovXHJcbiAgICB1cGRhdGVPYmplY3Qob2JqZWN0KVxyXG4gICAge1xyXG4gICAgICAgIGxldCBBQUJCXHJcbiAgICAgICAgaWYgKHRoaXMuY2FsY3VsYXRlUElYSSlcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGNvbnN0IGJveCA9IG9iamVjdC5nZXRMb2NhbEJvdW5kcygpXHJcbiAgICAgICAgICAgIEFBQkIgPSBvYmplY3RbdGhpcy5BQUJCXSA9IHtcclxuICAgICAgICAgICAgICAgIHg6IG9iamVjdC54ICsgYm94LnggKiBvYmplY3Quc2NhbGUueCxcclxuICAgICAgICAgICAgICAgIHk6IG9iamVjdC55ICsgYm94LnkgKiBvYmplY3Quc2NhbGUueSxcclxuICAgICAgICAgICAgICAgIHdpZHRoOiBib3gud2lkdGggKiBvYmplY3Quc2NhbGUueCxcclxuICAgICAgICAgICAgICAgIGhlaWdodDogYm94LmhlaWdodCAqIG9iamVjdC5zY2FsZS55XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgQUFCQiA9IG9iamVjdFt0aGlzLkFBQkJdXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBsZXQgc3BhdGlhbCA9IG9iamVjdFt0aGlzLnNwYXRpYWxdXHJcbiAgICAgICAgaWYgKCFzcGF0aWFsKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgc3BhdGlhbCA9IG9iamVjdFt0aGlzLnNwYXRpYWxdID0geyBoYXNoZXM6IFtdIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgY29uc3QgeyB4U3RhcnQsIHlTdGFydCwgeEVuZCwgeUVuZCB9ID0gdGhpcy5nZXRCb3VuZHMoQUFCQilcclxuXHJcbiAgICAgICAgLy8gb25seSByZW1vdmUgYW5kIGluc2VydCBpZiBtYXBwaW5nIGhhcyBjaGFuZ2VkXHJcbiAgICAgICAgaWYgKHNwYXRpYWwueFN0YXJ0ICE9PSB4U3RhcnQgfHwgc3BhdGlhbC55U3RhcnQgIT09IHlTdGFydCB8fCBzcGF0aWFsLnhFbmQgIT09IHhFbmQgfHwgc3BhdGlhbC55RW5kICE9PSB5RW5kKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgaWYgKHNwYXRpYWwuaGFzaGVzLmxlbmd0aClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5yZW1vdmVGcm9tSGFzaChvYmplY3QpXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZm9yIChsZXQgeSA9IHlTdGFydDsgeSA8PSB5RW5kOyB5KyspXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGZvciAobGV0IHggPSB4U3RhcnQ7IHggPD0geEVuZDsgeCsrKVxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGtleSA9IHggKyAnLCcgKyB5XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5pbnNlcnQob2JqZWN0LCBrZXkpXHJcbiAgICAgICAgICAgICAgICAgICAgc3BhdGlhbC5oYXNoZXMucHVzaChrZXkpXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgc3BhdGlhbC54U3RhcnQgPSB4U3RhcnRcclxuICAgICAgICAgICAgc3BhdGlhbC55U3RhcnQgPSB5U3RhcnRcclxuICAgICAgICAgICAgc3BhdGlhbC54RW5kID0geEVuZFxyXG4gICAgICAgICAgICBzcGF0aWFsLnlFbmQgPSB5RW5kXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogcmV0dXJucyBhbiBhcnJheSBvZiBidWNrZXRzIHdpdGggPj0gbWluaW11bSBvZiBvYmplY3RzIGluIGVhY2ggYnVja2V0XHJcbiAgICAgKiBAcGFyYW0ge251bWJlcn0gW21pbmltdW09MV1cclxuICAgICAqIEByZXR1cm4ge2FycmF5fSBhcnJheSBvZiBidWNrZXRzXHJcbiAgICAgKi9cclxuICAgIGdldEJ1Y2tldHMobWluaW11bT0xKVxyXG4gICAge1xyXG4gICAgICAgIGNvbnN0IGhhc2hlcyA9IFtdXHJcbiAgICAgICAgZm9yIChsZXQga2V5IGluIHRoaXMuaGFzaClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGNvbnN0IGhhc2ggPSB0aGlzLmhhc2hba2V5XVxyXG4gICAgICAgICAgICBpZiAoaGFzaC5sZW5ndGggPj0gbWluaW11bSlcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgaGFzaGVzLnB1c2goaGFzaClcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gaGFzaGVzXHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBnZXRzIGhhc2ggYm91bmRzXHJcbiAgICAgKiBAcGFyYW0ge0FBQkJ9IEFBQkJcclxuICAgICAqIEByZXR1cm4ge0JvdW5kc31cclxuICAgICAqIEBwcml2YXRlXHJcbiAgICAgKi9cclxuICAgIGdldEJvdW5kcyhBQUJCKVxyXG4gICAge1xyXG4gICAgICAgIGxldCB4U3RhcnQgPSBNYXRoLmZsb29yKEFBQkIueCAvIHRoaXMueFNpemUpXHJcbiAgICAgICAgbGV0IHlTdGFydCA9IE1hdGguZmxvb3IoQUFCQi55IC8gdGhpcy55U2l6ZSlcclxuICAgICAgICBsZXQgeEVuZCA9IE1hdGguZmxvb3IoKEFBQkIueCArIEFBQkIud2lkdGgpIC8gdGhpcy54U2l6ZSlcclxuICAgICAgICBsZXQgeUVuZCA9IE1hdGguZmxvb3IoKEFBQkIueSArIEFBQkIuaGVpZ2h0KSAvIHRoaXMueVNpemUpXHJcbiAgICAgICAgcmV0dXJuIHsgeFN0YXJ0LCB5U3RhcnQsIHhFbmQsIHlFbmQgfVxyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogaW5zZXJ0IG9iamVjdCBpbnRvIHRoZSBzcGF0aWFsIGhhc2hcclxuICAgICAqIGF1dG9tYXRpY2FsbHkgY2FsbGVkIGZyb20gdXBkYXRlT2JqZWN0KClcclxuICAgICAqIEBwYXJhbSB7Kn0gb2JqZWN0XHJcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30ga2V5XHJcbiAgICAgKi9cclxuICAgIGluc2VydChvYmplY3QsIGtleSlcclxuICAgIHtcclxuICAgICAgICBpZiAoIXRoaXMuaGFzaFtrZXldKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhpcy5oYXNoW2tleV0gPSBbb2JqZWN0XVxyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aGlzLmhhc2hba2V5XS5wdXNoKG9iamVjdClcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiByZW1vdmVzIG9iamVjdCBmcm9tIHRoZSBoYXNoIHRhYmxlXHJcbiAgICAgKiBzaG91bGQgYmUgY2FsbGVkIHdoZW4gcmVtb3ZpbmcgYW4gb2JqZWN0XHJcbiAgICAgKiBhdXRvbWF0aWNhbGx5IGNhbGxlZCBmcm9tIHVwZGF0ZU9iamVjdCgpXHJcbiAgICAgKiBAcGFyYW0ge29iamVjdH0gb2JqZWN0XHJcbiAgICAgKi9cclxuICAgIHJlbW92ZUZyb21IYXNoKG9iamVjdClcclxuICAgIHtcclxuICAgICAgICBjb25zdCBzcGF0aWFsID0gb2JqZWN0W3RoaXMuc3BhdGlhbF1cclxuICAgICAgICB3aGlsZSAoc3BhdGlhbC5oYXNoZXMubGVuZ3RoKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgY29uc3Qga2V5ID0gc3BhdGlhbC5oYXNoZXMucG9wKClcclxuICAgICAgICAgICAgY29uc3QgbGlzdCA9IHRoaXMuaGFzaFtrZXldXHJcbiAgICAgICAgICAgIGxpc3Quc3BsaWNlKGxpc3QuaW5kZXhPZihvYmplY3QpLCAxKVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIGdldCBhbGwgbmVpZ2hib3JzIHRoYXQgc2hhcmUgdGhlIHNhbWUgaGFzaCBhcyBvYmplY3RcclxuICAgICAqIEBwYXJhbSB7Kn0gb2JqZWN0IGluIHRoZSBzcGF0aWFsIGhhc2hcclxuICAgICAqIEByZXR1cm4ge0FycmF5fSBvZiBvYmplY3RzIHRoYXQgYXJlIGluIHRoZSBzYW1lIGhhc2ggYXMgb2JqZWN0XHJcbiAgICAgKi9cclxuICAgIG5laWdoYm9ycyhvYmplY3QpXHJcbiAgICB7XHJcbiAgICAgICAgbGV0IHJlc3VsdHMgPSBbXVxyXG4gICAgICAgIG9iamVjdFt0aGlzLnNwYXRpYWxdLmhhc2hlcy5mb3JFYWNoKGtleSA9PiByZXN1bHRzID0gcmVzdWx0cy5jb25jYXQodGhpcy5oYXNoW2tleV0pKVxyXG4gICAgICAgIHJldHVybiByZXN1bHRzXHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiByZXR1cm5zIGFuIGFycmF5IG9mIG9iamVjdHMgY29udGFpbmVkIHdpdGhpbiBib3VuZGluZyBib3hcclxuICAgICAqIEBwYXJhbSB7QUFCQn0gQUFCQiBib3VuZGluZyBib3ggdG8gc2VhcmNoXHJcbiAgICAgKiBAcGFyYW0ge2Jvb2xlYW59IFtzaW1wbGVUZXN0PXRydWVdIHBlcmZvcm0gYSBzaW1wbGUgYm91bmRzIGNoZWNrIG9mIGFsbCBpdGVtcyBpbiB0aGUgYnVja2V0c1xyXG4gICAgICogQHJldHVybiB7b2JqZWN0W119IHNlYXJjaCByZXN1bHRzXHJcbiAgICAgKi9cclxuICAgIHF1ZXJ5KEFBQkIsIHNpbXBsZVRlc3QpXHJcbiAgICB7XHJcbiAgICAgICAgc2ltcGxlVGVzdCA9IHR5cGVvZiBzaW1wbGVUZXN0ICE9PSAndW5kZWZpbmVkJyA/IHNpbXBsZVRlc3QgOiB0cnVlXHJcbiAgICAgICAgbGV0IGJ1Y2tldHMgPSAwXHJcbiAgICAgICAgbGV0IHJlc3VsdHMgPSBbXVxyXG4gICAgICAgIGNvbnN0IHsgeFN0YXJ0LCB5U3RhcnQsIHhFbmQsIHlFbmQgfSA9IHRoaXMuZ2V0Qm91bmRzKEFBQkIpXHJcbiAgICAgICAgZm9yIChsZXQgeSA9IHlTdGFydDsgeSA8PSB5RW5kOyB5KyspXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBmb3IgKGxldCB4ID0geFN0YXJ0OyB4IDw9IHhFbmQ7IHgrKylcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgY29uc3QgZW50cnkgPSB0aGlzLmhhc2hbeCArICcsJyArIHldXHJcbiAgICAgICAgICAgICAgICBpZiAoZW50cnkpXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHNpbXBsZVRlc3QpXHJcbiAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBmb3IgKGxldCBvYmplY3Qgb2YgZW50cnkpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGJveCA9IG9iamVjdFt0aGlzLkFBQkJdXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoYm94LnggKyBib3gud2lkdGggPiBBQUJCLnggJiYgYm94LnggPCBBQUJCLnggKyBBQUJCLndpZHRoICYmXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBib3gueSArIGJveC5oZWlnaHQgPiBBQUJCLnkgJiYgYm94LnkgPCBBQUJCLnkgKyBBQUJCLmhlaWdodClcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXN1bHRzLnB1c2gob2JqZWN0KVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdHMgPSByZXN1bHRzLmNvbmNhdChlbnRyeSlcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgYnVja2V0cysrXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy5sYXN0QnVja2V0cyA9IGJ1Y2tldHNcclxuICAgICAgICByZXR1cm4gcmVzdWx0c1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogaXRlcmF0ZXMgdGhyb3VnaCBvYmplY3RzIGNvbnRhaW5lZCB3aXRoaW4gYm91bmRpbmcgYm94XHJcbiAgICAgKiBzdG9wcyBpdGVyYXRpbmcgaWYgdGhlIGNhbGxiYWNrIHJldHVybnMgdHJ1ZVxyXG4gICAgICogQHBhcmFtIHtBQUJCfSBBQUJCIGJvdW5kaW5nIGJveCB0byBzZWFyY2hcclxuICAgICAqIEBwYXJhbSB7ZnVuY3Rpb259IGNhbGxiYWNrXHJcbiAgICAgKiBAcGFyYW0ge2Jvb2xlYW59IFtzaW1wbGVUZXN0PXRydWVdIHBlcmZvcm0gYSBzaW1wbGUgYm91bmRzIGNoZWNrIG9mIGFsbCBpdGVtcyBpbiB0aGUgYnVja2V0c1xyXG4gICAgICogQHJldHVybiB7Ym9vbGVhbn0gdHJ1ZSBpZiBjYWxsYmFjayByZXR1cm5lZCBlYXJseVxyXG4gICAgICovXHJcbiAgICBxdWVyeUNhbGxiYWNrKEFBQkIsIGNhbGxiYWNrLCBzaW1wbGVUZXN0KVxyXG4gICAge1xyXG4gICAgICAgIHNpbXBsZVRlc3QgPSB0eXBlb2Ygc2ltcGxlVGVzdCAhPT0gJ3VuZGVmaW5lZCcgPyBzaW1wbGVUZXN0IDogdHJ1ZVxyXG4gICAgICAgIGNvbnN0IHsgeFN0YXJ0LCB5U3RhcnQsIHhFbmQsIHlFbmQgfSA9IHRoaXMuZ2V0Qm91bmRzKEFBQkIpXHJcbiAgICAgICAgZm9yIChsZXQgeSA9IHlTdGFydDsgeSA8PSB5RW5kOyB5KyspXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBmb3IgKGxldCB4ID0geFN0YXJ0OyB4IDw9IHhFbmQ7IHgrKylcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgY29uc3QgZW50cnkgPSB0aGlzLmhhc2hbeCArICcsJyArIHldXHJcbiAgICAgICAgICAgICAgICBpZiAoZW50cnkpXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBlbnRyeS5sZW5ndGg7IGkrKylcclxuICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IG9iamVjdCA9IGVudHJ5W2ldXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChzaW1wbGVUZXN0KVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBBQUJCID0gb2JqZWN0LkFBQkJcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChBQUJCLnggKyBBQUJCLndpZHRoID4gQUFCQi54ICYmIEFBQkIueCA8IEFBQkIueCArIEFBQkIud2lkdGggJiZcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIEFBQkIueSArIEFBQkIuaGVpZ2h0ID4gQUFCQi55ICYmIEFBQkIueSA8IEFBQkIueSArIEFBQkIuaGVpZ2h0KVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChjYWxsYmFjayhvYmplY3QpKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWVcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoY2FsbGJhY2sob2JqZWN0KSlcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBmYWxzZVxyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogZ2V0IHN0YXRzXHJcbiAgICAgKiBAcmV0dXJuIHtTdGF0c31cclxuICAgICAqL1xyXG4gICAgc3RhdHMoKVxyXG4gICAge1xyXG4gICAgICAgIGxldCB2aXNpYmxlID0gMCwgY291bnQgPSAwXHJcbiAgICAgICAgZm9yIChsZXQgbGlzdCBvZiB0aGlzLmNvbnRhaW5lcnMpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBsaXN0LmZvckVhY2gob2JqZWN0ID0+XHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHZpc2libGUgKz0gb2JqZWN0LnZpc2libGUgPyAxIDogMFxyXG4gICAgICAgICAgICAgICAgY291bnQrK1xyXG4gICAgICAgICAgICB9KVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgdG90YWw6IGNvdW50LFxyXG4gICAgICAgICAgICB2aXNpYmxlLFxyXG4gICAgICAgICAgICBjdWxsZWQ6IGNvdW50IC0gdmlzaWJsZVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIGhlbHBlciBmdW5jdGlvbiB0byBldmFsdWF0ZSBoYXNoIHRhYmxlXHJcbiAgICAgKiBAcmV0dXJuIHtudW1iZXJ9IHRoZSBudW1iZXIgb2YgYnVja2V0cyBpbiB0aGUgaGFzaCB0YWJsZVxyXG4gICAgICogKi9cclxuICAgIGdldE51bWJlck9mQnVja2V0cygpXHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuIE9iamVjdC5rZXlzKHRoaXMuaGFzaCkubGVuZ3RoXHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBoZWxwZXIgZnVuY3Rpb24gdG8gZXZhbHVhdGUgaGFzaCB0YWJsZVxyXG4gICAgICogQHJldHVybiB7bnVtYmVyfSB0aGUgYXZlcmFnZSBudW1iZXIgb2YgZW50cmllcyBpbiBlYWNoIGJ1Y2tldFxyXG4gICAgICovXHJcbiAgICBnZXRBdmVyYWdlU2l6ZSgpXHJcbiAgICB7XHJcbiAgICAgICAgbGV0IHRvdGFsID0gMFxyXG4gICAgICAgIGZvciAobGV0IGtleSBpbiB0aGlzLmhhc2gpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0b3RhbCArPSB0aGlzLmhhc2hba2V5XS5sZW5ndGhcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHRvdGFsIC8gdGhpcy5nZXRCdWNrZXRzKClcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIGhlbHBlciBmdW5jdGlvbiB0byBldmFsdWF0ZSB0aGUgaGFzaCB0YWJsZVxyXG4gICAgICogQHJldHVybiB7bnVtYmVyfSB0aGUgbGFyZ2VzdCBzaXplZCBidWNrZXRcclxuICAgICAqL1xyXG4gICAgZ2V0TGFyZ2VzdCgpXHJcbiAgICB7XHJcbiAgICAgICAgbGV0IGxhcmdlc3QgPSAwXHJcbiAgICAgICAgZm9yIChsZXQga2V5IGluIHRoaXMuaGFzaClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGlmICh0aGlzLmhhc2hba2V5XS5sZW5ndGggPiBsYXJnZXN0KVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBsYXJnZXN0ID0gdGhpcy5oYXNoW2tleV0ubGVuZ3RoXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIGxhcmdlc3RcclxuICAgIH1cclxuXHJcbiAgICAvKiogaGVscGVyIGZ1bmN0aW9uIHRvIGV2YWx1dGUgdGhlIGhhc2ggdGFibGVcclxuICAgICAqIEBwYXJhbSB7QUFCQn0gQUFCQiBib3VuZGluZyBib3ggdG8gc2VhcmNoXHJcbiAgICAgKiBAcmV0dXJuIHtudW1iZXJ9IHNwYXJzZW5lc3MgcGVyY2VudGFnZSAoaS5lLiwgYnVja2V0cyB3aXRoIGF0IGxlYXN0IDEgZWxlbWVudCBkaXZpZGVkIGJ5IHRvdGFsIHBvc3NpYmxlIGJ1Y2tldHMpXHJcbiAgICAgKi9cclxuICAgIGdldFNwYXJzZW5lc3MoQUFCQilcclxuICAgIHtcclxuICAgICAgICBsZXQgY291bnQgPSAwLCB0b3RhbCA9IDBcclxuICAgICAgICBjb25zdCB7IHhTdGFydCwgeVN0YXJ0LCB4RW5kLCB5RW5kIH0gPSB0aGlzLmdldEJvdW5kcyhBQUJCKVxyXG4gICAgICAgIGZvciAobGV0IHkgPSB5U3RhcnQ7IHkgPCB5RW5kOyB5KyspXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBmb3IgKGxldCB4ID0geFN0YXJ0OyB4IDwgeEVuZDsgeCsrKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBjb3VudCArPSAodGhpcy5oYXNoW3ggKyAnLCcgKyB5XSA/IDEgOiAwKVxyXG4gICAgICAgICAgICAgICAgdG90YWwrK1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBjb3VudCAvIHRvdGFsXHJcbiAgICB9XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBAdHlwZWRlZiB7b2JqZWN0fSBTdGF0c1xyXG4gKiBAcHJvcGVydHkge251bWJlcn0gdG90YWxcclxuICogQHByb3BlcnR5IHtudW1iZXJ9IHZpc2libGVcclxuICogQHByb3BlcnR5IHtudW1iZXJ9IGN1bGxlZFxyXG4gKi9cclxuXHJcbi8qKlxyXG4gKiBAdHlwZWRlZiB7b2JqZWN0fSBCb3VuZHNcclxuICogQHByb3BlcnR5IHtudW1iZXJ9IHhTdGFydFxyXG4gKiBAcHJvcGVydHkge251bWJlcn0geVN0YXJ0XHJcbiAqIEBwcm9wZXJ0eSB7bnVtYmVyfSB4RW5kXHJcbiAqIEBwcm9wZXJ0eSB7bnVtYmVyfSB4RW5kXHJcbiAqL1xyXG5cclxuLyoqXHJcbiAgKiBAdHlwZWRlZiB7b2JqZWN0fSBBQUJCXHJcbiAgKiBAcHJvcGVydHkge251bWJlcn0geFxyXG4gICogQHByb3BlcnR5IHtudW1iZXJ9IHlcclxuICAqIEBwcm9wZXJ0eSB7bnVtYmVyfSB3aWR0aFxyXG4gICogQHByb3BlcnR5IHtudW1iZXJ9IGhlaWdodFxyXG4gICovXHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFNwYXRpYWxIYXNoIl19