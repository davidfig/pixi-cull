import * as PIXI from 'pixi.js';
import { DisplayObjectWithCulling, AABB } from './types';
export interface SpatialHashOptions {
    size?: number;
    xSize?: number;
    ySize?: number;
    simpleTest?: boolean;
    dirtyTest?: boolean;
}
export interface ContainerCullObject {
    static?: boolean;
    added?: (object: DisplayObjectWithCulling) => void;
    removed?: (object: DisplayObjectWithCulling) => void;
}
export interface SpatialHashStats {
    buckets: number;
    total: number;
    visible: number;
    culled: number;
}
interface SpatialHashBounds {
    xStart: number;
    yStart: number;
    xEnd: number;
    yEnd: number;
}
export interface ContainerWithCulling extends PIXI.Container {
    cull?: ContainerCullObject;
}
export declare class SpatialHash {
    protected xSize: number;
    protected ySize: number;
    /** simpleTest toggle */
    simpleTest: boolean;
    /** dirtyTest toggle */
    dirtyTest: boolean;
    protected width: number;
    protected height: number;
    protected hash: object;
    /** array of PIXI.Containers added using addContainer()  */
    protected containers: ContainerWithCulling[];
    /** array of DisplayObjects added using add() */
    protected elements: DisplayObjectWithCulling[];
    protected objects: DisplayObjectWithCulling[];
    protected lastBuckets: number;
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
     * @param {string} [options.dirtyTest=false] only update spatial hash for objects with object.dirty=true; this has a HUGE impact on performance
     */
    constructor(options?: SpatialHashOptions);
    /**
     * add an object to be culled
     * side effect: adds object.spatialHashes to track existing hashes
     * @param {DisplayObjectWithCulling} object
     * @param {boolean} [staticObject] set to true if the object's position/size does not change
     * @return {DisplayObjectWithCulling} object
     */
    add(object: DisplayObjectWithCulling, staticObject?: boolean): DisplayObjectWithCulling;
    /**
     * remove an object added by add()
     * @param {*} object
     * @return {*} object
     */
    remove(object: DisplayObjectWithCulling): DisplayObjectWithCulling;
    /**
     * add an array of objects to be culled
     * @param {PIXI.Container} container
     * @param {boolean} [staticObject] set to true if the objects in the container's position/size do not change
     * note: this only works with pixi v5.0.0rc2+ because it relies on the new container events childAdded and childRemoved
     */
    addContainer(container: ContainerWithCulling, staticObject?: boolean): void;
    /**
     * remove an array added by addContainer()
     * @param {PIXI.Container} container
     * @return {PIXI.Container} container
     */
    removeContainer(container: ContainerWithCulling): ContainerWithCulling;
    /**
     * update the hashes and cull the items in the list
     * @param {AABB} AABB
     * @param {boolean} [skipUpdate] skip updating the hashes of all objects
     * @param {Function} [callback] callback for each item that is not culled - note, this function is called before setting `object.visible=true`
     * @return {number} number of buckets in results
     */
    cull(AABB: AABB, skipUpdate?: boolean, callback?: (object: DisplayObjectWithCulling) => boolean): number;
    /**
     * set all objects in hash to visible=false
     */
    invisible(): void;
    /**
     * update the hashes for all objects
     * automatically called from update() when skipUpdate=false
     */
    updateObjects(): void;
    /**
     * update the has of an object
     * automatically called from updateObjects()
     * @param {DisplayObjectWithCulling} object
     */
    updateObject(object: DisplayObjectWithCulling): void;
    /**
     * returns an array of buckets with >= minimum of objects in each bucket
     * @param {number} [minimum=1]
     * @return {array} array of buckets
     */
    getBuckets(minimum?: number): string[];
    /**
     * gets hash bounds
     * @param {AABB} AABB
     * @return {SpatialHashBounds}
     */
    protected getBounds(AABB: AABB): SpatialHashBounds;
    /**
     * insert object into the spatial hash
     * automatically called from updateObject()
     * @param {DisplayObjectWithCulling} object
     * @param {string} key
     */
    insert(object: DisplayObjectWithCulling, key: string): void;
    /**
     * removes object from the hash table
     * should be called when removing an object
     * automatically called from updateObject()
     * @param {object} object
     */
    removeFromHash(object: DisplayObjectWithCulling): void;
    /**
     * get all neighbors that share the same hash as object
     * @param {*} object in the spatial hash
     * @return {Array} of objects that are in the same hash as object
     */
    neighbors(object: DisplayObjectWithCulling): DisplayObjectWithCulling[];
    /**
     * returns an array of objects contained within bounding box
     * @param {AABB} AABB bounding box to search
     * @param {boolean} [simpleTest=true] perform a simple bounds check of all items in the buckets
     * @return {object[]} search results
     */
    query(AABB: AABB, simpleTest?: boolean): DisplayObjectWithCulling[];
    /**
     * returns an array of objects contained within bounding box with a callback on each non-culled object
     * this function is different from queryCallback, which cancels the query when a callback returns true
     *
     * @param {AABB} AABB bounding box to search
     * @param {boolean} [simpleTest=true] perform a simple bounds check of all items in the buckets
     * @param {Function} callback - function to run for each non-culled object
     * @return {object[]} search results
     */
    queryCallbackAll(AABB: AABB, simpleTest: boolean, callback: (object: DisplayObjectWithCulling) => boolean): DisplayObjectWithCulling[];
    /**
     * iterates through objects contained within bounding box
     * stops iterating if the callback returns true
     * @param {AABB} AABB bounding box to search
     * @param {function} callback
     * @param {boolean} [simpleTest=true] perform a simple bounds check of all items in the buckets
     * @return {boolean} true if callback returned early
     */
    queryCallback(AABB: AABB, callback: (object: DisplayObjectWithCulling) => boolean, simpleTest?: boolean): boolean;
    /**
     * Get stats
     * @return {SpatialHashStats}
     */
    stats(): SpatialHashStats;
    /**
     * helper function to evaluate hash table
     * @return {number} the number of buckets in the hash table
     * */
    getNumberOfBuckets(): number;
    /**
     * helper function to evaluate hash table
     * @return {number} the average number of entries in each bucket
     */
    getAverageSize(): number;
    /**
     * helper function to evaluate the hash table
     * @return {number} the largest sized bucket
     */
    getLargest(): number;
    /**
     * gets quadrant bounds
     * @return {SpatialHashBounds}
     */
    getWorldBounds(): SpatialHashBounds;
    /**
     * helper function to evaluate the hash table
     * @param {AABB} [AABB] bounding box to search or entire world
     * @return {number} sparseness percentage (i.e., buckets with at least 1 element divided by total possible buckets)
     */
    getSparseness(AABB?: AABB): number;
}
export {};
