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
            if (!object[this.spatial]) {
                object[this.spatial] = { hashes: [] };
            }
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

                    if (!object[this.spatial]) {
                        object[this.spatial] = { hashes: [] };
                    }
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
         * gets hash bounds
         * @param {AABB} AABB
         * @return {Bounds}
         * @private
         */

    }, {
        key: 'getBounds',
        value: function getBounds(AABB) {
            var xStart = Math.floor(AABB.x / this.xSize);
            xStart = xStart < 0 ? 0 : xStart;
            var yStart = Math.floor(AABB.y / this.ySize);
            yStart = yStart < 0 ? 0 : yStart;
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

                                    var box = object.AABB;
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
        key: 'getBuckets',
        value: function getBuckets() {
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL2NvZGUvc3BhdGlhbC1oYXNoLmpzIl0sIm5hbWVzIjpbIlNwYXRpYWxIYXNoIiwib3B0aW9ucyIsInhTaXplIiwic2l6ZSIsInlTaXplIiwiQUFCQiIsInR5cGUiLCJzcGF0aWFsIiwiY2FsY3VsYXRlUElYSSIsInZpc2libGVUZXh0IiwidmlzaWJsZVRlc3QiLCJzaW1wbGVUZXN0IiwiZGlydHlUZXN0IiwidmlzaWJsZSIsImRpcnR5Iiwid2lkdGgiLCJoZWlnaHQiLCJoYXNoIiwibGlzdHMiLCJvYmplY3QiLCJzdGF0aWNPYmplY3QiLCJoYXNoZXMiLCJ1cGRhdGVPYmplY3QiLCJwdXNoIiwic3BsaWNlIiwibGlzdCIsImluZGV4T2YiLCJyZW1vdmVGcm9tSGFzaCIsImFycmF5IiwiZm9yRWFjaCIsInNraXBVcGRhdGUiLCJ1cGRhdGVPYmplY3RzIiwiaW52aXNpYmxlIiwib2JqZWN0cyIsInF1ZXJ5IiwibGFzdEJ1Y2tldHMiLCJib3giLCJnZXRMb2NhbEJvdW5kcyIsIngiLCJzY2FsZSIsInkiLCJnZXRCb3VuZHMiLCJ4U3RhcnQiLCJ5U3RhcnQiLCJ4RW5kIiwieUVuZCIsImxlbmd0aCIsImtleSIsImluc2VydCIsIk1hdGgiLCJmbG9vciIsInBvcCIsImJ1Y2tldHMiLCJyZXN1bHRzIiwiZW50cnkiLCJjb25jYXQiLCJjYWxsYmFjayIsImkiLCJjb3VudCIsInRvdGFsIiwiY3VsbGVkIiwiT2JqZWN0Iiwia2V5cyIsImdldEJ1Y2tldHMiLCJsYXJnZXN0IiwibW9kdWxlIiwiZXhwb3J0cyJdLCJtYXBwaW5ncyI6Ijs7Ozs7O0FBQUE7QUFDQTtBQUNBOztJQUVNQSxXO0FBRUY7Ozs7Ozs7Ozs7Ozs7O0FBY0EseUJBQVlDLE9BQVosRUFDQTtBQUFBOztBQUNJQSxrQkFBVUEsV0FBVyxFQUFyQjtBQUNBLGFBQUtDLEtBQUwsR0FBYUQsUUFBUUMsS0FBUixJQUFpQkQsUUFBUUUsSUFBekIsSUFBaUMsSUFBOUM7QUFDQSxhQUFLQyxLQUFMLEdBQWFI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QUE2QixDQUF2QztBQUNBbUI7QUFDSDtBQUNKO0FBQ0QsbUJBQU9ELFFBQVFDLEtBQWY7QUFDSDs7Ozs7O0FBR0w7Ozs7Ozs7QUFPQTs7Ozs7Ozs7QUFRQTs7Ozs7Ozs7QUFRQU0sT0FBT0MsT0FBUCxHQUFpQmxFLFdBQWpCIiwiZmlsZSI6InNwYXRpYWwtaGFzaC5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDE4IFlPUEVZIFlPUEVZIExMQ1xyXG4vLyBEYXZpZCBGaWdhdG5lclxyXG4vLyBNSVQgTGljZW5zZVxyXG5cclxuY2xhc3MgU3BhdGlhbEhhc2hcclxue1xyXG4gICAgLyoqXHJcbiAgICAgKiBjcmVhdGVzIGEgc3BhdGlhbC1oYXNoIGN1bGxcclxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSBbb3B0aW9uc11cclxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSBbb3B0aW9ucy5zaXplPTEwMDBdIGNlbGwgc2l6ZSB1c2VkIHRvIGNyZWF0ZSBoYXNoICh4U2l6ZSA9IHlTaXplKVxyXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IFtvcHRpb25zLnhTaXplXSBob3Jpem9udGFsIGNlbGwgc2l6ZVxyXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IFtvcHRpb25zLnlTaXplXSB2ZXJ0aWNhbCBjZWxsIHNpemVcclxuICAgICAqIEBwYXJhbSB7Ym9vbGVhbn0gW29wdGlvbnMuY2FsY3VsYXRlUElYST10cnVlXSBjYWxjdWxhdGUgYm91bmRpbmcgYm94IGF1dG9tYXRpY2FsbHk7IGlmIHRoaXMgaXMgc2V0IHRvIGZhbHNlIHRoZW4gaXQgdXNlcyBvYmplY3Rbb3B0aW9ucy5BQUJCXSBmb3IgYm91bmRpbmcgYm94XHJcbiAgICAgKiBAcGFyYW0ge2Jvb2xlYW59IFtvcHRpb25zLnZpc2libGU9dmlzaWJsZV0gcGFyYW1ldGVyIG9mIHRoZSBvYmplY3QgdG8gc2V0ICh1c3VhbGx5IHZpc2libGUgb3IgcmVuZGVyYWJsZSlcclxuICAgICAqIEBwYXJhbSB7Ym9vbGVhbn0gW29wdGlvbnMuc2ltcGxlVGVzdD10cnVlXSBpdGVyYXRlIHRocm91Z2ggdmlzaWJsZSBidWNrZXRzIHRvIGNoZWNrIGZvciBib3VuZHNcclxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBbb3B0aW9ucy5kaXJ0eVRlc3Q9dHJ1ZV0gb25seSB1cGRhdGUgc3BhdGlhbCBoYXNoIGZvciBvYmplY3RzIHdpdGggb2JqZWN0W29wdGlvbnMuZGlydHlUZXN0XT10cnVlOyB0aGlzIGhhcyBhIEhVR0UgaW1wYWN0IG9uIHBlcmZvcm1hbmNlXHJcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gW29wdGlvbnMuQUFCQj1BQUJCXSBvYmplY3QgcHJvcGVydHkgdGhhdCBob2xkcyBib3VuZGluZyBib3ggc28gdGhhdCBvYmplY3RbdHlwZV0gPSB7IHg6IG51bWJlciwgeTogbnVtYmVyLCB3aWR0aDogbnVtYmVyLCBoZWlnaHQ6IG51bWJlciB9XHJcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gW29wdGlvbnMuc3BhdGlhbD1zcGF0aWFsXSBvYmplY3QgcHJvcGVydHkgdGhhdCBob2xkcyBvYmplY3QncyBoYXNoIGxpc3RcclxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBbb3B0aW9ucy5kaXJ0eT1kaXJ0eV0gb2JqZWN0IHByb3BlcnR5IGZvciBkaXJ0eVRlc3RcclxuICAgICAqL1xyXG4gICAgY29uc3RydWN0b3Iob3B0aW9ucylcclxuICAgIHtcclxuICAgICAgICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fVxyXG4gICAgICAgIHRoaXMueFNpemUgPSBvcHRpb25zLnhTaXplIHx8IG9wdGlvbnMuc2l6ZSB8fCAxMDAwXHJcbiAgICAgICAgdGhpcy55U2l6ZSA9IG9wdGlvbnMueVNpemUgfHwgb3B0aW9ucy5zaXplIHx8IDEwMDBcclxuICAgICAgICB0aGlzLkFBQkIgPSBvcHRpb25zLnR5cGUgfHwgJ0FBQkInXHJcbiAgICAgICAgdGhpcy5zcGF0aWFsID0gb3B0aW9ucy5zcGF0aWFsIHx8ICdzcGF0aWFsJ1xyXG4gICAgICAgIHRoaXMuY2FsY3VsYXRlUElYSSA9IHR5cGVvZiBvcHRpb25zLmNhbGN1bGF0ZVBJWEkgIT09ICd1bmRlZmluZWQnID8gb3B0aW9ucy5jYWxjdWxhdGVQSVhJIDogdHJ1ZVxyXG4gICAgICAgIHRoaXMudmlzaWJsZVRleHQgPSB0eXBlb2Ygb3B0aW9ucy52aXNpYmxlVGVzdCAhPT0gJ3VuZGVmaW5lZCcgPyBvcHRpb25zLnZpc2libGVUZXN0IDogdHJ1ZVxyXG4gICAgICAgIHRoaXMuc2ltcGxlVGVzdCA9IHR5cGVvZiBvcHRpb25zLnNpbXBsZVRlc3QgIT09ICd1bmRlZmluZWQnID8gb3B0aW9ucy5zaW1wbGVUZXN0IDogdHJ1ZVxyXG4gICAgICAgIHRoaXMuZGlydHlUZXN0ID0gdHlwZW9mIG9wdGlvbnMuZGlydHlUZXN0ICE9PSAndW5kZWZpbmVkJyA/IG9wdGlvbnMuZGlydHlUZXN0IDogdHJ1ZVxyXG4gICAgICAgIHRoaXMudmlzaWJsZSA9IG9wdGlvbnMudmlzaWJsZSB8fCAndmlzaWJsZSdcclxuICAgICAgICB0aGlzLmRpcnR5ID0gb3B0aW9ucy5kaXJ0eSB8fCAnZGlydHknXHJcbiAgICAgICAgdGhpcy53aWR0aCA9IHRoaXMuaGVpZ2h0ID0gMFxyXG4gICAgICAgIHRoaXMuaGFzaCA9IHt9XHJcbiAgICAgICAgdGhpcy5saXN0cyA9IFtbXV1cclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIGFkZCBhbiBvYmplY3QgdG8gYmUgY3VsbGVkXHJcbiAgICAgKiBzaWRlIGVmZmVjdDogYWRkcyBvYmplY3Quc3BhdGlhbEhhc2hlcyB0byB0cmFjayBleGlzdGluZyBoYXNoZXNcclxuICAgICAqIEBwYXJhbSB7Kn0gb2JqZWN0XHJcbiAgICAgKiBAcGFyYW0ge2Jvb2xlYW59IFtzdGF0aWNPYmplY3RdIHNldCB0byB0cnVlIGlmIHRoZSBvYmplY3QncyBwb3NpdGlvbi9zaXplIGRvZXMgbm90IGNoYW5nZVxyXG4gICAgICogQHJldHVybiB7Kn0gb2JqZWN0XHJcbiAgICAgKi9cclxuICAgIGFkZChvYmplY3QsIHN0YXRpY09iamVjdClcclxuICAgIHtcclxuICAgICAgICBpZiAoIW9iamVjdFt0aGlzLnNwYXRpYWxdKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgb2JqZWN0W3RoaXMuc3BhdGlhbF0gPSB7IGhhc2hlczogW10gfVxyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAodGhpcy5jYWxjdWxhdGVQSVhJICYmIHRoaXMuZGlydHlUZXN0KVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgb2JqZWN0W3RoaXMuZGlydHldID0gdHJ1ZVxyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAoc3RhdGljT2JqZWN0KVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgb2JqZWN0LnN0YXRpY09iamVjdCA9IHRydWVcclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy51cGRhdGVPYmplY3Qob2JqZWN0KVxyXG4gICAgICAgIHRoaXMubGlzdHNbMF0ucHVzaChvYmplY3QpXHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiByZW1vdmUgYW4gb2JqZWN0IGFkZGVkIGJ5IGFkZCgpXHJcbiAgICAgKiBAcGFyYW0geyp9IG9iamVjdFxyXG4gICAgICogQHJldHVybiB7Kn0gb2JqZWN0XHJcbiAgICAgKi9cclxuICAgIHJlbW92ZShvYmplY3QpXHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy5saXN0c1swXS5zcGxpY2UodGhpcy5saXN0WzBdLmluZGV4T2Yob2JqZWN0KSwgMSlcclxuICAgICAgICB0aGlzLnJlbW92ZUZyb21IYXNoKG9iamVjdClcclxuICAgICAgICByZXR1cm4gb2JqZWN0XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBhZGQgYW4gYXJyYXkgb2Ygb2JqZWN0cyB0byBiZSBjdWxsZWRcclxuICAgICAqIEBwYXJhbSB7QXJyYXl9IGFycmF5XHJcbiAgICAgKiBAcGFyYW0ge2Jvb2xlYW59IFtzdGF0aWNPYmplY3RdIHNldCB0byB0cnVlIGlmIHRoZSBvYmplY3RzIGluIHRoZSBsaXN0IHBvc2l0aW9uL3NpemUgZG9lcyBub3QgY2hhbmdlXHJcbiAgICAgKiBAcmV0dXJuIHtBcnJheX0gYXJyYXlcclxuICAgICAqL1xyXG4gICAgYWRkTGlzdChsaXN0LCBzdGF0aWNPYmplY3QpXHJcbiAgICB7XHJcbiAgICAgICAgZm9yIChsZXQgb2JqZWN0IG9mIGxpc3QpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBpZiAoIW9iamVjdFt0aGlzLnNwYXRpYWxdKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBvYmplY3RbdGhpcy5zcGF0aWFsXSA9IHsgaGFzaGVzOiBbXSB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaWYgKHRoaXMuY2FsY3VsYXRlUElYSSAmJiB0aGlzLmRpcnR5VGVzdClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgb2JqZWN0W3RoaXMuZGlydHldID0gdHJ1ZVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGlmIChzdGF0aWNPYmplY3QpXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGxpc3Quc3RhdGljT2JqZWN0ID0gdHJ1ZVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHRoaXMudXBkYXRlT2JqZWN0KG9iamVjdClcclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy5saXN0cy5wdXNoKGxpc3QpXHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiByZW1vdmUgYW4gYXJyYXkgYWRkZWQgYnkgYWRkTGlzdCgpXHJcbiAgICAgKiBAcGFyYW0ge0FycmF5fSBhcnJheVxyXG4gICAgICogQHJldHVybiB7QXJyYXl9IGFycmF5XHJcbiAgICAgKi9cclxuICAgIHJlbW92ZUxpc3QoYXJyYXkpXHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy5saXN0cy5zcGxpY2UodGhpcy5saXN0cy5pbmRleE9mKGFycmF5KSwgMSlcclxuICAgICAgICBhcnJheS5mb3JFYWNoKG9iamVjdCA9PiB0aGlzLnJlbW92ZUZyb21IYXNoKG9iamVjdCkpXHJcbiAgICAgICAgcmV0dXJuIGFycmF5XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiB1cGRhdGUgdGhlIGhhc2hlcyBhbmQgY3VsbCB0aGUgaXRlbXMgaW4gdGhlIGxpc3RcclxuICAgICAqIEBwYXJhbSB7QUFCQn0gQUFCQlxyXG4gICAgICogQHBhcmFtIHtib29sZWFufSBbc2tpcFVwZGF0ZV0gc2tpcCB1cGRhdGluZyB0aGUgaGFzaGVzIG9mIGFsbCBvYmplY3RzXHJcbiAgICAgKiBAcmV0dXJuIHtudW1iZXJ9IG51bWJlciBvZiBidWNrZXRzIGluIHJlc3VsdHNcclxuICAgICAqL1xyXG4gICAgY3VsbChBQUJCLCBza2lwVXBkYXRlKVxyXG4gICAge1xyXG4gICAgICAgIGlmICghc2tpcFVwZGF0ZSlcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRoaXMudXBkYXRlT2JqZWN0cygpXHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMuaW52aXNpYmxlKClcclxuICAgICAgICBjb25zdCBvYmplY3RzID0gdGhpcy5xdWVyeShBQUJCLCB0aGlzLnNpbXBsZVRlc3QpXHJcbiAgICAgICAgb2JqZWN0cy5mb3JFYWNoKG9iamVjdCA9PiBvYmplY3RbdGhpcy52aXNpYmxlXSA9IHRydWUpXHJcbiAgICAgICAgcmV0dXJuIHRoaXMubGFzdEJ1Y2tldHNcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIHNldCBhbGwgb2JqZWN0cyBpbiBoYXNoIHRvIHZpc2libGU9ZmFsc2VcclxuICAgICAqL1xyXG4gICAgaW52aXNpYmxlKClcclxuICAgIHtcclxuICAgICAgICBmb3IgKGxldCBsaXN0IG9mIHRoaXMubGlzdHMpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBsaXN0LmZvckVhY2gob2JqZWN0ID0+IG9iamVjdFt0aGlzLnZpc2libGVdID0gZmFsc2UpXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogdXBkYXRlIHRoZSBoYXNoZXMgZm9yIGFsbCBvYmplY3RzXHJcbiAgICAgKiBhdXRvbWF0aWNhbGx5IGNhbGxlZCBmcm9tIHVwZGF0ZSgpIHdoZW4gc2tpcFVwZGF0ZT1mYWxzZVxyXG4gICAgICovXHJcbiAgICB1cGRhdGVPYmplY3RzKClcclxuICAgIHtcclxuICAgICAgICBpZiAodGhpcy5kaXJ0eVRlc3QpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBmb3IgKGxldCBsaXN0IG9mIHRoaXMubGlzdHMpXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGZvciAobGV0IG9iamVjdCBvZiBsaXN0KVxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChvYmplY3RbdGhpcy5kaXJ0eV0pXHJcbiAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnVwZGF0ZU9iamVjdChvYmplY3QpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG9iamVjdFt0aGlzLmRpcnR5XSA9IGZhbHNlXHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2VcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGZvciAobGV0IGxpc3Qgb2YgdGhpcy5saXN0cylcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgbGlzdC5mb3JFYWNoKG9iamVjdCA9PiB0aGlzLnVwZGF0ZU9iamVjdChvYmplY3QpKVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogdXBkYXRlIHRoZSBoYXMgb2YgYW4gb2JqZWN0XHJcbiAgICAgKiBhdXRvbWF0aWNhbGx5IGNhbGxlZCBmcm9tIHVwZGF0ZU9iamVjdHMoKVxyXG4gICAgICogQHBhcmFtIHsqfSBvYmplY3RcclxuICAgICAqIEBwYXJhbSB7Ym9vbGVhbn0gW2ZvcmNlXSBmb3JjZSB1cGRhdGUgZm9yIGNhbGN1bGF0ZVBJWElcclxuICAgICAqL1xyXG4gICAgdXBkYXRlT2JqZWN0KG9iamVjdClcclxuICAgIHtcclxuICAgICAgICBsZXQgQUFCQlxyXG4gICAgICAgIGlmICh0aGlzLmNhbGN1bGF0ZVBJWEkpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBjb25zdCBib3ggPSBvYmplY3QuZ2V0TG9jYWxCb3VuZHMoKVxyXG4gICAgICAgICAgICBBQUJCID0gb2JqZWN0W3RoaXMuQUFCQl0gPSB7XHJcbiAgICAgICAgICAgICAgICB4OiBvYmplY3QueCArIGJveC54ICogb2JqZWN0LnNjYWxlLngsXHJcbiAgICAgICAgICAgICAgICB5OiBvYmplY3QueSArIGJveC55ICogb2JqZWN0LnNjYWxlLnksXHJcbiAgICAgICAgICAgICAgICB3aWR0aDogYm94LndpZHRoICogb2JqZWN0LnNjYWxlLngsXHJcbiAgICAgICAgICAgICAgICBoZWlnaHQ6IGJveC5oZWlnaHQgKiBvYmplY3Quc2NhbGUueVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2VcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIEFBQkIgPSBvYmplY3RbdGhpcy5BQUJCXVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgY29uc3Qgc3BhdGlhbCA9IG9iamVjdFt0aGlzLnNwYXRpYWxdXHJcbiAgICAgICAgY29uc3QgeyB4U3RhcnQsIHlTdGFydCwgeEVuZCwgeUVuZCB9ID0gdGhpcy5nZXRCb3VuZHMoQUFCQilcclxuXHJcbiAgICAgICAgLy8gb25seSByZW1vdmUgYW5kIGluc2VydCBpZiBtYXBwaW5nIGhhcyBjaGFuZ2VkXHJcbiAgICAgICAgaWYgKHNwYXRpYWwueFN0YXJ0ICE9PSB4U3RhcnQgfHwgc3BhdGlhbC55U3RhcnQgIT09IHlTdGFydCB8fCBzcGF0aWFsLnhFbmQgIT09IHhFbmQgfHwgc3BhdGlhbC55RW5kICE9PSB5RW5kKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgaWYgKHNwYXRpYWwuaGFzaGVzLmxlbmd0aClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5yZW1vdmVGcm9tSGFzaChvYmplY3QpXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZm9yIChsZXQgeSA9IHlTdGFydDsgeSA8PSB5RW5kOyB5KyspXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGZvciAobGV0IHggPSB4U3RhcnQ7IHggPD0geEVuZDsgeCsrKVxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGtleSA9IHggKyAnLCcgKyB5XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5pbnNlcnQob2JqZWN0LCBrZXkpXHJcbiAgICAgICAgICAgICAgICAgICAgc3BhdGlhbC5oYXNoZXMucHVzaChrZXkpXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgc3BhdGlhbC54U3RhcnQgPSB4U3RhcnRcclxuICAgICAgICAgICAgc3BhdGlhbC55U3RhcnQgPSB5U3RhcnRcclxuICAgICAgICAgICAgc3BhdGlhbC54RW5kID0geEVuZFxyXG4gICAgICAgICAgICBzcGF0aWFsLnlFbmQgPSB5RW5kXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogZ2V0cyBoYXNoIGJvdW5kc1xyXG4gICAgICogQHBhcmFtIHtBQUJCfSBBQUJCXHJcbiAgICAgKiBAcmV0dXJuIHtCb3VuZHN9XHJcbiAgICAgKiBAcHJpdmF0ZVxyXG4gICAgICovXHJcbiAgICBnZXRCb3VuZHMoQUFCQilcclxuICAgIHtcclxuICAgICAgICBsZXQgeFN0YXJ0ID0gTWF0aC5mbG9vcihBQUJCLnggLyB0aGlzLnhTaXplKVxyXG4gICAgICAgIHhTdGFydCA9IHhTdGFydCA8IDAgPyAwIDogeFN0YXJ0XHJcbiAgICAgICAgbGV0IHlTdGFydCA9IE1hdGguZmxvb3IoQUFCQi55IC8gdGhpcy55U2l6ZSlcclxuICAgICAgICB5U3RhcnQgPSB5U3RhcnQgPCAwID8gMCA6IHlTdGFydFxyXG4gICAgICAgIGxldCB4RW5kID0gTWF0aC5mbG9vcigoQUFCQi54ICsgQUFCQi53aWR0aCkgLyB0aGlzLnhTaXplKVxyXG4gICAgICAgIGxldCB5RW5kID0gTWF0aC5mbG9vcigoQUFCQi55ICsgQUFCQi5oZWlnaHQpIC8gdGhpcy55U2l6ZSlcclxuICAgICAgICByZXR1cm4geyB4U3RhcnQsIHlTdGFydCwgeEVuZCwgeUVuZCB9XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBpbnNlcnQgb2JqZWN0IGludG8gdGhlIHNwYXRpYWwgaGFzaFxyXG4gICAgICogYXV0b21hdGljYWxseSBjYWxsZWQgZnJvbSB1cGRhdGVPYmplY3QoKVxyXG4gICAgICogQHBhcmFtIHsqfSBvYmplY3RcclxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBrZXlcclxuICAgICAqL1xyXG4gICAgaW5zZXJ0KG9iamVjdCwga2V5KVxyXG4gICAge1xyXG4gICAgICAgIGlmICghdGhpcy5oYXNoW2tleV0pXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aGlzLmhhc2hba2V5XSA9IFtvYmplY3RdXHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2VcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRoaXMuaGFzaFtrZXldLnB1c2gob2JqZWN0KVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIHJlbW92ZXMgb2JqZWN0IGZyb20gdGhlIGhhc2ggdGFibGVcclxuICAgICAqIHNob3VsZCBiZSBjYWxsZWQgd2hlbiByZW1vdmluZyBhbiBvYmplY3RcclxuICAgICAqIGF1dG9tYXRpY2FsbHkgY2FsbGVkIGZyb20gdXBkYXRlT2JqZWN0KClcclxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSBvYmplY3RcclxuICAgICAqL1xyXG4gICAgcmVtb3ZlRnJvbUhhc2gob2JqZWN0KVxyXG4gICAge1xyXG4gICAgICAgIGNvbnN0IHNwYXRpYWwgPSBvYmplY3RbdGhpcy5zcGF0aWFsXVxyXG4gICAgICAgIHdoaWxlIChzcGF0aWFsLmhhc2hlcy5sZW5ndGgpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBjb25zdCBrZXkgPSBzcGF0aWFsLmhhc2hlcy5wb3AoKVxyXG4gICAgICAgICAgICBjb25zdCBsaXN0ID0gdGhpcy5oYXNoW2tleV1cclxuICAgICAgICAgICAgbGlzdC5zcGxpY2UobGlzdC5pbmRleE9mKG9iamVjdCksIDEpXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogcmV0dXJucyBhbiBhcnJheSBvZiBvYmplY3RzIGNvbnRhaW5lZCB3aXRoaW4gYm91bmRpbmcgYm94XHJcbiAgICAgKiBAcGFyYW0ge0FBQkJ9IEFBQkIgYm91bmRpbmcgYm94IHRvIHNlYXJjaFxyXG4gICAgICogQHBhcmFtIHtib29sZWFufSBbc2ltcGxlVGVzdD10cnVlXSBwZXJmb3JtIGEgc2ltcGxlIGJvdW5kcyBjaGVjayBvZiBhbGwgaXRlbXMgaW4gdGhlIGJ1Y2tldHNcclxuICAgICAqIEByZXR1cm4ge29iamVjdFtdfSBzZWFyY2ggcmVzdWx0c1xyXG4gICAgICovXHJcbiAgICBxdWVyeShBQUJCLCBzaW1wbGVUZXN0KVxyXG4gICAge1xyXG4gICAgICAgIHNpbXBsZVRlc3QgPSB0eXBlb2Ygc2ltcGxlVGVzdCAhPT0gJ3VuZGVmaW5lZCcgPyBzaW1wbGVUZXN0IDogdHJ1ZVxyXG4gICAgICAgIGxldCBidWNrZXRzID0gMFxyXG4gICAgICAgIGxldCByZXN1bHRzID0gW11cclxuICAgICAgICBjb25zdCB7IHhTdGFydCwgeVN0YXJ0LCB4RW5kLCB5RW5kIH0gPSB0aGlzLmdldEJvdW5kcyhBQUJCKVxyXG4gICAgICAgIGZvciAobGV0IHkgPSB5U3RhcnQ7IHkgPD0geUVuZDsgeSsrKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgZm9yIChsZXQgeCA9IHhTdGFydDsgeCA8PSB4RW5kOyB4KyspXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IGVudHJ5ID0gdGhpcy5oYXNoW3ggKyAnLCcgKyB5XVxyXG4gICAgICAgICAgICAgICAgaWYgKGVudHJ5KVxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChzaW1wbGVUZXN0KVxyXG4gICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZm9yIChsZXQgb2JqZWN0IG9mIGVudHJ5KVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBib3ggPSBvYmplY3QuQUFCQlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGJveC54ICsgYm94LndpZHRoID4gQUFCQi54ICYmIGJveC54IDwgQUFCQi54ICsgQUFCQi53aWR0aCAmJlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYm94LnkgKyBib3guaGVpZ2h0ID4gQUFCQi55ICYmIGJveC55IDwgQUFCQi55ICsgQUFCQi5oZWlnaHQpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0cy5wdXNoKG9iamVjdClcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXN1bHRzID0gcmVzdWx0cy5jb25jYXQoZW50cnkpXHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIGJ1Y2tldHMrK1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMubGFzdEJ1Y2tldHMgPSBidWNrZXRzXHJcbiAgICAgICAgcmV0dXJuIHJlc3VsdHNcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIGl0ZXJhdGVzIHRocm91Z2ggb2JqZWN0cyBjb250YWluZWQgd2l0aGluIGJvdW5kaW5nIGJveFxyXG4gICAgICogc3RvcHMgaXRlcmF0aW5nIGlmIHRoZSBjYWxsYmFjayByZXR1cm5zIHRydWVcclxuICAgICAqIEBwYXJhbSB7QUFCQn0gQUFCQiBib3VuZGluZyBib3ggdG8gc2VhcmNoXHJcbiAgICAgKiBAcGFyYW0ge2Z1bmN0aW9ufSBjYWxsYmFja1xyXG4gICAgICogQHBhcmFtIHtib29sZWFufSBbc2ltcGxlVGVzdD10cnVlXSBwZXJmb3JtIGEgc2ltcGxlIGJvdW5kcyBjaGVjayBvZiBhbGwgaXRlbXMgaW4gdGhlIGJ1Y2tldHNcclxuICAgICAqIEByZXR1cm4ge2Jvb2xlYW59IHRydWUgaWYgY2FsbGJhY2sgcmV0dXJuZWQgZWFybHlcclxuICAgICAqL1xyXG4gICAgcXVlcnlDYWxsYmFjayhBQUJCLCBjYWxsYmFjaywgc2ltcGxlVGVzdClcclxuICAgIHtcclxuICAgICAgICBzaW1wbGVUZXN0ID0gdHlwZW9mIHNpbXBsZVRlc3QgIT09ICd1bmRlZmluZWQnID8gc2ltcGxlVGVzdCA6IHRydWVcclxuICAgICAgICBjb25zdCB7IHhTdGFydCwgeVN0YXJ0LCB4RW5kLCB5RW5kIH0gPSB0aGlzLmdldEJvdW5kcyhBQUJCKVxyXG4gICAgICAgIGZvciAobGV0IHkgPSB5U3RhcnQ7IHkgPD0geUVuZDsgeSsrKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgZm9yIChsZXQgeCA9IHhTdGFydDsgeCA8PSB4RW5kOyB4KyspXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IGVudHJ5ID0gdGhpcy5oYXNoW3ggKyAnLCcgKyB5XVxyXG4gICAgICAgICAgICAgICAgaWYgKGVudHJ5KVxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZW50cnkubGVuZ3RoOyBpKyspXHJcbiAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBvYmplY3QgPSBlbnRyeVtpXVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoc2ltcGxlVGVzdClcclxuICAgICAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgQUFCQiA9IG9iamVjdC5BQUJCXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoQUFCQi54ICsgQUFCQi53aWR0aCA+IEFBQkIueCAmJiBBQUJCLnggPCBBQUJCLnggKyBBQUJCLndpZHRoICYmXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBBQUJCLnkgKyBBQUJCLmhlaWdodCA+IEFBQkIueSAmJiBBQUJCLnkgPCBBQUJCLnkgKyBBQUJCLmhlaWdodClcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoY2FsbGJhY2sob2JqZWN0KSlcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB0cnVlXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGNhbGxiYWNrKG9iamVjdCkpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWVcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gZmFsc2VcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIGdldCBzdGF0c1xyXG4gICAgICogQHJldHVybiB7U3RhdHN9XHJcbiAgICAgKi9cclxuICAgIHN0YXRzKClcclxuICAgIHtcclxuICAgICAgICBsZXQgdmlzaWJsZSA9IDAsIGNvdW50ID0gMFxyXG4gICAgICAgIGZvciAobGV0IGxpc3Qgb2YgdGhpcy5saXN0cylcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGxpc3QuZm9yRWFjaChvYmplY3QgPT5cclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgdmlzaWJsZSArPSBvYmplY3QudmlzaWJsZSA/IDEgOiAwXHJcbiAgICAgICAgICAgICAgICBjb3VudCsrXHJcbiAgICAgICAgICAgIH0pXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICB0b3RhbDogY291bnQsXHJcbiAgICAgICAgICAgIHZpc2libGUsXHJcbiAgICAgICAgICAgIGN1bGxlZDogY291bnQgLSB2aXNpYmxlXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogaGVscGVyIGZ1bmN0aW9uIHRvIGV2YWx1YXRlIGhhc2ggdGFibGVcclxuICAgICAqIEByZXR1cm4ge251bWJlcn0gdGhlIG51bWJlciBvZiBidWNrZXRzIGluIHRoZSBoYXNoIHRhYmxlXHJcbiAgICAgKiAqL1xyXG4gICAgZ2V0QnVja2V0cygpXHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuIE9iamVjdC5rZXlzKHRoaXMuaGFzaCkubGVuZ3RoXHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBoZWxwZXIgZnVuY3Rpb24gdG8gZXZhbHVhdGUgaGFzaCB0YWJsZVxyXG4gICAgICogQHJldHVybiB7bnVtYmVyfSB0aGUgYXZlcmFnZSBudW1iZXIgb2YgZW50cmllcyBpbiBlYWNoIGJ1Y2tldFxyXG4gICAgICovXHJcbiAgICBnZXRBdmVyYWdlU2l6ZSgpXHJcbiAgICB7XHJcbiAgICAgICAgbGV0IHRvdGFsID0gMFxyXG4gICAgICAgIGZvciAobGV0IGtleSBpbiB0aGlzLmhhc2gpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0b3RhbCArPSB0aGlzLmhhc2hba2V5XS5sZW5ndGhcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHRvdGFsIC8gdGhpcy5nZXRCdWNrZXRzKClcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIGhlbHBlciBmdW5jdGlvbiB0byBldmFsdWF0ZSB0aGUgaGFzaCB0YWJsZVxyXG4gICAgICogQHJldHVybiB7bnVtYmVyfSB0aGUgbGFyZ2VzdCBzaXplZCBidWNrZXRcclxuICAgICAqL1xyXG4gICAgZ2V0TGFyZ2VzdCgpXHJcbiAgICB7XHJcbiAgICAgICAgbGV0IGxhcmdlc3QgPSAwXHJcbiAgICAgICAgZm9yIChsZXQga2V5IGluIHRoaXMuaGFzaClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGlmICh0aGlzLmhhc2hba2V5XS5sZW5ndGggPiBsYXJnZXN0KVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBsYXJnZXN0ID0gdGhpcy5oYXNoW2tleV0ubGVuZ3RoXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIGxhcmdlc3RcclxuICAgIH1cclxuXHJcbiAgICAvKiogaGVscGVyIGZ1bmN0aW9uIHRvIGV2YWx1dGUgdGhlIGhhc2ggdGFibGVcclxuICAgICAqIEBwYXJhbSB7QUFCQn0gQUFCQiBib3VuZGluZyBib3ggdG8gc2VhcmNoXHJcbiAgICAgKiBAcmV0dXJuIHtudW1iZXJ9IHNwYXJzZW5lc3MgcGVyY2VudGFnZSAoaS5lLiwgYnVja2V0cyB3aXRoIGF0IGxlYXN0IDEgZWxlbWVudCBkaXZpZGVkIGJ5IHRvdGFsIHBvc3NpYmxlIGJ1Y2tldHMpXHJcbiAgICAgKi9cclxuICAgIGdldFNwYXJzZW5lc3MoQUFCQilcclxuICAgIHtcclxuICAgICAgICBsZXQgY291bnQgPSAwLCB0b3RhbCA9IDBcclxuICAgICAgICBjb25zdCB7IHhTdGFydCwgeVN0YXJ0LCB4RW5kLCB5RW5kIH0gPSB0aGlzLmdldEJvdW5kcyhBQUJCKVxyXG4gICAgICAgIGZvciAobGV0IHkgPSB5U3RhcnQ7IHkgPCB5RW5kOyB5KyspXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBmb3IgKGxldCB4ID0geFN0YXJ0OyB4IDwgeEVuZDsgeCsrKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBjb3VudCArPSAodGhpcy5oYXNoW3ggKyAnLCcgKyB5XSA/IDEgOiAwKVxyXG4gICAgICAgICAgICAgICAgdG90YWwrK1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBjb3VudCAvIHRvdGFsXHJcbiAgICB9XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBAdHlwZWRlZiB7b2JqZWN0fSBTdGF0c1xyXG4gKiBAcHJvcGVydHkge251bWJlcn0gdG90YWxcclxuICogQHByb3BlcnR5IHtudW1iZXJ9IHZpc2libGVcclxuICogQHByb3BlcnR5IHtudW1iZXJ9IGN1bGxlZFxyXG4gKi9cclxuXHJcbi8qKlxyXG4gKiBAdHlwZWRlZiB7b2JqZWN0fSBCb3VuZHNcclxuICogQHByb3BlcnR5IHtudW1iZXJ9IHhTdGFydFxyXG4gKiBAcHJvcGVydHkge251bWJlcn0geVN0YXJ0XHJcbiAqIEBwcm9wZXJ0eSB7bnVtYmVyfSB4RW5kXHJcbiAqIEBwcm9wZXJ0eSB7bnVtYmVyfSB4RW5kXHJcbiAqL1xyXG5cclxuLyoqXHJcbiAgKiBAdHlwZWRlZiB7b2JqZWN0fSBBQUJCXHJcbiAgKiBAcHJvcGVydHkge251bWJlcn0geFxyXG4gICogQHByb3BlcnR5IHtudW1iZXJ9IHlcclxuICAqIEBwcm9wZXJ0eSB7bnVtYmVyfSB3aWR0aFxyXG4gICogQHByb3BlcnR5IHtudW1iZXJ9IGhlaWdodFxyXG4gICovXHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFNwYXRpYWxIYXNoIl19