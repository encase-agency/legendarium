import { useLayoutEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { DIRECTION_CARDS, type DirectionCard, type Overlay } from './cards'
import { ArrowIcon } from '../shared/ArrowIcon'
import { Lines } from '../shared/Lines'
import { scrollToSection } from '../../lib/scrollToSection'
import './Directions.css'
import { asset } from '../../lib/asset'

gsap.registerPlugin(ScrollTrigger)

const A = asset('/assets/directions')

// The cards sit on the faces of a drum: the next face is turned PHI degrees and shares its
// edge with the centre card, so only a narrow strip of it shows. APOTHEM is the distance from
// the drum axis to a face (width 349, PHI 74.6 deg), chosen with PERSPECTIVE so the strip is
// ~52.5px wide and ~363px tall like the Figma frames.
const PHI = 74.6
const APOTHEM = 229.1
const LAST = DIRECTION_CARDS.length // index of the empty black card
const SWAP_AT = LAST - 0.02

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v))

function overlayStyle(o: Overlay): React.CSSProperties {
  const style: Record<string, string | number> = { background: o.color }
  if (o.blur) style.filter = `blur(calc(${o.blur} * var(--u)))`
  if (o.box) {
    const b = o.box
    style.width = `calc(${b.width} * var(--u))`
    style.height = `calc(${b.height} * var(--u))`
    if (b.centered) {
      style.left = '50%'
      style.transform = 'translateX(-50%)'
    } else if (b.left !== undefined) style.left = `calc(${b.left} * var(--u))`
    if (b.top !== undefined) style.top = `calc(${b.top} * var(--u))`
    if (b.bottom !== undefined) style.bottom = `calc(${b.bottom} * var(--u))`
  } else {
    style.inset = 0
  }
  return style as React.CSSProperties
}

function Card({ card }: { card: DirectionCard }) {
  return (
    <>
      {card.base && <div className="dr-base" style={{ background: card.base }} />}
      <img
        className={card.crop ? 'dr-photo dr-photo--crop' : 'dr-photo'}
        src={`${A}/${card.image}`}
        alt=""
        decoding="async"
        style={
          card.crop
            ? { height: `${card.crop.h}%`, left: `${card.crop.left}%`, top: `${card.crop.top}%` }
            : undefined
        }
      />
      {card.overlays?.map((o, i) => (
        <div className="dr-overlay" style={overlayStyle(o)} key={i} />
      ))}
      <div
        className={card.dark ? 'dr-text dr-text--dark' : 'dr-text'}
      >
        <h3 className="dr-title">
          {card.title.map((l, i) => (
            <span key={l}>
              {l}
              {i < card.title.length - 1 && (
                <>
                  {' '}
                  <br />
                </>
              )}
            </span>
          ))}
        </h3>
        <p className="dr-body">
          {card.body.map((l, i) => (
            <span key={l}>
              {l}
              {i < card.body.length - 1 && (
                <>
                  {' '}
                  <br />
                </>
              )}
            </span>
          ))}
        </p>
      </div>
    </>
  )
}

