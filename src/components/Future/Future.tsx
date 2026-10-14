import type { CSSProperties } from 'react'
import './Future.css'
import { asset } from '../../lib/asset'

const A = asset('/assets/future')

const CARDS = [
  {
    x: 50,
    icon: 'basketball',
    title: ['Скоро половину работы', 'заберут нейросети'],
    body: ['Можно ждать, пока это', 'ударит по тебе.'],
    mTitle: ['Скоро половину', 'работы заберут', 'нейросети'],
    mBody: ['Можно ждать, пока это', 'ударит по тебе.'],
  },
  {
    x: 297,
    icon: 'flag',
    title: ['А можно самому', 'освоить навык'],
    body: ['Который кормит из любой', 'точки мира.'],
    mTitle: ['А можно самому', 'освоить навык'],
    mBody: ['Который кормит', 'из любой точки мира.'],
  },
] as const

function Lines({ lines, className }: { lines: readonly string[]; className?: string }) {
  const items = (
    <>
      {lines.map((line, i) => (
        <span key={line}>
          {line}
          {i < lines.length - 1 && (
            <>
              {' '}
              <br />
            </>
          )}
        </span>
      ))}
    </>
  )
  return className ? <span className={className}>{items}</span> : items
}

// Figma 515:2068. Icon geometry copies the design's nested boxes: a 44px
// orange tile (rotated 180deg as in the file) holding a 24px icon box.
export function Future() {
  return (
    <section className="future" id="future">
      <img className="fu-wave" src={`${A}/wave.svg`} alt="" />

      <div className="fu-text">
        <h2 className="fu-heading">
          <em>Легендариум</em> — это и есть выход.{' '}
          <br />
          Не ещё один курс,{' '}
          <br className="fu-mbr" />а другой{' '}
          <br />
          способ зарабатывать и жить
        </h2>
        <p className="fu-lead">
          Система выжимает тебя как лимон. А когда перестанешь быть{' '}
          <br />
          нужен — выбросит, как отработанный винтик. И пенсии этой{' '}
          <br />
          хватит разве что на лекарства.
        </p>
      </div>

      {CARDS.map((c) => (
        <article className="fu-card" key={c.icon} style={{ '--x': c.x } as CSSProperties}>
          <span className="fu-tile">
            <span className={`fu-glyph fu-glyph--${c.icon}`}>
              <img src={`${A}/${c.icon}.svg`} alt="" />
            </span>
          </span>
          <div className="fu-card-text">
            <h3 className="fu-card-title">
              <Lines lines={c.title} className="fu-d" />
              <Lines lines={c.mTitle} className="fu-m" />
            </h3>
            <p className="fu-card-body">
              <Lines lines={c.body} className="fu-d" />
              <Lines lines={c.mBody} className="fu-m" />
            </p>
          </div>
        </article>
      ))}

      <figure className="fu-photo fu-photo--a">
        <img src={`${A}/p300.jpg`} alt="" />
      </figure>
      <figure className="fu-photo fu-photo--b">
        <img src={`${A}/p302.jpg`} alt="" />
      </figure>
      <figure className="fu-photo fu-photo--c">
        <img src={`${A}/p303.jpg`} alt="" />
      </figure>
      <figure className="fu-photo fu-photo--d">
        <img src={`${A}/p301.jpg`} alt="" />
      </figure>
    </section>
  )
}
