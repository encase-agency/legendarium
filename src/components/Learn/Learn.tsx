import { ArrowIcon } from '../shared/ArrowIcon'
import './Learn.css'
import { asset } from '../../lib/asset'

const A = asset('/assets/learn')

// Figma 522:2471: 1512x820 frame.
export function Learn() {
  return (
    <section className="learn" id="learn">
      <div className="ln-text">
        <h2 className="ln-heading">
          <span className="ln-d">
            Осваиваешь материал в своём темпе,{' '}
            <br />
            возвращаешься к урокам и получаешь{' '}
            <br />
            <em>помощь на каждом этапе</em>
          </span>
          <span className="ln-m">
            Осваиваешь материал в своём{' '}
            <br />
            темпе, возвращаешься{' '}
            <br />к урокам и получаешь{' '}
            <br />
            <em>помощь на каждом этапе</em>
          </span>
        </h2>
        <p className="ln-sub">Тут есть программа, практика и проверка твоих работ.</p>
      </div>

      <a className="ln-button" href="#directions">
        Посмотреть направления
        <span className="ln-button-icon">
          <ArrowIcon src={`${A}/arrow.svg`} />
        </span>
      </a>

      <figure className="ln-photo ln-photo--left">
        <img src={`${A}/left.jpg`} alt="" />
      </figure>
      <figure className="ln-photo ln-photo--right">
        <picture>
          <source media="(max-width: 1100px)" srcSet={`${A}/right-m.jpg`} />
          <img src={`${A}/right.jpg`} alt="" />
        </picture>
      </figure>
    </section>
  )
}
