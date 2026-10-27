import test from 'node:test'
import assert from 'node:assert/strict'
import { CONSENT_KEY, NECESSARY_ONLY, readCookieConsent, saveCookieConsent, canReloadAfterRevocation } from '../src/components/Consent/preferences.ts'

function storage(value = null) {
  return { value, getItem(key) { assert.equal(key, CONSENT_KEY); return this.value }, setItem(key, next) { assert.equal(key, CONSENT_KEY); this.value = next } }
}

test('cookie categories default to necessary only and consent expires after twelve months', () => {
  const now = Date.UTC(2026, 9, 27, 12)
  const target = storage()
  assert.equal(readCookieConsent(target, now), null)
  const choice = saveCookieConsent(target, NECESSARY_ONLY, now)
  assert.deepEqual(choice, { version: 2, necessary: true, analytics: false, marketing: false, expiresAt: Date.UTC(2027, 9, 27, 12) })
  assert.deepEqual(readCookieConsent(target, now), choice)
  assert.deepEqual(readCookieConsent(target, choice.expiresAt - 1), choice)
  assert.equal(readCookieConsent(target, choice.expiresAt), null)
})

test('malformed, old or incomplete consent never enables optional categories', () => {
  const now = 1000
  for (const value of ['accepted', '{}', 'null', '{', JSON.stringify({ version: 1, necessary: true, analytics: true, marketing: true, expiresAt: 2000 }), JSON.stringify({ version: 2, necessary: false, analytics: true, marketing: false, expiresAt: 2000 }), JSON.stringify({ version: 2, necessary: true, analytics: 'true', marketing: false, expiresAt: 2000 }), JSON.stringify({ version: 2, necessary: true, analytics: true, expiresAt: 2000 })]) assert.equal(readCookieConsent(storage(value), now), null)
})

test('storage failures keep a valid in-memory choice without enabling consent from unreadable storage', () => {
  const blocked = { getItem() { throw new Error('blocked') }, setItem() { throw new Error('blocked') } }
  assert.equal(readCookieConsent(blocked), null)
  assert.deepEqual(saveCookieConsent(blocked, { necessary: true, analytics: false, marketing: true }, 1000), { version: 2, necessary: true, analytics: false, marketing: true, expiresAt: 31536001000 })
})

test('failed revocation write clears old acceptance before any reload', () => {
  const now = 1000
  const target = storage()
  saveCookieConsent(target, { necessary: true, analytics: true, marketing: false }, now)
  target.setItem = () => { throw new Error('quota') }
  target.removeItem = () => { target.value = null }
  const choice = saveCookieConsent(target, NECESSARY_ONLY, now)
  assert.equal(choice.analytics, false)
  assert.equal(canReloadAfterRevocation(target, now), true)
  assert.equal(readCookieConsent(target, now), null)
})

test('reloading is forbidden when stale acceptance cannot be cleared or storage cannot be read', () => {
  const now = 1000
  const target = storage()
  saveCookieConsent(target, { necessary: true, analytics: true, marketing: false }, now)
  target.setItem = () => { throw new Error('blocked') }
  target.removeItem = () => { throw new Error('blocked') }
  assert.equal(saveCookieConsent(target, NECESSARY_ONLY, now).analytics, false)
  assert.equal(canReloadAfterRevocation(target, now), false)
  assert.equal(readCookieConsent(target, now).analytics, true)
  target.getItem = () => { throw new Error('blocked') }
  assert.equal(canReloadAfterRevocation(target, now), false)
})
