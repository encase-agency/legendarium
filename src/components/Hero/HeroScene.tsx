import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import gsap from 'gsap'
import type { HeroControls } from './heroControls'
import { createMaskTexture, resizeMaskTexture } from './maskTexture'
import { DEFAULT_HERO_CONTROLS } from './heroControls'

const HeroDebugControls = lazy(() => import('./HeroDebugControls'))
import { computePersonCoverUV } from '../../lib/personCoverUV'
import { HERO_CONFIG } from '../../lib/heroConfig'
import { backgroundFragmentShader, backgroundVertexShader } from './backgroundShader'
import { intro } from '../../lib/intro'
import { personFragmentShader, personVertexShader } from './personShader'
import { ArrowBrush } from './arrowBrush'
import { asset } from '../../lib/asset'
import { HeroPortrait } from './HeroPortrait'

// RGBA cutouts: person (+ headwear) opaque, background fully transparent,
// the source JPGs' baked-in decorative background lines removed. See
// scripts/notes in the PR description for how these were derived
// deterministically (flat background color + connected-component
// segmentation) without touching a single pixel of the man himself.
const HERO_IMAGES = {
  base: asset('/assets/hero/optimized/new-base-cutout.webp'),
  blueprint: asset('/assets/hero/optimized/new-blueprint-cutout.webp'),
  knight: asset('/assets/hero/optimized/new-knight-cutout.webp'),
} as const

/** Phone / tablet: the same cutouts, extended downwards (the whole sweater with the zipper pull from the mobile frame)
 *  and scaled to 60%: 4536x3720 -> 2722x2232. */
const HERO_IMAGES_PHONE: Record<keyof typeof HERO_IMAGES, string> = {
  base: asset('/assets/hero/optimized/new-base-cutout-phone.webp'),
  blueprint: asset('/assets/hero/optimized/new-blueprint-cutout-phone.webp'),
  knight: asset('/assets/hero/optimized/new-knight-cutout-phone.webp'),
}

type HeroImageKey = keyof typeof HERO_IMAGES

/** Flat backdrop color (layer 1), matches the original photos' background. */
const BACKGROUND_COLOR = 0xfcfcfa

/** The auto strokes stop this many CSS px before the left / right edge of the screen. */
const AUTO_SIDE_MARGIN = 100

/** The man floats a few pixels with the pointer: max shift (CSS px) and how much the photo is oversized to hide the edges. */
const PARALLAX_X = 9
const PARALLAX_Y = 6
const PERSON_OVERSCAN = 1.025
const PARALLAX_BG_SHARE = 0.4

const ALIGNMENT_FLICKER_MS = 450

interface HeroSceneProps {
  isDebug: boolean
}

interface AlignmentState {
  image: HeroImageKey
  opacity: number
  translateX: number
  translateY: number
  scale: number
}

interface BrushConfig {
  sizeVw: number
  minSizePx: number
  maxSizePx: number
  coreFraction: number
  coreOpacity: number
  featherFraction: number
  fadeDurationMs: number
  inertiaTauMs: number
  stepSpacingPx: number
  maxDevicePixelRatio: number
  maskMin: number
  maskMax: number
  alternateBackgroundColor: string
  autoRadiusMultiplier: number
  autoDurationMs: number
  autoStrokeGapMs: number
  autoStrokeY: number[]
  autoWobbleAmplitudePercent: number
  autoWobbleFrequency: number
  autoEdgeOvershootRadii: number
}

interface Point {
  x: number
  y: number
}

interface BackgroundConfig {
  enabled: boolean
  paused: boolean
  testColor: boolean
  fillColor: string
  outlineColor: string
  shapeScale: number
  speed: number
  fillOpacity: number
  outlineOpacity: number
  outlineThickness: number
  lineFrequency: number
  distortion: number
  cursorInfluence: number
  showFillMask: boolean
  showEdgeMask: boolean
}

const BACKGROUND_TEST_COLOR = '#ff0000'

interface KnightHelmetConfig {
  openingOffsetX: number
  openingOffsetY: number
  openingScale: number
  showHelmetMask: boolean
  showOcclusionMask: boolean
}

/** Time-accumulation multiplier applied when prefers-reduced-motion is on. */
const REDUCED_MOTION_TIME_SCALE = 0.03

/** Phone / tablet layout (<= 1100px): no pointer or touch effects, the man is placed exactly as in the mobile frame. */
/** the phone / portrait tablet layout: up to 767px, and up to 1100px when the screen is held upright (a wider screen held sideways gets the computer layout) */
const PHONE_QUERY = '(max-width: 767px), (max-width: 1100px) and (orientation: portrait)'
const isPhoneLayout = () => typeof window !== 'undefined' && window.matchMedia(PHONE_QUERY).matches

