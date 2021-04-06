import * as PIXI from 'pixi.js'
import { Viewport } from 'pixi-viewport'
import random from 'yy-random'
import forkMe from 'fork-me-github'
import FPS from 'yy-fps'

import { Simple } from '../code'

function el(query: string, parentQuery?: string): HTMLElement {
    if (parentQuery) {
        return document.querySelector(parentQuery)
    } else {
        return document.querySelector(query)
    }
}

const START_X = -25000
const START_Y = -25000
const WIDTH = 50000
const HEIGHT = 50000
const DOTS = 10000
const DOTS_SIZE = 100

let application,
    viewport,
    dots: PIXI.Container,
    div,
    simple,
    hash,
    mode: 'simple' | 'hash' | 'none' = 'simple',
    stats,
    fps: FPS
//, _test

function ui() {
    fps = new FPS({ side: 'bottomLeft' })

    el('.buckets').style.display = mode === 'hash' ? 'block' : 'none'

    el('.choices').addEventListener('change', () => {
        mode = (el('input[name=cull-types]:checked', '.choices') as HTMLInputElement).value as 'simple' | 'hash' | 'none'
        if (mode === 'none') {
            for (const dot of dots.children) {
                dot.visible = true
            }
        }
        updateCull()
        div.buckets.style.display = mode === 'hash' ? 'block' : 'none'
        if (mode === 'hash') {
            el('.sparseness').innerHTML = Math.round(hash.getSparseness() * 100) + '%'
            el('.largest').innerHTML = hash.getLargest()
            el('.average').innerHTML = Math.round(hash.getAverageSize() * 100) / 100 + ''
            el('hash').style.display = 'block'
        } else {
            el('.hash').style.display = 'none'
        }
    })

    const simpleTest = el('.simple-test') as HTMLInputElement
    simpleTest.addEventListener('change', () => {
        hash.simpleTest = simpleTest.checked
        updateCull()
    })

    const dirtyTest = el('.dirty-test') as HTMLInputElement
    dirtyTest.addEventListener('change', () => {
        hash.dirtyTest = simple.dirtyTest = dirtyTest.checked
    })

    el('.instructions').style.opacity = '0';
    forkMe(null, { side: 'left' })
}

function pixi() {
    const view = el('.pixi') as HTMLCanvasElement
    application = new PIXI.Application({
        width: view.offsetWidth,
        height: view.offsetHeight,
        view,
        backgroundAlpha: 0
    })
    viewport = application.stage.addChild(new Viewport())
    viewport.drag().pinch().decelerate().wheel()
    viewport.resize(view.offsetWidth, view.offsetHeight, WIDTH, HEIGHT)
    viewport.fitWidth(5000)
    const ticker = PIXI.Ticker
    ticker.shared.add(update)
    // _test = _viewport.addChild(new PIXI.Graphics())

    window.addEventListener('resize', () => {
        // weird hack needed for flexbox to work correctly; probably a better way to do this
        application.renderer.resize(0, 0)

        viewport.resize(view.offsetWidth, view.offsetHeight)
        application.renderer.resize(view.offsetWidth, view.offsetHeight)
        viewport.dirty = true
    })
}

function createDots() {
    dots = viewport.addChild(new PIXI.Container())
    for (let i = 0; i < DOTS; i++) {
        const dot = dots.addChild(new PIXI.Sprite(PIXI.Texture.WHITE))
        dot.tint = random.color()
        dot.width = dot.height = DOTS_SIZE
        dot.position.set(random.range(START_X, WIDTH), random.range(START_Y, HEIGHT))
    }

    simple = new Simple()
    simple.addList(dots.children, true)
    // _hash = new Cull.SpatialHash()
    // _hash.addContainer(_dots, true)
}

function update() {
    if (viewport.dirty) {
        updateCull()
        viewport.dirty = false
    }
    fps.frame()
}

function updateCull() {
    switch (mode) {
        case 'simple':
            simple.cull(viewport.getVisibleBounds())
            stats = simple.stats()
            break

        // case 'hash':
        //     const visible = _div.visibleBuckets.innerHTML = _hash.cull(_viewport.getVisibleBounds())
        //     const total = _div.totalBuckets.innerHTML = _hash.getBuckets().length
        //     _div.culledBuckets.innerHTML = total - visible
        //     _stats = _hash.stats()
        //     break

        case 'none':
            stats = { visible: dots.children.length, culled: 0, total: dots.children.length }
            break
    }
    viewport.dirty = false
    el('.visible').innerHTML = stats.visible
    el('.culled').innerHTML = stats.culled
    el('.total').innerHTML = stats.total
}

window.onload = () => {
    pixi()
    createDots()
    ui()
    updateCull()
}