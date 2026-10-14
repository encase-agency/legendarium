import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { intro } from '../../lib/intro'
import './Loader.css'
import { asset } from '../../lib/asset'

const STEP = 26
const UI_SELECTOR = '.sh, .hero-ui > *:not(.hero-scrim)'

interface LoaderProps {
  onDone: () => void
}

export function Loader({ onDone }: LoaderProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const bgRef = useRef<HTMLDivElement>(null)
  const stripRef = useRef<HTMLDivElement>(null)
  const counterRef = useRef<HTMLDivElement>(null)
  const logoRef = useRef<HTMLDivElement>(null)
  const shineRef = useRef<HTMLDivElement>(null)
  const onDoneRef = useRef(onDone)
  onDoneRef.current = onDone

  useEffect(() => {
    const root = rootRef.current
    const bg = bgRef.current
    const strip = stripRef.current
    const counter = counterRef.current
    const logo = logoRef.current
    const shine = shineRef.current
    if (!root || !bg || !strip || !counter || !logo || !shine) return

    const items = Array.from(strip.children) as HTMLElement[]
    const state = { value: 1 }
    const render = () => {
      const base = Math.floor(state.value)
      const frac = state.value - base
      items.forEach((el, i) => {
        const n = base + (i - 2)
        const pos = (i - 2 - frac) * STEP
        el.textContent = n >= 1 && n <= 100 ? String(n).padStart(3, '0') : ''
        el.style.transform = `translate(-50%, calc(-50% + ${pos}px))`
      })
    }
    render()

    gsap.set(logo, { opacity: 0, scale: 0.5 })
    gsap.set(shine, { backgroundPosition: '100% 0' })
    gsap.set(UI_SELECTOR, { opacity: 0, y: 48 })
    intro.person = 0

    let tl: gsap.core.Timeline | null = null
    let cancelled = false

    const start = () => {
      if (cancelled) return
      tl = gsap.timeline({
        onComplete: () => {
          gsap.set(UI_SELECTOR, { clearProps: 'opacity,transform' })
          onDoneRef.current()
        },
      })
      tl.to(state, { value: 100, duration: 1.33, ease: 'power1.inOut', onUpdate: render })
        .to(counter, { opacity: 0, duration: 0.2, ease: 'power1.in' }, '+=0.12')
        .to(logo, { opacity: 1, scale: 1.817, duration: 0.7, ease: 'power3.out' }, '>-0.05')
        .to(shine, { backgroundPosition: '0% 0', duration: 0.4, ease: 'power2.inOut' }, '<0.15')
        .to(logo, { opacity: 0, duration: 0.3, ease: 'power1.in' }, '+=0.1')
        .addLabel('wipe', '+=0.05')
        .to(bg, { clipPath: 'inset(0 0 100% 0)', duration: 1.1, ease: 'power3.inOut' }, 'wipe')
        .to(intro, { person: 1, duration: 1.3, ease: 'power3.out' }, 'wipe+=0.8')
        .to(UI_SELECTOR, { opacity: 1, y: 0, duration: 0.95, ease: 'power3.out', stagger: 0.09 }, 'wipe+=1')
    }

    const fontReady = Promise.race([
      document.fonts.load('32px "Alumni Sans SC"').catch(() => undefined),
      new Promise((resolve) => setTimeout(resolve, 1500)),
    ])
    fontReady.then(start)

    return () => {
      cancelled = true
      tl?.kill()
    }
  }, [])

  return (
    <div className="loader" ref={rootRef} aria-hidden="true">
      <div className="loader-bg" ref={bgRef} />
      <div className="loader-counter" ref={counterRef}>
        <div className="loader-strip" ref={stripRef}>
          {[0, 1, 2, 3, 4].map((i) => (
            <span key={i} className="loader-digit" />
          ))}
        </div>
      </div>
      <div className="loader-logo" ref={logoRef}>
        <img src={asset('/assets/hero/figma-logo.png')} alt="" className="loader-logo-img" />
        <div className="loader-logo-shine" ref={shineRef} />
      </div>
    </div>
  )
}
