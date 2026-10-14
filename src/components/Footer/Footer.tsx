import { useLayoutEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import './Footer.css'
import { asset } from '../../lib/asset'

gsap.registerPlugin(ScrollTrigger)

const A = asset('/assets/footer')

// Figma 545:6889: the footer's own frame is 1512x809, the top 121px of it show the end of the previous block,
// which here is the real last card of the Story stack, so the footer starts right below it.
const COLS: { title: string; w?: number; x: number; links: { label: string; href: string }[] }[] = [
  {
    title: 'Информация',
    x: 50,
    links: [
      { label: 'Dubai / ОАЭ', href: '#footer' },
      { label: 'Legendarium@yandex.ru', href: 'mailto:Legendarium@yandex.ru' },
      { label: '+467 874 747', href: 'tel:+467874747' },
    ],
  },
  {
    title: 'меню',
    x: 273,
    links: [
      { label: 'Главная', href: '#hero' },
      { label: 'О нас', href: '#platform' },
      { label: 'Тарифы', href: '#pricing' },
      { label: 'Контакты', href: '#footer' },
    ],
  },
  {
    title: 'Социальные сети',
    x: 482,
    links: [
      { label: 'Instagram', href: '#' },
      { label: 'Telegram', href: '#' },
      { label: 'WhatsApp', href: '#' },
      { label: 'YouTube', href: '#' },
    ],
  },
  {
    title: 'Документы',
    x: 691,
    links: [
      { label: 'Политика конфиденциальности', href: '#' },
      { label: 'Правовые данные', href: '#legal' },
      { label: 'Правила использования', href: '#' },
      { label: 'Сookies', href: '#' },
    ],
  },
]

/** Small rotated shields at the bottom: bounding box (x, y) in the 809px frame, rotation, size of the shield itself. */
const SHIELDS = [
  { x: 273, y: 746, w: 58.758, h: 62.262, r: -26.96, iw: 41, ih: 49 },
  { x: 894.11, y: 747.92, w: 50.588, h: 56.678, r: -12.43, iw: 41, ih: 49 },
  { x: 1071, y: 749, w: 55.634, h: 60.302, r: 20.63, iw: 41, ih: 49 },
  { x: 1264, y: 751, w: 63.457, h: 63.773, r: -43.4, iw: 41, ih: 49 },
  { x: 773, y: 765, w: 30.429, h: 35.896, r: 2.16, iw: 29.138, ih: 34.823 },
]

// Phone layout (Figma 648:3839, 390x598): the same shields in the 342x60 strip above the bottom edge (x, y in that strip).
const MSHIELDS = [
  { x: -18, y: 34, w: 25.667, h: 27.198, r: -26.96, iw: 17.91, ih: 21.405 },
  { x: 226.29, y: 34.8, w: 22.098, h: 24.759, r: -12.43, iw: 17.91, ih: 21.405 },
  { x: 295.69, y: 35.41, w: 24.303, h: 26.342, r: 20.63, iw: 17.91, ih: 21.405 },
  { x: 99, y: 46, w: 27.72, h: 27.858, r: -43.4, iw: 17.91, ih: 21.405 },
  { x: 179.13, y: 42.59, w: 13.292, h: 15.681, r: 2.16, iw: 12.728, ih: 15.212 },
]

const FRAME_TOP = 121 // the slice of the previous block that the frame includes

export function Footer() {
  const footerRef = useRef<HTMLElement>(null)

  // The little shields fall like balls: they drop from the top of the block through the page, hit the wordmark and
  // bounce down to the bottom edge, each landing turned its own way (the final turn is the one from the design).
  useLayoutEffect(() => {
    const footer = footerRef.current
    if (!footer) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const mm = gsap.matchMedia()
    const run = (selector: string) => {
      const items = Array.from(footer.querySelectorAll<HTMLElement>(selector))
      const tween = gsap.fromTo(
        items,
        {
          y: (i, el: HTMLElement) => -(el.offsetTop + 60 + i * 40),
          x: (i) => (i % 2 ? 1 : -1) * (14 + i * 6),
          rotation: (i) => (i % 2 ? 1 : -1) * (200 + i * 70),
          opacity: 0,
        },
        {
          y: 0,
          x: 0,
          rotation: 0,
          opacity: 1,
          duration: 1.5,
          ease: 'bounce.out',
          stagger: { each: 0.14, from: 'random' },
          scrollTrigger: { trigger: footer, start: 'top 80%', toggleActions: 'play none none reset' },
        },
      )
      return () => {
        tween.scrollTrigger?.kill()
        tween.kill()
        gsap.set(items, { clearProps: 'transform,opacity' })
      }
    }
    mm.add('(min-width: 1101px)', () => run('.ft-shield:not(.ft-shield--m)'))
    mm.add('(max-width: 1100px)', () => run('.ft-shield--m'))
    return () => mm.revert()
  }, [])

  return (
    <footer className="ft" id="footer" ref={footerRef}>
      {SHIELDS.map((s, i) => (
        <div
          className="ft-shield"
          key={i}
          style={{
            left: `calc(${s.x} * var(--u))`,
            top: `calc(${s.y - FRAME_TOP} * var(--u))`,
            width: `calc(${s.w} * var(--u))`,
            height: `calc(${s.h} * var(--u))`,
          }}
        >
          <span
            style={{
              width: `calc(${s.iw} * var(--u))`,
              height: `calc(${s.ih} * var(--u))`,
              transform: `rotate(${s.r}deg)`,
            }}
          >
            <img src={`${A}/shield.png`} alt="" />
          </span>
        </div>
      ))}

      {COLS.map((c) => (
        <nav className="ft-col" key={c.title} style={{ left: `calc(${c.x} * var(--u))` }} aria-label={c.title}>
          <p className="ft-title">{c.title}</p>
          <ul>
            {c.links.map((l) => (
              <li key={l.label}>
                <a href={l.href}>{l.label}</a>
              </li>
            ))}
          </ul>
        </nav>
      ))}

 
      {MSHIELDS.map((s, i) => (
        <div
          className="ft-shield ft-shield--m"
          key={i}
          style={{
            left: `calc((24 + ${s.x}) * var(--mu))`,
            top: `calc((534 + ${s.y}) * var(--mu))`,
            width: `calc(${s.w} * var(--mu))`,
            height: `calc(${s.h} * var(--mu))`,
          }}
        >
          <span
            style={{
              width: `calc(${s.iw} * var(--mu))`,
              height: `calc(${s.ih} * var(--mu))`,
              transform: `rotate(${s.r}deg)`,
            }}
          >
            <img src={`${A}/shield.png`} alt="" />
          </span>
        </div>
      ))}

      <img className="ft-wordmark" src={`${A}/wordmark-new.png`} alt="Легендариум" />
    </footer>
  )
}
