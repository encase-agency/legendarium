/** Blocks that are shorter than the screen and have the same dark background as their neighbours: they are centred
 *  in the viewport instead of being glued to its top edge (so their content is never cut off or hidden by the header). */
const CENTERED = new Set(['pricing'])

/** Jumps straight to a section by id (no scrolling through the blocks in between). Sections pinned by ScrollTrigger
 *  live inside a ".pin-spacer": its natural top is used. */
function targetTop(id: string, offset: number): number | null {
  const el = document.getElementById(id)
  if (!el) return null
  const spacer = el.parentElement?.classList.contains('pin-spacer') ? el.parentElement : null
  const target = spacer ?? el
  const rect = target.getBoundingClientRect()
  let top = rect.top + window.scrollY + offset
  if (!spacer && CENTERED.has(id)) {
    const free = window.innerHeight - rect.height
    if (free > 0) top -= Math.min(free / 2, 140)
  }
  return Math.max(0, Math.round(top))
}

export function scrollToSection(id: string, offset = 0) {
  const top = targetTop(id, offset)
  if (top === null) return
  window.scrollTo({ top, behavior: 'instant' })
  // Lazy images and ScrollTrigger refreshes right after a long jump can move the layout a little: settle exactly,
  // unless the visitor starts scrolling meanwhile.
  let cancelled = false
  const cancel = () => {
    cancelled = true
  }
  window.addEventListener('wheel', cancel, { once: true, passive: true })
  window.addEventListener('touchstart', cancel, { once: true, passive: true })
  window.addEventListener('keydown', cancel, { once: true })
  for (const delay of [120, 400, 900]) {
    window.setTimeout(() => {
      if (cancelled) return
      const again = targetTop(id, offset)
      if (again !== null && Math.abs(again - window.scrollY) > 1) window.scrollTo({ top: again, behavior: 'instant' })
    }, delay)
  }
  window.setTimeout(() => {
    window.removeEventListener('wheel', cancel)
    window.removeEventListener('touchstart', cancel)
    window.removeEventListener('keydown', cancel)
  }, 1000)
}
