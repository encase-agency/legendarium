import { useEffect, useRef } from 'react'
import './SiteCursor.css'

/**
 * Computers only: one pointer for the whole site, a dot in a ring. The ring fills up as the page is scrolled (it is a
 * scroll-progress line). It is drawn with "difference" blending, so it is white
 * over dark blocks and black over light ones by itself. The ring grows over buttons and links. It stays out of the
 * blocks that have a pointer of their own (the "Задай вопрос" block, the loading screen) and over video and text fields.
 */
export function SiteCursor() {
  const rootRef = useRef<HTMLDivElement>(null)
  const barRef = useRef<SVGCircleElement>(null)

  useEffect(() => {
    const root = rootRef.current
    const bar = barRef.current
    if (!root || !bar) return
    const fine = window.matchMedia('(hover: hover) and (pointer: fine) and (min-width: 1101px)')
    if (!fine.matches) return
    document.documentElement.classList.add('has-site-cursor')

    // the ring line grows with the scroll: 0 at the top of the page, a full circle at the bottom
    const LENGTH = 2 * Math.PI * 17
    bar.style.strokeDasharray = String(LENGTH)
    let progressRaf = 0
    const paintProgress = () => {
      progressRaf = 0
      const max = document.documentElement.scrollHeight - window.innerHeight
      const p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0
      bar.style.strokeDashoffset = String(LENGTH * (1 - p))
    }
    const onScroll = () => {
      if (!progressRaf) progressRaf = requestAnimationFrame(paintProgress)
    }
    paintProgress()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll, { passive: true })

    const pos = { x: -100, y: -100 }
    const target = { x: -100, y: -100 }
    let seen = false
    let raf = 0
    const tick = () => {
      pos.x += (target.x - pos.x) * 0.28
      pos.y += (target.y - pos.y) * 0.28
      root.style.transform = `translate(${pos.x}px, ${pos.y}px)`
      raf = requestAnimationFrame(tick)
    }

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return
      target.x = e.clientX
      target.y = e.clientY
      const el = e.target as Element | null
      if (!seen) {
        seen = true
        pos.x = target.x
        pos.y = target.y
        raf = requestAnimationFrame(tick)
      }
      const own = !!el?.closest?.('.ask, video, input, textarea, select')
      const loading = !!document.querySelector('.loader.has-cursor')
      root.classList.toggle('is-hidden', own || loading)
      root.classList.toggle('is-link', !!el?.closest?.('a, button, [role="button"], label, summary'))
    }
    const onDown = () => root.classList.add('is-down')
    const onUp = () => root.classList.remove('is-down')
    const onLeave = () => root.classList.add('is-hidden')

    window.addEventListener('pointermove', onMove, { passive: true })
    window.addEventListener('pointerdown', onDown, { passive: true })
    window.addEventListener('pointerup', onUp, { passive: true })
    document.documentElement.addEventListener('pointerleave', onLeave)
    return () => {
      cancelAnimationFrame(raf)
      cancelAnimationFrame(progressRaf)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      document.documentElement.classList.remove('has-site-cursor')
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerdown', onDown)
      window.removeEventListener('pointerup', onUp)
      document.documentElement.removeEventListener('pointerleave', onLeave)
    }
  }, [])

  return (
    <div className="sc-cursor is-hidden" ref={rootRef} aria-hidden="true">
      <span className="sc-cursor-ring" />
      <svg className="sc-cursor-progress" viewBox="0 0 40 40">
        <circle ref={barRef} cx="20" cy="20" r="17" />
      </svg>
      <span className="sc-cursor-dot" />
    </div>
  )
}