// Figma 526:2504 (+ frames 188:661 ... 232:1819 for the other cards, 188:736 / 188:756 for the
// black card that grows to fill the block).
export function Directions() {
  const sectionRef = useRef<HTMLElement>(null)
  const cardRefs = useRef<(HTMLElement | null)[]>([])
  const blackRef = useRef<HTMLDivElement>(null)
  const headRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLButtonElement>(null)
  const [listOpen, setListOpen] = useState(false)

  // "Посмотреть списком" shows all directions at once, without any scroll animation; "Свернуть" brings the carousel back.
  const toggleList = (open: boolean) => {
    setListOpen(open)
    if (open) document.documentElement.setAttribute('data-dir-list', '')
    else document.documentElement.removeAttribute('data-dir-list')
    window.setTimeout(() => {
      ScrollTrigger.refresh()
      scrollToSection('directions')
    }, 80)
  }
  const sceneRef = useRef<HTMLDivElement>(null)
  const navRef = useRef<HTMLDivElement>(null)
  const stepRef = useRef<((dir: 1 | -1) => void) | null>(null)

  useLayoutEffect(() => {
    const section = sectionRef.current
    const black = blackRef.current
    const head = headRef.current
    const list = listRef.current
    if (!section || !black || !head || !list) return
    // The list of all directions is open: the carousel and its scroll animation are off.
    if (listOpen) return

    const state = { p: 0, e: 0 }
    // Phone layout: the drum is turned by dragging / the arrows; the last face is the "Мышление" card.
    let phone = false


    let dimensions = { w: 0, h: 0, u: 1 }
    const measure = () => {
      const w = section.clientWidth
      const h = section.clientHeight
      const first = cardRefs.current[0]
      const u = (first ? first.offsetWidth : (w / 1512) * 349) / 349
      dimensions = { w, h, u }
    }
    const apply = () => {
      const { w, h, u } = dimensions
      const { p, e } = state

      cardRefs.current.forEach((el, i) => {
        if (!el) return
        const d = i - p
        const rad = (clamp(d, -2, 2) * PHI * Math.PI) / 180
        const x = APOTHEM * Math.sin(rad) * u
        const z = -APOTHEM * (1 - Math.cos(rad)) * u
        const angle = clamp(d, -2, 2) * PHI
        const ad = Math.abs(d)
        const op = ad <= 1.001 ? 1 : Math.max(0, 1 - (ad - 1) * 2)
        el.style.transform = `translate3d(${x}px, 0, ${z}px) rotateY(${angle}deg)`
        el.style.opacity = String(op)
        el.style.zIndex = String(100 - Math.round(ad * 10))
        el.style.visibility = op <= 0 || (i === LAST && p >= SWAP_AT) ? 'hidden' : 'visible'
      })

      if (phone) {
        // Phone: no dark card, the last card is the "Мышление" cube; the next block rolls over the pinned section.
        black.style.opacity = '0'
        head.style.opacity = '1'
        list.style.opacity = '1'
        if (navRef.current) {
          navRef.current.dataset.start = p < 0.02 ? '1' : '0'
          navRef.current.dataset.end = p > LAST - 1.02 ? '1' : '0'
        }
        return
      }

      // The flat black card takes over from the 3D one at the last step, then grows.
      const flat = p >= SWAP_AT
      black.style.opacity = flat ? '1' : '0'
      const cardW = 349 * u
      const cardH = 427 * u
      const left0 = (w - cardW) / 2
      const top0 = (h - 832 * u) / 2 + 287 * u
      const lerp = (a: number, b: number) => a + (b - a) * e
      const top = lerp(top0, 0)
      const left = lerp(left0, 0)
      const right = lerp(w - left0 - cardW, 0)
      const bottom = lerp(h - top0 - cardH, 0)
      black.style.clipPath = `inset(${top}px ${right}px ${bottom}px ${left}px round ${lerp(20 * u, 0)}px)`

      const fade = String(1 - clamp(e * 2.5, 0, 1))
      head.style.opacity = fade
      list.style.opacity = fade
    }

    const mm = gsap.matchMedia()
    const refresh = () => { measure(); apply() }
    mm.add('(min-width: 1101px)', () => {
      phone = false
      measure()
      apply()
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: () => `+=${Math.round(window.innerHeight * 0.55 * (LAST + 1.5))}`,
          pin: true,
          scrub: 0.5,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          onRefresh: refresh,
        },
      })
      tl.to(state, { p: LAST, duration: LAST, ease: 'none', onUpdate: apply })
      tl.to(state, { e: 1, duration: 1.5, ease: 'power2.inOut', onUpdate: apply })
      window.addEventListener('resize', refresh)
      return () => window.removeEventListener('resize', refresh)
    })

    mm.add('(max-width: 1100px)', () => {
      phone = true
      state.p = 0
      state.e = 0
      measure()
      apply()

      const scene = sceneRef.current
      if (!scene) {
        return () => {
          phone = false
        }
      }

      // Pinned for one more screen while the next block ("Наши наставники") rolls over it.
      const st = ScrollTrigger.create({
        trigger: section,
        start: 'top top',
        end: () => `+=${window.innerHeight}`,
        pin: true,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        onRefresh: refresh,
      })

      const MAX = LAST - 1
      let dragging = false
      let startX = 0
      let startP = 0
      let tween: gsap.core.Tween | undefined
      const snap = (target: number) => {
        const t = clamp(Math.round(target), 0, MAX)
        tween?.kill()
        tween = gsap.to(state, { p: t, duration: 0.45, ease: 'power2.out', onUpdate: apply })
      }
      stepRef.current = (dir: 1 | -1) => snap(Math.round(state.p) + dir)

      const cardW = () => Math.max(1, dimensions.u * 349)
      const onDown = (ev: PointerEvent) => {
        if (ev.pointerType === 'mouse' && ev.button !== 0) return
        dragging = true
        startX = ev.clientX
        startP = state.p
        tween?.kill()
        scene.setPointerCapture(ev.pointerId)
      }
      const onMove = (ev: PointerEvent) => {
        if (!dragging) return
        state.p = clamp(startP - (ev.clientX - startX) / (cardW() * 0.6), 0, MAX)
        apply()
      }
      const onUp = (ev: PointerEvent) => {
        if (!dragging) return
        dragging = false
        const dx = ev.clientX - startX
        if (Math.abs(dx) < 6) {
          // A tap on one of the side strips turns the drum one step.
          const rect = scene.getBoundingClientRect()
          const mid = rect.left + rect.width / 2
          const half = cardW() / 2
          if (ev.clientX > mid + half) return snap(Math.round(startP) + 1)
          if (ev.clientX < mid - half) return snap(Math.round(startP) - 1)
          return snap(Math.round(startP))
        }
        snap(state.p)
      }
      scene.addEventListener('pointerdown', onDown)
      scene.addEventListener('pointermove', onMove)
      scene.addEventListener('pointerup', onUp)
      scene.addEventListener('pointercancel', onUp)
      window.addEventListener('resize', refresh)
      return () => {
        phone = false
        stepRef.current = null
        tween?.kill()
        st.kill()
        scene.removeEventListener('pointerdown', onDown)
        scene.removeEventListener('pointermove', onMove)
        scene.removeEventListener('pointerup', onUp)
        scene.removeEventListener('pointercancel', onUp)
        window.removeEventListener('resize', refresh)
      }
    })

    return () => mm.revert()
  }, [listOpen])

  return (
    <section className={listOpen ? 'directions is-list' : 'directions'} id="directions" ref={sectionRef}>
      <div className="dr-stage">
        <div className="dr-head" ref={headRef}>
          <h2 className="dr-heading">
            Направления в легендариуме{' '}
            <br />
            для заработка онлайн
          </h2>
          <p className="dr-sub">
            Начни с того, что ближе. Остальные направления подключай, когда они понадобятся для следующей задачи.
          </p>
        </div>

        <div className="dr-scene" ref={sceneRef}>
          {DIRECTION_CARDS.map((card, i) => (
            <article
              className="dr-card"
              key={card.id}
              ref={(el) => {
                cardRefs.current[i] = el
              }}
            >
              <Card card={card} />
            </article>
          ))}
          <article
            className="dr-card dr-card--black"
            ref={(el) => {
              cardRefs.current[LAST] = el
            }}
          />
        </div>

        <div className="dr-nav" ref={navRef} data-start="1" data-end="0">
          <button type="button" className="dr-arrow dr-arrow--prev" aria-label="Назад" onClick={() => stepRef.current?.(-1)}>
            <span className="dr-arrow-ico">
              <img src={`${A}/arrow-nav.svg`} alt="" />
            </span>
          </button>
          <button type="button" className="dr-arrow dr-arrow--next" aria-label="Дальше" onClick={() => stepRef.current?.(1)}>
            <span className="dr-arrow-ico">
              <img src={`${A}/arrow-nav.svg`} alt="" />
            </span>
          </button>
        </div>

        <button type="button" className="dr-list" ref={listRef} onClick={() => toggleList(true)}>
          Посмотреть списком
          <span className="dr-list-icon">
            <ArrowIcon src={`${A}/arrow.svg`} />
          </span>
        </button>
      </div>

      <div className="dr-black" ref={blackRef} />

      {listOpen && (
        <div className="dl">
          <div className="dl-head">
            <h2 className="dl-heading">
              Направления в легендариуме{' '}
              <br />
              для заработка онлайн
            </h2>
            <p className="dl-sub">
              Начни с того, что ближе. Остальные направления подключай, когда они понадобятся для следующей задачи.
            </p>
          </div>

          <ul className="dl-grid">
            {DIRECTION_CARDS.map((c, i) => (
              <li className={`dl-card dl-card--${c.id}${c.dark ? ' dl-card--dark' : ''}`} key={c.id}>
                <img className="dl-photo" src={`${A}/${c.image}`} alt="" loading="lazy" />
                <img className="dl-thumb" src={`${A}/t${String(i + 1).padStart(2, '0')}.jpg`} alt="" loading="lazy" />
                {c.fade && <span className="dl-fade" style={{ background: c.fade }} />}
                <div className="dl-text">
                  <h3 className="dl-title">
                    <Lines lines={c.title} />
                  </h3>
                  <p className="dl-body">
                    <Lines lines={c.body} />
                  </p>
                </div>
              </li>
            ))}
          </ul>

          <button type="button" className="dr-list dl-close" onClick={() => toggleList(false)}>
            Свернуть
            <span className="dr-list-icon">
              <ArrowIcon src={`${A}/arrow.svg`} />
            </span>
          </button>
        </div>
      )}
    </section>
  )
}

