import { useLayoutEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { ArrowIcon } from '../shared/ArrowIcon'
import './FounderPath.css'
import { asset } from '../../lib/asset'

gsap.registerPlugin(ScrollTrigger)

const A = asset('/assets/founder')
const FLOAT_W = 150
const DOCK_AT = 0.995

// Figma 530:2905 (1512x918). Scroll sequence: a small photo appears mid-screen right after the
// mission block, grows fast and docks into the photo slot; then the text comes in, and last the
// signature is "written" from left to right.
export function FounderPath() {
  const sectionRef = useRef<HTMLElement>(null)
  const slotRef = useRef<HTMLDivElement>(null)
  const photoRef = useRef<HTMLImageElement>(null)
  const floatRef = useRef<HTMLImageElement>(null)
  const textRef = useRef<HTMLDivElement>(null)
  const signRef = useRef<HTMLImageElement>(null)

  useLayoutEffect(() => {
    const section = sectionRef.current
    const slot = slotRef.current
    const photo = photoRef.current
    const flt = floatRef.current
    const text = textRef.current
    const sign = signRef.current
    if (!section || !slot || !photo || !flt || !text || !sign) return

    const mm = gsap.matchMedia()
    mm.add('(min-width: 1101px)', () => {
      const parts = [...text.children]
      gsap.set(parts, { opacity: 0, y: 36 })
      gsap.set(sign, { clipPath: 'inset(0 100% 0 0)' })
      gsap.set(photo, { opacity: 0 })

      const reveal = gsap.timeline({ paused: true })
      reveal
        .to(parts, { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out', stagger: 0.14 })
        .to(sign, { clipPath: 'inset(0 0% 0 0)', duration: 1.7, ease: 'power1.inOut' }, '>-0.25')

      let docked = false
      const place = (p: number) => {
        const vw = window.innerWidth
        const vh = window.innerHeight
        const target = slot.getBoundingClientRect()
        const sw = FLOAT_W
        const sh = (FLOAT_W * target.height) / target.width
        // Fast growth: most of the size change happens early, then it settles into the slot.
        const e = 1 - Math.pow(1 - p, 3)
        const w = sw + (target.width - sw) * e
        const h = sh + (target.height - sh) * e
        const cx = vw / 2 + (target.left + target.width / 2 - vw / 2) * e
        const cy = vh / 2 + (target.top + target.height / 2 - vh / 2) * e
        flt.style.width = `${w}px`
        flt.style.height = `${h}px`
        flt.style.left = `${cx - w / 2}px`
        flt.style.top = `${cy - h / 2}px`
        flt.style.opacity = String(Math.min(1, p / 0.08))
        const done = p >= DOCK_AT
        flt.style.visibility = done || p <= 0 ? 'hidden' : 'visible'
        photo.style.opacity = done ? '1' : '0'
        if (done && !docked) {
          docked = true
          reveal.play()
        } else if (!done && docked) {
          docked = false
          reveal.reverse()
        }
      }

      const st = ScrollTrigger.create({
        trigger: section,
        start: 'top bottom',
        end: 'top top',
        scrub: true,
        invalidateOnRefresh: true,
        onUpdate: (self) => place(self.progress),
        onRefresh: (self) => place(self.progress),
      })
      place(st.progress)

      return () => {
        flt.style.visibility = 'hidden'
        photo.style.opacity = ''
      }
    })
    return () => mm.revert()
  }, [])

  return (
    <section className="fp" id="founder-path" ref={sectionRef}>
      <img className="fp-wave" src={`${A}/wave-c.svg`} alt="" />
      <div className="fp-slot" ref={slotRef}>
        <picture>
          <source media="(max-width: 1100px)" srcSet={`${A}/sunset-m.jpg`} />
          <img className="fp-photo" src={`${A}/sunset.jpg`} alt="" ref={photoRef} />
        </picture>
      </div>
      <img className="fp-sign" src={`${A}/signature.svg`} alt="Подпись Андрея Лукина" ref={signRef} />

      <div className="fp-text" ref={textRef}>
        <p className="fp-name">
          <span>Андрей Лукин —</span>
          <br />
          <b>основатель Легендариума</b>
        </p>
        <h2 className="fp-heading">
          <span className="fp-d">
            Моя задача — дать человеку навыки,{' '}
            <br />
            результаты и <em>свободу выбирать,</em>{' '}
            <br />
            <em>как жить и зарабатывать.</em>
          </span>
          <span className="fp-m">
            Моя задача — дать человеку навыки, результаты{' '}
            <br />и <em>свободу выбирать, как жить</em>{' '}
            <br />
            <em>и зарабатывать.</em>
          </span>
        </h2>
        <div className="fp-body">
          <p>
            Вместо теоретиков здесь действующие практики, которые сами хорошо зарабатывают в своих направлениях. Внутри уже
            есть пошаговый план, задания, прямые эфиры и наставники, которым можно лично задать вопрос.
          </p>
          <p>Я сам прошёл этот путь и точно знаю, что помогает двигаться вперёд.</p>
        </div>
        <a className="fp-cta" href="#community">
          Как этот путь прошли участники
          <span className="fp-cta-icon">
            <ArrowIcon src={`${A}/arrow.svg`} />
          </span>
        </a>
      </div>

      <img className="fp-float" src={`${A}/sunset.jpg`} alt="" ref={floatRef} />
    </section>
  )
}
