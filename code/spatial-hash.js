class SpatialHash
{
    /**
     * @param {object} [options]
     * @param {number} [size=1000] cell size used to create hash (xSize = ySize)
     * @param {number} [xSize] horizontal cell size
     * @param {number} [ySize] vertical cell size
     * @param {string} [AABB=AABB] object property that holds bounding box so that object[type] = { x: number, y: number, width: number, height: number }
     * @param {string} [spatial=spatial] object property that holds object's hash list
     * @param {number} [width=Infinity] maximum number of cells in the x direction
     * @param {number} [height=Infinity] maximum number of cells in the y direction
     */
    constructor(options)
    {
        options = options || {}
        this.xSize = options.xSize || options.size || 1000
        this.ySize = options.ySize || options.size || 1000
        this.AABB = options.type || 'AABB'
        this.spatial = options.spatial || 'spatial'
        this.width = options.width || Infinity
        this.height = options.height || Infinity
        this.list = {}
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
        const AABB = object[this.AABB]
        const spatial = object[this.spatial]
        let xStart = Math.floor(AABB.x / this.xSize)
        xStart = xStart < 0 ? 0 : xStart
        let yStart = Math.floor(AABB.y / this.ySize)
        yStart = yStart < 0 ? 0 : yStart
        let xEnd = Math.floor((AABB.x + AABB.width) / this.xSize)
        xEnd = xEnd >= this.width ? this.width - 1 : xEnd
        let yEnd = Math.floor((AABB.y + AABB.height) / this.ySize)
        yEnd = yEnd >= this.height ? this.height - 1 : yEnd

        // only remove and insert if mapping has changed
        if (spatial.xStart !== xStart || spatial.yStart !== yStart || spatial.xEnd !== xEnd || spatial.yEnd !== yEnd)
        {
            if (spatial.maps.length)
            {
                this.remove(object)
            }
            for (let y = yStart; y <= yEnd; y++)
            {
                for (let x = xStart; x <= xEnd; x++)
                {
                    const key = x + ',' + y
                    if (!this.list[key])
                    {
                        this.list[key] = [object]
                    }
                    else
                    {
                        this.list[key].push(object)
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
            if (entry.list.length === 1)
            {
                this.list[entry.key] = null
            }
            else
            {
                entry.list.splice(entry.list.indexOf(object), 1)
            }
        }
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
        const results = []
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
                const entry = this.list[x + ',' + y]
                if (entry)
                {
                    results = results.concat(entry.list)
                }
            }
        }
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
                const entry = this.list[x + ',' + y]
                if (entry)
                {
                    for (let i = 0; i < entry.list.length; i++)
                    {
                        if (callback(entry.list[i]))
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
     * helper function to evaluate hash table
     * @return {number} the number of buckets in the hash table
     * */
    getBuckets()
    {
        return Object.keys(this.list).length
    }

    /**
     * helper function to evaluate hash table
     * @return {number} the average number of entries in each bucket
     */
    getAverageSize()
    {
        let total = 0
        for (let key in this.list)
        {
            total += this.list[key].length
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
        for (let key in this.list)
        {
            if (this.list[key].length > largest)
            {
                largest = this.list[key].length
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
                count += (this.list[x + ',' + y] ? 1 : 0)
                total++
            }
        }
        return count / total
    }
}

module.exports = SpatialHash