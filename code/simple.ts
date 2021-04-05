import * as PIXI from 'pixi.js'

export interface SimpleOptions {
    visible?: string
    calculatePixi?: boolean
    dirtyTest?: boolean
}

const defaultSimpleOptions = {
    visible: 'visible',
    calculatePixi: true,
    dirtyTest: false,
}

export interface AABB {
    x: number
    y: number
    width: number
    height: number
}

export interface DisplayObjectWithCulling extends PIXI.DisplayObject {
    staticObject?: boolean
    AABB?: AABB
    dirty?: boolean
}

interface SimpleStats {
    total: number
    visible: number
    culled: number
}

type DisplayObjectWithCullingArray = DisplayObjectWithCulling[] & { staticObject?: boolean }

export class Simple {
    public options: SimpleOptions
    public visible: string
    public calculatePIXI: boolean
    public dirtyTest: boolean
    protected lists: DisplayObjectWithCullingArray[]

    /**
     * Creates a simple cull
     * Note, options.dirtyTest defaults to false. Set to true for much better performance--this requires
     * additional work to ensure displayObject.dirty is set when objects change)
     *
     * @param {object} [options]
     * @param {boolean} [options.visible=visible] parameter of the object to set (usually visible or renderable)
     * @param {boolean} [options.calculatePIXI=true] calculate pixi.js bounding box automatically; if this is set to false then it uses object[options.AABB] for bounding box
     * @param {string} [options.dirtyTest=false] only update the AABB box for objects with object[options.dirtyTest]=true; this has a HUGE impact on performance
     */
    constructor(options: SimpleOptions = {}) {
        options = { ...defaultSimpleOptions, ...options }
        this.visible = options.visible
        this.calculatePIXI = options.calculatePixi
        this.dirtyTest = typeof options.dirtyTest !== 'undefined' ? options.dirtyTest : true
        this.lists = [[]]
    }

    /**
     * add an array of objects to be culled, eg: `simple.addList(container.children)`
     * @param {Array} array
     * @param {boolean} [staticObject] set to true if the object's position/size does not change
     * @return {Array} array
     */
    addList(array: DisplayObjectWithCullingArray, staticObject?: boolean): object[] {
        this.lists.push(array)
        if (staticObject) {
            array.staticObject = true
        }
        if (this.calculatePIXI && this.dirtyTest) {
            const length = array.length
            for (let i = 0; i < length; i++) {
                this.updateObject(array[i])
            }
        }
        return array
    }

    /**
     * remove an array added by addList()
     * @param {Array} array
     * @return {Array} array
     */
    removeList(array: DisplayObjectWithCullingArray): DisplayObjectWithCullingArray {
        this.lists.splice(this.lists.indexOf(array), 1)
        return array
    }

    /**
     * add an object to be culled
     * NOTE: for implementation, add and remove uses this.lists[0]
     *
     * @param {DisplayObjectWithCulling} object
     * @param {boolean} [staticObject] set to true if the object's position/size does not change
     * @return {DisplayObjectWithCulling} object
     */
    add(object: DisplayObjectWithCulling, staticObject?: boolean): DisplayObjectWithCulling {
        if (staticObject) {
            object.staticObject = true
        }
        if (this.calculatePIXI && (this.dirtyTest || staticObject)) {
            this.updateObject(object)
        }
        this.lists[0].push(object)
        return object
    }

    /**
     * remove an object added by add()
     * NOTE: for implementation, add and remove uses this.lists[0]
     *
     * @param {DisplayObjectWithCulling} object
     * @return {DisplayObjectWithCulling} object
     */
    remove(object: DisplayObjectWithCulling): DisplayObjectWithCulling {
        this.lists[0].splice(this.lists[0].indexOf(object), 1)
        return object
    }

    /**
     * cull the items in the list by changing the object.visible
     * @param {AABB} bounds
     * @param {boolean} [skipUpdate] skip updating the AABB bounding box of all objects
     */
    cull(bounds: AABB, skipUpdate?: boolean) {
        if (this.calculatePIXI && !skipUpdate) {
            this.updateObjects()
        }
        const visible = this.visible
        for (const list of this.lists) {
            const length = list.length
            for (let i = 0; i < length; i++) {
                const object = list[i]
                const box = object.AABB
                object[visible] =
                    box.x + box.width > bounds.x && box.x < bounds.x + bounds.width &&
                    box.y + box.height > bounds.y && box.y < bounds.y + bounds.height
            }
        }
    }

    /**
     * update the AABB for all objects
     * automatically called from update() when calculatePIXI=true and skipUpdate=false
     */
    updateObjects() {
        if (this.dirtyTest) {
            for (const list of this.lists) {
                if (!list.staticObject) {
                    const length = list.length
                    for (let i = 0; i < length; i++) {
                        const object = list[i]
                        if (!object.staticObject && object.dirty) {
                            this.updateObject(object)
                            object.dirty = false
                        }
                    }
                }
            }
        } else {
            for (const list of this.lists) {
                if (!list.staticObject) {
                    const length = list.length
                    for (let i = 0; i < length; i++) {
                        const object = list[i]
                        if (!object.staticObject) {
                            this.updateObject(object)
                        }
                    }
                }
            }
        }
    }

    /**
     * update the has of an object
     * automatically called from updateObjects()
     * @param {DisplayObjectWithCulling} object
     */
    updateObject(object: DisplayObjectWithCulling) {
        const box = object.getLocalBounds()
        object.AABB = object.AABB || { x: 0, y: 0, width: 0, height: 0 }
        object.AABB.x = object.x + (box.x - object.pivot.x) * object.scale.x
        object.AABB.y = object.y + (box.y - object.pivot.y) * object.scale.y
        object.AABB.width = box.width * object.scale.x
        object.AABB.height = box.height * object.scale.y
    }

    /**
     * returns an array of objects contained within bounding box
     * @param {AABB} bounds bounding box to search
     * @return {DisplayObjectWithCulling[]} search results
     */
    query(bounds: AABB): DisplayObjectWithCulling[] {
        let results = []
        for (let list of this.lists) {
            for (let object of list) {
                const box = object.AABB
                if (box.x + box.width > bounds.x && box.x - box.width < bounds.x + bounds.width &&
                    box.y + box.height > bounds.y && box.y - box.height < bounds.y + bounds.height) {
                    results.push(object)
                }
            }
        }
        return results
    }

    /**
     * iterates through objects contained within bounding box
     * stops iterating if the callback returns true
     * @param {AABB} bounds bounding box to search
     * @param {function} callback
     * @return {boolean} true if callback returned early
     */
    queryCallback(bounds: AABB, callback: (object: DisplayObjectWithCulling) => boolean): boolean {
        for (let list of this.lists) {
            for (let object of list) {
                const box = object.AABB
                if (box.x + box.width > bounds.x && box.x - box.width < bounds.x + bounds.width &&
                    box.y + box.height > bounds.y && box.y - box.height < bounds.y + bounds.height) {
                    if (callback(object)) {
                        return true
                    }
                }
            }
        }
        return false
    }

    /**
     * get stats (only updated after update() is called)
     * @return {SimpleStats}
     */
    stats(): SimpleStats {
        let visible = 0, count = 0
        for (let list of this.lists) {
            list.forEach(object => {
                visible += object.visible ? 1 : 0
                count++
            })
        }
        return { total: count, visible, culled: count - visible }
    }
}
