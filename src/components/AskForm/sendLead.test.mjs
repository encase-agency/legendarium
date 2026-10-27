import test from 'node:test'
import assert from 'node:assert/strict'
import ts from 'typescript'
import { readFile } from 'node:fs/promises'
const source = await readFile(new URL('./sendLead.ts', import.meta.url), 'utf8')
const js = ts.transpile(source, { module: ts.ModuleKind.ESNext })
const { sendLead } = await import(`data:text/javascript;base64,${Buffer.from(js).toString('base64')}`)
test('lead sends the agreed payload and abort signal', async () => {
  const signal = new AbortController().signal
  let request
  const original = globalThis.fetch
  globalThis.fetch = async (...args) => { request = args; return new Response(null, { status: 204 }) }
  try {
    await sendLead('https://example.org/lead', 'Иван', '@ivan', signal)
    assert.equal(request[0], 'https://example.org/lead')
    assert.equal(request[1].signal, signal)
    assert.deepEqual(JSON.parse(request[1].body), { name: 'Иван', telegram: '@ivan', source: 'ask-form' })
  } finally { globalThis.fetch = original }
})
test('HTTP failures cannot become success', async () => {
  const original = globalThis.fetch
  globalThis.fetch = async () => new Response(null, { status: 503 })
  try { await assert.rejects(sendLead('https://example.org/lead', 'Иван', '@ivan', new AbortController().signal), /503/) }
  finally { globalThis.fetch = original }
})
test('aborted requests cannot become success even if a transport resolves', async () => {
  const original = globalThis.fetch
  const controller = new AbortController()
  globalThis.fetch = async () => { controller.abort(); return new Response(null, { status: 200 }) }
  try { await assert.rejects(sendLead('https://example.org/lead', 'Иван', '@ivan', controller.signal), { name: 'AbortError' }) }
  finally { globalThis.fetch = original }
})
