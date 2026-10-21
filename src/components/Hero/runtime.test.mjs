import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import ts from 'typescript'
import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)

function loadTs(path, resolve = require, globals = {}) {
  const source = readFileSync(new URL(path, import.meta.url), 'utf8')
  const code = ts.transpileModule(source, { fileName: path, compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } }).outputText
  const exports = {}
  new Function('exports', 'require', ...Object.keys(globals), code)(exports, resolve, ...Object.values(globals))
  return exports
}

test('intro honours motion preference and explicit skip parameters', () => {
  const source = readFileSync(new URL('../../lib/intro.ts', import.meta.url), 'utf8')
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText
  for (const [search, reduced, expected] of [['', true, true], ['?intro=0', false, true], ['?debug=1', false, true], ['', false, false]]) {
    const exports = {}
    new Function('exports', 'window', code)(exports, { location: { search }, matchMedia: () => ({ matches: reduced }) })
    assert.equal(exports.INTRO_SKIPPED, expected)
    assert.equal(exports.intro.person, expected ? 1 : 0)
  }
})

test('brush reports clean idle frames and visible pointer strokes', () => {
  const { ArrowBrush } = loadTs('./arrowBrush.ts')
  const brush = new ArrowBrush()
  const frame = { w: 1000, h: 600, dpr: 1, margin: 100 }
  assert.equal(brush.hasVisibleStroke(), false)
  brush.step(16, [{ x: 100, y: 100 }, { x: 200, y: 100 }], frame, false)
  assert.equal(brush.hasVisibleStroke(), true)
  for (let n = 0; n < 1000; n++) brush.step(16, [], frame, false)
  assert.equal(brush.hasVisibleStroke(), false)
})

test('mask texture is reused at unchanged dimensions and replaced/disposed after resize', () => {
  const { createMaskTexture, resizeMaskTexture } = loadTs('./maskTexture.ts')
  const canvas = { width: 1, height: 1 }
  const initial = createMaskTexture(canvas)
  let disposed = 0
  initial.addEventListener('dispose', () => disposed++)
  assert.equal(resizeMaskTexture(initial, 1, 1), initial)
  assert.equal(disposed, 0)
  const resized = resizeMaskTexture(initial, 1512, 908)
  assert.notEqual(resized, initial)
  assert.equal(resized.image, canvas)
  assert.equal(canvas.width, 1512)
  assert.equal(canvas.height, 908)
  assert.equal(disposed, 1)
  assert.equal(resizeMaskTexture(resized, 1512, 908), resized)
  resized.dispose()
})

test('stalled intro releases UI once at its deadline and cleans up StrictMode timers', () => {
  const makeStyle = () => ({ opacity: '', transform: '', removeProperty(key) { this[key] = '' } })
  const ui = [{ style: makeStyle() }]
  const elements = Array.from({ length: 6 }, () => ({ style: makeStyle() }))
  elements[2].children = Array.from({ length: 5 }, () => ({ style: makeStyle() }))
  const timers = new Map()
  let nextTimer = 0
  let effect
  let done = 0
  let errors = 0
  let ref = 0
  const intro = { person: 0 }
  const gsap = { set(target, values) {
    if (typeof target === 'string') Object.assign(ui[0].style, { opacity: String(values.opacity), transform: 'translateY(48px)' })
  } }
  const { Loader } = loadTs('./Loader.tsx', (id) => {
    if (id === 'react') return {
      useRef: (value) => ({ current: ref++ < 6 ? elements[ref - 1] : value }),
      useEffect: (callback) => { effect = callback },
    }
    if (id === 'gsap') return { __esModule: true, default: gsap }
    if (id.endsWith('/intro')) return { intro }
    if (id.endsWith('/asset')) return { asset: (path) => path }
    if (id.endsWith('.css')) return {}
    return require(id)
  }, {
    document: { querySelectorAll: () => ui, fonts: { load: () => new Promise(() => {}) } },
    setTimeout: (callback, ms) => { timers.set(++nextTimer, { callback, ms }); return nextTimer },
    clearTimeout: (id) => timers.delete(id),
    console: { error: () => errors++ },
  })
  Loader({ onDone: () => done++ })
  const firstCleanup = effect()
  assert.equal(ui[0].style.opacity, '0')
  firstCleanup()
  assert.equal(timers.size, 0)
  assert.equal(ui[0].style.opacity, '')
  const cleanup = effect()
  const deadline = [...timers.values()].find(({ ms }) => ms === 4500)
  deadline.callback()
  deadline.callback()
  assert.equal(done, 1)
  assert.equal(intro.person, 1)
  assert.equal(ui[0].style.opacity, '')
  assert.equal(ui[0].style.transform, '')
  assert.equal(elements[0].style.display, 'none')
  assert.equal(errors, 1)
  assert.equal(timers.size, 0)
  cleanup()
})
