import { useRef } from 'react'
import { useDialogLifecycle } from '../../lib/useDialogLifecycle'
import { createPortal } from 'react-dom'
import { ArrowIcon } from '../shared/ArrowIcon'
import './MenuOverlay.css'
import { asset } from '../../lib/asset'

const ITEMS: { label: string; id: string }[] = [
  { label: 'Главная', id: 'hero' },
  { label: 'О нас', id: 'platform' },
  { label: 'Направления обучения', id: 'directions' },
  { label: 'Наставники', id: 'faculties' },
  { label: 'История Андрея', id: 'founder' },
  { label: 'Тарифы', id: 'pricing' },
  { label: 'Отзывы', id: 'cases' },
  { label: 'Частые вопросы', id: 'faq' },
  { label: 'Контакты', id: 'footer' },
]

interface Props {
  closing: boolean
  onClose: () => void
  onPick: (id: string) => void
}

// Figma 291:5241: a full-screen menu; the hovered item turns gold and gets an arrow badge.
export function MenuOverlay({ closing, onClose, onPick }: Props) {
  const dialogRef = useRef<HTMLDivElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  useDialogLifecycle(dialogRef, onClose, closeRef)

  return createPortal(
    <div className={closing ? 'mn is-closing' : 'mn'} role="dialog" aria-modal="true" aria-label="Меню" ref={dialogRef} tabIndex={-1}>
      <nav className="mn-list">
        {ITEMS.map((it, i) => (
          <a
            key={it.id}
            className="mn-item"
            href={`#${it.id}`}
            style={{ '--i': i } as React.CSSProperties}
            onClick={(e) => {
              e.preventDefault()
              onPick(it.id)
            }}
          >
            <span>{it.label}</span>
            <span className="mn-badge">
              <ArrowIcon src={asset('/assets/menu/arrow.svg')} />
            </span>
          </a>
        ))}
      </nav>
      <button type="button" className="mn-close" onClick={onClose} aria-label="Закрыть меню" ref={closeRef}>
        <img src={asset('/assets/menu/close.svg')} alt="" />
      </button>
    </div>,
    document.body,
  )
}
