import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { kinescopeEmbedUrl, kinescopeVideos } from '../src/components/Cases/kinescopeVideos.ts'

test('confirmed review media use matching stable Kinescope IDs and share fallbacks', () => {
  assert.equal(Object.keys(kinescopeVideos).length, 4)
  for (const item of Object.values(kinescopeVideos)) {
    assert.ok(item.shareUrl.endsWith(`/v/${item.id}`))
    const url = new URL(kinescopeEmbedUrl(item.id))
    assert.equal(url.origin, 'https://kinescope.io')
    assert.equal(url.pathname, `/embed/${item.id}`)
    assert.equal(url.searchParams.get('preload'), '0')
  }
  assert.equal(kinescopeVideos['Даниэль 900$ за 7 дней, трейдинг, кейс.mp4'], undefined)
  assert.equal(kinescopeVideos['Егор 1200$ (студент 20 лет).mp4'], undefined)
  assert.equal(kinescopeVideos['Данила 30к, ии (полный кейс).mp4'], undefined)
})

test('embed URLs reject external URLs and malformed IDs', () => {
  for (const id of ['https://example.com/', 'x?autoplay=1', '', '../video']) assert.throws(() => kinescopeEmbedUrl(id))
})

test('new mentor videos precede their requested neighbouring courses', () => {
  const source = readFileSync(new URL('../src/components/Faculties/courses.tsx', import.meta.url), 'utf8')
  const ids = [...source.matchAll(/id: '([^']+)',\n\s+poster:/g)].map(match => match[1])
  assert.equal(ids[0], 'content-earnings')
  assert.equal(ids[1], 'ai')
  assert.equal(ids.indexOf('vk-advertising') + 1, ids.indexOf('telegram'))
  assert.ok(source.includes("id: '4140e1eb-6487-4b1e-8c0f-6d553739b038'"))
  assert.ok(source.includes("id: '798c7a08-4df8-410e-95dc-900543c6665c'"))
})
