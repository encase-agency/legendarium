import { useLayoutEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { asset } from '../../lib/asset'
import './EncaseSignature.css'

gsap.registerPlugin(ScrollTrigger)

/**
 * "Encase agency" under the wordmark (Figma 764:3747). When the footer comes into view the signature is written as if by
 * hand (a black pen stroke runs from left to right), then an orange sheen runs through it, then a gold one, like on the
 * "Получить доступ" button of the Legend plan, and the lettering stays gold. Every layer is the same lettering (the
 * picture is used as a mask), so the colours always follow the strokes exactly.
 */
export function EncaseSignature() {
  const rootRef = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    const root = rootRef.current
    if (!root) return
    const ink = root.querySelector<HTMLElement>('.enc-ink')
    const orange = root.querySelector<HTMLElement>('.enc-orange')
    const gold = root.querySelector<HTMLElement>('.enc-gold')
    if (!ink || !orange || !gold) return
    const layers = [ink, orange, gold]

    const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (calm) {
      gsap.set([ink, orange], { opacity: 0 })
      return
    }

    // p: how much of the lettering is uncovered (0..1); the bright band of a colour layer rides the edge
    const state = layers.map(() => ({ p: 0 }))
    const paint = (layer: HTMLElement, p: number) => {
      layer.style.clipPath = `inset(0 ${(1 - p) * 100}% 0 0)`
      const sheen = layer.querySelector<HTMLElement>('.enc-sheen')
      if (sheen) {
        sheen.style.left = `${p * 100}%`
        sheen.style.opacity = p > 0 && p < 1 ? '1' : '0'
      }
    }
    layers.forEach((layer, i) => paint(layer, state[i].p))

    const run = (i: number, dur: number, at: number, ease: string, tl: gsap.core.Timeline) =>
      tl.to(state[i], { p: 1, duration: dur, ease, onUpdate: () => paint(layers[i], state[i].p) }, at)

    const tl = gsap.timeline({
      paused: true,
      scrollTrigger: { trigger: root, start: 'top 95%', once: true, onEnter: () => tl.play() },
    })
    run(0, 2.6, 0, 'power1.inOut', tl) // the pen
    run(1, 1.3, 2.9, 'power1.inOut', tl) // orange sheen
    run(2, 1.3, 4.5, 'power1.inOut', tl) // gold sheen
    // the gold has taken over: the layers under it are not needed any more
    tl.set([ink, orange], { opacity: 0 }, 5.9)

    return () => {
      tl.scrollTrigger?.kill()
      tl.kill()
    }
  }, [])

  const mask = { '--enc-mask': `url(${asset('/assets/footer/encase-mask.png')})` } as React.CSSProperties
  return (
    <div className="ft-encase" ref={rootRef} style={mask} aria-label="Encase agency" role="img">
      <div className="enc-layer enc-ink" />
      <div className="enc-layer enc-orange">
        <i className="enc-sheen" />
      </div>
      <div className="enc-layer enc-gold">
        <i className="enc-sheen" />
      </div>
    </div>
  )
}
