import { asset } from '../../lib/asset'

/** Lightweight first paint. Once the GPU scene is up it is hidden: the scene's own intro slides the man in, and a
 *  second copy standing beneath it showed up as a ghost face. */
export function HeroPortrait({ hidden = false }: { hidden?: boolean }) {
  return (
    <picture className="hero-static" aria-hidden="true" style={hidden ? { visibility: 'hidden' } : undefined}>
      <source media="(min-width: 566px) and (max-width: 1100px) and (orientation: portrait), (min-width: 566px) and (max-width: 767px)" srcSet={asset('/assets/hero/optimized/tablet-base.webp')} />
      <source media="(max-width: 767px), (max-width: 1100px) and (orientation: portrait)" srcSet={asset('/assets/hero/optimized/new-base-cutout-phone.webp')} />
      <img src={asset('/assets/hero/optimized/new-base-cutout.webp')} alt="" fetchPriority="high" />
    </picture>
  )
}
