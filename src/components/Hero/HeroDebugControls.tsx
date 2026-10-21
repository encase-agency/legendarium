import { useEffect } from 'react'
import { button, useControls, Leva } from 'leva'
import { HERO_CONFIG } from '../../lib/heroConfig'
import type { HeroControls } from './heroControls'

interface Props {
  onChange: (values: HeroControls) => void
  replayBrush: () => void
  pauseBrush: () => void
  toggleBlueprint: () => void
  showBlueprint: () => void
}

export default function HeroDebugControls({ onChange, replayBrush, pauseBrush, toggleBlueprint, showBlueprint }: Props) {
  const [{ image, opacity, alignmentMode, translateX, translateY, scale }, setAlignment] =
    useControls(() => ({
      image: {
        value: HERO_CONFIG.alignment.image as 'base' | 'blueprint' | 'knight',
        options: { Base: 'base', Blueprint: 'blueprint', Knight: 'knight' },
      },
      opacity: { value: HERO_CONFIG.alignment.opacity, min: 0, max: 1, step: 0.01 },
      alignmentMode: false,
      translateX: { value: HERO_CONFIG.alignment.translateX, min: -400, max: 400, step: 1 },
      translateY: { value: HERO_CONFIG.alignment.translateY, min: -400, max: 400, step: 1 },
      scale: { value: HERO_CONFIG.alignment.scale, min: 0.5, max: 1.5, step: 0.001 },
      reset: button(() => {
        setAlignment({ translateX: 0, translateY: 0, scale: 1, opacity: 1 })
      }),
    }))

  const [brush] = useControls('Brush', () => ({
    sizeVw: { value: HERO_CONFIG.brush.sizeVw, min: 4, max: 40, step: 0.5 },
    minSizePx: { value: HERO_CONFIG.brush.minSizePx, min: 40, max: 400, step: 1 },
    maxSizePx: { value: HERO_CONFIG.brush.maxSizePx, min: 40, max: 600, step: 1 },
    coreFraction: { value: HERO_CONFIG.brush.coreFraction, min: 0.1, max: 0.9, step: 0.01 },
    coreOpacity: { value: HERO_CONFIG.brush.coreOpacity, min: 0.1, max: 1, step: 0.01 },
    featherFraction: { value: HERO_CONFIG.brush.featherFraction, min: 0, max: 0.6, step: 0.01 },
    fadeDurationMs: { value: HERO_CONFIG.brush.fadeDurationMs, min: 200, max: 6000, step: 50 },
    inertiaTauMs: { value: HERO_CONFIG.brush.inertiaTauMs, min: 0, max: 400, step: 5 },
    stepSpacingPx: { value: HERO_CONFIG.brush.stepSpacingPx, min: 1, max: 40, step: 1 },
    maxDevicePixelRatio: { value: HERO_CONFIG.brush.maxDevicePixelRatio, min: 1, max: 3, step: 0.1 },
    maskMin: { value: HERO_CONFIG.brush.maskMin, min: 0, max: 0.9, step: 0.01 },
    maskMax: { value: HERO_CONFIG.brush.maskMax, min: 0.1, max: 1, step: 0.01 },
    alternateBackgroundColor: { value: HERO_CONFIG.brush.alternateBackgroundColor, label: 'Alternate background color' },
  }))

  const [autoValues] = useControls('Auto Brush', () => ({
    autoStrokeY1: { value: HERO_CONFIG.brush.autoStrokeY[0], min: 0, max: 1, step: 0.01, label: 'Auto stroke Y 1' },
    autoStrokeY2: { value: HERO_CONFIG.brush.autoStrokeY[1], min: 0, max: 1, step: 0.01, label: 'Auto stroke Y 2' },
    autoStrokeY3: { value: HERO_CONFIG.brush.autoStrokeY[2], min: 0, max: 1, step: 0.01, label: 'Auto stroke Y 3' },
    autoStrokeY4: { value: HERO_CONFIG.brush.autoStrokeY[3], min: 0, max: 1, step: 0.01, label: 'Auto stroke Y 4' },
    autoRadiusMultiplier: { value: HERO_CONFIG.brush.autoRadiusMultiplier, min: 1, max: 2, step: 0.01 },
    autoWobbleAmplitudePercent: { value: HERO_CONFIG.brush.autoWobbleAmplitudePercent, min: 0, max: 15, step: 0.5 },
    autoWobbleFrequency: { value: HERO_CONFIG.brush.autoWobbleFrequency, min: 0.2, max: 5, step: 0.1 },
    autoEdgeOvershootRadii: { value: HERO_CONFIG.brush.autoEdgeOvershootRadii, min: 0.5, max: 3, step: 0.05 },
  }))

  const [background] = useControls('Background', () => ({
    enabled: { value: true, label: 'Show dynamic background' },
    paused: { value: false, label: 'Freeze dynamic background' },
    testColor: { value: false, label: 'Background test color' },
    shapeScale: {
      value: HERO_CONFIG.dynamicBackground.shapeScale,
      min: 0.2,
      max: 3,
      step: 0.05,
      label: 'Shape scale',
    },
    speed: { value: HERO_CONFIG.dynamicBackground.speed, min: 0, max: 0.3, step: 0.005, label: 'Shape speed' },
    fillColor: { value: HERO_CONFIG.dynamicBackground.fillColor, label: 'Background fill color' },
    fillOpacity: {
      value: HERO_CONFIG.dynamicBackground.fillOpacity,
      min: 0,
      max: 1,
      step: 0.005,
      label: 'Background fill opacity',
    },
    outlineColor: { value: HERO_CONFIG.dynamicBackground.outlineColor, label: 'Background outline color' },
    outlineOpacity: {
      value: HERO_CONFIG.dynamicBackground.outlineOpacity,
      min: 0,
      max: 1,
      step: 0.005,
      label: 'Background outline opacity',
    },
    outlineThickness: {
      value: HERO_CONFIG.dynamicBackground.outlineThickness,
      min: 0.3,
      max: 4,
      step: 0.05,
      label: 'Background outline thickness',
    },
    lineFrequency: {
      value: HERO_CONFIG.dynamicBackground.lineFrequency,
      min: 1,
      max: 16,
      step: 0.5,
      label: 'Background line frequency',
    },
    showFillMask: { value: false, label: 'Show fill mask' },
    showEdgeMask: { value: false, label: 'Show edge mask' },
    distortion: { value: HERO_CONFIG.dynamicBackground.distortion, min: 0, max: 1.5, step: 0.01 },
    cursorInfluence: { value: HERO_CONFIG.dynamicBackground.cursorInfluence, min: 0, max: 1, step: 0.01 },
  }))

  // Knight helmet: the metal mask is baked once from the real photo via
  // edge-detection + flood-fill, calibrated here and frozen in
  // heroConfig.ts - never animated.
  const [knightHelmet] = useControls('Knight Helmet', () => ({
    showHelmetMask: { value: false, label: 'Alignment mode (metal @ 50%)' },
    showOcclusionMask: { value: false, label: 'Show person occlusion mask' },
    openingOffsetX: { value: HERO_CONFIG.knightHelmet.openingOffsetX, min: -0.1, max: 0.1, step: 0.001 },
    openingOffsetY: { value: HERO_CONFIG.knightHelmet.openingOffsetY, min: -0.1, max: 0.1, step: 0.001 },
    openingScale: { value: HERO_CONFIG.knightHelmet.openingScale, min: 0.8, max: 1.2, step: 0.001 },
  }))


  useControls('Auto Brush', () => ({
    'Replay auto brush': button(replayBrush),
    'Pause auto brush': button(pauseBrush),
  }))
  useControls('Blueprint', () => ({
    'Pause / resume blueprint loop': button(toggleBlueprint),
    'Toggle show blueprint permanently': button(showBlueprint),
  }))
  useEffect(() => {
    onChange({ image, opacity, alignmentMode, translateX, translateY, scale, brush, autoValues, background, knightHelmet })
  }, [onChange, image, opacity, alignmentMode, translateX, translateY, scale, brush, autoValues, background, knightHelmet])
  return <Leva titleBar={{ title: 'Hero Debug' }} collapsed={false} />
}
