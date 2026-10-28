import { useLayoutEffect, type RefObject } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

const calm = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

/**
 * Basic card motion: every card rises and fades in once, when it first comes into view (staggered if several arrive
 * together); on desktop it also lifts a little under the pointer (CSS .fx-card in index.css).
 */
export function useCardReveal(ref: RefObject<HTMLElement | null>, selector: string) {
  useLayoutEffect(() => {
    const root = ref.current
    if (!root) return
    const cards = Array.from(root.querySelectorAll<HTMLElement>(selector))
    cards.forEach((c) => c.classList.add('fx-card'))
    if (calm() || !cards.length) return
    gsap.set(cards, { opacity: 0, y: 34 })
    const io = new IntersectionObserver(
      (entries) => {
        const hit = entries
          .filter((e) => e.isIntersecting || e.boundingClientRect.top < 0)
          .map((e) => e.target as HTMLElement)
          .sort((a, b) => cards.indexOf(a) - cards.indexOf(b))
        hit.forEach((el, i) => {
          io.unobserve(el)
          gsap.to(el, { opacity: 1, y: 0, duration: 0.75, delay: i * 0.09, ease: 'power3.out', clearProps: 'transform,opacity' })
        })
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.04 },
    )
    cards.forEach((c) => io.observe(c))
    return () => {
      io.disconnect()
      gsap.killTweensOf(cards)
      gsap.set(cards, { clearProps: 'transform,opacity' })
      cards.forEach((c) => c.classList.remove('fx-card'))
    }
  }, [ref, selector])
}