export function HeroScene({ isDebug }: HeroSceneProps) {
  const [phoneLayout, setPhoneLayout] = useState(isPhoneLayout)
  const [failed, setFailed] = useState(false)
  const [ready, setReady] = useState(false)
  const [portraitGone, setPortraitGone] = useState(false)
  useEffect(() => {
    if (!ready) {
      setPortraitGone(false)
      return
    }
    // let the scene paint its first frame before the still portrait steps aside
    const timer = window.setTimeout(() => setPortraitGone(true), 250)
    return () => window.clearTimeout(timer)
  }, [ready])
  useEffect(() => {
    const query = window.matchMedia(PHONE_QUERY)
    const change = () => { setReady(false); setPhoneLayout(query.matches) }
    query.addEventListener('change', change)
    return () => query.removeEventListener('change', change)
  }, [])
  const mountRef = useRef<HTMLDivElement>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const sceneRef = useRef<THREE.Scene | null>(null)
  const cameraRef = useRef<THREE.OrthographicCamera | null>(null)
  const topMeshRef = useRef<THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial> | null>(null)
  const personMaterialRef = useRef<THREE.ShaderMaterial | null>(null)
  const texturesRef = useRef<Partial<Record<HeroImageKey, THREE.Texture>>>({})
  const loaderRef = useRef<THREE.TextureLoader | null>(null)

  const alignmentStateRef = useRef<AlignmentState>({ ...HERO_CONFIG.alignment })
  const isDebugRef = useRef(isDebug)
  const flickerVisibleRef = useRef(true)

  const brushConfigRef = useRef<BrushConfig>({
    ...HERO_CONFIG.brush,
    autoStrokeY: [...HERO_CONFIG.brush.autoStrokeY],
  })
  // Painterly brush state: distance travelled along the current stroke and a per-stroke seed, so every
  // stroke gets its own bulges and ragged bristle edge.
  const liquidRef = useRef<ArrowBrush | null>(null)
  const parallaxRef = useRef({ x: 0, y: 0 })
  const maskCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const maskCtxRef = useRef<CanvasRenderingContext2D | null>(null)
  const maskTextureRef = useRef<THREE.CanvasTexture | null>(null)
  const maskDprRef = useRef(1)
  const manualBrushDiameterPxRef = useRef<number>(HERO_CONFIG.brush.minSizePx)
  const autoBrushDiameterPxRef = useRef<number>(HERO_CONFIG.brush.minSizePx * HERO_CONFIG.brush.autoRadiusMultiplier)
  const pointerQueueRef = useRef<Point[]>([])
  const lastRawPointRef = useRef<Point | null>(null)
  const smoothPointRef = useRef<Point | null>(null)
  const lastDrawnPointRef = useRef<Point | null>(null)
  const lastFrameTimeRef = useRef<number | null>(null)
  const rafIdRef = useRef<number | null>(null)
  const applyDimensionsRef = useRef<((w: number, h: number) => void) | null>(null)

  // System B: blueprint loop. A single independent, always-running GSAP
  // tween (repeat:-1, repeatDelay:0) - never paused by the brush, never
  // paused by anything else. See the mount effect for its construction.
  const blueprintTweenRef = useRef<gsap.core.Tween | null>(null)
  const blueprintPausedRef = useRef(false)

  // System C: automatic brush timeline. Independent repeat:-1 GSAP timeline
  // that periodically runs the 4-stroke chain, then pauses, then repeats.
  // Real pointer movement (system D) pauses only this (manual brush takes
  // priority); it restarts from the top after the configured idle delay.
  // Never touches the blueprint loop above.
  const autoBrushTimelineRef = useRef<gsap.core.Timeline | null>(null)
  const lastRealMoveTimeRef = useRef(0)
  const autoStrokeActiveRef = useRef(false)
  // Sticky pause from the debug "Pause auto brush" button - unlike the
  // real-pointer pause, this is never auto-resumed by the idle check.
  const debugAutoBrushPausedRef = useRef(false)

  // System A: dynamic background loop. Purely uTime-driven inside the
  // shader itself (see the animate() loop below) - no GSAP timeline at all,
  // so there's nothing here for the brush or blueprint to ever pause.
  const backgroundConfigRef = useRef<BackgroundConfig>({
    ...HERO_CONFIG.dynamicBackground,
    paused: false,
    testColor: false,
    showFillMask: false,
    showEdgeMask: false,
  })
  const backgroundMaterialRef = useRef<THREE.ShaderMaterial | null>(null)
  const backgroundTimeRef = useRef(0)
  const reducedMotionRef = useRef(false)

  const forceBlueprintRef = useRef(false)

  const knightHelmetConfigRef = useRef<KnightHelmetConfig>({
    openingOffsetX: HERO_CONFIG.knightHelmet.openingOffsetX,
    openingOffsetY: HERO_CONFIG.knightHelmet.openingOffsetY,
    openingScale: HERO_CONFIG.knightHelmet.openingScale,
    showHelmetMask: false,
    showOcclusionMask: false,
  })

  const [controls, setControls] = useState(DEFAULT_HERO_CONTROLS)
  const updateDebugControls = useCallback((next: HeroControls) => {
    setControls((previous) => JSON.stringify(previous) === JSON.stringify(next) ? previous : next)
  }, [])
  const { image, opacity, alignmentMode, translateX, translateY, scale, brush, autoValues, background, knightHelmet } = controls

  // Clears path-continuity state (not the mask itself) so the next stroke
  // starts fresh instead of drawing a connecting line from wherever the
  // brush — real or virtual — last was. The painted trail keeps decaying
  // normally; nothing is ever hard-cleared.
  const resetBrushContinuity = useCallback(() => {
    pointerQueueRef.current = []
    lastRawPointRef.current = null
    smoothPointRef.current = null
    lastDrawnPointRef.current = null
    liquidRef.current?.breakStroke()
  }, [])

  // Shared by real pointer input and the auto brush: subdivides a move from
  // `from` to `to` into evenly spaced points so both sources feed the exact
  // same stroke pipeline.
  const enqueuePoints = useCallback((from: Point | null, to: Point) => {
    if (!from) {
      pointerQueueRef.current.push(to)
      return
    }
    const dx = to.x - from.x
    const dy = to.y - from.y
    const dist = Math.hypot(dx, dy)
    const spacing = Math.max(brushConfigRef.current.stepSpacingPx * maskDprRef.current, 0.001)
    const steps = Math.max(1, Math.round(dist / spacing))
    for (let i = 1; i <= steps; i++) {
      const t = i / steps
      pointerQueueRef.current.push({ x: from.x + dx * t, y: from.y + dy * t })
    }
  }, [])

  const handleAutoBrushReplay = useCallback(() => {
    debugAutoBrushPausedRef.current = false
    lastRealMoveTimeRef.current = 0
    autoStrokeActiveRef.current = false
    resetBrushContinuity()
    autoBrushTimelineRef.current?.restart()
  }, [resetBrushContinuity])

  const handleAutoBrushPause = useCallback(() => {
    debugAutoBrushPausedRef.current = true
    autoBrushTimelineRef.current?.pause()
  }, [])

  const handleBlueprintPauseToggle = useCallback(() => {
    blueprintPausedRef.current = !blueprintPausedRef.current
    if (blueprintPausedRef.current) blueprintTweenRef.current?.pause()
    else blueprintTweenRef.current?.resume()
  }, [])

  const handleBlueprintShowPermanently = useCallback(() => {
    forceBlueprintRef.current = !forceBlueprintRef.current
  }, [])

  const getOrLoadTexture = useCallback((key: HeroImageKey): THREE.Texture | undefined => {
    const cached = texturesRef.current[key]
    if (cached) return cached
    if (!loaderRef.current) return undefined

    const texture = loaderRef.current.load((isPhoneLayout() ? HERO_IMAGES_PHONE : HERO_IMAGES)[key], () => {
      texture.colorSpace = THREE.SRGBColorSpace
      const mount = mountRef.current
      if (mount) {
        const { repeatX, repeatY, offsetX, offsetY } = computePersonCoverUV(
          (texture.image as HTMLImageElement).width / (texture.image as HTMLImageElement).height,
          mount.clientWidth / mount.clientHeight,
          isPhoneLayout(),
          window.matchMedia('(min-width: 768px)').matches,
        )
        texture.repeat.set(repeatX, repeatY)
        texture.offset.set(offsetX, offsetY)
      }
    })
    texturesRef.current[key] = texture
    return texture
  }, [])

  const renderFrame = useCallback(() => {
    const renderer = rendererRef.current
    const scene = sceneRef.current
    const camera = cameraRef.current
    const topMesh = topMeshRef.current
    if (!renderer || !scene || !camera || !topMesh) return

    const align = alignmentStateRef.current
    const debugOn = isDebugRef.current

    topMesh.visible = debugOn
    if (debugOn) {
      const mount = mountRef.current
      const width = mount?.clientWidth ?? 0
      const height = mount?.clientHeight ?? 0
      const topTexture = getOrLoadTexture(align.image)
      topMesh.material.map = topTexture ?? null
      topMesh.material.opacity = flickerVisibleRef.current ? align.opacity : 0
      topMesh.material.needsUpdate = true
      topMesh.scale.set(width * align.scale, height * align.scale, 1)
      topMesh.position.set(align.translateX, -align.translateY, 2)
    }

    try {
      renderer.render(scene, camera)
    } catch (error) {
      console.error('Hero rendering failed; showing the static image.', error)
      setFailed(true)
    }
  }, [getOrLoadTexture])

  // Rebuild GPU resources when switching between the two calibrated layouts.
  useEffect(() => {
    const mount = mountRef.current
    if (!mount || failed) return

    const width = mount.clientWidth
    const height = mount.clientHeight

    let disposed = false
    const fail = (error: unknown) => {
      if (disposed) return
      console.error('Hero graphics unavailable; showing the static image.', error)
      setFailed(true)
    }
    let renderer: THREE.WebGLRenderer
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true })
    } catch (error) {
      fail(error)
      return
    }
    renderer.debug.onShaderError = (gl, program, vertexShader, fragmentShader) => {
      console.error('Hero shader diagnostics', {
        program: gl.getProgramInfoLog(program),
        vertex: gl.getShaderInfoLog(vertexShader),
        fragment: gl.getShaderInfoLog(fragmentShader),
      })
      fail('Hero shader compilation failed')
    }
    const handleContextLost = (event: Event) => { event.preventDefault(); fail('WebGL context lost') }
    renderer.domElement.addEventListener('webglcontextlost', handleContextLost)
    const scene = new THREE.Scene()
    const camera = new THREE.OrthographicCamera(
      -width / 2,
      width / 2,
      height / 2,
      -height / 2,
      0.1,
      100,
    )
    camera.position.z = 10

    renderer.setSize(width, height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.outputColorSpace = THREE.SRGBColorSpace
    // Layer 1: clean flat background, painted by the GL clear itself — no
    // mesh needed, and nothing can ever render "under" it by accident.
    // Phone: a transparent canvas on the white page, so the black strip under the jacket stays visible behind the man.
    renderer.setClearColor(phoneLayout ? 0xffffff : BACKGROUND_COLOR, phoneLayout ? 0 : 1)
    mount.appendChild(renderer.domElement)

    const geometry = new THREE.PlaneGeometry(1, 1)

    // Layer 2: large, slowly-flowing organic contour-line background: pure
    // WebGL noise, no baked frames. Sits behind the person so it never
    // draws over him.
    const backgroundMaterial = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      uniforms: {
        uTime: { value: 0 },
        uResolution: { value: new THREE.Vector2(width, height) },
        uShapeOpacity: { value: backgroundConfigRef.current.fillOpacity },
        uOutlineOpacity: { value: backgroundConfigRef.current.outlineOpacity },
        uOutlineThickness: { value: backgroundConfigRef.current.outlineThickness },
        uDpr: { value: Math.min(window.devicePixelRatio, 2) },
        uLineFrequency: { value: backgroundConfigRef.current.lineFrequency },
        uShapeScale: { value: backgroundConfigRef.current.shapeScale },
        uSpeed: { value: backgroundConfigRef.current.speed },
        uDistortion: { value: backgroundConfigRef.current.distortion },
        uCursorInfluence: { value: backgroundConfigRef.current.cursorInfluence },
        uCursor: { value: new THREE.Vector2(-1, -1) },
        uShapeColor: { value: new THREE.Color().set(backgroundConfigRef.current.fillColor) },
        uOutlineColor: { value: new THREE.Color().set(backgroundConfigRef.current.outlineColor) },
        uShowFillMask: { value: 0 },
        uShowEdgeMask: { value: 0 },
      },
      vertexShader: backgroundVertexShader,
      fragmentShader: backgroundFragmentShader,
    })
    backgroundMaterialRef.current = backgroundMaterial
    const backgroundMesh = new THREE.Mesh(geometry, backgroundMaterial)
    backgroundMesh.position.z = 0
    scene.add(backgroundMesh)

    // Offscreen Canvas2D mask: painted by the pointer trail, sampled by the
    // person shader below to reveal knight.jpg. Not attached to the DOM.
    const maskCanvas = document.createElement('canvas')
    maskCanvas.width = 1
    maskCanvas.height = 1
    const maskCtx = maskCanvas.getContext('2d')
    if (!maskCtx) {
      fail('Canvas2D unavailable')
      renderer.dispose()
      renderer.domElement.remove()
      geometry.dispose()
      backgroundMaterial.dispose()
      return
    }
    maskCanvasRef.current = maskCanvas
    maskCtxRef.current = maskCtx

    let maskTexture = createMaskTexture(maskCanvas)
    maskTextureRef.current = maskTexture

    // Layer 3-5: base / blueprint-sweep / knight-reveal, combined into one
    // shader so all three photo layers always share one cover-UV transform
    // (no per-layer drift) and blend via a plain mix() chain (no darkening).
    const personMaterial = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      uniforms: {
        uBaseMap: { value: null },
        uBlueprintMap: { value: null },
        uKnightMap: { value: null },
        uMaskMap: { value: maskTexture },
        uPersonRepeat: { value: new THREE.Vector2(1, 1) },
        uPersonOffset: { value: new THREE.Vector2(0, 0) },
        uIntroAlpha: { value: intro.person },
        uMaskMin: { value: brushConfigRef.current.maskMin },
        uMaskMax: { value: brushConfigRef.current.maskMax },
        uSweepY: { value: -0.2 },
        uSweepInner: { value: HERO_CONFIG.blueprint.bandInner },
        uSweepOuter: { value: HERO_CONFIG.blueprint.bandOuter },
        uForceBlueprint: { value: 0 },
        uKnightBackgroundColor: {
          value: new THREE.Color().set(brushConfigRef.current.alternateBackgroundColor),
        },
        uOpeningMask: { value: null },
        uOpeningOffset: {
          value: new THREE.Vector2(HERO_CONFIG.knightHelmet.openingOffsetX, HERO_CONFIG.knightHelmet.openingOffsetY),
        },
        uOpeningScale: { value: HERO_CONFIG.knightHelmet.openingScale },
        uShowHelmetMask: { value: 0 },
        uShowOcclusionMask: { value: 0 },
        uMaskK: { value: PERSON_OVERSCAN },
        uMaskTexel: { value: new THREE.Vector2(1 / 1512, 1 / 908) },
        uMaskShift: { value: new THREE.Vector2(0, 0) },
      },
      vertexShader: personVertexShader,
      fragmentShader: personFragmentShader,
    })
    personMaterialRef.current = personMaterial
    const personMesh = new THREE.Mesh(geometry, personMaterial)
    personMesh.position.z = 1
    scene.add(personMesh)

    const topMaterial = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0 })
    const topMesh = new THREE.Mesh(geometry, topMaterial)
    topMesh.visible = false
    topMesh.position.z = 2
    scene.add(topMesh)

    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    reducedMotionRef.current = motionQuery.matches
    const handleMotionChange = (e: MediaQueryListEvent) => {
      reducedMotionRef.current = e.matches
    }
    motionQuery.addEventListener('change', handleMotionChange)

    sceneRef.current = scene
    cameraRef.current = camera
    rendererRef.current = renderer
    topMeshRef.current = topMesh
    loaderRef.current = new THREE.TextureLoader()

    // Systems B + C: built once all three photo textures have loaded,
    // guarded against duplicate creation. Two fully independent GSAP
    // objects - neither ever pauses, restarts, or resets the other.
    let loadedCount = 0
    let maskLoaded = false
    const markReady = () => { if (!disposed && loadedCount === 3 && maskLoaded) setReady(true) }
    const maybeStartLoops = () => {
      loadedCount += 1
      markReady()
      if (loadedCount < 3) return
      if (blueprintTweenRef.current || autoBrushTimelineRef.current) return // never build twice
      // React StrictMode double-invokes this mount effect in dev: the first
      // generation's effect runs, its cleanup disposes personMaterial, then
      // a second generation runs and becomes the one actually in the live
      // scene. Texture loads are async, so a stale first-generation
      // callback can still fire after that and reach this point - if it
      // built the loops, every tween here would target an orphaned,
      // disposed material's uniforms while the live shader reads a
      // different (second-generation) material that never moves. Bail out
      // unless this closure's own personMaterial is still the one actually
      // wired up to the live scene.
      if (personMaterialRef.current !== personMaterial) return

      // System B: blueprint loop. A single independent tween, repeat:-1,
      // repeatDelay:0 - GSAP's fromTo already resets the value to SWEEP_START
      // instantly at the start of every repeat, and since that reset happens
      // while the band is at SWEEP_START (past bandOuter, i.e. off-screen),
      // the loop point is never visible. Never paused by the brush or
      // anything else - see handlePointerMove and animate() below, neither
      // of which touches blueprintTweenRef at all.
      const bp = HERO_CONFIG.blueprint
      const SWEEP_START = -bp.bandOuter
      const SWEEP_END = 1 + bp.bandOuter
      const uSweepY = personMaterial.uniforms.uSweepY
      blueprintTweenRef.current = gsap.fromTo(
        uSweepY,
        { value: SWEEP_START },
        {
          value: SWEEP_END,
          duration: bp.passDurationMs / 1000,
          ease: 'power1.inOut',
          repeat: -1,
          repeatDelay: bp.repeatDelay,
        },
      )

      // System C: automatic brush timeline. Independent repeat:-1 timeline:
      // a chain of strokes, then a pause, then repeat. Paused only by real
      // pointer input (system D, see handlePointerMove) and resumed by the
      // idle check in animate() - the blueprint tween above is never
      // touched by any of this.
      const autoTl = gsap.timeline({ repeat: -1, paused: true })
      // The auto arrows are now scheduled by ArrowBrush itself (3 s wait, 4 arrows, repeat).
      autoTl.to({}, { duration: 3600 })
      autoBrushTimelineRef.current = autoTl
    }

    const loadPersonTexture = (key: HeroImageKey) => {
      const texture = loaderRef.current!.load((phoneLayout ? HERO_IMAGES_PHONE : HERO_IMAGES)[key], () => {
        if (disposed) { texture.dispose(); return }
        texture.colorSpace = THREE.SRGBColorSpace
        // Defensive: this is already THREE's default, but pinned explicitly
        // so repeat/offset can never tile/duplicate the photo.
        texture.wrapS = THREE.ClampToEdgeWrapping
        texture.wrapT = THREE.ClampToEdgeWrapping
        // Linear sampling preserves the cover-fit portrait without allocating a mip chain.
        texture.minFilter = THREE.LinearFilter
        texture.magFilter = THREE.LinearFilter
        texture.generateMipmaps = false
        const currentMount = mountRef.current
        if (currentMount) {
          const { repeatX, repeatY, offsetX, offsetY } = computePersonCoverUV(
            (texture.image as HTMLImageElement).width / (texture.image as HTMLImageElement).height,
            currentMount.clientWidth / currentMount.clientHeight,
            phoneLayout,
            window.matchMedia('(min-width: 768px)').matches,
          )
          texture.repeat.set(repeatX, repeatY)
          texture.offset.set(offsetX, offsetY)
          if (key === 'base') {
            personMaterial.uniforms.uPersonRepeat.value.set(repeatX, repeatY)
            personMaterial.uniforms.uPersonOffset.value.set(offsetX, offsetY)
          }
        }
        const uniformKey = key === 'base' ? 'uBaseMap' : key === 'blueprint' ? 'uBlueprintMap' : 'uKnightMap'
        personMaterial.uniforms[uniformKey].value = texture
        maybeStartLoops()
      }, undefined, fail)
      texturesRef.current[key] = texture
    }
    loadPersonTexture('base')
    loadPersonTexture('blueprint')
    loadPersonTexture('knight')

    // Baked opening mask (helmet metal vs. eyes/nose/mouth/skin), pixel-
    // aligned 1:1 with knight.jpg's own cover UV — no separate transform
    // needed beyond the identity calibration uniforms above. Intentionally
    // not sRGB-decoded: it's a raw intensity mask, not a color photo.
    const openingMaskTexture = loaderRef.current!.load(
      phoneLayout ? asset('/assets/hero/optimized/new-knight-opening-mask-phone.webp') : HERO_CONFIG.knightHelmet.openingMaskUrl,
      () => {
      if (disposed) { openingMaskTexture.dispose(); return }
      maskLoaded = true
      markReady()
      openingMaskTexture.wrapS = THREE.ClampToEdgeWrapping
      openingMaskTexture.wrapT = THREE.ClampToEdgeWrapping
      // No mipmaps: this is a hard-edged 0/255 mask sampled at 1:1-ish
      // scale, not a photo - mip-chain generation over a sharp binary edge
      // can otherwise ring/blur the boundary at certain zoom levels.
      openingMaskTexture.minFilter = THREE.LinearFilter
      openingMaskTexture.magFilter = THREE.LinearFilter
      openingMaskTexture.generateMipmaps = false
      }, undefined, fail,
    )
    personMaterial.uniforms.uOpeningMask.value = openingMaskTexture

    const resizeMask = (w: number, h: number) => {
      const dpr = Math.min(window.devicePixelRatio, brushConfigRef.current.maxDevicePixelRatio)
      maskDprRef.current = dpr
      const nextWidth = Math.max(1, Math.round(w * dpr))
      const nextHeight = Math.max(1, Math.round(h * dpr))
      if (maskCanvas.width === nextWidth && maskCanvas.height === nextHeight) return
      maskTexture = resizeMaskTexture(maskTexture, nextWidth, nextHeight)
      maskTextureRef.current = maskTexture
      personMaterial.uniforms.uMaskMap.value = maskTexture
      // Resizing a canvas clears it; reset the trail state to match.
      pointerQueueRef.current = []
      lastRawPointRef.current = null
      smoothPointRef.current = null
      lastDrawnPointRef.current = null
    }

    const recomputeBrushDiameter = (w: number) => {
      const cfg = brushConfigRef.current
      const raw = (cfg.sizeVw / 100) * w
      const manual = Math.min(cfg.maxSizePx, Math.max(cfg.minSizePx, raw))
      manualBrushDiameterPxRef.current = manual
      autoBrushDiameterPxRef.current = manual * cfg.autoRadiusMultiplier
    }

    const applyDimensions = (w: number, h: number) => {
      const currentRenderer = rendererRef.current
      const currentCamera = cameraRef.current
      if (!currentRenderer || !currentCamera || w === 0 || h === 0) return

      currentCamera.left = -w / 2
      currentCamera.right = w / 2
      currentCamera.top = h / 2
      currentCamera.bottom = -h / 2
      currentCamera.updateProjectionMatrix()
      currentRenderer.setSize(w, h)

      const aspect = w / h
      Object.values(texturesRef.current).forEach((texture) => {
        if (!texture || !texture.image) return
        const { repeatX, repeatY, offsetX, offsetY } = computePersonCoverUV(
          (texture.image as HTMLImageElement).width / (texture.image as HTMLImageElement).height,
          aspect,
          phoneLayout,
          window.matchMedia('(min-width: 768px)').matches,
        )
        texture.repeat.set(repeatX, repeatY)
        texture.offset.set(offsetX, offsetY)
      })
      const baseTexture = texturesRef.current.base
      if (baseTexture) {
        personMaterial.uniforms.uPersonRepeat.value.copy(baseTexture.repeat)
        personMaterial.uniforms.uPersonOffset.value.copy(baseTexture.offset)
      }

      const overscan = phoneLayout ? 1 : PERSON_OVERSCAN
      personMesh.scale.set(w * overscan, h * overscan, 1)
      backgroundMesh.scale.set(w, h, 1)
      backgroundMaterial.uniforms.uResolution.value.set(w, h)

      resizeMask(w, h)
      recomputeBrushDiameter(w)
    }
    applyDimensionsRef.current = applyDimensions

    // ResizeObserver's first callback fires with the settled layout size
    // right after observe(), which is more reliable than a `window.resize`
    // listener when the container's true size is only known post-layout.
    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (!entry) return
      const { width: w, height: h } = entry.contentRect
      applyDimensions(w, h)
    })
    resizeObserver.observe(mount)

    // System D: manual brush. Only ever touches the auto-brush timeline
    // (system C) - the blueprint loop (system B) and the background loop
    // (system A) are never paused, restarted, or reset from here.
    const handlePointerMove = (event: PointerEvent) => {
      const currentMount = mountRef.current
      if (!currentMount) return
      // Phones and tablets: no pointer / touch effects at all, only the arrows that fly on their own.
      if (phoneLayout) return

      // Real input always wins: pause the auto-brush timeline (no jump —
      // it just freezes wherever it was) and let it re-arm after the
      // configured idle delay, restarting cleanly from its first stroke.
      lastRealMoveTimeRef.current = performance.now()
      const autoTl = autoBrushTimelineRef.current
      if (autoTl && !autoTl.paused()) {
        autoTl.pause()
        autoStrokeActiveRef.current = false
        resetBrushContinuity()
      }

      // Screen-space UV, independent of the photos' own cover UV: (0,0) is
      // the canvas's top-left corner and (1,1) its bottom-right, matching
      // clientX/clientY directly with no axis flips or sign changes.
      const rect = currentMount.getBoundingClientRect()
      const dpr = maskDprRef.current
      const point = { x: (event.clientX - rect.left) * dpr, y: (event.clientY - rect.top) * dpr }
      enqueuePoints(lastRawPointRef.current, point)
      lastRawPointRef.current = point
    }
    window.addEventListener('pointermove', handlePointerMove, { passive: true })

    let maskHadStroke = false
    const animate = (time: number) => {
      rafIdRef.current = requestAnimationFrame(animate)

      // Idle check: resumes the auto-brush timeline from a real-pointer
      // pause after the configured delay. A debug "Pause auto brush" click
      // is sticky and never auto-resumed here. This reuses the one existing
      // render loop rather than a second independent rAF/interval. The
      // blueprint loop is never touched by this check at all.
      const autoTl = autoBrushTimelineRef.current
      if (autoTl && !debugAutoBrushPausedRef.current) {
        const idleFor = time - lastRealMoveTimeRef.current
        if (idleFor >= HERO_CONFIG.sequence.idleRestartDelay * 1000 && autoTl.paused()) {
          autoStrokeActiveRef.current = false
          resetBrushContinuity()
          autoTl.restart()
        }
      }

      const lastTime = lastFrameTimeRef.current
      lastFrameTimeRef.current = time
      // No tight upper clamp: the decay is an exponential in dt, so a long
      // gap (e.g. a throttled/backgrounded tab) should legitimately clear
      // the trail in one jump rather than trickle down over many ticks.
      const dt = lastTime === null ? 16 : Math.min(time - lastTime, 5000)

      const ctx = maskCtxRef.current
      const canvas = maskCanvasRef.current
      const texture = maskTextureRef.current
      if (ctx && canvas && texture) {
        const cfg = brushConfigRef.current

        const queue = pointerQueueRef.current
        const strokePts: Point[] = []
        if (queue.length > 0) {
          // Distribute this frame's dt across the interpolated sub-points so
          // the inertia time constant stays correct regardless of how many
          // points landed in the queue this tick.
          const dtPerPoint = dt / queue.length
          const smoothingAlpha =
            cfg.inertiaTauMs <= 0 ? 1 : 1 - Math.exp(-dtPerPoint / cfg.inertiaTauMs)
          let smooth = smoothPointRef.current
          for (const p of queue) {
            smooth = smooth
              ? {
                  x: smooth.x + (p.x - smooth.x) * smoothingAlpha,
                  y: smooth.y + (p.y - smooth.y) * smoothingAlpha,
                }
              : { x: p.x, y: p.y }
            strokePts.push(smooth)
          }
          smoothPointRef.current = smooth
          pointerQueueRef.current = []
        }

        // Arrows: the pointer arrow and the auto sequence are redrawn from scratch every frame.
        if (!liquidRef.current) liquidRef.current = new ArrowBrush()
        const dprNow = maskDprRef.current
        // Phone: the arrows start and end outside the screen and are a bit bigger, so they cross the whole man.
        const phoneNow = phoneLayout
        const frame = {
          w: canvas.width,
          h: canvas.height,
          dpr: dprNow,
          margin: phoneNow ? -canvas.width * 0.12 : AUTO_SIDE_MARGIN * dprNow,
          scale: phoneNow ? 2.2 : 1,
          blot: phoneNow,
          speed: phoneNow ? 1.02 : 1,
          // phone: three drops, the topmost one (it ran under the button and was cut off) is gone
          rows: phoneNow ? [0.2, 0.33, 0.46] : undefined,
        }
        liquidRef.current.step(
          dt,
          strokePts,
          frame,
          !reducedMotionRef.current && intro.person >= 0.5 && !debugAutoBrushPausedRef.current,
        )
        const maskHasStroke = liquidRef.current.hasVisibleStroke()
        if (maskHasStroke || maskHadStroke) {
          ctx.clearRect(0, 0, canvas.width, canvas.height)
          liquidRef.current.draw(ctx, frame)
          texture.needsUpdate = true
        }
        maskHadStroke = maskHasStroke
        personMaterial.uniforms.uMaskTexel.value.set(1 / Math.max(1, canvas.width), 1 / Math.max(1, canvas.height))
      }

      const backgroundCfg = backgroundConfigRef.current
      const motionScale = backgroundCfg.paused
        ? 0
        : reducedMotionRef.current
          ? REDUCED_MOTION_TIME_SCALE
          : 1
      backgroundTimeRef.current += (dt / 1000) * motionScale
      // Phone: a calm flat backdrop, as in the mobile frame.
      backgroundMesh.visible = backgroundCfg.enabled && !phoneLayout
      personMaterial.uniforms.uIntroAlpha.value = Math.min(1, intro.person * 1.4)
      // Parallax: the man (and, less, the backdrop) drift a few pixels against the pointer, so he seems to float in depth.
      const par = parallaxRef.current
      const pm = mountRef.current
      const pp = lastRawPointRef.current
      let ptx = 0
      let pty = 0
      if (!phoneLayout && pp && pm && pm.clientWidth > 0 && pm.clientHeight > 0) {
        const nx = Math.min(1, Math.max(0, pp.x / (pm.clientWidth * maskDprRef.current))) - 0.5
        const ny = Math.min(1, Math.max(0, pp.y / (pm.clientHeight * maskDprRef.current))) - 0.5
        ptx = -nx * 2 * PARALLAX_X
        pty = ny * 2 * PARALLAX_Y // canvas y grows downwards, world y grows upwards
      }
      const follow = 1 - Math.exp(-dt / 260)
      par.x += (ptx - par.x) * follow * motionScale
      par.y += (pty - par.y) * follow * motionScale
      const introY = -(1 - intro.person) * personMesh.scale.y * 0.07
      personMesh.position.x = par.x
      personMesh.position.y = introY + par.y
      backgroundMesh.position.x = -par.x * PARALLAX_BG_SHARE
      backgroundMesh.position.y = -par.y * PARALLAX_BG_SHARE
      if (pm && pm.clientWidth > 0) {
        personMaterial.uniforms.uMaskShift.value.set(par.x / pm.clientWidth, (introY + par.y) / pm.clientHeight)
      }
      backgroundMaterial.uniforms.uTime.value = backgroundTimeRef.current
      // Diagnostic override: forces the fill fully opaque and red so the
      // layer's presence/occlusion can be verified independent of how
      // subtle its normal tuned color/opacity happen to be.
      backgroundMaterial.uniforms.uShapeOpacity.value = backgroundCfg.testColor ? 1 : backgroundCfg.fillOpacity
      backgroundMaterial.uniforms.uOutlineOpacity.value = backgroundCfg.testColor ? 1 : backgroundCfg.outlineOpacity
      backgroundMaterial.uniforms.uOutlineThickness.value = backgroundCfg.outlineThickness
      backgroundMaterial.uniforms.uLineFrequency.value = backgroundCfg.lineFrequency
      backgroundMaterial.uniforms.uShapeScale.value = backgroundCfg.shapeScale
      backgroundMaterial.uniforms.uSpeed.value = backgroundCfg.speed
      backgroundMaterial.uniforms.uDistortion.value = backgroundCfg.distortion
      backgroundMaterial.uniforms.uCursorInfluence.value = backgroundCfg.cursorInfluence
      backgroundMaterial.uniforms.uShapeColor.value.set(backgroundCfg.testColor ? BACKGROUND_TEST_COLOR : backgroundCfg.fillColor)
      backgroundMaterial.uniforms.uOutlineColor.value.set(backgroundCfg.testColor ? BACKGROUND_TEST_COLOR : backgroundCfg.outlineColor)
      backgroundMaterial.uniforms.uShowFillMask.value = backgroundCfg.showFillMask ? 1 : 0
      backgroundMaterial.uniforms.uShowEdgeMask.value = backgroundCfg.showEdgeMask ? 1 : 0
      const cursorPoint = lastRawPointRef.current
      const cursorMount = mountRef.current
      if (cursorPoint && cursorMount && cursorMount.clientWidth > 0 && cursorMount.clientHeight > 0) {
        backgroundMaterial.uniforms.uCursor.value.set(
          cursorPoint.x / (cursorMount.clientWidth * maskDprRef.current),
          1 - cursorPoint.y / (cursorMount.clientHeight * maskDprRef.current),
        )
      } else {
        backgroundMaterial.uniforms.uCursor.value.set(-1, -1)
      }

      const brushCfg = brushConfigRef.current
      personMaterial.uniforms.uMaskMin.value = brushCfg.maskMin
      personMaterial.uniforms.uMaskMax.value = brushCfg.maskMax
      personMaterial.uniforms.uForceBlueprint.value = forceBlueprintRef.current ? 1 : 0
      personMaterial.uniforms.uKnightBackgroundColor.value.set(brushCfg.alternateBackgroundColor)

      const knightCfg = knightHelmetConfigRef.current
      personMaterial.uniforms.uOpeningOffset.value.set(knightCfg.openingOffsetX, knightCfg.openingOffsetY)
      personMaterial.uniforms.uOpeningScale.value = knightCfg.openingScale
      personMaterial.uniforms.uShowHelmetMask.value = knightCfg.showHelmetMask ? 1 : 0
      personMaterial.uniforms.uShowOcclusionMask.value = knightCfg.showOcclusionMask ? 1 : 0

      renderFrame()
    }
    rafIdRef.current = requestAnimationFrame(animate)

    // Explicitly stop the loop in a backgrounded tab instead of relying on
    // browsers' own rAF throttling: no rendering, no decay/noise math runs
    // at all while hidden. Resuming just re-enters the same dt-based logic,
    // which already handles an arbitrary time gap correctly. Both GSAP
    // loops are paused too (not killed - no new timeline is created here);
    // the blueprint loop resumes exactly where it was (continuous, never
    // reset), while the auto-brush timeline's own idle check above will see
    // a long idle gap and safely restart its stroke chain from the top.
    // The loop also stops while the hero is scrolled out of view, so the
    // full-screen shaders don't keep eating GPU time under the blocks below.
    let heroOffscreen = false
    const syncLoop = () => {
      if (document.hidden || heroOffscreen) {
        if (rafIdRef.current !== null) {
          cancelAnimationFrame(rafIdRef.current)
          rafIdRef.current = null
        }
        blueprintTweenRef.current?.pause()
        autoBrushTimelineRef.current?.pause()
      } else if (rafIdRef.current === null) {
        if (!blueprintPausedRef.current) blueprintTweenRef.current?.resume()
        rafIdRef.current = requestAnimationFrame(animate)
      }
    }
    const handleVisibilityChange = syncLoop
    const visibilityObserver = new IntersectionObserver(([entry]) => {
      heroOffscreen = !entry.isIntersecting
      syncLoop()
    })
    visibilityObserver.observe(mount)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      disposed = true
      renderer.domElement.removeEventListener('webglcontextlost', handleContextLost)
      liquidRef.current = null
      lastFrameTimeRef.current = null
      if (rafIdRef.current !== null) cancelAnimationFrame(rafIdRef.current)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      visibilityObserver.disconnect()
      window.removeEventListener('pointermove', handlePointerMove)
      motionQuery.removeEventListener('change', handleMotionChange)
      resizeObserver.disconnect()
      blueprintTweenRef.current?.kill()
      blueprintTweenRef.current = null
      autoBrushTimelineRef.current?.kill()
      autoBrushTimelineRef.current = null
      renderer.dispose()
      geometry.dispose()
      topMaterial.dispose()
      personMaterial.dispose()
      backgroundMaterial.dispose()
      maskTexture.dispose()
      openingMaskTexture.dispose()
      Object.values(texturesRef.current).forEach((tex) => tex?.dispose())
      texturesRef.current = {}
      if (renderer.domElement.parentNode === mount) {
        mount.removeChild(renderer.domElement)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phoneLayout, failed])

  // Keep the debug flag in sync; the animation loop picks it up on the next tick.
  useEffect(() => {
    isDebugRef.current = isDebug
  }, [isDebug])

  // Alignment mode: quickly flicker between the base layer and the selected image.
  useEffect(() => {
    if (!isDebug || !alignmentMode) {
      flickerVisibleRef.current = true
      return
    }

    const interval = window.setInterval(() => {
      flickerVisibleRef.current = !flickerVisibleRef.current
    }, ALIGNMENT_FLICKER_MS)

    return () => window.clearInterval(interval)
  }, [isDebug, alignmentMode])

  // Push the latest alignment values into the ref used by renderFrame.
  useEffect(() => {
    alignmentStateRef.current = {
      image: image as HeroImageKey,
      opacity,
      translateX,
      translateY,
      scale,
    }
  }, [image, opacity, translateX, translateY, scale])

  // Push the latest brush + auto-stroke values into the ref used by the
  // animation loop, and re-apply sizing so vw/DPR/radius-multiplier changes
  // take effect immediately.
  useEffect(() => {
    brushConfigRef.current = {
      ...brush,
      autoStrokeY: [autoValues.autoStrokeY1, autoValues.autoStrokeY2, autoValues.autoStrokeY3, autoValues.autoStrokeY4],
      autoRadiusMultiplier: autoValues.autoRadiusMultiplier,
      autoWobbleAmplitudePercent: autoValues.autoWobbleAmplitudePercent,
      autoWobbleFrequency: autoValues.autoWobbleFrequency,
      autoEdgeOvershootRadii: autoValues.autoEdgeOvershootRadii,
      autoDurationMs: HERO_CONFIG.brush.autoDurationMs,
      autoStrokeGapMs: HERO_CONFIG.brush.autoStrokeGapMs,
    }
    const mount = mountRef.current
    if (mount) {
      applyDimensionsRef.current?.(mount.clientWidth, mount.clientHeight)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    brush.sizeVw,
    brush.minSizePx,
    brush.maxSizePx,
    brush.coreFraction,
    brush.coreOpacity,
    brush.featherFraction,
    brush.fadeDurationMs,
    brush.inertiaTauMs,
    brush.stepSpacingPx,
    brush.maxDevicePixelRatio,
    brush.maskMin,
    brush.maskMax,
    brush.alternateBackgroundColor,
    autoValues.autoStrokeY1,
    autoValues.autoStrokeY2,
    autoValues.autoStrokeY3,
    autoValues.autoStrokeY4,
    autoValues.autoRadiusMultiplier,
    autoValues.autoWobbleAmplitudePercent,
    autoValues.autoWobbleFrequency,
    autoValues.autoEdgeOvershootRadii,
  ])

  // Push the latest background-shape values into the ref the animation loop reads.
  useEffect(() => {
    backgroundConfigRef.current = { ...background }
  }, [background])

  // Push the latest knight-helmet alignment values into the ref the
  // animation loop reads. These are calibrated once via Alignment mode and
  // otherwise never change — nothing here is animated.
  useEffect(() => {
    knightHelmetConfigRef.current = {
      openingOffsetX: knightHelmet.openingOffsetX,
      openingOffsetY: knightHelmet.openingOffsetY,
      openingScale: knightHelmet.openingScale,
      showHelmetMask: knightHelmet.showHelmetMask,
      showOcclusionMask: knightHelmet.showOcclusionMask,
    }
  }, [
    knightHelmet.openingOffsetX,
    knightHelmet.openingOffsetY,
    knightHelmet.openingScale,
    knightHelmet.showHelmetMask,
    knightHelmet.showOcclusionMask,
  ])

  return <>
    <HeroPortrait hidden={portraitGone && !failed} />
    <div ref={mountRef} className="hero-scene" style={{ opacity: ready && !failed ? 1 : 0 }} />
    {isDebug && <Suspense fallback={null}><HeroDebugControls onChange={updateDebugControls}
      replayBrush={handleAutoBrushReplay} pauseBrush={handleAutoBrushPause}
      toggleBlueprint={handleBlueprintPauseToggle} showBlueprint={handleBlueprintShowPermanently} /></Suspense>}
  </>
}
