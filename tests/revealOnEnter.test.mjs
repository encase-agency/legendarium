import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import ts from 'typescript'

function setup({ reduced = false, observerAvailable = true } = {}) {
  let callback
  let plays = 0
  let kills = 0
  let disconnects = 0
  let hidden = false
  const element = { style: { opacity: '0.8' } }
  const window = { matchMedia: () => ({ matches: reduced }) }
  class Observer {
    constructor(cb) { callback = cb }
    observe(target) { assert.equal(target, element) }
    disconnect() { disconnects++ }
  }
  if (observerAvailable) window.IntersectionObserver = Observer
  const gsap = { fromTo(target) { hidden = true; target.style.opacity = '0'; return { play() { plays++ }, kill() { kills++ } } } }
  const code = ts.transpileModule(readFileSync(new URL('../src/lib/revealOnEnter.ts', import.meta.url), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText
  const exports = {}
  new Function('exports', 'require', 'window', 'IntersectionObserver', code)(exports, () => ({ __esModule: true, default: gsap }), window, Observer)
  return { ...exports, element, get callback() { return callback }, stats: () => ({ plays, kills, disconnects, hidden }) }
}

test('text reveal waits for its actual viewport entry, not elapsed page time or another section', () => {
  const fixture = setup()
  const cleanup = fixture.revealOnEnter(fixture.element)
  fixture.callback([{ target: fixture.element, isIntersecting: false }])
  fixture.callback([{ target: {}, isIntersecting: true }])
  assert.equal(fixture.stats().plays, 0)
  fixture.callback([{ target: fixture.element, isIntersecting: true }])
  fixture.callback([{ target: fixture.element, isIntersecting: true }])
  assert.equal(fixture.stats().plays, 1)
  assert.equal(fixture.stats().disconnects, 1)
  cleanup()
  assert.equal(fixture.stats().kills, 1)
  assert.equal(fixture.element.style.opacity, '0.8')
})

test('reduced motion and missing observer keep the text visible', () => {
  for (const options of [{ reduced: true }, { observerAvailable: false }]) {
    const fixture = setup(options)
    fixture.revealOnEnter(fixture.element)()
    assert.equal(fixture.stats().hidden, false)
    assert.equal(fixture.element.style.opacity, '0.8')
  }
})
