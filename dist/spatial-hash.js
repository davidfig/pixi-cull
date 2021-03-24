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
         * @param {Function} [callback] callback for each item that is not culled - note, this function is called before setting `object.visible=true`
         * @return {number} number of buckets in results
         */

    }, {
        key: 'cull',
        value: function cull(AABB, skipUpdate, callback) {
            var _this2 = this;

            if (!skipUpdate) {
                this.updateObjects();
            }
            this.invisible();
            var objects = void 0;
            if (callback) {
                objects = this.queryCallbackAll(AABB, this.simpleTest, callback);
            } else {
                objects = this.query(AABB, this.simpleTest);
            }
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
                    x: object.x + (box.x - object.pivot.x) * object.scale.x,
                    y: object.y + (box.y - object.pivot.y) * object.scale.y,
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
         * returns an array of objects contained within bounding box with a callback on each non-culled object
         * this function is different from queryCallback, which cancels the query when a callback returns true
         * @param {AABB} AABB bounding box to search
         * @param {boolean} [simpleTest=true] perform a simple bounds check of all items in the buckets
         * @param {Function} callback - function to run for each non-culled object
         * @return {object[]} search results
         */

    }, {
        key: 'queryCallbackAll',
        value: function queryCallbackAll(AABB, simpleTest, callback) {
            simpleTest = typeof simpleTest !== 'undefined' ? simpleTest : true;
            var buckets = 0;
            var results = [];

            var _getBounds3 = this.getBounds(AABB),
                xStart = _getBounds3.xStart,
                yStart = _getBounds3.yStart,
                xEnd = _getBounds3.xEnd,
                yEnd = _getBounds3.yEnd;

            for (var y = yStart; y <= yEnd; y++) {
                for (var x = xStart; x <= xEnd; x++) {
                    var entry = this.hash[x + ',' + y];
                    if (entry) {
                        if (simpleTest) {
                            var _iteratorNormalCompletion8 = true;
                            var _didIteratorError8 = false;
                            var _iteratorError8 = undefined;

                            try {
                                for (var _iterator8 = entry[Symbol.iterator](), _step8; !(_iteratorNormalCompletion8 = (_step8 = _iterator8.next()).done); _iteratorNormalCompletion8 = true) {
                                    var object = _step8.value;

                                    var box = object[this.AABB];
                                    if (box.x + box.width > AABB.x && box.x < AABB.x + AABB.width && box.y + box.height > AABB.y && box.y < AABB.y + AABB.height) {
                                        results.push(object);
                                        callback(object);
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
                        } else {
                            results = results.concat(entry);
                            var _iteratorNormalCompletion9 = true;
                            var _didIteratorError9 = false;
                            var _iteratorError9 = undefined;

                            try {
                                for (var _iterator9 = entry[Symbol.iterator](), _step9; !(_iteratorNormalCompletion9 = (_step9 = _iterator9.next()).done); _iteratorNormalCompletion9 = true) {
                                    var _object2 = _step9.value;

                                    callback(_object2);
                                }
                            } catch (err) {
                                _didIteratorError9 = true;
                                _iteratorError9 = err;
                            } finally {
                                try {
                                    if (!_iteratorNormalCompletion9 && _iterator9.return) {
                                        _iterator9.return();
                                    }
                                } finally {
                                    if (_didIteratorError9) {
                                        throw _iteratorError9;
                                    }
                                }
                            }
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

            var _getBounds4 = this.getBounds(AABB),
                xStart = _getBounds4.xStart,
                yStart = _getBounds4.yStart,
                xEnd = _getBounds4.xEnd,
                yEnd = _getBounds4.yEnd;

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
            var _iteratorNormalCompletion10 = true;
            var _didIteratorError10 = false;
            var _iteratorError10 = undefined;

            try {
                for (var _iterator10 = this.containers[Symbol.iterator](), _step10; !(_iteratorNormalCompletion10 = (_step10 = _iterator10.next()).done); _iteratorNormalCompletion10 = true) {
                    var list = _step10.value;

                    for (var i = 0; i < list.children.length; i++) {
                        var object = list.children[i];
                        visible += object.visible ? 1 : 0;
                        count++;
                    }
                }
            } catch (err) {
                _didIteratorError10 = true;
                _iteratorError10 = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion10 && _iterator10.return) {
                        _iterator10.return();
                    }
                } finally {
                    if (_didIteratorError10) {
                        throw _iteratorError10;
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
 * @property {number} buckets
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL2NvZGUvc3BhdGlhbC1oYXNoLmpzIl0sIm5hbWVzIjpbIlNwYXRpYWxIYXNoIiwib3B0aW9ucyIsInhTaXplIiwic2l6ZSIsInlTaXplIiwiQUFCQiIsInR5cGUiLCJzcGF0aWFsIiwiY2FsY3VsYXRlUElYSSIsInZpc2libGVUZXh0IiwidmlzaWJsZVRlc3QiLCJzaW1wbGVUZXN0IiwiZGlydHlUZXN0IiwidmlzaWJsZSIsImRpcnR5Iiwid2lkdGgiLCJoZWlnaHQiLCJoYXNoIiwib2JqZWN0cyIsImNvbnRhaW5lcnMiLCJvYmplY3QiLCJzdGF0aWNPYmplY3QiLCJoYXNoZXMiLCJ1cGRhdGVPYmplY3QiLCJwdXNoIiwic3BsaWNlIiwibGlzdCIsImluZGV4T2YiLCJyZW1vdmVGcm9tSGFzaCIsImNvbnRhaW5lciIsImFkZGVkIiwiYmluZCIsInJlbW92ZWQiLCJjaGlsZHJlbiIsImN1bGwiLCJvbiIsInN0YXRpYyIsImZvckVhY2giLCJvZmYiLCJza2lwVXBkYXRlIiwiY2FsbGJhY2siLCJ1cGRhdGVPYmplY3RzIiwiaW52aXNpYmxlIiwicXVlcnlDYWxsYmFja0FsbCIsInF1ZXJ5IiwibGFzdEJ1Y2tldHMiLCJib3giLCJnZXRMb2NhbEJvdW5kcyIsIngiLCJwaXZvdCIsInNjYWxlIiwieSIsImdldEJvdW5kcyIsInhTdGFydCIsInlTdGFydCIsInhFbmQiLCJ5RW5kIiwibGVuZ3RoIiwia2V5IiwiaW5zZXJ0IiwibWluaW11bSIsIk1hdGgiLCJmbG9vciIsInBvcCIsInJlc3VsdHMiLCJjb25jYXQiLCJidWNrZXRzIiwiZW50cnkiLCJpIiwiY291bnQiLCJ0b3RhbCIsImN1bGxlZCIsIk9iamVjdCIsImtleXMiLCJnZXRCdWNrZXRzIiwibGFyZ2VzdCIsIkluZmluaXR5Iiwic3BsaXQiLCJwYXJzZUludCIsImdldFdvcmxkQm91bmRzIiwibW9kdWxlIiwiZXhwb3J0cyJdLCJtYXBwaW5ncyI6Ijs7Ozs7O0FBQUE7QUFDQTtBQUNBOztJQUVNQSxX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Z0JBRWNDLElBRmQsUUFFY0EsSUFGZDs7QUFHaEIsaUJBQUssSUFBSUwsSUFBSUcsTUFBYixFQUFxQkgsSUFBSUssSUFBekIsRUFBK0JMLEdBQS9CLEVBQW9DO0FBQ2hDLHFCQUFLLElBQUlILElBQUlLLE1BQWIsRUFBcUJMLElBQUlPLElBQXpCLEVBQStCUCxHQUEvQixFQUFvQztBQUNoQ3FCLDZCQUFVLEtBQUtwRCxJQUFMLENBQVUrQixJQUFJLEdBQUosR0FBVUcsQ0FBcEIsSUFBeUIsQ0FBekIsR0FBNkIsQ0FBdkM7QUFDQW1CO0FBQ0g7QUFDSjtBQUNELG1CQUFPRCxRQUFRQyxLQUFmO0FBQ0g7Ozs7OztBQUdMOzs7Ozs7OztBQVFBOzs7Ozs7OztBQVFBOzs7Ozs7OztBQVFBVSxPQUFPQyxPQUFQLEdBQWlCakYsV0FBakIiLCJmaWxlIjoic3BhdGlhbC1oYXNoLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMTggWU9QRVkgWU9QRVkgTExDXG4vLyBEYXZpZCBGaWdhdG5lclxuLy8gTUlUIExpY2Vuc2VcblxuY2xhc3MgU3BhdGlhbEhhc2gge1xuICAgIC8qKlxuICAgICAqIGNyZWF0ZXMgYSBzcGF0aWFsLWhhc2ggY3VsbFxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSBbb3B0aW9uc11cbiAgICAgKiBAcGFyYW0ge251bWJlcn0gW29wdGlvbnMuc2l6ZT0xMDAwXSBjZWxsIHNpemUgdXNlZCB0byBjcmVhdGUgaGFzaCAoeFNpemUgPSB5U2l6ZSlcbiAgICAgKiBAcGFyYW0ge251bWJlcn0gW29wdGlvbnMueFNpemVdIGhvcml6b250YWwgY2VsbCBzaXplXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IFtvcHRpb25zLnlTaXplXSB2ZXJ0aWNhbCBjZWxsIHNpemVcbiAgICAgKiBAcGFyYW0ge2Jvb2xlYW59IFtvcHRpb25zLmNhbGN1bGF0ZVBJWEk9dHJ1ZV0gY2FsY3VsYXRlIGJvdW5kaW5nIGJveCBhdXRvbWF0aWNhbGx5OyBpZiB0aGlzIGlzIHNldCB0byBmYWxzZSB0aGVuIGl0IHVzZXMgb2JqZWN0W29wdGlvbnMuQUFCQl0gZm9yIGJvdW5kaW5nIGJveFxuICAgICAqIEBwYXJhbSB7Ym9vbGVhbn0gW29wdGlvbnMudmlzaWJsZT12aXNpYmxlXSBwYXJhbWV0ZXIgb2YgdGhlIG9iamVjdCB0byBzZXQgKHVzdWFsbHkgdmlzaWJsZSBvciByZW5kZXJhYmxlKVxuICAgICAqIEBwYXJhbSB7Ym9vbGVhbn0gW29wdGlvbnMuc2ltcGxlVGVzdD10cnVlXSBpdGVyYXRlIHRocm91Z2ggdmlzaWJsZSBidWNrZXRzIHRvIGNoZWNrIGZvciBib3VuZHNcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gW29wdGlvbnMuZGlydHlUZXN0PXRydWVdIG9ubHkgdXBkYXRlIHNwYXRpYWwgaGFzaCBmb3Igb2JqZWN0cyB3aXRoIG9iamVjdFtvcHRpb25zLmRpcnR5VGVzdF09dHJ1ZTsgdGhpcyBoYXMgYSBIVUdFIGltcGFjdCBvbiBwZXJmb3JtYW5jZVxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBbb3B0aW9ucy5BQUJCPUFBQkJdIG9iamVjdCBwcm9wZXJ0eSB0aGF0IGhvbGRzIGJvdW5kaW5nIGJveCBzbyB0aGF0IG9iamVjdFt0eXBlXSA9IHsgeDogbnVtYmVyLCB5OiBudW1iZXIsIHdpZHRoOiBudW1iZXIsIGhlaWdodDogbnVtYmVyIH1cbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gW29wdGlvbnMuc3BhdGlhbD1zcGF0aWFsXSBvYmplY3QgcHJvcGVydHkgdGhhdCBob2xkcyBvYmplY3QncyBoYXNoIGxpc3RcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gW29wdGlvbnMuZGlydHk9ZGlydHldIG9iamVjdCBwcm9wZXJ0eSBmb3IgZGlydHlUZXN0XG4gICAgICovXG4gICAgY29uc3RydWN0b3Iob3B0aW9ucykge1xuICAgICAgICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fVxuICAgICAgICB0aGlzLnhTaXplID0gb3B0aW9ucy54U2l6ZSB8fCBvcHRpb25zLnNpemUgfHwgMTAwMFxuICAgICAgICB0aGlzLnlTaXplID0gb3B0aW9ucy55U2l6ZSB8fCBvcHRpb25zLnNpemUgfHwgMTAwMFxuICAgICAgICB0aGlzLkFBQkIgPSBvcHRpb25zLnR5cGUgfHwgJ0FBQkInXG4gICAgICAgIHRoaXMuc3BhdGlhbCA9IG9wdGlvbnMuc3BhdGlhbCB8fCAnc3BhdGlhbCdcbiAgICAgICAgdGhpcy5jYWxjdWxhdGVQSVhJID0gdHlwZW9mIG9wdGlvbnMuY2FsY3VsYXRlUElYSSAhPT0gJ3VuZGVmaW5lZCcgPyBvcHRpb25zLmNhbGN1bGF0ZVBJWEkgOiB0cnVlXG4gICAgICAgIHRoaXMudmlzaWJsZVRleHQgPSB0eXBlb2Ygb3B0aW9ucy52aXNpYmxlVGVzdCAhPT0gJ3VuZGVmaW5lZCcgPyBvcHRpb25zLnZpc2libGVUZXN0IDogdHJ1ZVxuICAgICAgICB0aGlzLnNpbXBsZVRlc3QgPSB0eXBlb2Ygb3B0aW9ucy5zaW1wbGVUZXN0ICE9PSAndW5kZWZpbmVkJyA/IG9wdGlvbnMuc2ltcGxlVGVzdCA6IHRydWVcbiAgICAgICAgdGhpcy5kaXJ0eVRlc3QgPSB0eXBlb2Ygb3B0aW9ucy5kaXJ0eVRlc3QgIT09ICd1bmRlZmluZWQnID8gb3B0aW9ucy5kaXJ0eVRlc3QgOiB0cnVlXG4gICAgICAgIHRoaXMudmlzaWJsZSA9IG9wdGlvbnMudmlzaWJsZSB8fCAndmlzaWJsZSdcbiAgICAgICAgdGhpcy5kaXJ0eSA9IG9wdGlvbnMuZGlydHkgfHwgJ2RpcnR5J1xuICAgICAgICB0aGlzLndpZHRoID0gdGhpcy5oZWlnaHQgPSAwXG4gICAgICAgIHRoaXMuaGFzaCA9IHt9XG4gICAgICAgIHRoaXMub2JqZWN0cyA9IFtdXG4gICAgICAgIHRoaXMuY29udGFpbmVycyA9IFtdXG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogYWRkIGFuIG9iamVjdCB0byBiZSBjdWxsZWRcbiAgICAgKiBzaWRlIGVmZmVjdDogYWRkcyBvYmplY3Quc3BhdGlhbEhhc2hlcyB0byB0cmFjayBleGlzdGluZyBoYXNoZXNcbiAgICAgKiBAcGFyYW0geyp9IG9iamVjdFxuICAgICAqIEBwYXJhbSB7Ym9vbGVhbn0gW3N0YXRpY09iamVjdF0gc2V0IHRvIHRydWUgaWYgdGhlIG9iamVjdCdzIHBvc2l0aW9uL3NpemUgZG9lcyBub3QgY2hhbmdlXG4gICAgICogQHJldHVybiB7Kn0gb2JqZWN0XG4gICAgICovXG4gICAgYWRkKG9iamVjdCwgc3RhdGljT2JqZWN0KSB7XG4gICAgICAgIG9iamVjdFt0aGlzLnNwYXRpYWxdID0geyBoYXNoZXM6IFtdIH1cbiAgICAgICAgaWYgKHRoaXMuY2FsY3VsYXRlUElYSSAmJiB0aGlzLmRpcnR5VGVzdCkge1xuICAgICAgICAgICAgb2JqZWN0W3RoaXMuZGlydHldID0gdHJ1ZVxuICAgICAgICB9XG4gICAgICAgIGlmIChzdGF0aWNPYmplY3QpIHtcbiAgICAgICAgICAgIG9iamVjdC5zdGF0aWNPYmplY3QgPSB0cnVlXG4gICAgICAgIH1cbiAgICAgICAgdGhpcy51cGRhdGVPYmplY3Qob2JqZWN0KVxuICAgICAgICB0aGlzLmNvbnRhaW5lcnNbMF0ucHVzaChvYmplY3QpXG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogcmVtb3ZlIGFuIG9iamVjdCBhZGRlZCBieSBhZGQoKVxuICAgICAqIEBwYXJhbSB7Kn0gb2JqZWN0XG4gICAgICogQHJldHVybiB7Kn0gb2JqZWN0XG4gICAgICovXG4gICAgcmVtb3ZlKG9iamVjdCkge1xuICAgICAgICB0aGlzLmNvbnRhaW5lcnNbMF0uc3BsaWNlKHRoaXMubGlzdFswXS5pbmRleE9mKG9iamVjdCksIDEpXG4gICAgICAgIHRoaXMucmVtb3ZlRnJvbUhhc2gob2JqZWN0KVxuICAgICAgICByZXR1cm4gb2JqZWN0XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogYWRkIGFuIGFycmF5IG9mIG9iamVjdHMgdG8gYmUgY3VsbGVkXG4gICAgICogQHBhcmFtIHtQSVhJLkNvbnRhaW5lcn0gY29udGFpbmVyXG4gICAgICogQHBhcmFtIHtib29sZWFufSBbc3RhdGljT2JqZWN0XSBzZXQgdG8gdHJ1ZSBpZiB0aGUgb2JqZWN0cyBpbiB0aGUgY29udGFpbmVyJ3MgcG9zaXRpb24vc2l6ZSBkbyBub3QgY2hhbmdlXG4gICAgICogbm90ZTogdGhpcyBvbmx5IHdvcmtzIHdpdGggcGl4aSB2NS4wLjByYzIrIGJlY2F1c2UgaXQgcmVsaWVzIG9uIHRoZSBuZXcgY29udGFpbmVyIGV2ZW50cyBjaGlsZEFkZGVkIGFuZCBjaGlsZFJlbW92ZWRcbiAgICAgKi9cbiAgICBhZGRDb250YWluZXIoY29udGFpbmVyLCBzdGF0aWNPYmplY3QpIHtcbiAgICAgICAgY29uc3QgYWRkZWQgPSBmdW5jdGlvbihvYmplY3QpIHtcbiAgICAgICAgICAgIG9iamVjdFt0aGlzLnNwYXRpYWxdID0geyBoYXNoZXM6IFtdIH1cbiAgICAgICAgICAgIHRoaXMudXBkYXRlT2JqZWN0KG9iamVjdClcbiAgICAgICAgfS5iaW5kKHRoaXMpXG5cbiAgICAgICAgY29uc3QgcmVtb3ZlZCA9IGZ1bmN0aW9uIChvYmplY3QpIHtcbiAgICAgICAgICAgIHRoaXMucmVtb3ZlRnJvbUhhc2gob2JqZWN0KVxuICAgICAgICB9LmJpbmQodGhpcylcblxuICAgICAgICBmb3IgKGxldCBvYmplY3Qgb2YgY29udGFpbmVyLmNoaWxkcmVuKSB7XG4gICAgICAgICAgICBvYmplY3RbdGhpcy5zcGF0aWFsXSA9IHsgaGFzaGVzOiBbXSB9XG4gICAgICAgICAgICB0aGlzLnVwZGF0ZU9iamVjdChvYmplY3QpXG4gICAgICAgIH1cbiAgICAgICAgY29udGFpbmVyLmN1bGwgPSB7fVxuICAgICAgICB0aGlzLmNvbnRhaW5lcnMucHVzaChjb250YWluZXIpXG4gICAgICAgIGNvbnRhaW5lci5vbignY2hpbGRBZGRlZCcsIGFkZGVkKVxuICAgICAgICBjb250YWluZXIub24oJ2NoaWxkUmVtb3ZlZCcsIHJlbW92ZWQpXG4gICAgICAgIGNvbnRhaW5lci5jdWxsLmFkZGVkID0gYWRkZWRcbiAgICAgICAgY29udGFpbmVyLmN1bGwucmVtb3ZlZCA9IHJlbW92ZWRcbiAgICAgICAgaWYgKHN0YXRpY09iamVjdCkge1xuICAgICAgICAgICAgY29udGFpbmVyLmN1bGwuc3RhdGljID0gdHJ1ZVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogcmVtb3ZlIGFuIGFycmF5IGFkZGVkIGJ5IGFkZENvbnRhaW5lcigpXG4gICAgICogQHBhcmFtIHtQSVhJLkNvbnRhaW5lcn0gY29udGFpbmVyXG4gICAgICogQHJldHVybiB7UElYSS5Db250YWluZXJ9IGNvbnRhaW5lclxuICAgICAqL1xuICAgIHJlbW92ZUNvbnRhaW5lcihjb250YWluZXIpIHtcbiAgICAgICAgdGhpcy5jb250YWluZXJzLnNwbGljZSh0aGlzLmNvbnRhaW5lcnMuaW5kZXhPZihjb250YWluZXIpLCAxKVxuICAgICAgICBjb250YWluZXIuY2hpbGRyZW4uZm9yRWFjaChvYmplY3QgPT4gdGhpcy5yZW1vdmVGcm9tSGFzaChvYmplY3QpKVxuICAgICAgICBjb250YWluZXIub2ZmKCdhZGRlZCcsIGNvbnRhaW5lci5jdWxsLmFkZGVkKVxuICAgICAgICBjb250YWluZXIub2ZmKCdyZW1vdmVkJywgY29udGFpbmVyLmN1bGwucmVtb3ZlZClcbiAgICAgICAgZGVsZXRlIGNvbnRhaW5lci5jdWxsXG4gICAgICAgIHJldHVybiBjb250YWluZXJcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiB1cGRhdGUgdGhlIGhhc2hlcyBhbmQgY3VsbCB0aGUgaXRlbXMgaW4gdGhlIGxpc3RcbiAgICAgKiBAcGFyYW0ge0FBQkJ9IEFBQkJcbiAgICAgKiBAcGFyYW0ge2Jvb2xlYW59IFtza2lwVXBkYXRlXSBza2lwIHVwZGF0aW5nIHRoZSBoYXNoZXMgb2YgYWxsIG9iamVjdHNcbiAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBbY2FsbGJhY2tdIGNhbGxiYWNrIGZvciBlYWNoIGl0ZW0gdGhhdCBpcyBub3QgY3VsbGVkIC0gbm90ZSwgdGhpcyBmdW5jdGlvbiBpcyBjYWxsZWQgYmVmb3JlIHNldHRpbmcgYG9iamVjdC52aXNpYmxlPXRydWVgXG4gICAgICogQHJldHVybiB7bnVtYmVyfSBudW1iZXIgb2YgYnVja2V0cyBpbiByZXN1bHRzXG4gICAgICovXG4gICAgY3VsbChBQUJCLCBza2lwVXBkYXRlLCBjYWxsYmFjaykge1xuICAgICAgICBpZiAoIXNraXBVcGRhdGUpIHtcbiAgICAgICAgICAgIHRoaXMudXBkYXRlT2JqZWN0cygpXG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5pbnZpc2libGUoKVxuICAgICAgICBsZXQgb2JqZWN0c1xuICAgICAgICBpZiAoY2FsbGJhY2spIHtcbiAgICAgICAgICAgIG9iamVjdHMgPSB0aGlzLnF1ZXJ5Q2FsbGJhY2tBbGwoQUFCQiwgdGhpcy5zaW1wbGVUZXN0LCBjYWxsYmFjaylcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIG9iamVjdHMgPSB0aGlzLnF1ZXJ5KEFBQkIsIHRoaXMuc2ltcGxlVGVzdClcbiAgICAgICAgfVxuICAgICAgICBvYmplY3RzLmZvckVhY2gob2JqZWN0ID0+IG9iamVjdFt0aGlzLnZpc2libGVdID0gdHJ1ZSlcbiAgICAgICAgcmV0dXJuIHRoaXMubGFzdEJ1Y2tldHNcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBzZXQgYWxsIG9iamVjdHMgaW4gaGFzaCB0byB2aXNpYmxlPWZhbHNlXG4gICAgICovXG4gICAgaW52aXNpYmxlKCkge1xuICAgICAgICBmb3IgKGxldCBjb250YWluZXIgb2YgdGhpcy5jb250YWluZXJzKSB7XG4gICAgICAgICAgICBjb250YWluZXIuY2hpbGRyZW4uZm9yRWFjaChvYmplY3QgPT4gb2JqZWN0W3RoaXMudmlzaWJsZV0gPSBmYWxzZSlcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIHVwZGF0ZSB0aGUgaGFzaGVzIGZvciBhbGwgb2JqZWN0c1xuICAgICAqIGF1dG9tYXRpY2FsbHkgY2FsbGVkIGZyb20gdXBkYXRlKCkgd2hlbiBza2lwVXBkYXRlPWZhbHNlXG4gICAgICovXG4gICAgdXBkYXRlT2JqZWN0cygpIHtcbiAgICAgICAgaWYgKHRoaXMuZGlydHlUZXN0KSB7XG4gICAgICAgICAgICBmb3IgKGxldCBvYmplY3Qgb2YgdGhpcy5vYmplY3RzKSB7XG4gICAgICAgICAgICAgICAgaWYgKG9iamVjdFt0aGlzLmRpcnR5XSkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnVwZGF0ZU9iamVjdChvYmplY3QpXG4gICAgICAgICAgICAgICAgICAgIG9iamVjdFt0aGlzLmRpcnR5XSA9IGZhbHNlXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZm9yIChsZXQgY29udGFpbmVyIG9mIHRoaXMuY29udGFpbmVycykge1xuICAgICAgICAgICAgICAgIGZvciAobGV0IG9iamVjdCBvZiBjb250YWluZXIuY2hpbGRyZW4pIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKG9iamVjdFt0aGlzLmRpcnR5XSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy51cGRhdGVPYmplY3Qob2JqZWN0KVxuICAgICAgICAgICAgICAgICAgICAgICAgb2JqZWN0W3RoaXMuZGlydHldID0gZmFsc2VcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGZvciAobGV0IGNvbnRhaW5lciBvZiB0aGlzLmNvbnRhaW5lcnMpIHtcbiAgICAgICAgICAgICAgICBpZiAoIWNvbnRhaW5lci5jdWxsLnN0YXRpYykge1xuICAgICAgICAgICAgICAgICAgICBjb250YWluZXIuY2hpbGRyZW4uZm9yRWFjaChvYmplY3QgPT4gdGhpcy51cGRhdGVPYmplY3Qob2JqZWN0KSlcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiB1cGRhdGUgdGhlIGhhcyBvZiBhbiBvYmplY3RcbiAgICAgKiBhdXRvbWF0aWNhbGx5IGNhbGxlZCBmcm9tIHVwZGF0ZU9iamVjdHMoKVxuICAgICAqIEBwYXJhbSB7Kn0gb2JqZWN0XG4gICAgICogQHBhcmFtIHtib29sZWFufSBbZm9yY2VdIGZvcmNlIHVwZGF0ZSBmb3IgY2FsY3VsYXRlUElYSVxuICAgICAqL1xuICAgIHVwZGF0ZU9iamVjdChvYmplY3QpIHtcbiAgICAgICAgbGV0IEFBQkJcbiAgICAgICAgaWYgKHRoaXMuY2FsY3VsYXRlUElYSSkge1xuICAgICAgICAgICAgY29uc3QgYm94ID0gb2JqZWN0LmdldExvY2FsQm91bmRzKClcbiAgICAgICAgICAgIEFBQkIgPSBvYmplY3RbdGhpcy5BQUJCXSA9IHtcbiAgICAgICAgICAgICAgICB4OiBvYmplY3QueCArIChib3gueCAtIG9iamVjdC5waXZvdC54KSAqIG9iamVjdC5zY2FsZS54LFxuICAgICAgICAgICAgICAgIHk6IG9iamVjdC55ICsgKGJveC55IC0gb2JqZWN0LnBpdm90LnkpICogb2JqZWN0LnNjYWxlLnksXG4gICAgICAgICAgICAgICAgd2lkdGg6IGJveC53aWR0aCAqIG9iamVjdC5zY2FsZS54LFxuICAgICAgICAgICAgICAgIGhlaWdodDogYm94LmhlaWdodCAqIG9iamVjdC5zY2FsZS55XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBBQUJCID0gb2JqZWN0W3RoaXMuQUFCQl1cbiAgICAgICAgfVxuXG4gICAgICAgIGxldCBzcGF0aWFsID0gb2JqZWN0W3RoaXMuc3BhdGlhbF1cbiAgICAgICAgaWYgKCFzcGF0aWFsKSB7XG4gICAgICAgICAgICBzcGF0aWFsID0gb2JqZWN0W3RoaXMuc3BhdGlhbF0gPSB7IGhhc2hlczogW10gfVxuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHsgeFN0YXJ0LCB5U3RhcnQsIHhFbmQsIHlFbmQgfSA9IHRoaXMuZ2V0Qm91bmRzKEFBQkIpXG5cbiAgICAgICAgLy8gb25seSByZW1vdmUgYW5kIGluc2VydCBpZiBtYXBwaW5nIGhhcyBjaGFuZ2VkXG4gICAgICAgIGlmIChzcGF0aWFsLnhTdGFydCAhPT0geFN0YXJ0IHx8IHNwYXRpYWwueVN0YXJ0ICE9PSB5U3RhcnQgfHwgc3BhdGlhbC54RW5kICE9PSB4RW5kIHx8IHNwYXRpYWwueUVuZCAhPT0geUVuZCkge1xuICAgICAgICAgICAgaWYgKHNwYXRpYWwuaGFzaGVzLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgIHRoaXMucmVtb3ZlRnJvbUhhc2gob2JqZWN0KVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZm9yIChsZXQgeSA9IHlTdGFydDsgeSA8PSB5RW5kOyB5KyspIHtcbiAgICAgICAgICAgICAgICBmb3IgKGxldCB4ID0geFN0YXJ0OyB4IDw9IHhFbmQ7IHgrKykge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBrZXkgPSB4ICsgJywnICsgeVxuICAgICAgICAgICAgICAgICAgICB0aGlzLmluc2VydChvYmplY3QsIGtleSlcbiAgICAgICAgICAgICAgICAgICAgc3BhdGlhbC5oYXNoZXMucHVzaChrZXkpXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgc3BhdGlhbC54U3RhcnQgPSB4U3RhcnRcbiAgICAgICAgICAgIHNwYXRpYWwueVN0YXJ0ID0geVN0YXJ0XG4gICAgICAgICAgICBzcGF0aWFsLnhFbmQgPSB4RW5kXG4gICAgICAgICAgICBzcGF0aWFsLnlFbmQgPSB5RW5kXG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiByZXR1cm5zIGFuIGFycmF5IG9mIGJ1Y2tldHMgd2l0aCA+PSBtaW5pbXVtIG9mIG9iamVjdHMgaW4gZWFjaCBidWNrZXRcbiAgICAgKiBAcGFyYW0ge251bWJlcn0gW21pbmltdW09MV1cbiAgICAgKiBAcmV0dXJuIHthcnJheX0gYXJyYXkgb2YgYnVja2V0c1xuICAgICAqL1xuICAgIGdldEJ1Y2tldHMobWluaW11bT0xKSB7XG4gICAgICAgIGNvbnN0IGhhc2hlcyA9IFtdXG4gICAgICAgIGZvciAobGV0IGtleSBpbiB0aGlzLmhhc2gpIHtcbiAgICAgICAgICAgIGNvbnN0IGhhc2ggPSB0aGlzLmhhc2hba2V5XVxuICAgICAgICAgICAgaWYgKGhhc2gubGVuZ3RoID49IG1pbmltdW0pIHtcbiAgICAgICAgICAgICAgICBoYXNoZXMucHVzaChoYXNoKVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBoYXNoZXNcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBnZXRzIGhhc2ggYm91bmRzXG4gICAgICogQHBhcmFtIHtBQUJCfSBBQUJCXG4gICAgICogQHJldHVybiB7Qm91bmRzfVxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgZ2V0Qm91bmRzKEFBQkIpIHtcbiAgICAgICAgbGV0IHhTdGFydCA9IE1hdGguZmxvb3IoQUFCQi54IC8gdGhpcy54U2l6ZSlcbiAgICAgICAgbGV0IHlTdGFydCA9IE1hdGguZmxvb3IoQUFCQi55IC8gdGhpcy55U2l6ZSlcbiAgICAgICAgbGV0IHhFbmQgPSBNYXRoLmZsb29yKChBQUJCLnggKyBBQUJCLndpZHRoKSAvIHRoaXMueFNpemUpXG4gICAgICAgIGxldCB5RW5kID0gTWF0aC5mbG9vcigoQUFCQi55ICsgQUFCQi5oZWlnaHQpIC8gdGhpcy55U2l6ZSlcbiAgICAgICAgcmV0dXJuIHsgeFN0YXJ0LCB5U3RhcnQsIHhFbmQsIHlFbmQgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIGluc2VydCBvYmplY3QgaW50byB0aGUgc3BhdGlhbCBoYXNoXG4gICAgICogYXV0b21hdGljYWxseSBjYWxsZWQgZnJvbSB1cGRhdGVPYmplY3QoKVxuICAgICAqIEBwYXJhbSB7Kn0gb2JqZWN0XG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGtleVxuICAgICAqL1xuICAgIGluc2VydChvYmplY3QsIGtleSkge1xuICAgICAgICBpZiAoIXRoaXMuaGFzaFtrZXldKSB7XG4gICAgICAgICAgICB0aGlzLmhhc2hba2V5XSA9IFtvYmplY3RdXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLmhhc2hba2V5XS5wdXNoKG9iamVjdClcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIHJlbW92ZXMgb2JqZWN0IGZyb20gdGhlIGhhc2ggdGFibGVcbiAgICAgKiBzaG91bGQgYmUgY2FsbGVkIHdoZW4gcmVtb3ZpbmcgYW4gb2JqZWN0XG4gICAgICogYXV0b21hdGljYWxseSBjYWxsZWQgZnJvbSB1cGRhdGVPYmplY3QoKVxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSBvYmplY3RcbiAgICAgKi9cbiAgICByZW1vdmVGcm9tSGFzaChvYmplY3QpIHtcbiAgICAgICAgY29uc3Qgc3BhdGlhbCA9IG9iamVjdFt0aGlzLnNwYXRpYWxdXG4gICAgICAgIHdoaWxlIChzcGF0aWFsLmhhc2hlcy5sZW5ndGgpIHtcbiAgICAgICAgICAgIGNvbnN0IGtleSA9IHNwYXRpYWwuaGFzaGVzLnBvcCgpXG4gICAgICAgICAgICBjb25zdCBsaXN0ID0gdGhpcy5oYXNoW2tleV1cbiAgICAgICAgICAgIGxpc3Quc3BsaWNlKGxpc3QuaW5kZXhPZihvYmplY3QpLCAxKVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogZ2V0IGFsbCBuZWlnaGJvcnMgdGhhdCBzaGFyZSB0aGUgc2FtZSBoYXNoIGFzIG9iamVjdFxuICAgICAqIEBwYXJhbSB7Kn0gb2JqZWN0IGluIHRoZSBzcGF0aWFsIGhhc2hcbiAgICAgKiBAcmV0dXJuIHtBcnJheX0gb2Ygb2JqZWN0cyB0aGF0IGFyZSBpbiB0aGUgc2FtZSBoYXNoIGFzIG9iamVjdFxuICAgICAqL1xuICAgIG5laWdoYm9ycyhvYmplY3QpIHtcbiAgICAgICAgbGV0IHJlc3VsdHMgPSBbXVxuICAgICAgICBvYmplY3RbdGhpcy5zcGF0aWFsXS5oYXNoZXMuZm9yRWFjaChrZXkgPT4gcmVzdWx0cyA9IHJlc3VsdHMuY29uY2F0KHRoaXMuaGFzaFtrZXldKSlcbiAgICAgICAgcmV0dXJuIHJlc3VsdHNcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiByZXR1cm5zIGFuIGFycmF5IG9mIG9iamVjdHMgY29udGFpbmVkIHdpdGhpbiBib3VuZGluZyBib3hcbiAgICAgKiBAcGFyYW0ge0FBQkJ9IEFBQkIgYm91bmRpbmcgYm94IHRvIHNlYXJjaFxuICAgICAqIEBwYXJhbSB7Ym9vbGVhbn0gW3NpbXBsZVRlc3Q9dHJ1ZV0gcGVyZm9ybSBhIHNpbXBsZSBib3VuZHMgY2hlY2sgb2YgYWxsIGl0ZW1zIGluIHRoZSBidWNrZXRzXG4gICAgICogQHJldHVybiB7b2JqZWN0W119IHNlYXJjaCByZXN1bHRzXG4gICAgICovXG4gICAgcXVlcnkoQUFCQiwgc2ltcGxlVGVzdCkge1xuICAgICAgICBzaW1wbGVUZXN0ID0gdHlwZW9mIHNpbXBsZVRlc3QgIT09ICd1bmRlZmluZWQnID8gc2ltcGxlVGVzdCA6IHRydWVcbiAgICAgICAgbGV0IGJ1Y2tldHMgPSAwXG4gICAgICAgIGxldCByZXN1bHRzID0gW11cbiAgICAgICAgY29uc3QgeyB4U3RhcnQsIHlTdGFydCwgeEVuZCwgeUVuZCB9ID0gdGhpcy5nZXRCb3VuZHMoQUFCQilcbiAgICAgICAgZm9yIChsZXQgeSA9IHlTdGFydDsgeSA8PSB5RW5kOyB5KyspIHtcbiAgICAgICAgICAgIGZvciAobGV0IHggPSB4U3RhcnQ7IHggPD0geEVuZDsgeCsrKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgZW50cnkgPSB0aGlzLmhhc2hbeCArICcsJyArIHldXG4gICAgICAgICAgICAgICAgaWYgKGVudHJ5KSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChzaW1wbGVUZXN0KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBmb3IgKGxldCBvYmplY3Qgb2YgZW50cnkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBib3ggPSBvYmplY3RbdGhpcy5BQUJCXVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChib3gueCArIGJveC53aWR0aCA+IEFBQkIueCAmJiBib3gueCA8IEFBQkIueCArIEFBQkIud2lkdGggJiZcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYm94LnkgKyBib3guaGVpZ2h0ID4gQUFCQi55ICYmIGJveC55IDwgQUFCQi55ICsgQUFCQi5oZWlnaHQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0cy5wdXNoKG9iamVjdClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXN1bHRzID0gcmVzdWx0cy5jb25jYXQoZW50cnkpXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgYnVja2V0cysrXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHRoaXMubGFzdEJ1Y2tldHMgPSBidWNrZXRzXG4gICAgICAgIHJldHVybiByZXN1bHRzXG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogcmV0dXJucyBhbiBhcnJheSBvZiBvYmplY3RzIGNvbnRhaW5lZCB3aXRoaW4gYm91bmRpbmcgYm94IHdpdGggYSBjYWxsYmFjayBvbiBlYWNoIG5vbi1jdWxsZWQgb2JqZWN0XG4gICAgICogdGhpcyBmdW5jdGlvbiBpcyBkaWZmZXJlbnQgZnJvbSBxdWVyeUNhbGxiYWNrLCB3aGljaCBjYW5jZWxzIHRoZSBxdWVyeSB3aGVuIGEgY2FsbGJhY2sgcmV0dXJucyB0cnVlXG4gICAgICogQHBhcmFtIHtBQUJCfSBBQUJCIGJvdW5kaW5nIGJveCB0byBzZWFyY2hcbiAgICAgKiBAcGFyYW0ge2Jvb2xlYW59IFtzaW1wbGVUZXN0PXRydWVdIHBlcmZvcm0gYSBzaW1wbGUgYm91bmRzIGNoZWNrIG9mIGFsbCBpdGVtcyBpbiB0aGUgYnVja2V0c1xuICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IGNhbGxiYWNrIC0gZnVuY3Rpb24gdG8gcnVuIGZvciBlYWNoIG5vbi1jdWxsZWQgb2JqZWN0XG4gICAgICogQHJldHVybiB7b2JqZWN0W119IHNlYXJjaCByZXN1bHRzXG4gICAgICovXG4gICAgcXVlcnlDYWxsYmFja0FsbChBQUJCLCBzaW1wbGVUZXN0LCBjYWxsYmFjaykge1xuICAgICAgICBzaW1wbGVUZXN0ID0gdHlwZW9mIHNpbXBsZVRlc3QgIT09ICd1bmRlZmluZWQnID8gc2ltcGxlVGVzdCA6IHRydWVcbiAgICAgICAgbGV0IGJ1Y2tldHMgPSAwXG4gICAgICAgIGxldCByZXN1bHRzID0gW11cbiAgICAgICAgY29uc3QgeyB4U3RhcnQsIHlTdGFydCwgeEVuZCwgeUVuZCB9ID0gdGhpcy5nZXRCb3VuZHMoQUFCQilcbiAgICAgICAgZm9yIChsZXQgeSA9IHlTdGFydDsgeSA8PSB5RW5kOyB5KyspIHtcbiAgICAgICAgICAgIGZvciAobGV0IHggPSB4U3RhcnQ7IHggPD0geEVuZDsgeCsrKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgZW50cnkgPSB0aGlzLmhhc2hbeCArICcsJyArIHldXG4gICAgICAgICAgICAgICAgaWYgKGVudHJ5KSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChzaW1wbGVUZXN0KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBmb3IgKGxldCBvYmplY3Qgb2YgZW50cnkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBib3ggPSBvYmplY3RbdGhpcy5BQUJCXVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChib3gueCArIGJveC53aWR0aCA+IEFBQkIueCAmJiBib3gueCA8IEFBQkIueCArIEFBQkIud2lkdGggJiZcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBib3gueSArIGJveC5oZWlnaHQgPiBBQUJCLnkgJiYgYm94LnkgPCBBQUJCLnkgKyBBQUJCLmhlaWdodCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXN1bHRzLnB1c2gob2JqZWN0KVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYWxsYmFjayhvYmplY3QpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0cyA9IHJlc3VsdHMuY29uY2F0KGVudHJ5KVxuICAgICAgICAgICAgICAgICAgICAgICAgZm9yIChjb25zdCBvYmplY3Qgb2YgZW50cnkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYWxsYmFjayhvYmplY3QpXG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgYnVja2V0cysrXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHRoaXMubGFzdEJ1Y2tldHMgPSBidWNrZXRzXG4gICAgICAgIHJldHVybiByZXN1bHRzXG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogaXRlcmF0ZXMgdGhyb3VnaCBvYmplY3RzIGNvbnRhaW5lZCB3aXRoaW4gYm91bmRpbmcgYm94XG4gICAgICogc3RvcHMgaXRlcmF0aW5nIGlmIHRoZSBjYWxsYmFjayByZXR1cm5zIHRydWVcbiAgICAgKiBAcGFyYW0ge0FBQkJ9IEFBQkIgYm91bmRpbmcgYm94IHRvIHNlYXJjaFxuICAgICAqIEBwYXJhbSB7ZnVuY3Rpb259IGNhbGxiYWNrXG4gICAgICogQHBhcmFtIHtib29sZWFufSBbc2ltcGxlVGVzdD10cnVlXSBwZXJmb3JtIGEgc2ltcGxlIGJvdW5kcyBjaGVjayBvZiBhbGwgaXRlbXMgaW4gdGhlIGJ1Y2tldHNcbiAgICAgKiBAcmV0dXJuIHtib29sZWFufSB0cnVlIGlmIGNhbGxiYWNrIHJldHVybmVkIGVhcmx5XG4gICAgICovXG4gICAgcXVlcnlDYWxsYmFjayhBQUJCLCBjYWxsYmFjaywgc2ltcGxlVGVzdCkge1xuICAgICAgICBzaW1wbGVUZXN0ID0gdHlwZW9mIHNpbXBsZVRlc3QgIT09ICd1bmRlZmluZWQnID8gc2ltcGxlVGVzdCA6IHRydWVcbiAgICAgICAgY29uc3QgeyB4U3RhcnQsIHlTdGFydCwgeEVuZCwgeUVuZCB9ID0gdGhpcy5nZXRCb3VuZHMoQUFCQilcbiAgICAgICAgZm9yIChsZXQgeSA9IHlTdGFydDsgeSA8PSB5RW5kOyB5KyspIHtcbiAgICAgICAgICAgIGZvciAobGV0IHggPSB4U3RhcnQ7IHggPD0geEVuZDsgeCsrKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgZW50cnkgPSB0aGlzLmhhc2hbeCArICcsJyArIHldXG4gICAgICAgICAgICAgICAgaWYgKGVudHJ5KSB7XG4gICAgICAgICAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZW50cnkubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IG9iamVjdCA9IGVudHJ5W2ldXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoc2ltcGxlVGVzdCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IEFBQkIgPSBvYmplY3QuQUFCQlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChBQUJCLnggKyBBQUJCLndpZHRoID4gQUFCQi54ICYmIEFBQkIueCA8IEFBQkIueCArIEFBQkIud2lkdGggJiZcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBBQUJCLnkgKyBBQUJCLmhlaWdodCA+IEFBQkIueSAmJiBBQUJCLnkgPCBBQUJCLnkgKyBBQUJCLmhlaWdodCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoY2FsbGJhY2sob2JqZWN0KSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWVcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGNhbGxiYWNrKG9iamVjdCkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWVcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGZhbHNlXG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogZ2V0IHN0YXRzXG4gICAgICogQHJldHVybiB7U3RhdHN9XG4gICAgICovXG4gICAgc3RhdHMoKSB7XG4gICAgICAgIGxldCB2aXNpYmxlID0gMCwgY291bnQgPSAwXG4gICAgICAgIGZvciAobGV0IGxpc3Qgb2YgdGhpcy5jb250YWluZXJzKSB7XG4gICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGxpc3QuY2hpbGRyZW4ubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICBjb25zdCBvYmplY3QgPSBsaXN0LmNoaWxkcmVuW2ldXG4gICAgICAgICAgICAgICAgdmlzaWJsZSArPSBvYmplY3QudmlzaWJsZSA/IDEgOiAwXG4gICAgICAgICAgICAgICAgY291bnQrK1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICB0b3RhbDogY291bnQsXG4gICAgICAgICAgICB2aXNpYmxlLFxuICAgICAgICAgICAgY3VsbGVkOiBjb3VudCAtIHZpc2libGVcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIGhlbHBlciBmdW5jdGlvbiB0byBldmFsdWF0ZSBoYXNoIHRhYmxlXG4gICAgICogQHJldHVybiB7bnVtYmVyfSB0aGUgbnVtYmVyIG9mIGJ1Y2tldHMgaW4gdGhlIGhhc2ggdGFibGVcbiAgICAgKiAqL1xuICAgIGdldE51bWJlck9mQnVja2V0cygpIHtcbiAgICAgICAgcmV0dXJuIE9iamVjdC5rZXlzKHRoaXMuaGFzaCkubGVuZ3RoXG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogaGVscGVyIGZ1bmN0aW9uIHRvIGV2YWx1YXRlIGhhc2ggdGFibGVcbiAgICAgKiBAcmV0dXJuIHtudW1iZXJ9IHRoZSBhdmVyYWdlIG51bWJlciBvZiBlbnRyaWVzIGluIGVhY2ggYnVja2V0XG4gICAgICovXG4gICAgZ2V0QXZlcmFnZVNpemUoKSB7XG4gICAgICAgIGxldCB0b3RhbCA9IDBcbiAgICAgICAgZm9yIChsZXQga2V5IGluIHRoaXMuaGFzaCkge1xuICAgICAgICAgICAgdG90YWwgKz0gdGhpcy5oYXNoW2tleV0ubGVuZ3RoXG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRvdGFsIC8gdGhpcy5nZXRCdWNrZXRzKCkubGVuZ3RoXG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogaGVscGVyIGZ1bmN0aW9uIHRvIGV2YWx1YXRlIHRoZSBoYXNoIHRhYmxlXG4gICAgICogQHJldHVybiB7bnVtYmVyfSB0aGUgbGFyZ2VzdCBzaXplZCBidWNrZXRcbiAgICAgKi9cbiAgICBnZXRMYXJnZXN0KCkge1xuICAgICAgICBsZXQgbGFyZ2VzdCA9IDBcbiAgICAgICAgZm9yIChsZXQga2V5IGluIHRoaXMuaGFzaCkge1xuICAgICAgICAgICAgaWYgKHRoaXMuaGFzaFtrZXldLmxlbmd0aCA+IGxhcmdlc3QpIHtcbiAgICAgICAgICAgICAgICBsYXJnZXN0ID0gdGhpcy5oYXNoW2tleV0ubGVuZ3RoXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGxhcmdlc3RcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBnZXRzIHF1YWRyYW50IGJvdW5kc1xuICAgICAqIEByZXR1cm4ge0JvdW5kc31cbiAgICAgKi9cbiAgICBnZXRXb3JsZEJvdW5kcygpIHtcbiAgICAgICAgbGV0IHhTdGFydCA9IEluZmluaXR5LCB5U3RhcnQgPSBJbmZpbml0eSwgeEVuZCA9IDAsIHlFbmQgPSAwXG4gICAgICAgIGZvciAobGV0IGtleSBpbiB0aGlzLmhhc2gpIHtcbiAgICAgICAgICAgIGNvbnN0IHNwbGl0ID0ga2V5LnNwbGl0KCcsJylcbiAgICAgICAgICAgIGxldCB4ID0gcGFyc2VJbnQoc3BsaXRbMF0pXG4gICAgICAgICAgICBsZXQgeSA9IHBhcnNlSW50KHNwbGl0WzFdKVxuICAgICAgICAgICAgeFN0YXJ0ID0geCA8IHhTdGFydCA/IHggOiB4U3RhcnRcbiAgICAgICAgICAgIHlTdGFydCA9IHkgPCB5U3RhcnQgPyB5IDogeVN0YXJ0XG4gICAgICAgICAgICB4RW5kID0geCA+IHhFbmQgPyB4IDogeEVuZFxuICAgICAgICAgICAgeUVuZCA9IHkgPiB5RW5kID8geSA6IHlFbmRcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4geyB4U3RhcnQsIHlTdGFydCwgeEVuZCwgeUVuZCB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogaGVscGVyIGZ1bmN0aW9uIHRvIGV2YWx1dGUgdGhlIGhhc2ggdGFibGVcbiAgICAgKiBAcGFyYW0ge0FBQkJ9IFtBQUJCXSBib3VuZGluZyBib3ggdG8gc2VhcmNoIG9yIGVudGlyZSB3b3JsZFxuICAgICAqIEByZXR1cm4ge251bWJlcn0gc3BhcnNlbmVzcyBwZXJjZW50YWdlIChpLmUuLCBidWNrZXRzIHdpdGggYXQgbGVhc3QgMSBlbGVtZW50IGRpdmlkZWQgYnkgdG90YWwgcG9zc2libGUgYnVja2V0cylcbiAgICAgKi9cbiAgICBnZXRTcGFyc2VuZXNzKEFBQkIpIHtcbiAgICAgICAgbGV0IGNvdW50ID0gMCwgdG90YWwgPSAwXG4gICAgICAgIGNvbnN0IHsgeFN0YXJ0LCB5U3RhcnQsIHhFbmQsIHlFbmQgfSA9IEFBQkIgPyB0aGlzLmdldEJvdW5kcyhBQUJCKSA6IHRoaXMuZ2V0V29ybGRCb3VuZHMoKVxuICAgICAgICBmb3IgKGxldCB5ID0geVN0YXJ0OyB5IDwgeUVuZDsgeSsrKSB7XG4gICAgICAgICAgICBmb3IgKGxldCB4ID0geFN0YXJ0OyB4IDwgeEVuZDsgeCsrKSB7XG4gICAgICAgICAgICAgICAgY291bnQgKz0gKHRoaXMuaGFzaFt4ICsgJywnICsgeV0gPyAxIDogMClcbiAgICAgICAgICAgICAgICB0b3RhbCsrXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGNvdW50IC8gdG90YWxcbiAgICB9XG59XG5cbi8qKlxuICogQHR5cGVkZWYge29iamVjdH0gU3RhdHNcbiAqIEBwcm9wZXJ0eSB7bnVtYmVyfSBidWNrZXRzXG4gKiBAcHJvcGVydHkge251bWJlcn0gdG90YWxcbiAqIEBwcm9wZXJ0eSB7bnVtYmVyfSB2aXNpYmxlXG4gKiBAcHJvcGVydHkge251bWJlcn0gY3VsbGVkXG4gKi9cblxuLyoqXG4gKiBAdHlwZWRlZiB7b2JqZWN0fSBCb3VuZHNcbiAqIEBwcm9wZXJ0eSB7bnVtYmVyfSB4U3RhcnRcbiAqIEBwcm9wZXJ0eSB7bnVtYmVyfSB5U3RhcnRcbiAqIEBwcm9wZXJ0eSB7bnVtYmVyfSB4RW5kXG4gKiBAcHJvcGVydHkge251bWJlcn0geEVuZFxuICovXG5cbi8qKlxuICAqIEB0eXBlZGVmIHtvYmplY3R9IEFBQkJcbiAgKiBAcHJvcGVydHkge251bWJlcn0geFxuICAqIEBwcm9wZXJ0eSB7bnVtYmVyfSB5XG4gICogQHByb3BlcnR5IHtudW1iZXJ9IHdpZHRoXG4gICogQHByb3BlcnR5IHtudW1iZXJ9IGhlaWdodFxuICAqL1xuXG5tb2R1bGUuZXhwb3J0cyA9IFNwYXRpYWxIYXNoIl19