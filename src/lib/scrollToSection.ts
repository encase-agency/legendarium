/** Blocks that are shorter than the screen and have the same dark background as their neighbours: they are centred
 *  in the viewport instead of being glued to its top edge (so their content is never cut off or hidden by the header). */
const CENTERED = new Set(['pricing'])

/** Scrolls to a section by id. Sections pinned by ScrollTrigger
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

let cancelPending: (() => void) | undefined

/** `instant`: jump without the long smooth scroll through every pinned block on the way (no flicker, lands exactly). */
export function scrollToSection(id: string, offset = 0, instant = false) {
  cancelPending?.()
  const top = targetTop(id, offset)
  if (top === null) return
  const viewport = window
  const behavior: ScrollBehavior = instant || viewport.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth'
  let idleTimer = 0
  let deadline = 0
  let corrections = 0
  const cancel = () => {
    viewport.clearTimeout(idleTimer)
    viewport.clearTimeout(deadline)
    viewport.removeEventListener('scroll', scheduleSettle)
    viewport.removeEventListener('wheel', cancel)
    viewport.removeEventListener('touchstart', cancel)
    viewport.removeEventListener('keydown', cancel)
    viewport.removeEventListener('pointerdown', cancel)
    if (cancelPending === cancel) cancelPending = undefined
  }
  // Wait until native smooth scrolling settles. Fixed 120/400/900 ms jumps
  // would interrupt that animation and race ScrollTrigger/lazy layout changes.
  const scheduleSettle = () => {
    viewport.clearTimeout(idleTimer)
    idleTimer = viewport.setTimeout(() => {
      const again = targetTop(id, offset)
      if (again !== null && corrections < 2 && Math.abs(again - viewport.scrollY) > 1) {
        corrections++
        viewport.scrollTo({ top: again, behavior })
        scheduleSettle()
      } else cancel()
    }, 180)
  }
  cancelPending = cancel
  viewport.addEventListener('scroll', scheduleSettle, { passive: true })
  viewport.addEventListener('wheel', cancel, { passive: true })
  viewport.addEventListener('touchstart', cancel, { passive: true })
  viewport.addEventListener('keydown', cancel)
  viewport.addEventListener('pointerdown', cancel, { passive: true })
  deadline = viewport.setTimeout(cancel, 5000)
  viewport.scrollTo({ top, behavior })
  scheduleSettle()
}
