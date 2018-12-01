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
            var _iteratorNormalCompletion = true;
            var _didIteratorError = false;
            var _iteratorError = undefined;

            try {
                for (var _iterator = this.lists[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                    var list = _step.value;
                    var _iteratorNormalCompletion2 = true;
                    var _didIteratorError2 = false;
                    var _iteratorError2 = undefined;

                    try {
                        for (var _iterator2 = list[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
                            var object = _step2.value;

                            var box = object[this.AABB];
                            object[this.visible] = box.x + box.width > bounds.x && box.x < bounds.x + bounds.width && box.y + box.height > bounds.y && box.y < bounds.y + bounds.height;
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

        /**
         * update the AABB for all objects
         * automatically called from update() when calculatePIXI=true and skipUpdate=false
         */

    }, {
        key: 'updateObjects',
        value: function updateObjects() {
            if (this.dirtyTest) {
                var _iteratorNormalCompletion3 = true;
                var _didIteratorError3 = false;
                var _iteratorError3 = undefined;

                try {
                    for (var _iterator3 = this.lists[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
                        var list = _step3.value;

                        if (!list.staticObject) {
                            var _iteratorNormalCompletion4 = true;
                            var _didIteratorError4 = false;
                            var _iteratorError4 = undefined;

                            try {
                                for (var _iterator4 = list[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
                                    var object = _step4.value;

                                    if (!object.staticObject && object[this.dirty]) {
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

                        if (!_list.staticObject) {
                            var _iteratorNormalCompletion6 = true;
                            var _didIteratorError6 = false;
                            var _iteratorError6 = undefined;

                            try {
                                for (var _iterator6 = _list[Symbol.iterator](), _step6; !(_iteratorNormalCompletion6 = (_step6 = _iterator6.next()).done); _iteratorNormalCompletion6 = true) {
                                    var _object = _step6.value;

                                    if (!_object.staticObject) {
                                        this.updateObject(_object);
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
         */

    }, {
        key: 'updateObject',
        value: function updateObject(object) {
            var box = object.getLocalBounds();
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
            var _iteratorNormalCompletion7 = true;
            var _didIteratorError7 = false;
            var _iteratorError7 = undefined;

            try {
                for (var _iterator7 = this.lists[Symbol.iterator](), _step7; !(_iteratorNormalCompletion7 = (_step7 = _iterator7.next()).done); _iteratorNormalCompletion7 = true) {
                    var list = _step7.value;
                    var _iteratorNormalCompletion8 = true;
                    var _didIteratorError8 = false;
                    var _iteratorError8 = undefined;

                    try {
                        for (var _iterator8 = list[Symbol.iterator](), _step8; !(_iteratorNormalCompletion8 = (_step8 = _iterator8.next()).done); _iteratorNormalCompletion8 = true) {
                            var object = _step8.value;

                            var box = object[this.AABB];
                            if (box.x + box.width > bounds.x && box.x - box.width < bounds.x + bounds.width && box.y + box.height > bounds.y && box.y - box.height < bounds.y + bounds.height) {
                                results.push(object);
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
            var _iteratorNormalCompletion9 = true;
            var _didIteratorError9 = false;
            var _iteratorError9 = undefined;

            try {
                for (var _iterator9 = this.lists[Symbol.iterator](), _step9; !(_iteratorNormalCompletion9 = (_step9 = _iterator9.next()).done); _iteratorNormalCompletion9 = true) {
                    var list = _step9.value;
                    var _iteratorNormalCompletion10 = true;
                    var _didIteratorError10 = false;
                    var _iteratorError10 = undefined;

                    try {
                        for (var _iterator10 = list[Symbol.iterator](), _step10; !(_iteratorNormalCompletion10 = (_step10 = _iterator10.next()).done); _iteratorNormalCompletion10 = true) {
                            var object = _step10.value;

                            var box = object[this.AABB];
                            if (box.x + box.width > bounds.x && box.x - box.width < bounds.x + bounds.width && box.y + box.height > bounds.y && box.y - box.height < bounds.y + bounds.height) {
                                if (callback(object)) {
                                    return true;
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
            var _iteratorNormalCompletion11 = true;
            var _didIteratorError11 = false;
            var _iteratorError11 = undefined;

            try {
                for (var _iterator11 = this.lists[Symbol.iterator](), _step11; !(_iteratorNormalCompletion11 = (_step11 = _iterator11.next()).done); _iteratorNormalCompletion11 = true) {
                    var list = _step11.value;

                    list.forEach(function (object) {
                        visible += object.visible ? 1 : 0;
                        count++;
                    });
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL2NvZGUvc2ltcGxlLmpzIl0sIm5hbWVzIjpbIlNpbXBsZSIsIm9wdGlvbnMiLCJ2aXNpYmxlIiwiY2FsY3VsYXRlUElYSSIsImRpcnR5VGVzdCIsIkFBQkIiLCJsaXN0cyIsImFycmF5Iiwic3RhdGljT2JqZWN0IiwicHVzaCIsInNwbGljZSIsImluZGV4T2YiLCJvYmplY3QiLCJib3VuZHMiLCJza2lwVXBkYXRlIiwidXBkYXRlT2JqZWN0cyIsImxpc3QiLCJib3giLCJ4Iiwid2lkdGgiLCJ5IiwiaGVpZ2h0IiwiZGlydHkiLCJ1cGRhdGVPYmplY3QiLCJnZXRMb2NhbEJvdW5kcyIsInNjYWxlIiwicmVzdWx0cyIsImNhbGxiYWNrIiwiY291bnQiLCJmb3JFYWNoIiwidG90YWwiLCJjdWxsZWQiLCJtb2R1bGUiLCJleHBvcnRzIl0sIm1hcHBpbmdzIjoiOzs7Ozs7QUFBQTtBQUNBO0FBQ0E7QUFDQTs7SUFFTUEsTTtBQUVGOzs7Ozs7OztBQVFBLG9CQUFZQyxPQUFaLEVBQ0E7QUFBQTs7QUFDSUEsa0JBQVVBLFdBQVcsRUFBckI7QUFDQSxhQUFLQyxPQUFMLEdBQWVELFFBQVFDLE9BQVIsSUFBbUIsU0FBbEM7QUFDQSxhQUFLQyxhQUFMLEdBQXFCLE9BQU9GLFFBQVFFLGFBQWYsS0FBaUMsV0FBakMsR0FBK0NGLFFBQVFFLGFBQXZELEdBQXVFLElBQTVGO0FBQ0EsYUFBS0MsU0FBTCxHQUFpQixPQUFPSCxRQUFRRyxTQUFmLEtBQTZCLFdBQTdCLEdBQTJDSCxRQUFRRyxTQUFuRCxHQUErRCxJQUFoRjtBQUNBLGFBQUtDLElBQUwsR0FBWUosUUFBUUksSUFBUixJQUFnQixNQUE1QjtBQUNBLGFBQUtDLEtBQUwsR0FBYSxDQUFDLEVBQUQsQ0FBYjtBQUNIOztBQUVEOzs7Ozs7Ozs7O2dDQU1RQyxLLEVBQU9DLFksRUFDZjtBQUNJLGlCQUFLRixLQUFMLENBQVdHLElBQVgsQ0FBZ0JGLEtBQWhCO0FBQ0EsZ0JBQUlDLFlBQUosRUFDQTtBQUNJRCxzQkFB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QU9PLENBRDVCLElBQ2lDSCxJQUFJRyxDQUFKLEdBQVFILElBQUlJLE1BQVosR0FBcUJSLE9BQU9PLENBQVAsR0FBV1AsT0FBT1EsTUFENUUsRUFFQTtBQUNJLG9DQUFJTSxTQUFTZixNQUFULENBQUosRUFDQTtBQUNJLDJDQUFPLElBQVA7QUFDSDtBQUNKO0FBQ0o7QUFaTDtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBYUM7QUFmTDtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBOztBQWdCSSxtQkFBTyxLQUFQO0FBQ0g7O0FBRUQ7Ozs7Ozs7Z0NBS0E7QUFDSSxnQkFBSVYsVUFBVSxDQUFkO0FBQUEsZ0JBQWlCMEIsUUFBUSxDQUF6QjtBQURKO0FBQUE7QUFBQTs7QUFBQTtBQUVJLHVDQUFpQixLQUFLdEIsS0FBdEIsd0lBQ0E7QUFBQSx3QkFEU1UsSUFDVDs7QUFDSUEseUJBQUthLE9BQUwsQ0FBYSxrQkFDYjtBQUNJM0IsbUNBQVdVLE9BQU9WLE9BQVAsR0FBaUIsQ0FBakIsR0FBcUIsQ0FBaEM7QUFDQTBCO0FBQ0gscUJBSkQ7QUFLSDtBQVRMO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7O0FBVUksbUJBQU8sRUFBRUUsT0FBT0YsS0FBVCxFQUFnQjFCLGdCQUFoQixFQUF5QjZCLFFBQVFILFFBQVExQixPQUF6QyxFQUFQO0FBQ0g7Ozs7OztBQUdMOzs7Ozs7O0FBT0E4QixPQUFPQyxPQUFQLEdBQWlCakMsTUFBakIiLCJmaWxlIjoic2ltcGxlLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLy8gcGl4aS1jdWxsLlNwYXRpYWxIYXNoXHJcbi8vIENvcHlyaWdodCAyMDE4IFlPUEVZIFlPUEVZIExMQ1xyXG4vLyBEYXZpZCBGaWdhdG5lclxyXG4vLyBNSVQgTGljZW5zZVxyXG5cclxuY2xhc3MgU2ltcGxlXHJcbntcclxuICAgIC8qKlxyXG4gICAgICogY3JlYXRlcyBhIHNpbXBsZSBjdWxsXHJcbiAgICAgKiBAcGFyYW0ge29iamVjdH0gW29wdGlvbnNdXHJcbiAgICAgKiBAcGFyYW0ge2Jvb2xlYW59IFtvcHRpb25zLnZpc2libGU9dmlzaWJsZV0gcGFyYW1ldGVyIG9mIHRoZSBvYmplY3QgdG8gc2V0ICh1c3VhbGx5IHZpc2libGUgb3IgcmVuZGVyYWJsZSlcclxuICAgICAqIEBwYXJhbSB7Ym9vbGVhbn0gW29wdGlvbnMuY2FsY3VsYXRlUElYST10cnVlXSBjYWxjdWxhdGUgcGl4aS5qcyBib3VuZGluZyBib3ggYXV0b21hdGljYWxseTsgaWYgdGhpcyBpcyBzZXQgdG8gZmFsc2UgdGhlbiBpdCB1c2VzIG9iamVjdFtvcHRpb25zLkFBQkJdIGZvciBib3VuZGluZyBib3hcclxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBbb3B0aW9ucy5kaXJ0eVRlc3Q9dHJ1ZV0gb25seSB1cGRhdGUgc3BhdGlhbCBoYXNoIGZvciBvYmplY3RzIHdpdGggb2JqZWN0W29wdGlvbnMuZGlydHlUZXN0XT10cnVlOyB0aGlzIGhhcyBhIEhVR0UgaW1wYWN0IG9uIHBlcmZvcm1hbmNlXHJcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gW29wdGlvbnMuQUFCQj1BQUJCXSBvYmplY3QgcHJvcGVydHkgdGhhdCBob2xkcyBib3VuZGluZyBib3ggc28gdGhhdCBvYmplY3RbdHlwZV0gPSB7IHg6IG51bWJlciwgeTogbnVtYmVyLCB3aWR0aDogbnVtYmVyLCBoZWlnaHQ6IG51bWJlciB9OyBub3QgbmVlZGVkIGlmIG9wdGlvbnMuY2FsY3VsYXRlUElYST10cnVlXHJcbiAgICAgKi9cclxuICAgIGNvbnN0cnVjdG9yKG9wdGlvbnMpXHJcbiAgICB7XHJcbiAgICAgICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge31cclxuICAgICAgICB0aGlzLnZpc2libGUgPSBvcHRpb25zLnZpc2libGUgfHwgJ3Zpc2libGUnXHJcbiAgICAgICAgdGhpcy5jYWxjdWxhdGVQSVhJID0gdHlwZW9mIG9wdGlvbnMuY2FsY3VsYXRlUElYSSAhPT0gJ3VuZGVmaW5lZCcgPyBvcHRpb25zLmNhbGN1bGF0ZVBJWEkgOiB0cnVlXHJcbiAgICAgICAgdGhpcy5kaXJ0eVRlc3QgPSB0eXBlb2Ygb3B0aW9ucy5kaXJ0eVRlc3QgIT09ICd1bmRlZmluZWQnID8gb3B0aW9ucy5kaXJ0eVRlc3QgOiB0cnVlXHJcbiAgICAgICAgdGhpcy5BQUJCID0gb3B0aW9ucy5BQUJCIHx8ICdBQUJCJ1xyXG4gICAgICAgIHRoaXMubGlzdHMgPSBbW11dXHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBhZGQgYW4gYXJyYXkgb2Ygb2JqZWN0cyB0byBiZSBjdWxsZWRcclxuICAgICAqIEBwYXJhbSB7QXJyYXl9IGFycmF5XHJcbiAgICAgKiBAcGFyYW0ge2Jvb2xlYW59IFtzdGF0aWNPYmplY3RdIHNldCB0byB0cnVlIGlmIHRoZSBvYmplY3QncyBwb3NpdGlvbi9zaXplIGRvZXMgbm90IGNoYW5nZVxyXG4gICAgICogQHJldHVybiB7QXJyYXl9IGFycmF5XHJcbiAgICAgKi9cclxuICAgIGFkZExpc3QoYXJyYXksIHN0YXRpY09iamVjdClcclxuICAgIHtcclxuICAgICAgICB0aGlzLmxpc3RzLnB1c2goYXJyYXkpXHJcbiAgICAgICAgaWYgKHN0YXRpY09iamVjdClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGFycmF5LnN0YXRpY09iamVjdCA9IHRydWVcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIGFycmF5XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiByZW1vdmUgYW4gYXJyYXkgYWRkZWQgYnkgYWRkTGlzdCgpXHJcbiAgICAgKiBAcGFyYW0ge0FycmF5fSBhcnJheVxyXG4gICAgICogQHJldHVybiB7QXJyYXl9IGFycmF5XHJcbiAgICAgKi9cclxuICAgIHJlbW92ZUxpc3QoYXJyYXkpXHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy5saXN0cy5zcGxpY2UodGhpcy5saXN0cy5pbmRleE9mKGFycmF5KSwgMSlcclxuICAgICAgICByZXR1cm4gYXJyYXlcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIGFkZCBhbiBvYmplY3QgdG8gYmUgY3VsbGVkXHJcbiAgICAgKiBAcGFyYW0geyp9IG9iamVjdFxyXG4gICAgICogQHBhcmFtIHtib29sZWFufSBbc3RhdGljT2JqZWN0XSBzZXQgdG8gdHJ1ZSBpZiB0aGUgb2JqZWN0J3MgcG9zaXRpb24vc2l6ZSBkb2VzIG5vdCBjaGFuZ2VcclxuICAgICAqIEByZXR1cm4geyp9IG9iamVjdFxyXG4gICAgICovXHJcbiAgICBhZGQob2JqZWN0LCBzdGF0aWNPYmplY3QpXHJcbiAgICB7XHJcbiAgICAgICAgaWYgKHN0YXRpY09iamVjdClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIG9iamVjdC5zdGF0aWNPYmplY3QgPSB0cnVlXHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMubGlzdHNbMF0ucHVzaChvYmplY3QpXHJcbiAgICAgICAgcmV0dXJuIG9iamVjdFxyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogcmVtb3ZlIGFuIG9iamVjdCBhZGRlZCBieSBhZGQoKVxyXG4gICAgICogQHBhcmFtIHsqfSBvYmplY3RcclxuICAgICAqIEByZXR1cm4geyp9IG9iamVjdFxyXG4gICAgICovXHJcbiAgICByZW1vdmUob2JqZWN0KVxyXG4gICAge1xyXG4gICAgICAgIHRoaXMubGlzdHNbMF0uc3BsaWNlKHRoaXMubGlzdHNbMF0uaW5kZXhPZihvYmplY3QpLCAxKVxyXG4gICAgICAgIHJldHVybiBvYmplY3RcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIGN1bGwgdGhlIGl0ZW1zIGluIHRoZSBsaXN0IGJ5IHNldHRpbmcgdmlzaWJsZSBwYXJhbWV0ZXJcclxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSBib3VuZHNcclxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSBib3VuZHMueFxyXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IGJvdW5kcy55XHJcbiAgICAgKiBAcGFyYW0ge251bWJlcn0gYm91bmRzLndpZHRoXHJcbiAgICAgKiBAcGFyYW0ge251bWJlcn0gYm91bmRzLmhlaWdodFxyXG4gICAgICogQHBhcmFtIHtib29sZWFufSBbc2tpcFVwZGF0ZV0gc2tpcCB1cGRhdGluZyB0aGUgQUFCQiBib3VuZGluZyBib3ggb2YgYWxsIG9iamVjdHNcclxuICAgICAqL1xyXG4gICAgY3VsbChib3VuZHMsIHNraXBVcGRhdGUpXHJcbiAgICB7XHJcbiAgICAgICAgaWYgKHRoaXMuY2FsY3VsYXRlUElYSSAmJiAhc2tpcFVwZGF0ZSlcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRoaXMudXBkYXRlT2JqZWN0cygpXHJcbiAgICAgICAgfVxyXG4gICAgICAgIGZvciAobGV0IGxpc3Qgb2YgdGhpcy5saXN0cylcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGZvciAobGV0IG9iamVjdCBvZiBsaXN0KVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBib3ggPSBvYmplY3RbdGhpcy5BQUJCXVxyXG4gICAgICAgICAgICAgICAgb2JqZWN0W3RoaXMudmlzaWJsZV0gPVxyXG4gICAgICAgICAgICAgICAgICAgIGJveC54ICsgYm94LndpZHRoID4gYm91bmRzLnggJiYgYm94LnggPCBib3VuZHMueCArIGJvdW5kcy53aWR0aCAmJlxyXG4gICAgICAgICAgICAgICAgICAgIGJveC55ICsgYm94LmhlaWdodCA+IGJvdW5kcy55ICYmIGJveC55IDwgYm91bmRzLnkgKyBib3VuZHMuaGVpZ2h0XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiB1cGRhdGUgdGhlIEFBQkIgZm9yIGFsbCBvYmplY3RzXHJcbiAgICAgKiBhdXRvbWF0aWNhbGx5IGNhbGxlZCBmcm9tIHVwZGF0ZSgpIHdoZW4gY2FsY3VsYXRlUElYST10cnVlIGFuZCBza2lwVXBkYXRlPWZhbHNlXHJcbiAgICAgKi9cclxuICAgIHVwZGF0ZU9iamVjdHMoKVxyXG4gICAge1xyXG4gICAgICAgIGlmICh0aGlzLmRpcnR5VGVzdClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGZvciAobGV0IGxpc3Qgb2YgdGhpcy5saXN0cylcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgaWYgKCFsaXN0LnN0YXRpY09iamVjdClcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICBmb3IgKGxldCBvYmplY3Qgb2YgbGlzdClcclxuICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICghb2JqZWN0LnN0YXRpY09iamVjdCAmJiBvYmplY3RbdGhpcy5kaXJ0eV0pXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMudXBkYXRlT2JqZWN0KG9iamVjdClcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9iamVjdFt0aGlzLmRpcnR5XSA9IGZhbHNlXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgZm9yIChsZXQgbGlzdCBvZiB0aGlzLmxpc3RzKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBpZiAoIWxpc3Quc3RhdGljT2JqZWN0KVxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIGZvciAobGV0IG9iamVjdCBvZiBsaXN0KVxyXG4gICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFvYmplY3Quc3RhdGljT2JqZWN0KVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnVwZGF0ZU9iamVjdChvYmplY3QpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiB1cGRhdGUgdGhlIGhhcyBvZiBhbiBvYmplY3RcclxuICAgICAqIGF1dG9tYXRpY2FsbHkgY2FsbGVkIGZyb20gdXBkYXRlT2JqZWN0cygpXHJcbiAgICAgKiBAcGFyYW0geyp9IG9iamVjdFxyXG4gICAgICovXHJcbiAgICB1cGRhdGVPYmplY3Qob2JqZWN0KVxyXG4gICAge1xyXG4gICAgICAgIGNvbnN0IGJveCA9IG9iamVjdC5nZXRMb2NhbEJvdW5kcygpXHJcbiAgICAgICAgb2JqZWN0W3RoaXMuQUFCQl0ueCA9IG9iamVjdC54ICsgYm94LnggKiBvYmplY3Quc2NhbGUueFxyXG4gICAgICAgIG9iamVjdFt0aGlzLkFBQkJdLnkgPSBvYmplY3QueSArIGJveC55ICogb2JqZWN0LnNjYWxlLnlcclxuICAgICAgICBvYmplY3RbdGhpcy5BQUJCXS53aWR0aCA9IGJveC53aWR0aCAqIG9iamVjdC5zY2FsZS54XHJcbiAgICAgICAgb2JqZWN0W3RoaXMuQUFCQl0uaGVpZ2h0ID0gYm94LmhlaWdodCAqIG9iamVjdC5zY2FsZS55XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiByZXR1cm5zIGFuIGFycmF5IG9mIG9iamVjdHMgY29udGFpbmVkIHdpdGhpbiBib3VuZGluZyBib3hcclxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSBib3VkbnMgYm91bmRpbmcgYm94IHRvIHNlYXJjaFxyXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IGJvdW5kcy54XHJcbiAgICAgKiBAcGFyYW0ge251bWJlcn0gYm91bmRzLnlcclxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSBib3VuZHMud2lkdGhcclxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSBib3VuZHMuaGVpZ2h0XHJcbiAgICAgKiBAcmV0dXJuIHtvYmplY3RbXX0gc2VhcmNoIHJlc3VsdHNcclxuICAgICAqL1xyXG4gICAgcXVlcnkoYm91bmRzKVxyXG4gICAge1xyXG4gICAgICAgIGxldCByZXN1bHRzID0gW11cclxuICAgICAgICBmb3IgKGxldCBsaXN0IG9mIHRoaXMubGlzdHMpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBmb3IgKGxldCBvYmplY3Qgb2YgbGlzdClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgY29uc3QgYm94ID0gb2JqZWN0W3RoaXMuQUFCQl1cclxuICAgICAgICAgICAgICAgIGlmIChib3gueCArIGJveC53aWR0aCA+IGJvdW5kcy54ICYmIGJveC54IC0gYm94LndpZHRoIDwgYm91bmRzLnggKyBib3VuZHMud2lkdGggJiZcclxuICAgICAgICAgICAgICAgICAgICBib3gueSArIGJveC5oZWlnaHQgPiBib3VuZHMueSAmJiBib3gueSAtIGJveC5oZWlnaHQgPCBib3VuZHMueSArIGJvdW5kcy5oZWlnaHQpXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0cy5wdXNoKG9iamVjdClcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gcmVzdWx0c1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogaXRlcmF0ZXMgdGhyb3VnaCBvYmplY3RzIGNvbnRhaW5lZCB3aXRoaW4gYm91bmRpbmcgYm94XHJcbiAgICAgKiBzdG9wcyBpdGVyYXRpbmcgaWYgdGhlIGNhbGxiYWNrIHJldHVybnMgdHJ1ZVxyXG4gICAgICogQHBhcmFtIHtvYmplY3R9IGJvdW5kcyBib3VuZGluZyBib3ggdG8gc2VhcmNoXHJcbiAgICAgKiBAcGFyYW0ge251bWJlcn0gYm91bmRzLnhcclxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSBib3VuZHMueVxyXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IGJvdW5kcy53aWR0aFxyXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IGJvdW5kcy5oZWlnaHRcclxuICAgICAqIEBwYXJhbSB7ZnVuY3Rpb259IGNhbGxiYWNrXHJcbiAgICAgKiBAcmV0dXJuIHtib29sZWFufSB0cnVlIGlmIGNhbGxiYWNrIHJldHVybmVkIGVhcmx5XHJcbiAgICAgKi9cclxuICAgIHF1ZXJ5Q2FsbGJhY2soYm91bmRzLCBjYWxsYmFjaylcclxuICAgIHtcclxuICAgICAgICBmb3IgKGxldCBsaXN0IG9mIHRoaXMubGlzdHMpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBmb3IgKGxldCBvYmplY3Qgb2YgbGlzdClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgY29uc3QgYm94ID0gb2JqZWN0W3RoaXMuQUFCQl1cclxuICAgICAgICAgICAgICAgIGlmIChib3gueCArIGJveC53aWR0aCA+IGJvdW5kcy54ICYmIGJveC54IC0gYm94LndpZHRoIDwgYm91bmRzLnggKyBib3VuZHMud2lkdGggJiZcclxuICAgICAgICAgICAgICAgICAgICBib3gueSArIGJveC5oZWlnaHQgPiBib3VuZHMueSAmJiBib3gueSAtIGJveC5oZWlnaHQgPCBib3VuZHMueSArIGJvdW5kcy5oZWlnaHQpXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGNhbGxiYWNrKG9iamVjdCkpXHJcbiAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZVxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gZmFsc2VcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIGdldCBzdGF0cyAob25seSB1cGRhdGVkIGFmdGVyIHVwZGF0ZSgpIGlzIGNhbGxlZClcclxuICAgICAqIEByZXR1cm4ge1NpbXBsZVN0YXRzfVxyXG4gICAgICovXHJcbiAgICBzdGF0cygpXHJcbiAgICB7XHJcbiAgICAgICAgbGV0IHZpc2libGUgPSAwLCBjb3VudCA9IDBcclxuICAgICAgICBmb3IgKGxldCBsaXN0IG9mIHRoaXMubGlzdHMpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBsaXN0LmZvckVhY2gob2JqZWN0ID0+XHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHZpc2libGUgKz0gb2JqZWN0LnZpc2libGUgPyAxIDogMFxyXG4gICAgICAgICAgICAgICAgY291bnQrK1xyXG4gICAgICAgICAgICB9KVxyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4geyB0b3RhbDogY291bnQsIHZpc2libGUsIGN1bGxlZDogY291bnQgLSB2aXNpYmxlIH1cclxuICAgIH1cclxufVxyXG5cclxuLyoqXHJcbiAqIEB0eXBlZGVmIHtvYmplY3R9IFNpbXBsZVN0YXRzXHJcbiAqIEBwcm9wZXJ0eSB7bnVtYmVyfSB0b3RhbFxyXG4gKiBAcHJvcGVydHkge251bWJlcn0gdmlzaWJsZVxyXG4gKiBAcHJvcGVydHkge251bWJlcn0gY3VsbGVkXHJcbiAqL1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBTaW1wbGUiXX0=