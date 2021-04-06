import * as PIXI from 'pixi.js'
import { DisplayObjectWithCulling, AABB } from './types'

export interface SpatialHashOptions {
    size?: number
    xSize?: number
    ySize?: number
    simpleTest?: boolean
    dirtyTest?: boolean
}

export interface ContainerCullObject {
    static?: boolean
}

export interface ContainerWithCulling extends PIXI.Container {
    cull?: ContainerCullObject
}

const SpatialHashDefaultOptions: SpatialHashOptions = {
    xSize: 1000,
    ySize: 1000,
    simpleTest: true,
    dirtyTest: true,
}

class SpatialHash {
    protected xSize: number
    protected ySize: number
    protected simpleTest: boolean
    protected dirtyTest: boolean
    protected width: number
    protected height: number
    protected hash: object
    protected containers: (ContainerWithCulling | DisplayObjectWithCulling[])[]
    protected elements: DisplayObjectWithCulling[]
    protected objects: DisplayObjectWithCulling[]
    // protected hash: <string,

    /**
     * creates a spatial-hash cull
     * Note, options.dirtyTest defaults to false. To greatly improve performance set to true and set
     * displayObject.dirty=true when the displayObject changes)
     *
     * @param {object} [options]
     * @param {number} [options.size=1000] cell size used to create hash (xSize = ySize)
     * @param {number} [options.xSize] horizontal cell size (leave undefined if size is set)
     * @param {number} [options.ySize] vertical cell size (leave undefined if size is set)
     * @param {boolean} [options.simpleTest=true] after finding visible buckets, iterates through items and tests individual bounds
     * @param {string} [options.dirtyTest=false] only update spatial hash for objects with object[options.dirtyTest]=true; this has a HUGE impact on performance
     */
    constructor(options?: SpatialHashOptions) {
        options = { ...SpatialHashDefaultOptions, ...options }
        if (options && typeof options.size !== 'undefined') {
            this.xSize = this.ySize = options.size
        }
        this.simpleTest = options.simpleTest
        this.dirtyTest = options.dirtyTest
        this.width = this.height = 0
        this.hash = {}
        this.objects = []
        this.containers = [[]]
        this.elements = this.containers[0] as DisplayObjectWithCulling[]
    }

    /**
     * add an object to be culled
     * side effect: adds object.spatialHashes to track existing hashes
     * @param {DisplayObjectWithCulling} object
     * @param {boolean} [staticObject] set to true if the object's position/size does not change
     * @return {DisplayObjectWithCulling} object
     */
    add(object: DisplayObjectWithCulling, staticObject?: boolean): DisplayObjectWithCulling {
        object.spatial = { hashes: [] }
        if (this.dirtyTest) {
            object.dirty = true
        }
        if (staticObject) {
            object.staticObject = true
        }
        this.updateObject(object)
        this.elements.push(object)
        return object
    }

    /**
     * remove an object added by add()
     * @param {*} object
     * @return {*} object
     */
    remove(object: DisplayObjectWithCulling): DisplayObjectWithCulling {
        this.elements.splice(this.elements.indexOf(object), 1)
        this.removeFromHash(object)
        return object
    }

    /**
     * add an array of objects to be culled
     * @param {PIXI.Container} container
     * @param {boolean} [staticObject] set to true if the objects in the container's position/size do not change
     * note: this only works with pixi v5.0.0rc2+ because it relies on the new container events childAdded and childRemoved
     */
    addContainer(container: PIXI.Container, staticObject?: boolean) {
        const added = (object: DisplayObjectWithCulling) => {
            object.spatial = { hashes: [] }
            this.updateObject(object)
        }

        const removed = (object: DisplayObjectWithCulling) => {
            this.removeFromHash(object)
        }

        for (const object of container.children) {
            (object as DisplayObjectWithCulling).spatial = { hashes: [] }
            this.updateObject(object as DisplayObjectWithCulling)
        }
        container.cull = {}
        this.containers.push(container)
        container.on('childAdded', added)
        container.on('childRemoved', removed)
        container.cull.added = added
        container.cull.removed = removed
        if (staticObject) {
            container.cull.static = true
        }
    }

    /**
     * remove an array added by addContainer()
     * @param {PIXI.Container} container
     * @return {PIXI.Container} container
     */
    removeContainer(container) {
        this.containers.splice(this.containers.indexOf(container), 1)
        container.children.forEach(object => this.removeFromHash(object))
        container.off('added', container.cull.added)
        container.off('removed', container.cull.removed)
        delete container.cull
        return container
    }

    /**
     * update the hashes and cull the items in the list
     * @param {AABB} AABB
     * @param {boolean} [skipUpdate] skip updating the hashes of all objects
     * @param {Function} [callback] callback for each item that is not culled - note, this function is called before setting `object.visible=true`
     * @return {number} number of buckets in results
     */
    cull(AABB, skipUpdate, callback) {
        if (!skipUpdate) {
            this.updateObjects()
        }
        this.invisible()
        let objects
        if (callback) {
            objects = this.queryCallbackAll(AABB, this.simpleTest, callback)
        } else {
            objects = this.query(AABB, this.simpleTest)
        }
        objects.forEach(object => object[this.visible] = true)
        return this.lastBuckets
    }

