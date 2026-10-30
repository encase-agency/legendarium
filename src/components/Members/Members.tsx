import type { CSSProperties } from 'react'
import { ArrowIcon } from '../shared/ArrowIcon'
import './Members.css'
import { asset } from '../../lib/asset'

const A = asset('/assets/members')

interface Photo {
  id: string
  src: string
  /** wrapper box and the rotated card inside it, in design px (Figma 530:5772) */
  box: { x: number; y: number; w: number; h: number }
  card: { w: number; h: number; transform: string }
  base?: string
  /** phone layout (Figma 549:8894): wrapper box and card size, px inside the 451x322 fan */
  m: { x: number; y: number; w: number; h: number; cw: number; ch: number }
}

/** Same order as the Figma layers: later photos paint over earlier ones. */
const PHOTOS: Photo[] = [
  { id: 'p1', src: 'p305.jpg', box: { x: 1060, y: 416.89, w: 310.892, h: 392.619 }, card: { w: 235.309, h: 346.661, transform: 'rotate(13.74deg)' }, m: { x: 424.24, y: 92.13, w: 202.38, h: 255.582, cw: 153.178, ch: 225.665 } },
  { id: 'p2', src: 'p306.jpg', box: { x: 141, y: 413.89, w: 310.892, h: 392.619 }, card: { w: 235.309, h: 346.661, transform: 'rotate(166.26deg) scaleY(-1)' }, base: '#8f8f8f', m: { x: -174, y: 90.18, w: 202.38, h: 255.582, cw: 153.178, ch: 225.665 } },
  { id: 'p3', src: 'p303.jpg', box: { x: 923.3, y: 345, w: 334.928, h: 440.753 }, card: { w: 272.374, h: 401.266, transform: 'rotate(9.51deg)' }, m: { x: 204, y: 8, w: 218.027, h: 286.916, cw: 177.307, ch: 261.211 } },
  { id: 'p4', src: 'p304.jpg', box: { x: 241.3, y: 345, w: 334.928, h: 440.753 }, card: { w: 272.374, h: 401.266, transform: 'rotate(170.49deg) scaleY(-1)' }, base: '#9e9e9e', m: { x: 29, y: 8, w: 218.027, h: 286.916, cw: 177.307, ch: 261.211 } },
  { id: 'p5', src: 'p301.jpg', box: { x: 758.47, y: 296.2, w: 335.857, h: 470.588 }, card: { w: 306.092, h: 450.939, transform: 'rotate(3.87deg)' }, m: { x: 160, y: 8, w: 218.632, h: 306.337, cw: 199.256, ch: 293.547 } },
  { id: 'p6', src: 'p302.jpg', box: { x: 395.29, y: 296, w: 335.857, h: 470.588 }, card: { w: 306.092, h: 450.939, transform: 'rotate(176.13deg) scaleY(-1)' }, base: '#d9d9d9', m: { x: 71, y: 8, w: 218.632, h: 306.337, cw: 199.256, ch: 293.547 } },
]

const px = (n: number) => `calc(${n} * var(--u))`

// Figma 530:5772, static.
export function Members() {
  return (
    <section className="mb" id="members">
      <div className="mb-fan">
        {PHOTOS.map((p) => (
          <div
            key={p.id}
            className={`mb-photo mb-photo--${p.id}`}
            style={
              {
                left: px(p.box.x),
                top: px(p.box.y),
                width: px(p.box.w),
                height: px(p.box.h),
                '--m-x': p.m.x,
                '--m-y': p.m.y,
                '--m-w': p.m.w,
                '--m-h': p.m.h,
                '--m-cw': p.m.cw,
                '--m-ch': p.m.ch,
              } as CSSProperties
            }
          >
            <div
              className="mb-card"
              style={{
                width: px(p.card.w),
                height: px(p.card.h),
                transform: p.card.transform,
                background: p.base,
              }}
            >
              <img src={`${A}/${p.src}`} alt="" loading="lazy" />
            </div>
          </div>
        ))}
        <div className="mb-center">
          <img src={`${A}/p307.jpg`} alt="" loading="lazy" />
        </div>
      </div>

      <div className="mb-head">
        <h2 className="mb-heading">
          Они начинали с той же точки,{' '}
          <br />
          что и ты
        </h2>
        <p className="mb-sub">
          Твои действия определяют результат. Наша задача — дать тебе систему, инструменты и поддержку, чтобы всё
          получилось.
        </p>
      </div>

      <a className="mb-cta" href="#ask">
        Обсудить мою ситуацию
        <span className="mb-cta-icon">
          <ArrowIcon src={`${A}/arrow.svg`} />
        </span>
      </a>
    </section>
  )
}
