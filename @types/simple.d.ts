import { DisplayObjectWithCulling, AABB } from './types';
export interface SimpleOptions {
    visible?: string;
    dirtyTest?: boolean;
}
export interface SimpleStats {
    total: number;
    visible: number;
    culled: number;
}
declare type DisplayObjectWithCullingArray = DisplayObjectWithCulling[] & {
    staticObject?: boolean;
};
export declare class Simple {
    options: SimpleOptions;
    dirtyTest: boolean;
    protected lists: DisplayObjectWithCullingArray[];
    /**
     * Creates a simple cull
     * Note, options.dirtyTest defaults to false. Set to true for much better performance--this requires
     * additional work to ensure displayObject.dirty is set when objects change)
     *
     * @param {object} [options]
     * @param {string} [options.dirtyTest=false] - only update the AABB box for objects with object[options.dirtyTest]=true; this has a HUGE impact on performance
     */
    constructor(options?: SimpleOptions);
    /**
     * add an array of objects to be culled, eg: `simple.addList(container.children)`
     * @param {Array} array
     * @param {boolean} [staticObject] - set to true if the object's position/size does not change
     * @return {Array} array
     */
    addList(array: DisplayObjectWithCullingArray, staticObject?: boolean): object[];
    /**
     * remove an array added by addList()
     * @param {Array} array
     * @return {Array} array
     */
    removeList(array: DisplayObjectWithCullingArray): DisplayObjectWithCullingArray;
    /**
     * add an object to be culled
     * NOTE: for implementation, add and remove uses this.lists[0]
     *
     * @param {DisplayObjectWithCulling} object
     * @param {boolean} [staticObject] - set to true if the object's position/size does not change
     * @return {DisplayObjectWithCulling} object
     */
    add(object: DisplayObjectWithCulling, staticObject?: boolean): DisplayObjectWithCulling;
    /**
     * remove an object added by add()
     * NOTE: for implementation, add and remove uses this.lists[0]
     *
     * @param {DisplayObjectWithCulling} object
     * @return {DisplayObjectWithCulling} object
     */
    remove(object: DisplayObjectWithCulling): DisplayObjectWithCulling;
    /**
     * cull the items in the list by changing the object.visible
     * @param {AABB} bounds
     * @param {boolean} [skipUpdate] - skip updating the AABB bounding box of all objects
     */
    cull(bounds: AABB, skipUpdate?: boolean): void;
    /**
     * update the AABB for all objects
     * automatically called from update() when calculatePIXI=true and skipUpdate=false
     */
    updateObjects(): void;
    /**
     * update the has of an object
     * automatically called from updateObjects()
     * @param {DisplayObjectWithCulling} object
     */
    updateObject(object: DisplayObjectWithCulling): void;
    /**
     * returns an array of objects contained within bounding box
     * @param {AABB} bounds - bounding box to search
     * @return {DisplayObjectWithCulling[]} - search results
     */
    query(bounds: AABB): DisplayObjectWithCulling[];
    /**
     * iterates through objects contained within bounding box
     * stops iterating if the callback returns true
     * @param {AABB} bounds - bounding box to search
     * @param {function} callback
     * @return {boolean} - true if callback returned early
     */
    queryCallback(bounds: AABB, callback: (object: DisplayObjectWithCulling) => boolean): boolean;
    /**
     * get stats (only updated after update() is called)
     * @return {SimpleStats}
     */
    stats(): SimpleStats;
}
export {};
