import * as PIXI from 'pixi.js';
export interface AABB {
    x: number;
    y: number;
    width: number;
    height: number;
}
export interface DisplayObjectSpatial {
    xStart?: number;
    yStart?: number;
    xEnd?: number;
    yEnd?: number;
    hashes: string[];
}
export interface DisplayObjectWithCulling extends PIXI.DisplayObject {
    staticObject?: boolean;
    AABB?: AABB;
    dirty?: boolean;
    spatial?: DisplayObjectSpatial;
}
