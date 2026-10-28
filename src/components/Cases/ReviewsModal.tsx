import { useRef } from 'react'
import { createPortal } from 'react-dom'
import { CaseRow } from './CaseRow'
import type { CaseData } from './caseData'
import { ArrowIcon } from '../shared/ArrowIcon'
import './ReviewsModal.css'
import { asset } from '../../lib/asset'
import { useDialogLifecycle } from '../../lib/useDialogLifecycle'

interface Props {
  closing: boolean
  reviews: CaseData[]
  onClose: () => void
  onOpenVideo: (index: number) => void
}

// Figma 659:4246: the window behind "Смотреть больше". The cross stays on screen while the list scrolls (659:5938).
export function ReviewsModal({ closing, reviews, onClose, onOpenVideo }: Props) {
  const closeRef = useRef<HTMLButtonElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const dialogRef = useRef<HTMLDivElement>(null)
  // The shared lifecycle keeps Escape for the top-most dialog, so a video opened over this window closes first.
  useDialogLifecycle(dialogRef, onClose, closeRef)

  return createPortal(
    <div ref={dialogRef} className={closing ? 'rv is-closing' : 'rv'} role="dialog" aria-modal="true" aria-label="Больше результатов наших учеников" tabIndex={-1}>
      <div className="rv-scroll" ref={scrollRef}>
        <div className="rv-inner">
          <h2 className="rv-heading">
            Больше результатов{' '}
            <br />
            наших учеников
          </h2>
          <div className="rv-list">
            {reviews.map((r, i) => (
              <CaseRow item={r} key={r.id} onOpen={() => onOpenVideo(i)} />
            ))}
          </div>
          <button className="cs-all rv-home" type="button" onClick={onClose}>
            Вернуться на главную
            <span className="cs-all-icon">
              <ArrowIcon src={asset('/assets/faculties/arrow.svg')} />
            </span>
          </button>
        </div>
      </div>
      <button className="rv-close" type="button" onClick={onClose} aria-label="Закрыть" ref={closeRef}>
        <img src={asset('/assets/faculties/close.svg')} alt="" />
      </button>
    </div>,
    document.body,
  )
}
