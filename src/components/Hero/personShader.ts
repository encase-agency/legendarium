export const personVertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

// Single shader combining all photo layers so they can only ever share one
// cover-UV transform (no per-layer drift) and blend via plain mix() (no
// darkening). The knight reveal is split in two so knight.jpg's own face
// pixels never draw over the man's real eyes/nose/mouth:
//   - off the man: brush reveals a flat alternate-background wash
//   - on the man: brush reveals ONLY the helmet metal — uOpeningMask (baked
//     once from the real photo via edge-detection + flood-fill, see
//     scripts/notes) carves the eye holes + lower face opening back out, so
//     those areas always stay base/blueprint regardless of the brush.
export const personFragmentShader = /* glsl */ `
  uniform sampler2D uBaseMap;
  uniform sampler2D uBlueprintMap;
  uniform sampler2D uKnightMap;
  uniform sampler2D uMaskMap;
  uniform sampler2D uOpeningMask;
  uniform vec2 uPersonRepeat;
  uniform vec2 uPersonOffset;

  uniform float uIntroAlpha;
  uniform float uMaskMin;
  uniform float uMaskMax;

  uniform float uSweepY;
  uniform float uSweepInner;
  uniform float uSweepOuter;
  uniform float uForceBlueprint;

  uniform vec3 uKnightBackgroundColor;
  // Fixed calibration transform for the opening mask only — identity by
  // default since the mask is derived pixel-for-pixel from knight.jpg
  // itself, so it is already exactly aligned. Never animated.
  uniform vec2 uOpeningOffset;
  uniform float uOpeningScale;
  uniform float uShowHelmetMask;
  uniform float uShowOcclusionMask;
  // The mesh is slightly oversized and floats with the pointer; the brush mask lives in screen space.
  uniform float uMaskK;
  uniform vec2 uMaskShift;
  // 1 / mask size in pixels: the mask is softened with a small kernel and then thresholded again, which gives
  // smooth, liquid outlines (no ribs from the overlapping copies) and lets close shapes melt together.
  uniform vec2 uMaskTexel;

  varying vec2 vUv;

  void main() {
    vec2 personUv = vUv * uPersonRepeat + uPersonOffset;
    vec4 baseColor = texture2D(uBaseMap, personUv);
    vec4 blueprintColor = texture2D(uBlueprintMap, personUv);
    vec4 knightColor = texture2D(uKnightMap, personUv);
    // The mobile drawing surface extends beyond the original image: do not
    // stretch ClampToEdge's top row into a vertical stripe above the helmet.
    float imageBounds = step(0.0, personUv.x) * step(personUv.x, 1.0)
      * step(0.0, personUv.y) * step(personUv.y, 1.0);
    baseColor.a *= imageBounds;
    blueprintColor.a *= imageBounds;
    knightColor.a *= imageBounds;


    // Blueprint sweep: a soft horizontal band travelling top -> bottom.
    // Only uSweepY (a scalar) animates - the blueprint texture's own UV
    // never moves, so the helmet stays pixel-locked to the head.
    float sweepDist = abs(vUv.y - uSweepY);
    float sweepBand = 1.0 - smoothstep(uSweepInner, uSweepOuter, sweepDist);
    float blueprintMaskValue = max(sweepBand, uForceBlueprint);

    vec3 colorAfterBlueprint = mix(baseColor.rgb, blueprintColor.rgb, blueprintMaskValue);
    float alphaAfterBlueprint = mix(baseColor.a, blueprintColor.a, blueprintMaskValue);

    // Brush mask: CanvasTexture already gets THREE's one automatic flipY on
    // upload, so vUv needs no extra flip here (a second flip would mirror
    // the reveal vertically relative to the real cursor position).
    vec2 maskUv = vUv * uMaskK + vec2(0.5 - 0.5 * uMaskK) + uMaskShift;
    float brushMask = texture2D(uMaskMap, maskUv).a * 2.0;
    for (int i = 0; i < 8; i++) {
      float a = float(i) * 0.785398;
      vec2 d = vec2(cos(a), sin(a)) * uMaskTexel;
      brushMask += texture2D(uMaskMap, maskUv + d * 4.5).a * 1.4;
      brushMask += texture2D(uMaskMap, maskUv + d * 9.5).a;
    }
    brushMask /= 2.0 + 8.0 * 1.4 + 8.0;
    float maskValue = smoothstep(uMaskMin, uMaskMax, brushMask);

    // Eye holes + lower face opening, baked from the real photo. Center
    // (0.5,0.5) is the mask's own pivot for uOpeningScale so scaling stays
    // centered on the face rather than sliding it toward a corner.
    vec2 openingUv = (personUv - 0.5) / max(uOpeningScale, 1e-4) + 0.5 + uOpeningOffset;
    float opening = texture2D(uOpeningMask, openingUv).r;
    float helmetMetalMask = knightColor.a * (1.0 - opening);

    // backgroundResult = mix(baseBackground, knightBackground, brushMask):
    // only takes effect where the man isn't already present.
    float offPerson = 1.0 - alphaAfterBlueprint;
    float backgroundGate = maskValue * offPerson;
    vec3 afterBackground = mix(colorAfterBlueprint, uKnightBackgroundColor, backgroundGate);
    float alphaAfterBackground = mix(alphaAfterBlueprint, 1.0, backgroundGate);

    // Golden helmet only ever appears inside the brush mask, gated to the
    // metal parts alone - the blueprint sweep is fully independent and
    // never paused for this, but wherever the brush reveals metal, that
    // metal always wins outright (mix at helmetReveal=1 fully replaces
    // whatever blueprint contributed there, so blueprint never shows
    // through already-revealed gold).
    float helmetReveal = maskValue * helmetMetalMask;
    vec3 finalColor = mix(afterBackground, knightColor.rgb, helmetReveal);
    float finalAlpha = mix(alphaAfterBackground, knightColor.a, helmetReveal);

    // Debug: preview the helmet metal mask at 50% over the fixed base person.
    finalColor = mix(finalColor, mix(colorAfterBlueprint, vec3(1.0, 0.85, 0.2), helmetMetalMask * 0.5), uShowHelmetMask);
    finalAlpha = mix(finalAlpha, alphaAfterBlueprint, uShowHelmetMask);
    // Debug: preview the base person's own occlusion (silhouette) alpha as grayscale.
    finalColor = mix(finalColor, vec3(alphaAfterBlueprint), uShowOcclusionMask);
    finalAlpha = mix(finalAlpha, 1.0, uShowOcclusionMask);

    gl_FragColor = vec4(finalColor, finalAlpha * uIntroAlpha);
    #include <colorspace_fragment>
  }
`
