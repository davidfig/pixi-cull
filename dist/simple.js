'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

// pixi-cull.SpatialHash
// Copyright 2018 YOPEY YOPEY LLC
// David Figatner
// MIT License

var Simple = function () {
    /**
     * creates a simple cull
     * @param {object} [options]
     * @param {boolean} [options.visible=visible] parameter of the object to set (usually visible or renderable)
     * @param {boolean} [options.calculatePIXI=true] calculate pixi.js bounding box automatically; if this is set to false then it uses object[options.AABB] for bounding box
     * @param {string} [options.dirtyTest=true] only update spatial hash for objects with object[options.dirtyTest]=true; this has a HUGE impact on performance
     * @param {string} [options.AABB=AABB] object property that holds bounding box so that object[type] = { x: number, y: number, width: number, height: number }; not needed if options.calculatePIXI=true
     */
    function Simple(options) {
        _classCallCheck(this, Simple);

        options = options || {};
        this.visible = options.visible || 'visible';
        this.calculatePIXI = typeof options.calculatePIXI !== 'undefined' ? options.calculatePIXI : true;
        this.dirtyTest = typeof options.dirtyTest !== 'undefined' ? options.dirtyTest : true;
        this.AABB = options.AABB || 'AABB';
        this.lists = [[]];
    }

    /**
     * add an array of objects to be culled
     * @param {Array} array
     * @param {boolean} [staticObject] set to true if the object's position/size does not change
     * @return {Array} array
     */


    _createClass(Simple, [{
        key: 'addList',
        value: function addList(array, staticObject) {
            this.lists.push(array);
            if (staticObject) {
                array.staticObject = true;
            }
            if (this.calculatePIXI && this.dirtyTest) {
                var _iteratorNormalCompletion = true;
                var _didIteratorError = false;
                var _iteratorError = undefined;

                try {
                    for (var _iterator = array[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                        var object = _step.value;

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
            }
            return array;
        }

        /**
         * remove an array added by addList()
         * @param {Array} array
         * @return {Array} array
         */

    }, {
        key: 'removeList',
        value: function removeList(array) {
            this.lists.splice(this.lists.indexOf(array), 1);
            return array;
        }

        /**
         * add an object to be culled
         * @param {*} object
         * @param {boolean} [staticObject] set to true if the object's position/size does not change
         * @return {*} object
         */

    }, {
        key: 'add',
        value: function add(object, staticObject) {
            if (staticObject) {
                object.staticObject = true;
            }
            if (this.calculatePIXI && (this.dirtyTest || staticObject)) {
                this.updateObject(object);
            }
            this.lists[0].push(object);
            return object;
        }

        /**
         * remove an object added by add()
         * @param {*} object
         * @return {*} object
         */

    }, {
        key: 'remove',
        value: function remove(object) {
            this.lists[0].splice(this.lists[0].indexOf(object), 1);
            return object;
        }

        /**
         * cull the items in the list by setting visible parameter
         * @param {object} bounds
         * @param {number} bounds.x
         * @param {number} bounds.y
         * @param {number} bounds.width
         * @param {number} bounds.height
         * @param {boolean} [skipUpdate] skip updating the AABB bounding box of all objects
         */

    }, {
        key: 'cull',
        value: function cull(bounds, skipUpdate) {
            if (this.calculatePIXI && !skipUpdate) {
                this.updateObjects();
            }
            var _iteratorNormalCompletion2 = true;
            var _didIteratorError2 = false;
            var _iteratorError2 = undefined;

            try {
                for (var _iterator2 = this.lists[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
                    var list = _step2.value;
                    var _iteratorNormalCompletion3 = true;
                    var _didIteratorError3 = false;
                    var _iteratorError3 = undefined;

                    try {
                        for (var _iterator3 = list[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
                            var object = _step3.value;

                            var box = object[this.AABB];
                            object[this.visible] = box.x + box.width > bounds.x && box.x < bounds.x + bounds.width && box.y + box.height > bounds.y && box.y < bounds.y + bounds.height;
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
         * update the AABB for all objects
         * automatically called from update() when calculatePIXI=true and skipUpdate=false
         */

    }, {
        key: 'updateObjects',
        value: function updateObjects() {
            if (this.dirtyTest) {
                var _iteratorNormalCompletion4 = true;
                var _didIteratorError4 = false;
                var _iteratorError4 = undefined;

                try {
                    for (var _iterator4 = this.lists[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
                        var list = _step4.value;

                        if (!list.staticObject) {
                            var _iteratorNormalCompletion5 = true;
                            var _didIteratorError5 = false;
                            var _iteratorError5 = undefined;

                            try {
                                for (var _iterator5 = list[Symbol.iterator](), _step5; !(_iteratorNormalCompletion5 = (_step5 = _iterator5.next()).done); _iteratorNormalCompletion5 = true) {
                                    var object = _step5.value;

                                    if (!object.staticObject && object[this.dirty]) {
                                        this.updateObject(object);
                                        object[this.dirty] = false;
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
                    for (var _iterator6 = this.lists[Symbol.iterator](), _step6; !(_iteratorNormalCompletion6 = (_step6 = _iterator6.next()).done); _iteratorNormalCompletion6 = true) {
                        var _list = _step6.value;

                        if (!_list.staticObject) {
                            var _iteratorNormalCompletion7 = true;
                            var _didIteratorError7 = false;
                            var _iteratorError7 = undefined;

                            try {
                                for (var _iterator7 = _list[Symbol.iterator](), _step7; !(_iteratorNormalCompletion7 = (_step7 = _iterator7.next()).done); _iteratorNormalCompletion7 = true) {
                                    var _object = _step7.value;

                                    if (!_object.staticObject) {
                                        this.updateObject(_object);
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
         */

    }, {
        key: 'updateObject',
        value: function updateObject(object) {
            var box = object.getLocalBounds();
            object[this.AABB] = object[this.AABB] || {};
            object[this.AABB].x = object.x + box.x * object.scale.x;
            object[this.AABB].y = object.y + box.y * object.scale.y;
            object[this.AABB].width = box.width * object.scale.x;
            object[this.AABB].height = box.height * object.scale.y;
        }

        /**
         * returns an array of objects contained within bounding box
         * @param {object} boudns bounding box to search
         * @param {number} bounds.x
         * @param {number} bounds.y
         * @param {number} bounds.width
         * @param {number} bounds.height
         * @return {object[]} search results
         */

    }, {
        key: 'query',
        value: function query(bounds) {
            var results = [];
            var _iteratorNormalCompletion8 = true;
            var _didIteratorError8 = false;
            var _iteratorError8 = undefined;

            try {
                for (var _iterator8 = this.lists[Symbol.iterator](), _step8; !(_iteratorNormalCompletion8 = (_step8 = _iterator8.next()).done); _iteratorNormalCompletion8 = true) {
                    var list = _step8.value;
                    var _iteratorNormalCompletion9 = true;
                    var _didIteratorError9 = false;
                    var _iteratorError9 = undefined;

                    try {
                        for (var _iterator9 = list[Symbol.iterator](), _step9; !(_iteratorNormalCompletion9 = (_step9 = _iterator9.next()).done); _iteratorNormalCompletion9 = true) {
                            var object = _step9.value;

                            var box = object[this.AABB];
                            if (box.x + box.width > bounds.x && box.x - box.width < bounds.x + bounds.width && box.y + box.height > bounds.y && box.y - box.height < bounds.y + bounds.height) {
                                results.push(object);
                            }
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

            return results;
        }

        /**
         * iterates through objects contained within bounding box
         * stops iterating if the callback returns true
         * @param {object} bounds bounding box to search
         * @param {number} bounds.x
         * @param {number} bounds.y
         * @param {number} bounds.width
         * @param {number} bounds.height
         * @param {function} callback
         * @return {boolean} true if callback returned early
         */

    }, {
        key: 'queryCallback',
        value: function queryCallback(bounds, callback) {
            var _iteratorNormalCompletion10 = true;
            var _didIteratorError10 = false;
            var _iteratorError10 = undefined;

            try {
                for (var _iterator10 = this.lists[Symbol.iterator](), _step10; !(_iteratorNormalCompletion10 = (_step10 = _iterator10.next()).done); _iteratorNormalCompletion10 = true) {
                    var list = _step10.value;
                    var _iteratorNormalCompletion11 = true;
                    var _didIteratorError11 = false;
                    var _iteratorError11 = undefined;

                    try {
                        for (var _iterator11 = list[Symbol.iterator](), _step11; !(_iteratorNormalCompletion11 = (_step11 = _iterator11.next()).done); _iteratorNormalCompletion11 = true) {
                            var object = _step11.value;

                            var box = object[this.AABB];
                            if (box.x + box.width > bounds.x && box.x - box.width < bounds.x + bounds.width && box.y + box.height > bounds.y && box.y - box.height < bounds.y + bounds.height) {
                                if (callback(object)) {
                                    return true;
                                }
                            }
                        }
                    } catch (err) {
                        _didIteratorError11 = true;
                        _iteratorError11 = err;
                    } finally {
                        try {
                            if (!_iteratorNormalCompletion11 && _iterator11.return) {
                                _iterator11.return();
                            }
                        } finally {
                            if (_didIteratorError11) {
                                throw _iteratorError11;
                            }
                        }
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

            return false;
        }

        /**
         * get stats (only updated after update() is called)
         * @return {SimpleStats}
         */

    }, {
        key: 'stats',
        value: function stats() {
            var visible = 0,
                count = 0;
            var _iteratorNormalCompletion12 = true;
            var _didIteratorError12 = false;
            var _iteratorError12 = undefined;

            try {
                for (var _iterator12 = this.lists[Symbol.iterator](), _step12; !(_iteratorNormalCompletion12 = (_step12 = _iterator12.next()).done); _iteratorNormalCompletion12 = true) {
                    var list = _step12.value;

                    list.forEach(function (object) {
                        visible += object.visible ? 1 : 0;
                        count++;
                    });
                }
            } catch (err) {
                _didIteratorError12 = true;
                _iteratorError12 = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion12 && _iterator12.return) {
                        _iterator12.return();
                    }
                } finally {
                    if (_didIteratorError12) {
                        throw _iteratorError12;
                    }
                }
            }

            return { total: count, visible: visible, culled: count - visible };
        }
    }]);

    return Simple;
}();

/**
 * @typedef {object} SimpleStats
 * @property {number} total
 * @property {number} visible
 * @property {number} culled
 */

module.exports = Simple;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL2NvZGUvc2ltcGxlLmpzIl0sIm5hbWVzIjpbIlNpbXBsZSIsIm9wdGlvbnMiLCJ2aXNpYmxlIiwiY2FsY3VsYXRlUElYSSIsImRpcnR5VGVzdCIsIkFBQkIiLCJsaXN0cyIsImFycmF5Iiwic3RhdGljT2JqZWN0IiwicHVzaCIsIm9iamVjdCIsInVwZGF0ZU9iamVjdCIsInNwbGljZSIsImluZGV4T2YiLCJib3VuZHMiLCJza2lwVXBkYXRlIiwidXBkYXRlT2JqZWN0cyIsImxpc3QiLCJib3giLCJ4Iiwid2lkdGgiLCJ5IiwiaGVpZ2h0IiwiZGlydHkiLCJnZXRMb2NhbEJvdW5kcyIsInNjYWxlIiwicmVzdWx0cyIsImNhbGxiYWNrIiwiY291bnQiLCJmb3JFYWNoIiwidG90YWwiLCJjdWxsZWQiLCJtb2R1bGUiLCJleHBvcnRzIl0sIm1hcHBpbmdzIjoiOzs7Ozs7QUFBQTtBQUNBO0FBQ0E7QUFDQTs7SUFFTUEsTTtBQUVGOzs7Ozs7OztBQVFBLG9CQUFZQyxPQUFaLEVBQ0E7QUFBQTs7QUFDSUEsa0JBQVVBLFdBQVcsRUFBckI7QUFDQSxhQUFLQyxPQUFMLEdBQWVELFFBQVFDLE9BQVIsSUFBbUIsU0FBbEM7QUFDQSxhQUFLQyxhQUFMLEdBQXFCLE9BQU9GLFFBQVFFLGFBQWYsS0FBaUMsV0FBakMsR0FBK0NGLFFBQVFFLGFBQXZELEdBQXVFLElBQTVGO0FBQ0EsYUFBS0MsU0FBTCxHQUFpQixPQUFPSCxRQUFRRyxTQUFmLEtBQTZCLFdBQTdCLEdBQTJDSCxRQUFRRyxTQUFuRCxHQUErRCxJQUFoRjtBQUNBLGFBQUtDLElBQUwsR0FBWUosUUFBUUksSUFBUixJQUFnQixNQUE1QjtBQUNBLGFBQUtDLEtBQUwsR0FBYSxDQUFDLEVBQUQsQ0FBYjtBQUNIOztBQUVEOzs7Ozs7Ozs7O2dDQU1RQyxLLEVBQU9DLFksRUFDZjtBQUNJLGlCQUFLRixLQUFMLENBQVdHLElBQVgsQ0FBZ0JGLEtBQWhCO0FBQ0EsZ0JBQUlDLFlBQUosRUFDQTtBQUNJRCxzQkFB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cUIsQ0FBaEM7QUFDQTBCO0FBQ0gscUJBSkQ7QUFLSDtBQVRMO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7O0FBVUksbUJBQU8sRUFBRUUsT0FBT0YsS0FBVCxFQUFnQjFCLGdCQUFoQixFQUF5QjZCLFFBQVFILFFBQVExQixPQUF6QyxFQUFQO0FBQ0g7Ozs7OztBQUdMOzs7Ozs7O0FBT0E4QixPQUFPQyxPQUFQLEdBQWlCakMsTUFBakIiLCJmaWxlIjoic2ltcGxlLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLy8gcGl4aS1jdWxsLlNwYXRpYWxIYXNoXG4vLyBDb3B5cmlnaHQgMjAxOCBZT1BFWSBZT1BFWSBMTENcbi8vIERhdmlkIEZpZ2F0bmVyXG4vLyBNSVQgTGljZW5zZVxuXG5jbGFzcyBTaW1wbGVcbntcbiAgICAvKipcbiAgICAgKiBjcmVhdGVzIGEgc2ltcGxlIGN1bGxcbiAgICAgKiBAcGFyYW0ge29iamVjdH0gW29wdGlvbnNdXG4gICAgICogQHBhcmFtIHtib29sZWFufSBbb3B0aW9ucy52aXNpYmxlPXZpc2libGVdIHBhcmFtZXRlciBvZiB0aGUgb2JqZWN0IHRvIHNldCAodXN1YWxseSB2aXNpYmxlIG9yIHJlbmRlcmFibGUpXG4gICAgICogQHBhcmFtIHtib29sZWFufSBbb3B0aW9ucy5jYWxjdWxhdGVQSVhJPXRydWVdIGNhbGN1bGF0ZSBwaXhpLmpzIGJvdW5kaW5nIGJveCBhdXRvbWF0aWNhbGx5OyBpZiB0aGlzIGlzIHNldCB0byBmYWxzZSB0aGVuIGl0IHVzZXMgb2JqZWN0W29wdGlvbnMuQUFCQl0gZm9yIGJvdW5kaW5nIGJveFxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBbb3B0aW9ucy5kaXJ0eVRlc3Q9dHJ1ZV0gb25seSB1cGRhdGUgc3BhdGlhbCBoYXNoIGZvciBvYmplY3RzIHdpdGggb2JqZWN0W29wdGlvbnMuZGlydHlUZXN0XT10cnVlOyB0aGlzIGhhcyBhIEhVR0UgaW1wYWN0IG9uIHBlcmZvcm1hbmNlXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IFtvcHRpb25zLkFBQkI9QUFCQl0gb2JqZWN0IHByb3BlcnR5IHRoYXQgaG9sZHMgYm91bmRpbmcgYm94IHNvIHRoYXQgb2JqZWN0W3R5cGVdID0geyB4OiBudW1iZXIsIHk6IG51bWJlciwgd2lkdGg6IG51bWJlciwgaGVpZ2h0OiBudW1iZXIgfTsgbm90IG5lZWRlZCBpZiBvcHRpb25zLmNhbGN1bGF0ZVBJWEk9dHJ1ZVxuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yKG9wdGlvbnMpXG4gICAge1xuICAgICAgICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fVxuICAgICAgICB0aGlzLnZpc2libGUgPSBvcHRpb25zLnZpc2libGUgfHwgJ3Zpc2libGUnXG4gICAgICAgIHRoaXMuY2FsY3VsYXRlUElYSSA9IHR5cGVvZiBvcHRpb25zLmNhbGN1bGF0ZVBJWEkgIT09ICd1bmRlZmluZWQnID8gb3B0aW9ucy5jYWxjdWxhdGVQSVhJIDogdHJ1ZVxuICAgICAgICB0aGlzLmRpcnR5VGVzdCA9IHR5cGVvZiBvcHRpb25zLmRpcnR5VGVzdCAhPT0gJ3VuZGVmaW5lZCcgPyBvcHRpb25zLmRpcnR5VGVzdCA6IHRydWVcbiAgICAgICAgdGhpcy5BQUJCID0gb3B0aW9ucy5BQUJCIHx8ICdBQUJCJ1xuICAgICAgICB0aGlzLmxpc3RzID0gW1tdXVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIGFkZCBhbiBhcnJheSBvZiBvYmplY3RzIHRvIGJlIGN1bGxlZFxuICAgICAqIEBwYXJhbSB7QXJyYXl9IGFycmF5XG4gICAgICogQHBhcmFtIHtib29sZWFufSBbc3RhdGljT2JqZWN0XSBzZXQgdG8gdHJ1ZSBpZiB0aGUgb2JqZWN0J3MgcG9zaXRpb24vc2l6ZSBkb2VzIG5vdCBjaGFuZ2VcbiAgICAgKiBAcmV0dXJuIHtBcnJheX0gYXJyYXlcbiAgICAgKi9cbiAgICBhZGRMaXN0KGFycmF5LCBzdGF0aWNPYmplY3QpXG4gICAge1xuICAgICAgICB0aGlzLmxpc3RzLnB1c2goYXJyYXkpXG4gICAgICAgIGlmIChzdGF0aWNPYmplY3QpXG4gICAgICAgIHtcbiAgICAgICAgICAgIGFycmF5LnN0YXRpY09iamVjdCA9IHRydWVcbiAgICAgICAgfVxuICAgICAgICBpZiAodGhpcy5jYWxjdWxhdGVQSVhJICYmIHRoaXMuZGlydHlUZXN0KVxuICAgICAgICB7XG4gICAgICAgICAgICBmb3IgKGxldCBvYmplY3Qgb2YgYXJyYXkpXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgdGhpcy51cGRhdGVPYmplY3Qob2JqZWN0KVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBhcnJheVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIHJlbW92ZSBhbiBhcnJheSBhZGRlZCBieSBhZGRMaXN0KClcbiAgICAgKiBAcGFyYW0ge0FycmF5fSBhcnJheVxuICAgICAqIEByZXR1cm4ge0FycmF5fSBhcnJheVxuICAgICAqL1xuICAgIHJlbW92ZUxpc3QoYXJyYXkpXG4gICAge1xuICAgICAgICB0aGlzLmxpc3RzLnNwbGljZSh0aGlzLmxpc3RzLmluZGV4T2YoYXJyYXkpLCAxKVxuICAgICAgICByZXR1cm4gYXJyYXlcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBhZGQgYW4gb2JqZWN0IHRvIGJlIGN1bGxlZFxuICAgICAqIEBwYXJhbSB7Kn0gb2JqZWN0XG4gICAgICogQHBhcmFtIHtib29sZWFufSBbc3RhdGljT2JqZWN0XSBzZXQgdG8gdHJ1ZSBpZiB0aGUgb2JqZWN0J3MgcG9zaXRpb24vc2l6ZSBkb2VzIG5vdCBjaGFuZ2VcbiAgICAgKiBAcmV0dXJuIHsqfSBvYmplY3RcbiAgICAgKi9cbiAgICBhZGQob2JqZWN0LCBzdGF0aWNPYmplY3QpXG4gICAge1xuICAgICAgICBpZiAoc3RhdGljT2JqZWN0KVxuICAgICAgICB7XG4gICAgICAgICAgICBvYmplY3Quc3RhdGljT2JqZWN0ID0gdHJ1ZVxuICAgICAgICB9XG4gICAgICAgIGlmICh0aGlzLmNhbGN1bGF0ZVBJWEkgJiYgKHRoaXMuZGlydHlUZXN0IHx8IHN0YXRpY09iamVjdCkpXG4gICAgICAgIHtcbiAgICAgICAgICAgIHRoaXMudXBkYXRlT2JqZWN0KG9iamVjdClcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmxpc3RzWzBdLnB1c2gob2JqZWN0KVxuICAgICAgICByZXR1cm4gb2JqZWN0XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogcmVtb3ZlIGFuIG9iamVjdCBhZGRlZCBieSBhZGQoKVxuICAgICAqIEBwYXJhbSB7Kn0gb2JqZWN0XG4gICAgICogQHJldHVybiB7Kn0gb2JqZWN0XG4gICAgICovXG4gICAgcmVtb3ZlKG9iamVjdClcbiAgICB7XG4gICAgICAgIHRoaXMubGlzdHNbMF0uc3BsaWNlKHRoaXMubGlzdHNbMF0uaW5kZXhPZihvYmplY3QpLCAxKVxuICAgICAgICByZXR1cm4gb2JqZWN0XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogY3VsbCB0aGUgaXRlbXMgaW4gdGhlIGxpc3QgYnkgc2V0dGluZyB2aXNpYmxlIHBhcmFtZXRlclxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSBib3VuZHNcbiAgICAgKiBAcGFyYW0ge251bWJlcn0gYm91bmRzLnhcbiAgICAgKiBAcGFyYW0ge251bWJlcn0gYm91bmRzLnlcbiAgICAgKiBAcGFyYW0ge251bWJlcn0gYm91bmRzLndpZHRoXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IGJvdW5kcy5oZWlnaHRcbiAgICAgKiBAcGFyYW0ge2Jvb2xlYW59IFtza2lwVXBkYXRlXSBza2lwIHVwZGF0aW5nIHRoZSBBQUJCIGJvdW5kaW5nIGJveCBvZiBhbGwgb2JqZWN0c1xuICAgICAqL1xuICAgIGN1bGwoYm91bmRzLCBza2lwVXBkYXRlKVxuICAgIHtcbiAgICAgICAgaWYgKHRoaXMuY2FsY3VsYXRlUElYSSAmJiAhc2tpcFVwZGF0ZSlcbiAgICAgICAge1xuICAgICAgICAgICAgdGhpcy51cGRhdGVPYmplY3RzKClcbiAgICAgICAgfVxuICAgICAgICBmb3IgKGxldCBsaXN0IG9mIHRoaXMubGlzdHMpXG4gICAgICAgIHtcbiAgICAgICAgICAgIGZvciAobGV0IG9iamVjdCBvZiBsaXN0KVxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGNvbnN0IGJveCA9IG9iamVjdFt0aGlzLkFBQkJdXG4gICAgICAgICAgICAgICAgb2JqZWN0W3RoaXMudmlzaWJsZV0gPVxuICAgICAgICAgICAgICAgICAgICBib3gueCArIGJveC53aWR0aCA+IGJvdW5kcy54ICYmIGJveC54IDwgYm91bmRzLnggKyBib3VuZHMud2lkdGggJiZcbiAgICAgICAgICAgICAgICAgICAgYm94LnkgKyBib3guaGVpZ2h0ID4gYm91bmRzLnkgJiYgYm94LnkgPCBib3VuZHMueSArIGJvdW5kcy5oZWlnaHRcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIHVwZGF0ZSB0aGUgQUFCQiBmb3IgYWxsIG9iamVjdHNcbiAgICAgKiBhdXRvbWF0aWNhbGx5IGNhbGxlZCBmcm9tIHVwZGF0ZSgpIHdoZW4gY2FsY3VsYXRlUElYST10cnVlIGFuZCBza2lwVXBkYXRlPWZhbHNlXG4gICAgICovXG4gICAgdXBkYXRlT2JqZWN0cygpXG4gICAge1xuICAgICAgICBpZiAodGhpcy5kaXJ0eVRlc3QpXG4gICAgICAgIHtcbiAgICAgICAgICAgIGZvciAobGV0IGxpc3Qgb2YgdGhpcy5saXN0cylcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBpZiAoIWxpc3Quc3RhdGljT2JqZWN0KVxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgZm9yIChsZXQgb2JqZWN0IG9mIGxpc3QpXG4gICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICghb2JqZWN0LnN0YXRpY09iamVjdCAmJiBvYmplY3RbdGhpcy5kaXJ0eV0pXG4gICAgICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy51cGRhdGVPYmplY3Qob2JqZWN0KVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9iamVjdFt0aGlzLmRpcnR5XSA9IGZhbHNlXG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgZWxzZVxuICAgICAgICB7XG4gICAgICAgICAgICBmb3IgKGxldCBsaXN0IG9mIHRoaXMubGlzdHMpXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgaWYgKCFsaXN0LnN0YXRpY09iamVjdClcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIGZvciAobGV0IG9iamVjdCBvZiBsaXN0KVxuICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIW9iamVjdC5zdGF0aWNPYmplY3QpXG4gICAgICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy51cGRhdGVPYmplY3Qob2JqZWN0KVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogdXBkYXRlIHRoZSBoYXMgb2YgYW4gb2JqZWN0XG4gICAgICogYXV0b21hdGljYWxseSBjYWxsZWQgZnJvbSB1cGRhdGVPYmplY3RzKClcbiAgICAgKiBAcGFyYW0geyp9IG9iamVjdFxuICAgICAqL1xuICAgIHVwZGF0ZU9iamVjdChvYmplY3QpXG4gICAge1xuICAgICAgICBjb25zdCBib3ggPSBvYmplY3QuZ2V0TG9jYWxCb3VuZHMoKVxuICAgICAgICBvYmplY3RbdGhpcy5BQUJCXSA9IG9iamVjdFt0aGlzLkFBQkJdIHx8IHt9XG4gICAgICAgIG9iamVjdFt0aGlzLkFBQkJdLnggPSBvYmplY3QueCArIGJveC54ICogb2JqZWN0LnNjYWxlLnhcbiAgICAgICAgb2JqZWN0W3RoaXMuQUFCQl0ueSA9IG9iamVjdC55ICsgYm94LnkgKiBvYmplY3Quc2NhbGUueVxuICAgICAgICBvYmplY3RbdGhpcy5BQUJCXS53aWR0aCA9IGJveC53aWR0aCAqIG9iamVjdC5zY2FsZS54XG4gICAgICAgIG9iamVjdFt0aGlzLkFBQkJdLmhlaWdodCA9IGJveC5oZWlnaHQgKiBvYmplY3Quc2NhbGUueVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIHJldHVybnMgYW4gYXJyYXkgb2Ygb2JqZWN0cyBjb250YWluZWQgd2l0aGluIGJvdW5kaW5nIGJveFxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSBib3VkbnMgYm91bmRpbmcgYm94IHRvIHNlYXJjaFxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSBib3VuZHMueFxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSBib3VuZHMueVxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSBib3VuZHMud2lkdGhcbiAgICAgKiBAcGFyYW0ge251bWJlcn0gYm91bmRzLmhlaWdodFxuICAgICAqIEByZXR1cm4ge29iamVjdFtdfSBzZWFyY2ggcmVzdWx0c1xuICAgICAqL1xuICAgIHF1ZXJ5KGJvdW5kcylcbiAgICB7XG4gICAgICAgIGxldCByZXN1bHRzID0gW11cbiAgICAgICAgZm9yIChsZXQgbGlzdCBvZiB0aGlzLmxpc3RzKVxuICAgICAgICB7XG4gICAgICAgICAgICBmb3IgKGxldCBvYmplY3Qgb2YgbGlzdClcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBjb25zdCBib3ggPSBvYmplY3RbdGhpcy5BQUJCXVxuICAgICAgICAgICAgICAgIGlmIChib3gueCArIGJveC53aWR0aCA+IGJvdW5kcy54ICYmIGJveC54IC0gYm94LndpZHRoIDwgYm91bmRzLnggKyBib3VuZHMud2lkdGggJiZcbiAgICAgICAgICAgICAgICAgICAgYm94LnkgKyBib3guaGVpZ2h0ID4gYm91bmRzLnkgJiYgYm94LnkgLSBib3guaGVpZ2h0IDwgYm91bmRzLnkgKyBib3VuZHMuaGVpZ2h0KVxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0cy5wdXNoKG9iamVjdClcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHJlc3VsdHNcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBpdGVyYXRlcyB0aHJvdWdoIG9iamVjdHMgY29udGFpbmVkIHdpdGhpbiBib3VuZGluZyBib3hcbiAgICAgKiBzdG9wcyBpdGVyYXRpbmcgaWYgdGhlIGNhbGxiYWNrIHJldHVybnMgdHJ1ZVxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSBib3VuZHMgYm91bmRpbmcgYm94IHRvIHNlYXJjaFxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSBib3VuZHMueFxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSBib3VuZHMueVxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSBib3VuZHMud2lkdGhcbiAgICAgKiBAcGFyYW0ge251bWJlcn0gYm91bmRzLmhlaWdodFxuICAgICAqIEBwYXJhbSB7ZnVuY3Rpb259IGNhbGxiYWNrXG4gICAgICogQHJldHVybiB7Ym9vbGVhbn0gdHJ1ZSBpZiBjYWxsYmFjayByZXR1cm5lZCBlYXJseVxuICAgICAqL1xuICAgIHF1ZXJ5Q2FsbGJhY2soYm91bmRzLCBjYWxsYmFjaylcbiAgICB7XG4gICAgICAgIGZvciAobGV0IGxpc3Qgb2YgdGhpcy5saXN0cylcbiAgICAgICAge1xuICAgICAgICAgICAgZm9yIChsZXQgb2JqZWN0IG9mIGxpc3QpXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgY29uc3QgYm94ID0gb2JqZWN0W3RoaXMuQUFCQl1cbiAgICAgICAgICAgICAgICBpZiAoYm94LnggKyBib3gud2lkdGggPiBib3VuZHMueCAmJiBib3gueCAtIGJveC53aWR0aCA8IGJvdW5kcy54ICsgYm91bmRzLndpZHRoICYmXG4gICAgICAgICAgICAgICAgICAgIGJveC55ICsgYm94LmhlaWdodCA+IGJvdW5kcy55ICYmIGJveC55IC0gYm94LmhlaWdodCA8IGJvdW5kcy55ICsgYm91bmRzLmhlaWdodClcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChjYWxsYmFjayhvYmplY3QpKVxuICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBmYWxzZVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIGdldCBzdGF0cyAob25seSB1cGRhdGVkIGFmdGVyIHVwZGF0ZSgpIGlzIGNhbGxlZClcbiAgICAgKiBAcmV0dXJuIHtTaW1wbGVTdGF0c31cbiAgICAgKi9cbiAgICBzdGF0cygpXG4gICAge1xuICAgICAgICBsZXQgdmlzaWJsZSA9IDAsIGNvdW50ID0gMFxuICAgICAgICBmb3IgKGxldCBsaXN0IG9mIHRoaXMubGlzdHMpXG4gICAgICAgIHtcbiAgICAgICAgICAgIGxpc3QuZm9yRWFjaChvYmplY3QgPT5cbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICB2aXNpYmxlICs9IG9iamVjdC52aXNpYmxlID8gMSA6IDBcbiAgICAgICAgICAgICAgICBjb3VudCsrXG4gICAgICAgICAgICB9KVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiB7IHRvdGFsOiBjb3VudCwgdmlzaWJsZSwgY3VsbGVkOiBjb3VudCAtIHZpc2libGUgfVxuICAgIH1cbn1cblxuLyoqXG4gKiBAdHlwZWRlZiB7b2JqZWN0fSBTaW1wbGVTdGF0c1xuICogQHByb3BlcnR5IHtudW1iZXJ9IHRvdGFsXG4gKiBAcHJvcGVydHkge251bWJlcn0gdmlzaWJsZVxuICogQHByb3BlcnR5IHtudW1iZXJ9IGN1bGxlZFxuICovXG5cbm1vZHVsZS5leHBvcnRzID0gU2ltcGxlIl19