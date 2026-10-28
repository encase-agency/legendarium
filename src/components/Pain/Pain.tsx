import { useRef, type CSSProperties } from 'react'
import { useCardReveal } from '../../lib/motion'
import { ArrowIcon } from '../shared/ArrowIcon'
import './Pain.css'
import { asset } from '../../lib/asset'

const ASSETS = asset('/assets/pain')

type Icon =
  | { src: string; w: number; fit: 'fill' | 'cover' }
  | { src: string; w: number; fit: 'sprite'; img: { w: number; h: number; left: number; top: number } }

interface Card {
  x: number
  y: number
  icon: Icon
  title: string[]
  body: string[]
  /** line breaks of the phone layout (Figma 530:4840) */
  mTitle: string[]
  mBody?: string[]
}

// Positions are px in the 1512x900 Figma frame (513:1876).
const CARDS: Card[] = [
  {
    x: 50,
    y: 229,
    icon: { src: 'icon-1.png', w: 63, fit: 'fill' },
    title: ['Отдаёшь лучшие', 'годы работе в найме'],
    mTitle: ['Отдаёшь лучшие', 'годы работе', 'в найме'],
    mBody: ['А собственная жизнь', 'продолжает проходить', 'мимо.'],
    body: ['А собственная жизнь продолжает', 'проходить мимо.'],
  },
  {
    x: 406,
    y: 229,
    icon: { src: 'icon-2.png', w: 63, fit: 'cover' },
    title: ['Живёшь от зарплаты', 'до зарплаты'],
    mTitle: ['Живёшь', 'от зарплаты', 'до зарплаты'],
    mBody: ['Приходится ждать', 'до конца месяца,', 'когда хочешь', 'что-то себе купить.'],
    body: ['Приходится ждать до конца месяца,', 'когда хочешь что-то себе купить.'],
  },
  {
    x: 762,
    y: 229,
    icon: { src: 'icon-3.png', w: 59, fit: 'fill' },
    title: ['Работа забирает всё', 'время, а денег особо нет'],
    mTitle: ['Работа забирает всё', 'время,', 'а денег особо нет'],
    body: ['Кажется, будто ты застрял и выхода не', 'видно.'],
  },
  {
    x: 1118,
    y: 229,
    icon: { src: 'icon-4.png', w: 50, fit: 'fill' },
    title: ['Хочешь обеспечить семью', 'и родителей'],
    mTitle: ['Хочешь обеспечить', 'семью', 'и родителей'],
    body: ['Но не понимаешь, какой шаг сделать', 'первым.'],
  },
  {
    x: 406,
    y: 541,
    icon: {
      src: 'icon-5.png',
      w: 59,
      fit: 'sprite',
      img: { w: 577.69, h: 198.36, left: -379.94, top: -56.67 },
    },
    title: ['Уже пытался зарабатывать', 'в интернете'],
    mTitle: ['Уже пытался', 'зарабатывать', 'в интернете'],
    mBody: ['Ничего не получилось,', 'и теперь страшно', 'снова потерять время', 'и деньги.'],
    body: ['Ничего не получилось, и теперь', 'страшно снова потерять время', 'и деньги.'],
  },
  {
    x: 762,
    y: 541,
    icon: { src: 'icon-6.png', w: 59, fit: 'fill' },
    title: ['Работаешь в онлайне,', 'но упёрся в потолок'],
    mTitle: ['Работаешь', 'в онлайне,', 'но упёрся в потолок'],
    mBody: ['Зарплата не растёт,', 'а цены в магазинах', 'становятся всё выше'],
    body: ['Зарплата не растёт, а цены', 'в магазинах становятся всё выше'],
  },
]

function Lines({ lines, className }: { lines: string[]; className?: string }) {
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

function CardIcon({ icon }: { icon: Icon }) {
  const box = { '--w': icon.w } as CSSProperties
  if (icon.fit === 'sprite') {
    return (
      <div className="pn-icon pn-icon--clip" style={box}>
        <img
          src={`${ASSETS}/${icon.src}`}
          alt=""
          style={{
            width: `${icon.img.w}%`,
            height: `${icon.img.h}%`,
            left: `${icon.img.left}%`,
            top: `${icon.img.top}%`,
          }}
        />
      </div>
    )
  }
  return (
    <div className="pn-icon" style={box}>
      <img className={icon.fit === 'cover' ? 'pn-fit-cover' : 'pn-fit-fill'} src={`${ASSETS}/${icon.src}`} alt="" />
    </div>
  )
}

export function Pain() {
  const ref = useRef<HTMLElement>(null)
  useCardReveal(ref, '.pn-card')
  return (
    <section className="pain" id="pain" ref={ref}>
      <h2 className="pn-heading">Когда пора что-то менять?</h2>
      <p className="pn-sub">Когда хочется изменить свою работу и доход, но пока непонятно, с чего начать.</p>

      {CARDS.map((c) => (
        <article
          className="pn-card"
          key={c.title[0]}
          style={{ '--x': c.x, '--y': c.y } as CSSProperties}
        >
          <div className="pn-col">
            <div className="pn-top">
              <CardIcon icon={c.icon} />
              <h3 className="pn-title">
                <Lines lines={c.title} className="pn-d" />
                <Lines lines={c.mTitle} className="pn-m" />
              </h3>
            </div>
            <p className="pn-body">
              <Lines lines={c.body} className={c.mBody ? 'pn-d' : undefined} />
              {c.mBody && <Lines lines={c.mBody} className="pn-m" />}
            </p>
          </div>
        </article>
      ))}

      <a className="pn-card pn-card--cta" href="#directions" style={{ '--x': 1118, '--y': 541 } as CSSProperties}>
        <p className="pn-cta-title">
          <span className="pn-d">
            Выбрать направление
            <br />
            и выйти
            <br />из матрицы
          </span>
          <span className="pn-m">
            Выбрать направление
            <br />и выйти из матрицы
          </span>
        </p>
        <span className="pn-cta-icon">
          <ArrowIcon src={`${ASSETS}/arrow.svg`} />
        </span>
      </a>
    </section>
  )
}
