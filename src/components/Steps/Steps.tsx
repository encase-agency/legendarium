import type { CSSProperties } from 'react'
import { ArrowIcon } from '../shared/ArrowIcon'
import { Lines } from '../shared/Lines'
import './Steps.css'
import { asset } from '../../lib/asset'

// Positions are px in the 1512x829 Figma frame (517:2163).
const CARDS: readonly {
  n: string
  x: number
  y: number
  w: number
  title: string
  body: readonly string[]
  /** phone layout line breaks when they differ from the desktop ones */
  mBody?: readonly string[]
}[] = [
  { n: '01', x: 50, y: 293, w: 343, title: 'Маршрут', body: ['Понятно, что делать сегодня, на этой', 'неделе и после первой ошибки.'] },
  { n: '02', x: 406, y: 293, w: 344, title: 'Практика', body: ['Не копишь знания. Делаешь работу,', 'которую можно показать заказчику.'] },
  { n: '03', x: 761, y: 293, w: 344, title: 'Живые разборы', body: ['Наставник смотрит твою задачу и', 'объясняет, что исправить.'], mBody: ['Наставник смотрит твою задачу', 'и объясняет, что исправить.'] },
  { n: '04', x: 1118, y: 293, w: 343, title: 'Сообщество', body: ['Рядом люди, которые уже прошли', 'следующий шаг и могут подсказать.'] },
  { n: '05', x: 761, y: 523, w: 344, title: 'Время', body: ['Доступ на год. Одна тяжёлая неделя не', 'выбивает из процесса.'] },
]

export function Steps() {
  return (
    <section className="steps" id="route">
      <h2 className="sp-heading">
        Понятные шаги. Практика.{' '}
        <br />
        Поддержка на каждом этапе
      </h2>
      <p className="sp-side">
        <Lines
          className="sp-d"
          lines={[
            'Живые наставники, которые знают, что конкретно',
            'шаг за шагом нужно делать.',
            'Они уже зарабатывают, повторяй их шаги, так',
            'проще дойти до результата.',
          ]}
        />
        <Lines
          className="sp-m"
          lines={[
            'Живые наставники, которые знают,',
            'что конкретно шаг за шагом нужно делать.',
            'Они уже зарабатывают, повторяй их шаги,',
            'так проще дойти до результата.',
          ]}
        />
      </p>

      {CARDS.map((c) => (
        <article className="sp-card" key={c.n} style={{ '--x': c.x, '--y': c.y, '--w': c.w } as CSSProperties}>
          <div className="sp-top">
            <p className="sp-num">{c.n}</p>
            <h3 className="sp-title">{c.title}</h3>
          </div>
          <p className="sp-body">
            <Lines lines={c.body} className={c.mBody ? 'sp-d' : undefined} />
            {c.mBody && <Lines lines={c.mBody} className="sp-m" />}
          </p>
        </article>
      ))}

      <a className="sp-card sp-card--cta" href="#platform" style={{ '--x': 1118, '--y': 523, '--w': 343 } as CSSProperties}>
        <p className="sp-cta-title">Что внутри</p>
        <p className="sp-cta-text">
          Платформа, уроки, задания, проверка{' '}
          <br />
          твоих работ, ответы наставника.
        </p>
        <span className="sp-cta-icon">
          <ArrowIcon src={asset('/assets/steps/arrow.svg')} />
        </span>
      </a>
    </section>
  )
}
