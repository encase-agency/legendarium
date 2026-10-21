import { startAnalytics, stopAnalytics } from './analytics'
import { useEffect, useState } from 'react'
import { siteConfig } from '../../lib/siteConfig'
import './Consent.css'

const KEY = 'legendarium.analytics-consent.v1'
type Choice = 'accepted' | 'rejected' | null
function storedChoice(): Choice {
  try { const value = localStorage.getItem(KEY); return value === 'accepted' || value === 'rejected' ? value : null } catch { return null }
}

export function Consent() {
  const [choice, setChoice] = useState<Choice>(storedChoice)
  const [editing, setEditing] = useState(false)
  const configured = Boolean(siteConfig.analytics.google || siteConfig.analytics.yandex)
  useEffect(() => {
    if (choice === 'accepted') startAnalytics()
  }, [choice])
  const choose = (next: Exclude<Choice, null>) => {
    try { localStorage.setItem(KEY, next) } catch { /* The choice still applies for this visit. */ }
    if (next === 'rejected') stopAnalytics()
    setChoice(next)
    setEditing(false)
    // A reload unloads already-running third-party listeners, including scripts still downloading.
    if (choice === 'accepted' && next === 'rejected') window.location.reload()
  }
  if (!configured) return null
  return <>
    <button className="consent-settings" type="button" onClick={() => setEditing(true)}>Настройки cookies</button>
    {(!choice || editing) && <aside className="consent" aria-label="Настройки аналитики">
      <p>С вашего согласия используем Google Analytics и Яндекс Метрику для анализа посещений. До согласия аналитика отключена. Выбор можно изменить в настройках cookies.</p>
      {siteConfig.documents.cookies && <a href={siteConfig.documents.cookies} target="_blank" rel="noreferrer">Подробнее о cookies</a>}
      <div><button type="button" onClick={() => choose('accepted')}>Разрешить аналитику</button><button type="button" onClick={() => choose('rejected')}>Отказаться</button></div>
    </aside>}
  </>
}
