import test from 'node:test'
import assert from 'node:assert/strict'
import { founderPhotoTransform } from '../src/lib/founderGeometry.ts'

// Preserve the existing cubic photo path before replacing layout writes with transforms.
function original(p, rect, viewport) {
  const e = 1 - (1 - p) ** 3
  const w = 150 + (rect.width - 150) * e
  const h = 150 * rect.height / rect.width + (rect.height - 150 * rect.height / rect.width) * e
  return {
    x: viewport.width / 2 + (rect.left + rect.width / 2 - viewport.width / 2) * e - w / 2,
    y: viewport.height / 2 + (rect.top + rect.height / 2 - viewport.height / 2) * e - h / 2,
    width: w, height: h,
  }
}

test('original photo path starts centered and finishes in its slot', () => {
  const rect = { left: 70, top: 180, width: 620, height: 640 }
  const viewport = { width: 1512, height: 900 }
  assert.deepEqual(original(1, rect, viewport), { x: 70, y: 180, width: 620, height: 640 })
  assert.equal(original(0, rect, viewport).x, (1512 - 150) / 2)
})

test('transform path preserves original geometry across scrolling and viewport sizes', () => {
  for (const width of [1200, 1512, 1920]) {
    const slot = { left: 70, documentTop: 2600, width: 620, height: 640 }
    for (let i = 0; i <= 100; i++) {
      const p = i / 100
      const viewport = { width, height: 900, scrollY: 1700 + i * 9 }
      const before = original(p, { ...slot, top: slot.documentTop - viewport.scrollY }, viewport)
      const after = founderPhotoTransform(p, slot, viewport)
      for (const [a, b] of [[before.x, after.x], [before.y, after.y], [before.width, slot.width * after.scale], [before.height, slot.height * after.scale]]) {
        assert.ok(Math.abs(a - b) < 0.000001)
      }
    }
  }
})
