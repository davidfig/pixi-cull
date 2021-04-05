import * as PIXI from 'pixi.js'
import { Viewport } from 'pixi-viewport'
import random from 'yy-random'
import forkMe from 'fork-me-github'
import FPS from 'yy-fps'

import { Simple } from '../code'

function el(query) {
    return document.querySelector(query)
}

const START_X = -25000
const START_Y = -25000
const WIDTH = 50000
const HEIGHT = 50000
const DOTS = 10000
const DOTS_SIZE = 100

let _application, _viewport, _dots, _div, _simple, _hash, _mode = 'simple', _stats, _fps //, _test

function ui() {
    _fps = new FPS({ side: 'bottomLeft' })
    // _div = {
    //     choices: document.getElementById('choices'),
    //     visible: document.getElementById('visible'),
    //     cull: document.getElementById('culled'),
    //     total: document.getElementById('total'),
    //     buckets: document.getElementById('buckets'),
    //     hash: document.getElementById('hash'),
    //     visibleBuckets: document.getElementById('visible-buckets'),
    //     culledBuckets: document.getElementById('culled-buckets'),
    //     totalBuckets: document.getElementById('total-buckets'),
    //     simpleTest: document.getElementById('simple-test'),
    //     dirtyTest: document.getElementById('dirty-test'),
    //     sparseness: document.getElementById('sparseness-buckets'),
    //     largest: document.getElementById('largest-bucket'),
    //     average: document.getElementById('average-bucket')
    // }

    // _div.buckets.style.display = _mode === 'hash' ? 'block' : 'none'

    // _div.choices.addEventListener('change', () => {
    //     _mode = _div.choices.querySelector('input[name=cull-types]:checked').value
    //     if (_mode === 'none') {
    //         for (let dot of _dots.children) {
    //             dot.visible = true
    //         }
    //     }
    //     updateCull()
    //     _div.buckets.style.display = _mode === 'hash' ? 'block' : 'none'
    //     if (_mode === 'hash') {
    //         _div.sparseness.innerHTML = Math.round(_hash.getSparseness() * 100) + '%'
    //         _div.largest.innerHTML = _hash.getLargest()
    //         _div.average.innerHTML = Math.round(_hash.getAverageSize() * 100) / 100
    //         _div.hash.style.display = 'block'
    //     } else {
    //         _div.hash.style.display = 'none'
    //     }
    // })

    // _div.simpleTest.addEventListener('change', () => {
    //     _hash.simpleTest = _div.simpleTest.checked
    //     updateCull()
    // })

    // _div.dirtyTest.addEventListener('change', () => {
    //     _hash.dirtyTest = _simple.dirtyTest = _div.dirtyTest.checked
    // })

    // document.querySelector('.instructions').style.opacity = 0;
    // forkMe(null, { side: 'left' })
}

function pixi() {
    // const view = document.querySelector('.pixi')
    // _application = new PIXI.Application({ width: view.offsetWidth - document.querySelector('.controls').offsetWidth, height: view.offsetHeight, view, backgroundAlpha: 0 })
    // _viewport = _application.stage.addChild(new Viewport())
    // _viewport.drag().pinch().decelerate().wheel()
    // _viewport.resize(view.offsetWidth, view.offsetHeight, WIDTH, HEIGHT)
    // _viewport.fitWidth(5000)
    // const ticker = PIXI.ticker || PIXI.Ticker
    // ticker.shared.add(update)
    // // _test = _viewport.addChild(new PIXI.Graphics())

    // window.addEventListener('resize', () => {
    //     // weird hack needed for flexbox to work correctly; probably a better way to do this
    //     _application.renderer.resize(0, 0)

    //     _viewport.resize(view.offsetWidth, view.offsetHeight)
    //     _application.renderer.resize(view.offsetWidth, view.offsetHeight)
    //     _viewport.dirty = true
    // })
}

function dots() {
    _dots = _viewport.addChild(new PIXI.Container())
    for (let i = 0; i < DOTS; i++) {
        const dot = _dots.addChild(new PIXI.Sprite(PIXI.Texture.WHITE))
        dot.tint = random.color()
        dot.width = dot.height = DOTS_SIZE
        dot.position.set(random.range(START_X, WIDTH), random.range(START_Y, HEIGHT))
    }

    _simple = new Simple()
    _simple.addList(_dots.children, true)
    // _hash = new Cull.SpatialHash()
    // _hash.addContainer(_dots, true)
}

function update() {
    if (_viewport.dirty) {
        updateCull()
        _viewport.dirty = false
    }
    _fps.frame()
}

function updateCull() {
    switch (_mode) {
    case 'simple':
        _simple.cull(_viewport.getVisibleBounds())
        _stats = _simple.stats()
        break

    case 'hash':
        const visible = _div.visibleBuckets.innerHTML = _hash.cull(_viewport.getVisibleBounds())
        const total = _div.totalBuckets.innerHTML = _hash.getBuckets().length
        _div.culledBuckets.innerHTML = total - visible
        _stats = _hash.stats()
        break

    case 'none':
        _stats = { visible: _dots.children.length, culled: 0, total: _dots.children.length }
        break
    }
    _viewport.dirty = false
    _div.visible.innerHTML = _stats.visible
    _div.cull.innerHTML = _stats.culled
    _div.total.innerHTML = _stats.total
}

window.onload = () => {
    pixi()
    dots()
    ui()
    // updateCull()
}