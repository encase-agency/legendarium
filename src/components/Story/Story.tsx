import { useLayoutEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import './Story.css'
import { asset } from '../../lib/asset'

gsap.registerPlugin(ScrollTrigger)

const A = asset('/assets/story')
const G = asset('/assets/pricing2')

const LIST_3 = [
  'Можно с нуля, даже если ещё не выбрал направление',
  'Доступ на 12 месяцев.',
  'Наставники, разборы и сообщество.',
  'Образовательная лицензия и договор.',
]

const LIST_4 = ['Доступ после оплаты', 'Первый платёж по рассрочке — через 30 дней.', 'Отмена по условиям оферты']

/** How far each card narrows / dims once 1, 2 or 3 cards lie on top of it. */
const SCALE = [1, 0.92, 0.89, 0.86]
const SHADE = [0, 0.6, 0.75, 0.85]
/** After the last card has landed the stack settles: every card narrows to ~0.9 (1315px) as in the footer frame. */
const SETTLE = [0.86, 0.88, 0.9, 0.9]

// Figma 542:6319. Same mechanic as the Platform block: the section pins and every next card slides up
// onto the previous one, while the cards below narrow and dim. Mobile: cards just stack.
export function Story() {
  const sectionRef = useRef<HTMLElement>(null)
  const stackRef = useRef<HTMLDivElement>(null)
  const cardRefs = useRef<(HTMLElement | null)[]>([])
  const shadeRefs = useRef<(HTMLDivElement | null)[]>([])

  useLayoutEffect(() => {
    const section = sectionRef.current
    const stack = stackRef.current
    const cards = cardRefs.current.filter(Boolean) as HTMLElement[]
    const shades = shadeRefs.current.filter(Boolean) as HTMLDivElement[]
    if (!section || !stack || cards.length < 2) return

    const mm = gsap.matchMedia()
    mm.add('(min-width: 1101px)', () => {
      gsap.set(cards, { transformOrigin: '50% 0%' })
      const steps = cards.length - 1
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: () => `+=${Math.round(window.innerHeight * 0.815 * (steps * 1.15 + 1.35))}`,
          pin: true,
          scrub: 0.5,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        },
      })
      for (let i = 1; i <= steps; i++) {
        const at = (i - 1) * 1.15
        tl.fromTo(cards[i], { y: () => window.innerHeight }, { y: 0, ease: 'none', duration: 1 }, at)
        for (let j = 0; j < i; j++) {
          const depth = i - j
          tl.fromTo(cards[j], { scale: SCALE[depth - 1] }, { scale: SCALE[depth], ease: 'none', duration: 1 }, at)
          if (shades[j]) {
            tl.fromTo(shades[j], { opacity: SHADE[depth - 1] }, { opacity: SHADE[depth], ease: 'none', duration: 1 }, at)
          }
        }
      }
      // Settle: the stack narrows, the page goes light for the footer and the last card casts a shadow.
      const end = steps * 1.15 + 0.15
      tl.to(section, { backgroundColor: '#f4f4f4', ease: 'none', duration: 1 }, end)
      cards.forEach((c, i) => tl.to(c, { scale: SETTLE[i], ease: 'none', duration: 1 }, end))
      // The stack sinks until the last card rests on the bottom edge of the section, so the footer starts right under it.
      tl.to(
        stack,
        {
          y: () => {
            const u = stack.offsetWidth / 1464
            return Math.max(0, section.offsetHeight / 2 - 213.6 * u)
          },
          ease: 'none',
          duration: 1,
        },
        end,
      )
      tl.fromTo(
        cards[cards.length - 1],
        { boxShadow: '0 -12px 40px rgba(0,0,0,0.35)' },
        { boxShadow: '0 34px 70px rgba(0,0,0,0.38)', ease: 'none', duration: 1 },
        end,
      )
      tl.to({}, { duration: 0.2 })
    })
    return () => mm.revert()
  }, [])

  const card = (i: number) => ({
    ref: (el: HTMLElement | null) => {
      cardRefs.current[i] = el
    },
  })
  const shade = (i: number) => (
    <div
      className="sy-shade"
      ref={(el) => {
        shadeRefs.current[i] = el
      }}
    />
  )

  return (
    <section className="sy" id="story" ref={sectionRef}>
      <div className="sy-stack" ref={stackRef}>
        {/* 1 */}
        <article className="sy-card" {...card(0)}>
          <div className="sy-photo">
            <img src={`${A}/s1.jpg`} alt="" loading="lazy" decoding="async" />
          </div>
          <div className="sy-text">
            <div className="sy-top">
              <h2 className="sy-heading">
                Через год ты в любом случае{' '}
                <br />
                будешь на год старше
              </h2>
              <p className="sy-lead">Вопрос только в том, будет ли твой доход целиком зависеть от одного места.</p>
            </div>
            <div className="sy-steps">
              <div className="sy-step">
                <p className="sy-n">Шаг 1</p>
                <p className="sy-t">
                  Не увольняйся. Начни параллельно{' '}
                  <br />с основной работой.
                </p>
              </div>
              <div className="sy-step">
                <p className="sy-n">Шаг 2</p>
                <p className="sy-t">
                  Выбери направление, найди первых клиентов и заработай. А после решишь, уходить ли из найма.
                </p>
              </div>
            </div>
          </div>
          {shade(0)}
        </article>

        {/* 2 */}
        <article className="sy-card" {...card(1)}>
          <div className="sy-photo">
            <img src={`${A}/s2.jpg`} alt="" loading="lazy" decoding="async" />
          </div>
          <div className="sy-text">
            <h2 className="sy-heading">
              Легендариум даёт то,{' '}
              <br />
              чего не хватает{' '}
              <br />в одиночку:
            </h2>
            <div className="sy-badges">
              <div className="sy-col">
                <Badge n={1} text="Маршрут" />
                <Badge n={2} text="Разборы наставников" />
              </div>
              <div className="sy-col">
                <Badge n={3} text="Практику" />
                <Badge n={4} text="Сильное окружение" />
              </div>
            </div>
          </div>
          {shade(1)}
        </article>

        {/* 3 */}
        <article className="sy-card" {...card(2)}>
          <div className="sy-photo">
            <img src={`${A}/s3.jpg`} alt="" loading="lazy" decoding="async" />
          </div>
          <div className="sy-text">
            <h2 className="sy-heading sy-heading--semi">
              12+ направлений, которые{' '}
              <br />
              помогают друг другу
            </h2>
            <ol className="sy-list">
              {LIST_3.map((t, i) => (
                <li key={t}>
                  <span className="sy-n">{i + 1}</span>
                  <span className="sy-t">{t}</span>
                </li>
              ))}
            </ol>
            <Widget />
          </div>
          {shade(2)}
        </article>

        {/* 4 */}
        <article className="sy-card" {...card(3)}>
          <div className="sy-photo">
            <img src={`${A}/s4.jpg`} alt="" loading="lazy" decoding="async" />
          </div>
          <div className="sy-text">
            <h2 className="sy-heading sy-heading--tall">
              Будь среди тех, кто{' '}
              <br />
              делает тебя сильнее!
            </h2>
            <div className="sy-list-wrap">
              <ol className="sy-list">
                {LIST_4.map((t, i) => (
                  <li key={t}>
                    <span className="sy-n">{i + 1}</span>
                    <span className="sy-t">{t}</span>
                  </li>
                ))}
              </ol>
              <a className="sy-go" href="#pricing">
                <img src={`${A}/disc.svg`} alt="" />
                <span>
                  Оставить{' '}
                  <br />
                  заявку
                </span>
              </a>
            </div>
          </div>
        </article>
      </div>
    </section>
  )
}

