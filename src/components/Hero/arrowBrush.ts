// The "water drop" brush. The mask is a liquid drop: a thick round head and a long tail that thins out to a fine tip
// (like the arrows in Figma 582:2644 / 582:2645, but alive instead of a rigid vector):
//  - the body is rebuilt every frame from the path the head has travelled, so the tail bends and stretches with the
//    mouse and snakes behind the head like water;
//  - it wobbles (the tail waves, the width pulses) more the faster the pointer moves;
//  - it keeps alternating solid / "open" (an air hole through the thick part);
//  - auto: every few seconds 4 drops fly across the face (2 right, 2 left, solid / open / solid / open), the first
//    pass from the bottom row up, the next from the top row down.
// The whole mask is cleared and redrawn every frame.

const smooth01 = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)))
  return t * t * (3 - 2 * t)
}
const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2)

interface P {
  x: number
  y: number
}

interface Drop {
  hist: P[]
  histLen: number
  solid: boolean
  seed: number
  /** latest heading of the head (radians) */
  ang: number
}

interface AutoDrop {
  row: number
  dir: 1 | -1
  solid: boolean
  start: number
  dur: number
  drop: Drop
}

export interface ArrowFrame {
  w: number
  h: number
  dpr: number
  /** Side margin in mask px for the auto drops (100 CSS px); negative = they start and end outside the canvas. */
  margin: number
  /** Size multiplier of the auto drops (phones fly bigger ones). */
  scale?: number
  /** Auto drops fly as round liquid spots (the second shape of the pointer brush) instead of arrows. */
  blot?: boolean
  /** Flight speed multiplier of the auto drops (1 = desktop). */
  speed?: number
  /** Rows of the auto drops as fractions of the canvas height, top -> bottom (default: the desktop rows). */
  rows?: number[]
}

const AUTO_ROWS = [0.3, 0.43, 0.56, 0.69] // top -> bottom, fractions of the canvas height
const AUTO_WAIT = 3000
const AUTO_FIRST_WAIT = 2000 // the first pass starts 2 s after the page is ready
const AUTO_DUR = 885
const AUTO_STAGGER = 330
const N = 36 // spine samples

const newDrop = (solid: boolean): Drop => ({ hist: [], histLen: 0, solid, seed: Math.random() * 100, ang: 0 })

function pushHist(d: Drop, x: number, y: number, minStep: number, maxLen: number) {
  const h = d.hist
  const last = h[h.length - 1]
  if (last) {
    const dist = Math.hypot(x - last.x, y - last.y)
    if (dist < minStep) return
    d.histLen += dist
    d.ang = Math.atan2(y - last.y, x - last.x)
  }
  h.push({ x, y })
  while (h.length > 2 && d.histLen > maxLen) {
    const a = h[0]
    const b = h[1]
    d.histLen -= Math.hypot(b.x - a.x, b.y - a.y)
    h.shift()
  }
}

/** The point `dist` back along the path from the head (the head is the last history point). */
function pointBack(h: P[], dist: number): P {
  let rest = dist
  for (let i = h.length - 1; i > 0; i--) {
    const a = h[i]
    const b = h[i - 1]
    const seg = Math.hypot(a.x - b.x, a.y - b.y)
    if (seg >= rest) {
      const t = seg === 0 ? 0 : rest / seg
      return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t }
    }
    rest -= seg
  }
  return h[0]
}

function smoothClosed(path: Path2D, pts: [number, number][]) {
  const n = pts.length
  const mid = (i: number): [number, number] => {
    const a = pts[i % n]
    const b = pts[(i + 1) % n]
    return [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]
  }
  const s = mid(n - 1)
  path.moveTo(s[0], s[1])
  for (let i = 0; i < n; i++) {
    const m = mid(i)
    path.quadraticCurveTo(pts[i][0], pts[i][1], m[0], m[1])
  }
  path.closePath()
}

export class ArrowBrush {
  // auto sequence
  private autoClock = 0
  private pass = 0
  private passStart = -1
  private autos: AutoDrop[] = []
  private autoTime = 0

