import { useCallback, useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { AskForm } from '../AskForm/AskForm'
import './Ask.css'
import { asset } from '../../lib/asset'

const A = asset('/assets/ask')
const PHOTOS = Array.from({ length: 19 }, (_, i) => `${A}/a${String(i + 1).padStart(2, '0')}.jpg`)
/** Tilts used by the photos in the Figma frame 540:6301 (degrees). */
const TILTS = [15.74, 2.82, 22.9]
const MAX_ALIVE = 9
const HOLD = 1.1
const TRAIL_MS = 650

interface Point {
  x: number
  y: number
  t: number
}

const shuffled = () => {
  const a = [...PHOTOS]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// Figma 540:6301. The pointer is a dot that drags a line behind it and drops photos along its path.
export function Ask() {
  const sectionRef = useRef<HTMLElement>(null)
  const layerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const cursorRef = useRef<HTMLDivElement>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [closing, setClosing] = useState(false)
  const timer = useRef<number>(0)

  const openForm = () => {
    window.clearTimeout(timer.current)
    setClosing(false)
    setFormOpen(true)
  }
  const closeForm = useCallback(() => {
    setClosing(true)
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => {
      setFormOpen(false)
      setClosing(false)
    }, 280)
  }, [])

  useEffect(() => {
    if (!formOpen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [formOpen])
  useEffect(() => () => window.clearTimeout(timer.current), [])

  useEffect(() => {
    const section = sectionRef.current
    const layer = layerRef.current
    const canvas = canvasRef.current
    const cursor = cursorRef.current
    if (!section || !layer || !canvas || !cursor) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const phone = window.matchMedia('(max-width: 1100px)').matches
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Photos are decoded up front so the first drop is not an empty frame.
    PHOTOS.forEach((src) => {
      const img = new Image()
      img.src = src
    })

    let queue = shuffled()
    let tiltIdx = 0
    let z = 1
    const alive: { el: HTMLElement; tl: gsap.core.Timeline }[] = []

    let w = 0
    let h = 0
    let rect = section.getBoundingClientRect()
    const resize = () => {
      rect = section.getBoundingClientRect()
      w = rect.width
      h = rect.height
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = Math.round(w * dpr)
      canvas.height = Math.round(h * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(section)

    const target = { x: 0, y: 0 }
    const pos = { x: 0, y: 0 }
    let last = { x: 0, y: 0 }
    let inside = false
    let seen = false
    const trail: Point[] = []

    const nextPhoto = () => {
      if (!queue.length) queue = shuffled()
      return queue.pop()!
    }

    const fadeOut = (item: { el: HTMLElement; tl: gsap.core.Timeline }) => {
      item.tl.kill()
      gsap.to(item.el, {
        opacity: 0,
        scale: 0.8,
        duration: 0.55,
        ease: 'power2.in',
        overwrite: true,
        onComplete: () => item.el.remove(),
      })
      const i = alive.indexOf(item)
      if (i >= 0) alive.splice(i, 1)
    }

    const drop = (x: number, y: number) => {
      const el = document.createElement('div')
      el.className = 'ask-photo'
      const img = document.createElement('img')
      img.src = nextPhoto()
      img.alt = ''
      img.draggable = false
      el.appendChild(img)
      el.style.zIndex = String(z++)
      layer.appendChild(el)

      let angle = TILTS[Math.floor(Math.random() * TILTS.length)]
      if (angle === TILTS[tiltIdx]) angle = TILTS[(tiltIdx + 1) % TILTS.length]
      tiltIdx = TILTS.indexOf(angle)

      gsap.set(el, { x, y, rotation: angle, scale: 0.55, opacity: 0, xPercent: -50, yPercent: -50 })
      const item = { el, tl: gsap.timeline() }
      item.tl
        .to(el, { opacity: 1, scale: 1, duration: 0.4, ease: 'back.out(1.7)' })
        .to({}, { duration: HOLD })
        .call(() => fadeOut(item))
      alive.push(item)
      while (alive.length > MAX_ALIVE) fadeOut(alive[0])
    }

    let spacing = 0
    let ticking = false
    const move = (e: PointerEvent) => {
      rect = section.getBoundingClientRect()
      target.x = e.clientX - rect.left
      target.y = e.clientY - rect.top
      if (!seen) {
        seen = true
        pos.x = target.x
        pos.y = target.y
        last = { ...pos }
      }
      if (!inside) {
        inside = true
        gsap.to(cursor, { opacity: 1, duration: 0.2, overwrite: 'auto' })
      }
      if (!ticking) {
        ticking = true
        gsap.ticker.add(tick)
      }
    }

    const leave = () => {
      inside = false
      gsap.to(cursor, { opacity: 0, duration: 0.25, overwrite: 'auto' })
    }

    const draw = (now: number) => {
      ctx.clearRect(0, 0, w, h)
      while (trail.length && now - trail[0].t > TRAIL_MS) trail.shift()
      if (trail.length < 2) return
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.lineWidth = 1
      for (let i = 1; i < trail.length; i++) {
        const a = trail[i - 1]
        const b = trail[i]
        const age = 1 - (now - b.t) / TRAIL_MS
        ctx.strokeStyle = `rgba(255,255,255,${Math.max(0, age)})`
        ctx.beginPath()
        ctx.moveTo(a.x, a.y)
        ctx.lineTo(b.x, b.y)
        ctx.stroke()
      }
    }

    const tick = () => {
      const now = performance.now()
      if (inside) {
        pos.x += (target.x - pos.x) * 0.3
        pos.y += (target.y - pos.y) * 0.3
        const lastP = trail[trail.length - 1]
        if (!lastP || Math.hypot(pos.x - lastP.x, pos.y - lastP.y) > 1.5) trail.push({ x: pos.x, y: pos.y, t: now })
        const overCta = section.classList.contains('is-cta')
        if (!spacing) {
          const probe = layer.querySelector<HTMLElement>('.ask-photo')
          spacing = (probe?.offsetWidth ?? w * 0.097) * 0.78
        }
        if (!overCta && Math.hypot(pos.x - last.x, pos.y - last.y) >= spacing) {
          drop(pos.x, pos.y)
          last = { x: pos.x, y: pos.y }
          spacing = (layer.querySelector<HTMLElement>('.ask-photo')?.offsetWidth ?? spacing / 0.78) * 0.78
        }
      }
      cursor.style.transform = `translate(${pos.x}px, ${pos.y}px)`
      draw(now)
      if (!inside && !trail.length) {
        ticking = false
        gsap.ticker.remove(tick)
      }
    }

    const enterCta = () => section.classList.add('is-cta')
    const leaveCta = () => section.classList.remove('is-cta')
    const cta = section.querySelector('.ask-cta')
    cta?.addEventListener('pointerenter', enterCta)
    cta?.addEventListener('pointerleave', leaveCta)

    // Phone / tablet: no pointer at all. A virtual finger swipes by itself: first across the top, a second later
    // across the bottom, then a pause - photos drop along each swipe exactly like under the mouse on desktop.
    let swipes: gsap.core.Timeline | undefined
    if (phone) {
      const bez = (t: number, p: number[][]) => {
        const k = 1 - t
        return [0, 1].map(
          (c) => k * k * k * p[0][c] + 3 * k * k * t * p[1][c] + 3 * k * t * t * p[2][c] + t * t * t * p[3][c],
        )
      }
      // fractions of the block (x, y): control points of the two swipes
      const TOP = [
        [-0.08, 0.2],
        [0.25, 0.06],
        [0.62, 0.3],
        [1.08, 0.12],
      ]
      const BOTTOM = [
        [1.08, 0.86],
        [0.7, 0.98],
        [0.32, 0.72],
        [-0.08, 0.9],
      ]
      const prog = { t: 0 }
      const swipe = (path: number[][]) => {
        const tl = gsap.timeline()
        tl.call(() => {
          const [x, y] = bez(0, path)
          target.x = pos.x = last.x = x * w
          target.y = pos.y = last.y = y * h
          seen = true
          inside = true
          prog.t = 0
          gsap.to(cursor, { opacity: 1, duration: 0.15, overwrite: 'auto' })
          if (!ticking) {
            ticking = true
            gsap.ticker.add(tick)
          }
        })
        tl.to(prog, {
          t: 1,
          duration: 1.15,
          ease: 'power2.inOut',
          onUpdate: () => {
            const [x, y] = bez(prog.t, path)
            target.x = x * w
            target.y = y * h
          },
        })
        tl.call(() => {
          inside = false
          gsap.to(cursor, { opacity: 0, duration: 0.25, overwrite: 'auto' })
        })
        return tl
      }
      swipes = gsap.timeline({ repeat: -1, paused: true, delay: 0 })
      swipes.add(swipe(TOP), 0.5)
      swipes.add(swipe(BOTTOM), '>+1')
      swipes.to({}, { duration: 2.2 })
      // only while the block is on screen
      const io = new IntersectionObserver(([en]) => (en.isIntersecting ? swipes?.play() : swipes?.pause()), {
        threshold: 0.25,
      })
      io.observe(section)
      swipes.eventCallback('onRepeat', () => undefined)
      ;(swipes as gsap.core.Timeline & { _io?: IntersectionObserver })._io = io
    } else {
      section.addEventListener('pointermove', move)
      section.addEventListener('pointerleave', leave)
      section.addEventListener('pointercancel', leave)
    }

    return () => {
      ;(swipes as (gsap.core.Timeline & { _io?: IntersectionObserver }) | undefined)?._io?.disconnect()
      swipes?.kill()
      section.removeEventListener('pointermove', move)
      section.removeEventListener('pointerleave', leave)
      section.removeEventListener('pointercancel', leave)
      cta?.removeEventListener('pointerenter', enterCta)
      cta?.removeEventListener('pointerleave', leaveCta)
      gsap.ticker.remove(tick)
      ro.disconnect()
      alive.forEach((a) => a.tl.kill())
      layer.querySelectorAll('.ask-photo').forEach((el) => {
        gsap.killTweensOf(el)
        el.remove()
      })
    }
  }, [])

  return (
    <section className="ask" id="ask" ref={sectionRef}>
      <div className="ask-layer" ref={layerRef} aria-hidden="true" />
      <canvas className="ask-trail" ref={canvasRef} aria-hidden="true" />

      <p className="ask-sub">Напиши, что останавливает. Ответим по программе, направлениям, тарифам и условиям.</p>
      <h2 className="ask-heading">
        Задай вопрос лично{' '}
        <br />
        Андрею
      </h2>

      <button type="button" className="ask-cta" onClick={openForm}>
        <img className="ask-disc" src={`${A}/disc.svg`} alt="" />
        <span className="ask-cta-text">
          Написать{' '}
          <br />в Легендариум
        </span>
      </button>

      <div className="ask-cursor" ref={cursorRef} aria-hidden="true">
        <img className="ask-ring" src={`${A}/ring.svg`} alt="" />
        <img className="ask-dot" src={`${A}/dot.svg`} alt="" />
      </div>
      {formOpen && <AskForm closing={closing} onClose={closeForm} />}
    </section>
  )
}