function Badge({ n, text }: { n: number; text: string }) {
  return (
    <div className="sy-badge">
      <span className="sy-num">
        <img src={`${A}/n${n}.png`} alt="" />
      </span>
      <span className="sy-bt">{text}</span>
    </div>
  )
}

// The mini "Легенда" plan card inside card 3.
function Widget() {
  return (
    <div className="sy-widget">
      <div className="sy-gold" aria-hidden="true">
        <img src={`${A}/widget-gold.jpg`} alt="" />
      </div>
      <div className="sy-w-head">
        <p className="sy-w-name">Легенда</p>
        <div className="sy-w-prices">
          <div className="sy-w-row">
            <p className="sy-w-old">
              70 800 ₽<span />
            </p>
            <p className="sy-w-price">
              <span>49 900 ₽/</span>
              <small>год</small>
            </p>
          </div>
          <p className="sy-w-save">Выгода 20 900 ₽ - ты платишь на 30% меньше</p>
        </div>
      </div>
      <div className="sy-w-boxes">
        <div className="sy-w-box sy-w-inst">
          <div className="sy-w-inst-top">
            <div className="sy-w-inst-l">
              <p className="sy-w-title">Рассрочка</p>
              <div className="sy-w-banks">
                <span className="sy-bank sy-bank--a">
                  <img src={`${G}/bank-a.png`} alt="Т-Банк" />
                </span>
                <span className="sy-bank sy-bank--b">
                  <img src={`${G}/bank-b.png`} alt="Сбер" />
                </span>
                <span className="sy-bank sy-bank--c">
                  <img src={`${G}/bank-c.png`} alt="Яндекс Сплит" />
                </span>
              </div>
            </div>
            <div className="sy-w-inst-r">
              <p className="sy-w-sum">
                <span>4 158 ₽/</span>
                <small>мес</small>
              </p>
              <p className="sy-w-s sy-w-s--95">без % и переплат 140 ₽/день</p>
            </div>
          </div>
          <div className="sy-w-first">
            <p className="sy-w-m">Первый платеж только через 30 дней</p>
            <p className="sy-w-s">Есть время получить первые заказы и оплачивать рассрочку с заработанных денег.</p>
          </div>
        </div>
        <div className="sy-w-box sy-w-proof">
          <img src={`${A}/check.svg`} alt="" />
          <div>
            <p className="sy-w-m">
              87% студентов находят первые заказы{' '}
              <br />в первый месяц
            </p>
            <p className="sy-w-s">Оплачивают рассрочку с заработанных средств.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
