import { useDialogLifecycle } from '../../lib/useDialogLifecycle'
import { useRef, type CSSProperties } from 'react'
import { ArrowIcon } from '../shared/ArrowIcon'
import type { Block, Course, Line } from './courses'
import { createPortal } from 'react-dom'
import './CourseModal.css'
import { asset } from '../../lib/asset'

const A = asset('/assets/faculties')

function LineText({ line }: { line: Line }) {
  const l = typeof line === 'string' ? { text: line } : line
  const cls = ['md-line']
  if (l.size === 15) cls.push('is-15')
  if (l.bold) cls.push('is-bold')
  if (l.gray) cls.push('is-gray')
  const style: CSSProperties | undefined = l.w ? { maxWidth: `calc(${l.w} * var(--u))` } : undefined
  return (
    <p className={cls.join(' ')} style={style}>
      {l.text}
    </p>
  )
}

function BlockView({ block }: { block: Block }) {
  if (block.t === 'text') {
    return (
      <div className="md-block">
        {block.lines.map((l, i) => (
          <LineText line={l} key={i} />
        ))}
      </div>
    )
  }
  if (block.t === 'list') {
    return (
      <div className="md-section">
        <h4 className="md-h">{block.title}</h4>
        <ul className="md-ul">
          {block.items.map((it, i) => (
            <li key={i}>
              {Array.isArray(it)
                ? it.map((t, j) => (
                    <span key={j}>
                      {t}
                      {j < it.length - 1 && (
                        <>
                          {' '}
                          <br />
                        </>
                      )}
                    </span>
                  ))
                : it}
            </li>
          ))}
        </ul>
      </div>
    )
  }
  return (
    <div className="md-block">
      <p className="md-line is-gray">
        {block.label}
        {block.strong && (
          <>
            {' '}
            <strong className="md-strong">{block.strong}</strong>
          </>
        )}
      </p>
      {block.lines?.map((l, i) => (
        <LineText line={l} key={i} />
      ))}
      {block.bullets && (
        <ul className="md-ul md-ul--plain">
          {block.bullets.map((b) => (
            <li key={b}>{b}</li>
          ))}
        </ul>
      )}
    </div>
  )
}

interface Props {
  course: Course
  closing: boolean
  onClose: () => void
}

// Full-screen course details, Figma frames 421:1388 ... 424:1809 (1512x900 each).
export function CourseModal({ course, closing, onClose }: Props) {
  const closeRef = useRef<HTMLButtonElement>(null)
  const { modal, poster } = course

  const dialogRef = useRef<HTMLDivElement>(null)
  useDialogLifecycle(dialogRef, onClose, closeRef)

  const crop = poster.crop
  // Rendered into <body>: a pinned (transformed) section would otherwise size and clip a fixed overlay and keep it under the header.
  return createPortal(
    <div ref={dialogRef} className={closing ? 'md is-closing' : 'md'} role="dialog" aria-modal="true" aria-label={modal.title.join(' ')}>
      <div className="md-inner">
        <div className="md-left">
          <div className="md-text">
            <h3 className="md-title">
              {modal.title.map((l, i) => (
                <span key={l}>
                  {l}
                  {i < modal.title.length - 1 && (
                    <>
                      {' '}
                      <br />
                    </>
                  )}
                </span>
              ))}
            </h3>
            {modal.blocks.map((b, i) => (
              <BlockView block={b} key={i} />
            ))}
          </div>
          <a className="md-cta" href="#pricing" onClick={onClose}>
            Начать сейчас
            <span className="md-cta-icon">
              <ArrowIcon src={`${A}/arrow.svg`} />
            </span>
          </a>
        </div>

        <div className="md-right">
          <div className={poster.black ? 'md-poster is-black' : 'md-poster'}>
            <img
              src={`${A}/${poster.src}`}
              alt=""
              className={crop ? 'is-crop' : undefined}
              style={
                crop
                  ? { width: `${crop.w}%`, height: `${crop.h}%`, left: `${crop.left}%`, top: `${crop.top}%` }
                  : undefined
              }
            />
            <img className="md-play" src={`${A}/play.svg`} alt="" />
          </div>
          <div className="md-mentor">
            <p className="md-mentor-name">{modal.mentor.name}</p>
            <p className="md-mentor-role">
              {modal.mentor.role.map((l, i) => (
                <span key={l}>
                  {l}
                  {i < modal.mentor.role.length - 1 && (
                    <>
                      {' '}
                      <br />
                    </>
                  )}
                </span>
              ))}
            </p>
          </div>
        </div>
      </div>

      <button className="md-close" type="button" onClick={onClose} aria-label="Закрыть" ref={closeRef}>
        <span className="md-close-flip">
          <span className="md-close-pos">
            <span className="md-close-rot">
              <img src={`${A}/close.svg`} alt="" />
            </span>
          </span>
        </span>
      </button>
    </div>,
    document.body,
  )
}
