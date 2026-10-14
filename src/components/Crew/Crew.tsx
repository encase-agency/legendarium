import { useState } from 'react'
import { Lines } from '../shared/Lines'
import './Crew.css'
import { asset } from '../../lib/asset'

const A = asset('/assets/people')

// Figma "Анимация блока" (frames 518:2236, 521:2354, 521:2392, 521:2429): four
// states, one per expanded column. Default (525:2485): all four at 340px.
const COLUMNS = [
  {
    id: 'platform',
    title: 'Платформа',
    body: ['12+ направлений, уроки, задания,', 'шаблоны и контрольные точки.'],
    strong: 'Доступ 12 месяцев.',
  },
  {
    id: 'mentors',
    title: 'Наставники',
    body: ['Прямые эфиры. Проверка работ,', 'ответы на вопросы по конкретной', 'задаче.'],
    mBody: ['Прямые эфиры. Проверка работ,', 'ответы на вопросы по конкретной задаче.'],
  },
  {
    id: 'andrey',
    title: 'Андрей Лукин',
    body: [
      'Разборы от Дяди Андрея, который',
      'благодаря навыкам ушёл с госслужбы и',
      'начал зарабатывать в интернете. Теперь',
      'передаёт эти навыки и опыт ученикам.',
    ],
    mBody: [
      'Разборы от Дяди Андрея, который благодаря навыкам ушёл с госслужбы и начал зарабатывать в интернете.',
      'Теперь передаёт эти навыки и опыт ученикам.',
    ],
  },
  {
    id: 'community',
    title: 'Сообщество',
    body: ['Общий чат, чаты факультетов,', 'обмен опытом и задачами,', 'офлайн-встречи.'],
  },
] as const satisfies readonly {
  id: string
  title: string
  body: readonly string[]
  mBody?: readonly string[]
  strong?: string
}[]

export function Crew() {
  const [active, setActive] = useState<number | null>(null)

  return (
    <section className="crew" id="crew">
      <div className="cw-row" data-active={active ?? 'none'} onMouseLeave={() => setActive(null)}>
        {COLUMNS.map((c, i) => (
          <div
            key={c.id}
            className={i === active ? 'cw-col is-active' : 'cw-col'}
            tabIndex={0}
            onMouseEnter={() => setActive(i)}
            onFocus={() => setActive(i)}
            onClick={() => setActive(i)}
          >
            <figure className={`cw-photo cw-photo--${c.id}`}>
              {c.id === 'mentors' && (
                <img className="cw-base" src={`${A}/mentors-base.jpg`} alt="" decoding="async" />
              )}
              <img className="cw-zoom" src={`${A}/${c.id}.jpg`} alt="" decoding="async" />
            </figure>
            <div className={`cw-caption cw-caption--${c.id}`}>
              <h3 className="cw-title">{c.title}</h3>
              <p className="cw-body">
                <Lines lines={c.body} className={'mBody' in c ? 'cw-d' : undefined} />
                {'mBody' in c && <Lines lines={c.mBody} className="cw-m" />}
                {'strong' in c && (
                  <>
                    <br className="cw-keep" />
                    <strong>{c.strong}</strong>
                  </>
                )}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
