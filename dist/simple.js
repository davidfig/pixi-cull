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
     * @param {string} [options.dirtyTest=true] only update the AABB boxfor objects with object[options.dirtyTest]=true; this has a HUGE impact on performance
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
            object[this.AABB].x = object.x + (box.x - object.pivot.x) * object.scale.x;
            object[this.AABB].y = object.y + (box.y - object.pivot.y) * object.scale.y;
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL2NvZGUvc2ltcGxlLmpzIl0sIm5hbWVzIjpbIlNpbXBsZSIsIm9wdGlvbnMiLCJ2aXNpYmxlIiwiY2FsY3VsYXRlUElYSSIsImRpcnR5VGVzdCIsIkFBQkIiLCJsaXN0cyIsImFycmF5Iiwic3RhdGljT2JqZWN0IiwicHVzaCIsIm9iamVjdCIsInVwZGF0ZU9iamVjdCIsInNwbGljZSIsImluZGV4T2YiLCJib3VuZHMiLCJza2lwVXBkYXRlIiwidXBkYXRlT2JqZWN0cyIsImxpc3QiLCJib3giLCJ4Iiwid2lkdGgiLCJ5IiwiaGVpZ2h0IiwiZGlydHkiLCJnZXRMb2NhbEJvdW5kcyIsInBpdm90Iiwic2NhbGUiLCJyZXN1bHRzIiwiY2FsbGJhY2siLCJjb3VudCIsImZvckVhY2giLCJ0b3RhbCIsImN1bGxlZCIsIm1vZHVsZSIsImV4cG9ydHMiXSwibWFwcGluZ3MiOiI7Ozs7OztBQUFBO0FBQ0E7QUFDQTtBQUNBOztJQUVNQSxNO0FBQ0Y7Ozs7Ozs7O0FBUUEsb0JBQVlDLE9BQVosRUFBcUI7QUFBQTs7QUFDakJBLGtCQUFVQSxXQUFXLEVBQXJCO0FBQ0EsYUFBS0MsT0FBTCxHQUFlRCxRQUFRQyxPQUFSLElBQW1CLFNBQWxDO0FBQ0EsYUFBS0MsYUFBTCxHQUFxQixPQUFPRixRQUFRRSxhQUFmLEtBQWlDLFdBQWpDLEdBQStDRixRQUFRRSxhQUF2RCxHQUF1RSxJQUE1RjtBQUNBLGFBQUtDLFNBQUwsR0FBaUIsT0FBT0gsUUFBUUcsU0FBZixLQUE2QixXQUE3QixHQUEyQ0gsUUFBUUcsU0FBbkQsR0FBK0QsSUFBaEY7QUFDQSxhQUFLQyxJQUFMLEdBQVlKLFFBQVFJLElBQVIsSUFBZ0IsTUFBNUI7QUFDQSxhQUFLQyxLQUFMLEdBQWEsQ0FBQyxFQUFELENBQWI7QUFDSDs7QUFFRDs7Ozs7Ozs7OztnQ0FNUUMsSyxFQUFPQyxZLEVBQWM7QUFDekIsaUJBQUtGLEtBQUwsQ0FBV0csSUFBWCxDQUFnQkYsS0FBaEI7QUFDQSxnQkFBSUMsWUFBSixFQUFr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QUFVLENBQWQ7QUFBQSxnQkFBaUIyQixRQUFRLENBQXpCO0FBREk7QUFBQTtBQUFBOztBQUFBO0FBRUosdUNBQWlCLEtBQUt2QixLQUF0Qix3SUFBNkI7QUFBQSx3QkFBcEJXLElBQW9COztBQUN6QkEseUJBQUthLE9BQUwsQ0FBYSxrQkFBVTtBQUNuQjVCLG1DQUFXUSxPQUFPUixPQUFQLEdBQWlCLENBQWpCLEdBQXFCLENBQWhDO0FBQ0EyQjtBQUNILHFCQUhEO0FBSUg7QUFQRztBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBOztBQVFKLG1CQUFPLEVBQUVFLE9BQU9GLEtBQVQsRUFBZ0IzQixnQkFBaEIsRUFBeUI4QixRQUFRSCxRQUFRM0IsT0FBekMsRUFBUDtBQUNIOzs7Ozs7QUFHTDs7Ozs7OztBQU9BK0IsT0FBT0MsT0FBUCxHQUFpQmxDLE1BQWpCIiwiZmlsZSI6InNpbXBsZS5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8vIHBpeGktY3VsbC5TcGF0aWFsSGFzaFxuLy8gQ29weXJpZ2h0IDIwMTggWU9QRVkgWU9QRVkgTExDXG4vLyBEYXZpZCBGaWdhdG5lclxuLy8gTUlUIExpY2Vuc2VcblxuY2xhc3MgU2ltcGxlIHtcbiAgICAvKipcbiAgICAgKiBjcmVhdGVzIGEgc2ltcGxlIGN1bGxcbiAgICAgKiBAcGFyYW0ge29iamVjdH0gW29wdGlvbnNdXG4gICAgICogQHBhcmFtIHtib29sZWFufSBbb3B0aW9ucy52aXNpYmxlPXZpc2libGVdIHBhcmFtZXRlciBvZiB0aGUgb2JqZWN0IHRvIHNldCAodXN1YWxseSB2aXNpYmxlIG9yIHJlbmRlcmFibGUpXG4gICAgICogQHBhcmFtIHtib29sZWFufSBbb3B0aW9ucy5jYWxjdWxhdGVQSVhJPXRydWVdIGNhbGN1bGF0ZSBwaXhpLmpzIGJvdW5kaW5nIGJveCBhdXRvbWF0aWNhbGx5OyBpZiB0aGlzIGlzIHNldCB0byBmYWxzZSB0aGVuIGl0IHVzZXMgb2JqZWN0W29wdGlvbnMuQUFCQl0gZm9yIGJvdW5kaW5nIGJveFxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBbb3B0aW9ucy5kaXJ0eVRlc3Q9dHJ1ZV0gb25seSB1cGRhdGUgdGhlIEFBQkIgYm94Zm9yIG9iamVjdHMgd2l0aCBvYmplY3Rbb3B0aW9ucy5kaXJ0eVRlc3RdPXRydWU7IHRoaXMgaGFzIGEgSFVHRSBpbXBhY3Qgb24gcGVyZm9ybWFuY2VcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gW29wdGlvbnMuQUFCQj1BQUJCXSBvYmplY3QgcHJvcGVydHkgdGhhdCBob2xkcyBib3VuZGluZyBib3ggc28gdGhhdCBvYmplY3RbdHlwZV0gPSB7IHg6IG51bWJlciwgeTogbnVtYmVyLCB3aWR0aDogbnVtYmVyLCBoZWlnaHQ6IG51bWJlciB9OyBub3QgbmVlZGVkIGlmIG9wdGlvbnMuY2FsY3VsYXRlUElYST10cnVlXG4gICAgICovXG4gICAgY29uc3RydWN0b3Iob3B0aW9ucykge1xuICAgICAgICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fVxuICAgICAgICB0aGlzLnZpc2libGUgPSBvcHRpb25zLnZpc2libGUgfHwgJ3Zpc2libGUnXG4gICAgICAgIHRoaXMuY2FsY3VsYXRlUElYSSA9IHR5cGVvZiBvcHRpb25zLmNhbGN1bGF0ZVBJWEkgIT09ICd1bmRlZmluZWQnID8gb3B0aW9ucy5jYWxjdWxhdGVQSVhJIDogdHJ1ZVxuICAgICAgICB0aGlzLmRpcnR5VGVzdCA9IHR5cGVvZiBvcHRpb25zLmRpcnR5VGVzdCAhPT0gJ3VuZGVmaW5lZCcgPyBvcHRpb25zLmRpcnR5VGVzdCA6IHRydWVcbiAgICAgICAgdGhpcy5BQUJCID0gb3B0aW9ucy5BQUJCIHx8ICdBQUJCJ1xuICAgICAgICB0aGlzLmxpc3RzID0gW1tdXVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIGFkZCBhbiBhcnJheSBvZiBvYmplY3RzIHRvIGJlIGN1bGxlZFxuICAgICAqIEBwYXJhbSB7QXJyYXl9IGFycmF5XG4gICAgICogQHBhcmFtIHtib29sZWFufSBbc3RhdGljT2JqZWN0XSBzZXQgdG8gdHJ1ZSBpZiB0aGUgb2JqZWN0J3MgcG9zaXRpb24vc2l6ZSBkb2VzIG5vdCBjaGFuZ2VcbiAgICAgKiBAcmV0dXJuIHtBcnJheX0gYXJyYXlcbiAgICAgKi9cbiAgICBhZGRMaXN0KGFycmF5LCBzdGF0aWNPYmplY3QpIHtcbiAgICAgICAgdGhpcy5saXN0cy5wdXNoKGFycmF5KVxuICAgICAgICBpZiAoc3RhdGljT2JqZWN0KSB7XG4gICAgICAgICAgICBhcnJheS5zdGF0aWNPYmplY3QgPSB0cnVlXG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRoaXMuY2FsY3VsYXRlUElYSSAmJiB0aGlzLmRpcnR5VGVzdCkge1xuICAgICAgICAgICAgZm9yIChsZXQgb2JqZWN0IG9mIGFycmF5KSB7XG4gICAgICAgICAgICAgICAgdGhpcy51cGRhdGVPYmplY3Qob2JqZWN0KVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBhcnJheVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIHJlbW92ZSBhbiBhcnJheSBhZGRlZCBieSBhZGRMaXN0KClcbiAgICAgKiBAcGFyYW0ge0FycmF5fSBhcnJheVxuICAgICAqIEByZXR1cm4ge0FycmF5fSBhcnJheVxuICAgICAqL1xuICAgIHJlbW92ZUxpc3QoYXJyYXkpIHtcbiAgICAgICAgdGhpcy5saXN0cy5zcGxpY2UodGhpcy5saXN0cy5pbmRleE9mKGFycmF5KSwgMSlcbiAgICAgICAgcmV0dXJuIGFycmF5XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogYWRkIGFuIG9iamVjdCB0byBiZSBjdWxsZWRcbiAgICAgKiBAcGFyYW0geyp9IG9iamVjdFxuICAgICAqIEBwYXJhbSB7Ym9vbGVhbn0gW3N0YXRpY09iamVjdF0gc2V0IHRvIHRydWUgaWYgdGhlIG9iamVjdCdzIHBvc2l0aW9uL3NpemUgZG9lcyBub3QgY2hhbmdlXG4gICAgICogQHJldHVybiB7Kn0gb2JqZWN0XG4gICAgICovXG4gICAgYWRkKG9iamVjdCwgc3RhdGljT2JqZWN0KSB7XG4gICAgICAgIGlmIChzdGF0aWNPYmplY3QpIHtcbiAgICAgICAgICAgIG9iamVjdC5zdGF0aWNPYmplY3QgPSB0cnVlXG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRoaXMuY2FsY3VsYXRlUElYSSAmJiAodGhpcy5kaXJ0eVRlc3QgfHwgc3RhdGljT2JqZWN0KSkge1xuICAgICAgICAgICAgdGhpcy51cGRhdGVPYmplY3Qob2JqZWN0KVxuICAgICAgICB9XG4gICAgICAgIHRoaXMubGlzdHNbMF0ucHVzaChvYmplY3QpXG4gICAgICAgIHJldHVybiBvYmplY3RcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiByZW1vdmUgYW4gb2JqZWN0IGFkZGVkIGJ5IGFkZCgpXG4gICAgICogQHBhcmFtIHsqfSBvYmplY3RcbiAgICAgKiBAcmV0dXJuIHsqfSBvYmplY3RcbiAgICAgKi9cbiAgICByZW1vdmUob2JqZWN0KSB7XG4gICAgICAgIHRoaXMubGlzdHNbMF0uc3BsaWNlKHRoaXMubGlzdHNbMF0uaW5kZXhPZihvYmplY3QpLCAxKVxuICAgICAgICByZXR1cm4gb2JqZWN0XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogY3VsbCB0aGUgaXRlbXMgaW4gdGhlIGxpc3QgYnkgc2V0dGluZyB2aXNpYmxlIHBhcmFtZXRlclxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSBib3VuZHNcbiAgICAgKiBAcGFyYW0ge251bWJlcn0gYm91bmRzLnhcbiAgICAgKiBAcGFyYW0ge251bWJlcn0gYm91bmRzLnlcbiAgICAgKiBAcGFyYW0ge251bWJlcn0gYm91bmRzLndpZHRoXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IGJvdW5kcy5oZWlnaHRcbiAgICAgKiBAcGFyYW0ge2Jvb2xlYW59IFtza2lwVXBkYXRlXSBza2lwIHVwZGF0aW5nIHRoZSBBQUJCIGJvdW5kaW5nIGJveCBvZiBhbGwgb2JqZWN0c1xuICAgICAqL1xuICAgIGN1bGwoYm91bmRzLCBza2lwVXBkYXRlKSB7XG4gICAgICAgIGlmICh0aGlzLmNhbGN1bGF0ZVBJWEkgJiYgIXNraXBVcGRhdGUpIHtcbiAgICAgICAgICAgIHRoaXMudXBkYXRlT2JqZWN0cygpXG4gICAgICAgIH1cbiAgICAgICAgZm9yIChsZXQgbGlzdCBvZiB0aGlzLmxpc3RzKSB7XG4gICAgICAgICAgICBmb3IgKGxldCBvYmplY3Qgb2YgbGlzdCkge1xuICAgICAgICAgICAgICAgIGNvbnN0IGJveCA9IG9iamVjdFt0aGlzLkFBQkJdXG4gICAgICAgICAgICAgICAgb2JqZWN0W3RoaXMudmlzaWJsZV0gPVxuICAgICAgICAgICAgICAgICAgICBib3gueCArIGJveC53aWR0aCA+IGJvdW5kcy54ICYmIGJveC54IDwgYm91bmRzLnggKyBib3VuZHMud2lkdGggJiZcbiAgICAgICAgICAgICAgICAgICAgYm94LnkgKyBib3guaGVpZ2h0ID4gYm91bmRzLnkgJiYgYm94LnkgPCBib3VuZHMueSArIGJvdW5kcy5oZWlnaHRcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIHVwZGF0ZSB0aGUgQUFCQiBmb3IgYWxsIG9iamVjdHNcbiAgICAgKiBhdXRvbWF0aWNhbGx5IGNhbGxlZCBmcm9tIHVwZGF0ZSgpIHdoZW4gY2FsY3VsYXRlUElYST10cnVlIGFuZCBza2lwVXBkYXRlPWZhbHNlXG4gICAgICovXG4gICAgdXBkYXRlT2JqZWN0cygpIHtcbiAgICAgICAgaWYgKHRoaXMuZGlydHlUZXN0KSB7XG4gICAgICAgICAgICBmb3IgKGxldCBsaXN0IG9mIHRoaXMubGlzdHMpIHtcbiAgICAgICAgICAgICAgICBpZiAoIWxpc3Quc3RhdGljT2JqZWN0KSB7XG4gICAgICAgICAgICAgICAgICAgIGZvciAobGV0IG9iamVjdCBvZiBsaXN0KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIW9iamVjdC5zdGF0aWNPYmplY3QgJiYgb2JqZWN0W3RoaXMuZGlydHldKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy51cGRhdGVPYmplY3Qob2JqZWN0KVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9iamVjdFt0aGlzLmRpcnR5XSA9IGZhbHNlXG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBmb3IgKGxldCBsaXN0IG9mIHRoaXMubGlzdHMpIHtcbiAgICAgICAgICAgICAgICBpZiAoIWxpc3Quc3RhdGljT2JqZWN0KSB7XG4gICAgICAgICAgICAgICAgICAgIGZvciAobGV0IG9iamVjdCBvZiBsaXN0KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIW9iamVjdC5zdGF0aWNPYmplY3QpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnVwZGF0ZU9iamVjdChvYmplY3QpXG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiB1cGRhdGUgdGhlIGhhcyBvZiBhbiBvYmplY3RcbiAgICAgKiBhdXRvbWF0aWNhbGx5IGNhbGxlZCBmcm9tIHVwZGF0ZU9iamVjdHMoKVxuICAgICAqIEBwYXJhbSB7Kn0gb2JqZWN0XG4gICAgICovXG4gICAgdXBkYXRlT2JqZWN0KG9iamVjdCkge1xuICAgICAgICBjb25zdCBib3ggPSBvYmplY3QuZ2V0TG9jYWxCb3VuZHMoKVxuICAgICAgICBvYmplY3RbdGhpcy5BQUJCXSA9IG9iamVjdFt0aGlzLkFBQkJdIHx8IHt9XG4gICAgICAgIG9iamVjdFt0aGlzLkFBQkJdLnggPSBvYmplY3QueCArIChib3gueCAtIG9iamVjdC5waXZvdC54KSAqIG9iamVjdC5zY2FsZS54XG4gICAgICAgIG9iamVjdFt0aGlzLkFBQkJdLnkgPSBvYmplY3QueSArIChib3gueSAtIG9iamVjdC5waXZvdC55KSAqIG9iamVjdC5zY2FsZS55XG4gICAgICAgIG9iamVjdFt0aGlzLkFBQkJdLndpZHRoID0gYm94LndpZHRoICogb2JqZWN0LnNjYWxlLnhcbiAgICAgICAgb2JqZWN0W3RoaXMuQUFCQl0uaGVpZ2h0ID0gYm94LmhlaWdodCAqIG9iamVjdC5zY2FsZS55XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogcmV0dXJucyBhbiBhcnJheSBvZiBvYmplY3RzIGNvbnRhaW5lZCB3aXRoaW4gYm91bmRpbmcgYm94XG4gICAgICogQHBhcmFtIHtvYmplY3R9IGJvdWRucyBib3VuZGluZyBib3ggdG8gc2VhcmNoXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IGJvdW5kcy54XG4gICAgICogQHBhcmFtIHtudW1iZXJ9IGJvdW5kcy55XG4gICAgICogQHBhcmFtIHtudW1iZXJ9IGJvdW5kcy53aWR0aFxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSBib3VuZHMuaGVpZ2h0XG4gICAgICogQHJldHVybiB7b2JqZWN0W119IHNlYXJjaCByZXN1bHRzXG4gICAgICovXG4gICAgcXVlcnkoYm91bmRzKSB7XG4gICAgICAgIGxldCByZXN1bHRzID0gW11cbiAgICAgICAgZm9yIChsZXQgbGlzdCBvZiB0aGlzLmxpc3RzKSB7XG4gICAgICAgICAgICBmb3IgKGxldCBvYmplY3Qgb2YgbGlzdCkge1xuICAgICAgICAgICAgICAgIGNvbnN0IGJveCA9IG9iamVjdFt0aGlzLkFBQkJdXG4gICAgICAgICAgICAgICAgaWYgKGJveC54ICsgYm94LndpZHRoID4gYm91bmRzLnggJiYgYm94LnggLSBib3gud2lkdGggPCBib3VuZHMueCArIGJvdW5kcy53aWR0aCAmJlxuICAgICAgICAgICAgICAgICAgICBib3gueSArIGJveC5oZWlnaHQgPiBib3VuZHMueSAmJiBib3gueSAtIGJveC5oZWlnaHQgPCBib3VuZHMueSArIGJvdW5kcy5oZWlnaHQpIHtcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0cy5wdXNoKG9iamVjdClcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHJlc3VsdHNcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBpdGVyYXRlcyB0aHJvdWdoIG9iamVjdHMgY29udGFpbmVkIHdpdGhpbiBib3VuZGluZyBib3hcbiAgICAgKiBzdG9wcyBpdGVyYXRpbmcgaWYgdGhlIGNhbGxiYWNrIHJldHVybnMgdHJ1ZVxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSBib3VuZHMgYm91bmRpbmcgYm94IHRvIHNlYXJjaFxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSBib3VuZHMueFxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSBib3VuZHMueVxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSBib3VuZHMud2lkdGhcbiAgICAgKiBAcGFyYW0ge251bWJlcn0gYm91bmRzLmhlaWdodFxuICAgICAqIEBwYXJhbSB7ZnVuY3Rpb259IGNhbGxiYWNrXG4gICAgICogQHJldHVybiB7Ym9vbGVhbn0gdHJ1ZSBpZiBjYWxsYmFjayByZXR1cm5lZCBlYXJseVxuICAgICAqL1xuICAgIHF1ZXJ5Q2FsbGJhY2soYm91bmRzLCBjYWxsYmFjaykge1xuICAgICAgICBmb3IgKGxldCBsaXN0IG9mIHRoaXMubGlzdHMpIHtcbiAgICAgICAgICAgIGZvciAobGV0IG9iamVjdCBvZiBsaXN0KSB7XG4gICAgICAgICAgICAgICAgY29uc3QgYm94ID0gb2JqZWN0W3RoaXMuQUFCQl1cbiAgICAgICAgICAgICAgICBpZiAoYm94LnggKyBib3gud2lkdGggPiBib3VuZHMueCAmJiBib3gueCAtIGJveC53aWR0aCA8IGJvdW5kcy54ICsgYm91bmRzLndpZHRoICYmXG4gICAgICAgICAgICAgICAgICAgIGJveC55ICsgYm94LmhlaWdodCA+IGJvdW5kcy55ICYmIGJveC55IC0gYm94LmhlaWdodCA8IGJvdW5kcy55ICsgYm91bmRzLmhlaWdodCkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoY2FsbGJhY2sob2JqZWN0KSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWVcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZmFsc2VcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBnZXQgc3RhdHMgKG9ubHkgdXBkYXRlZCBhZnRlciB1cGRhdGUoKSBpcyBjYWxsZWQpXG4gICAgICogQHJldHVybiB7U2ltcGxlU3RhdHN9XG4gICAgICovXG4gICAgc3RhdHMoKSB7XG4gICAgICAgIGxldCB2aXNpYmxlID0gMCwgY291bnQgPSAwXG4gICAgICAgIGZvciAobGV0IGxpc3Qgb2YgdGhpcy5saXN0cykge1xuICAgICAgICAgICAgbGlzdC5mb3JFYWNoKG9iamVjdCA9PiB7XG4gICAgICAgICAgICAgICAgdmlzaWJsZSArPSBvYmplY3QudmlzaWJsZSA/IDEgOiAwXG4gICAgICAgICAgICAgICAgY291bnQrK1xuICAgICAgICAgICAgfSlcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4geyB0b3RhbDogY291bnQsIHZpc2libGUsIGN1bGxlZDogY291bnQgLSB2aXNpYmxlIH1cbiAgICB9XG59XG5cbi8qKlxuICogQHR5cGVkZWYge29iamVjdH0gU2ltcGxlU3RhdHNcbiAqIEBwcm9wZXJ0eSB7bnVtYmVyfSB0b3RhbFxuICogQHByb3BlcnR5IHtudW1iZXJ9IHZpc2libGVcbiAqIEBwcm9wZXJ0eSB7bnVtYmVyfSBjdWxsZWRcbiAqL1xuXG5tb2R1bGUuZXhwb3J0cyA9IFNpbXBsZSJdfQ==