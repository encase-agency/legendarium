import { siteConfig } from '../../lib/siteConfig'

type AnalyticsWindow = Window & {
  dataLayer?: unknown[]
  gtag?: (...args: unknown[]) => void
  ym?: ((id: number, method: string, options?: object) => void) & { a?: unknown[][]; l?: number }
}
let started = false
let allowed = false
let generation = 0
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
      if (allowed && generation === currentGeneration) target.ym?.(Number(yandex), 'init', { clickmap: false, trackLinks: true, accurateTrackBounce: true, webvisor: false })
    }
    document.head.append(script)
  }
}
export function stopAnalytics() {
  allowed = false
  started = false
  generation++
  const { google, yandex } = siteConfig.analytics
  if (google) Reflect.set(window, `ga-disable-${google}`, true)
  if (yandex) (window as AnalyticsWindow).ym?.(Number(yandex), 'destruct')
  document.querySelectorAll('script[data-analytics]').forEach((script) => script.remove())
}
