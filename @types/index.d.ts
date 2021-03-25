import * as PIXI from 'pixi.js';

interface SimpleOptions {
    visible?: string;
    calculatePIXI?: boolean;
    dirtyTest?: boolean;
    AABB?: string;
}

interface SimpleBounds {
    x: number;
    y: number;
    width: number;
    height: number;
}

interface Stats {
    total: number;
    visible: number;
    culled: number;
}

export declare class Simple {
    visible: string;
    calculatePIXI: boolean;
    dirtyTest: boolean;
    AABB: string;
    protected lists: PIXI.DisplayObject[][];

    constructor(options?: SimpleOptions);
    addList(array: PIXI.DisplayObject[], staticObject?: boolean): PIXI.DisplayObject[];
    removeList(array: PIXI.DisplayObject[]): PIXI.DisplayObject[];
    add(object: PIXI.DisplayObject, staticObject?: boolean): PIXI.DisplayObject;
    remove(object: PIXI.DisplayObject): PIXI.DisplayObject;
    cull(bounds: SimpleBounds, skipUpdate?: boolean, callback?: Function): void;
    updateObjects(): void;
    updateObject(object: PIXI.DisplayObject): void;
    query(bounds: SimpleBounds): PIXI.DisplayObject[];
    queryCallback(bounds: SimpleBounds, callback: (object: PIXI.DisplayObject) => boolean): boolean;
    queryCallbackAll(bounds: SimpleBounds, callback: (object: PIXI.DisplayObject) => void): PIXI.DisplayObject[];
    stats(): Stats;
}

interface SpatialHashOptions {
    size?: number;
    xSize?: number;
    ySize?: number;
    type?: string;
    spatial?: string;
    calculatePixi?: boolean;
    visibleTest?: boolean;
    simpleTest?: boolean;
    dirtyTest?: boolean;
    visible?: string;
    dirty?: string;
}

interface AABB {
    x: number;
    y: number;
    width: number;
    height: number;
}

interface SpatialHashBounds {
    xStart: number;
    yStart: number;
    xEnd: number;
    yEnd: number;
}

export declare class SpatialHash {
    xSize: number;
    ySize: number;
    AABB: string;
    spatial: string;
    calculatePIXI: boolean;
    visibleText: boolean;
    simpleTest: boolean;
    dirtyTest: boolean;
    visible: string;
    dirty: string;
    width: number;
    height: number;
    hash: Record<string, PIXI.DisplayObject[]>;
    objects: PIXI.DisplayObject[];
    containers: PIXI.Container[];

    constructor(options?: SpatialHashOptions);
    add(object: PIXI.DisplayObject, staticObject?: boolean): void;
    remove(object: PIXI.DisplayObject): PIXI.DisplayObject;
    addContainer(container: PIXI.Container, staticObject?: boolean): void;
    removeContainer(container: PIXI.Container): PIXI.Container;
    cull(AABB: AABB, skipUpdate?: boolean): number;
    invisible(): void;
    updateObjects(): void;
    updateObject(object: PIXI.DisplayObject): void;
    getBuckets(minimum?: number): PIXI.DisplayObject;
    private getBounds(AABB: AABB): SpatialHashBounds;
    insert(object: PIXI.DisplayObject, key: string): void;
    removeFromHash(object: PIXI.DisplayObject): void;
    neighbors(object: PIXI.DisplayObject): PIXI.DisplayObject[];
    query(AABB: AABB, simpleTest?: boolean): PIXI.DisplayObject[];
    queryCallback(AABB: AABB, callback: (object: PIXI.DisplayObject) => boolean, simpleTest?: boolean): boolean;
    stats(): Stats;
    getNumberOfBuckets(): number;
    getAverageSize(): number;
    getLargest(): number;
    getWorldBounds(): SpatialHashBounds;
    getSparseness(AABB?: AABB): number;
}
