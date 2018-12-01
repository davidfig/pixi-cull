module.exports = {
    Simple: require('./simple'),
    SpatialHash: require('./spatial-hash')
}

if (PIXI)
{
    PIXI.extras.Cull = {
        Simple: require('./simple'),
        SpatialHash: require('./spatial-hash')
    }
}