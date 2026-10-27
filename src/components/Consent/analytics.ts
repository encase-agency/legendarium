import { siteConfig } from '../../lib/siteConfig'

type AnalyticsWindow = Window & {
  dataLayer?: unknown[]
  gtag?: (...args: unknown[]) => void
  ym?: ((id: number, method: string, options?: object | string) => void) & { a?: unknown[][]; l?: number }
}
let started = false
let allowed = false
let generation = 0
let yandexReady = false
let pendingYandexGoals: string[] = []
export function startAnalytics() {
  if (started) return
  started = true
  allowed = true
  const currentGeneration = ++generation
  const target = window as AnalyticsWindow
  const { google, yandex } = siteConfig.analytics
  if (google) {
    Reflect.set(window, `ga-disable-${google}`, false)
    target.dataLayer ??= []
    target.gtag = function () { target.dataLayer!.push(arguments) }
    target.gtag('js', new Date())
    target.gtag('config', google, { allow_google_signals: false })
    const script = document.createElement('script')
    script.async = true
    script.src = `https://www.googletagmanager.com/gtag/js?id=${google}`
    script.dataset.analytics = 'google'
    document.head.append(script)
  }
  if (yandex) {
    target.ym ??= Object.assign((...args: unknown[]) => { (target.ym!.a ??= []).push(args) }, { l: Date.now() })
    const script = document.createElement('script')
    script.async = true
    script.src = 'https://mc.yandex.ru/metrika/tag.js'
    script.dataset.analytics = 'yandex'
    script.onload = () => {
      if (!allowed || generation !== currentGeneration) return
      target.ym?.(Number(yandex), 'init', { clickmap: false, trackLinks: true, accurateTrackBounce: true, webvisor: false })
      yandexReady = true
      for (const goal of pendingYandexGoals) target.ym?.(Number(yandex), 'reachGoal', goal)
      pendingYandexGoals = []
    }
    document.head.append(script)
  }
}
export function stopAnalytics() {
  allowed = false
  started = false
  generation++
  yandexReady = false
  pendingYandexGoals = []
  const { google, yandex } = siteConfig.analytics
  if (google) Reflect.set(window, `ga-disable-${google}`, true)
  if (yandex) (window as AnalyticsWindow).ym?.(Number(yandex), 'destruct')
  document.querySelectorAll('script[data-analytics]').forEach((script) => script.remove())
  clearYandexCookies()
}

/** Clear readable first-party Metrica cookies; browser security prevents clearing third-party or HttpOnly cookies. */
export function clearYandexCookies() {
  let names: string[]
  try { names = (document.cookie ?? '').split(';').map(cookie => cookie.trim().split('=')[0]).filter(name => name.startsWith('_ym_')) } catch { return }
  const hostname = window.location?.hostname ?? ''
  const parts = hostname.split('.')
  const domains = new Set(['', hostname])
  if (parts.length > 1 && !/^\d+(?:\.\d+){3}$/.test(hostname)) {
    for (let i = 0; i < parts.length - 1; i++) {
      const domain = parts.slice(i).join('.')
      domains.add(domain)
      domains.add(`.${domain}`)
    }
  }
  const paths = new Set(['/'])
  const segments = (window.location?.pathname ?? '/').split('/').filter(Boolean)
  for (let i = 1; i <= segments.length; i++) {
    const path = `/${segments.slice(0, i).join('/')}`
    paths.add(path)
    paths.add(`${path}/`)
  }
  for (const name of names) for (const domain of domains) for (const path of paths) {
    try { document.cookie = `${name}=; Max-Age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=${path}${domain ? `; domain=${domain}` : ''}` } catch { /* Cookies may be blocked by the browser. */ }
  }
}

/** Send real user actions only; unknown payment outcomes must never be reported as a success. */
export function trackAnalyticsGoal(goal: string) {
  if (!allowed || !/^[a-z][a-z0-9_]{0,63}$/.test(goal)) return
  const target = window as AnalyticsWindow
  const { google, yandex } = siteConfig.analytics
  if (yandex) {
    if (yandexReady) target.ym?.(Number(yandex), 'reachGoal', goal)
    else if (pendingYandexGoals.length < 100) pendingYandexGoals.push(goal)
  }
  if (google) target.gtag?.('event', goal)
}
