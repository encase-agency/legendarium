import { useEffect, useRef } from 'react'
import { revealOnEnter } from '../../lib/revealOnEnter'
import './Statement.css'
import { asset } from '../../lib/asset'

// Figma 514:1923. Accent (gold italic) runs are marked with <em>; every line
// break is explicit so the wrapping matches the design at any width.
export function Statement() {
  const textRef = useRef<HTMLParagraphElement>(null)
  useEffect(() => {
    const text = textRef.current
    if (text) return revealOnEnter(text)
  }, [])
  return (
    <section className="statement" id="statement">
      <img className="st-logo" src={asset('/assets/statement/logo.svg')} alt="" />
      <p className="st-caption">Легендариум</p>

      <p className="st-text" ref={textRef}>
        <span className="st-d">
        Дело не в тебе. <em>Дело в системе,</em>{' '}
        <br />в которой ты живёшь.{' '}
        <br />
        <em>Школа учила слушаться</em>{' '}
        <br />и не высовываться. <em>Вуз забрал пять лет</em>{' '}
        <br />— а работаешь не по диплому. <em>Завод</em>{' '}
        <br />
        <em>и офис берут твоё время</em> и здоровье,{' '}
        <br />а взамен дают ровно столько,{' '}
        <br />
        чтобы ты пришёл завтра снова.
        </span>
        <span className="st-m">
          Дело не в тебе. <em>Дело</em>
          <br />
          <em>в системе,</em> в которой
          <br />
          ты живёшь. <em>Школа учила</em>
          <br />
          <em>слушаться</em>
          <br />и не высовываться.
          <br />
          <em>Вуз забрал пять лет</em> —
          <br />а работаешь не по
          <br />
          диплому. <em>Завод и офис</em>
          <br />
          <em>берут твоё время</em>
          <br />и здоровье, а взамен
          <br />
          дают ровно столько,
          <br />
          чтобы ты пришёл завтра
          <br />
          снова.
        </span>
      </p>
    </section>
  )
}
