import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useDialogLifecycle } from '../../lib/useDialogLifecycle'
import { getWidgetHeight } from '../../lib/getcourse'
import './GetCourseModal.css'

const ORIGIN = 'https://legendaschool.ru'
const WIDGETS = {
  legend: { id: '1565037', name: '746', key: '2550845ec8594440fb20fb11c4cba81ee44df2f2', label: 'Легенда' },
  basic: { id: '1562933', name: '936', key: 'f14604964fb14b84899300800934135eea85ed65', label: 'Базовый' },
}

export type CheckoutPlan = keyof typeof WIDGETS

/** The supplied GetCourse scripts create these hosted frames. Keep their lifecycle local to the dialog. */
export function GetCourseModal({ plan, onClose }: { plan: CheckoutPlan; onClose: () => void }) {
  const widget = WIDGETS[plan]
  const dialog = useRef<HTMLDivElement>(null)
  const close = useRef<HTMLButtonElement>(null)
  const frame = useRef<HTMLIFrameElement>(null)
  const [height, setHeight] = useState(650)
  const [ready, setReady] = useState(false)
  const [slow, setSlow] = useState(false)
  const [attempt, setAttempt] = useState(0)
  const [src] = useState(() => {
    const params = new URLSearchParams(window.location.search)
    params.set('id', widget.id)
    params.set('ref', document.referrer)
    params.set('loc', window.location.href)
    return `${ORIGIN}/pl/lite/widget/widget?${params}`
  })
  useDialogLifecycle(dialog, onClose, close)

  useEffect(() => {
    const timer = window.setTimeout(() => setSlow(true), 15000)
    const receive = (event: MessageEvent) => {
      const nextHeight = getWidgetHeight(event, frame.current?.contentWindow, widget.key)
      if (nextHeight !== undefined) {
        setHeight(nextHeight)
        setReady(true)
        setSlow(false)
        window.clearTimeout(timer)
      }
    }
    window.addEventListener('message', receive)
    return () => {
      window.clearTimeout(timer)
      window.removeEventListener('message', receive)
    }
  }, [widget.key, attempt])

  return createPortal(
    <div className="gc-overlay" ref={dialog} role="dialog" aria-modal="true" aria-label={`Оформление тарифа «${widget.label}»`} onClick={event => { if (event.target === event.currentTarget) onClose() }}>
      <div className="gc-panel">
        <header className="gc-header">
          <h2>Тариф «{widget.label}»</h2>
          <button ref={close} type="button" onClick={onClose} aria-label="Закрыть оформление">×</button>
        </header>
        {!ready && !slow && <p role="status">Загружаем форму GetCourse…</p>}
        {slow && <div role="status"><p>Форма загружается дольше обычного. Проверь соединение и попробуй ещё раз.</p><button type="button" onClick={() => { setReady(false); setSlow(false); setAttempt(value => value + 1) }}>Повторить загрузку</button></div>}
        <iframe key={attempt} ref={frame} src={src} name={widget.name} title={`Форма GetCourse — ${widget.label}`} style={{ height }} allow="fullscreen" />
        <button className="gc-bottom-close" type="button" onClick={onClose}>Вернуться на сайт</button>
      </div>
    </div>, document.body,
  )
}
