import test from 'node:test'
import assert from 'node:assert/strict'
import ts from 'typescript'
import { readFileSync } from 'node:fs'
const source = readFileSync(new URL('../src/lib/personCoverUV.ts', import.meta.url), 'utf8')
const code = ts.transpile(source.replace("import { computeCoverUV } from './coverUV'", 'const computeCoverUV = (...args) => ({ desktop: args })'), { module: ts.ModuleKind.ESNext })
const { computePersonCoverUV } = await import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`)

test('extending the mobile canvas preserves every portrait coordinate below its old boundary', () => {
  for (const aspect of [1600 / 1312, 4536 / 2700]) {
    const next = computePersonCoverUV(aspect, 390 / 653, true)
    const oldRepeat = aspect < 1.5 ? 0.9556 : 1.3167
    const oldOffset = aspect < 1.5 ? 0.00215 : -0.3748
    for (const width of [320, 390, 768, 1100]) {
      const scale = width / 390
      for (let y = 358; y <= 952; y += 2) {
        const oldUv = ((952 * scale - y * scale) / (594 * scale)) * oldRepeat + oldOffset
        const newUv = ((952 * scale - y * scale) / (653 * scale)) * next.repeatY + next.offsetY
        assert.ok(Math.abs(oldUv - newUv) < 1e-12)
      }
    }
    assert.equal(next.repeatX, 0.5145)
    assert.equal(next.offsetX, 0.2504)
  }
})

test('desktop still uses the existing cover calculation', () => {
  assert.deepEqual(computePersonCoverUV(1.68, 1.9, false), { desktop: [1.68, 1.9] })
})
