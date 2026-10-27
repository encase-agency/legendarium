import { HERO_CONFIG } from '../../lib/heroConfig'

type Widen<T> = { -readonly [K in keyof T]: T[K] extends number ? number : T[K] extends string ? string : T[K] extends boolean ? boolean : T[K] }
type Brush = Widen<typeof HERO_CONFIG.brush>
export interface HeroControls {
  image: string
  opacity: number
  translateX: number
  translateY: number
  scale: number
  alignmentMode: boolean
  brush: Omit<Brush, 'autoStrokeY' | 'autoRadiusMultiplier' | 'autoDurationMs' | 'autoStrokeGapMs' | 'autoWobbleAmplitudePercent' | 'autoWobbleFrequency' | 'autoEdgeOvershootRadii'>
  autoValues: Pick<Brush, 'autoRadiusMultiplier' | 'autoWobbleAmplitudePercent' | 'autoWobbleFrequency' | 'autoEdgeOvershootRadii'> & { autoStrokeY1: number; autoStrokeY2: number; autoStrokeY3: number; autoStrokeY4: number }
  background: Widen<typeof HERO_CONFIG.dynamicBackground> & { paused: boolean; testColor: boolean; showFillMask: boolean; showEdgeMask: boolean }
  knightHelmet: Omit<Widen<typeof HERO_CONFIG.knightHelmet>, 'openingMaskUrl'> & { showHelmetMask: boolean; showOcclusionMask: boolean }
}

export const DEFAULT_HERO_CONTROLS: HeroControls = {
  ...HERO_CONFIG.alignment,
  alignmentMode: false,
  brush: HERO_CONFIG.brush,
  autoValues: {
    autoStrokeY1: HERO_CONFIG.brush.autoStrokeY[0],
    autoStrokeY2: HERO_CONFIG.brush.autoStrokeY[1],
    autoStrokeY3: HERO_CONFIG.brush.autoStrokeY[2],
    autoStrokeY4: HERO_CONFIG.brush.autoStrokeY[3],
    autoRadiusMultiplier: HERO_CONFIG.brush.autoRadiusMultiplier,
    autoWobbleAmplitudePercent: HERO_CONFIG.brush.autoWobbleAmplitudePercent,
    autoWobbleFrequency: HERO_CONFIG.brush.autoWobbleFrequency,
    autoEdgeOvershootRadii: HERO_CONFIG.brush.autoEdgeOvershootRadii,
  },
  background: {
    ...HERO_CONFIG.dynamicBackground,
    paused: false, testColor: false, showFillMask: false, showEdgeMask: false,
  },
  knightHelmet: {
    ...HERO_CONFIG.knightHelmet,
    showHelmetMask: false, showOcclusionMask: false,
  },
}
