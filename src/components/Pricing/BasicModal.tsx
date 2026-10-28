import { siteConfig } from '../../lib/siteConfig'
import { trackAnalyticsGoal } from '../Consent/analytics'
import { useDialogLifecycle } from '../../lib/useDialogLifecycle'
import { useRef } from 'react'
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

// Figma 742:3453 (desktop) and 742:3602 (phone): full-screen basic plan card.
export function BasicModal({ closing, onClose }: Props) {
  const closeRef = useRef<HTMLButtonElement>(null)

  const dialogRef = useRef<HTMLDivElement>(null)
  useDialogLifecycle(dialogRef, onClose, closeRef)

  // Rendered into <body>: a pinned (transformed) section would otherwise size and clip a fixed overlay and keep it under the header.
  return createPortal(
    <div
      ref={dialogRef}
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
              <p className="pm-name">
                <span className="pm-name-d">Базовый тариф</span>
                <span className="pm-name-m">Базовая подписка</span>
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

        <a className="pm-buy" href={siteConfig.enrollment.basic} target="_blank" rel="noreferrer" onClick={() => trackAnalyticsGoal('tariff_basic_click')}>Получить доступ</a>

        <button ref={closeRef} type="button" className="pm-close" onClick={onClose} aria-label="Закрыть">
          <img src={`${A}/close.svg`} alt="" />
        </button>
      </div>
    </div>,
    document.body,
  )
}
