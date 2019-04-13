const PIXI = window.PIXI = require('pixi.js')
const Viewport = require('pixi-viewport')
const Random = require('yy-random')
const forkMe = require('fork-me-github')
const FPS = require('yy-fps')
const Edit = require('easyedit')

const Cull = require('../code')

let _application, _viewport, _dots, _simple, _hash, _mode = 'simple', _stats, _fps, _animate, _marks

const START_X = -25000
const START_Y = -25000
const WIDTH = 50000
const HEIGHT = 50000
let DOTS = 10000
const DOTS_SIZE = 100

function el(id)
{
    return document.getElementById(id)
}

function ui()
{
    _fps = new FPS({ side: 'bottomleft' })
    const total = new Edit(el('total'))
    total.on('success', value => {
        _simple.destroy()
        _hash.destroy()
        DOTS = isNaN(parseInt(value)) ? 10000 : parseInt(value)
        _viewport.removeChild(_dots)
        dots()
    })
    el('buckets').style.display = _mode === 'hash' ? 'block' : 'none'

    el('choices').addEventListener('change', () =>
    {
        _mode = el('choices').querySelector('input[name=cull-types]:checked').value
        if (_mode === 'none')
        {
            for (let dot of _dots.children)
            {
                dot.visible = true
            }
        }
        updateCull()
        el('buckets').style.display = _mode === 'hash' ? 'block' : 'none'
        if (_mode === 'hash')
        {
            el('sparseness-buckets').innerHTML = Math.round(_hash.getSparseness() * 100) + '%'
            el('largest-bucket').innerHTML = _hash.getLargest()
            el('average-bucket').innerHTML = Math.round(_hash.getAverageSize() * 100) / 100
            el('hash').style.display = 'block'
        }
        else
        {
            el('hash').style.display = 'none'
        }
    })

    el('simple-test').addEventListener('change', () =>
    {
        _hash.simpleTest = el('simple-test').checked
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
    _viewport.fitWidth(5000)
    const ticker = PIXI.ticker || PIXI.Ticker
    ticker.shared.add(update)
    _marks = _viewport.addChild(new PIXI.Graphics())
}

function dots()
{
    _dots = _viewport.addChild(new PIXI.Container())
    const speed = Math.min(window.innerWidth, window.innerHeight) * 0.01
    for (let i = 0; i < DOTS; i++)
    {
        const dot = _dots.addChild(new PIXI.Sprite(PIXI.Texture.WHITE))
        dot.velocity = { x: Random.range(-speed, speed), y: Random.range(-speed, speed) }
        dot.tint = Random.color()
        dot.width = dot.height = DOTS_SIZE
        dot.position.set(Random.range(START_X, WIDTH), Random.range(START_Y, HEIGHT))
    }
    _simple = new Cull.Simple({ dirtyTest: false })
    _simple.addList(_dots.children)
    _hash = new Cull.SpatialHash({ dirtyTest: false, size: 500 })
    _hash.addContainer(_dots)
}

function update()
{
    if (true)
    {
        for (let dot of _dots.children)
        {
            dot.x += dot.velocity.x
            dot.y += dot.velocity.y
        }
        updateCull()
    }
    else
    {
        if (_viewport.dirty)
        {
            updateCull()
            _viewport.dirty = false
        }
    }
    _fps.frame()
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
            const visible = el('visible-buckets').innerHTML = _hash.cull(_viewport.getVisibleBounds())
            const total = el('total-buckets').innerHTML = _hash.getBuckets().length
            el('culled-buckets').innerHTML = total - visible
            _stats = _hash.stats()
            break

        case 'none':
            _stats = { visible: _dots.children.length, culled: 0, total: _dots.children.length }
            break
    }
    _viewport.dirty = false
    el('visible').innerHTML = _stats.visible
    el('culled').innerHTML = _stats.culled
    el('total').innerHTML = _stats.total
}

window.onload = () =>
{
    pixi()
    dots()
    ui()
    updateCull()
}