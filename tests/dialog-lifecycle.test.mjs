import test from 'node:test'
import assert from 'node:assert/strict'
import { activateDialog } from '../src/lib/useDialogLifecycle.ts'

function fixture() {
  const listeners = new Map()
  const handlers = new Map()
  const previous = { isConnected: true, focus() { document.activeElement = this } }
  const doc = { activeElement: previous, documentElement: { style: { overflow: 'auto' } },
    addEventListener(type, callback) {
      if (!handlers.has(type)) handlers.set(type, new Set())
      handlers.get(type).add(callback)
      listeners.set(type, event => { for (const handler of handlers.get(type)) handler(event) })
    },
    removeEventListener(type, callback) {
      handlers.get(type)?.delete(callback)
      if (handlers.get(type)?.size === 0) listeners.delete(type)
    },
  }
  globalThis.document = doc
  const button = { tabIndex: 0, getClientRects: () => [1], focus() { doc.activeElement = this } }
  const last = { ...button }
  const dialog = { contains: el => el === button || el === last || el === dialog,
    querySelectorAll: () => [button, last], focus() { doc.activeElement = this } }
  return { doc, dialog, button, last, previous, listeners }
}

test('locks scrolling, sets initial focus, traps forward/backward Tab and restores on cleanup', () => {
  const f = fixture()
  const cleanup = activateDialog(f.dialog, () => {}, f.button)
  assert.equal(f.doc.documentElement.style.overflow, 'hidden')
  assert.equal(f.doc.activeElement, f.button)
  let prevented = false
  f.doc.activeElement = f.last
  f.listeners.get('keydown')({ key: 'Tab', shiftKey: false, preventDefault() { prevented = true } })
  assert.equal(f.doc.activeElement, f.button)
  assert.equal(prevented, true)
  f.listeners.get('keydown')({ key: 'Tab', shiftKey: true, preventDefault() {} })
  assert.equal(f.doc.activeElement, f.last)
  cleanup()
  assert.equal(f.doc.activeElement, f.previous)
  assert.equal(f.doc.documentElement.style.overflow, 'auto')
  assert.equal(f.listeners.size, 0)
})

test('Escape closes once per key event and outside focus returns to the dialog', () => {
  const f = fixture()
  let closed = 0
  const cleanup = activateDialog(f.dialog, () => { closed++ })
  f.listeners.get('keydown')({ key: 'Escape', preventDefault() {} })
  assert.equal(closed, 1)
  f.doc.activeElement = f.previous
  f.listeners.get('focusin')({ target: f.previous })
  assert.equal(f.doc.activeElement, f.button)
  cleanup()
})

test('nested dialogs retain the lock until both close and Escape only reaches the top dialog', () => {
  const f = fixture()
  let parentCloses = 0
  const closeParent = activateDialog(f.dialog, () => { parentCloses++ })
  const child = { ...f.dialog }
  const closeChild = activateDialog(child, () => {})
  f.listeners.get('keydown')({ key: 'Escape', preventDefault() {} })
  assert.equal(parentCloses, 0)
  closeChild()
  assert.equal(f.doc.documentElement.style.overflow, 'hidden')
  f.listeners.get('keydown')({ key: 'Escape', preventDefault() {} })
  assert.equal(parentCloses, 1)
  closeParent()
  assert.equal(f.doc.documentElement.style.overflow, 'auto')
})

test('empty dialogs keep keyboard focus inside the dialog', () => {
  const f = fixture()
  f.dialog.querySelectorAll = () => []
  const cleanup = activateDialog(f.dialog, () => {})
  assert.equal(f.doc.activeElement, f.dialog)
  let prevented = false
  f.listeners.get('keydown')({ key: 'Tab', preventDefault() { prevented = true } })
  assert.equal(prevented, true)
  assert.equal(f.doc.activeElement, f.dialog)
  cleanup()
})


test('explicitly negative tab indices and hidden controls are excluded from the trap', () => {
  const f = fixture()
  const skipped = { ...f.button, tabIndex: -1 }
  const hidden = { ...f.button, getClientRects: () => [] }
  f.dialog.querySelectorAll = () => [skipped, hidden, f.button, f.last]
  const cleanup = activateDialog(f.dialog, () => {})
  assert.equal(f.doc.activeElement, f.button)
  cleanup()
})
