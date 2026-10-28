import { useLayoutEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { ArrowIcon } from '../shared/ArrowIcon'
import './FounderPath.css'
import { asset } from '../../lib/asset'

gsap.registerPlugin(ScrollTrigger)

const A = asset('/assets/founder')
// Figma 530:2905 (1512x918). The text is static. Once the visitor has scrolled to this block (and the photo has
// loaded) the photo drops in from the top edge of the screen and settles into its slot; the signature follows it.
export function FounderPath() {
  const sectionRef = useRef<HTMLElement>(null)
  const slotRef = useRef<HTMLDivElement>(null)
  const photoRef = useRef<HTMLImageElement>(null)
  const signRef = useRef<HTMLImageElement>(null)

  useLayoutEffect(() => {
    const section = sectionRef.current
    const slot = slotRef.current
    const photo = photoRef.current
    const sign = signRef.current
    if (!section || !slot || !photo || !sign) return

    const mm = gsap.matchMedia()
    mm.add('(min-width: 1101px) and (prefers-reduced-motion: no-preference)', () => {
      gsap.set(photo, { opacity: 0 })
      gsap.set(sign, { opacity: 0 })

      let tl: gsap.core.Timeline | undefined
      let dead = false
      const play = async () => {
        // the photo must be fully loaded before it flies in
        try {
          await photo.decode()
        } catch {
          /* a failed decode still lets the block show */
        }
        if (dead) return
        const r = slot.getBoundingClientRect()
        // start just above the top edge of the screen
        const fromY = -(r.top + r.height + 60)
        tl = gsap.timeline({ delay: 0.35 })
        tl.fromTo(
          photo,
          { y: fromY, rotation: -6, scale: 0.92, opacity: 1, transformOrigin: '50% 50%' },
          { y: 0, rotation: 0, scale: 1, duration: 1.3, ease: 'power3.out', clearProps: 'transform' },
        )
        tl.fromTo(sign, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.7, ease: 'power2.out', clearProps: 'transform' }, '>-0.3')
      }

      const st = ScrollTrigger.create({
        trigger: section,
        start: 'top 35%',
        once: true,
        onEnter: play,
      })

      return () => {
        dead = true
        st.kill()
        tl?.kill()
        gsap.set([photo, sign], { clearProps: 'all' })
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

      <div className="fp-text">
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
        <a className="fp-cta" href="#results">
          Как этот путь прошли участники
          <span className="fp-cta-icon">
            <ArrowIcon src={`${A}/arrow.svg`} />
          </span>
        </a>
      </div>

    </section>
  )
}
