import test from 'node:test'
import assert from 'node:assert/strict'
import ts from 'typescript'
import { readFile } from 'node:fs/promises'
const source = await readFile(new URL('./siteConfig.ts', import.meta.url), 'utf8')
const js = ts.transpile(source.replace('import.meta.env', '{}'), { module: ts.ModuleKind.ESNext })
const { createSiteConfig } = await import(`data:text/javascript;base64,${Buffer.from(js).toString('base64')}`)
test('missing integrations stay unavailable instead of inventing destinations', () => {
  const config = createSiteConfig({})
  assert.equal(config.leadEndpoint, undefined)
  assert.equal(config.checkout.legend, undefined)
  assert.equal(config.analytics.google, undefined)
})
test('only valid external URLs and analytics identifiers are enabled', () => {
  const config = createSiteConfig({ VITE_GETCOURSE_LEGEND_URL: 'javascript:alert(1)', VITE_GA_ID: 'bad', VITE_YANDEX_ID: 'abc', VITE_TELEGRAM_URL: 'https://t.me/legend', VITE_MEDIA_BASE_URL: '/media' })
  assert.equal(config.checkout.legend, undefined)
  assert.equal(config.analytics.google, undefined)
  assert.equal(config.analytics.yandex, undefined)
  assert.equal(config.socials.telegram, 'https://t.me/legend')
  assert.equal(config.mediaBaseUrl, '/media')
})
test('published checkout and analytics configuration is retained', () => {
  const config = createSiteConfig({ VITE_GETCOURSE_BASIC_URL: 'https://school.getcourse.ru/basic', VITE_GA_ID: 'G-ABC123', VITE_YANDEX_ID: '123456' })
  assert.equal(config.checkout.basic, 'https://school.getcourse.ru/basic')
  assert.equal(config.analytics.google, 'G-ABC123')
  assert.equal(config.analytics.yandex, '123456')
})
test('personal data consent has its own published document', () => {
  const config = createSiteConfig({ VITE_PRIVACY_URL: 'https://school.example/privacy', VITE_PERSONAL_DATA_URL: 'https://school.example/consent' })
  assert.equal(config.documents.personalData, 'https://school.example/consent')
  assert.notEqual(config.documents.personalData, config.documents.privacy)
})
test('new checklist contacts preserve the three distinct Telegram destinations', () => {
  const config = createSiteConfig({})
  assert.equal(config.contact.email, 'lukin.a2011@yandex.ru')
  assert.equal(config.contact.location, 'Москва / Россия')
  assert.equal(config.socials.whatsapp, 'https://wa.me/79934559287')
  assert.equal(config.socials.telegram, 'https://t.me/andrewlukin_tg')
  assert.equal(config.socials.directTelegram, 'https://t.me/theandrewlukin')
  assert.equal(config.contact.andrewUrl, 'https://t.me/m/DvdHAA44NjMy')
  assert.ok(config.license.url.endsWith('/106e3d18-b623-7243-d9af-9a571df66c73/'))
})

test('October 27 enrollment chats and four supplied legal documents remain distinct', () => {
  const config = createSiteConfig({})
  assert.equal(config.enrollment.legend, 'https://t.me/m/4VlmAiy-NDUy')
  assert.equal(config.enrollment.basic, 'https://t.me/m/DlFOK1NJYmRi')
  assert.notEqual(config.enrollment.legend, config.enrollment.basic)
  const urls = [config.documents.privacy, config.documents.personalData, config.documents.offer, config.documents.newsletter]
  assert.equal(new Set(urls).size, 4)
  assert.deepEqual(urls, ['#/documents/privacy', '#/documents/personal-data', '#/documents/offer', '#/documents/newsletter'])
})
