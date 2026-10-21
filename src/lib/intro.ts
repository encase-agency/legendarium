const params = typeof window === 'undefined' ? null : new URLSearchParams(window.location.search)
/** Respect the device motion preference; explicit skip parameters also remain supported. */
export const INTRO_SKIPPED = params?.get('debug') === '1' || params?.get('intro') === '0' ||
  (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches)

/** Shared with the WebGL scene: 0 = person hidden/pushed down, 1 = fully in place. */
export const intro = { person: INTRO_SKIPPED ? 1 : 0 }
