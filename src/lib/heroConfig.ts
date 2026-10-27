import { asset } from './asset'
export const HERO_CONFIG = {
  alignment: {
    image: 'blueprint' as const,
    opacity: 1,
    translateX: 0,
    translateY: 0,
    scale: 1,
  },
  brush: {
    /** Manual (mouse) brush diameter as a fraction of viewport width (16 = 16vw). Never changes. */
    sizeVw: 16,
    minSizePx: 140,
    maxSizePx: 230,
    /** Fraction of the diameter painted as a solid opaque core. Shared by manual + auto. */
    coreFraction: 0.65,
    /** Alpha of the opaque core, 0-1. */
    coreOpacity: 1,
    /** Blur radius as a fraction of the diameter, softens the edge. */
    featherFraction: 0,
    /** Approximate time for a stamp to decay to ~invisible. Manual brush only. */
    fadeDurationMs: 2200,
    /** Time constant (ms) for the pointer-follower smoothing/inertia. Manual brush only. */
    inertiaTauMs: 45,
    /** Max spacing (CSS px) between interpolated points along the path. */
    stepSpacingPx: 6,
    maxDevicePixelRatio: 1,
    /** smoothstep(maskMin, maskMax, brushMask) range for the knight reveal. */
    maskMin: 0.4,
    maskMax: 0.6,
    /** Flat wash color revealed by the brush off the man. Exact at mask core (maskValue=1) -
     *  no white overlay, no screen/additive blending, no re-mixing with the base background. */
    alternateBackgroundColor: '#EAEAE5',
    /** autoRadius = manualRadius * autoRadiusMultiplier. Manual radius itself never changes. */
    autoRadiusMultiplier: 0.95,
    /** Fixed, calculated once: was (1200/1.4 + 1500/1.4)/2 ≈ 964ms, halved this round ≈ 482ms. */
    autoDurationMs: 482,
    /** Gap between consecutive strokes in the Phase C chain (ms). Trail may still be fading. */
    autoStrokeGapMs: 130,
    /** Height of each of the 4 staircase auto strokes, as a fraction (0-1) of viewport height. */
    autoStrokeY: [0.3, 0.43, 0.56, 0.69],
    /** Vertical wobble amplitude, as % of viewport height, for an organic auto-stroke path. */
    autoWobbleAmplitudePercent: 3,
    /** Number of wobble oscillations across a single auto stroke. */
    autoWobbleFrequency: 1.4,
    /** Each auto stroke starts/ends this many (auto) brush-radii beyond the canvas edge. */
    autoEdgeOvershootRadii: 1.25,
  },
  // Large, slowly-flowing FILLED organic blobs (not thin contour lines - a
  // thin line has so little screen area that even a strongly-visible
  // per-pixel opacity reads as "basically nothing" once averaged over the
  // frame; a filled region at the same opacity is what actually reads on
  // screen). Sits behind the person (z=0) so it can never draw over him,
  // his clothes, the helmet, or the HTML UI: the person layer's own alpha
  // already occludes it correctly wherever he is.
  dynamicBackground: {
    enabled: true,
    /** Blob fill color - sampled independently from the outline via its own
     *  fillMask, so fillOpacity alone controls its visibility (it's never
     *  diluted by a shared/global opacity that also fades the outline). */
    fillColor: '#DEDED9',
    fillOpacity: 0.65,
    /** Edge accent color, sampled via its own edgeMask/outlineOpacity so it
     *  reaches its real color at the line's core instead of being washed
     *  out by the fill's opacity. */
    outlineColor: '#D9D9D9',
    outlineOpacity: 1,
    /** Edge line thickness, as a fraction of one contour cycle (see lineFrequency). */
    outlineThickness: 1.05,
    /** How many contour lines are sliced out of the noise field per unit -
     *  higher = more, closer-together flowing lines (the "veins" look);
     *  lower = fewer, wider-spaced lines closer to a single blob outline. */
    lineFrequency: 2.85,
    /** Lower = larger, fewer, more sweeping blobs (~4-8 on screen at once). */
    shapeScale: 0.5,
    speed: 0.021,
    /** Domain-warp strength driving the organic, flowing look. */
    distortion: 0.35,
    /** Strength of the local warp the field gets near the real cursor. */
    cursorInfluence: 0.12,
  },
  // Independent, always-running loop (system B) - a single continuous
  // top-to-bottom sweep, repeat:-1 with repeatDelay:0, never paused by the
  // brush or anything else. No "N passes then pause" concept anymore: the
  // reset from bottom back to top happens instantly while the band is
  // off-screen (past bandOuter), so the loop point is never visible.
  blueprint: {
    enabled: true,
    continuous: true,
    repeatDelay: 0,
    /** newDuration = oldDuration / 1.3 (~30% faster), not oldDuration * 0.7. */
    speedMultiplier: 1.3,
    passDurationMs: (1.2 * 1000) / 1.3,
    /** Half-width (in UV/vUv.y fraction) where the band is fully opaque. */
    bandInner: 0.05,
    /** Half-width (in UV/vUv.y fraction) where the band has fully faded out. */
    bandOuter: 0.18,
  },
  // Independent, periodically-repeating loop (system C): a chain of
  // autoStrokeCount strokes, then a pause, then repeat - entirely separate
  // from the blueprint loop above, which it never touches.
  sequence: {
    autoStrokeCount: 4,
    /** Seconds. Trail fades, then the auto-stroke chain repeats. */
    pauseAfterAutoStrokes: 2.0,
    /** Seconds of real-pointer inactivity before the auto-stroke chain (re)starts. */
    idleRestartDelay: 2.0,
  },
  // Knight reveal: the metal mask (public/assets/hero/new-knight-opening-mask.png)
  // is baked once, pixel-for-pixel, from new-knight.jpg itself via edge-detection
  // + flood-fill from the eyes/nose/mouth - so it is inherently already
  // aligned with the photo. openingOffsetX/Y/Scale exist only as a
  // calibration escape hatch and default to identity; never animated.
  knightHelmet: {
    openingMaskUrl: asset('/assets/hero/optimized/new-knight-opening-mask.webp'),
    openingOffsetX: 0,
    openingOffsetY: 0,
    openingScale: 1,
  },
} as const

export type HeroAlignmentConfig = typeof HERO_CONFIG.alignment
export type HeroBrushConfig = typeof HERO_CONFIG.brush
export type HeroDynamicBackgroundConfig = typeof HERO_CONFIG.dynamicBackground
export type HeroBlueprintConfig = typeof HERO_CONFIG.blueprint
export type HeroSequenceConfig = typeof HERO_CONFIG.sequence
export type HeroKnightHelmetConfig = typeof HERO_CONFIG.knightHelmet
