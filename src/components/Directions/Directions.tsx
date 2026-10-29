import { useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import { DIRECTION_CARDS } from './cards'
import { ArrowIcon } from '../shared/ArrowIcon'
import { Lines } from '../shared/Lines'
import { useSmallPhone } from '../../lib/usePhoneLayout'
import './Directions.css'
import { asset } from '../../lib/asset'

const A = asset('/assets/directions')

// On a phone the list opens with four directions and goes on after "Смотреть больше" (Figma 807:3582 / 807:3516), in
// the order of that design; on a tablet and a computer all the directions are shown at once.
const PHONE_ORDER = ['c01', 'c09', 'c03', 'c12', 'c02', 'c04', 'c05', 'c06', 'c07', 'c08', 'c10', 'c11']
const PHONE_FIRST = 4

const byId = new Map(DIRECTION_CARDS.map((card) => [card.id, card]))
const PHONE_CARDS = PHONE_ORDER.map((id) => byId.get(id)!).filter(Boolean)

// Figma 642:3463 (computer) and 807:3582 / 807:3516 (phone): the list of all the directions.
export function Directions() {
  const phone = useSmallPhone()
  const [expanded, setExpanded] = useState(false)
  const cards = phone ? PHONE_CARDS : DIRECTION_CARDS
  const shown = phone && !expanded ? cards.slice(0, PHONE_FIRST) : cards

  const sectionRef = useRef<HTMLElement>(null)

  const toggle = () => {
    const next = !expanded
    const section = sectionRef.current
    flushSync(() => setExpanded(next))
    // folding the list back: the page is much shorter now, so go to the top of the block (not to the mentors below it)
    if (!next && section) {
      const land = () => window.scrollTo({ top: Math.max(0, Math.round(section.getBoundingClientRect().top + window.scrollY)), behavior: 'instant' })
      land()
      requestAnimationFrame(land)
    }
  }

  return (
    <section className="directions" id="directions" ref={sectionRef}>
      <div className="dl">
        <div className="dl-head">
          <h2 className="dl-heading">
            {phone ? (
              <>
                Одна проверенная система{' '}
                <br />
                работы в онлайне
              </>
            ) : (
              <>
                Направления в Легендариуме{' '}
                <br />
                для заработка онлайн
              </>
            )}
          </h2>
          <p className="dl-sub">
            Начни с того, что ближе. Остальные направления подключай, когда они понадобятся для следующей задачи.
          </p>
        </div>

        <ul className="dl-grid">
          {shown.map((c) => (
            <li className={`dl-card dl-card--${c.id}${c.dark ? ' dl-card--dark' : ''}`} key={c.id}>
              <img className="dl-photo" src={`${A}/${c.image}`} alt="" loading="lazy" />
              {c.fade && <span className="dl-fade" style={{ background: c.fade }} />}
              <div className="dl-text">
                <h3 className="dl-title">
                  <Lines lines={c.title} />
                </h3>
                <p className="dl-body">
                  <Lines lines={c.body} />
                </p>
              </div>
            </li>
          ))}
        </ul>

        {phone && (
          <button type="button" className="dl-toggle" aria-expanded={expanded} onClick={toggle}>
            {expanded ? 'Свернуть' : 'Смотреть больше'}
            <span className="dl-toggle-icon">
              <ArrowIcon src={`${A}/arrow.svg`} />
            </span>
          </button>
        )}
      </div>
    </section>
  )
}
