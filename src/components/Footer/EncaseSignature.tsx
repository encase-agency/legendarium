import { useLayoutEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { ENCASE_PIECES, ENCASE_VIEWBOX } from './encaseShapes'
import './EncaseSignature.css'

gsap.registerPlugin(ScrollTrigger)

const { w: VW, h: VH } = ENCASE_VIEWBOX
const ORANGE = '#ff6816'

// How long each piece takes to be written and when it starts (s): the letters one after another, the swoosh last.
const WRITE: { at: number; dur: number }[] = [
  { at: 0, dur: 0.5 },
  { at: 0.42, dur: 0.55 },
  { at: 0.9, dur: 0.55 },
  { at: 1.35, dur: 0.2 },
  { at: 1.45, dur: 0.6 },
  { at: 1.95, dur: 0.55 },
]

/**
 * "ENCASE agency" under the wordmark. When the footer comes into view the signature is written as if by hand (every
 * piece is uncovered from left to right), then a gold sheen runs through it, like on the "Получить доступ" button of the
 * Legend plan, and the lettering stays gold.
 */
export function EncaseSignature() {
  const rootRef = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    const root = rootRef.current
    if (!root) return
    const writes = Array.from(root.querySelectorAll<SVGRectElement>('[data-write]'))
    const gold = root.querySelector<SVGRectElement>('[data-gold]')
    const sheen = root.querySelector<SVGRectElement>('[data-sheen]')
    const agency = root.querySelector<SVGTextElement>('[data-agency]')
    if (!gold || !sheen || !agency) return

    const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (calm) {
      gsap.set(gold, { attr: { width: VW + 20 } })
      gsap.set(sheen, { opacity: 0 })
      return
    }

    gsap.set(writes, { attr: { width: 0 } })
    gsap.set(gold, { attr: { width: 0 } })
    gsap.set(sheen, { opacity: 0, x: -40 })
    gsap.set(agency, { opacity: 0 })

    const tl = gsap.timeline({
      paused: true,
      scrollTrigger: { trigger: root, start: 'top 95%', once: true, onEnter: () => tl.play() },
    })
    writes.forEach((rect, i) => {
      const piece = ENCASE_PIECES[i]
      // a pen: it starts slowly and speeds up in the middle of the stroke
      tl.to(rect, { attr: { width: piece.w + 1 }, duration: WRITE[i].dur, ease: 'power1.inOut' }, WRITE[i].at)
    })
    tl.to(agency, { opacity: 1, duration: 0.4, ease: 'power1.out' }, 2.3)
    // the gold comes through the written lettering from left to right with a bright band riding its edge
    const goldAt = 2.7
    tl.to(gold, { attr: { width: VW + 20 }, duration: 1.1, ease: 'power1.inOut' }, goldAt)
    tl.set(sheen, { opacity: 1 }, goldAt)
    tl.fromTo(sheen, { x: -40 }, { x: VW + 20, duration: 1.1, ease: 'power1.inOut' }, goldAt)
    tl.to(sheen, { opacity: 0, duration: 0.2 }, goldAt + 1.0)

    return () => {
      tl.scrollTrigger?.kill()
      tl.kill()
    }
  }, [])

  return (
    <div className="ft-encase" ref={rootRef} aria-label="Encase agency" role="img">
      <svg viewBox={`0 0 ${VW} ${VH}`} width="100%" height="100%" aria-hidden="true">
        <defs>
          <linearGradient id="enc-gold" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#e9b44f" />
            <stop offset="0.5" stopColor="#c28a2c" />
            <stop offset="1" stopColor="#8f6218" />
          </linearGradient>
          <linearGradient id="enc-sheen" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#fff4cd" stopOpacity="0" />
            <stop offset="0.5" stopColor="#fff4cd" stopOpacity="0.9" />
            <stop offset="1" stopColor="#fff4cd" stopOpacity="0" />
          </linearGradient>
          {ENCASE_PIECES.map((p, i) => (
            <mask id={`enc-w${i}`} key={i} maskUnits="userSpaceOnUse" x="0" y="0" width={VW} height={VH}>
              <rect data-write x={p.x - 0.5} y={p.y - 1} width={p.w + 1} height={p.h + 2} fill="#fff" />
            </mask>
          ))}
          <clipPath id="enc-shape">
            {ENCASE_PIECES.map((p, i) => (
              <path key={i} d={p.d} transform={`translate(${p.x} ${p.y})`} />
            ))}
          </clipPath>
          <mask id="enc-reveal" maskUnits="userSpaceOnUse" x="0" y="0" width={VW} height={VH}>
            <rect data-gold x="-1" y="0" width={VW + 20} height={VH} fill="#fff" />
          </mask>
        </defs>

        {/* the lettering as it is written (orange, as drawn in the design) */}
        {ENCASE_PIECES.map((p, i) => (
          <g key={i} mask={`url(#enc-w${i})`}>
            <path d={p.d} transform={`translate(${p.x} ${p.y})`} fill={ORANGE} />
          </g>
        ))}

        {/* the gold: it takes the lettering over from left to right, with a bright band on its edge */}
        <g mask="url(#enc-reveal)">
          <rect x="-2" y="0" width={VW + 4} height={VH} fill="url(#enc-gold)" clipPath="url(#enc-shape)" />
          <rect data-sheen x="0" y="-2" width="28" height={VH + 4} fill="url(#enc-sheen)" clipPath="url(#enc-shape)" />
        </g>

        <text data-agency x="109.4" y="34" fontSize="2.75" letterSpacing="2.58" fill="#b07f30" style={{ textTransform: 'uppercase' }}>
          agency
        </text>
      </svg>
    </div>
  )
}
