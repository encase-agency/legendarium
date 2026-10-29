import { computeCoverUV } from './coverUV'

// Mobile portrait originally occupied y=358..952. Extend the drawing surface
// to the CTA's bottom (y=299), retaining the same bottom-anchored portrait pixels.
export const MOBILE_SCENE_HEIGHT_RATIO = (952 - 299) / (952 - 358)

/** `tablet`: the iPad layout (768-1100px) has its own frame and shows the picture like "cover", not the phone crop. */
export function computePersonCoverUV(imageAspect: number, containerAspect: number, phone: boolean, tablet = false) {
  if (!phone || tablet) return computeCoverUV(imageAspect, containerAspect)
  const repeatY = imageAspect < 1.5 ? 0.9556 : 1.3167
  const offsetY = imageAspect < 1.5 ? 0.00215 : -0.3748
  return { repeatX: 0.5145, repeatY: repeatY * MOBILE_SCENE_HEIGHT_RATIO, offsetX: 0.2504, offsetY }
}
