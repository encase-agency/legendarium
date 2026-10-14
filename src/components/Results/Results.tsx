import { useLayoutEffect, useRef, useSyncExternalStore } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { Lines } from '../shared/Lines'
import './Results.css'
import { asset } from '../../lib/asset'

gsap.registerPlugin(ScrollTrigger)

const A = asset('/assets/results')

// Photo layout from Figma 530:4602 (design px in the 1512x570 frame): centre, rotation, content box.
interface Photo {
  src: string
  cx: number
  cy: number
  rot: number
  w: number
  h: number
  /** Crop as a share of the box (Figma): image size and offset; omitted = cover. */
  crop?: { h: number; left: number; top: number }
}

const PHOTOS: Photo[] = [
  { src: 'm291.jpg', cx: 873.4, cy: 29.6, rot: 15.74, w: 123, h: 111.992 },
  { src: 'm292.jpg', cx: 934.2, cy: 115, rot: 2.82, w: 123, h: 111.992 },
  { src: 'm290.jpg', cx: 1008.4, cy: 179.6, rot: 15.74, w: 123, h: 111.992 },
  { src: 'm293.jpg', cx: 1122.6, cy: 221.2, rot: -4.75, w: 123, h: 104.565, crop: { h: 209.12, left: 0.13, top: 0.46 } },
  { src: 'm288.jpg', cx: 1243.8, cy: 209.9, rot: 6.86, w: 123, h: 105.252, crop: { h: 155.82, left: 0.71, top: -21.01 } },
  { src: 'm294.jpg', cx: 1343.8, cy: 244.9, rot: -5.01, w: 123, h: 105.252 },
  { src: 'm292.jpg', cx: 1439.8, cy: 232.9, rot: 19.21, w: 123, h: 105.252 },
]

// The first segment is the trajectory drawn in Figma (frame 530:4639, dot + curve); the second one
// carries the brush on through the rest of the photos.
const BRUSH_PATH =
  'M633 18 L654.3 31.1 C715.2 87.5 876.7 186.7 1035.9 131.4 C1123 101 1330 165 1540 215'

// Phone layout (Figma 549:8142, 390px wide): the same photos as small rotated tiles along the bottom edge,
// coordinates are px in the strip that starts 640px below the top of the block.
const PHONE_PHOTOS: Photo[] = [
  { src: 'm291.jpg', cx: 27.86, cy: 67, rot: 15.74, w: 72.524, h: 66.033 },
  { src: 'm292.jpg', cx: 63.7, cy: 117.4, rot: 2.82, w: 72.524, h: 66.033 },
  { src: 'm290.jpg', cx: 107.45, cy: 155.46, rot: 15.74, w: 72.524, h: 66.033 },
  { src: 'm293.jpg', cx: 174.81, cy: 179.98, rot: -4.75, w: 72.524, h: 61.654, crop: { h: 209.12, left: -0.11, top: -5.98 } },
  { src: 'm288.jpg', cx: 246.25, cy: 173.34, rot: 6.86, w: 72.524, h: 62.059, crop: { h: 155.82, left: 0.71, top: -21.01 } },
  { src: 'm294.jpg', cx: 305.21, cy: 193.97, rot: -5.01, w: 72.524, h: 62.059 },
  { src: 'm292.jpg', cx: 361.81, cy: 186.9, rot: 19.21, w: 72.524, h: 62.059 },
]
const PHONE_BRUSH_PATH =
  'M -10 40 L 27.9 67 C 50 85 55 110 63.7 117.4 S 90 150 107.5 155.5 S 150 178 174.8 180 S 225 168 246.3 173.3 S 290 190 305.2 194 S 350 180 361.8 186.9 L 400 195'

const PHONE_QUERY = '(max-width: 1100px)'
const subscribePhone = (cb: () => void) => {
  const mq = window.matchMedia(PHONE_QUERY)
  mq.addEventListener('change', cb)
  return () => mq.removeEventListener('change', cb)
}
const isPhone = () => window.matchMedia(PHONE_QUERY).matches

const CARDS: { x: number; w: number; title: string[]; mTitle?: string[]; body: string }[] = [
  { x: 50, w: 337, title: ['Рядом наставники-практики'], body: 'Показывают, что делать, и правят твою работу.' },
  { x: 409, w: 334, title: ['Идёшь по понятным шагам'], body: 'А не собираешь всё сам по кускам.' },
  { x: 767, w: 335, title: ['Зарабатывать можно уже', 'с первых недель'], body: 'А не через 5 лет.' },
  {
    x: 1123,
    w: 337,
    title: ['Ты не один. Рядом люди, которые помогут тебе сделать все правильно'],
    mTitle: ['Ты не один. Рядом люди, которые', 'помогут тебе сделать все правильно'],
    body: 'И быстрее получить результат.',
  },
]

