/** Legal documents live on the site itself (public/documents/*.html, converted from the Google Docs). */
export const DOCUMENTS = {
  offer: { title: 'Публичная оферта', file: 'offer.html' },
  privacy: { title: 'Политика обработки персональных данных', file: 'privacy.html' },
  'personal-data': { title: 'Согласие на обработку персональных данных', file: 'personal.html' },
  newsletter: { title: 'Согласие на получение рассылки', file: 'newsletter.html' },
} as const

export type DocumentSlug = keyof typeof DOCUMENTS

const PREFIX = '#/documents/'

export const documentHref = (slug: DocumentSlug) => `${PREFIX}${slug}`

export function documentFromHash(hash: string): DocumentSlug | null {
  if (!hash.startsWith(PREFIX)) return null
  const slug = hash.slice(PREFIX.length).replace(/\/$/, '')
  return slug in DOCUMENTS ? (slug as DocumentSlug) : null
}

/** Links to the documents stay in the same tab (they open over the page); everything else opens in a new one. */
export function linkAttrs(href: string): { href: string; target?: string; rel?: string } {
  return href.startsWith('#') ? { href } : { href, target: '_blank', rel: 'noreferrer' }
}
