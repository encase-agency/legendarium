const params = typeof window === 'undefined' ? null : new URLSearchParams(window.location.search)
/** The intro plays always (even with "reduce motion" on); skipped only in ?debug=1 or with ?intro=0. */
export const INTRO_SKIPPED = params?.get('debug') === '1' || params?.get('intro') === '0'

/** Shared with the WebGL scene: 0 = person hidden/pushed down, 1 = fully in place. */
export const intro = { person: INTRO_SKIPPED ? 1 : 0 }
