export interface CoverUV {
  repeatX: number
  repeatY: number
  offsetX: number
  offsetY: number
}

/**
 * Computes texture repeat/offset that reproduces CSS `background-size: cover`
 * inside a UV [0,1]x[0,1] space. Same inputs always produce the same output,
 * so calling this with the same containerAspect for images of equal aspect
 * ratio yields identical UV mapping for all of them.
 */
export function computeCoverUV(imageAspect: number, containerAspect: number): CoverUV {
  let repeatX = 1
  let repeatY = 1

  if (containerAspect > imageAspect) {
    repeatY = imageAspect / containerAspect
  } else {
    repeatX = containerAspect / imageAspect
  }

  return {
    repeatX,
    repeatY,
    offsetX: (1 - repeatX) / 2,
    offsetY: (1 - repeatY) / 2,
  }
}
