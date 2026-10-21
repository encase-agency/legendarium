type SiteEnvironment = Record<string, string | undefined>

// Public contact data supplied in «Доработки-Легендариум (1).md», 2026-10-20.
// Account credentials from that document are deliberately not part of site configuration.
const PUBLIC_DEFAULTS: SiteEnvironment = {
  VITE_CONTACT_LOCATION: 'Москва / Россия',
  VITE_CONTACT_EMAIL: 'lukin.a2011@yandex.ru',
  VITE_CONTACT_PHONE: '+7 993 455-92-87',
  VITE_INSTAGRAM_URL: 'https://www.instagram.com/lukin.av/',
  VITE_TELEGRAM_URL: 'https://t.me/andrewlukin_tg',
  VITE_TELEGRAM_DIRECT_URL: 'https://t.me/theandrewlukin',
  VITE_ANDREW_CONTACT_URL: 'https://t.me/m/DvdHAA44NjMy',
  VITE_YOUTUBE_URL: 'https://www.youtube.com/@legend_andrewlukin',
  VITE_WHATSAPP_URL: 'https://wa.me/79934559287',
  VITE_LICENSE_URL: 'https://islod.obrnadzor.gov.ru/rlic/details/106e3d18-b623-7243-d9af-9a571df66c73/',
}

function externalUrl(value?: string): string | undefined {
  if (!value) return undefined
  try {
    const url = new URL(value.trim())
    return url.protocol === 'https:' ? url.href : undefined
  } catch {
    return undefined
  }
}

export function createSiteConfig(env: SiteEnvironment) {
  env = { ...env }
  for (const [key, value] of Object.entries(PUBLIC_DEFAULTS)) {
    if (!env[key]?.trim()) env[key] = value
  }
  const media = env.VITE_MEDIA_BASE_URL?.trim()
  return {
    leadEndpoint: externalUrl(env.VITE_LEAD_ENDPOINT),
    mediaBaseUrl: media?.startsWith('/') && !media.startsWith('//') ? media.replace(/\/$/, '') : externalUrl(media)?.replace(/\/$/, ''),
    checkout: { legend: externalUrl(env.VITE_GETCOURSE_LEGEND_URL), basic: externalUrl(env.VITE_GETCOURSE_BASIC_URL) },
    contact: { location: env.VITE_CONTACT_LOCATION?.trim(), email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(env.VITE_CONTACT_EMAIL ?? '') ? env.VITE_CONTACT_EMAIL : undefined, phone: /^\+?[\d ()-]{7,}$/.test(env.VITE_CONTACT_PHONE ?? '') ? env.VITE_CONTACT_PHONE : undefined, andrewUrl: externalUrl(env.VITE_ANDREW_CONTACT_URL) },
    socials: { telegram: externalUrl(env.VITE_TELEGRAM_URL), directTelegram: externalUrl(env.VITE_TELEGRAM_DIRECT_URL), instagram: externalUrl(env.VITE_INSTAGRAM_URL), whatsapp: externalUrl(env.VITE_WHATSAPP_URL), youtube: externalUrl(env.VITE_YOUTUBE_URL) },
    documents: { privacy: externalUrl(env.VITE_PRIVACY_URL), personalData: externalUrl(env.VITE_PERSONAL_DATA_URL), offer: externalUrl(env.VITE_OFFER_URL), terms: externalUrl(env.VITE_TERMS_URL), cookies: externalUrl(env.VITE_COOKIES_URL) },
    license: { text: env.VITE_LICENSE_TEXT?.trim(), url: externalUrl(env.VITE_LICENSE_URL) },
    analytics: { google: /^G-[A-Z0-9]+$/.test(env.VITE_GA_ID ?? '') ? env.VITE_GA_ID : undefined, yandex: /^[1-9]\d*$/.test(env.VITE_YANDEX_ID ?? '') ? env.VITE_YANDEX_ID : undefined },
  }
}

export const siteConfig = createSiteConfig(import.meta.env)
