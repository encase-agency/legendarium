import { useLayoutEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { Lines } from '../shared/Lines'
import './Platform.css'
import { asset } from '../../lib/asset'

gsap.registerPlugin(ScrollTrigger)

const A = asset('/assets/platform')

const STEPS: { text: string; m?: string[] }[] = [
  { text: 'Создаёшь с ИИ картинки, дизайн и тексты для бизнеса.' },
  {
    text: 'Показываешь работы, чтобы клиенты захотели у тебя заказать.',
    m: ['Показываешь работы, чтобы клиенты захотели', 'у тебя заказать.'],
  },
  { text: 'Обсуждаешь задачу и цену, выполняешь заказ.' },
  {
    text: 'Получаешь оплату. Мы учим всему пути — от первых навыков до работы с клиентами.',
    m: ['Получаешь оплату. Мы учим всему', 'пути — от первых навыков до работы с', 'клиентами.'],
  },
]

// Figma 517:2205. Desktop: the section pins, card 2 slides up and lands on
// card 1 while card 1 narrows and dims. Mobile: both cards just stack.
export function Platform() {
  const sectionRef = useRef<HTMLElement>(null)
  const firstRef = useRef<HTMLElement>(null)
  const shadeRef = useRef<HTMLDivElement>(null)
  const secondRef = useRef<HTMLElement>(null)

  useLayoutEffect(() => {
    const section = sectionRef.current
    const first = firstRef.current
    const shade = shadeRef.current
    const second = secondRef.current
    if (!section || !first || !shade || !second) return

    const mm = gsap.matchMedia()
    mm.add('(min-width: 1101px)', () => {
      gsap.set(first, { transformOrigin: '50% 0%' })
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: () => `+=${Math.round(window.innerHeight * 1.1)}`,
          pin: true,
          scrub: 0.5,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        },
      })
      tl.fromTo(second, { y: () => window.innerHeight }, { y: 0, ease: 'none', duration: 1 }, 0)
      tl.to(first, { scale: 0.92, ease: 'none', duration: 1 }, 0)
      tl.to(shade, { opacity: 0.6, ease: 'none', duration: 1 }, 0)
      tl.to({}, { duration: 0.2 })
    })
    // Phone / tablet: the same mechanic. The block is pinned, card 2 slides up over card 1 (which narrows and dims),
    // then the block stays pinned for one more screen while the next block ("Платформа / Наставники ...") rolls over it.
    mm.add('(max-width: 1100px)', () => {
      gsap.set(first, { transformOrigin: '50% 0%' })
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: () => `+=${Math.round(window.innerHeight * 2.1)}`,
          pin: true,
          scrub: 0.5,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        },
      })
      tl.fromTo(second, { y: () => window.innerHeight }, { y: 0, ease: 'none', duration: 1 }, 0)
      tl.to(first, { scale: 0.92, ease: 'none', duration: 1 }, 0)
      tl.to(shade, { opacity: 0.6, ease: 'none', duration: 1 }, 0)
      tl.to({}, { duration: 1.29 })
    })
    return () => mm.revert()
  }, [])

  return (
    <section className="platform" id="platform" ref={sectionRef}>
      <div className="pf-stack">
        <article className="pf-card pf-card--1" ref={firstRef}>
          <div className="pf-photo">
            <img src={`${A}/diploma.jpg`} alt="" decoding="async" />
          </div>
          <div className="pf-text">
            <div className="pf-top">
              <h2 className="pf-heading">
                Образовательная платформа, мужское{' '}
                <br />
                сообщество и помощь наставников{' '}
                <br />
                <em>в одном месте</em>
              </h2>
              <p className="pf-sub pf-sub--dim">Смотришь, пробуешь, выбираешь основное уже внутри.</p>
            </div>
            <p className="pf-simple">Легендариум простыми словами</p>
          </div>
          <div className="pf-shade" ref={shadeRef} />
        </article>

        <article className="pf-card pf-card--2" ref={secondRef}>
          <div className="pf-photo">
            <img src={`${A}/plane.jpg`} alt="" decoding="async" />
          </div>
          <div className="pf-text">
            <div className="pf-top">
              <h2 className="pf-heading">
                Доступ ко всем направлениям <em>сразу</em>
              </h2>
              <p className="pf-sub">Навыки усиливают друг друга</p>
            </div>
            <ol className="pf-steps">
              {STEPS.map((step, i) => (
                <li key={step.text} className={i === STEPS.length - 1 ? 'is-strong' : undefined}>
                  <span className="pf-n">{i + 1}</span>
                  <span className="pf-t">
                    <span className={step.m ? 'pf-d' : undefined}>{step.text}</span>
                    {step.m && <Lines lines={step.m} className="pf-m" />}
                  </span>
                </li>
              ))}
            </ol>
          </div>
        </article>
      </div>
    </section>
  )
}