  // pointer drop
  private ptr = newDrop(true)
  private px = 0
  private py = 0
  private hasPos = false
  private vx = 0
  private vy = 0
  private ax = 0 // smoothed speed magnitude (css px / ms)
  private strength = 0
  private time = 0
  /** 0 = drop (solid), 1 = blot, 2 = drop (open), 3 = blot ... : every new movement takes the next one */
  private kind = -1
  private idle = 1000
  private flip = false

  /** Pointer lost / stroke ended: the next move starts a fresh drop. */
  breakStroke() {
    this.hasPos = false
    this.ptr.hist = []
    this.ptr.histLen = 0
  }

  /** Real pointer input interrupts the auto sequence and delays its restart. */
  interruptAuto() {
    this.autoClock = 0
    this.passStart = -1
    this.autos = []
  }

  step(dt: number, pts: P[], f: ArrowFrame, autoEnabled: boolean) {
    dt = Math.min(Math.max(dt, 1), 64)
    this.time += dt

    // ---- pointer drop: the head follows the pointer with a liquid lag
    for (const p of pts) {
      if (!this.hasPos) {
        this.px = p.x
        this.py = p.y
        this.hasPos = true
        pushHist(this.ptr, p.x, p.y, 1, 1e9)
        continue
      }
      const nx = this.px + (p.x - this.px) * 0.55
      const ny = this.py + (p.y - this.py) * 0.55
      this.vx += ((nx - this.px) / dt - this.vx) * 0.3
      this.vy += ((ny - this.py) / dt - this.vy) * 0.3
      this.px = nx
      this.py = ny
    }
    if (pts.length === 0) {
      // keep gliding a little, then settle
      const k = Math.exp(-dt / 140)
      this.vx *= k
      this.vy *= k
      this.px += this.vx * dt * 0.6
      this.py += this.vy * dt * 0.6
    }
    const speed = Math.hypot(this.vx, this.vy) / f.dpr
    this.ax += (speed - this.ax) * (1 - Math.exp(-dt / 120))
    const wantsOn = pts.length > 0 || speed > 0.05
    if (wantsOn) {
      if (this.idle > 320) this.flip = true
      this.idle = 0
    } else this.idle += dt
    if (this.flip) {
      this.flip = false
      // each new movement alternates our drop and a blot (a round spot with ragged edges)
      this.kind = (this.kind + 1) % 4
      this.ptr.solid = this.kind !== 2
    }
    this.strength += ((wantsOn ? 1 : 0) - this.strength) * (1 - Math.exp(-dt / (wantsOn ? 130 : 260)))
    if (this.hasPos && (pts.length > 0 || speed > 0.03)) pushHist(this.ptr, this.px, this.py, 2 * f.dpr, f.w * 1.2)

    // ---- auto sequence
    if (pts.length > 0 || !autoEnabled || this.strength > 0.03) {
      if (pts.length > 0 || !autoEnabled) this.interruptAuto()
    } else {
      this.autoTime += dt
      if (this.passStart < 0) {
        this.autoClock += dt
        if (this.autoClock >= (this.pass === 0 ? AUTO_FIRST_WAIT : AUTO_WAIT)) {
          this.passStart = this.autoTime
          const sp = f.speed ?? 1
          // The first pass starts at the chin and climbs to the top of the head, the next one comes back down.
          const bottomUp = this.pass % 2 === 0
          this.autos = []
          const count = (f.rows ?? AUTO_ROWS).length
          for (let i = 0; i < count; i++) {
            this.autos.push({
              row: bottomUp ? count - 1 - i : i,
              dir: i % 2 === 0 ? 1 : -1,
              solid: i % 2 === 0,
              start: this.passStart + (i * AUTO_STAGGER) / sp,
              dur: AUTO_DUR / sp,
              drop: newDrop(i % 2 === 0 || f.blot === true),
            })
          }
        }
      } else if (this.autoTime > this.passStart + (((f.rows ?? AUTO_ROWS).length - 1) * AUTO_STAGGER + AUTO_DUR) / (f.speed ?? 1)) {
        this.passStart = -1
        this.autoClock = 0
        this.pass++
        this.autos = []
      }
    }
  }

