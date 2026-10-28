import type { KeyboardEvent } from 'react'
import type { CaseData } from './caseData'
import { asset } from '../../lib/asset'

const A = asset('/assets/cases')

/** One case (or review) row: the whole row, and the play button in it, opens the video. */
export function CaseRow({ item, onOpen }: { item: CaseData; onOpen: () => void }) {
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
          <h3 className={item.wide ? 'cs-title is-wide' : 'cs-title'}>{item.title}</h3>
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

          {item.was && item.steps && (
            <div className="cs-story">
              <div className="cs-block">
                <p className="cs-k">{item.wasLabel ?? 'Было:'}</p>
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
          )}

          {item.result && (
            <div className="cs-proof">
              <p className="cs-k">Результат участника:</p>
              <p className="cs-gold">{item.result}</p>
            </div>
          )}
        </div>
      </div>

      <div className="cs-media">
        <div className="cs-thumb">
          <img className="cs-poster" src={`${A}/${item.poster}`} alt="" loading="lazy" decoding="async" />
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
