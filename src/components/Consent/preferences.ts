export const CONSENT_KEY = 'legendarium.cookie-consent.v2'
export const CONSENT_SETTINGS_EVENT = 'legendarium:cookie-settings'
export type CookieCategories = { necessary: true; analytics: boolean; marketing: boolean }
export type CookieConsent = CookieCategories & { version: 2; expiresAt: number }
export const NECESSARY_ONLY: CookieCategories = { necessary: true, analytics: false, marketing: false }

type ConsentStorage = Pick<Storage, 'getItem' | 'setItem'> & Partial<Pick<Storage, 'removeItem'>>

export function readCookieConsent(storage: ConsentStorage, now = Date.now()): CookieConsent | null {
  try {
    const value = JSON.parse(storage.getItem(CONSENT_KEY) ?? 'null') as Partial<CookieConsent> | null
    if (!value || value.version !== 2 || value.necessary !== true || typeof value.analytics !== 'boolean' || typeof value.marketing !== 'boolean' || typeof value.expiresAt !== 'number' || !Number.isFinite(value.expiresAt) || value.expiresAt <= now) return null
    return { version: 2, necessary: true, analytics: value.analytics, marketing: value.marketing, expiresAt: value.expiresAt }
  } catch {
    return null
  }
}

export function saveCookieConsent(storage: ConsentStorage, categories: CookieCategories, now = Date.now()): CookieConsent {
  const expiry = new Date(now)
  expiry.setUTCMonth(expiry.getUTCMonth() + 12)
  const consent: CookieConsent = { version: 2, necessary: true, analytics: categories.analytics, marketing: categories.marketing, expiresAt: expiry.getTime() }
  try { storage.setItem(CONSENT_KEY, JSON.stringify(consent)) } catch {
    // A readable old acceptance must not survive a failed attempt to revoke it.
    if (!categories.analytics) {
      try { storage.removeItem?.(CONSENT_KEY) } catch { /* Caller checks persistence before reloading. */ }
    }
  }
  return consent
}

export function openCookieSettings() {
  window.dispatchEvent(new Event(CONSENT_SETTINGS_EVENT))
}

/** Reload only after verifying that storage cannot restore a previous acceptance. */
export function canReloadAfterRevocation(storage: ConsentStorage, now = Date.now()): boolean {
  try {
    const raw = storage.getItem(CONSENT_KEY)
    return !readCookieConsent({ getItem: () => raw, setItem: () => {} }, now)?.analytics
  } catch {
    return false
  }
}
