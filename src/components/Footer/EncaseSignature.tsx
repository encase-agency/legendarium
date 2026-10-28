import { useLayoutEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { asset } from '../../lib/asset'
import './EncaseSignature.css'

gsap.registerPlugin(ScrollTrigger)

/**
 * "Encase agency" under the wordmark (Figma 764:3747). When the footer comes into view the signature is written as if by
 * hand in orange (the pen runs from left to right), then a gold sheen runs through it, like on the "Получить доступ"
 * button of the Legend plan, and the lettering stays gold; the same gold sheen runs through it again every 4 seconds. Both layers are the same lettering (the picture is used as a
 * mask), so the colours follow the strokes exactly. Behind the gold edge the orange is taken away at the same pace, so
 * nothing changes colour once the sheen has passed.
 */
export function EncaseSignature() {
  const rootRef = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    const root = rootRef.current
    if (!root) return
    const ink = root.querySelector<HTMLElement>('.enc-ink')
    const gold = root.querySelector<HTMLElement>('.enc-gold')
    const sheen = gold?.querySelector<HTMLElement>('.enc-sheen')
    if (!ink || !gold || !sheen) return

    const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (calm) {
      gsap.set(ink, { opacity: 0 })
      return
    }

    // write: how much of the lettering the pen has uncovered (0..1); sweep: how far the gold has gone (0..1);
    // shine: the repeated gold sheen over the finished lettering (0..1)
    const state = { write: 0, sweep: 0, shine: 0 }
    const paint = () => {
      ink.style.clipPath = `inset(0 ${(1 - state.write) * 100}% 0 ${state.sweep * 100}%)`
      gold.style.clipPath = `inset(0 ${(1 - state.sweep) * 100}% 0 0)`
      const p = state.sweep < 1 ? state.sweep : state.shine
      sheen.style.left = `${p * 100}%`
      sheen.style.opacity = p > 0 && p < 1 ? '1' : '0'
    }
    paint()

    const PASS = 0.84
    const tl = gsap.timeline({
      paused: true,
      scrollTrigger: { trigger: root, start: 'top 95%', once: true, onEnter: () => tl.play() },
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

  const mask = { '--enc-mask': `url(${asset('/assets/footer/encase-mask.png')})` } as React.CSSProperties
  return (
    <div className="ft-encase" ref={rootRef} style={mask} aria-label="Encase agency" role="img">
      <div className="enc-layer enc-ink" />
      <div className="enc-layer enc-gold">
        <i className="enc-sheen" />
      </div>
    </div>
  )
}
