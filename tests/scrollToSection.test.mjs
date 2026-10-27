import test from 'node:test'
import assert from 'node:assert/strict'
import { scrollToSection } from '../src/lib/scrollToSection.ts'

function setup({ pinned = false, reduced = false } = {}) {
  const calls = []
  const timers = new Map()
  const events = new Map()
  let nextId = 0
  globalThis.window = {
    scrollY: 100, innerHeight: 900,
    matchMedia: () => ({ matches: reduced }),
    scrollTo: value => calls.push(value),
    setTimeout: fn => { timers.set(++nextId, fn); return nextId },
    clearTimeout: id => timers.delete(id),
    addEventListener: (name, fn) => { if (!events.has(name)) events.set(name, new Set()); events.get(name).add(fn) },
    removeEventListener: (name, fn) => events.get(name)?.delete(fn),
  }
  const spacer = { classList: { contains: () => true }, getBoundingClientRect: () => ({ top: 400, height: 1200 }) }
  globalThis.document = { getElementById: id => id === 'missing' ? null : {
    parentElement: pinned ? spacer : null,
    getBoundingClientRect: () => ({ top: 300 - window.scrollY, height: 600 }),
  } }
  return { calls, timers, events, emit: name => [...(events.get(name) ?? [])].forEach(fn => fn()) }
}

test('preserves centering for short pricing sections', () => {
  const app = setup()
  scrollToSection('pricing')
  assert.equal(app.calls[0].top, 160)
})

test('preserves the pin spacer target and caller offset', () => {
  const app = setup({ pinned: true })
  scrollToSection('directions', 20)
  assert.equal(app.calls[0].top, 520)
})

test('uses native smooth scrolling and respects reduced motion', () => {
  let app = setup()
  scrollToSection('pricing')
  assert.equal(app.calls[0].behavior, 'smooth')
  app = setup({ reduced: true })
  scrollToSection('pricing')
  assert.equal(app.calls[0].behavior, 'instant')
})

test('waits for scrolling to settle and cancels corrections after manual input', () => {
  const app = setup()
  scrollToSection('pricing')
  app.emit('scroll')
  assert.equal(app.calls.length, 1)
  app.emit('wheel')
  assert.equal(app.timers.size, 0)
  assert.equal(app.events.get('scroll').size, 0)
})

test('a new target cancels the previous correction and missing targets do not scroll', () => {
  const app = setup()
  scrollToSection('pricing')
  scrollToSection('hero')
  assert.equal(app.timers.size, 2)
  scrollToSection('missing')
  assert.equal(app.calls.length, 2)
  assert.equal(app.timers.size, 0)
})
