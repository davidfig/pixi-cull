const PIXI = require('pixi.js')
const Viewport = require('pixi-viewport')

let _application, _viewport

function pixi()
{
    _application = new PIXI.Application()
    _application.view.style.width = '100vw'
    _application.view.style.height = '100vh'
}

pixi()