module.exports = class CullSimple
{
    /**
     * creates a simple cull
     * this sets the visibility
     * @param {PIXI.DisplayObject[]} [list] of objects to cull
     * @param {object} [options]
     * @param {boolean} [options.visible=visible] parameter of the object to set (usually visible or renderable)
     */
    constructor(list, options)
    {
        options = options || {}
        this.visible = options.visible || 'visible'
        /**
         * list of
         * @type {Array}
        */
        this.list = list || []
    }

    /**
     *
     * @param {(PIXI.DisplayObject|PIXI.DisplayObject[])} objects
     */
    add(objects)
    {
        if (Array.isArray(objects))
        {
            this.list = this.list.concat(objects)
        }
        else
        {
            this.list.push(objects)
        }
    }

    /**
     * object to remove
     * @param {PIXI.DisplayObject} object
     */
    remove(object)
    {
        const index = this.list.indexOf(object)
        if (index !== -1)
        {
            this.list.splice(index, 1)
        }
        return object
    }

    /**
     * cull the items in the list
     * @param {object} bounds
     * @param {number} bounds.x
     * @param {number} bounds.y
     * @param {number} bounds.width
     * @param {number} bounds.height
     */
    update(bounds)
    {
        for (let child of this.list)
        {
            const box = child.getLocalBounds()
            box.x = box.x * child.anchor.x + child.x
            box.y = box.y * child.anchor.y + child.y
            child[this.visible] = box.x + box.width > bounds.x && box.x - box.width < bounds.x + bounds.width &&
                box.y + box.height > bounds.y && box.y - box.height < bounds.y + bounds.height
        }
    }

    /**
     * get stats
     * @return {SimpleStats}
     */
    stats()
    {
        let visible = 0
        this.list.forEach(object => visible += object.visible ? 1 : 0)
        return { total: this.list.length, visible, culled: this.list.length - visible }
    }
}

/**
 * @typedef {object} SimpleStats
 * @property {number} total
 * @property {number} visible
 * @property {number} culled
 */