    /**
     * set all objects in hash to visible=false
     */
    invisible() {
        for (let container of this.containers) {
            container.children.forEach(object => object[this.visible] = false)
        }
    }

    /**
     * update the hashes for all objects
     * automatically called from update() when skipUpdate=false
     */
    updateObjects() {
        if (this.dirtyTest) {
            for (let object of this.objects) {
                if (object[this.dirty]) {
                    this.updateObject(object)
                    object[this.dirty] = false
                }
            }
            for (let container of this.containers) {
                for (let object of container.children) {
                    if (object[this.dirty]) {
                        this.updateObject(object)
                        object[this.dirty] = false
                    }
                }
            }
        } else {
            for (let container of this.containers) {
                if (!container.cull.static) {
                    container.children.forEach(object => this.updateObject(object))
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
    updateObject(object: DisplayObjectWithCulling) {
        let AABB: AABB
        const box = object.getLocalBounds()
        AABB = object.AABB = {
            x: object.x + (box.x - object.pivot.x) * object.scale.x,
            y: object.y + (box.y - object.pivot.y) * object.scale.y,
            width: box.width * object.scale.x,
            height: box.height * object.scale.y
        }

        let spatial = object.spatial
        if (!spatial) {
            spatial = object.spatial = { hashes: [] }
        }
        const { xStart, yStart, xEnd, yEnd } = this.getBounds(AABB)

        // only remove and insert if mapping has changed
        if (spatial.xStart !== xStart || spatial.yStart !== yStart || spatial.xEnd !== xEnd || spatial.yEnd !== yEnd) {
            if (spatial.hashes.length) {
                this.removeFromHash(object)
            }
            for (let y = yStart; y <= yEnd; y++) {
                for (let x = xStart; x <= xEnd; x++) {
                    const key = x + ',' + y
                    this.insert(object, key)
                    spatial.hashes.push(key)
                }
            }
            spatial.xStart = xStart
            spatial.yStart = yStart
            spatial.xEnd = xEnd
            spatial.yEnd = yEnd
        }
    }

    /**
     * returns an array of buckets with >= minimum of objects in each bucket
     * @param {number} [minimum=1]
     * @return {array} array of buckets
     */
    getBuckets(minimum = 1) {
        const hashes = []
        for (let key in this.hash) {
            const hash = this.hash[key]
            if (hash.length >= minimum) {
                hashes.push(hash)
            }
        }
        return hashes
    }

    /**
     * gets hash bounds
     * @param {AABB} AABB
     * @return {Bounds}
     * @private
     */
    getBounds(AABB) {
        let xStart = Math.floor(AABB.x / this.xSize)
        let yStart = Math.floor(AABB.y / this.ySize)
        let xEnd = Math.floor((AABB.x + AABB.width) / this.xSize)
        let yEnd = Math.floor((AABB.y + AABB.height) / this.ySize)
        return { xStart, yStart, xEnd, yEnd }
    }

    /**
     * insert object into the spatial hash
     * automatically called from updateObject()
     * @param {*} object
     * @param {string} key
     */
    insert(object, key) {
        if (!this.hash[key]) {
            this.hash[key] = [object]
        } else {
            this.hash[key].push(object)
        }
    }

    /**
     * removes object from the hash table
     * should be called when removing an object
     * automatically called from updateObject()
     * @param {object} object
     */
    removeFromHash(object) {
        const spatial = object[this.spatial]
        while (spatial.hashes.length) {
            const key = spatial.hashes.pop()
            const list = this.hash[key]
            list.splice(list.indexOf(object), 1)
        }
    }

    /**
     * get all neighbors that share the same hash as object
     * @param {*} object in the spatial hash
     * @return {Array} of objects that are in the same hash as object
     */
    neighbors(object) {
        let results = []
        object[this.spatial].hashes.forEach(key => results = results.concat(this.hash[key]))
        return results
    }

    /**
     * returns an array of objects contained within bounding box
     * @param {AABB} AABB bounding box to search
     * @param {boolean} [simpleTest=true] perform a simple bounds check of all items in the buckets
     * @return {object[]} search results
     */
    query(AABB, simpleTest) {
        simpleTest = typeof simpleTest !== 'undefined' ? simpleTest : true
        let buckets = 0
        let results = []
        const { xStart, yStart, xEnd, yEnd } = this.getBounds(AABB)
        for (let y = yStart; y <= yEnd; y++) {
            for (let x = xStart; x <= xEnd; x++) {
                const entry = this.hash[x + ',' + y]
                if (entry) {
                    if (simpleTest) {
                        for (let object of entry) {
                            const box = object[this.AABB]
                            if (box.x + box.width > AABB.x && box.x < AABB.x + AABB.width &&
                                box.y + box.height > AABB.y && box.y < AABB.y + AABB.height) {
                                results.push(object)
                            }
                        }
                    } else {
                        results = results.concat(entry)
                    }
                    buckets++
                }
            }
        }
        this.lastBuckets = buckets
        return results
    }

    /**
     * returns an array of objects contained within bounding box with a callback on each non-culled object
     * this function is different from queryCallback, which cancels the query when a callback returns true
     * @param {AABB} AABB bounding box to search
     * @param {boolean} [simpleTest=true] perform a simple bounds check of all items in the buckets
     * @param {Function} callback - function to run for each non-culled object
     * @return {object[]} search results
     */
    queryCallbackAll(AABB, simpleTest, callback) {
        simpleTest = typeof simpleTest !== 'undefined' ? simpleTest : true
        let buckets = 0
        let results = []
        const { xStart, yStart, xEnd, yEnd } = this.getBounds(AABB)
        for (let y = yStart; y <= yEnd; y++) {
            for (let x = xStart; x <= xEnd; x++) {
                const entry = this.hash[x + ',' + y]
                if (entry) {
                    if (simpleTest) {
                        for (let object of entry) {
                            const box = object[this.AABB]
                            if (box.x + box.width > AABB.x && box.x < AABB.x + AABB.width &&
                                box.y + box.height > AABB.y && box.y < AABB.y + AABB.height) {
                                results.push(object)
                                callback(object)
                            }
                        }
                    } else {
                        results = results.concat(entry)
                        for (const object of entry) {
                            callback(object)
                        }
                    }
                    buckets++
                }
            }
        }
        this.lastBuckets = buckets
        return results
    }

    /**
     * iterates through objects contained within bounding box
     * stops iterating if the callback returns true
     * @param {AABB} AABB bounding box to search
     * @param {function} callback
     * @param {boolean} [simpleTest=true] perform a simple bounds check of all items in the buckets
     * @return {boolean} true if callback returned early
     */
    queryCallback(AABB, callback, simpleTest) {
        simpleTest = typeof simpleTest !== 'undefined' ? simpleTest : true
        const { xStart, yStart, xEnd, yEnd } = this.getBounds(AABB)
        for (let y = yStart; y <= yEnd; y++) {
            for (let x = xStart; x <= xEnd; x++) {
                const entry = this.hash[x + ',' + y]
                if (entry) {
                    for (let i = 0; i < entry.length; i++) {
                        const object = entry[i]
                        if (simpleTest) {
                            const AABB = object.AABB
                            if (AABB.x + AABB.width > AABB.x && AABB.x < AABB.x + AABB.width &&
                                AABB.y + AABB.height > AABB.y && AABB.y < AABB.y + AABB.height) {
                                if (callback(object)) {
                                    return true
                                }
                            }
                        } else {
                            if (callback(object)) {
                                return true
                            }
                        }
                    }
                }
            }
        }
        return false
    }

    /**
     * get stats
     * @return {Stats}
     */
    stats() {
        let visible = 0, count = 0
        for (let list of this.containers) {
            for (let i = 0; i < list.children.length; i++) {
                const object = list.children[i]
                visible += object.visible ? 1 : 0
                count++
            }
        }
        return {
            total: count,
            visible,
            culled: count - visible
        }
    }

    /**
     * helper function to evaluate hash table
     * @return {number} the number of buckets in the hash table
     * */
    getNumberOfBuckets() {
        return Object.keys(this.hash).length
    }

    /**
     * helper function to evaluate hash table
     * @return {number} the average number of entries in each bucket
     */
    getAverageSize() {
        let total = 0
        for (let key in this.hash) {
            total += this.hash[key].length
        }
        return total / this.getBuckets().length
    }

    /**
     * helper function to evaluate the hash table
     * @return {number} the largest sized bucket
     */
    getLargest() {
        let largest = 0
        for (let key in this.hash) {
            if (this.hash[key].length > largest) {
                largest = this.hash[key].length
            }
        }
        return largest
    }

    /**
     * gets quadrant bounds
     * @return {Bounds}
     */
    getWorldBounds() {
        let xStart = Infinity, yStart = Infinity, xEnd = 0, yEnd = 0
        for (let key in this.hash) {
            const split = key.split(',')
            let x = parseInt(split[0])
            let y = parseInt(split[1])
            xStart = x < xStart ? x : xStart
            yStart = y < yStart ? y : yStart
            xEnd = x > xEnd ? x : xEnd
            yEnd = y > yEnd ? y : yEnd
        }
        return { xStart, yStart, xEnd, yEnd }
    }

    /**
     * helper function to evalute the hash table
     * @param {AABB} [AABB] bounding box to search or entire world
     * @return {number} sparseness percentage (i.e., buckets with at least 1 element divided by total possible buckets)
     */
    getSparseness(AABB) {
        let count = 0, total = 0
        const { xStart, yStart, xEnd, yEnd } = AABB ? this.getBounds(AABB) : this.getWorldBounds()
        for (let y = yStart; y < yEnd; y++) {
            for (let x = xStart; x < xEnd; x++) {
                count += (this.hash[x + ',' + y] ? 1 : 0)
                total++
            }
        }
        return count / total
    }
}

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

module.exports = SpatialHash