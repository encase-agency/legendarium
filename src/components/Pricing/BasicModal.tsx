import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import './BasicModal.css'
import { asset } from '../../lib/asset'

const A = asset('/assets/pricing')

const ITEMS = [
  { on: true, text: 'Все 12+ направлений и материалы платформы' },
  { on: true, text: 'Самостоятельное обучение' },
  { on: false, text: 'Без личных разборов с Андреем' },
  { on: false, text: 'Без дополнительных мужских программ' },
  { on: false, text: 'Без офлайн-встреч и процессной гарантии тарифа «Легенда»' },
]

interface Props {
  closing: boolean
  onClose: () => void
}

// Figma 291:5292 (redone): full-screen basic plan card.
export function BasicModal({ closing, onClose }: Props) {
  const closeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    closeRef.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  // Rendered into <body>: a pinned (transformed) section would otherwise size and clip a fixed overlay and keep it under the header.
  return createPortal(
    <div
      className={closing ? 'pm is-closing' : 'pm'}
      role="dialog"
      aria-modal="true"
      aria-label="Базовая подписка"
    >
      <div className="pm-stage">
        <h3 className="pm-heading">Выбери уровень участия</h3>

        <div className="pm-card">
          <div className="pm-card-in">
            <div className="pm-head">
              <p className="pm-name">Базовая подписка</p>
              <p className="pm-price">
                <span>5 900 ₽/ </span>
                <small>мес</small>
              </p>
            </div>
            <ul className="pm-list">
              {ITEMS.map((it) => (
                <li key={it.text}>
                  <img src={`${A}/${it.on ? 'check-c' : 'minus'}.svg`} alt="" />
                  <p>{it.text}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <a className="pm-buy" href="#join" onClick={onClose}>
          Купить Базовый тариф
        </a>

        <button ref={closeRef} type="button" className="pm-close" onClick={onClose} aria-label="Закрыть">
          <img src={`${A}/close.svg`} alt="" />
        </button>
      </div>
    </div>,
    document.body,
  )
}
