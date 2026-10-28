import { startAnalytics, stopAnalytics } from './analytics'
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { siteConfig } from '../../lib/siteConfig'
import { linkAttrs } from '../../lib/documents'
import { useDialogLifecycle } from '../../lib/useDialogLifecycle'
import { CONSENT_SETTINGS_EVENT, NECESSARY_ONLY, readCookieConsent, saveCookieConsent, canReloadAfterRevocation, type CookieCategories, type CookieConsent } from './preferences'
import './Consent.css'

function storedChoice() {
  try { return readCookieConsent(localStorage) } catch { return null }
}

function Settings({ initial, onSave, onClose }: { initial: CookieCategories; onSave: (categories: CookieCategories) => void; onClose: () => void }) {
  const [draft, setDraft] = useState(initial)
  const dialog = useRef<HTMLDivElement>(null)
  const close = useRef<HTMLButtonElement>(null)
  useDialogLifecycle(dialog, onClose, close)
  return createPortal(
    <div className="consent-backdrop" onClick={event => { if (event.target === event.currentTarget) onClose() }}>
      <div className="consent consent-dialog" ref={dialog} role="dialog" aria-modal="true" aria-labelledby="cookie-settings-title">
        <div className="consent-heading"><h2 id="cookie-settings-title">Настройки файлов cookie</h2><button ref={close} type="button" onClick={onClose} aria-label="Закрыть настройки cookie">×</button></div>
        <p>Выбор сохраняется на 12 месяцев. Его можно изменить в футере сайта.</p>
        <label className="consent-category"><input type="checkbox" checked disabled /><span><strong>Необходимые — всегда включены</strong><small>Обеспечивают работу сайта и сохраняют ваш выбор.</small></span></label>
        <label className="consent-category"><input type="checkbox" checked={draft.analytics} onChange={event => setDraft({ ...draft, analytics: event.target.checked })} /><span><strong>Аналитические</strong><small>Помогают анализировать посещения сайта. Яндекс Метрика и Google Analytics запускаются только с вашего согласия.</small></span></label>
        <label className="consent-category"><input type="checkbox" checked={draft.marketing} onChange={event => setDraft({ ...draft, marketing: event.target.checked })} /><span><strong>Маркетинговые</strong><small>Сохраняют ваш выбор для маркетинговых технологий. Сейчас такие технологии на сайте не подключены.</small></span></label>
        {siteConfig.documents.privacy && <a {...linkAttrs(siteConfig.documents.privacy)}>Политика обработки ПДн</a>}
        <div className="consent-actions"><button type="button" onClick={() => onSave(NECESSARY_ONLY)}>Только необходимые</button><button type="button" onClick={() => onSave(draft)}>Сохранить настройки</button></div>
      </div>
    </div>, document.body,
  )
}

export function Consent() {
  const [choice, setChoice] = useState<CookieConsent | null>(storedChoice)
  const [editing, setEditing] = useState(false)
  const [storageError, setStorageError] = useState(false)
  useEffect(() => {
    if (choice?.analytics) startAnalytics()
    else stopAnalytics()
    if (!choice) return
    let timer: number
    // Browser timers cannot represent twelve months: schedule the final check at the actual expiry.
    const checkExpiry = () => {
      const remaining = choice.expiresAt - Date.now()
      if (remaining <= 0) {
        stopAnalytics()
        setChoice(null)
        if (choice.analytics) window.location.reload()
      } else {
        timer = window.setTimeout(checkExpiry, Math.min(remaining, 24 * 60 * 60 * 1000))
      }
    }
    checkExpiry()
    return () => window.clearTimeout(timer)
  }, [choice])
  useEffect(() => {
    const open = () => setEditing(true)
    window.addEventListener(CONSENT_SETTINGS_EVENT, open)
    return () => window.removeEventListener(CONSENT_SETTINGS_EVENT, open)
  }, [])
  const choose = (next: CookieCategories) => {
    let saved: CookieConsent
    try { saved = saveCookieConsent(localStorage, next) } catch { saved = saveCookieConsent({ getItem: () => null, setItem: () => {} }, next) }
    if (!next.analytics) stopAnalytics()
    setChoice(saved)
    setEditing(false)
    // Unload listeners already installed by an accepted third-party tracker.
    if (choice?.analytics && !next.analytics) {
      let reloadSafe = false
      try { reloadSafe = canReloadAfterRevocation(localStorage) } catch { /* Storage getter can be blocked. */ }
      if (reloadSafe) window.location.reload()
      else setStorageError(true)
    } else setStorageError(false)
  }
  return <>
    {storageError && <aside className="consent" role="status"><p>Аналитика отключена в этой вкладке. Браузер не позволил сохранить отказ. Удалите данные сайта в настройках браузера, чтобы прежнее согласие не восстановилось при следующем посещении.</p><button type="button" onClick={() => setStorageError(false)}>Закрыть</button></aside>}
    {!choice && !editing && <aside className="consent" aria-label="Файлы cookie">
      <p>Используем необходимые файлы cookie для работы сайта. Аналитические и маркетинговые технологии включаются только с вашего согласия. Выбор сохраняется на 12 месяцев.</p>
      {siteConfig.documents.privacy && <a {...linkAttrs(siteConfig.documents.privacy)}>Политика обработки ПДн</a>}
      <div className="consent-actions"><button type="button" onClick={() => choose(NECESSARY_ONLY)}>Только необходимые</button><button type="button" onClick={() => choose({ necessary: true, analytics: true, marketing: true })}>Принять</button><button type="button" onClick={() => setEditing(true)}>Настройки</button></div>
    </aside>}
    {editing && <Settings initial={choice ?? NECESSARY_ONLY} onSave={choose} onClose={() => setEditing(false)} />}
  </>
}
