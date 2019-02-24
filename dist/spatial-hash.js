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
        this.lists = [[]];
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
            this.lists[0].push(object);
        }

        /**
         * remove an object added by add()
         * @param {*} object
         * @return {*} object
         */

    }, {
        key: 'remove',
        value: function remove(object) {
            this.lists[0].splice(this.list[0].indexOf(object), 1);
            this.removeFromHash(object);
            return object;
        }

        /**
         * add an array of objects to be culled
         * @param {Array} array
         * @param {boolean} [staticObject] set to true if the objects in the list position/size does not change
         * @return {Array} array
         */

    }, {
        key: 'addList',
        value: function addList(list, staticObject) {
            var _iteratorNormalCompletion = true;
            var _didIteratorError = false;
            var _iteratorError = undefined;

            try {
                for (var _iterator = list[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                    var object = _step.value;

                    object[this.spatial] = { hashes: [] };
                    if (this.calculatePIXI && this.dirtyTest) {
                        object[this.dirty] = true;
                    }
                    if (staticObject) {
                        list.staticObject = true;
                    }
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

            this.lists.push(list);
        }

        /**
         * remove an array added by addList()
         * @param {Array} array
         * @return {Array} array
         */

    }, {
        key: 'removeList',
        value: function removeList(array) {
            var _this = this;

            this.lists.splice(this.lists.indexOf(array), 1);
            array.forEach(function (object) {
                return _this.removeFromHash(object);
            });
            return array;
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
                for (var _iterator2 = this.lists[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
                    var list = _step2.value;

                    list.forEach(function (object) {
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
                    for (var _iterator3 = this.lists[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
                        var list = _step3.value;
                        var _iteratorNormalCompletion4 = true;
                        var _didIteratorError4 = false;
                        var _iteratorError4 = undefined;

                        try {
                            for (var _iterator4 = list[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
                                var object = _step4.value;

                                if (object[this.dirty]) {
                                    this.updateObject(object);
                                    object[this.dirty] = false;
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
            } else {
                var _iteratorNormalCompletion5 = true;
                var _didIteratorError5 = false;
                var _iteratorError5 = undefined;

                try {
                    for (var _iterator5 = this.lists[Symbol.iterator](), _step5; !(_iteratorNormalCompletion5 = (_step5 = _iterator5.next()).done); _iteratorNormalCompletion5 = true) {
                        var _list = _step5.value;

                        _list.forEach(function (object) {
                            return _this4.updateObject(object);
                        });
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
                            var _iteratorNormalCompletion6 = true;
                            var _didIteratorError6 = false;
                            var _iteratorError6 = undefined;

                            try {
                                for (var _iterator6 = entry[Symbol.iterator](), _step6; !(_iteratorNormalCompletion6 = (_step6 = _iterator6.next()).done); _iteratorNormalCompletion6 = true) {
                                    var object = _step6.value;

                                    var box = object[this.AABB];
                                    if (box.x + box.width > AABB.x && box.x < AABB.x + AABB.width && box.y + box.height > AABB.y && box.y < AABB.y + AABB.height) {
                                        results.push(object);
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
            var _iteratorNormalCompletion7 = true;
            var _didIteratorError7 = false;
            var _iteratorError7 = undefined;

            try {
                for (var _iterator7 = this.lists[Symbol.iterator](), _step7; !(_iteratorNormalCompletion7 = (_step7 = _iterator7.next()).done); _iteratorNormalCompletion7 = true) {
                    var list = _step7.value;

                    list.forEach(function (object) {
                        visible += object.visible ? 1 : 0;
                        count++;
                    });
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL2NvZGUvc3BhdGlhbC1oYXNoLmpzIl0sIm5hbWVzIjpbIlNwYXRpYWxIYXNoIiwib3B0aW9ucyIsInhTaXplIiwic2l6ZSIsInlTaXplIiwiQUFCQiIsInR5cGUiLCJzcGF0aWFsIiwiY2FsY3VsYXRlUElYSSIsInZpc2libGVUZXh0IiwidmlzaWJsZVRlc3QiLCJzaW1wbGVUZXN0IiwiZGlydHlUZXN0IiwidmlzaWJsZSIsImRpcnR5Iiwid2lkdGgiLCJoZWlnaHQiLCJoYXNoIiwibGlzdHMiLCJvYmplY3QiLCJzdGF0aWNPYmplY3QiLCJoYXNoZXMiLCJ1cGRhdGVPYmplY3QiLCJwdXNoIiwic3BsaWNlIiwibGlzdCIsImluZGV4T2YiLCJyZW1vdmVGcm9tSGFzaCIsImFycmF5IiwiZm9yRWFjaCIsInNraXBVcGRhdGUiLCJ1cGRhdGVPYmplY3RzIiwiaW52aXNpYmxlIiwib2JqZWN0cyIsInF1ZXJ5IiwibGFzdEJ1Y2tldHMiLCJib3giLCJnZXRMb2NhbEJvdW5kcyIsIngiLCJzY2FsZSIsInkiLCJnZXRCb3VuZHMiLCJ4U3RhcnQiLCJ5U3RhcnQiLCJ4RW5kIiwieUVuZCIsImxlbmd0aCIsImtleSIsImluc2VydCIsIm1pbmltdW0iLCJNYXRoIiwiZmxvb3IiLCJwb3AiLCJyZXN1bHRzIiwiY29uY2F0IiwiYnVja2V0cyIsImVudHJ5IiwiY2FsbGJhY2siLCJpIiwiY291bnQiLCJ0b3RhbCIsImN1bGxlZCIsIk9iamVjdCIsImtleXMiLCJnZXRCdWNrZXRzIiwibGFyZ2VzdCIsIm1vZHVsZSIsImV4cG9ydHMiXSwibWFwcGluZ3MiOiI7Ozs7OztBQUFBO0FBQ0E7QUFDQTs7SUFFTUEsVztBQUVGOzs7Ozs7Ozs7Ozs7OztBQWNBLHlCQUFZQyxPQUFaLEVBQ0E7QUFBQTs7QUFDSUEsa0JBQVVBLFdBQVcsRUFBckI7QUFDQSxhQUFLQyxLQUFMLEdBQWFELFFBQVFDLEtBQVIsSUFBaUJELFFBQVFFLElBQXpCLElBQWlDLElBQTlDO0FBQ0EsYUFBS0MsS0FBTCxHQUFhSCxRQUFRRyxLQUFSLElBQWlCSCxRQUFRRSxJQUF6QixJQUFpQyxJQUE5QztBQUNBLGFBQUtFLElBQUwsR0FBWUosUUFBUUssSUFBUixJQUFnQixNQUE1QjtBQUNBLGFBQUtDLE9BQUwsR0FBZU4sUUFBUU0sT0FBUixJQUFtQixTQUFsQztBQUNBLGFBQUtDLGFBQUwsR0FBcUIsT0FBT1AsUUFBUU8sYUFBZixLQUFpQyxXQUFqQyxHQUErQ1AsUUFBUU8sYUFBdkQsR0FBdUUsSUFBNUY7QUFDQSxhQUFLQyxXQUFMLEdBQW1CLE9BQU9SLFFBQVFTLFdBQWYsS0FBK0IsV0FBL0IsR0FBNkNULFFBQVFTLFdBQXJELEdBQW1FLElBQXRGO0FBQ0EsYUFBS0MsVUFBTCxHQUFrQixPQUFPVixRQUFRVSxVQUFmLEtBQThCLFdBQTlCLEdBQTRDVixRQUFRVSxVQUFwRCxHQUFpRSxJQUFuRjtBQUNBLGFBQUtDLFNBQUwsR0FBaUIsT0FBT1gsUUFBUVcsU0FBZixLQUE2QixXQUE3QixHQUEyQ1gsUUFBUVcsU0FBbkQsR0FBK0QsSUFBaEY7QUFDQSxhQUFLQyxPQUFMLEdBQWVaLFFBQVFZLE9BQVIsSUFBbUIsU0FBbEM7QUFDQSxhQUFLQyxLQUFMLEdBQWFiLFFBQVFhLEtBQVIsSUFBaUIsT0FBOUI7QUFDQSxhQUFLQyxLQUFMLEdBQWEsS0FBS0MsTUFBTCxHQUFjLENBQTNCO0FBQ0EsYUFBS0MsSUFBTCxHQUFZLEVBQVo7QUFDQSxhQUFLQyxLQUFMLEdBQWEsQ0FBQyxFQUFELENBQWI7QUFDSDs7QUFFRDs7Ozs7Ozs7Ozs7NEJBT0lDLE0sRUFBUUMsWSxFQUNaO0FBQ0lELG1CQUFPLEtBQUtaLE9BQVosSUFBdUIsRUFBRWMsUUFBUSxFQUFWLEVBQXZCO0FBQ0EsZ0JBQUksS0FBS2IsYUFBTCxJQUFzQixLQUFLSSxTQUEvQixFQUNBO0FBQ0lPLHVCQUFPLEtBQUtMLEtBQVosSUFBcUIsSUFBckI7QUFDSDtBQUNELGdCQUFJTSxZQUFKLEVBQ0E7QUFDSUQsdUJBQU9DLFlBQVAsR0FBc0IsSUFBdEI7QUFDSDtBQUNELGlCQUFLRSxZQUFMLENBQWtCSCxNQUFsQjtBQUNBLGlCQUFLRCxLQUFMLENBQVcsQ0FBWCxFQUFjSyxJQUFkLENBQW1CSixNQUFuQjtBQUNIOztBQUVEOzs7Ozs7OzsrQkFLT0EsTSxFQUNQO0FBQ0ksaUJBQUtELEtBQUwsQ0FBVyxDQUFYLEVBQWNNLE1BQWQsQ0FBcUIsS0FBS0MsSUFBTCxDQUFVLENBQVYsRUFBYUMsT0FBYixDQUFxQlAsTUFBckIsQ0FBckIsRUFBbUQsQ0FBbkQ7QUFDQSxpQkFBS1EsY0FBTCxDQUFvQlIsTUFBcEI7QUFDQSxtQkFBT0EsTUFBUDtBQUNIOztBQUVEOzs7Ozs7Ozs7Z0NBTVFNLEksRUFBTUwsWSxFQUNkO0FBQUE7QUFBQTtBQUFBOztBQUFBO0FBQ0kscUNBQW1CSyxJQUFuQiw4SEFDQTtBQUFBLHdCQURTTixNQUNUOztBQUNJQSwyQkFBTyxLQUFLWixPQUFaLElBQXVCLEVBQUVjLFFBQVEsRUFBVixFQUF2QjtBQUNBLHdCQUFJLEtBQUtiLGFBQUwsSUFBc0IsS0FBS0ksU0FBL0IsRUFDQTtBQUNJTywrQkFBTyxLQUFLTCxLQUFaLElBQXFCLElBQXJCO0FBQ0g7QUFDRCx3QkFBSU0sWUFBSixFQUNBO0FBQ0lLLDZCQUFLTCxZQUFMLEdBQW9CLElBQXBCO0FBQ0g7QUFDRCx5QkFBS0UsWUFBTCxDQUFrQkgsTUFBbEI7QUFDSDtBQWJMO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7O0FBY0ksaUJBQUtELEtBQUwsQ0FBV0ssSUFBWCxDQUFnQkUsSUFBaEI7QUFDSDs7QUFFRDs7Ozs7Ozs7bUNBS1dHLEssRUFDWDtBQUFBOztBQUNJLGlCQUFLVixLQUFMLENBQVdNLE1BQVgsQ0FBa0IsS0FBS04sS0FBTCxDQUFXUSxPQUFYLENBQW1CRSxLQUFuQixDQUFsQixFQUE2QyxDQUE3QztBQUNBQSxrQkFBTUMsT0FBTixDQUFjO0FBQUEsdUJBQVUsTUFBS0YsY0FBTCxDQUFvQlIsTUFBcEIsQ0FBVjtBQUFBLGFBQWQ7QUFDQSxtQkFBT1MsS0FBUDtBQUNIOztBQUVEOzs7Ozs7Ozs7NkJBTUt2QixJLEVBQU15QixVLEVBQ1g7QUFBQTs7QUFDSSxnQkFBSSxDQUFDQSxVQUFMLEVBQ0E7QUFDSSxxQkFBS0MsYUFBTDtBQUNIO0FBQ0QsaUJBQUtDLFNBQUw7QUFDQSxnQkFBTUMsVUFBVSxLQUFLQyxLQUFMLENBQVc3QixJQUFYLEVBQWlCLEtBQUtNLFVBQXRCLENBQWhCO0FBQ0FzQixvQkFBUUosT0FBUixDQUFnQjtBQUFBLHVCQUFVVixPQUFPLE9BQUtOLE9BQVosSUFBdUIsSUFBakM7QUFBQSxhQUFoQjtBQUNBLG1CQUFPLEtBQUtzQixXQUFaO0FBQ0g7O0FBRUQ7Ozs7OztvQ0FJQTtBQUFBOztBQUFBO0FBQUE7QUFBQTs7QUFBQTtBQUNJLHNDQUFpQixLQUFLakIsS0FBdEIsbUlBQ0E7QUFBQSx3QkFEU08sSUFDVDs7QUFDSUEseUJBQUtJLE9BQUwsQ0FBYTtBQUFBLCtCQUFVVixPQUFPLE9BQUtOLE9BQVosSUFBdUIsS0FBakM7QUFBQSxxQkFBYjtBQUNIO0FBSkw7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUtDOztBQUVEOzs7Ozs7O3dDQUtBO0FBQUE7O0FBQ0ksZ0JBQUksS0FBS0QsU0FBVCxFQUNBO0FBQUE7QUFBQTtBQUFBOztBQUFBO0FBQ0ksMENBQWlCLEtBQUtNLEtBQXRCLG1JQUNBO0FBQUEsNEJBRFNPLElBQ1Q7QUFBQTtBQUFBO0FBQUE7O0FBQUE7QUFDSSxrREFBbUJBLElBQW5CLG1JQUNBO0FBQUEsb0NBRFNOLE1BQ1Q7O0FBQ0ksb0NBQUlBLE9BQU8sS0FBS0wsS0FBWixDQUFKLEVBQ0E7QUFDSSx5Q0FBS1EsWUFBTCxDQUFrQkgsTUFBbEI7QUFDQUEsMkNBQU8sS0FBS0wsS0FBWixJQUFxQixLQUFyQjtBQUNIO0FBQ0o7QUFSTDtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBU0M7QUFYTDtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBWUMsYUFiRCxNQWVBO0FBQUE7QUFBQTtBQUFBOztBQUFBO0FBQ0ksMENBQWlCLEtBQUtJLEtBQXRCLG1JQUNBO0FBQUEsNEJBRFNPLEtBQ1Q7O0FBQ0lBLDhCQUFLSSxPQUFMLENBQWE7QUFBQSxtQ0FBVSxPQUFLUCxZQUFMLENBQWtCSCxNQUFsQixDQUFWO0FBQUEseUJBQWI7QUFDSDtBQUpMO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFLQztBQUNKOztBQUVEOzs7Ozs7Ozs7cUNBTWFBLE0sRUFDYjtBQUNJLGdCQUFJZCxhQUFKO0FBQ0EsZ0JBQUksS0FBS0csYUFBVCxFQUNBO0FBQ0ksb0JBQU00QixNQUFNakIsT0FBT2tCLGNBQVAsRUFBWjtBQUNBaEMsdUJBQU9jLE9BQU8sS0FBS2QsSUFBWixJQUFvQjtBQUN2QmlDLHVCQUFHbkIsT0FBT21CLENBQVAsR0FBV0YsSUFBSUUsQ0FBSixHQUFRbkIsT0FBT29CLEtBQVAsQ0FBYUQsQ0FEWjtBQUV2QkUsdUJBQUdyQixPQUFPcUIsQ0FBUCxHQUFXSixJQUFJSSxDQUFKLEdBQVFyQixPQUFPb0IsS0FBUCxDQUFhQyxDQUZaO0FBR3ZCekIsMkJBQU9xQixJQUFJckIsS0FBSixHQUFZSSxPQUFPb0IsS0FBUCxDQUFhRCxDQUhUO0FBSXZCdEIsNEJBQVFvQixJQUFJcEIsTUFBSixHQUFhRyxPQUFPb0IsS0FBUCxDQUFhQztBQUpYLGlCQUEzQjtBQU1ILGFBVEQsTUFXQTtBQUNJbkMsdUJBQU9jLE9BQU8sS0FBS2QsSUFBWixDQUFQO0FBQ0g7O0FBRUQsZ0JBQU1FLFVBQVVZLE9BQU8sS0FBS1osT0FBWixDQUFoQjs7QUFqQkosNkJBa0IyQyxLQUFLa0MsU0FBTCxDQUFlcEMsSUFBZixDQWxCM0M7QUFBQSxnQkFrQllxQyxNQWxCWixjQWtCWUEsTUFsQlo7QUFBQSxnQkFrQm9CQyxNQWxCcEIsY0FrQm9CQSxNQWxCcEI7QUFBQSxnQkFrQjRCQyxJQWxCNUIsY0FrQjRCQSxJQWxCNUI7QUFBQSxnQkFrQmtDQyxJQWxCbEMsY0FrQmtDQSxJQWxCbEM7O0FBb0JJOzs7QUFDQSxnQkFBSXRDLFFBQVFtQyxNQUFSLEtBQW1CQSxNQUFuQixJQUE2Qm5DLFFBQVFvQyxNQUFSLEtBQW1CQSxNQUFoRCxJQUEwRHBDLFFBQVFxQyxJQUFSLEtBQWlCQSxJQUEzRSxJQUFtRnJDLFFBQVFzQyxJQUFSLEtBQWlCQSxJQUF4RyxFQUNBO0FBQ0ksb0JBQUl0QyxRQUFRYyxNQUFSLENBQWV5QixNQUFuQixFQUNBO0FBQ0kseUJBQUtuQixjQUFMLENBQW9CUixNQUFwQjtBQUNIO0FBQ0QscUJBQUssSUFBSXFCLElBQUlHLE1BQWIsRUFBcUJILEtBQUtLLElBQTFCLEVBQWdDTCxHQUFoQyxFQUNBO0FBQ0kseUJBQUssSUFBSUYsSUFBSUksTUFBYixFQUFxQkosS0FBS00sSUFBMUIsRUFBZ0NOLEdBQWhDLEVBQ0E7QUFDSSw0QkFBTVMsTUFBTVQsSUFBSSxHQUFKLEdBQVVFLENBQXRCO0FBQ0EsNkJBQUtRLE1BQUwsQ0FBWTdCLE1BQVosRUFBb0I0QixHQUFwQjtBQUNBeEMsZ0NBQVFjLE1BQVIsQ0FBZUUsSUFBZixDQUFvQndCLEdBQXBCO0FBQ0g7QUFDSjtBQUNEeEMsd0JBQVFtQyxNQUFSLEdBQWlCQSxNQUFqQjtBQUNBbkMsd0JBQVFvQyxNQUFSLEdBQWlCQSxNQUFqQjtBQUNBcEMsd0JBQVFxQyxJQUFSLEdBQWVBLElBQWY7QUFDQXJDLHdCQUFRc0MsSUFBUixHQUFlQSxJQUFmO0FBQ0g7QUFDSjs7QUFFRDs7Ozs7Ozs7cUNBTUE7QUFBQSxnQkFEV0ksT0FDWCx1RUFEbUIsQ0FDbkI7O0FBQ0ksZ0JBQU01QixTQUFTLEVBQWY7QUFDQSxpQkFBSyxJQUFJMEIsR0FBVCxJQUFnQixLQUFLOUIsSUFBckIsRUFDQTtBQUNJLG9CQUFNQSxPQUFPLEtBQUtBLElBQUwsQ0FBVThCLEdBQVYsQ0FBYjtBQUNBLG9CQUFJOUIsS0FBSzZCLE1BQUwsSUFBZUcsT0FBbkIsRUFDQTtBQUNJNUIsMkJBQU9FLElBQVAsQ0FBWU4sSUFBWjtBQUNIO0FBQ0o7QUFDRCxtQkFBT0ksTUFBUDtBQUNIOztBQUVEOzs7Ozs7Ozs7a0NBTVVoQixJLEVBQ1Y7QUFDSSxnQkFBSXFDLFNBQVNRLEtBQUtDLEtBQUwsQ0FBVzlDLEtBQUtpQyxDQUFMLEdBQVMsS0FBS3BDLEtBQXpCLENBQWI7QUFDQSxnQkFBSXlDLFNBQVNPLEtBQUtDLEtBQUwsQ0FBVzlDLEtBQUttQyxDQUFMLEdBQVMsS0FBS3BDLEtBQXpCLENBQWI7QUFDQSxnQkFBSXdDLE9BQU9NLEtBQUtDLEtBQUwsQ0FBVyxDQUFDOUMsS0FBS2lDLENBQUwsR0FBU2pDLEtBQUtVLEtBQWYsSUFBd0IsS0FBS2IsS0FBeEMsQ0FBWDtBQUNBLGdCQUFJMkMsT0FBT0ssS0FBS0MsS0FBTCxDQUFXLENBQUM5QyxLQUFLbUMsQ0FBTCxHQUFTbkMsS0FBS1csTUFBZixJQUF5QixLQUFLWixLQUF6QyxDQUFYO0FBQ0EsbUJBQU8sRUFBRXNDLGNBQUYsRUFBVUMsY0FBVixFQUFrQkMsVUFBbEIsRUFBd0JDLFVBQXhCLEVBQVA7QUFDSDs7QUFFRDs7Ozs7Ozs7OytCQU1PMUIsTSxFQUFRNEIsRyxFQUNmO0FBQ0ksZ0JBQUksQ0FBQyxLQUFLOUIsSUFBTCxDQUFVOEIsR0FBVixDQUFMLEVBQ0E7QUFDSSxxQkFBSzlCLElBQUwsQ0FBVThCLEdBQVYsSUFBaUIsQ0FBQzVCLE1BQUQsQ0FBakI7QUFDSCxhQUhELE1BS0E7QUFDSSxxQkFBS0YsSUFBTCxDQUFVOEIsR0FBVixFQUFleEIsSUFBZixDQUFvQkosTUFBcEI7QUFDSDtBQUNKOztBQUVEOzs7Ozs7Ozs7dUNBTWVBLE0sRUFDZjtBQUNJLGdCQUFNWixVQUFVWSxPQUFPLEtBQUtaLE9BQVosQ0FBaEI7QUFDQSxtQkFBT0EsUUFBUWMsTUFBUixDQUFleUIsTUFBdEIsRUFDQTtBQUNJLG9CQUFNQyxNQUFNeEMsUUFBUWMsTUFBUixDQUFlK0IsR0FBZixFQUFaO0FBQ0Esb0JBQU0zQixPQUFPLEtBQUtSLElBQUwsQ0FBVThCLEdBQVYsQ0FBYjtBQUNBdEIscUJBQUtELE1BQUwsQ0FBWUMsS0FBS0MsT0FBTCxDQUFhUCxNQUFiLENBQVosRUFBa0MsQ0FBbEM7QUFDSDtBQUNKOztBQUVEOzs7Ozs7OztrQ0FLVUEsTSxFQUNWO0FBQUE7O0FBQ0ksZ0JBQUlrQyxVQUFVLEVBQWQ7QUFDQWxDLG1CQUFPLEtBQUtaLE9BQVosRUFBcUJjLE1BQXJCLENBQTRCUSxPQUE1QixDQUFvQztBQUFBLHVCQUFPd0IsVUFBVUEsUUFBUUMsTUFBUixDQUFlLE9BQUtyQyxJQUFMLENBQVU4QixHQUFWLENBQWYsQ0FBakI7QUFBQSxhQUFwQztBQUNBLG1CQUFPTSxPQUFQO0FBQ0g7O0FBRUQ7Ozs7Ozs7Ozs4QkFNTWhELEksRUFBTU0sVSxFQUNaO0FBQ0lBLHlCQUFhLE9BQU9BLFVBQVAsS0FBc0IsV0FBdEIsR0FBb0NBLFVBQXBDLEdBQWlELElBQTlEO0FBQ0EsZ0JBQUk0QyxVQUFVLENBQWQ7QUFDQSxnQkFBSUYsVUFBVSxFQUFkOztBQUhKLDhCQUkyQyxLQUFLWixTQUFMLENBQWVwQyxJQUFmLENBSjNDO0FBQUEsZ0JBSVlxQyxNQUpaLGVBSVlBLE1BSlo7QUFBQSxnQkFJb0JDLE1BSnBCLGVBSW9CQSxNQUpwQjtBQUFBLGdCQUk0QkMsSUFKNUIsZUFJNEJBLElBSjVCO0FBQUEsZ0JBSWtDQyxJQUpsQyxlQUlrQ0EsSUFKbEM7O0FBS0ksaUJBQUssSUFBSUwsSUFBSUcsTUFBYixFQUFxQkgsS0FBS0ssSUFBMUIsRUFBZ0NMLEdBQWhDLEVBQ0E7QUFDSSxxQkFBSyxJQUFJRixJQUFJSSxNQUFiLEVBQXFCSixLQUFLTSxJQUExQixFQUFnQ04sR0FBaEMsRUFDQTtBQUNJLHdCQUFNa0IsUUFBUSxLQUFLdkMsSUFBTCxDQUFVcUIsSUFBSSxHQUFKLEdBQVVFLENBQXBCLENBQWQ7QUFDQSx3QkFBSWdCLEtBQUosRUFDQTtBQUNJLDRCQUFJN0MsVUFBSixFQUNBO0FBQUE7QUFBQTtBQUFBOztBQUFBO0FBQ0ksc0RBQW1CNkMsS0FBbkIsbUlBQ0E7QUFBQSx3Q0FEU3JDLE1BQ1Q7O0FBQ0ksd0NBQU1pQixNQUFNakIsT0FBTyxLQUFLZCxJQUFaLENBQVo7QUFDQSx3Q0FBSStCLElBQUlFLENBQUosR0FBUUYsSUFBSXJCLEtBQVosR0FBb0JWLEtBQUtpQyxDQUF6QixJQUE4QkYsSUFBSUUsQ0FBSixHQUFRakMsS0FBS2lDLENBQUwsR0FBU2pDLEtBQUtVLEtBQXBELElBQ0pxQixJQUFJSSxDQUFKLEdBQVFKLElBQUlwQixNQUFaLEdBQXFCWCxLQUFLbUMsQ0FEdEIsSUFDMkJKLElBQUlJLENBQUosR0FBUW5DLEtBQUttQyxDQUFMLEdBQVNuQyxLQUFLVyxNQURyRCxFQUVBO0FBQ0lxQyxnREFBUTlCLElBQVIsQ0FBYUosTUFBYjtBQUNIO0FBQ0o7QUFUTDtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBVUMseUJBWEQsTUFhQTtBQUNJa0Msc0NBQVVBLFFBQVFDLE1BQVIsQ0FBZUUsS0FBZixDQUFWO0FBQ0g7QUFDREQ7QUFDSDtBQUNKO0FBQ0o7QUFDRCxpQkFBS3BCLFdBQUwsR0FBbUJvQixPQUFuQjtBQUNBLG1CQUFPRixPQUFQO0FBQ0g7O0FBRUQ7Ozs7Ozs7Ozs7O3NDQVFjaEQsSSxFQUFNb0QsUSxFQUFVOUMsVSxFQUM5QjtBQUNJQSx5QkFBYSxPQUFPQSxVQUFQLEtBQXNCLFdBQXRCLEdBQW9DQSxVQUFwQyxHQUFpRCxJQUE5RDs7QUFESiw4QkFFMkMsS0FBSzhCLFNBQUwsQ0FBZXBDLElBQWYsQ0FGM0M7QUFBQSxnQkFFWXFDLE1BRlosZUFFWUEsTUFGWjtBQUFBLGdCQUVvQkMsTUFGcEIsZUFFb0JBLE1BRnBCO0FBQUEsZ0JBRTRCQyxJQUY1QixlQUU0QkEsSUFGNUI7QUFBQSxnQkFFa0NDLElBRmxDLGVBRWtDQSxJQUZsQzs7QUFHSSxpQkFBSyxJQUFJTCxJQUFJRyxNQUFiLEVBQXFCSCxLQUFLSyxJQUExQixFQUFnQ0wsR0FBaEMsRUFDQTtBQUNJLHFCQUFLLElBQUlGLElBQUlJLE1BQWIsRUFBcUJKLEtBQUtNLElBQTFCLEVBQWdDTixHQUFoQyxFQUNBO0FBQ0ksd0JBQU1rQixRQUFRLEtBQUt2QyxJQUFMLENBQVVxQixJQUFJLEdBQUosR0FBVUUsQ0FBcEIsQ0FBZDtBQUNBLHdCQUFJZ0IsS0FBSixFQUNBO0FBQ0ksNkJBQUssSUFBSUUsSUFBSSxDQUFiLEVBQWdCQSxJQUFJRixNQUFNVixNQUExQixFQUFrQ1ksR0FBbEMsRUFDQTtBQUNJLGdDQUFNdkMsU0FBU3FDLE1BQU1FLENBQU4sQ0FBZjtBQUNBLGdDQUFJL0MsVUFBSixFQUNBO0FBQ0ksb0NBQU1OLFFBQU9jLE9BQU9kLElBQXBCO0FBQ0Esb0NBQUlBLE1BQUtpQyxDQUFMLEdBQVNqQyxNQUFLVSxLQUFkLEdBQXNCVixNQUFLaUMsQ0FBM0IsSUFBZ0NqQyxNQUFLaUMsQ0FBTCxHQUFTakMsTUFBS2lDLENBQUwsR0FBU2pDLE1BQUtVLEtBQXZELElBQ0pWLE1BQUttQyxDQUFMLEdBQVNuQyxNQUFLVyxNQUFkLEdBQXVCWCxNQUFLbUMsQ0FEeEIsSUFDNkJuQyxNQUFLbUMsQ0FBTCxHQUFTbkMsTUFBS21DLENBQUwsR0FBU25DLE1BQUtXLE1BRHhELEVBRUE7QUFDSSx3Q0FBSXlDLFNBQVN0QyxNQUFULENBQUosRUFDQTtBQUNJLCtDQUFPLElBQVA7QUFDSDtBQUNKO0FBQ0osNkJBWEQsTUFhQTtBQUNJLG9DQUFJc0MsU0FBU3RDLE1BQVQsQ0FBSixFQUNBO0FBQ0ksMkNBQU8sSUFBUDtBQUNIO0FBQ0o7QUFDSjtBQUNKO0FBQ0o7QUFDSjtBQUNELG1CQUFPLEtBQVA7QUFDSDs7QUFFRDs7Ozs7OztnQ0FLQTtBQUNJLGdCQUFJTixVQUFVLENBQWQ7QUFBQSxnQkFBaUI4QyxRQUFRLENBQXpCO0FBREo7QUFBQTtBQUFBOztBQUFBO0FBRUksc0NBQWlCLEtBQUt6QyxLQUF0QixtSUFDQTtBQUFBLHdCQURTTyxJQUNUOztBQUNJQSx5QkFBS0ksT0FBTCxDQUFhLGtCQUNiO0FBQ0loQixtQ0FBV00sT0FBT04sT0FBUCxHQUFpQixDQUFqQixHQUFxQixDQUFoQztBQUNBOEM7QUFDSCxxQkFKRDtBQUtIO0FBVEw7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTs7QUFXSSxtQkFBTztBQUNIQyx1QkFBT0QsS0FESjtBQUVIOUMsZ0NBRkc7QUFHSGdELHdCQUFRRixRQUFROUM7QUFIYixhQUFQO0FBS0g7O0FBRUQ7Ozs7Ozs7NkNBS0E7QUFDSSxtQkFBT2lELE9BQU9DLElBQVAsQ0FBWSxLQUFLOUMsSUFBakIsRUFBdUI2QixNQUE5QjtBQUNIOztBQUVEOzs7Ozs7O3lDQUtBO0FBQ0ksZ0JBQUljLFFBQVEsQ0FBWjtBQUNBLGlCQUFLLElBQUliLEdBQVQsSUFBZ0IsS0FBSzlCLElBQXJCLEVBQ0E7QUFDSTJDLHlCQUFTLEtBQUszQyxJQUFMLENBQVU4QixHQUFWLEVBQWVELE1BQXhCO0FBQ0g7QUFDRCxtQkFBT2MsUUFBUSxLQUFLSSxVQUFMLEVBQWY7QUFDSDs7QUFFRDs7Ozs7OztxQ0FLQTtBQUNJLGdCQUFJQyxVQUFVLENBQWQ7QUFDQSxpQkFBSyxJQUFJbEIsR0FBVCxJQUFnQixLQUFLOUIsSUFBckIsRUFDQTtBQUNJLG9CQUFJLEtBQUtBLElBQUwsQ0FBVThCLEdBQVYsRUFBZUQsTUFBZixHQUF3Qm1CLE9BQTVCLEVBQ0E7QUFDSUEsOEJBQVUsS0FBS2hELElBQUwsQ0FBVThCLEdBQVYsRUFBZUQsTUFBekI7QUFDSDtBQUNKO0FBQ0QsbUJBQU9tQixPQUFQO0FBQ0g7O0FBRUQ7Ozs7Ozs7c0NBSWM1RCxJLEVBQ2Q7QUFDSSxnQkFBSXNELFFBQVEsQ0FBWjtBQUFBLGdCQUFlQyxRQUFRLENBQXZCOztBQURKLDhCQUUyQyxLQUFLbkIsU0FBTCxDQUFlcEMsSUFBZixDQUYzQztBQUFBLGdCQUVZcUMsTUFGWixlQUVZQSxNQUZaO0FBQUEsZ0JBRW9CQyxNQUZwQixlQUVvQkEsTUFGcEI7QUFBQSxnQkFFNEJDLElBRjVCLGVBRTRCQSxJQUY1QjtBQUFBLGdCQUVrQ0MsSUFGbEMsZUFFa0NBLElBRmxDOztBQUdJLGlCQUFLLElBQUlMLElBQUlHLE1BQWIsRUFBcUJILElBQUlLLElBQXpCLEVBQStCTCxHQUEvQixFQUNBO0FBQ0kscUJBQUssSUFBSUYsSUFBSUksTUFBYixFQUFxQkosSUFBSU0sSUFBekIsRUFBK0JOLEdBQS9CLEVBQ0E7QUFDSXFCLDZCQUFVLEtBQUsxQyxJQUFMLENBQVVxQixJQUFJLEdBQUosR0FBVUUsQ0FBcEIsSUFBeUIsQ0FBekIsR0FBNkIsQ0FBdkM7QUFDQW9CO0FBQ0g7QUFDSjtBQUNELG1CQUFPRCxRQUFRQyxLQUFmO0FBQ0g7Ozs7OztBQUdMOzs7Ozs7O0FBT0E7Ozs7Ozs7O0FBUUE7Ozs7Ozs7O0FBUUFNLE9BQU9DLE9BQVAsR0FBaUJuRSxXQUFqQiIsImZpbGUiOiJzcGF0aWFsLWhhc2guanMiLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAxOCBZT1BFWSBZT1BFWSBMTENcclxuLy8gRGF2aWQgRmlnYXRuZXJcclxuLy8gTUlUIExpY2Vuc2VcclxuXHJcbmNsYXNzIFNwYXRpYWxIYXNoXHJcbntcclxuICAgIC8qKlxyXG4gICAgICogY3JlYXRlcyBhIHNwYXRpYWwtaGFzaCBjdWxsXHJcbiAgICAgKiBAcGFyYW0ge29iamVjdH0gW29wdGlvbnNdXHJcbiAgICAgKiBAcGFyYW0ge251bWJlcn0gW29wdGlvbnMuc2l6ZT0xMDAwXSBjZWxsIHNpemUgdXNlZCB0byBjcmVhdGUgaGFzaCAoeFNpemUgPSB5U2l6ZSlcclxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSBbb3B0aW9ucy54U2l6ZV0gaG9yaXpvbnRhbCBjZWxsIHNpemVcclxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSBbb3B0aW9ucy55U2l6ZV0gdmVydGljYWwgY2VsbCBzaXplXHJcbiAgICAgKiBAcGFyYW0ge2Jvb2xlYW59IFtvcHRpb25zLmNhbGN1bGF0ZVBJWEk9dHJ1ZV0gY2FsY3VsYXRlIGJvdW5kaW5nIGJveCBhdXRvbWF0aWNhbGx5OyBpZiB0aGlzIGlzIHNldCB0byBmYWxzZSB0aGVuIGl0IHVzZXMgb2JqZWN0W29wdGlvbnMuQUFCQl0gZm9yIGJvdW5kaW5nIGJveFxyXG4gICAgICogQHBhcmFtIHtib29sZWFufSBbb3B0aW9ucy52aXNpYmxlPXZpc2libGVdIHBhcmFtZXRlciBvZiB0aGUgb2JqZWN0IHRvIHNldCAodXN1YWxseSB2aXNpYmxlIG9yIHJlbmRlcmFibGUpXHJcbiAgICAgKiBAcGFyYW0ge2Jvb2xlYW59IFtvcHRpb25zLnNpbXBsZVRlc3Q9dHJ1ZV0gaXRlcmF0ZSB0aHJvdWdoIHZpc2libGUgYnVja2V0cyB0byBjaGVjayBmb3IgYm91bmRzXHJcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gW29wdGlvbnMuZGlydHlUZXN0PXRydWVdIG9ubHkgdXBkYXRlIHNwYXRpYWwgaGFzaCBmb3Igb2JqZWN0cyB3aXRoIG9iamVjdFtvcHRpb25zLmRpcnR5VGVzdF09dHJ1ZTsgdGhpcyBoYXMgYSBIVUdFIGltcGFjdCBvbiBwZXJmb3JtYW5jZVxyXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IFtvcHRpb25zLkFBQkI9QUFCQl0gb2JqZWN0IHByb3BlcnR5IHRoYXQgaG9sZHMgYm91bmRpbmcgYm94IHNvIHRoYXQgb2JqZWN0W3R5cGVdID0geyB4OiBudW1iZXIsIHk6IG51bWJlciwgd2lkdGg6IG51bWJlciwgaGVpZ2h0OiBudW1iZXIgfVxyXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IFtvcHRpb25zLnNwYXRpYWw9c3BhdGlhbF0gb2JqZWN0IHByb3BlcnR5IHRoYXQgaG9sZHMgb2JqZWN0J3MgaGFzaCBsaXN0XHJcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gW29wdGlvbnMuZGlydHk9ZGlydHldIG9iamVjdCBwcm9wZXJ0eSBmb3IgZGlydHlUZXN0XHJcbiAgICAgKi9cclxuICAgIGNvbnN0cnVjdG9yKG9wdGlvbnMpXHJcbiAgICB7XHJcbiAgICAgICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge31cclxuICAgICAgICB0aGlzLnhTaXplID0gb3B0aW9ucy54U2l6ZSB8fCBvcHRpb25zLnNpemUgfHwgMTAwMFxyXG4gICAgICAgIHRoaXMueVNpemUgPSBvcHRpb25zLnlTaXplIHx8IG9wdGlvbnMuc2l6ZSB8fCAxMDAwXHJcbiAgICAgICAgdGhpcy5BQUJCID0gb3B0aW9ucy50eXBlIHx8ICdBQUJCJ1xyXG4gICAgICAgIHRoaXMuc3BhdGlhbCA9IG9wdGlvbnMuc3BhdGlhbCB8fCAnc3BhdGlhbCdcclxuICAgICAgICB0aGlzLmNhbGN1bGF0ZVBJWEkgPSB0eXBlb2Ygb3B0aW9ucy5jYWxjdWxhdGVQSVhJICE9PSAndW5kZWZpbmVkJyA/IG9wdGlvbnMuY2FsY3VsYXRlUElYSSA6IHRydWVcclxuICAgICAgICB0aGlzLnZpc2libGVUZXh0ID0gdHlwZW9mIG9wdGlvbnMudmlzaWJsZVRlc3QgIT09ICd1bmRlZmluZWQnID8gb3B0aW9ucy52aXNpYmxlVGVzdCA6IHRydWVcclxuICAgICAgICB0aGlzLnNpbXBsZVRlc3QgPSB0eXBlb2Ygb3B0aW9ucy5zaW1wbGVUZXN0ICE9PSAndW5kZWZpbmVkJyA/IG9wdGlvbnMuc2ltcGxlVGVzdCA6IHRydWVcclxuICAgICAgICB0aGlzLmRpcnR5VGVzdCA9IHR5cGVvZiBvcHRpb25zLmRpcnR5VGVzdCAhPT0gJ3VuZGVmaW5lZCcgPyBvcHRpb25zLmRpcnR5VGVzdCA6IHRydWVcclxuICAgICAgICB0aGlzLnZpc2libGUgPSBvcHRpb25zLnZpc2libGUgfHwgJ3Zpc2libGUnXHJcbiAgICAgICAgdGhpcy5kaXJ0eSA9IG9wdGlvbnMuZGlydHkgfHwgJ2RpcnR5J1xyXG4gICAgICAgIHRoaXMud2lkdGggPSB0aGlzLmhlaWdodCA9IDBcclxuICAgICAgICB0aGlzLmhhc2ggPSB7fVxyXG4gICAgICAgIHRoaXMubGlzdHMgPSBbW11dXHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBhZGQgYW4gb2JqZWN0IHRvIGJlIGN1bGxlZFxyXG4gICAgICogc2lkZSBlZmZlY3Q6IGFkZHMgb2JqZWN0LnNwYXRpYWxIYXNoZXMgdG8gdHJhY2sgZXhpc3RpbmcgaGFzaGVzXHJcbiAgICAgKiBAcGFyYW0geyp9IG9iamVjdFxyXG4gICAgICogQHBhcmFtIHtib29sZWFufSBbc3RhdGljT2JqZWN0XSBzZXQgdG8gdHJ1ZSBpZiB0aGUgb2JqZWN0J3MgcG9zaXRpb24vc2l6ZSBkb2VzIG5vdCBjaGFuZ2VcclxuICAgICAqIEByZXR1cm4geyp9IG9iamVjdFxyXG4gICAgICovXHJcbiAgICBhZGQob2JqZWN0LCBzdGF0aWNPYmplY3QpXHJcbiAgICB7XHJcbiAgICAgICAgb2JqZWN0W3RoaXMuc3BhdGlhbF0gPSB7IGhhc2hlczogW10gfVxyXG4gICAgICAgIGlmICh0aGlzLmNhbGN1bGF0ZVBJWEkgJiYgdGhpcy5kaXJ0eVRlc3QpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBvYmplY3RbdGhpcy5kaXJ0eV0gPSB0cnVlXHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmIChzdGF0aWNPYmplY3QpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBvYmplY3Quc3RhdGljT2JqZWN0ID0gdHJ1ZVxyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLnVwZGF0ZU9iamVjdChvYmplY3QpXHJcbiAgICAgICAgdGhpcy5saXN0c1swXS5wdXNoKG9iamVjdClcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIHJlbW92ZSBhbiBvYmplY3QgYWRkZWQgYnkgYWRkKClcclxuICAgICAqIEBwYXJhbSB7Kn0gb2JqZWN0XHJcbiAgICAgKiBAcmV0dXJuIHsqfSBvYmplY3RcclxuICAgICAqL1xyXG4gICAgcmVtb3ZlKG9iamVjdClcclxuICAgIHtcclxuICAgICAgICB0aGlzLmxpc3RzWzBdLnNwbGljZSh0aGlzLmxpc3RbMF0uaW5kZXhPZihvYmplY3QpLCAxKVxyXG4gICAgICAgIHRoaXMucmVtb3ZlRnJvbUhhc2gob2JqZWN0KVxyXG4gICAgICAgIHJldHVybiBvYmplY3RcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIGFkZCBhbiBhcnJheSBvZiBvYmplY3RzIHRvIGJlIGN1bGxlZFxyXG4gICAgICogQHBhcmFtIHtBcnJheX0gYXJyYXlcclxuICAgICAqIEBwYXJhbSB7Ym9vbGVhbn0gW3N0YXRpY09iamVjdF0gc2V0IHRvIHRydWUgaWYgdGhlIG9iamVjdHMgaW4gdGhlIGxpc3QgcG9zaXRpb24vc2l6ZSBkb2VzIG5vdCBjaGFuZ2VcclxuICAgICAqIEByZXR1cm4ge0FycmF5fSBhcnJheVxyXG4gICAgICovXHJcbiAgICBhZGRMaXN0KGxpc3QsIHN0YXRpY09iamVjdClcclxuICAgIHtcclxuICAgICAgICBmb3IgKGxldCBvYmplY3Qgb2YgbGlzdClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIG9iamVjdFt0aGlzLnNwYXRpYWxdID0geyBoYXNoZXM6IFtdIH1cclxuICAgICAgICAgICAgaWYgKHRoaXMuY2FsY3VsYXRlUElYSSAmJiB0aGlzLmRpcnR5VGVzdClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgb2JqZWN0W3RoaXMuZGlydHldID0gdHJ1ZVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGlmIChzdGF0aWNPYmplY3QpXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGxpc3Quc3RhdGljT2JqZWN0ID0gdHJ1ZVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHRoaXMudXBkYXRlT2JqZWN0KG9iamVjdClcclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy5saXN0cy5wdXNoKGxpc3QpXHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiByZW1vdmUgYW4gYXJyYXkgYWRkZWQgYnkgYWRkTGlzdCgpXHJcbiAgICAgKiBAcGFyYW0ge0FycmF5fSBhcnJheVxyXG4gICAgICogQHJldHVybiB7QXJyYXl9IGFycmF5XHJcbiAgICAgKi9cclxuICAgIHJlbW92ZUxpc3QoYXJyYXkpXHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy5saXN0cy5zcGxpY2UodGhpcy5saXN0cy5pbmRleE9mKGFycmF5KSwgMSlcclxuICAgICAgICBhcnJheS5mb3JFYWNoKG9iamVjdCA9PiB0aGlzLnJlbW92ZUZyb21IYXNoKG9iamVjdCkpXHJcbiAgICAgICAgcmV0dXJuIGFycmF5XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiB1cGRhdGUgdGhlIGhhc2hlcyBhbmQgY3VsbCB0aGUgaXRlbXMgaW4gdGhlIGxpc3RcclxuICAgICAqIEBwYXJhbSB7QUFCQn0gQUFCQlxyXG4gICAgICogQHBhcmFtIHtib29sZWFufSBbc2tpcFVwZGF0ZV0gc2tpcCB1cGRhdGluZyB0aGUgaGFzaGVzIG9mIGFsbCBvYmplY3RzXHJcbiAgICAgKiBAcmV0dXJuIHtudW1iZXJ9IG51bWJlciBvZiBidWNrZXRzIGluIHJlc3VsdHNcclxuICAgICAqL1xyXG4gICAgY3VsbChBQUJCLCBza2lwVXBkYXRlKVxyXG4gICAge1xyXG4gICAgICAgIGlmICghc2tpcFVwZGF0ZSlcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRoaXMudXBkYXRlT2JqZWN0cygpXHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMuaW52aXNpYmxlKClcclxuICAgICAgICBjb25zdCBvYmplY3RzID0gdGhpcy5xdWVyeShBQUJCLCB0aGlzLnNpbXBsZVRlc3QpXHJcbiAgICAgICAgb2JqZWN0cy5mb3JFYWNoKG9iamVjdCA9PiBvYmplY3RbdGhpcy52aXNpYmxlXSA9IHRydWUpXHJcbiAgICAgICAgcmV0dXJuIHRoaXMubGFzdEJ1Y2tldHNcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIHNldCBhbGwgb2JqZWN0cyBpbiBoYXNoIHRvIHZpc2libGU9ZmFsc2VcclxuICAgICAqL1xyXG4gICAgaW52aXNpYmxlKClcclxuICAgIHtcclxuICAgICAgICBmb3IgKGxldCBsaXN0IG9mIHRoaXMubGlzdHMpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBsaXN0LmZvckVhY2gob2JqZWN0ID0+IG9iamVjdFt0aGlzLnZpc2libGVdID0gZmFsc2UpXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogdXBkYXRlIHRoZSBoYXNoZXMgZm9yIGFsbCBvYmplY3RzXHJcbiAgICAgKiBhdXRvbWF0aWNhbGx5IGNhbGxlZCBmcm9tIHVwZGF0ZSgpIHdoZW4gc2tpcFVwZGF0ZT1mYWxzZVxyXG4gICAgICovXHJcbiAgICB1cGRhdGVPYmplY3RzKClcclxuICAgIHtcclxuICAgICAgICBpZiAodGhpcy5kaXJ0eVRlc3QpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBmb3IgKGxldCBsaXN0IG9mIHRoaXMubGlzdHMpXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGZvciAobGV0IG9iamVjdCBvZiBsaXN0KVxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChvYmplY3RbdGhpcy5kaXJ0eV0pXHJcbiAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnVwZGF0ZU9iamVjdChvYmplY3QpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG9iamVjdFt0aGlzLmRpcnR5XSA9IGZhbHNlXHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2VcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGZvciAobGV0IGxpc3Qgb2YgdGhpcy5saXN0cylcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgbGlzdC5mb3JFYWNoKG9iamVjdCA9PiB0aGlzLnVwZGF0ZU9iamVjdChvYmplY3QpKVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogdXBkYXRlIHRoZSBoYXMgb2YgYW4gb2JqZWN0XHJcbiAgICAgKiBhdXRvbWF0aWNhbGx5IGNhbGxlZCBmcm9tIHVwZGF0ZU9iamVjdHMoKVxyXG4gICAgICogQHBhcmFtIHsqfSBvYmplY3RcclxuICAgICAqIEBwYXJhbSB7Ym9vbGVhbn0gW2ZvcmNlXSBmb3JjZSB1cGRhdGUgZm9yIGNhbGN1bGF0ZVBJWElcclxuICAgICAqL1xyXG4gICAgdXBkYXRlT2JqZWN0KG9iamVjdClcclxuICAgIHtcclxuICAgICAgICBsZXQgQUFCQlxyXG4gICAgICAgIGlmICh0aGlzLmNhbGN1bGF0ZVBJWEkpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBjb25zdCBib3ggPSBvYmplY3QuZ2V0TG9jYWxCb3VuZHMoKVxyXG4gICAgICAgICAgICBBQUJCID0gb2JqZWN0W3RoaXMuQUFCQl0gPSB7XHJcbiAgICAgICAgICAgICAgICB4OiBvYmplY3QueCArIGJveC54ICogb2JqZWN0LnNjYWxlLngsXHJcbiAgICAgICAgICAgICAgICB5OiBvYmplY3QueSArIGJveC55ICogb2JqZWN0LnNjYWxlLnksXHJcbiAgICAgICAgICAgICAgICB3aWR0aDogYm94LndpZHRoICogb2JqZWN0LnNjYWxlLngsXHJcbiAgICAgICAgICAgICAgICBoZWlnaHQ6IGJveC5oZWlnaHQgKiBvYmplY3Quc2NhbGUueVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2VcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIEFBQkIgPSBvYmplY3RbdGhpcy5BQUJCXVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgY29uc3Qgc3BhdGlhbCA9IG9iamVjdFt0aGlzLnNwYXRpYWxdXHJcbiAgICAgICAgY29uc3QgeyB4U3RhcnQsIHlTdGFydCwgeEVuZCwgeUVuZCB9ID0gdGhpcy5nZXRCb3VuZHMoQUFCQilcclxuXHJcbiAgICAgICAgLy8gb25seSByZW1vdmUgYW5kIGluc2VydCBpZiBtYXBwaW5nIGhhcyBjaGFuZ2VkXHJcbiAgICAgICAgaWYgKHNwYXRpYWwueFN0YXJ0ICE9PSB4U3RhcnQgfHwgc3BhdGlhbC55U3RhcnQgIT09IHlTdGFydCB8fCBzcGF0aWFsLnhFbmQgIT09IHhFbmQgfHwgc3BhdGlhbC55RW5kICE9PSB5RW5kKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgaWYgKHNwYXRpYWwuaGFzaGVzLmxlbmd0aClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5yZW1vdmVGcm9tSGFzaChvYmplY3QpXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZm9yIChsZXQgeSA9IHlTdGFydDsgeSA8PSB5RW5kOyB5KyspXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGZvciAobGV0IHggPSB4U3RhcnQ7IHggPD0geEVuZDsgeCsrKVxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGtleSA9IHggKyAnLCcgKyB5XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5pbnNlcnQob2JqZWN0LCBrZXkpXHJcbiAgICAgICAgICAgICAgICAgICAgc3BhdGlhbC5oYXNoZXMucHVzaChrZXkpXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgc3BhdGlhbC54U3RhcnQgPSB4U3RhcnRcclxuICAgICAgICAgICAgc3BhdGlhbC55U3RhcnQgPSB5U3RhcnRcclxuICAgICAgICAgICAgc3BhdGlhbC54RW5kID0geEVuZFxyXG4gICAgICAgICAgICBzcGF0aWFsLnlFbmQgPSB5RW5kXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogcmV0dXJucyBhbiBhcnJheSBvZiBidWNrZXRzIHdpdGggPj0gbWluaW11bSBvZiBvYmplY3RzIGluIGVhY2ggYnVja2V0XHJcbiAgICAgKiBAcGFyYW0ge251bWJlcn0gW21pbmltdW09MV1cclxuICAgICAqIEByZXR1cm4ge2FycmF5fSBhcnJheSBvZiBidWNrZXRzXHJcbiAgICAgKi9cclxuICAgIGdldEJ1Y2tldHMobWluaW11bT0xKVxyXG4gICAge1xyXG4gICAgICAgIGNvbnN0IGhhc2hlcyA9IFtdXHJcbiAgICAgICAgZm9yIChsZXQga2V5IGluIHRoaXMuaGFzaClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGNvbnN0IGhhc2ggPSB0aGlzLmhhc2hba2V5XVxyXG4gICAgICAgICAgICBpZiAoaGFzaC5sZW5ndGggPj0gbWluaW11bSlcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgaGFzaGVzLnB1c2goaGFzaClcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gaGFzaGVzXHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBnZXRzIGhhc2ggYm91bmRzXHJcbiAgICAgKiBAcGFyYW0ge0FBQkJ9IEFBQkJcclxuICAgICAqIEByZXR1cm4ge0JvdW5kc31cclxuICAgICAqIEBwcml2YXRlXHJcbiAgICAgKi9cclxuICAgIGdldEJvdW5kcyhBQUJCKVxyXG4gICAge1xyXG4gICAgICAgIGxldCB4U3RhcnQgPSBNYXRoLmZsb29yKEFBQkIueCAvIHRoaXMueFNpemUpXHJcbiAgICAgICAgbGV0IHlTdGFydCA9IE1hdGguZmxvb3IoQUFCQi55IC8gdGhpcy55U2l6ZSlcclxuICAgICAgICBsZXQgeEVuZCA9IE1hdGguZmxvb3IoKEFBQkIueCArIEFBQkIud2lkdGgpIC8gdGhpcy54U2l6ZSlcclxuICAgICAgICBsZXQgeUVuZCA9IE1hdGguZmxvb3IoKEFBQkIueSArIEFBQkIuaGVpZ2h0KSAvIHRoaXMueVNpemUpXHJcbiAgICAgICAgcmV0dXJuIHsgeFN0YXJ0LCB5U3RhcnQsIHhFbmQsIHlFbmQgfVxyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogaW5zZXJ0IG9iamVjdCBpbnRvIHRoZSBzcGF0aWFsIGhhc2hcclxuICAgICAqIGF1dG9tYXRpY2FsbHkgY2FsbGVkIGZyb20gdXBkYXRlT2JqZWN0KClcclxuICAgICAqIEBwYXJhbSB7Kn0gb2JqZWN0XHJcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30ga2V5XHJcbiAgICAgKi9cclxuICAgIGluc2VydChvYmplY3QsIGtleSlcclxuICAgIHtcclxuICAgICAgICBpZiAoIXRoaXMuaGFzaFtrZXldKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhpcy5oYXNoW2tleV0gPSBbb2JqZWN0XVxyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aGlzLmhhc2hba2V5XS5wdXNoKG9iamVjdClcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiByZW1vdmVzIG9iamVjdCBmcm9tIHRoZSBoYXNoIHRhYmxlXHJcbiAgICAgKiBzaG91bGQgYmUgY2FsbGVkIHdoZW4gcmVtb3ZpbmcgYW4gb2JqZWN0XHJcbiAgICAgKiBhdXRvbWF0aWNhbGx5IGNhbGxlZCBmcm9tIHVwZGF0ZU9iamVjdCgpXHJcbiAgICAgKiBAcGFyYW0ge29iamVjdH0gb2JqZWN0XHJcbiAgICAgKi9cclxuICAgIHJlbW92ZUZyb21IYXNoKG9iamVjdClcclxuICAgIHtcclxuICAgICAgICBjb25zdCBzcGF0aWFsID0gb2JqZWN0W3RoaXMuc3BhdGlhbF1cclxuICAgICAgICB3aGlsZSAoc3BhdGlhbC5oYXNoZXMubGVuZ3RoKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgY29uc3Qga2V5ID0gc3BhdGlhbC5oYXNoZXMucG9wKClcclxuICAgICAgICAgICAgY29uc3QgbGlzdCA9IHRoaXMuaGFzaFtrZXldXHJcbiAgICAgICAgICAgIGxpc3Quc3BsaWNlKGxpc3QuaW5kZXhPZihvYmplY3QpLCAxKVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIGdldCBhbGwgbmVpZ2hib3JzIHRoYXQgc2hhcmUgdGhlIHNhbWUgaGFzaCBhcyBvYmplY3RcclxuICAgICAqIEBwYXJhbSB7Kn0gb2JqZWN0IGluIHRoZSBzcGF0aWFsIGhhc2hcclxuICAgICAqIEByZXR1cm4ge0FycmF5fSBvZiBvYmplY3RzIHRoYXQgYXJlIGluIHRoZSBzYW1lIGhhc2ggYXMgb2JqZWN0XHJcbiAgICAgKi9cclxuICAgIG5laWdoYm9ycyhvYmplY3QpXHJcbiAgICB7XHJcbiAgICAgICAgbGV0IHJlc3VsdHMgPSBbXVxyXG4gICAgICAgIG9iamVjdFt0aGlzLnNwYXRpYWxdLmhhc2hlcy5mb3JFYWNoKGtleSA9PiByZXN1bHRzID0gcmVzdWx0cy5jb25jYXQodGhpcy5oYXNoW2tleV0pKVxyXG4gICAgICAgIHJldHVybiByZXN1bHRzXHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiByZXR1cm5zIGFuIGFycmF5IG9mIG9iamVjdHMgY29udGFpbmVkIHdpdGhpbiBib3VuZGluZyBib3hcclxuICAgICAqIEBwYXJhbSB7QUFCQn0gQUFCQiBib3VuZGluZyBib3ggdG8gc2VhcmNoXHJcbiAgICAgKiBAcGFyYW0ge2Jvb2xlYW59IFtzaW1wbGVUZXN0PXRydWVdIHBlcmZvcm0gYSBzaW1wbGUgYm91bmRzIGNoZWNrIG9mIGFsbCBpdGVtcyBpbiB0aGUgYnVja2V0c1xyXG4gICAgICogQHJldHVybiB7b2JqZWN0W119IHNlYXJjaCByZXN1bHRzXHJcbiAgICAgKi9cclxuICAgIHF1ZXJ5KEFBQkIsIHNpbXBsZVRlc3QpXHJcbiAgICB7XHJcbiAgICAgICAgc2ltcGxlVGVzdCA9IHR5cGVvZiBzaW1wbGVUZXN0ICE9PSAndW5kZWZpbmVkJyA/IHNpbXBsZVRlc3QgOiB0cnVlXHJcbiAgICAgICAgbGV0IGJ1Y2tldHMgPSAwXHJcbiAgICAgICAgbGV0IHJlc3VsdHMgPSBbXVxyXG4gICAgICAgIGNvbnN0IHsgeFN0YXJ0LCB5U3RhcnQsIHhFbmQsIHlFbmQgfSA9IHRoaXMuZ2V0Qm91bmRzKEFBQkIpXHJcbiAgICAgICAgZm9yIChsZXQgeSA9IHlTdGFydDsgeSA8PSB5RW5kOyB5KyspXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBmb3IgKGxldCB4ID0geFN0YXJ0OyB4IDw9IHhFbmQ7IHgrKylcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgY29uc3QgZW50cnkgPSB0aGlzLmhhc2hbeCArICcsJyArIHldXHJcbiAgICAgICAgICAgICAgICBpZiAoZW50cnkpXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHNpbXBsZVRlc3QpXHJcbiAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBmb3IgKGxldCBvYmplY3Qgb2YgZW50cnkpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGJveCA9IG9iamVjdFt0aGlzLkFBQkJdXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoYm94LnggKyBib3gud2lkdGggPiBBQUJCLnggJiYgYm94LnggPCBBQUJCLnggKyBBQUJCLndpZHRoICYmXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBib3gueSArIGJveC5oZWlnaHQgPiBBQUJCLnkgJiYgYm94LnkgPCBBQUJCLnkgKyBBQUJCLmhlaWdodClcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXN1bHRzLnB1c2gob2JqZWN0KVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdHMgPSByZXN1bHRzLmNvbmNhdChlbnRyeSlcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgYnVja2V0cysrXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy5sYXN0QnVja2V0cyA9IGJ1Y2tldHNcclxuICAgICAgICByZXR1cm4gcmVzdWx0c1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogaXRlcmF0ZXMgdGhyb3VnaCBvYmplY3RzIGNvbnRhaW5lZCB3aXRoaW4gYm91bmRpbmcgYm94XHJcbiAgICAgKiBzdG9wcyBpdGVyYXRpbmcgaWYgdGhlIGNhbGxiYWNrIHJldHVybnMgdHJ1ZVxyXG4gICAgICogQHBhcmFtIHtBQUJCfSBBQUJCIGJvdW5kaW5nIGJveCB0byBzZWFyY2hcclxuICAgICAqIEBwYXJhbSB7ZnVuY3Rpb259IGNhbGxiYWNrXHJcbiAgICAgKiBAcGFyYW0ge2Jvb2xlYW59IFtzaW1wbGVUZXN0PXRydWVdIHBlcmZvcm0gYSBzaW1wbGUgYm91bmRzIGNoZWNrIG9mIGFsbCBpdGVtcyBpbiB0aGUgYnVja2V0c1xyXG4gICAgICogQHJldHVybiB7Ym9vbGVhbn0gdHJ1ZSBpZiBjYWxsYmFjayByZXR1cm5lZCBlYXJseVxyXG4gICAgICovXHJcbiAgICBxdWVyeUNhbGxiYWNrKEFBQkIsIGNhbGxiYWNrLCBzaW1wbGVUZXN0KVxyXG4gICAge1xyXG4gICAgICAgIHNpbXBsZVRlc3QgPSB0eXBlb2Ygc2ltcGxlVGVzdCAhPT0gJ3VuZGVmaW5lZCcgPyBzaW1wbGVUZXN0IDogdHJ1ZVxyXG4gICAgICAgIGNvbnN0IHsgeFN0YXJ0LCB5U3RhcnQsIHhFbmQsIHlFbmQgfSA9IHRoaXMuZ2V0Qm91bmRzKEFBQkIpXHJcbiAgICAgICAgZm9yIChsZXQgeSA9IHlTdGFydDsgeSA8PSB5RW5kOyB5KyspXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBmb3IgKGxldCB4ID0geFN0YXJ0OyB4IDw9IHhFbmQ7IHgrKylcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgY29uc3QgZW50cnkgPSB0aGlzLmhhc2hbeCArICcsJyArIHldXHJcbiAgICAgICAgICAgICAgICBpZiAoZW50cnkpXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBlbnRyeS5sZW5ndGg7IGkrKylcclxuICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IG9iamVjdCA9IGVudHJ5W2ldXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChzaW1wbGVUZXN0KVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBBQUJCID0gb2JqZWN0LkFBQkJcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChBQUJCLnggKyBBQUJCLndpZHRoID4gQUFCQi54ICYmIEFBQkIueCA8IEFBQkIueCArIEFBQkIud2lkdGggJiZcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIEFBQkIueSArIEFBQkIuaGVpZ2h0ID4gQUFCQi55ICYmIEFBQkIueSA8IEFBQkIueSArIEFBQkIuaGVpZ2h0KVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChjYWxsYmFjayhvYmplY3QpKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWVcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoY2FsbGJhY2sob2JqZWN0KSlcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBmYWxzZVxyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogZ2V0IHN0YXRzXHJcbiAgICAgKiBAcmV0dXJuIHtTdGF0c31cclxuICAgICAqL1xyXG4gICAgc3RhdHMoKVxyXG4gICAge1xyXG4gICAgICAgIGxldCB2aXNpYmxlID0gMCwgY291bnQgPSAwXHJcbiAgICAgICAgZm9yIChsZXQgbGlzdCBvZiB0aGlzLmxpc3RzKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgbGlzdC5mb3JFYWNoKG9iamVjdCA9PlxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICB2aXNpYmxlICs9IG9iamVjdC52aXNpYmxlID8gMSA6IDBcclxuICAgICAgICAgICAgICAgIGNvdW50KytcclxuICAgICAgICAgICAgfSlcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgIHRvdGFsOiBjb3VudCxcclxuICAgICAgICAgICAgdmlzaWJsZSxcclxuICAgICAgICAgICAgY3VsbGVkOiBjb3VudCAtIHZpc2libGVcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBoZWxwZXIgZnVuY3Rpb24gdG8gZXZhbHVhdGUgaGFzaCB0YWJsZVxyXG4gICAgICogQHJldHVybiB7bnVtYmVyfSB0aGUgbnVtYmVyIG9mIGJ1Y2tldHMgaW4gdGhlIGhhc2ggdGFibGVcclxuICAgICAqICovXHJcbiAgICBnZXROdW1iZXJPZkJ1Y2tldHMoKVxyXG4gICAge1xyXG4gICAgICAgIHJldHVybiBPYmplY3Qua2V5cyh0aGlzLmhhc2gpLmxlbmd0aFxyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogaGVscGVyIGZ1bmN0aW9uIHRvIGV2YWx1YXRlIGhhc2ggdGFibGVcclxuICAgICAqIEByZXR1cm4ge251bWJlcn0gdGhlIGF2ZXJhZ2UgbnVtYmVyIG9mIGVudHJpZXMgaW4gZWFjaCBidWNrZXRcclxuICAgICAqL1xyXG4gICAgZ2V0QXZlcmFnZVNpemUoKVxyXG4gICAge1xyXG4gICAgICAgIGxldCB0b3RhbCA9IDBcclxuICAgICAgICBmb3IgKGxldCBrZXkgaW4gdGhpcy5oYXNoKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdG90YWwgKz0gdGhpcy5oYXNoW2tleV0ubGVuZ3RoXHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiB0b3RhbCAvIHRoaXMuZ2V0QnVja2V0cygpXHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBoZWxwZXIgZnVuY3Rpb24gdG8gZXZhbHVhdGUgdGhlIGhhc2ggdGFibGVcclxuICAgICAqIEByZXR1cm4ge251bWJlcn0gdGhlIGxhcmdlc3Qgc2l6ZWQgYnVja2V0XHJcbiAgICAgKi9cclxuICAgIGdldExhcmdlc3QoKVxyXG4gICAge1xyXG4gICAgICAgIGxldCBsYXJnZXN0ID0gMFxyXG4gICAgICAgIGZvciAobGV0IGtleSBpbiB0aGlzLmhhc2gpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBpZiAodGhpcy5oYXNoW2tleV0ubGVuZ3RoID4gbGFyZ2VzdClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgbGFyZ2VzdCA9IHRoaXMuaGFzaFtrZXldLmxlbmd0aFxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBsYXJnZXN0XHJcbiAgICB9XHJcblxyXG4gICAgLyoqIGhlbHBlciBmdW5jdGlvbiB0byBldmFsdXRlIHRoZSBoYXNoIHRhYmxlXHJcbiAgICAgKiBAcGFyYW0ge0FBQkJ9IEFBQkIgYm91bmRpbmcgYm94IHRvIHNlYXJjaFxyXG4gICAgICogQHJldHVybiB7bnVtYmVyfSBzcGFyc2VuZXNzIHBlcmNlbnRhZ2UgKGkuZS4sIGJ1Y2tldHMgd2l0aCBhdCBsZWFzdCAxIGVsZW1lbnQgZGl2aWRlZCBieSB0b3RhbCBwb3NzaWJsZSBidWNrZXRzKVxyXG4gICAgICovXHJcbiAgICBnZXRTcGFyc2VuZXNzKEFBQkIpXHJcbiAgICB7XHJcbiAgICAgICAgbGV0IGNvdW50ID0gMCwgdG90YWwgPSAwXHJcbiAgICAgICAgY29uc3QgeyB4U3RhcnQsIHlTdGFydCwgeEVuZCwgeUVuZCB9ID0gdGhpcy5nZXRCb3VuZHMoQUFCQilcclxuICAgICAgICBmb3IgKGxldCB5ID0geVN0YXJ0OyB5IDwgeUVuZDsgeSsrKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgZm9yIChsZXQgeCA9IHhTdGFydDsgeCA8IHhFbmQ7IHgrKylcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgY291bnQgKz0gKHRoaXMuaGFzaFt4ICsgJywnICsgeV0gPyAxIDogMClcclxuICAgICAgICAgICAgICAgIHRvdGFsKytcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gY291bnQgLyB0b3RhbFxyXG4gICAgfVxyXG59XHJcblxyXG4vKipcclxuICogQHR5cGVkZWYge29iamVjdH0gU3RhdHNcclxuICogQHByb3BlcnR5IHtudW1iZXJ9IHRvdGFsXHJcbiAqIEBwcm9wZXJ0eSB7bnVtYmVyfSB2aXNpYmxlXHJcbiAqIEBwcm9wZXJ0eSB7bnVtYmVyfSBjdWxsZWRcclxuICovXHJcblxyXG4vKipcclxuICogQHR5cGVkZWYge29iamVjdH0gQm91bmRzXHJcbiAqIEBwcm9wZXJ0eSB7bnVtYmVyfSB4U3RhcnRcclxuICogQHByb3BlcnR5IHtudW1iZXJ9IHlTdGFydFxyXG4gKiBAcHJvcGVydHkge251bWJlcn0geEVuZFxyXG4gKiBAcHJvcGVydHkge251bWJlcn0geEVuZFxyXG4gKi9cclxuXHJcbi8qKlxyXG4gICogQHR5cGVkZWYge29iamVjdH0gQUFCQlxyXG4gICogQHByb3BlcnR5IHtudW1iZXJ9IHhcclxuICAqIEBwcm9wZXJ0eSB7bnVtYmVyfSB5XHJcbiAgKiBAcHJvcGVydHkge251bWJlcn0gd2lkdGhcclxuICAqIEBwcm9wZXJ0eSB7bnVtYmVyfSBoZWlnaHRcclxuICAqL1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBTcGF0aWFsSGFzaCJdfQ==