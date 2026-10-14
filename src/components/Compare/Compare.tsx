import './Compare.css'
import { asset } from '../../lib/asset'

const A = asset('/assets/compare')

const OTHER = ['Купил на эмоциях', 'Смотрел записи один', 'Застрял на первой реальной задаче', 'Доступ закончился, результата нет']
const OURS = [
  'Пробуешь несколько направлений',
  'Делаешь практические работы',
  'Получаешь правки от наставника',
  'Остаёшься в сообществе на 12 месяцев',
]

// Figma 516:2104.
export function Compare() {
  return (
    <section className="compare" id="compare">
      <div className="cp-photo cp-photo--face">
        <img src={`${A}/face.webp`} alt="" />
      </div>
      <div className="cp-photo cp-photo--helmet">
        <img src={`${A}/helmet.webp`} alt="" />
      </div>

      <div className="cp-title">
        <h2 className="cp-heading">
          Суть в том, что <em>Тебя оставили одного</em>
        </h2>
        <p className="cp-sub">Большинство курсов заканчивается ровно там, где начинается настоящая работа.</p>
      </div>

      <div className="cp-columns">
        <div className="cp-col">
          <h3 className="cp-col-title">В других курсах</h3>
          <ul className="cp-list">
            {OTHER.map((t) => (
              <li key={t}>
                <img src={`${A}/dot-gray.svg`} alt="" />
                <span>{t}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="cp-col cp-col--ours">
          <h3 className="cp-col-title">в Легендариуме</h3>
          <ul className="cp-list">
            {OURS.map((t) => (
              <li key={t}>
                <img src={`${A}/dot-gold.svg`} alt="" />
                <span>{t}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <a className="cp-route" href="#route">
        <img src={`${A}/circle.svg`} alt="" />
        <span>
          Как устроен
          <br />
          маршрут
        </span>
      </a>
    </section>
  )
}