  /** Paths of one drop: the body (and the air hole, cut with even-odd). */
  private build(d: Drop, W: number, L: number, speedF: number, time: number, blob = false): Path2D | null {
    if (W < 1.2 || d.hist.length < 2) return null
    const avail = Math.min(L, d.histLen)
    if (avail < W * 0.15) return null
    const spacing = avail / (N - 1)
    // spine samples back along the path (index 0 = head)
    const sp: P[] = []
    for (let i = 0; i < N; i++) sp.push(pointBack(d.hist, i * spacing))
    // smooth the spine so the tail flows
    const sm = sp.map((_, i) => {
      let sx = 0
      let sy = 0
      let c = 0
      for (let k = -2; k <= 2; k++) {
        const q = sp[Math.min(N - 1, Math.max(0, i + k))]
        sx += q.x
        sy += q.y
        c++
      }
      return { x: sx / c, y: sy / c }
    })
    sm[0] = sp[0]
    const tan: P[] = sm.map((_, i) => {
      const a = sm[Math.max(0, i - 2)]
      const b = sm[Math.min(N - 1, i + 2)]
      const l = Math.hypot(b.x - a.x, b.y - a.y) || 1
      // tangent pointing from the tail towards the head
      return { x: (a.x - b.x) / l, y: (a.y - b.y) / l }
    })
    const lenF = avail / Math.max(L, 1)
    const half: number[] = []
    const cen: P[] = []
    for (let i = 0; i < N; i++) {
      const u = i / (N - 1)
      let h: number
      if (blob) {
        // a fat liquid body of nearly even width with round ends: it flows along the path (curls when the pointer circles)
        h = W * (0.95 - 0.25 * u)
        if (u > 0.78) h *= Math.sqrt(Math.max(0, 1 - Math.pow((u - 0.78) / 0.22, 2)))
        h *= 1 + 0.08 * Math.sin(time / 520 + u * 4.2 + d.seed) + 0.05 * Math.sin(time / 330 - u * 7 + d.seed * 2)
        half.push(Math.max(0, h) * (0.35 + 0.65 * smooth01(0, 0.5, lenF)))
        const wv = Math.sin(time / 400 - u * 4 + d.seed) * u * W * 0.07
        cen.push({ x: sm[i].x - tan[i].y * wv, y: sm[i].y + tan[i].x * wv })
        continue
      }
      // thick head, long taper to a fine tip
      h = W * Math.pow(1 - u, 1.15) * (0.55 + 0.45 * smooth01(0, 0.35, 1 - u + 0.08))
      // liquid pulsing, stronger with speed
      h *= 1 + (0.06 + 0.1 * speedF) * Math.sin(time / 170 + u * 7 + d.seed)
      half.push(Math.max(0, h) * (0.35 + 0.65 * smooth01(0, 0.5, lenF)))
      // the tail waves from side to side while the pointer moves
      const wave = Math.sin(time / 210 - u * 6.5 + d.seed) * u * W * (0.08 + 0.3 * speedF)
      cen.push({ x: sm[i].x - tan[i].y * wave, y: sm[i].y + tan[i].x * wave })
    }
    // round nose in front of the head
    const hd = tan[0]
    const L1: [number, number][] = []
    const R1: [number, number][] = []
    const NOSE = 7
    for (let k = NOSE; k >= 1; k--) {
      const v = k / NOSE
      const cx = cen[0].x + hd.x * half[0] * 0.92 * v
      const cy = cen[0].y + hd.y * half[0] * 0.92 * v
      const hw = half[0] * Math.sqrt(Math.max(0, 1 - v * v))
      L1.push([cx - hd.y * hw, cy + hd.x * hw])
      R1.push([cx + hd.y * hw, cy - hd.x * hw])
    }
    const L2: [number, number][] = []
    const R2: [number, number][] = []
    for (let i = 0; i < N; i++) {
      L2.push([cen[i].x - tan[i].y * half[i], cen[i].y + tan[i].x * half[i]])
      R2.push([cen[i].x + tan[i].y * half[i], cen[i].y - tan[i].x * half[i]])
    }
    const poly = L1.concat(L2, R2.reverse(), R1.reverse())
    const path = new Path2D()
    smoothClosed(path, poly)

    if (!d.solid) {
      // air hole through the thick part of the drop
      const a = Math.round(N * 0.1)
      const b = Math.round(N * 0.58)
      const HL: [number, number][] = []
      const HR: [number, number][] = []
      for (let i = a; i <= b; i++) {
        const t = (i - a) / (b - a)
        const hw = half[i] * 0.52 * Math.pow(Math.sin(Math.PI * t), 0.75)
        HL.push([cen[i].x - tan[i].y * hw, cen[i].y + tan[i].x * hw])
        HR.push([cen[i].x + tan[i].y * hw, cen[i].y - tan[i].x * hw])
      }
      smoothClosed(path, HL.concat(HR.reverse()))
    }
    return path
  }

