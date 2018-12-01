const PIXI = require('pixi.js')
const Viewport = require('pixi-viewport')
const Random = require('yy-random')
const forkMe = require('fork-me-github')

const Cull = require('../code/')

let _application, _viewport, _dots, _div, _simple, _hash, _mode = 'simple', _stats //, _test

const WIDTH = 50000
const HEIGHT = 50000
const DOTS = 10000
const DOTS_SIZE = 40

function ui()
{
    _div = {
        choices: document.getElementById('choices'),
        visible: document.getElementById('visible'),
        cull: document.getElementById('culled'),
        total: document.getElementById('total'),
        buckets: document.getElementById('buckets'),
        visibleBuckets: document.getElementById('visible-buckets'),
        culledBuckets: document.getElementById('culled-buckets'),
        totalBuckets: document.getElementById('total-buckets'),
        simpleTest: document.getElementById('simple-test')
    }

    _div.buckets.style.display = _mode === 'hash' ? 'block' : 'none'

    _div.choices.addEventListener('change', () =>
    {
        _mode = _div.choices.querySelector('input[name=cull-types]:checked').value
        updateCull()
        _div.buckets.style.display = _mode === 'hash' ? 'block' : 'none'
    })

    _div.simpleTest.addEventListener('change', () =>
    {
        _hash.simpleTest = _div.simpleTest.checked
        updateCull()
    })
    document.querySelector('.instructions').style.opacity = 0;
    forkMe(null, { side: 'left' })
}

function pixi()
{
    const view = document.querySelector('.pixi')
    _application = new PIXI.Application({ width: view.offsetWidth, height: view.offsetHeight, view, transparent: true })
    _viewport = _application.stage.addChild(new Viewport())
    _viewport.drag().pinch().decelerate().wheel()
    _viewport.resize(view.offsetWidth, view.offsetHeight, WIDTH, HEIGHT)
    _viewport.moveCenter(WIDTH / 2, HEIGHT / 2)
    PIXI.ticker.shared.add(update)
    // _test = _viewport.addChild(new PIXI.Graphics())
}

function dots()
{
    _dots = []
    for (let i = 0; i < DOTS; i++)
    {
        const dot = _viewport.addChild(new PIXI.Sprite(PIXI.Texture.WHITE))
        dot.tint = Random.color()
        dot.width = dot.height = DOTS_SIZE
        dot.position.set(Random.get(WIDTH), Random.get(HEIGHT))
        _dots.push(dot)
    }

    _simple = new Cull.Simple(_dots)
    _hash = new Cull.SpatialHash(_dots)
}

function update()
{
    if (_viewport.dirty)
    {
        updateCull()
        _viewport.dirty = false
    }
}

function updateCull()
{
    switch (_mode)
    {
        case 'simple':
            _simple.cull(_viewport.getVisibleBounds())
            _stats = _simple.stats()
            break

        case 'hash':
            const visible = _div.visibleBuckets.innerHTML = _hash.cull(_viewport.getVisibleBounds())
            const buckets = _div.culledBuckets.innerHTML = _hash.getBuckets() - visible
            _div.totalBuckets.innerHTML = buckets
            _stats = _hash.stats()
            break
    }
    _viewport.dirty = false
    _div.visible.innerHTML = _stats.visible
    _div.cull.innerHTML = _stats.culled
    _div.total.innerHTML = _stats.total
}

window.onload = () =>
{
    pixi()
    dots()
    ui()
    updateCull()
}