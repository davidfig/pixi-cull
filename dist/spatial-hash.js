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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL2NvZGUvc3BhdGlhbC1oYXNoLmpzIl0sIm5hbWVzIjpbIlNwYXRpYWxIYXNoIiwib3B0aW9ucyIsInhTaXplIiwic2l6ZSIsInlTaXplIiwiQUFCQiIsInR5cGUiLCJzcGF0aWFsIiwiY2FsY3VsYXRlUElYSSIsInZpc2libGVUZXh0IiwidmlzaWJsZVRlc3QiLCJzaW1wbGVUZXN0IiwiZGlydHlUZXN0IiwidmlzaWJsZSIsImRpcnR5Iiwid2lkdGgiLCJoZWlnaHQiLCJoYXNoIiwibGlzdHMiLCJvYmplY3QiLCJzdGF0aWNPYmplY3QiLCJoYXNoZXMiLCJ1cGRhdGVPYmplY3QiLCJwdXNoIiwic3BsaWNlIiwibGlzdCIsImluZGV4T2YiLCJyZW1vdmVGcm9tSGFzaCIsImFycmF5IiwiZm9yRWFjaCIsInNraXBVcGRhdGUiLCJ1cGRhdGVPYmplY3RzIiwiaW52aXNpYmxlIiwib2JqZWN0cyIsInF1ZXJ5IiwibGFzdEJ1Y2tldHMiLCJib3giLCJnZXRMb2NhbEJvdW5kcyIsIngiLCJzY2FsZSIsInkiLCJnZXRCb3VuZHMiLCJ4U3RhcnQiLCJ5U3RhcnQiLCJ4RW5kIiwieUVuZCIsImxlbmd0aCIsImtleSIsImluc2VydCIsIk1hdGgiLCJmbG9vciIsInBvcCIsInJlc3VsdHMiLCJjb25jYXQiLCJidWNrZXRzIiwiZW50cnkiLCJjYWxsYmFjayIsImkiLCJjb3VudCIsInRvdGFsIiwiY3VsbGVkIiwiT2JqZWN0Iiwia2V5cyIsImdldEJ1Y2tldHMiLCJsYXJnZXN0IiwibW9kdWxlIiwiZXhwb3J0cyJdLCJtYXBwaW5ncyI6Ijs7Ozs7O0FBQUE7QUFDQTtBQUNBOztJQUVNQSxXO0FBRUY7Ozs7Ozs7Ozs7Ozs7O0FBY0EseUJBQVlDLE9BQVosRUFDQTtBQUFBOztBQUNJQSxrQkFBVUEsV0FBVyxFQUFyQjtBQUNBLGFBQUtDLEtBQUwsR0FBYUQsUUFBUUMsS0FBUixJQUFpQkQsUUFBUUUsSUFBekIsSUFBaUMsSUFBOUM7QUFDQSxhQUFLQyxLQUFMLEdBQWFI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SUFBSSxHQUFKLEdBQVVFLENBQXBCLElBQXlCLENBQXpCLEdBQTZCLENBQXZDO0FBQ0FtQjtBQUNIO0FBQ0o7QUFDRCxtQkFBT0QsUUFBUUMsS0FBZjtBQUNIOzs7Ozs7QUFHTDs7Ozs7OztBQU9BOzs7Ozs7OztBQVFBOzs7Ozs7OztBQVFBTSxPQUFPQyxPQUFQLEdBQWlCbEUsV0FBakIiLCJmaWxlIjoic3BhdGlhbC1oYXNoLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMTggWU9QRVkgWU9QRVkgTExDXHJcbi8vIERhdmlkIEZpZ2F0bmVyXHJcbi8vIE1JVCBMaWNlbnNlXHJcblxyXG5jbGFzcyBTcGF0aWFsSGFzaFxyXG57XHJcbiAgICAvKipcclxuICAgICAqIGNyZWF0ZXMgYSBzcGF0aWFsLWhhc2ggY3VsbFxyXG4gICAgICogQHBhcmFtIHtvYmplY3R9IFtvcHRpb25zXVxyXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IFtvcHRpb25zLnNpemU9MTAwMF0gY2VsbCBzaXplIHVzZWQgdG8gY3JlYXRlIGhhc2ggKHhTaXplID0geVNpemUpXHJcbiAgICAgKiBAcGFyYW0ge251bWJlcn0gW29wdGlvbnMueFNpemVdIGhvcml6b250YWwgY2VsbCBzaXplXHJcbiAgICAgKiBAcGFyYW0ge251bWJlcn0gW29wdGlvbnMueVNpemVdIHZlcnRpY2FsIGNlbGwgc2l6ZVxyXG4gICAgICogQHBhcmFtIHtib29sZWFufSBbb3B0aW9ucy5jYWxjdWxhdGVQSVhJPXRydWVdIGNhbGN1bGF0ZSBib3VuZGluZyBib3ggYXV0b21hdGljYWxseTsgaWYgdGhpcyBpcyBzZXQgdG8gZmFsc2UgdGhlbiBpdCB1c2VzIG9iamVjdFtvcHRpb25zLkFBQkJdIGZvciBib3VuZGluZyBib3hcclxuICAgICAqIEBwYXJhbSB7Ym9vbGVhbn0gW29wdGlvbnMudmlzaWJsZT12aXNpYmxlXSBwYXJhbWV0ZXIgb2YgdGhlIG9iamVjdCB0byBzZXQgKHVzdWFsbHkgdmlzaWJsZSBvciByZW5kZXJhYmxlKVxyXG4gICAgICogQHBhcmFtIHtib29sZWFufSBbb3B0aW9ucy5zaW1wbGVUZXN0PXRydWVdIGl0ZXJhdGUgdGhyb3VnaCB2aXNpYmxlIGJ1Y2tldHMgdG8gY2hlY2sgZm9yIGJvdW5kc1xyXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IFtvcHRpb25zLmRpcnR5VGVzdD10cnVlXSBvbmx5IHVwZGF0ZSBzcGF0aWFsIGhhc2ggZm9yIG9iamVjdHMgd2l0aCBvYmplY3Rbb3B0aW9ucy5kaXJ0eVRlc3RdPXRydWU7IHRoaXMgaGFzIGEgSFVHRSBpbXBhY3Qgb24gcGVyZm9ybWFuY2VcclxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBbb3B0aW9ucy5BQUJCPUFBQkJdIG9iamVjdCBwcm9wZXJ0eSB0aGF0IGhvbGRzIGJvdW5kaW5nIGJveCBzbyB0aGF0IG9iamVjdFt0eXBlXSA9IHsgeDogbnVtYmVyLCB5OiBudW1iZXIsIHdpZHRoOiBudW1iZXIsIGhlaWdodDogbnVtYmVyIH1cclxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBbb3B0aW9ucy5zcGF0aWFsPXNwYXRpYWxdIG9iamVjdCBwcm9wZXJ0eSB0aGF0IGhvbGRzIG9iamVjdCdzIGhhc2ggbGlzdFxyXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IFtvcHRpb25zLmRpcnR5PWRpcnR5XSBvYmplY3QgcHJvcGVydHkgZm9yIGRpcnR5VGVzdFxyXG4gICAgICovXHJcbiAgICBjb25zdHJ1Y3RvcihvcHRpb25zKVxyXG4gICAge1xyXG4gICAgICAgIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9XHJcbiAgICAgICAgdGhpcy54U2l6ZSA9IG9wdGlvbnMueFNpemUgfHwgb3B0aW9ucy5zaXplIHx8IDEwMDBcclxuICAgICAgICB0aGlzLnlTaXplID0gb3B0aW9ucy55U2l6ZSB8fCBvcHRpb25zLnNpemUgfHwgMTAwMFxyXG4gICAgICAgIHRoaXMuQUFCQiA9IG9wdGlvbnMudHlwZSB8fCAnQUFCQidcclxuICAgICAgICB0aGlzLnNwYXRpYWwgPSBvcHRpb25zLnNwYXRpYWwgfHwgJ3NwYXRpYWwnXHJcbiAgICAgICAgdGhpcy5jYWxjdWxhdGVQSVhJID0gdHlwZW9mIG9wdGlvbnMuY2FsY3VsYXRlUElYSSAhPT0gJ3VuZGVmaW5lZCcgPyBvcHRpb25zLmNhbGN1bGF0ZVBJWEkgOiB0cnVlXHJcbiAgICAgICAgdGhpcy52aXNpYmxlVGV4dCA9IHR5cGVvZiBvcHRpb25zLnZpc2libGVUZXN0ICE9PSAndW5kZWZpbmVkJyA/IG9wdGlvbnMudmlzaWJsZVRlc3QgOiB0cnVlXHJcbiAgICAgICAgdGhpcy5zaW1wbGVUZXN0ID0gdHlwZW9mIG9wdGlvbnMuc2ltcGxlVGVzdCAhPT0gJ3VuZGVmaW5lZCcgPyBvcHRpb25zLnNpbXBsZVRlc3QgOiB0cnVlXHJcbiAgICAgICAgdGhpcy5kaXJ0eVRlc3QgPSB0eXBlb2Ygb3B0aW9ucy5kaXJ0eVRlc3QgIT09ICd1bmRlZmluZWQnID8gb3B0aW9ucy5kaXJ0eVRlc3QgOiB0cnVlXHJcbiAgICAgICAgdGhpcy52aXNpYmxlID0gb3B0aW9ucy52aXNpYmxlIHx8ICd2aXNpYmxlJ1xyXG4gICAgICAgIHRoaXMuZGlydHkgPSBvcHRpb25zLmRpcnR5IHx8ICdkaXJ0eSdcclxuICAgICAgICB0aGlzLndpZHRoID0gdGhpcy5oZWlnaHQgPSAwXHJcbiAgICAgICAgdGhpcy5oYXNoID0ge31cclxuICAgICAgICB0aGlzLmxpc3RzID0gW1tdXVxyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogYWRkIGFuIG9iamVjdCB0byBiZSBjdWxsZWRcclxuICAgICAqIHNpZGUgZWZmZWN0OiBhZGRzIG9iamVjdC5zcGF0aWFsSGFzaGVzIHRvIHRyYWNrIGV4aXN0aW5nIGhhc2hlc1xyXG4gICAgICogQHBhcmFtIHsqfSBvYmplY3RcclxuICAgICAqIEBwYXJhbSB7Ym9vbGVhbn0gW3N0YXRpY09iamVjdF0gc2V0IHRvIHRydWUgaWYgdGhlIG9iamVjdCdzIHBvc2l0aW9uL3NpemUgZG9lcyBub3QgY2hhbmdlXHJcbiAgICAgKiBAcmV0dXJuIHsqfSBvYmplY3RcclxuICAgICAqL1xyXG4gICAgYWRkKG9iamVjdCwgc3RhdGljT2JqZWN0KVxyXG4gICAge1xyXG4gICAgICAgIG9iamVjdFt0aGlzLnNwYXRpYWxdID0geyBoYXNoZXM6IFtdIH1cclxuICAgICAgICBpZiAodGhpcy5jYWxjdWxhdGVQSVhJICYmIHRoaXMuZGlydHlUZXN0KVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgb2JqZWN0W3RoaXMuZGlydHldID0gdHJ1ZVxyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAoc3RhdGljT2JqZWN0KVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgb2JqZWN0LnN0YXRpY09iamVjdCA9IHRydWVcclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy51cGRhdGVPYmplY3Qob2JqZWN0KVxyXG4gICAgICAgIHRoaXMubGlzdHNbMF0ucHVzaChvYmplY3QpXHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiByZW1vdmUgYW4gb2JqZWN0IGFkZGVkIGJ5IGFkZCgpXHJcbiAgICAgKiBAcGFyYW0geyp9IG9iamVjdFxyXG4gICAgICogQHJldHVybiB7Kn0gb2JqZWN0XHJcbiAgICAgKi9cclxuICAgIHJlbW92ZShvYmplY3QpXHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy5saXN0c1swXS5zcGxpY2UodGhpcy5saXN0WzBdLmluZGV4T2Yob2JqZWN0KSwgMSlcclxuICAgICAgICB0aGlzLnJlbW92ZUZyb21IYXNoKG9iamVjdClcclxuICAgICAgICByZXR1cm4gb2JqZWN0XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBhZGQgYW4gYXJyYXkgb2Ygb2JqZWN0cyB0byBiZSBjdWxsZWRcclxuICAgICAqIEBwYXJhbSB7QXJyYXl9IGFycmF5XHJcbiAgICAgKiBAcGFyYW0ge2Jvb2xlYW59IFtzdGF0aWNPYmplY3RdIHNldCB0byB0cnVlIGlmIHRoZSBvYmplY3RzIGluIHRoZSBsaXN0IHBvc2l0aW9uL3NpemUgZG9lcyBub3QgY2hhbmdlXHJcbiAgICAgKiBAcmV0dXJuIHtBcnJheX0gYXJyYXlcclxuICAgICAqL1xyXG4gICAgYWRkTGlzdChsaXN0LCBzdGF0aWNPYmplY3QpXHJcbiAgICB7XHJcbiAgICAgICAgZm9yIChsZXQgb2JqZWN0IG9mIGxpc3QpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBvYmplY3RbdGhpcy5zcGF0aWFsXSA9IHsgaGFzaGVzOiBbXSB9XHJcbiAgICAgICAgICAgIGlmICh0aGlzLmNhbGN1bGF0ZVBJWEkgJiYgdGhpcy5kaXJ0eVRlc3QpXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIG9iamVjdFt0aGlzLmRpcnR5XSA9IHRydWVcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZiAoc3RhdGljT2JqZWN0KVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBsaXN0LnN0YXRpY09iamVjdCA9IHRydWVcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB0aGlzLnVwZGF0ZU9iamVjdChvYmplY3QpXHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMubGlzdHMucHVzaChsaXN0KVxyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogcmVtb3ZlIGFuIGFycmF5IGFkZGVkIGJ5IGFkZExpc3QoKVxyXG4gICAgICogQHBhcmFtIHtBcnJheX0gYXJyYXlcclxuICAgICAqIEByZXR1cm4ge0FycmF5fSBhcnJheVxyXG4gICAgICovXHJcbiAgICByZW1vdmVMaXN0KGFycmF5KVxyXG4gICAge1xyXG4gICAgICAgIHRoaXMubGlzdHMuc3BsaWNlKHRoaXMubGlzdHMuaW5kZXhPZihhcnJheSksIDEpXHJcbiAgICAgICAgYXJyYXkuZm9yRWFjaChvYmplY3QgPT4gdGhpcy5yZW1vdmVGcm9tSGFzaChvYmplY3QpKVxyXG4gICAgICAgIHJldHVybiBhcnJheVxyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogdXBkYXRlIHRoZSBoYXNoZXMgYW5kIGN1bGwgdGhlIGl0ZW1zIGluIHRoZSBsaXN0XHJcbiAgICAgKiBAcGFyYW0ge0FBQkJ9IEFBQkJcclxuICAgICAqIEBwYXJhbSB7Ym9vbGVhbn0gW3NraXBVcGRhdGVdIHNraXAgdXBkYXRpbmcgdGhlIGhhc2hlcyBvZiBhbGwgb2JqZWN0c1xyXG4gICAgICogQHJldHVybiB7bnVtYmVyfSBudW1iZXIgb2YgYnVja2V0cyBpbiByZXN1bHRzXHJcbiAgICAgKi9cclxuICAgIGN1bGwoQUFCQiwgc2tpcFVwZGF0ZSlcclxuICAgIHtcclxuICAgICAgICBpZiAoIXNraXBVcGRhdGUpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aGlzLnVwZGF0ZU9iamVjdHMoKVxyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLmludmlzaWJsZSgpXHJcbiAgICAgICAgY29uc3Qgb2JqZWN0cyA9IHRoaXMucXVlcnkoQUFCQiwgdGhpcy5zaW1wbGVUZXN0KVxyXG4gICAgICAgIG9iamVjdHMuZm9yRWFjaChvYmplY3QgPT4gb2JqZWN0W3RoaXMudmlzaWJsZV0gPSB0cnVlKVxyXG4gICAgICAgIHJldHVybiB0aGlzLmxhc3RCdWNrZXRzXHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBzZXQgYWxsIG9iamVjdHMgaW4gaGFzaCB0byB2aXNpYmxlPWZhbHNlXHJcbiAgICAgKi9cclxuICAgIGludmlzaWJsZSgpXHJcbiAgICB7XHJcbiAgICAgICAgZm9yIChsZXQgbGlzdCBvZiB0aGlzLmxpc3RzKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgbGlzdC5mb3JFYWNoKG9iamVjdCA9PiBvYmplY3RbdGhpcy52aXNpYmxlXSA9IGZhbHNlKVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIHVwZGF0ZSB0aGUgaGFzaGVzIGZvciBhbGwgb2JqZWN0c1xyXG4gICAgICogYXV0b21hdGljYWxseSBjYWxsZWQgZnJvbSB1cGRhdGUoKSB3aGVuIHNraXBVcGRhdGU9ZmFsc2VcclxuICAgICAqL1xyXG4gICAgdXBkYXRlT2JqZWN0cygpXHJcbiAgICB7XHJcbiAgICAgICAgaWYgKHRoaXMuZGlydHlUZXN0KVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgZm9yIChsZXQgbGlzdCBvZiB0aGlzLmxpc3RzKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBmb3IgKGxldCBvYmplY3Qgb2YgbGlzdClcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAob2JqZWN0W3RoaXMuZGlydHldKVxyXG4gICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy51cGRhdGVPYmplY3Qob2JqZWN0KVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBvYmplY3RbdGhpcy5kaXJ0eV0gPSBmYWxzZVxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBmb3IgKGxldCBsaXN0IG9mIHRoaXMubGlzdHMpXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGxpc3QuZm9yRWFjaChvYmplY3QgPT4gdGhpcy51cGRhdGVPYmplY3Qob2JqZWN0KSlcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIHVwZGF0ZSB0aGUgaGFzIG9mIGFuIG9iamVjdFxyXG4gICAgICogYXV0b21hdGljYWxseSBjYWxsZWQgZnJvbSB1cGRhdGVPYmplY3RzKClcclxuICAgICAqIEBwYXJhbSB7Kn0gb2JqZWN0XHJcbiAgICAgKiBAcGFyYW0ge2Jvb2xlYW59IFtmb3JjZV0gZm9yY2UgdXBkYXRlIGZvciBjYWxjdWxhdGVQSVhJXHJcbiAgICAgKi9cclxuICAgIHVwZGF0ZU9iamVjdChvYmplY3QpXHJcbiAgICB7XHJcbiAgICAgICAgbGV0IEFBQkJcclxuICAgICAgICBpZiAodGhpcy5jYWxjdWxhdGVQSVhJKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgY29uc3QgYm94ID0gb2JqZWN0LmdldExvY2FsQm91bmRzKClcclxuICAgICAgICAgICAgQUFCQiA9IG9iamVjdFt0aGlzLkFBQkJdID0ge1xyXG4gICAgICAgICAgICAgICAgeDogb2JqZWN0LnggKyBib3gueCAqIG9iamVjdC5zY2FsZS54LFxyXG4gICAgICAgICAgICAgICAgeTogb2JqZWN0LnkgKyBib3gueSAqIG9iamVjdC5zY2FsZS55LFxyXG4gICAgICAgICAgICAgICAgd2lkdGg6IGJveC53aWR0aCAqIG9iamVjdC5zY2FsZS54LFxyXG4gICAgICAgICAgICAgICAgaGVpZ2h0OiBib3guaGVpZ2h0ICogb2JqZWN0LnNjYWxlLnlcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBBQUJCID0gb2JqZWN0W3RoaXMuQUFCQl1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGNvbnN0IHNwYXRpYWwgPSBvYmplY3RbdGhpcy5zcGF0aWFsXVxyXG4gICAgICAgIGNvbnN0IHsgeFN0YXJ0LCB5U3RhcnQsIHhFbmQsIHlFbmQgfSA9IHRoaXMuZ2V0Qm91bmRzKEFBQkIpXHJcblxyXG4gICAgICAgIC8vIG9ubHkgcmVtb3ZlIGFuZCBpbnNlcnQgaWYgbWFwcGluZyBoYXMgY2hhbmdlZFxyXG4gICAgICAgIGlmIChzcGF0aWFsLnhTdGFydCAhPT0geFN0YXJ0IHx8IHNwYXRpYWwueVN0YXJ0ICE9PSB5U3RhcnQgfHwgc3BhdGlhbC54RW5kICE9PSB4RW5kIHx8IHNwYXRpYWwueUVuZCAhPT0geUVuZClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGlmIChzcGF0aWFsLmhhc2hlcy5sZW5ndGgpXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHRoaXMucmVtb3ZlRnJvbUhhc2gob2JqZWN0KVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGZvciAobGV0IHkgPSB5U3RhcnQ7IHkgPD0geUVuZDsgeSsrKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBmb3IgKGxldCB4ID0geFN0YXJ0OyB4IDw9IHhFbmQ7IHgrKylcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBrZXkgPSB4ICsgJywnICsgeVxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuaW5zZXJ0KG9iamVjdCwga2V5KVxyXG4gICAgICAgICAgICAgICAgICAgIHNwYXRpYWwuaGFzaGVzLnB1c2goa2V5KVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHNwYXRpYWwueFN0YXJ0ID0geFN0YXJ0XHJcbiAgICAgICAgICAgIHNwYXRpYWwueVN0YXJ0ID0geVN0YXJ0XHJcbiAgICAgICAgICAgIHNwYXRpYWwueEVuZCA9IHhFbmRcclxuICAgICAgICAgICAgc3BhdGlhbC55RW5kID0geUVuZFxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIGdldHMgaGFzaCBib3VuZHNcclxuICAgICAqIEBwYXJhbSB7QUFCQn0gQUFCQlxyXG4gICAgICogQHJldHVybiB7Qm91bmRzfVxyXG4gICAgICogQHByaXZhdGVcclxuICAgICAqL1xyXG4gICAgZ2V0Qm91bmRzKEFBQkIpXHJcbiAgICB7XHJcbiAgICAgICAgbGV0IHhTdGFydCA9IE1hdGguZmxvb3IoQUFCQi54IC8gdGhpcy54U2l6ZSlcclxuICAgICAgICBsZXQgeVN0YXJ0ID0gTWF0aC5mbG9vcihBQUJCLnkgLyB0aGlzLnlTaXplKVxyXG4gICAgICAgIGxldCB4RW5kID0gTWF0aC5mbG9vcigoQUFCQi54ICsgQUFCQi53aWR0aCkgLyB0aGlzLnhTaXplKVxyXG4gICAgICAgIGxldCB5RW5kID0gTWF0aC5mbG9vcigoQUFCQi55ICsgQUFCQi5oZWlnaHQpIC8gdGhpcy55U2l6ZSlcclxuICAgICAgICByZXR1cm4geyB4U3RhcnQsIHlTdGFydCwgeEVuZCwgeUVuZCB9XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBpbnNlcnQgb2JqZWN0IGludG8gdGhlIHNwYXRpYWwgaGFzaFxyXG4gICAgICogYXV0b21hdGljYWxseSBjYWxsZWQgZnJvbSB1cGRhdGVPYmplY3QoKVxyXG4gICAgICogQHBhcmFtIHsqfSBvYmplY3RcclxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBrZXlcclxuICAgICAqL1xyXG4gICAgaW5zZXJ0KG9iamVjdCwga2V5KVxyXG4gICAge1xyXG4gICAgICAgIGlmICghdGhpcy5oYXNoW2tleV0pXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aGlzLmhhc2hba2V5XSA9IFtvYmplY3RdXHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2VcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRoaXMuaGFzaFtrZXldLnB1c2gob2JqZWN0KVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIHJlbW92ZXMgb2JqZWN0IGZyb20gdGhlIGhhc2ggdGFibGVcclxuICAgICAqIHNob3VsZCBiZSBjYWxsZWQgd2hlbiByZW1vdmluZyBhbiBvYmplY3RcclxuICAgICAqIGF1dG9tYXRpY2FsbHkgY2FsbGVkIGZyb20gdXBkYXRlT2JqZWN0KClcclxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSBvYmplY3RcclxuICAgICAqL1xyXG4gICAgcmVtb3ZlRnJvbUhhc2gob2JqZWN0KVxyXG4gICAge1xyXG4gICAgICAgIGNvbnN0IHNwYXRpYWwgPSBvYmplY3RbdGhpcy5zcGF0aWFsXVxyXG4gICAgICAgIHdoaWxlIChzcGF0aWFsLmhhc2hlcy5sZW5ndGgpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBjb25zdCBrZXkgPSBzcGF0aWFsLmhhc2hlcy5wb3AoKVxyXG4gICAgICAgICAgICBjb25zdCBsaXN0ID0gdGhpcy5oYXNoW2tleV1cclxuICAgICAgICAgICAgbGlzdC5zcGxpY2UobGlzdC5pbmRleE9mKG9iamVjdCksIDEpXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogZ2V0IGFsbCBuZWlnaGJvcnMgdGhhdCBzaGFyZSB0aGUgc2FtZSBoYXNoIGFzIG9iamVjdFxyXG4gICAgICogQHBhcmFtIHsqfSBvYmplY3QgaW4gdGhlIHNwYXRpYWwgaGFzaFxyXG4gICAgICogQHJldHVybiB7QXJyYXl9IG9mIG9iamVjdHMgdGhhdCBhcmUgaW4gdGhlIHNhbWUgaGFzaCBhcyBvYmplY3RcclxuICAgICAqL1xyXG4gICAgbmVpZ2hib3JzKG9iamVjdClcclxuICAgIHtcclxuICAgICAgICBsZXQgcmVzdWx0cyA9IFtdXHJcbiAgICAgICAgb2JqZWN0W3RoaXMuc3BhdGlhbF0uaGFzaGVzLmZvckVhY2goa2V5ID0+IHJlc3VsdHMgPSByZXN1bHRzLmNvbmNhdCh0aGlzLmhhc2hba2V5XSkpXHJcbiAgICAgICAgcmV0dXJuIHJlc3VsdHNcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIHJldHVybnMgYW4gYXJyYXkgb2Ygb2JqZWN0cyBjb250YWluZWQgd2l0aGluIGJvdW5kaW5nIGJveFxyXG4gICAgICogQHBhcmFtIHtBQUJCfSBBQUJCIGJvdW5kaW5nIGJveCB0byBzZWFyY2hcclxuICAgICAqIEBwYXJhbSB7Ym9vbGVhbn0gW3NpbXBsZVRlc3Q9dHJ1ZV0gcGVyZm9ybSBhIHNpbXBsZSBib3VuZHMgY2hlY2sgb2YgYWxsIGl0ZW1zIGluIHRoZSBidWNrZXRzXHJcbiAgICAgKiBAcmV0dXJuIHtvYmplY3RbXX0gc2VhcmNoIHJlc3VsdHNcclxuICAgICAqL1xyXG4gICAgcXVlcnkoQUFCQiwgc2ltcGxlVGVzdClcclxuICAgIHtcclxuICAgICAgICBzaW1wbGVUZXN0ID0gdHlwZW9mIHNpbXBsZVRlc3QgIT09ICd1bmRlZmluZWQnID8gc2ltcGxlVGVzdCA6IHRydWVcclxuICAgICAgICBsZXQgYnVja2V0cyA9IDBcclxuICAgICAgICBsZXQgcmVzdWx0cyA9IFtdXHJcbiAgICAgICAgY29uc3QgeyB4U3RhcnQsIHlTdGFydCwgeEVuZCwgeUVuZCB9ID0gdGhpcy5nZXRCb3VuZHMoQUFCQilcclxuICAgICAgICBmb3IgKGxldCB5ID0geVN0YXJ0OyB5IDw9IHlFbmQ7IHkrKylcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGZvciAobGV0IHggPSB4U3RhcnQ7IHggPD0geEVuZDsgeCsrKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBlbnRyeSA9IHRoaXMuaGFzaFt4ICsgJywnICsgeV1cclxuICAgICAgICAgICAgICAgIGlmIChlbnRyeSlcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoc2ltcGxlVGVzdClcclxuICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGZvciAobGV0IG9iamVjdCBvZiBlbnRyeSlcclxuICAgICAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgYm94ID0gb2JqZWN0W3RoaXMuQUFCQl1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChib3gueCArIGJveC53aWR0aCA+IEFBQkIueCAmJiBib3gueCA8IEFBQkIueCArIEFBQkIud2lkdGggJiZcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJveC55ICsgYm94LmhlaWdodCA+IEFBQkIueSAmJiBib3gueSA8IEFBQkIueSArIEFBQkIuaGVpZ2h0KVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdHMucHVzaChvYmplY3QpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0cyA9IHJlc3VsdHMuY29uY2F0KGVudHJ5KVxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICBidWNrZXRzKytcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLmxhc3RCdWNrZXRzID0gYnVja2V0c1xyXG4gICAgICAgIHJldHVybiByZXN1bHRzXHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBpdGVyYXRlcyB0aHJvdWdoIG9iamVjdHMgY29udGFpbmVkIHdpdGhpbiBib3VuZGluZyBib3hcclxuICAgICAqIHN0b3BzIGl0ZXJhdGluZyBpZiB0aGUgY2FsbGJhY2sgcmV0dXJucyB0cnVlXHJcbiAgICAgKiBAcGFyYW0ge0FBQkJ9IEFBQkIgYm91bmRpbmcgYm94IHRvIHNlYXJjaFxyXG4gICAgICogQHBhcmFtIHtmdW5jdGlvbn0gY2FsbGJhY2tcclxuICAgICAqIEBwYXJhbSB7Ym9vbGVhbn0gW3NpbXBsZVRlc3Q9dHJ1ZV0gcGVyZm9ybSBhIHNpbXBsZSBib3VuZHMgY2hlY2sgb2YgYWxsIGl0ZW1zIGluIHRoZSBidWNrZXRzXHJcbiAgICAgKiBAcmV0dXJuIHtib29sZWFufSB0cnVlIGlmIGNhbGxiYWNrIHJldHVybmVkIGVhcmx5XHJcbiAgICAgKi9cclxuICAgIHF1ZXJ5Q2FsbGJhY2soQUFCQiwgY2FsbGJhY2ssIHNpbXBsZVRlc3QpXHJcbiAgICB7XHJcbiAgICAgICAgc2ltcGxlVGVzdCA9IHR5cGVvZiBzaW1wbGVUZXN0ICE9PSAndW5kZWZpbmVkJyA/IHNpbXBsZVRlc3QgOiB0cnVlXHJcbiAgICAgICAgY29uc3QgeyB4U3RhcnQsIHlTdGFydCwgeEVuZCwgeUVuZCB9ID0gdGhpcy5nZXRCb3VuZHMoQUFCQilcclxuICAgICAgICBmb3IgKGxldCB5ID0geVN0YXJ0OyB5IDw9IHlFbmQ7IHkrKylcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGZvciAobGV0IHggPSB4U3RhcnQ7IHggPD0geEVuZDsgeCsrKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBlbnRyeSA9IHRoaXMuaGFzaFt4ICsgJywnICsgeV1cclxuICAgICAgICAgICAgICAgIGlmIChlbnRyeSlcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGVudHJ5Lmxlbmd0aDsgaSsrKVxyXG4gICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3Qgb2JqZWN0ID0gZW50cnlbaV1cclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHNpbXBsZVRlc3QpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IEFBQkIgPSBvYmplY3QuQUFCQlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKEFBQkIueCArIEFBQkIud2lkdGggPiBBQUJCLnggJiYgQUFCQi54IDwgQUFCQi54ICsgQUFCQi53aWR0aCAmJlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgQUFCQi55ICsgQUFCQi5oZWlnaHQgPiBBQUJCLnkgJiYgQUFCQi55IDwgQUFCQi55ICsgQUFCQi5oZWlnaHQpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGNhbGxiYWNrKG9iamVjdCkpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChjYWxsYmFjayhvYmplY3QpKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB0cnVlXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIGZhbHNlXHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBnZXQgc3RhdHNcclxuICAgICAqIEByZXR1cm4ge1N0YXRzfVxyXG4gICAgICovXHJcbiAgICBzdGF0cygpXHJcbiAgICB7XHJcbiAgICAgICAgbGV0IHZpc2libGUgPSAwLCBjb3VudCA9IDBcclxuICAgICAgICBmb3IgKGxldCBsaXN0IG9mIHRoaXMubGlzdHMpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBsaXN0LmZvckVhY2gob2JqZWN0ID0+XHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHZpc2libGUgKz0gb2JqZWN0LnZpc2libGUgPyAxIDogMFxyXG4gICAgICAgICAgICAgICAgY291bnQrK1xyXG4gICAgICAgICAgICB9KVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgdG90YWw6IGNvdW50LFxyXG4gICAgICAgICAgICB2aXNpYmxlLFxyXG4gICAgICAgICAgICBjdWxsZWQ6IGNvdW50IC0gdmlzaWJsZVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIGhlbHBlciBmdW5jdGlvbiB0byBldmFsdWF0ZSBoYXNoIHRhYmxlXHJcbiAgICAgKiBAcmV0dXJuIHtudW1iZXJ9IHRoZSBudW1iZXIgb2YgYnVja2V0cyBpbiB0aGUgaGFzaCB0YWJsZVxyXG4gICAgICogKi9cclxuICAgIGdldEJ1Y2tldHMoKVxyXG4gICAge1xyXG4gICAgICAgIHJldHVybiBPYmplY3Qua2V5cyh0aGlzLmhhc2gpLmxlbmd0aFxyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogaGVscGVyIGZ1bmN0aW9uIHRvIGV2YWx1YXRlIGhhc2ggdGFibGVcclxuICAgICAqIEByZXR1cm4ge251bWJlcn0gdGhlIGF2ZXJhZ2UgbnVtYmVyIG9mIGVudHJpZXMgaW4gZWFjaCBidWNrZXRcclxuICAgICAqL1xyXG4gICAgZ2V0QXZlcmFnZVNpemUoKVxyXG4gICAge1xyXG4gICAgICAgIGxldCB0b3RhbCA9IDBcclxuICAgICAgICBmb3IgKGxldCBrZXkgaW4gdGhpcy5oYXNoKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdG90YWwgKz0gdGhpcy5oYXNoW2tleV0ubGVuZ3RoXHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiB0b3RhbCAvIHRoaXMuZ2V0QnVja2V0cygpXHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBoZWxwZXIgZnVuY3Rpb24gdG8gZXZhbHVhdGUgdGhlIGhhc2ggdGFibGVcclxuICAgICAqIEByZXR1cm4ge251bWJlcn0gdGhlIGxhcmdlc3Qgc2l6ZWQgYnVja2V0XHJcbiAgICAgKi9cclxuICAgIGdldExhcmdlc3QoKVxyXG4gICAge1xyXG4gICAgICAgIGxldCBsYXJnZXN0ID0gMFxyXG4gICAgICAgIGZvciAobGV0IGtleSBpbiB0aGlzLmhhc2gpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBpZiAodGhpcy5oYXNoW2tleV0ubGVuZ3RoID4gbGFyZ2VzdClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgbGFyZ2VzdCA9IHRoaXMuaGFzaFtrZXldLmxlbmd0aFxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBsYXJnZXN0XHJcbiAgICB9XHJcblxyXG4gICAgLyoqIGhlbHBlciBmdW5jdGlvbiB0byBldmFsdXRlIHRoZSBoYXNoIHRhYmxlXHJcbiAgICAgKiBAcGFyYW0ge0FBQkJ9IEFBQkIgYm91bmRpbmcgYm94IHRvIHNlYXJjaFxyXG4gICAgICogQHJldHVybiB7bnVtYmVyfSBzcGFyc2VuZXNzIHBlcmNlbnRhZ2UgKGkuZS4sIGJ1Y2tldHMgd2l0aCBhdCBsZWFzdCAxIGVsZW1lbnQgZGl2aWRlZCBieSB0b3RhbCBwb3NzaWJsZSBidWNrZXRzKVxyXG4gICAgICovXHJcbiAgICBnZXRTcGFyc2VuZXNzKEFBQkIpXHJcbiAgICB7XHJcbiAgICAgICAgbGV0IGNvdW50ID0gMCwgdG90YWwgPSAwXHJcbiAgICAgICAgY29uc3QgeyB4U3RhcnQsIHlTdGFydCwgeEVuZCwgeUVuZCB9ID0gdGhpcy5nZXRCb3VuZHMoQUFCQilcclxuICAgICAgICBmb3IgKGxldCB5ID0geVN0YXJ0OyB5IDwgeUVuZDsgeSsrKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgZm9yIChsZXQgeCA9IHhTdGFydDsgeCA8IHhFbmQ7IHgrKylcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgY291bnQgKz0gKHRoaXMuaGFzaFt4ICsgJywnICsgeV0gPyAxIDogMClcclxuICAgICAgICAgICAgICAgIHRvdGFsKytcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gY291bnQgLyB0b3RhbFxyXG4gICAgfVxyXG59XHJcblxyXG4vKipcclxuICogQHR5cGVkZWYge29iamVjdH0gU3RhdHNcclxuICogQHByb3BlcnR5IHtudW1iZXJ9IHRvdGFsXHJcbiAqIEBwcm9wZXJ0eSB7bnVtYmVyfSB2aXNpYmxlXHJcbiAqIEBwcm9wZXJ0eSB7bnVtYmVyfSBjdWxsZWRcclxuICovXHJcblxyXG4vKipcclxuICogQHR5cGVkZWYge29iamVjdH0gQm91bmRzXHJcbiAqIEBwcm9wZXJ0eSB7bnVtYmVyfSB4U3RhcnRcclxuICogQHByb3BlcnR5IHtudW1iZXJ9IHlTdGFydFxyXG4gKiBAcHJvcGVydHkge251bWJlcn0geEVuZFxyXG4gKiBAcHJvcGVydHkge251bWJlcn0geEVuZFxyXG4gKi9cclxuXHJcbi8qKlxyXG4gICogQHR5cGVkZWYge29iamVjdH0gQUFCQlxyXG4gICogQHByb3BlcnR5IHtudW1iZXJ9IHhcclxuICAqIEBwcm9wZXJ0eSB7bnVtYmVyfSB5XHJcbiAgKiBAcHJvcGVydHkge251bWJlcn0gd2lkdGhcclxuICAqIEBwcm9wZXJ0eSB7bnVtYmVyfSBoZWlnaHRcclxuICAqL1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBTcGF0aWFsSGFzaCJdfQ==