function PhotoView({ p, i }: { p: Photo; i: number }) {
  const x = -p.w / 2
  const y = -p.h / 2
  const img = p.crop
    ? {
        x: x + (p.crop.left / 100) * p.w,
        y: y + (p.crop.top / 100) * p.h,
        width: p.w,
        height: (p.crop.h / 100) * p.h,
        preserveAspectRatio: 'none',
      }
    : { x, y, width: p.w, height: p.h, preserveAspectRatio: 'xMidYMid slice' }
  return (
    <g transform={`translate(${p.cx} ${p.cy}) rotate(${p.rot})`}>
      <clipPath id={`rs-clip-${i}`}>
        <rect x={x} y={y} width={0} height={p.h} data-w={p.w} />
      </clipPath>
      <image href={`${A}/${p.src}`} clipPath={`url(#rs-clip-${i})`} {...img} />
    </g>
  )
}

// Figma 530:4602 (final state) and 530:4639 (the brush: white dot = pointer, thin line = its path).
export function Results() {
  const phone = useSyncExternalStore(subscribePhone, isPhone, () => false)
  const photos = phone ? PHONE_PHOTOS : PHOTOS
  const brushPath = phone ? PHONE_BRUSH_PATH : BRUSH_PATH
  const sectionRef = useRef<HTMLElement>(null)
  const brushRef = useRef<SVGPathElement>(null)
  const trailRef = useRef<SVGPathElement>(null)
  const dotRef = useRef<SVGGElement>(null)

  useLayoutEffect(() => {
    const section = sectionRef.current
    const brush = brushRef.current
    const trail = trailRef.current
    const dot = dotRef.current
    if (!section || !brush || !trail || !dot) return

    const len = brush.getTotalLength()
    const rects = Array.from(section.querySelectorAll<SVGRectElement>('clipPath rect'))

    // Where along the path each photo sits (nearest path point to its centre), so a photo opens
    // just as the dot reaches it. Photos are revealed whole: no mask, nothing is ever cropped.
    const samples = 600
    const along = photos.map((ph) => {
      let best = 0
      let bestD = Infinity
      for (let i = 0; i <= samples; i++) {
        const pt = brush.getPointAtLength((len * i) / samples)
        const d = Math.hypot(pt.x - ph.cx, pt.y - ph.cy)
        if (d < bestD) {
          bestD = d
          best = i / samples
        }
      }
      return best
    })

    const state = { p: 0 }
    const opened = new Set<number>()

    const apply = () => {
      const off = len * (1 - state.p)
      trail.style.strokeDashoffset = String(off)
      const pt = brush.getPointAtLength(len * state.p)
      dot.setAttribute('transform', `translate(${pt.x} ${pt.y})`)
      along.forEach((t, i) => {
        if (opened.has(i) || state.p < t - 0.05) return
        opened.add(i)
        const r = rects[i]
        gsap.to(r, {
          attr: { width: Number(r.dataset.w) },
          duration: 0.5,
          ease: 'power2.out',
        })
      })
    }

    const ctx = gsap.context(() => {
      gsap.set(trail, { strokeDasharray: len, opacity: 0 })
      gsap.set(dot, { opacity: 0 })
      apply()

      const tl = gsap.timeline({ paused: true })
      tl.to([trail, dot], { opacity: 1, duration: 0.25, ease: 'none' })
        .to(state, { p: 1, duration: 2.6, ease: 'power2.inOut', onUpdate: apply }, 0)
        .to([trail, dot], { opacity: 0, duration: 0.7, ease: 'power1.in' }, '>-0.1')

      ScrollTrigger.create({
        trigger: section,
        start: 'top 65%',
        once: true,
        onEnter: () => tl.play(),
      })
    }, section)
    return () => ctx.revert()
  }, [photos])

  return (
    <section className="rs" id="results" ref={sectionRef}>
      <h2 className="rs-heading">
        <span className="rs-d">
          Почему получится и у тебя:{' '}
          <br />
          Такие же мужчины — с завода,{' '}
          <br />
          из-за руля, с обычной работы
        </span>
        <span className="rs-m">
          Почему получится и у тебя:{' '}
          <br />
          Такие же мужчины —{' '}
          <br />с завода, из-за руля,{' '}
          <br />с обычной работы
        </span>
      </h2>
      <p className="rs-sub">
        Уже сделали первый результат.{' '}
        <br />
        Их истории ниже.
      </p>

      <div className="rs-art">
        <svg className="rs-svg" viewBox={phone ? '0 0 390 265' : '0 0 1512 570'} aria-hidden="true">
          <path ref={brushRef} d={brushPath} fill="none" stroke="none" />
          <g>
            {photos.map((p, i) => (
              <PhotoView p={p} i={i} key={i} />
            ))}
          </g>
          <path ref={trailRef} d={brushPath} fill="none" stroke="#fff" strokeWidth="1" />
          <g ref={dotRef}>
            <circle r="9" fill="#fff" />
            <circle r="2" fill="#1b1d20" />
          </g>
        </svg>
      </div>

      <ul className="rs-cards">
        {CARDS.map((c) => (
          <li className="rs-card" key={c.x} style={{ left: `calc(${c.x} * var(--u))`, width: `calc(${c.w} * var(--u))` }}>
            <h3 className="rs-card-title">
              <Lines lines={c.title} className={c.mTitle ? 'rs-d' : undefined} />
              {c.mTitle && <Lines lines={c.mTitle} className="rs-m" />}
            </h3>
            <p className="rs-card-body">{c.body}</p>
          </li>
        ))}
      </ul>
    </section>
  )
}
