export const backgroundVertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

// Large, slowly-flowing FILLED organic blobs (reference: landonorris.com's
// hero background). Deliberately NOT thin contour lines: a 1-2px-wide line
// has so little screen area that even a high per-pixel opacity averages out
// to "basically invisible" once you look at the whole frame - a filled
// region at the same opacity is what actually reads on screen. One noise
// field is thresholded into a broad soft-edged fill (the blobs themselves);
// a second, phase-shifted field drives a thin edge accent right at each
// blob's boundary for a bit of depth. Ashima Arts classic 3D simplex noise
// (public domain) - continuous and non-periodic, so time-based animation is
// seamless with no baked frames.
export const backgroundFragmentShader = /* glsl */ `
  precision highp float;

  uniform float uTime;
  uniform vec2 uResolution;
  uniform float uShapeOpacity;
  uniform float uOutlineOpacity;
  uniform float uShapeScale;
  uniform float uSpeed;
  uniform float uDistortion;
  uniform float uCursorInfluence;
  uniform vec2 uCursor;
  uniform vec3 uShapeColor;
  uniform vec3 uOutlineColor;
  uniform float uOutlineThickness;
  uniform float uLineFrequency;
  uniform float uDpr;
  // Debug previews: isolate one mask at a time as flat white-on-black.
  uniform float uShowFillMask;
  uniform float uShowEdgeMask;

  varying vec2 vUv;

  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 permute(vec4 x) { return mod289(((x * 34.0) + 1.0) * x); }
  vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

  float snoise(vec3 v) {
    const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);

    vec3 i  = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);

    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);

    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - D.yyy;

    i = mod289(i);
    vec4 p = permute(permute(permute(
              i.z + vec4(0.0, i1.z, i2.z, 1.0))
            + i.y + vec4(0.0, i1.y, i2.y, 1.0))
            + i.x + vec4(0.0, i1.x, i2.x, 1.0));

    float n_ = 0.142857142857;
    vec3 ns = n_ * D.wyz - D.xzx;

    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);

    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_);

    vec4 x = x_ * ns.x + ns.yyyy;
    vec4 y = y_ * ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);

    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);

    vec4 s0 = floor(b0) * 2.0 + 1.0;
    vec4 s1 = floor(b1) * 2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));

    vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;

    vec3 p0 = vec3(a0.xy, h.x);
    vec3 p1 = vec3(a0.zw, h.y);
    vec3 p2 = vec3(a1.xy, h.z);
    vec3 p3 = vec3(a1.zw, h.w);

    vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
    p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;

    vec4 m = max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
    m = m * m;
    return 42.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
  }

  float fbm(vec3 p) {
    float value = 0.0;
    float amplitude = 0.5;
    for (int i = 0; i < 3; i++) {
      value += amplitude * snoise(p);
      p *= 2.0;
      amplitude *= 0.5;
    }
    return value;
  }

  void main() {
    float aspect = uResolution.x / uResolution.y;
    vec2 uv = vec2(vUv.x * aspect, vUv.y);
    float t = uTime * uSpeed;

    vec2 p = uv * uShapeScale;
    vec2 warp = vec2(
      fbm(vec3(p * 0.6, t * 0.8)),
      fbm(vec3(p * 0.6 + 19.0, t * 0.8))
    );
    p += warp * uDistortion;

    vec2 cursorUv = vec2(uCursor.x * aspect, uCursor.y);
    vec2 toCursor = uv - cursorUv;
    float cDist = length(toCursor);
    float cFalloff = exp(-cDist * cDist * 36.0);
    p += normalize(toCursor + 1e-4) * cFalloff * uCursorInfluence;

    float n = fbm(vec3(p, t));

    // Broad soft-edged fill: everywhere the field is above the zero
    // crossing becomes a blob interior, with a wide smoothstep transition
    // so edges flow rather than cut sharply. This is the part that actually
    // has enough screen area to read as "moving gray shapes". Sampled from
    // its own mask with its own opacity - never diluted by the outline's.
    float fillMask = smoothstep(-0.32, 0.32, n);
    // Multiple flowing contour lines instead of a single blob boundary: take
    // the same warped field n and slice it at regular intervals
    // (uLineFrequency per unit) rather than only at its zero crossing. Each
    // slice is a thin line that follows the field's iso-contour, so the
    // lines run parallel to each other and merge/split exactly where the
    // field itself folds - the "lines flowing into one another" look,
    // instead of a handful of large filled shapes.
    float g = n * uLineFrequency;
    float distToLine = abs(fract(g + 0.5) - 0.5);
    // Hairline: the line is uOutlineThickness CSS pixels wide whatever the zoom of the noise field, anti-aliased by
    // one device pixel (the reference draws 1px contours).
    float aa = max(fwidth(g), 1e-4);
    float halfW = 0.5 * uOutlineThickness * uDpr * aa;
    float edgeMask = 1.0 - smoothstep(halfW - aa * 0.5, halfW + aa * 0.5, distToLine);

    // Outline-only: the interior now matches whatever is behind it (the base
    // background), so only the edge reads - using the color that used to be
    // the fill, since that's the gray the shapes should appear drawn in.
    vec3 color = uShapeColor;
    float alpha = edgeMask * uOutlineOpacity;

    color = mix(color, vec3(fillMask), uShowFillMask);
    alpha = mix(alpha, 1.0, uShowFillMask);
    color = mix(color, vec3(edgeMask), uShowEdgeMask);
    alpha = mix(alpha, 1.0, uShowEdgeMask);

    gl_FragColor = vec4(color, alpha);
    // Raw ShaderMaterial shaders don't get three.js's automatic linear ->
    // output colorspace conversion that built-in materials get for free;
    // without this the fill color renders too dark against the sRGB canvas.
    #include <colorspace_fragment>
  }
`
