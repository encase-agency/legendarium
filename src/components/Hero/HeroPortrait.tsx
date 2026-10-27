import { asset } from '../../lib/asset'

/** Lightweight first paint, also retained beneath the animated GPU scene. */
export function HeroPortrait() {
  return (
    <picture className="hero-static" aria-hidden="true">
      <source media="(max-width: 1100px)" srcSet={asset('/assets/hero/optimized/new-base-cutout-phone.webp')} />
      <img src={asset('/assets/hero/optimized/new-base-cutout.webp')} alt="" fetchPriority="high" />
    </picture>
  )
}
