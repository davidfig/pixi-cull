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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL2NvZGUvc3BhdGlhbC1oYXNoLmpzIl0sIm5hbWVzIjpbIlNwYXRpYWxIYXNoIiwib3B0aW9ucyIsInhTaXplIiwic2l6ZSIsInlTaXplIiwiQUFCQiIsInR5cGUiLCJzcGF0aWFsIiwiY2FsY3VsYXRlUElYSSIsInZpc2libGVUZXh0IiwidmlzaWJsZVRlc3QiLCJzaW1wbGVUZXN0IiwiZGlydHlUZXN0IiwidmlzaWJsZSIsImRpcnR5Iiwid2lkdGgiLCJoZWlnaHQiLCJoYXNoIiwibGlzdHMiLCJvYmplY3QiLCJzdGF0aWNPYmplY3QiLCJoYXNoZXMiLCJ1cGRhdGVPYmplY3QiLCJwdXNoIiwic3BsaWNlIiwibGlzdCIsImluZGV4T2YiLCJyZW1vdmVGcm9tSGFzaCIsImFycmF5IiwiZm9yRWFjaCIsInNraXBVcGRhdGUiLCJ1cGRhdGVPYmplY3RzIiwiaW52aXNpYmxlIiwib2JqZWN0cyIsInF1ZXJ5IiwibGFzdEJ1Y2tldHMiLCJib3giLCJnZXRMb2NhbEJvdW5kcyIsIngiLCJzY2FsZSIsInkiLCJnZXRCb3VuZHMiLCJ4U3RhcnQiLCJ5U3RhcnQiLCJ4RW5kIiwieUVuZCIsImxlbmd0aCIsImtleSIsImluc2VydCIsIk1hdGgiLCJmbG9vciIsInBvcCIsInJlc3VsdHMiLCJjb25jYXQiLCJidWNrZXRzIiwiZW50cnkiLCJjYWxsYmFjayIsImkiLCJjb3VudCIsInRvdGFsIiwiY3VsbGVkIiwiT2JqZWN0Iiwia2V5cyIsImdldEJ1Y2tldHMiLCJsYXJnZXN0IiwibW9kdWxlIiwiZXhwb3J0cyJdLCJtYXBwaW5ncyI6Ijs7Ozs7O0FBQUE7QUFDQTtBQUNBOztJQUVNQSxXO0FBRUY7Ozs7Ozs7Ozs7Ozs7O0FBY0EseUJBQVlDLE9BQVosRUFDQTtBQUFBOztBQUNJQSxrQkFBVUEsV0FBVyxFQUFyQjtBQUNBLGFBQUtDLEtBQUwsR0FBYUQsUUFBUUMsS0FBUixJQUFpQkQsUUFBUUUsSUFBekIsSUFBaUMsSUFBOUM7QUFDQSxhQUFLQyxLQUFMLEdBQWFI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cUJBQUssSUFBSUYsSUFBSUksTUFBYixFQUFxQkosSUFBSU0sSUFBekIsRUFBK0JOLEdBQS9CLEVBQ0E7QUFDSW9CLDZCQUFVLEtBQUt6QyxJQUFMLENBQVVxQixJQUFJLEdBQUosR0FBVUUsQ0FBcEIsSUFBeUIsQ0FBekIsR0FBNkIsQ0FBdkM7QUFDQW1CO0FBQ0g7QUFDSjtBQUNELG1CQUFPRCxRQUFRQyxLQUFmO0FBQ0g7Ozs7OztBQUdMOzs7Ozs7O0FBT0E7Ozs7Ozs7O0FBUUE7Ozs7Ozs7O0FBUUFNLE9BQU9DLE9BQVAsR0FBaUJsRSxXQUFqQiIsImZpbGUiOiJzcGF0aWFsLWhhc2guanMiLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAxOCBZT1BFWSBZT1BFWSBMTENcclxuLy8gRGF2aWQgRmlnYXRuZXJcclxuLy8gTUlUIExpY2Vuc2VcclxuXHJcbmNsYXNzIFNwYXRpYWxIYXNoXHJcbntcclxuICAgIC8qKlxyXG4gICAgICogY3JlYXRlcyBhIHNwYXRpYWwtaGFzaCBjdWxsXHJcbiAgICAgKiBAcGFyYW0ge29iamVjdH0gW29wdGlvbnNdXHJcbiAgICAgKiBAcGFyYW0ge251bWJlcn0gW29wdGlvbnMuc2l6ZT0xMDAwXSBjZWxsIHNpemUgdXNlZCB0byBjcmVhdGUgaGFzaCAoeFNpemUgPSB5U2l6ZSlcclxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSBbb3B0aW9ucy54U2l6ZV0gaG9yaXpvbnRhbCBjZWxsIHNpemVcclxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSBbb3B0aW9ucy55U2l6ZV0gdmVydGljYWwgY2VsbCBzaXplXHJcbiAgICAgKiBAcGFyYW0ge2Jvb2xlYW59IFtvcHRpb25zLmNhbGN1bGF0ZVBJWEk9dHJ1ZV0gY2FsY3VsYXRlIGJvdW5kaW5nIGJveCBhdXRvbWF0aWNhbGx5OyBpZiB0aGlzIGlzIHNldCB0byBmYWxzZSB0aGVuIGl0IHVzZXMgb2JqZWN0W29wdGlvbnMuQUFCQl0gZm9yIGJvdW5kaW5nIGJveFxyXG4gICAgICogQHBhcmFtIHtib29sZWFufSBbb3B0aW9ucy52aXNpYmxlPXZpc2libGVdIHBhcmFtZXRlciBvZiB0aGUgb2JqZWN0IHRvIHNldCAodXN1YWxseSB2aXNpYmxlIG9yIHJlbmRlcmFibGUpXHJcbiAgICAgKiBAcGFyYW0ge2Jvb2xlYW59IFtvcHRpb25zLnNpbXBsZVRlc3Q9dHJ1ZV0gaXRlcmF0ZSB0aHJvdWdoIHZpc2libGUgYnVja2V0cyB0byBjaGVjayBmb3IgYm91bmRzXHJcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gW29wdGlvbnMuZGlydHlUZXN0PXRydWVdIG9ubHkgdXBkYXRlIHNwYXRpYWwgaGFzaCBmb3Igb2JqZWN0cyB3aXRoIG9iamVjdFtvcHRpb25zLmRpcnR5VGVzdF09dHJ1ZTsgdGhpcyBoYXMgYSBIVUdFIGltcGFjdCBvbiBwZXJmb3JtYW5jZVxyXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IFtvcHRpb25zLkFBQkI9QUFCQl0gb2JqZWN0IHByb3BlcnR5IHRoYXQgaG9sZHMgYm91bmRpbmcgYm94IHNvIHRoYXQgb2JqZWN0W3R5cGVdID0geyB4OiBudW1iZXIsIHk6IG51bWJlciwgd2lkdGg6IG51bWJlciwgaGVpZ2h0OiBudW1iZXIgfVxyXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IFtvcHRpb25zLnNwYXRpYWw9c3BhdGlhbF0gb2JqZWN0IHByb3BlcnR5IHRoYXQgaG9sZHMgb2JqZWN0J3MgaGFzaCBsaXN0XHJcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gW29wdGlvbnMuZGlydHk9ZGlydHldIG9iamVjdCBwcm9wZXJ0eSBmb3IgZGlydHlUZXN0XHJcbiAgICAgKi9cclxuICAgIGNvbnN0cnVjdG9yKG9wdGlvbnMpXHJcbiAgICB7XHJcbiAgICAgICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge31cclxuICAgICAgICB0aGlzLnhTaXplID0gb3B0aW9ucy54U2l6ZSB8fCBvcHRpb25zLnNpemUgfHwgMTAwMFxyXG4gICAgICAgIHRoaXMueVNpemUgPSBvcHRpb25zLnlTaXplIHx8IG9wdGlvbnMuc2l6ZSB8fCAxMDAwXHJcbiAgICAgICAgdGhpcy5BQUJCID0gb3B0aW9ucy50eXBlIHx8ICdBQUJCJ1xyXG4gICAgICAgIHRoaXMuc3BhdGlhbCA9IG9wdGlvbnMuc3BhdGlhbCB8fCAnc3BhdGlhbCdcclxuICAgICAgICB0aGlzLmNhbGN1bGF0ZVBJWEkgPSB0eXBlb2Ygb3B0aW9ucy5jYWxjdWxhdGVQSVhJICE9PSAndW5kZWZpbmVkJyA/IG9wdGlvbnMuY2FsY3VsYXRlUElYSSA6IHRydWVcclxuICAgICAgICB0aGlzLnZpc2libGVUZXh0ID0gdHlwZW9mIG9wdGlvbnMudmlzaWJsZVRlc3QgIT09ICd1bmRlZmluZWQnID8gb3B0aW9ucy52aXNpYmxlVGVzdCA6IHRydWVcclxuICAgICAgICB0aGlzLnNpbXBsZVRlc3QgPSB0eXBlb2Ygb3B0aW9ucy5zaW1wbGVUZXN0ICE9PSAndW5kZWZpbmVkJyA/IG9wdGlvbnMuc2ltcGxlVGVzdCA6IHRydWVcclxuICAgICAgICB0aGlzLmRpcnR5VGVzdCA9IHR5cGVvZiBvcHRpb25zLmRpcnR5VGVzdCAhPT0gJ3VuZGVmaW5lZCcgPyBvcHRpb25zLmRpcnR5VGVzdCA6IHRydWVcclxuICAgICAgICB0aGlzLnZpc2libGUgPSBvcHRpb25zLnZpc2libGUgfHwgJ3Zpc2libGUnXHJcbiAgICAgICAgdGhpcy5kaXJ0eSA9IG9wdGlvbnMuZGlydHkgfHwgJ2RpcnR5J1xyXG4gICAgICAgIHRoaXMud2lkdGggPSB0aGlzLmhlaWdodCA9IDBcclxuICAgICAgICB0aGlzLmhhc2ggPSB7fVxyXG4gICAgICAgIHRoaXMubGlzdHMgPSBbW11dXHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBhZGQgYW4gb2JqZWN0IHRvIGJlIGN1bGxlZFxyXG4gICAgICogc2lkZSBlZmZlY3Q6IGFkZHMgb2JqZWN0LnNwYXRpYWxIYXNoZXMgdG8gdHJhY2sgZXhpc3RpbmcgaGFzaGVzXHJcbiAgICAgKiBAcGFyYW0geyp9IG9iamVjdFxyXG4gICAgICogQHBhcmFtIHtib29sZWFufSBbc3RhdGljT2JqZWN0XSBzZXQgdG8gdHJ1ZSBpZiB0aGUgb2JqZWN0J3MgcG9zaXRpb24vc2l6ZSBkb2VzIG5vdCBjaGFuZ2VcclxuICAgICAqIEByZXR1cm4geyp9IG9iamVjdFxyXG4gICAgICovXHJcbiAgICBhZGQob2JqZWN0LCBzdGF0aWNPYmplY3QpXHJcbiAgICB7XHJcbiAgICAgICAgb2JqZWN0W3RoaXMuc3BhdGlhbF0gPSB7IGhhc2hlczogW10gfVxyXG4gICAgICAgIGlmICh0aGlzLmNhbGN1bGF0ZVBJWEkgJiYgdGhpcy5kaXJ0eVRlc3QpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBvYmplY3RbdGhpcy5kaXJ0eV0gPSB0cnVlXHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmIChzdGF0aWNPYmplY3QpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBvYmplY3Quc3RhdGljT2JqZWN0ID0gdHJ1ZVxyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLnVwZGF0ZU9iamVjdChvYmplY3QpXHJcbiAgICAgICAgdGhpcy5saXN0c1swXS5wdXNoKG9iamVjdClcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIHJlbW92ZSBhbiBvYmplY3QgYWRkZWQgYnkgYWRkKClcclxuICAgICAqIEBwYXJhbSB7Kn0gb2JqZWN0XHJcbiAgICAgKiBAcmV0dXJuIHsqfSBvYmplY3RcclxuICAgICAqL1xyXG4gICAgcmVtb3ZlKG9iamVjdClcclxuICAgIHtcclxuICAgICAgICB0aGlzLmxpc3RzWzBdLnNwbGljZSh0aGlzLmxpc3RbMF0uaW5kZXhPZihvYmplY3QpLCAxKVxyXG4gICAgICAgIHRoaXMucmVtb3ZlRnJvbUhhc2gob2JqZWN0KVxyXG4gICAgICAgIHJldHVybiBvYmplY3RcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIGFkZCBhbiBhcnJheSBvZiBvYmplY3RzIHRvIGJlIGN1bGxlZFxyXG4gICAgICogQHBhcmFtIHtBcnJheX0gYXJyYXlcclxuICAgICAqIEBwYXJhbSB7Ym9vbGVhbn0gW3N0YXRpY09iamVjdF0gc2V0IHRvIHRydWUgaWYgdGhlIG9iamVjdHMgaW4gdGhlIGxpc3QgcG9zaXRpb24vc2l6ZSBkb2VzIG5vdCBjaGFuZ2VcclxuICAgICAqIEByZXR1cm4ge0FycmF5fSBhcnJheVxyXG4gICAgICovXHJcbiAgICBhZGRMaXN0KGxpc3QsIHN0YXRpY09iamVjdClcclxuICAgIHtcclxuICAgICAgICBmb3IgKGxldCBvYmplY3Qgb2YgbGlzdClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIG9iamVjdFt0aGlzLnNwYXRpYWxdID0geyBoYXNoZXM6IFtdIH1cclxuICAgICAgICAgICAgaWYgKHRoaXMuY2FsY3VsYXRlUElYSSAmJiB0aGlzLmRpcnR5VGVzdClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgb2JqZWN0W3RoaXMuZGlydHldID0gdHJ1ZVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGlmIChzdGF0aWNPYmplY3QpXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGxpc3Quc3RhdGljT2JqZWN0ID0gdHJ1ZVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHRoaXMudXBkYXRlT2JqZWN0KG9iamVjdClcclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy5saXN0cy5wdXNoKGxpc3QpXHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiByZW1vdmUgYW4gYXJyYXkgYWRkZWQgYnkgYWRkTGlzdCgpXHJcbiAgICAgKiBAcGFyYW0ge0FycmF5fSBhcnJheVxyXG4gICAgICogQHJldHVybiB7QXJyYXl9IGFycmF5XHJcbiAgICAgKi9cclxuICAgIHJlbW92ZUxpc3QoYXJyYXkpXHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy5saXN0cy5zcGxpY2UodGhpcy5saXN0cy5pbmRleE9mKGFycmF5KSwgMSlcclxuICAgICAgICBhcnJheS5mb3JFYWNoKG9iamVjdCA9PiB0aGlzLnJlbW92ZUZyb21IYXNoKG9iamVjdCkpXHJcbiAgICAgICAgcmV0dXJuIGFycmF5XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiB1cGRhdGUgdGhlIGhhc2hlcyBhbmQgY3VsbCB0aGUgaXRlbXMgaW4gdGhlIGxpc3RcclxuICAgICAqIEBwYXJhbSB7QUFCQn0gQUFCQlxyXG4gICAgICogQHBhcmFtIHtib29sZWFufSBbc2tpcFVwZGF0ZV0gc2tpcCB1cGRhdGluZyB0aGUgaGFzaGVzIG9mIGFsbCBvYmplY3RzXHJcbiAgICAgKiBAcmV0dXJuIHtudW1iZXJ9IG51bWJlciBvZiBidWNrZXRzIGluIHJlc3VsdHNcclxuICAgICAqL1xyXG4gICAgY3VsbChBQUJCLCBza2lwVXBkYXRlKVxyXG4gICAge1xyXG4gICAgICAgIGlmICghc2tpcFVwZGF0ZSlcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRoaXMudXBkYXRlT2JqZWN0cygpXHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMuaW52aXNpYmxlKClcclxuICAgICAgICBjb25zdCBvYmplY3RzID0gdGhpcy5xdWVyeShBQUJCLCB0aGlzLnNpbXBsZVRlc3QpXHJcbiAgICAgICAgb2JqZWN0cy5mb3JFYWNoKG9iamVjdCA9PiBvYmplY3RbdGhpcy52aXNpYmxlXSA9IHRydWUpXHJcbiAgICAgICAgcmV0dXJuIHRoaXMubGFzdEJ1Y2tldHNcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIHNldCBhbGwgb2JqZWN0cyBpbiBoYXNoIHRvIHZpc2libGU9ZmFsc2VcclxuICAgICAqL1xyXG4gICAgaW52aXNpYmxlKClcclxuICAgIHtcclxuICAgICAgICBmb3IgKGxldCBsaXN0IG9mIHRoaXMubGlzdHMpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBsaXN0LmZvckVhY2gob2JqZWN0ID0+IG9iamVjdFt0aGlzLnZpc2libGVdID0gZmFsc2UpXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogdXBkYXRlIHRoZSBoYXNoZXMgZm9yIGFsbCBvYmplY3RzXHJcbiAgICAgKiBhdXRvbWF0aWNhbGx5IGNhbGxlZCBmcm9tIHVwZGF0ZSgpIHdoZW4gc2tpcFVwZGF0ZT1mYWxzZVxyXG4gICAgICovXHJcbiAgICB1cGRhdGVPYmplY3RzKClcclxuICAgIHtcclxuICAgICAgICBpZiAodGhpcy5kaXJ0eVRlc3QpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBmb3IgKGxldCBsaXN0IG9mIHRoaXMubGlzdHMpXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGZvciAobGV0IG9iamVjdCBvZiBsaXN0KVxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChvYmplY3RbdGhpcy5kaXJ0eV0pXHJcbiAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnVwZGF0ZU9iamVjdChvYmplY3QpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG9iamVjdFt0aGlzLmRpcnR5XSA9IGZhbHNlXHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2VcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGZvciAobGV0IGxpc3Qgb2YgdGhpcy5saXN0cylcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgbGlzdC5mb3JFYWNoKG9iamVjdCA9PiB0aGlzLnVwZGF0ZU9iamVjdChvYmplY3QpKVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogdXBkYXRlIHRoZSBoYXMgb2YgYW4gb2JqZWN0XHJcbiAgICAgKiBhdXRvbWF0aWNhbGx5IGNhbGxlZCBmcm9tIHVwZGF0ZU9iamVjdHMoKVxyXG4gICAgICogQHBhcmFtIHsqfSBvYmplY3RcclxuICAgICAqIEBwYXJhbSB7Ym9vbGVhbn0gW2ZvcmNlXSBmb3JjZSB1cGRhdGUgZm9yIGNhbGN1bGF0ZVBJWElcclxuICAgICAqL1xyXG4gICAgdXBkYXRlT2JqZWN0KG9iamVjdClcclxuICAgIHtcclxuICAgICAgICBsZXQgQUFCQlxyXG4gICAgICAgIGlmICh0aGlzLmNhbGN1bGF0ZVBJWEkpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBjb25zdCBib3ggPSBvYmplY3QuZ2V0TG9jYWxCb3VuZHMoKVxyXG4gICAgICAgICAgICBBQUJCID0gb2JqZWN0W3RoaXMuQUFCQl0gPSB7XHJcbiAgICAgICAgICAgICAgICB4OiBvYmplY3QueCArIGJveC54ICogb2JqZWN0LnNjYWxlLngsXHJcbiAgICAgICAgICAgICAgICB5OiBvYmplY3QueSArIGJveC55ICogb2JqZWN0LnNjYWxlLnksXHJcbiAgICAgICAgICAgICAgICB3aWR0aDogYm94LndpZHRoICogb2JqZWN0LnNjYWxlLngsXHJcbiAgICAgICAgICAgICAgICBoZWlnaHQ6IGJveC5oZWlnaHQgKiBvYmplY3Quc2NhbGUueVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2VcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIEFBQkIgPSBvYmplY3RbdGhpcy5BQUJCXVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgY29uc3Qgc3BhdGlhbCA9IG9iamVjdFt0aGlzLnNwYXRpYWxdXHJcbiAgICAgICAgY29uc3QgeyB4U3RhcnQsIHlTdGFydCwgeEVuZCwgeUVuZCB9ID0gdGhpcy5nZXRCb3VuZHMoQUFCQilcclxuXHJcbiAgICAgICAgLy8gb25seSByZW1vdmUgYW5kIGluc2VydCBpZiBtYXBwaW5nIGhhcyBjaGFuZ2VkXHJcbiAgICAgICAgaWYgKHNwYXRpYWwueFN0YXJ0ICE9PSB4U3RhcnQgfHwgc3BhdGlhbC55U3RhcnQgIT09IHlTdGFydCB8fCBzcGF0aWFsLnhFbmQgIT09IHhFbmQgfHwgc3BhdGlhbC55RW5kICE9PSB5RW5kKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgaWYgKHNwYXRpYWwuaGFzaGVzLmxlbmd0aClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5yZW1vdmVGcm9tSGFzaChvYmplY3QpXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZm9yIChsZXQgeSA9IHlTdGFydDsgeSA8PSB5RW5kOyB5KyspXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGZvciAobGV0IHggPSB4U3RhcnQ7IHggPD0geEVuZDsgeCsrKVxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGtleSA9IHggKyAnLCcgKyB5XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5pbnNlcnQob2JqZWN0LCBrZXkpXHJcbiAgICAgICAgICAgICAgICAgICAgc3BhdGlhbC5oYXNoZXMucHVzaChrZXkpXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgc3BhdGlhbC54U3RhcnQgPSB4U3RhcnRcclxuICAgICAgICAgICAgc3BhdGlhbC55U3RhcnQgPSB5U3RhcnRcclxuICAgICAgICAgICAgc3BhdGlhbC54RW5kID0geEVuZFxyXG4gICAgICAgICAgICBzcGF0aWFsLnlFbmQgPSB5RW5kXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogZ2V0cyBoYXNoIGJvdW5kc1xyXG4gICAgICogQHBhcmFtIHtBQUJCfSBBQUJCXHJcbiAgICAgKiBAcmV0dXJuIHtCb3VuZHN9XHJcbiAgICAgKiBAcHJpdmF0ZVxyXG4gICAgICovXHJcbiAgICBnZXRCb3VuZHMoQUFCQilcclxuICAgIHtcclxuICAgICAgICBsZXQgeFN0YXJ0ID0gTWF0aC5mbG9vcihBQUJCLnggLyB0aGlzLnhTaXplKVxyXG4gICAgICAgIHhTdGFydCA9IHhTdGFydCA8IDAgPyAwIDogeFN0YXJ0XHJcbiAgICAgICAgbGV0IHlTdGFydCA9IE1hdGguZmxvb3IoQUFCQi55IC8gdGhpcy55U2l6ZSlcclxuICAgICAgICB5U3RhcnQgPSB5U3RhcnQgPCAwID8gMCA6IHlTdGFydFxyXG4gICAgICAgIGxldCB4RW5kID0gTWF0aC5mbG9vcigoQUFCQi54ICsgQUFCQi53aWR0aCkgLyB0aGlzLnhTaXplKVxyXG4gICAgICAgIGxldCB5RW5kID0gTWF0aC5mbG9vcigoQUFCQi55ICsgQUFCQi5oZWlnaHQpIC8gdGhpcy55U2l6ZSlcclxuICAgICAgICByZXR1cm4geyB4U3RhcnQsIHlTdGFydCwgeEVuZCwgeUVuZCB9XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBpbnNlcnQgb2JqZWN0IGludG8gdGhlIHNwYXRpYWwgaGFzaFxyXG4gICAgICogYXV0b21hdGljYWxseSBjYWxsZWQgZnJvbSB1cGRhdGVPYmplY3QoKVxyXG4gICAgICogQHBhcmFtIHsqfSBvYmplY3RcclxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBrZXlcclxuICAgICAqL1xyXG4gICAgaW5zZXJ0KG9iamVjdCwga2V5KVxyXG4gICAge1xyXG4gICAgICAgIGlmICghdGhpcy5oYXNoW2tleV0pXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aGlzLmhhc2hba2V5XSA9IFtvYmplY3RdXHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2VcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRoaXMuaGFzaFtrZXldLnB1c2gob2JqZWN0KVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIHJlbW92ZXMgb2JqZWN0IGZyb20gdGhlIGhhc2ggdGFibGVcclxuICAgICAqIHNob3VsZCBiZSBjYWxsZWQgd2hlbiByZW1vdmluZyBhbiBvYmplY3RcclxuICAgICAqIGF1dG9tYXRpY2FsbHkgY2FsbGVkIGZyb20gdXBkYXRlT2JqZWN0KClcclxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSBvYmplY3RcclxuICAgICAqL1xyXG4gICAgcmVtb3ZlRnJvbUhhc2gob2JqZWN0KVxyXG4gICAge1xyXG4gICAgICAgIGNvbnN0IHNwYXRpYWwgPSBvYmplY3RbdGhpcy5zcGF0aWFsXVxyXG4gICAgICAgIHdoaWxlIChzcGF0aWFsLmhhc2hlcy5sZW5ndGgpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBjb25zdCBrZXkgPSBzcGF0aWFsLmhhc2hlcy5wb3AoKVxyXG4gICAgICAgICAgICBjb25zdCBsaXN0ID0gdGhpcy5oYXNoW2tleV1cclxuICAgICAgICAgICAgbGlzdC5zcGxpY2UobGlzdC5pbmRleE9mKG9iamVjdCksIDEpXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogZ2V0IGFsbCBuZWlnaGJvcnMgdGhhdCBzaGFyZSB0aGUgc2FtZSBoYXNoIGFzIG9iamVjdFxyXG4gICAgICogQHBhcmFtIHsqfSBvYmplY3QgaW4gdGhlIHNwYXRpYWwgaGFzaFxyXG4gICAgICogQHJldHVybiB7QXJyYXl9IG9mIG9iamVjdHMgdGhhdCBhcmUgaW4gdGhlIHNhbWUgaGFzaCBhcyBvYmplY3RcclxuICAgICAqL1xyXG4gICAgbmVpZ2hib3JzKG9iamVjdClcclxuICAgIHtcclxuICAgICAgICBsZXQgcmVzdWx0cyA9IFtdXHJcbiAgICAgICAgb2JqZWN0W3RoaXMuc3BhdGlhbF0uaGFzaGVzLmZvckVhY2goa2V5ID0+IHJlc3VsdHMgPSByZXN1bHRzLmNvbmNhdCh0aGlzLmhhc2hba2V5XSkpXHJcbiAgICAgICAgcmV0dXJuIHJlc3VsdHNcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIHJldHVybnMgYW4gYXJyYXkgb2Ygb2JqZWN0cyBjb250YWluZWQgd2l0aGluIGJvdW5kaW5nIGJveFxyXG4gICAgICogQHBhcmFtIHtBQUJCfSBBQUJCIGJvdW5kaW5nIGJveCB0byBzZWFyY2hcclxuICAgICAqIEBwYXJhbSB7Ym9vbGVhbn0gW3NpbXBsZVRlc3Q9dHJ1ZV0gcGVyZm9ybSBhIHNpbXBsZSBib3VuZHMgY2hlY2sgb2YgYWxsIGl0ZW1zIGluIHRoZSBidWNrZXRzXHJcbiAgICAgKiBAcmV0dXJuIHtvYmplY3RbXX0gc2VhcmNoIHJlc3VsdHNcclxuICAgICAqL1xyXG4gICAgcXVlcnkoQUFCQiwgc2ltcGxlVGVzdClcclxuICAgIHtcclxuICAgICAgICBzaW1wbGVUZXN0ID0gdHlwZW9mIHNpbXBsZVRlc3QgIT09ICd1bmRlZmluZWQnID8gc2ltcGxlVGVzdCA6IHRydWVcclxuICAgICAgICBsZXQgYnVja2V0cyA9IDBcclxuICAgICAgICBsZXQgcmVzdWx0cyA9IFtdXHJcbiAgICAgICAgY29uc3QgeyB4U3RhcnQsIHlTdGFydCwgeEVuZCwgeUVuZCB9ID0gdGhpcy5nZXRCb3VuZHMoQUFCQilcclxuICAgICAgICBmb3IgKGxldCB5ID0geVN0YXJ0OyB5IDw9IHlFbmQ7IHkrKylcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGZvciAobGV0IHggPSB4U3RhcnQ7IHggPD0geEVuZDsgeCsrKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBlbnRyeSA9IHRoaXMuaGFzaFt4ICsgJywnICsgeV1cclxuICAgICAgICAgICAgICAgIGlmIChlbnRyeSlcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoc2ltcGxlVGVzdClcclxuICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGZvciAobGV0IG9iamVjdCBvZiBlbnRyeSlcclxuICAgICAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgYm94ID0gb2JqZWN0W3RoaXMuQUFCQl1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChib3gueCArIGJveC53aWR0aCA+IEFBQkIueCAmJiBib3gueCA8IEFBQkIueCArIEFBQkIud2lkdGggJiZcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJveC55ICsgYm94LmhlaWdodCA+IEFBQkIueSAmJiBib3gueSA8IEFBQkIueSArIEFBQkIuaGVpZ2h0KVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdHMucHVzaChvYmplY3QpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0cyA9IHJlc3VsdHMuY29uY2F0KGVudHJ5KVxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICBidWNrZXRzKytcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLmxhc3RCdWNrZXRzID0gYnVja2V0c1xyXG4gICAgICAgIHJldHVybiByZXN1bHRzXHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBpdGVyYXRlcyB0aHJvdWdoIG9iamVjdHMgY29udGFpbmVkIHdpdGhpbiBib3VuZGluZyBib3hcclxuICAgICAqIHN0b3BzIGl0ZXJhdGluZyBpZiB0aGUgY2FsbGJhY2sgcmV0dXJucyB0cnVlXHJcbiAgICAgKiBAcGFyYW0ge0FBQkJ9IEFBQkIgYm91bmRpbmcgYm94IHRvIHNlYXJjaFxyXG4gICAgICogQHBhcmFtIHtmdW5jdGlvbn0gY2FsbGJhY2tcclxuICAgICAqIEBwYXJhbSB7Ym9vbGVhbn0gW3NpbXBsZVRlc3Q9dHJ1ZV0gcGVyZm9ybSBhIHNpbXBsZSBib3VuZHMgY2hlY2sgb2YgYWxsIGl0ZW1zIGluIHRoZSBidWNrZXRzXHJcbiAgICAgKiBAcmV0dXJuIHtib29sZWFufSB0cnVlIGlmIGNhbGxiYWNrIHJldHVybmVkIGVhcmx5XHJcbiAgICAgKi9cclxuICAgIHF1ZXJ5Q2FsbGJhY2soQUFCQiwgY2FsbGJhY2ssIHNpbXBsZVRlc3QpXHJcbiAgICB7XHJcbiAgICAgICAgc2ltcGxlVGVzdCA9IHR5cGVvZiBzaW1wbGVUZXN0ICE9PSAndW5kZWZpbmVkJyA/IHNpbXBsZVRlc3QgOiB0cnVlXHJcbiAgICAgICAgY29uc3QgeyB4U3RhcnQsIHlTdGFydCwgeEVuZCwgeUVuZCB9ID0gdGhpcy5nZXRCb3VuZHMoQUFCQilcclxuICAgICAgICBmb3IgKGxldCB5ID0geVN0YXJ0OyB5IDw9IHlFbmQ7IHkrKylcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGZvciAobGV0IHggPSB4U3RhcnQ7IHggPD0geEVuZDsgeCsrKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBlbnRyeSA9IHRoaXMuaGFzaFt4ICsgJywnICsgeV1cclxuICAgICAgICAgICAgICAgIGlmIChlbnRyeSlcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGVudHJ5Lmxlbmd0aDsgaSsrKVxyXG4gICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3Qgb2JqZWN0ID0gZW50cnlbaV1cclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHNpbXBsZVRlc3QpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IEFBQkIgPSBvYmplY3QuQUFCQlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKEFBQkIueCArIEFBQkIud2lkdGggPiBBQUJCLnggJiYgQUFCQi54IDwgQUFCQi54ICsgQUFCQi53aWR0aCAmJlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgQUFCQi55ICsgQUFCQi5oZWlnaHQgPiBBQUJCLnkgJiYgQUFCQi55IDwgQUFCQi55ICsgQUFCQi5oZWlnaHQpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGNhbGxiYWNrKG9iamVjdCkpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChjYWxsYmFjayhvYmplY3QpKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB0cnVlXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIGZhbHNlXHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBnZXQgc3RhdHNcclxuICAgICAqIEByZXR1cm4ge1N0YXRzfVxyXG4gICAgICovXHJcbiAgICBzdGF0cygpXHJcbiAgICB7XHJcbiAgICAgICAgbGV0IHZpc2libGUgPSAwLCBjb3VudCA9IDBcclxuICAgICAgICBmb3IgKGxldCBsaXN0IG9mIHRoaXMubGlzdHMpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBsaXN0LmZvckVhY2gob2JqZWN0ID0+XHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHZpc2libGUgKz0gb2JqZWN0LnZpc2libGUgPyAxIDogMFxyXG4gICAgICAgICAgICAgICAgY291bnQrK1xyXG4gICAgICAgICAgICB9KVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgdG90YWw6IGNvdW50LFxyXG4gICAgICAgICAgICB2aXNpYmxlLFxyXG4gICAgICAgICAgICBjdWxsZWQ6IGNvdW50IC0gdmlzaWJsZVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIGhlbHBlciBmdW5jdGlvbiB0byBldmFsdWF0ZSBoYXNoIHRhYmxlXHJcbiAgICAgKiBAcmV0dXJuIHtudW1iZXJ9IHRoZSBudW1iZXIgb2YgYnVja2V0cyBpbiB0aGUgaGFzaCB0YWJsZVxyXG4gICAgICogKi9cclxuICAgIGdldEJ1Y2tldHMoKVxyXG4gICAge1xyXG4gICAgICAgIHJldHVybiBPYmplY3Qua2V5cyh0aGlzLmhhc2gpLmxlbmd0aFxyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogaGVscGVyIGZ1bmN0aW9uIHRvIGV2YWx1YXRlIGhhc2ggdGFibGVcclxuICAgICAqIEByZXR1cm4ge251bWJlcn0gdGhlIGF2ZXJhZ2UgbnVtYmVyIG9mIGVudHJpZXMgaW4gZWFjaCBidWNrZXRcclxuICAgICAqL1xyXG4gICAgZ2V0QXZlcmFnZVNpemUoKVxyXG4gICAge1xyXG4gICAgICAgIGxldCB0b3RhbCA9IDBcclxuICAgICAgICBmb3IgKGxldCBrZXkgaW4gdGhpcy5oYXNoKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdG90YWwgKz0gdGhpcy5oYXNoW2tleV0ubGVuZ3RoXHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiB0b3RhbCAvIHRoaXMuZ2V0QnVja2V0cygpXHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBoZWxwZXIgZnVuY3Rpb24gdG8gZXZhbHVhdGUgdGhlIGhhc2ggdGFibGVcclxuICAgICAqIEByZXR1cm4ge251bWJlcn0gdGhlIGxhcmdlc3Qgc2l6ZWQgYnVja2V0XHJcbiAgICAgKi9cclxuICAgIGdldExhcmdlc3QoKVxyXG4gICAge1xyXG4gICAgICAgIGxldCBsYXJnZXN0ID0gMFxyXG4gICAgICAgIGZvciAobGV0IGtleSBpbiB0aGlzLmhhc2gpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBpZiAodGhpcy5oYXNoW2tleV0ubGVuZ3RoID4gbGFyZ2VzdClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgbGFyZ2VzdCA9IHRoaXMuaGFzaFtrZXldLmxlbmd0aFxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBsYXJnZXN0XHJcbiAgICB9XHJcblxyXG4gICAgLyoqIGhlbHBlciBmdW5jdGlvbiB0byBldmFsdXRlIHRoZSBoYXNoIHRhYmxlXHJcbiAgICAgKiBAcGFyYW0ge0FBQkJ9IEFBQkIgYm91bmRpbmcgYm94IHRvIHNlYXJjaFxyXG4gICAgICogQHJldHVybiB7bnVtYmVyfSBzcGFyc2VuZXNzIHBlcmNlbnRhZ2UgKGkuZS4sIGJ1Y2tldHMgd2l0aCBhdCBsZWFzdCAxIGVsZW1lbnQgZGl2aWRlZCBieSB0b3RhbCBwb3NzaWJsZSBidWNrZXRzKVxyXG4gICAgICovXHJcbiAgICBnZXRTcGFyc2VuZXNzKEFBQkIpXHJcbiAgICB7XHJcbiAgICAgICAgbGV0IGNvdW50ID0gMCwgdG90YWwgPSAwXHJcbiAgICAgICAgY29uc3QgeyB4U3RhcnQsIHlTdGFydCwgeEVuZCwgeUVuZCB9ID0gdGhpcy5nZXRCb3VuZHMoQUFCQilcclxuICAgICAgICBmb3IgKGxldCB5ID0geVN0YXJ0OyB5IDwgeUVuZDsgeSsrKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgZm9yIChsZXQgeCA9IHhTdGFydDsgeCA8IHhFbmQ7IHgrKylcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgY291bnQgKz0gKHRoaXMuaGFzaFt4ICsgJywnICsgeV0gPyAxIDogMClcclxuICAgICAgICAgICAgICAgIHRvdGFsKytcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gY291bnQgLyB0b3RhbFxyXG4gICAgfVxyXG59XHJcblxyXG4vKipcclxuICogQHR5cGVkZWYge29iamVjdH0gU3RhdHNcclxuICogQHByb3BlcnR5IHtudW1iZXJ9IHRvdGFsXHJcbiAqIEBwcm9wZXJ0eSB7bnVtYmVyfSB2aXNpYmxlXHJcbiAqIEBwcm9wZXJ0eSB7bnVtYmVyfSBjdWxsZWRcclxuICovXHJcblxyXG4vKipcclxuICogQHR5cGVkZWYge29iamVjdH0gQm91bmRzXHJcbiAqIEBwcm9wZXJ0eSB7bnVtYmVyfSB4U3RhcnRcclxuICogQHByb3BlcnR5IHtudW1iZXJ9IHlTdGFydFxyXG4gKiBAcHJvcGVydHkge251bWJlcn0geEVuZFxyXG4gKiBAcHJvcGVydHkge251bWJlcn0geEVuZFxyXG4gKi9cclxuXHJcbi8qKlxyXG4gICogQHR5cGVkZWYge29iamVjdH0gQUFCQlxyXG4gICogQHByb3BlcnR5IHtudW1iZXJ9IHhcclxuICAqIEBwcm9wZXJ0eSB7bnVtYmVyfSB5XHJcbiAgKiBAcHJvcGVydHkge251bWJlcn0gd2lkdGhcclxuICAqIEBwcm9wZXJ0eSB7bnVtYmVyfSBoZWlnaHRcclxuICAqL1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBTcGF0aWFsSGFzaCJdfQ==