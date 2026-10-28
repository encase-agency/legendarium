import { lazy, Suspense, useLayoutEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { HeroPortrait } from './HeroPortrait'
import { useIsDebug } from '../../lib/useIsDebug'
import { ArrowUpRightIcon, TargetIcon } from './icons'
import { Loader } from './Loader'
import { INTRO_SKIPPED } from '../../lib/intro'
import './Hero.css'

const HeroScene = lazy(() => import('./HeroScene').then((module) => ({ default: module.HeroScene })))

gsap.registerPlugin(ScrollTrigger)

export function Hero() {
  const isDebug = useIsDebug()
  const [introActive, setIntroActive] = useState(!INTRO_SKIPPED)
  const sectionRef = useRef<HTMLElement>(null)

  // Curtain: the hero stays put while the next two blocks (features + "12+") slide up over it.
  useLayoutEffect(() => {
    const el = sectionRef.current
    if (!el) return
    const mm = gsap.matchMedia()
    mm.add('(min-width: 1101px)', () => {
      const st = ScrollTrigger.create({
        trigger: el,
        start: 'top top',
        end: () => `+=${el.offsetHeight}`,
        pin: true,
        pinSpacing: false,
        anticipatePin: 1,
        invalidateOnRefresh: true,
      })
      return () => st.kill()
    })
    return () => mm.revert()
  }, [])

  return (
    <section className={introActive ? 'hero hero--intro' : 'hero'} id="hero" ref={sectionRef}>
      <Suspense fallback={<HeroPortrait />}><HeroScene isDebug={isDebug} /></Suspense>

      <div className="hero-ui">
        <div className="hero-scrim" aria-hidden="true" />

        <h1 className="hero-headline">
          Выйди на доход <span className="hero-accent">100–300+</span>{' '}
          <br />
          тысяч в онлайне с нуля
        </h1>

        <p className="hero-paragraph">
          Освой профессию, за которую платят в интернете, возьми{' '}
          <br />
          первых клиентов уже в первые 30 дней и перестань зависеть{' '}
          <br />
          от начальника. Хватит подчиняться Матрице.{' '}
          <br />
          Ты здесь не случайно и ты это понимаешь!
        </p>

        <a className="btn btn-dark hero-cta" href="#pain">
          Выйти из матрицы
          <span className="hero-cta-icon">
            <ArrowUpRightIcon />
          </span>
        </a>

        <div className="hero-info-card">
          <span className="hero-info-icon">
            <TargetIcon />
          </span>
          <div className="hero-info-text">
            <strong>
              Не имеет аналогов{' '}
              <br />
              во всём СНГ:
            </strong>
            <p>
              Обучаем и ведём к стабильному{' '}
              <br />
              доходу и новой жизни.
            </p>
            <span className="hero-info-sub">Гос. лицензия и диплом.</span>
          </div>
        </div>

        <div className="hero-right-footer">
          <p>
            Программа, истории,{' '}
            <br />
            условия и цена — ниже.
          </p>
        </div>

        <a className="hero-link" href="#route">
          Как работает
        </a>

      </div>

      {introActive && <Loader onDone={() => setIntroActive(false)} />}
    </section>
  )
}
