import { lazy, Suspense, useCallback, useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { ArrowIcon } from '../shared/ArrowIcon'
import { COURSES, type Course } from './courses'
import './Faculties.css'
import { asset } from '../../lib/asset'
import { usePhoneLayout } from '../../lib/usePhoneLayout'

const CourseModal = lazy(() => import('./CourseModal').then(module => ({ default: module.CourseModal })))

const A = asset('/assets/faculties')
// the mentors shown before "Смотреть больше": six on a computer, four on a phone
const VISIBLE_DESKTOP = 6
const VISIBLE_PHONE = 4

function CourseCard({ course, onOpen, focusable = true }: { course: Course; onOpen: () => void; focusable?: boolean }) {
  const { poster, card } = course
  const crop = poster.crop
  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onOpen()
    }
  }
  // The whole card (poster, text, "Подробнее") opens the course window.
  return (
    <article
      className="fc-card"
      role="button"
      tabIndex={focusable ? 0 : -1}
      aria-label={`Подробнее: ${course.modal.title.join(' ')}`}
      onClick={onOpen}
      onKeyDown={onKey}
    >
      <div className="fc-poster">
        <img
          src={poster.src.startsWith('https://') ? poster.src : `${A}/${poster.src}`}
          alt=""
          loading="lazy"
          className={crop ? 'is-crop' : undefined}
          style={
            crop
              ? { width: `${crop.w}%`, height: `${crop.h}%`, left: `${crop.left}%`, top: `${crop.top}%` }
              : undefined
          }
        />
        <img className="fc-play" src={`${A}/play.svg`} alt="" />
      </div>
      <h3 className="fc-title" style={card.titleWeight ? { fontWeight: card.titleWeight } : undefined}>
        {card.title}
      </h3>
      <p className="fc-body">{card.body}</p>
      <span className="fc-more">Подробнее</span>
    </article>
  )
}

// Figma 527:2522 (collapsed) and 528:2583 (all faculties open).
export function Faculties() {
  const phone = usePhoneLayout()
  const VISIBLE = phone ? VISIBLE_PHONE : VISIBLE_DESKTOP
  const [expanded, setExpanded] = useState(false)
  const [open, setOpen] = useState<number | null>(null)
  const [closing, setClosing] = useState(false)
  const timer = useRef<number>(0)

  // Opening leaves the page where it is: the rows appear below the visible ones. Folding takes the view to the start of the
  // next block, "Изменить жизнь проще, когда", as the page is much shorter afterwards.
  const toggle = () => {
    const next = document.getElementById('community')
    setExpanded(!expanded)
    if (!expanded || !next) return
    const start = performance.now()
    const land = () => {
      const shift = next.getBoundingClientRect().top
      if (Math.abs(shift) > 0.5) window.scrollBy({ top: shift, behavior: 'instant' })
      if (performance.now() - start < 700) requestAnimationFrame(land)
    }
    requestAnimationFrame(land)
  }

  const openModal = (i: number) => {
    window.clearTimeout(timer.current)
    setClosing(false)
    setOpen(i)
  }

  const closeModal = useCallback(() => {
    setClosing(true)
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => {
      setOpen(null)
      setClosing(false)
    }, 280)
  }, [])

  useEffect(() => {
    if (open === null) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  useEffect(() => () => window.clearTimeout(timer.current), [])

  return (
    <section className="faculties" id="faculties">
      <div className="fc-head">
        <h2 className="fc-heading">Наши наставники</h2>
        <p className="fc-sub">Направления обучения и наставники</p>
      </div>

      <div className="fc-list">
        <div className="fc-grid">
          {COURSES.slice(0, VISIBLE).map((c, i) => (
            <CourseCard course={c} key={c.id} onOpen={() => openModal(i)} />
          ))}
        </div>
        <div className={expanded ? 'fc-extra is-open' : 'fc-extra'} aria-hidden={!expanded}>
          <div className="fc-extra-inner">
            <div className="fc-extra-row">
              {COURSES.slice(VISIBLE).map((c, i) => (
                <CourseCard course={c} key={c.id} onOpen={() => openModal(VISIBLE + i)} focusable={expanded} />
              ))}
            </div>
          </div>
        </div>
      </div>

      <button className="fc-all" type="button" onClick={toggle} aria-expanded={expanded}>
        {expanded ? 'Свернуть' : 'Смотреть больше'}
        <span className="fc-all-icon">
          <ArrowIcon src={`${A}/arrow.svg`} />
        </span>
      </button>

      {open !== null && <Suspense fallback={null}><CourseModal course={COURSES[open]} closing={closing} onClose={closeModal} /></Suspense>}
    </section>
  )
}
