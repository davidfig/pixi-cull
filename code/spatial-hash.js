module.exports = class SpatialHash
{
    /**
     * @param {PIXI.DisplayObject[]} [list] of objects to cull
     * @param {object} [options]
     * @param {number} [options.size=1000] cell size used to create hash (xSize = ySize)
     * @param {number} [options.xSize] horizontal cell size
     * @param {number} [options.ySize] vertical cell size
     * @param {boolean} [options.calculatePIXI=true] calculate bounding box automatically
     * @param {boolean} [options.visible=visible] parameter of the object to set (usually visible or renderable)
     * @param {boolean} [options.simpleTest=true] iterate through visible buckets to check for bounds
     * @param {string} [options.dirtyTest] only update spatial hash for objects with object[options.dirtyTest]=true
     * @param {string} [options.AABB=AABB] object property that holds bounding box so that object[type] = { x: number, y: number, width: number, height: number }
     * @param {string} [options.spatial=spatial] object property that holds object's hash list
     */
    constructor(list, options)
    {
        options = options || {}
        this.xSize = options.xSize || options.size || 1000
        this.ySize = options.ySize || options.size || 1000
        this.AABB = options.type || 'AABB'
        this.spatial = options.spatial || 'spatial'
        this.calculatePIXI = typeof options.calculatePIXI !== 'undefined' ? options.calculatePIXI : true
        this.visibleText = typeof options.visibleTest !== 'undefined' ? options.visibleTest : true
        this.simpleTest = typeof options.simpleTest !== 'undefined' ? options.simpleTest : true
        this.dirtyTest = options.dirtyTest
        this.visible = options.visible || 'visible'
        this.width = this.height = 0
        this.hash = {}
        this.all = []
        if (Array.isArray(list))
        {
            list.forEach(object => this.insert(object))
        }
        else
        {
            this.insert(list)
        }
    }

    /**
     * inserts an object into the hash tree (also removes any existing spatialHashes)
     * side effect: adds object.spatialHashes to track existing hashes
     * @param {object} object
     */
    insert(object)
    {
        if (!object[this.spatial])
        {
            object[this.spatial] = { hashes: [] }
        }
        this.updateObject(object)
        this.all.push(object)
    }

    /**
     * update the hashes and cull the items in the list
     * @param {object} bounds
     * @param {number} bounds.x
     * @param {number} bounds.y
     * @param {number} bounds.width
     * @param {number} bounds.height
     * @return {Stats} bucket count (not sprites in buckets)
     */
    update(bounds)
    {
        this.updateObjects()
        this.all.forEach(object => object[this.visible] = false)
        const objects = this.query(bounds)
        if (this.simpleTest)
        {
            objects.forEach(object =>
            {
                const AABB = object.AABB
                object[this.visible] = AABB.x + AABB.width > bounds.x && AABB.x - AABB.width < bounds.x + bounds.width &&
                    AABB.y + AABB.height > bounds.y && AABB.y - AABB.height < bounds.y + bounds.height
            })
        }
        else
        {
            objects.forEach(object => object[this.visible] = true)
        }
        return this.lastBuckets
    }

    updateObjects()
    {
        if (this.dirtyTest)
        {
            this.all.forEach(object =>
            {
                if (object[this.dirtyTest])
                {
                    this.updateObject(object)
                }
            })
        }
        else
        {
            this.all.forEach(object => this.updateObject(object))
        }
    }

    updateObject(object)
    {
        let AABB
        if (this.calculatePIXI)
        {
            const box = object.getLocalBounds()
            AABB = object.AABB = {
                x: box.x * object.anchor.x + object.x,
                y: box.y * object.anchor.y + object.y,
                width: object.width,
                height: object.height
            }
        }
        else
        {
            AABB = object[this.AABB]
        }
        const spatial = object[this.spatial]
        let xStart = Math.floor(AABB.x / this.xSize)
        xStart = xStart < 0 ? 0 : xStart
        let yStart = Math.floor(AABB.y / this.ySize)
        yStart = yStart < 0 ? 0 : yStart
        let xEnd = Math.floor((AABB.x + AABB.width) / this.xSize)
        let yEnd = Math.floor((AABB.y + AABB.height) / this.ySize)

        // only remove and insert if mapping has changed
        if (spatial.xStart !== xStart || spatial.yStart !== yStart || spatial.xEnd !== xEnd || spatial.yEnd !== yEnd)
        {
            if (spatial.hashes.length)
            {
                this.remove(object)
            }
            for (let y = yStart; y <= yEnd; y++)
            {
                for (let x = xStart; x <= xEnd; x++)
                {
                    const key = x + ',' + y
                    if (!this.hash[key])
                    {
                        this.hash[key] = [object]
                    }
                    else
                    {
                        this.hash[key].push(object)
                    }
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
     * removes existing object from the hash table
     * @param {object} object
     */
    remove(object)
    {
        const spatial = object[this.spatial]
        while (spatial.hashes.length)
        {
            const entry = spatial.hashes.pop()
            if (entry.length === 1)
            {
                this.hash[entry.key] = null
            }
            else
            {
                entry.splice(entry.indexOf(object), 1)
            }
        }
        this.all.splice(this.all.indexOf(object), 1)
    }

    /**
     * returns an array of objects contained within bounding box
     * @param {object} AABB bounding box to search
     * @param {number} AABB.x
     * @param {number} AABB.y
     * @param {number} AABB.width
     * @param {number} AABB.height
     * @return {object[]} search results
     */
    query(AABB)
    {
        let buckets = 0
        let results = []
        let xStart = Math.floor(AABB.x / this.xSize)
        xStart = xStart < 0 ? 0 : xStart
        let yStart = Math.floor(AABB.y / this.ySize)
        yStart = yStart < 0 ? 0 : yStart
        let xEnd = Math.floor((AABB.x + AABB.width) / this.xSize)
        let yEnd = Math.floor((AABB.y + AABB.height) / this.ySize)
        for (let y = yStart; y <= yEnd; y++)
        {
            for (let x = xStart; x <= xEnd; x++)
            {
                const entry = this.hash[x + ',' + y]
                if (entry)
                {
                    results = results.concat(entry)
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
     * @param {object} AABB bounding box to search
     * @param {number} AABB.x
     * @param {number} AABB.y
     * @param {number} AABB.width
     * @param {number} AABB.height
     * @param {function} callback
     * @return {boolean} true if callback returned early
     */
    queryCallback(AABB, callback)
    {
        let xStart = Math.floor(AABB.x / this.xSize)
        xStart = xStart < 0 ? 0 : xStart
        let yStart = Math.floor(AABB.y / this.ySize)
        yStart = yStart < 0 ? 0 : yStart
        let xEnd = Math.floor((AABB.x + AABB.width) / this.xSize)
        xEnd = xEnd >= this.width ? this.width - 1 : xEnd
        let yEnd = Math.floor((AABB.y + AABB.height) / this.ySize)
        yEnd = yEnd >= this.height ? this.height - 1 : yEnd
        for (let y = yStart; y <= yEnd; y++)
        {
            for (let x = xStart; x <= xEnd; x++)
            {
                const entry = this.hash[x + ',' + y]
                if (entry)
                {
                    for (let i = 0; i < entry.length; i++)
                    {
                        if (callback(entry[i]))
                        {
                            return true
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
    stats()
    {
        let visible = 0
        this.all.forEach(object => visible += object.visible ? 1 : 0)

        return {
            total: this.all.length,
            visible,
            culled: this.all.length - visible
        }
    }

    /**
     * helper function to evaluate hash table
     * @return {number} the number of buckets in the hash table
     * */
    getBuckets()
    {
        return Object.keys(this.hash).length
    }

    /**
     * helper function to evaluate hash table
     * @return {number} the average number of entries in each bucket
     */
    getAverageSize()
    {
        let total = 0
        for (let key in this.hash)
        {
            total += this.hash[key].length
        }
        return total / this.getBuckets()
    }

    /**
     * helper function to evaluate the hash table
     * @return {number} the largest sized bucket
     */
    getLargest()
    {
        let largest = 0
        for (let key in this.hash)
        {
            if (this.hash[key].length > largest)
            {
                largest = this.hash[key].length
            }
        }
        return largest
    }

    /** helper function to evalute the hash table
     * @param {object} AABB bounding box to search
     * @param {number} AABB.x
     * @param {number} AABB.y
     * @param {number} AABB.width
     * @param {number} AABB.height
     * @return {number} sparseness percentage (i.e., buckets with at least 1 element divided by total possible buckets)
     */
    getSparseness(AABB)
    {
        let count = 0, total = 0
        let xStart = Math.floor(AABB.x / this.xSize)
        let yStart = Math.floor(AABB.y / this.ySize)
        let xEnd = Math.ceil((AABB.x + AABB.width) / this.xSize)
        let yEnd = Math.ceil((AABB.y + AABB.height) / this.ySize)
        for (let y = yStart; y < yEnd; y++)
        {
            for (let x = xStart; x < xEnd; x++)
            {
                count += (this.hash[x + ',' + y] ? 1 : 0)
                total++
            }
        }
        return count / total
    }
}

/**
 * @typedef {object} Stats
 * @property {number} total
 * @property {number} visible
 * @property {number} culled
 */