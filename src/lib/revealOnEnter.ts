import gsap from 'gsap'

/** Measure the live viewport intersection, rather than cached offsets before pin spacers settle. */
export function revealOnEnter(element: HTMLElement) {
  if (!('IntersectionObserver' in window) || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return () => {}
  const opacity = element.style.opacity
  const reveal = gsap.fromTo(element, { opacity: 0 }, { opacity: 1, duration: 1.2, ease: 'power2.out', paused: true })
  let played = false
  const observer = new IntersectionObserver(entries => {
    if (played || !entries.some(entry => entry.target === element && entry.isIntersecting)) return
    played = true
    observer.disconnect()
    reveal.play(0)
  }, { rootMargin: '0px 0px -80px 0px', threshold: 0 })
  observer.observe(element)
  return () => {
    observer.disconnect()
    reveal.kill()
    element.style.opacity = opacity
  }
}
