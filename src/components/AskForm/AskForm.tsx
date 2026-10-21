import { sendLead } from './sendLead'
import { useEffect, useRef, useState, type FormEvent } from 'react'
import { scrollToSection } from '../../lib/scrollToSection'
import { ArrowIcon } from '../shared/ArrowIcon'
import { createPortal } from 'react-dom'
import './AskForm.css'
import { siteConfig } from '../../lib/siteConfig'
import { useDialogLifecycle } from '../../lib/useDialogLifecycle'
import { asset } from '../../lib/asset'

const A = asset('/assets/ask-form')
const ENDPOINT = siteConfig.leadEndpoint

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
  const dialogRef = useRef<HTMLDivElement>(null)
  const requestRef = useRef<AbortController | null>(null)
  const doneRef = useRef<HTMLButtonElement>(null)

  useEffect(() => () => {
    window.clearTimeout(toastTimer.current)
    requestRef.current?.abort()
    requestRef.current = null
  }, [])

  // After a successful send, closing the thank-you screen takes the visitor on to the next block.
  const close = () => {
    onClose()
    if (status === 'success') window.setTimeout(() => scrollToSection('story'), 320)
  }

  useDialogLifecycle(dialogRef, close, nameRef)
  useEffect(() => { if (status === 'success') doneRef.current?.focus() }, [status])

  const valid = name.trim().length >= 2 && tg.trim().replace(/^@/, '').length >= 3
  const touched = name.length > 0 || tg.length > 0
  const available = Boolean(ENDPOINT && siteConfig.documents.privacy && siteConfig.documents.personalData)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!valid || requestRef.current || !ENDPOINT || !available) return
    const controller = new AbortController()
    requestRef.current = controller
    const timeout = window.setTimeout(() => controller.abort(), 15000)
    setStatus('sending')
    try {
      await sendLead(ENDPOINT, name.trim(), tg.trim(), controller.signal)
      setStatus('success')
    } catch {
      if (requestRef.current !== controller) return
      setStatus('idle')
      setToast(true)
      window.clearTimeout(toastTimer.current)
      toastTimer.current = window.setTimeout(() => setToast(false), 4200)
    } finally {
      window.clearTimeout(timeout)
      if (requestRef.current === controller) requestRef.current = null
    }
  }

  // Rendered into <body>: a pinned (transformed) section would otherwise size and clip a fixed overlay and keep it under the header.
  return createPortal(
    <div ref={dialogRef} className={closing ? 'af is-closing' : 'af'} role="dialog" aria-modal="true" aria-label="Задать вопрос">
      {status === 'success' ? (
        <div className="af-success">
          <div className="af-ok">
            <img src={`${A}/success.svg`} alt="" />
            <div className="af-ok-text">
              <h3>Заявка успешно принята</h3>
              <p>Свяжемся в течение рабочего дня</p>
            </div>
            <button type="button" ref={doneRef} className="af-btn af-btn--on af-btn--done" onClick={close}>
              Готово
            </button>
          </div>
        </div>
      ) : (
        <div className="af-stage">
          <form className="af-left" onSubmit={submit} aria-busy={status === 'sending'} noValidate>
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
                  aria-label="Имя"
                  placeholder="Имя"
                  autoComplete="given-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
                <input
                  className="af-input"
                  type="text"
                  name="telegram"
                  aria-label="Telegram"
                  placeholder="Telegram"
                  autoComplete="off"
                  autoCapitalize="none"
                  value={tg}
                  onChange={(e) => setTg(e.target.value)}
                />
              </div>
              <div className="af-actions">
                <button type="submit" className={valid && available ? 'af-btn af-btn--on' : 'af-btn'} disabled={!valid || status === 'sending' || !available}>
                  {status === 'sending' ? 'Отправляем…' : 'Отправить заявку'}
                </button>
                {siteConfig.socials.directTelegram && <a className="af-tg" href={siteConfig.socials.directTelegram} target="_blank" rel="noreferrer">
                  {touched ? 'Написать в Telegram' : 'Написать напрямую в Telegram'}
                  <span className="af-tg-icon">
                    <ArrowIcon src={`${A}/arrow.svg`} />
                  </span>
                </a>}
              </div>
            </div>
            <p className="af-legal">
              {!available ? 'Приём заявок временно недоступен. Настраиваем форму связи.' : <>Нажимая кнопку, ты соглашаешься с <a href={siteConfig.documents.privacy} target="_blank" rel="noreferrer">политикой конфиденциальности</a> и <a href={siteConfig.documents.personalData} target="_blank" rel="noreferrer">обработкой персональных данных</a>.</>}
            </p>
          </form>

          <div className="af-photo">
            <img src={`${A}/photo.jpg`} alt="" />
            <div className={toast ? 'af-toast is-on' : 'af-toast'} role={toast ? 'alert' : undefined} aria-live="assertive" aria-hidden={!toast}>
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
