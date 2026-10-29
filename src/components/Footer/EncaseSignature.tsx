import { useLayoutEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { asset } from '../../lib/asset'
import './EncaseSignature.css'

gsap.registerPlugin(ScrollTrigger)

const AGENCY_URL = 'https://encase-agency.ru'
const W = 1086 // the lettering picture is 1086 x 362
const H = 362
const SHEEN = 190 // width of the bright band

/**
 * "Сайт сделан агентством" with the "Encase agency" signature under it, the last column of the footer (Figma 764:3747);
 * both are a link to the agency's site. When the footer comes into view the signature is written as if by hand in orange
 * (the pen runs from left to right), then a gold sheen runs through it, like on the "Получить доступ" button of the
 * Legend plan, and the lettering stays gold; the same gold sheen runs through it again every 4 seconds. The lettering
 * is an SVG mask made of the picture, so the colours follow the strokes exactly in every browser. Behind the gold edge
 * the orange is taken away at the same pace, so nothing changes colour once the sheen has passed.
 */
export function EncaseSignature() {
  const rootRef = useRef<SVGSVGElement>(null)

  useLayoutEffect(() => {
    const root = rootRef.current
    if (!root) return
    const ink = root.querySelector<SVGRectElement>('[data-ink]')
    const gold = root.querySelector<SVGRectElement>('[data-gold]')
    const sheen = root.querySelector<SVGRectElement>('[data-sheen]')
    if (!ink || !gold || !sheen) return

    const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    // write: how much of the lettering the pen has uncovered (0..1); sweep: how far the gold has gone (0..1);
    // shine: the repeated gold sheen over the finished lettering (0..1)
    const state = { write: calm ? 1 : 0, sweep: calm ? 1 : 0, shine: 0 }
    const paint = () => {
      ink.setAttribute('x', String(state.sweep * W))
      ink.setAttribute('width', String(Math.max(0, (state.write - state.sweep) * W)))
      gold.setAttribute('width', String(state.sweep * W))
      const p = state.sweep < 1 ? state.sweep : state.shine
      sheen.setAttribute('x', String(p * (W + SHEEN) - SHEEN))
      sheen.setAttribute('opacity', p > 0 && p < 1 ? '1' : '0')
    }
    paint()
    if (calm) return

    const phone = window.matchMedia('(max-width: 1100px)').matches
    const PASS = 0.84
    const tl = gsap.timeline({
      paused: true,
      // on a computer: when the signature itself comes into view; on a phone the footer is tall, so it starts together
      // with the falling shields (the same moment: the top of the footer at 80% of the screen)
      scrollTrigger: phone
        ? { trigger: root.closest('footer') ?? root, start: 'top 80%', once: true, onEnter: () => tl.play() }
        : { trigger: root, start: 'top 95%', once: true, onEnter: () => tl.play() },
    })
    tl.to(state, { write: 1, duration: 1.56, ease: 'power1.inOut', onUpdate: paint }, 0) // the pen, in orange
    tl.to(state, { sweep: 1, duration: PASS, ease: 'power1.inOut', onUpdate: paint }, 1.8) // the gold sheen

    // afterwards the gold sheen runs through the lettering once every 4 seconds (only while the footer is on screen)
    const loop = gsap.timeline({ paused: true, repeat: -1, repeatDelay: 4 - PASS })
    loop.fromTo(state, { shine: 0 }, { shine: 1, duration: PASS, ease: 'power1.inOut', onUpdate: paint })
    tl.add(() => {
      loop.play(0)
    }, 1.8 + PASS + 3.16)
    const visible = ScrollTrigger.create({
      trigger: root,
      start: 'top bottom',
      end: 'bottom top',
      onToggle: (self) => {
        if (!tl.isActive() && tl.progress() === 1) loop.paused(!self.isActive)
      },
    })

    return () => {
      tl.scrollTrigger?.kill()
      visible.kill()
      loop.kill()
      tl.kill()
    }
  }, [])

  return (
    <div className="ft-col ft-col--agency">
      <a className="ft-agency" href={AGENCY_URL} target="_blank" rel="noreferrer" aria-label="Сайт сделан агентством Encase agency">
        <span className="ft-title">Сайт сделан агентством</span>
        <svg className="ft-encase" ref={rootRef} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" aria-hidden="true">
          <defs>
            <linearGradient id="enc-orange" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stopColor="#ff8a3d" />
              <stop offset="0.45" stopColor="#ff6816" />
              <stop offset="1" stopColor="#e24f00" />
            </linearGradient>
            <linearGradient id="enc-gold" x1="0" y1="0" x2="1" y2="0.6">
              <stop offset="0" stopColor="#e9b44f" />
              <stop offset="0.5" stopColor="#c28a2c" />
              <stop offset="1" stopColor="#8f6218" />
            </linearGradient>
            <linearGradient id="enc-sheen" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stopColor="#fff4cd" stopOpacity="0" />
              <stop offset="0.55" stopColor="#fff4cd" stopOpacity="0.95" />
              <stop offset="1" stopColor="#fff4cd" stopOpacity="0" />
            </linearGradient>
            <mask id="enc-shape" maskUnits="userSpaceOnUse" x="0" y="0" width={W} height={H}>
              <image href={asset('/assets/footer/encase-mask.png')} x="0" y="0" width={W} height={H} preserveAspectRatio="none" />
            </mask>
            <clipPath id="enc-clip-ink">
              <rect data-ink x="0" y="0" width="0" height={H} />
            </clipPath>
            <clipPath id="enc-clip-gold">
              <rect data-gold x="0" y="0" width="0" height={H} />
            </clipPath>
          </defs>
          <g mask="url(#enc-shape)">
            <rect x="0" y="0" width={W} height={H} fill="url(#enc-orange)" clipPath="url(#enc-clip-ink)" />
            <g clipPath="url(#enc-clip-gold)">
              <rect x="0" y="0" width={W} height={H} fill="url(#enc-gold)" />
              <rect data-sheen x={-SHEEN} y="0" width={SHEEN} height={H} fill="url(#enc-sheen)" opacity="0" transform={`skewX(-18)`} />
            </g>
          </g>
        </svg>
      </a>
    </div>
  )
}
