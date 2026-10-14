import { useEffect, useRef, useState, type FormEvent } from 'react'
import { scrollToSection } from '../../lib/scrollToSection'
import { ArrowIcon } from '../shared/ArrowIcon'
import { createPortal } from 'react-dom'
import './AskForm.css'
import { asset } from '../../lib/asset'

const A = asset('/assets/ask-form')
/** Where the "write directly" button leads. */
const TELEGRAM_URL = 'https://t.me/'
/** Set VITE_LEAD_ENDPOINT to a URL that accepts a JSON POST ({name, telegram}); without it the form only simulates a send. */
const ENDPOINT = import.meta.env.VITE_LEAD_ENDPOINT as string | undefined

async function sendLead(name: string, telegram: string) {
  // ?formError=1 forces a failed send, to check the error toast
  if (new URLSearchParams(window.location.search).has('formError')) throw new Error('forced')
  if (!ENDPOINT) {
    await new Promise((r) => setTimeout(r, 700))
    return
  }
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, telegram, source: 'ask-form' }),
  })
  if (!res.ok) throw new Error(`lead ${res.status}`)
}

interface Props {
  closing: boolean
  onClose: () => void
}

type Status = 'idle' | 'sending' | 'success'

// Figma 288:4609 (form), 585:2647 / 585:2828 (input progress, active button), 290:4702 (success), 585:2910 (error toast).
export function AskForm({ closing, onClose }: Props) {
  const [name, setName] = useState('')
  const [tg, setTg] = useState('')
  const [status, setStatus] = useState<Status>('idle')
  const [toast, setToast] = useState(false)
  const nameRef = useRef<HTMLInputElement>(null)
  const toastTimer = useRef<number>(0)
  const statusRef = useRef<Status>('idle')
  statusRef.current = status

  useEffect(() => {
    nameRef.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
        if (statusRef.current === 'success') window.setTimeout(() => scrollToSection('story'), 320)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  useEffect(() => () => window.clearTimeout(toastTimer.current), [])

  // After a successful send, closing the thank-you screen takes the visitor on to the next block.
  const close = () => {
    onClose()
    if (status === 'success') window.setTimeout(() => scrollToSection('story'), 320)
  }

  const valid = name.trim().length >= 2 && tg.trim().replace(/^@/, '').length >= 3
  const touched = name.length > 0 || tg.length > 0

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!valid || status === 'sending') return
    setStatus('sending')
    try {
      await sendLead(name.trim(), tg.trim())
      setStatus('success')
    } catch {
      setStatus('idle')
      setToast(true)
      window.clearTimeout(toastTimer.current)
      toastTimer.current = window.setTimeout(() => setToast(false), 4200)
    }
  }

  // Rendered into <body>: a pinned (transformed) section would otherwise size and clip a fixed overlay and keep it under the header.
  return createPortal(
    <div className={closing ? 'af is-closing' : 'af'} role="dialog" aria-modal="true" aria-label="Задать вопрос">
      {status === 'success' ? (
        <div className="af-success">
          <div className="af-ok">
            <img src={`${A}/success.svg`} alt="" />
            <div className="af-ok-text">
              <h3>Заявка успешно принята</h3>
              <p>Свяжемся в течение рабочего дня</p>
            </div>
            <button type="button" className="af-btn af-btn--on af-btn--done" onClick={close}>
              Готово
            </button>
          </div>
        </div>
      ) : (
        <div className="af-stage">
          <form className="af-left" onSubmit={submit} noValidate>
            <div className="af-top">
              <div className="af-head">
                <h3>
                  Ответим на вопросы и поможем{' '}
                  <br />
                  выбрать направление
                </h3>
                <p>
                  Оплата после заявки не обязательна.{' '}
                  <br />
                  Ответим в течение рабочего дня. Ничего продавать по телефону не будем.
                </p>
              </div>
              <div className="af-fields">
                <input
                  ref={nameRef}
                  className="af-input"
                  type="text"
                  name="name"
                  placeholder="Имя"
                  autoComplete="given-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
                <input
                  className="af-input"
                  type="text"
                  name="telegram"
                  placeholder="Telegram"
                  autoComplete="off"
                  autoCapitalize="none"
                  value={tg}
                  onChange={(e) => setTg(e.target.value)}
                />
              </div>
              <div className="af-actions">
                <button type="submit" className={valid ? 'af-btn af-btn--on' : 'af-btn'} disabled={!valid || status === 'sending'}>
                  {status === 'sending' ? 'Отправляем…' : 'Отправить заявку'}
                </button>
                <a className="af-tg" href={TELEGRAM_URL} target="_blank" rel="noreferrer">
                  {touched ? 'Написать в Telegram' : 'Написать напрямую в Telegram'}
                  <span className="af-tg-icon">
                    <ArrowIcon src={`${A}/arrow.svg`} />
                  </span>
                </a>
              </div>
            </div>
            <p className="af-legal">
              Нажимая кнопку, ты соглашаешься с политикой{' '}
              <br />
              конфиденциальности и обработкой персональных данных.
            </p>
          </form>

          <div className="af-photo">
            <img src={`${A}/photo.jpg`} alt="" />
            <div className={toast ? 'af-toast is-on' : 'af-toast'} role="alert" aria-live="assertive">
              <span className="af-toast-icon">
                <img src={`${A}/cross.svg`} alt="" />
              </span>
              <div className="af-toast-text">
                <p className="af-toast-title">Что-то пошло не так</p>
                <p className="af-toast-sub">Повторите попытку позже</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <button type="button" className="af-close" onClick={close} aria-label="Закрыть">
        <img src={`${A}/close.svg`} alt="" />
      </button>
    </div>,
    document.body,
  )
}