  /** Idle frames need no Canvas2D redraw or GPU texture upload. */
  hasVisibleStroke() {
    return (this.hasPos && this.strength > 0.02) || this.autos.some((a) => {
      const progress = (this.autoTime - a.start) / a.dur
      return progress > 0 && progress < 1
    })
  }

  draw(ctx: CanvasRenderingContext2D, f: ArrowFrame) {
    ctx.save()
    ctx.fillStyle = '#ffffff'
    const t = this.time

    // auto drops
    const Wauto = f.w * 0.091 * (f.scale ?? 1)
    const Lauto = f.w * 0.46 * (f.scale ?? 1)
    const travel = Math.max(0, f.w - 2 * f.margin)
    for (const a of this.autos) {
      const k = (this.autoTime - a.start) / a.dur
      if (k <= 0 || k >= 1) continue
      const e = easeInOut(k)
      const x = a.dir === 1 ? f.margin + travel * e : f.w - f.margin - travel * e
      const y = (f.rows ?? AUTO_ROWS)[a.row] * f.h + Math.sin(k * Math.PI * 2 + a.row) * f.h * 0.012
      pushHist(a.drop, x, y, 2 * f.dpr, Lauto * 1.4)
      // grows out of a point, flies, dissolves into a point
      const env = smooth01(0, 0.25, k) * (1 - smooth01(0.75, 1, k))
      const s = 0.1 + 0.9 * env
      const speedF = Math.sin(Math.PI * k)
      if (f.blot) {
        // a fat liquid spot flowing across the face
        // 40% fatter than the pointer's spot, the length stays
        const Wb = f.w * 0.072 * (f.scale ?? 1) * s
        const pb = this.build(a.drop, Wb * 1.4, Wb * (2.9 + 2.4 * speedF), speedF, t, true)
        if (pb) ctx.fill(pb)
        continue
      }
      const p = this.build(a.drop, Wauto * s, Lauto * s, speedF, t)
      if (p) ctx.fill(p, 'evenodd')
    }

    // pointer drop
    if (this.hasPos && this.strength > 0.02) {
      const s = smooth01(0, 0.85, this.strength)
      const speedF = smooth01(0.1, 3.2, this.ax)
      // squash and stretch: faster = longer and slimmer
      const W = f.w * 0.086 * s * (1 - 0.22 * speedF)
      // a fast sweep of the mouse stretches the drop into a long thin-tailed one
      if (this.kind % 2 === 1) {
        // blot: a fat liquid spot; it is a body along the path, so when the pointer circles it flows and curls
        // instead of turning over like a rigid disc
        const Wb = f.w * 0.072 * s
        const Lb = Wb * (2.9 + 2.4 * speedF)
        const p = this.build(this.ptr, Wb, Lb, speedF, t, true)
        if (p) ctx.fill(p)
      } else {
        // a fast sweep of the mouse stretches the drop into a long thin-tailed one
        const L = f.w * (0.26 + 0.62 * Math.pow(speedF, 0.8)) * s
        const p = this.build(this.ptr, W, L, speedF, t)
        if (p) ctx.fill(p, 'evenodd')
      }
    }
    ctx.restore()
  }
}
