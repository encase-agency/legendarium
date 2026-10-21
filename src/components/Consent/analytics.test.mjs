import test from 'node:test'
import assert from 'node:assert/strict'
import ts from 'typescript'
import { readFile } from 'node:fs/promises'
const source = await readFile(new URL('./analytics.ts', import.meta.url), 'utf8')
async function harness(config) {
  const scripts = []
  globalThis.window = {}
  globalThis.document = {
    createElement: () => ({ dataset: {}, remove() { const index = scripts.indexOf(this); if (index >= 0) scripts.splice(index, 1) } }),
    head: { append: script => scripts.push(script) },
    querySelectorAll: () => [...scripts],
  }
  const js = ts.transpile(source.replace("import { siteConfig } from '../../lib/siteConfig'", `const siteConfig = ${JSON.stringify(config)}`), { module: ts.ModuleKind.ESNext })
  const module = await import(`data:text/javascript;base64,${Buffer.from(js + `\n// ${Math.random()}`).toString('base64')}`)
  return { ...module, scripts }
}
test('no analytics network request until start and no request for missing identifiers', async () => {
  const app = await harness({ analytics: {} })
  assert.equal(app.scripts.length, 0)
  app.startAnalytics()
  assert.equal(app.scripts.length, 0)
})
test('acceptance creates each tracker once and initializes official Yandex queue', async () => {
  const app = await harness({ analytics: { google: 'G-ABC', yandex: '123' } })
  assert.equal(app.scripts.length, 0)
  app.startAnalytics()
  app.startAnalytics()
  assert.equal(app.scripts.length, 2)
  app.scripts[1].onload()
  assert.equal(window.ym.l > 0, true)
  assert.equal(window.ym.a[0][0], 123)
  assert.equal(window.ym.a[0][1], 'init')
  assert.equal(window['ga-disable-G-ABC'], false)
  app.stopAnalytics()
  assert.equal(window['ga-disable-G-ABC'], true)
  assert.equal(window.ym.a.at(-1)[1], 'destruct')
  assert.equal(app.scripts.length, 0)
})
test('revocation guards pending script callback and later acceptance can start again', async () => {
  const app = await harness({ analytics: { yandex: '123' } })
  app.startAnalytics()
  const pending = app.scripts[0]
  app.stopAnalytics()
  const count = window.ym.a.length
  pending.onload()
  assert.equal(window.ym.a.length, count)
  app.startAnalytics()
  pending.onload()
  assert.equal(window.ym.a.length, count)
  app.scripts[0].onload()
  assert.equal(window.ym.a.at(-1)[1], 'init')
})
