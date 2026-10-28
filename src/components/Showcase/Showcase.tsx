import { lazy, Suspense, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { ArrowIcon } from '../shared/ArrowIcon'
import type { VideoItem } from '../Cases/VideoModal'
import './Showcase.css'
import { asset } from '../../lib/asset'
import { siteConfig } from '../../lib/siteConfig'

const VideoModal = lazy(() => import('../Cases/VideoModal').then(module => ({ default: module.VideoModal })))

gsap.registerPlugin(ScrollTrigger)

const ASSETS = asset('/assets/showcase')

const STATS = [
  { value: '12+', label: 'Направлений' },
  { value: '1 000+', label: 'Выпускников' },
  { value: '12 месяцев', label: 'Доступа' },
]

// Both cards open the player with a Kinescope video (the same way as the cases).
const VIDEOS: VideoItem[] = [
  {
    video: { id: '145fbcde-8216-498f-890c-27e533b9c87d' },
    poster: `${ASSETS}/poster-b.jpg`,
    person: 'Путь участника до первого заработка',
    summary: 'Егор. Монтаж и контент · около 1 200 $ за июнь',
  },
  {
    video: { id: '56a22d6f-2ba6-47ec-9b27-349d47e65e6f' },
    poster: `${ASSETS}/poster-journey.jpg`,
    person: 'Путь участника: от первого шага до своего дела',
    summary: 'Алексей. Трейдинг · депозит 140 $ → 4200 $ за 7 недель',
  },
]

function PlayIcon() {
  return <img className="sc-play" src={`${ASSETS}/play.svg`} alt="" />
}

export function Showcase() {
  const sectionRef = useRef<HTMLElement>(null)
  const firstRef = useRef<HTMLDivElement>(null)
  const secondRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState<number | null>(null)
  const [closing, setClosing] = useState(false)
  const timer = useRef<number>(0)

  const openVideo = (i: number) => {
    window.clearTimeout(timer.current)
    setClosing(false)
    setOpen(i)
  }
  const closeVideo = useCallback(() => {
    setClosing(true)
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => {
      setOpen(null)
      setClosing(false)
    }, 280)
  }, [])

  useEffect(() => {
    if (open === null) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])
  useEffect(() => () => window.clearTimeout(timer.current), [])

  useLayoutEffect(() => {
    const section = sectionRef.current
    const first = firstRef.current
    const second = secondRef.current
    if (!section || !first || !second) return

    // Decode both posters up front so the second card never pops in (or hitches) while it flies up.
    ;[`${ASSETS}/poster-b.jpg`, `${ASSETS}/poster-journey.jpg`].forEach((src) => {
      const img = new Image()
      img.src = src
      void img.decode?.().catch(() => undefined)
    })

    const mm = gsap.matchMedia()
    // Phone / tablet (Figma 622:2935 -> 530:4739): one after another - the first video rises, then the second one
    // lands on it, and only then the licence text melts in.
    mm.add('(max-width: 1100px)', () => {
      const licence = section.querySelector<HTMLElement>('.sc-license')
      if (licence) gsap.set(licence, { opacity: 0, y: 28 })
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: () => `+=${Math.round(window.innerHeight * 2.2)}`,
          pin: true,
          scrub: 0.8,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        },
      })
      tl.fromTo(
        first,
        { y: () => section.clientHeight - first.offsetTop + 40, force3D: true },
        { y: 0, ease: 'power2.inOut', duration: 0.6 },
        0,
      )
      tl.fromTo(
        second,
        { y: () => section.clientHeight - second.offsetTop + 40, force3D: true },
        { y: 0, ease: 'power2.inOut', duration: 0.6 },
        0.65,
      )
      if (licence) tl.to(licence, { opacity: 1, y: 0, ease: 'power2.out', duration: 0.4 }, 1.3)
      tl.to({}, { duration: 0.3 })
    })
    mm.add('(min-width: 1101px)', () => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: () => `+=${Math.round(window.innerHeight * 0.9)}`,
          pin: true,
          scrub: 0.5,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        },
      })
      tl.fromTo(
        second,
        { y: () => section.clientHeight - second.offsetTop + 40, force3D: true },
        { y: 0, ease: 'none', duration: 0.6 },
      )
      // Dwell at the end so the card always lands even while nothing follows this block yet.
      tl.to({}, { duration: 0.4 })
    })
    return () => mm.revert()
  }, [])

  return (
    <section className="showcase" id="showcase" ref={sectionRef}>
      <div className="sc-stats">
        {STATS.map((s) => (
          <div className="sc-stat" key={s.value}>
            <p className="sc-num">{s.value} </p>
            <p className="sc-label">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="sc-card sc-card--first" ref={firstRef}>
        <div className="sc-card-inner">
          <button type="button" className="sc-video" onClick={() => openVideo(0)} aria-label={VIDEOS[0].person}>
            <img className="sc-poster-b" src={`${ASSETS}/poster-b.jpg`} alt="" />
            <PlayIcon />
          </button>
          <div className="sc-text">
            <p className="sc-title">Путь участника до первого заработка</p>
            <p className="sc-sub">Егор. Монтаж и контент · около 1 200 $ за июнь</p>
          </div>
        </div>
      </div>

      <div className="sc-card sc-card--second" ref={secondRef}>
        <div className="sc-card-inner">
          <button type="button" className="sc-video" onClick={() => openVideo(1)} aria-label={VIDEOS[1].person}>
            <img className="sc-poster-cover" src={`${ASSETS}/poster-journey.jpg`} alt="" />
            <PlayIcon />
          </button>
          <div className="sc-text">
            <p className="sc-title">
              <span className="sc-title-muted">Путь участника: </span>от первого шага{' '}
              <br />
              до своего дела
            </p>
            <p className="sc-sub">
              Алексей. Трейдинг · депозит 140 $ → 4200 $ <br className="sc-mbr" />
              за 7 недель
            </p>
          </div>
        </div>
      </div>

      <div className="sc-license">
        <p className="sc-license-text">
          {siteConfig.license.text ?? 'Реквизиты образовательной лицензии уточняются.'}
        </p>
        {siteConfig.license.url && <a
          className="sc-license-link"
          href={siteConfig.license.url}
          target="_blank"
          rel="noreferrer"
        >
          Проверить в реестре Рособрнадзора
          <ArrowIcon src={`${ASSETS}/arrow-license.svg`} />
        </a>}
      </div>
      {open !== null && <Suspense fallback={null}><VideoModal item={VIDEOS[open]} closing={closing} onClose={closeVideo} /></Suspense>}
    </section>
  )
}
