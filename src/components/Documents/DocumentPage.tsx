import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { DOCUMENTS, documentFromHash, type DocumentSlug } from '../../lib/documents'
import { useDialogLifecycle } from '../../lib/useDialogLifecycle'
import { asset } from '../../lib/asset'
import './DocumentPage.css'

type Load = { state: 'loading' } | { state: 'error' } | { state: 'ready'; html: string }
const cache = new Map<DocumentSlug, string>()

/** True when the document was opened from a link on the page (so "close" can step back in the history). */
let openedFromPage = false

function Document({ slug, onClose }: { slug: DocumentSlug; onClose: () => void }) {
  const [load, setLoad] = useState<Load>(() => (cache.has(slug) ? { state: 'ready', html: cache.get(slug)! } : { state: 'loading' }))
  const [attempt, setAttempt] = useState(0)
  const dialogRef = useRef<HTMLDivElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  useDialogLifecycle(dialogRef, onClose, closeRef)
  const doc = DOCUMENTS[slug]

  useEffect(() => {
    const previous = document.title
    document.title = `${doc.title} — Легендариум`
    return () => { document.title = previous }
  }, [doc.title])

  useEffect(() => {
    scrollRef.current?.scrollTo(0, 0)
    const cached = cache.get(slug)
    if (cached) { setLoad({ state: 'ready', html: cached }); return }
    setLoad({ state: 'loading' })
    const ctrl = new AbortController()
    fetch(asset(`/documents/${doc.file}`), { signal: ctrl.signal })
      .then(res => { if (!res.ok) throw new Error(String(res.status)); return res.text() })
      .then(html => { cache.set(slug, html); setLoad({ state: 'ready', html }) })
      .catch(() => { if (!ctrl.signal.aborted) setLoad({ state: 'error' }) })
    return () => ctrl.abort()
  }, [slug, doc.file, attempt])

  return createPortal(
    <div className="dp" role="dialog" aria-modal="true" aria-label={doc.title} ref={dialogRef} tabIndex={-1}>
      <div className="dp-scroll" ref={scrollRef}>
        <article className="dp-page">
          <h1 className="dp-title">{doc.title}</h1>
          {load.state === 'loading' && <p className="dp-status" role="status">Загружаем документ…</p>}
          {load.state === 'error' && (
            <p className="dp-status" role="status">
              Не удалось загрузить документ.{' '}
              <button type="button" onClick={() => setAttempt(n => n + 1)}>Повторить</button>
            </p>
          )}
          {load.state === 'ready' && <div className="dp-body" dangerouslySetInnerHTML={{ __html: load.html }} />}
        </article>
      </div>
      <button className="dp-close" type="button" onClick={onClose} aria-label="Закрыть" ref={closeRef}>
        <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M5 5l14 14M19 5L5 19" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
      </button>
    </div>,
    document.body,
  )
}

/** Legal documents (offer, policies, consents) shown over the site on a plain white page: #/documents/<name>. */
export function DocumentPage() {
  const [slug, setSlug] = useState<DocumentSlug | null>(() => documentFromHash(window.location.hash))

  useEffect(() => {
    const sync = () => {
      const next = documentFromHash(window.location.hash)
      setSlug(current => {
        if (next && !current) openedFromPage = true
        return next
      })
    }
    window.addEventListener('hashchange', sync)
    window.addEventListener('popstate', sync)
    return () => {
      window.removeEventListener('hashchange', sync)
      window.removeEventListener('popstate', sync)
    }
  }, [])

  const close = useCallback(() => {
    if (openedFromPage) {
      openedFromPage = false
      window.history.back() // popstate/hashchange brings the page back where it was
    } else {
      window.history.replaceState(null, '', window.location.pathname + window.location.search)
      setSlug(null)
    }
  }, [])

  return slug ? <Document slug={slug} onClose={close} /> : null
}
