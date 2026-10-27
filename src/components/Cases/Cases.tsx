import { lazy, Suspense, useCallback, useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { CASES, type CaseData } from './caseData'
import './Cases.css'
import { asset } from '../../lib/asset'

const A = asset('/assets/cases')

const VideoModal = lazy(() => import('./VideoModal').then(module => ({ default: module.VideoModal })))

function CaseRow({ item, onOpen }: { item: CaseData; onOpen: () => void }) {
  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onOpen()
    }
  }
  return (
    <article
      className="cs-row"
      role="button"
      tabIndex={0}
      aria-label={`Смотреть видео: ${item.person}`}
      onClick={onOpen}
      onKeyDown={onKey}
    >
      <div className="cs-main">
        <div className="cs-head">
          <p className="cs-label">{item.label}</p>
          <h3 className="cs-title">{item.title}</h3>
        </div>

        <div className="cs-cols">
          <dl className="cs-facts">
            {item.facts.map((f) => (
              <div key={f.label}>
                <dt>{f.label}</dt>
                <dd>{f.value}</dd>
              </div>
            ))}
          </dl>

          <div className="cs-story">
            <div className="cs-block">
              <p className="cs-k">Было:</p>
              <p className="cs-v cs-was">{item.was}</p>
            </div>
            <div className="cs-block">
              <p className="cs-k">Что сделал:</p>
              {item.steps.map((s, i) => (
                <p className="cs-step" key={i}>
                  <img src={`${A}/check.svg`} alt="" />
                  <span>{s}</span>
                </p>
              ))}
            </div>
          </div>

          <div className="cs-proof">
            <p className="cs-k">Подтверждённый результат:</p>
            <p className="cs-gold" style={{ fontWeight: item.resultWeight }}>
              {item.result}
            </p>
          </div>
        </div>
      </div>

      <div className="cs-media">
        <div className="cs-thumb">
          <img className="cs-poster" src={`${A}/${item.poster}`} alt="" loading="lazy" />
          <img className="cs-play" src={`${A}/play.svg`} alt="" />
        </div>
        <p className="cs-who">
          <b>{item.person}</b>
          <span>{item.summary}</span>
        </p>
      </div>
    </article>
  )
}

// Figma 530:4922. A click on a case (or its play button) opens the video player.
export function Cases() {
  const [open, setOpen] = useState<number | null>(null)
  const [closing, setClosing] = useState(false)
  const timer = useRef<number>(0)

  const openCase = (i: number) => {
    window.clearTimeout(timer.current)
    setClosing(false)
    setOpen(i)
  }

  const close = useCallback(() => {
    setClosing(true)
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => {
      setOpen(null)
      setClosing(false)
    }, 250)
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
    <section className="cases" id="cases">
      <h2 className="cs-heading">
        Это результаты конкретных{' '}
        <br />
        участников сообщества
      </h2>
      <p className="cs-sub">Всё возможно, если выполнять рекомендации наставников.</p>

      <div className="cs-list">
        {CASES.map((c, i) => (
          <CaseRow item={c} key={c.id} onOpen={() => openCase(i)} />
        ))}
      </div>

      {open !== null && <Suspense fallback={null}><VideoModal item={CASES[open]} closing={closing} onClose={close} /></Suspense>}
    </section>
  )
}
