import type { CSSProperties } from 'react'
import './Features.css'
import { asset } from '../../lib/asset'

// Figma 602:4944 (dark version of 601:4916). Together with the next block it forms the curtain that slides over the hero. All four icons are crops of one sprite; the tile box (x, y, w, h) and the img offsets are the exact
// numbers from the design (design px at the 1512px frame).
const SPRITE = asset('/assets/blocks/features-sprite.png')

interface Feature {
  id: string
  lines: string[]
  w: number
  /** icon box inside the 100x125 tile */
  box: { x: number; y: number; w: number; h: number }
  /** the first icon sits in a box that is turned by 15deg: the rotated element is this size */
  rot?: { deg: number; w: number; h: number }
  img: { w: number; h: number; left: number; top: number }
  /** indexes of the line breaks that collapse into a space on the phone layout (Figma 530:4579) */
  softBreaks?: number[]
  /** mirror the icon left-right so that all four look the same way */
  flip?: boolean
  /** the same icon on the phone layout (Figma 622:2785): box (x, y, w, h) of the picture inside the 60px tall tile row */
  mob: {
    box: { x: number; y: number; w: number; h: number }
    rot?: number
    flip?: boolean
    img: { w: number; h: number; left: number; top: number }
  }
}

const FEATURES: Feature[] = [
  {
    id: 'live',
    lines: ['Живые разборы', 'от Дяди Андрея'],
    w: 324,
    box: { x: -4, y: 19, w: 107.529, h: 88.846 },
    rot: { deg: 15, w: 93.381, h: 66.959 },
    img: { w: 396.9, h: 207.57, left: -11.63, top: -53.51 },
    mob: { box: { x: 10.24, y: 16.65, w: 39.017, h: 27.977 }, rot: 15, img: { w: 396.9, h: 207.57, left: -11.63, top: -53.51 } },
  },
  {
    id: 'mentor',
    lines: ['Помощь', 'наставника', 'на каждом этапе'],
    w: 323,
    box: { x: 9, y: 30, w: 83, h: 65 },
    img: { w: 420.95, h: 202.18, left: -111.39, top: -52.45 },
    softBreaks: [0],
    mob: { box: { x: 11, y: 14.85, w: 38.423, h: 29.885 }, img: { w: 420.95, h: 202.18, left: -111.39, top: -52.45 } },
  },
  {
    id: 'community',
    lines: ['Сообщество', 'единомышленников'],
    w: 323,
    box: { x: 11, y: 33, w: 84, h: 60 },
    img: { w: 396.9, h: 207.57, left: -198.44, top: -53.82 },
    flip: true,
    mob: { box: { x: 8.26, y: 17.85, w: 36.69, h: 26.309 }, flip: true, img: { w: 396.9, h: 207.57, left: -198.44, top: -53.82 } },
  },
  {
    id: 'guarantee',
    lines: ['Тройная гарантия', 'результата'],
    w: 324,
    box: { x: 13, y: 32, w: 75, h: 62 },
    img: { w: 396.9, h: 179.02, left: -290.91, top: -38.7 },
    mob: { box: { x: 11, y: 15.81, w: 38.68, h: 32.158 }, img: { w: 396.9, h: 179.02, left: -290.91, top: -38.7 } },
  },
]

function Sprite({ img }: { img: Feature['img'] }) {
  return (
    <span className="ft2-crop">
      <img
        src={SPRITE}
        alt=""
        style={{ width: `${img.w}%`, height: `${img.h}%`, left: `${img.left}%`, top: `${img.top}%` }}
      />
    </span>
  )
}

export function Features() {
  return (
    <section className="features" id="how">
      <ul className="features-grid">
        {FEATURES.map((f) => (
          <li className="feature-card" key={f.id} style={{ '--w': f.w } as CSSProperties}>
            <div className="feature-tile" aria-hidden="true">
              <span className="feature-tile-bg" />
              <span
                className="feature-icon"
                style={
                  {
                    '--x': f.box.x,
                    '--y': f.box.y,
                    '--bw': f.box.w,
                    '--bh': f.box.h,
                    transform: f.flip ? 'scaleX(-1)' : undefined,
                  } as CSSProperties
                }
              >
                {f.rot ? (
                  <span
                    className="feature-rot"
                    style={{ '--rw': f.rot.w, '--rh': f.rot.h, transform: `rotate(${f.rot.deg}deg)` } as CSSProperties}
                  >
                    <Sprite img={f.img} />
                  </span>
                ) : (
                  <Sprite img={f.img} />
                )}
              </span>
            </div>
            <span
              className="feature-mob-icon"
              aria-hidden="true"
            >
              <span
                className="feature-mob-pic"
                style={
                  {
                    '--x': f.mob.box.x,
                    '--y': f.mob.box.y,
                    '--bw': f.mob.box.w,
                    '--bh': f.mob.box.h,
                    transform: `${f.mob.rot ? `rotate(${f.mob.rot}deg)` : ''} ${f.mob.flip ? 'scaleX(-1)' : ''}`.trim() || undefined,
                  } as CSSProperties
                }
              >
                <Sprite img={f.mob.img} />
              </span>
            </span>
            <p className="feature-title">
              {f.lines.map((l, i) => (
                <span key={l}>
                  {l}
                  {i < f.lines.length - 1 && (
                    <>
                      {' '}
                      <br className={f.softBreaks?.includes(i) ? 'ft-soft' : undefined} />
                    </>
                  )}
                </span>
              ))}
            </p>
          </li>
        ))}
      </ul>
    </section>
  )
}
