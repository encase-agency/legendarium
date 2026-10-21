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
    if (!root || !bg || !strip || !counter || !logo || !shine) {
      intro.person = 1
      onDoneRef.current()
      return
    }
    const ui = Array.from(document.querySelectorAll<HTMLElement>(UI_SELECTOR))
    const previousStyles = ui.map((element) => ({
      element, opacity: element.style.opacity, transform: element.style.transform,
    }))
    root.style.removeProperty('display')

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
    let completed = false
    let fontTimeout: ReturnType<typeof setTimeout> | undefined
    const finish = () => {
      if (cancelled || completed) return
      completed = true
      clearTimeout(deadline)
      clearTimeout(fontTimeout)
      tl?.kill()
      intro.person = 1
      // Use DOM styles directly: revealing content must not require another GSAP tick.
      ui.forEach((element) => {
        element.style.removeProperty('opacity')
        element.style.removeProperty('transform')
      })
      root.style.display = 'none'
      onDoneRef.current()
    }
    // A decorative animation must never gate access to the actual page.
    const deadline = setTimeout(() => {
      if (cancelled || completed) return
      console.error('Hero intro exceeded 4500 ms; revealing the page without waiting for animation frames.')
      finish()
    }, 4500)

    const start = () => {
      if (cancelled || completed) return
      tl = gsap.timeline({
        onComplete: finish,
      })
      tl.to(state, { value: 100, duration: 0.6, ease: 'power1.inOut', onUpdate: render })
        .to(counter, { opacity: 0, duration: 0.2, ease: 'power1.in' }, '+=0.12')
        .to(logo, { opacity: 1, scale: 1.817, duration: 0.35, ease: 'power3.out' }, '>-0.05')
        .to(shine, { backgroundPosition: '0% 0', duration: 0.4, ease: 'power2.inOut' }, '<0.15')
        .to(logo, { opacity: 0, duration: 0.3, ease: 'power1.in' }, '+=0.1')
        .addLabel('wipe', '+=0.05')
        .to(bg, { clipPath: 'inset(0 0 100% 0)', duration: 0.55, ease: 'power3.inOut' }, 'wipe')
        .to(intro, { person: 1, duration: 0.6, ease: 'power3.out' }, 'wipe+=0.2')
        .to(UI_SELECTOR, { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out', stagger: 0.04 }, 'wipe+=0.25')
    }

    const fontReady = Promise.race([
      document.fonts.load('32px "Alumni Sans SC"').catch(() => undefined),
      new Promise((resolve) => { fontTimeout = setTimeout(resolve, 350) }),
    ])
    fontReady.then(start)

    return () => {
      cancelled = true
      clearTimeout(deadline)
      clearTimeout(fontTimeout)
      tl?.kill()
      previousStyles.forEach(({ element, opacity, transform }) => {
        element.style.opacity = opacity
        element.style.transform = transform
      })
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
