import './FounderQuote.css'
import { asset } from '../../lib/asset'

const A = asset('/assets/founder')

// Figma 530:2749.
export function FounderQuote() {
  return (
    <section className="fq" id="founder">
      <img className="fq-wave" src={`${A}/wave-a.svg`} alt="" />
      <div className="fq-photo">
        <img src={`${A}/car.jpg`} alt="" />
      </div>
      <p className="fq-caption">
        <span className="fq-d">
          «Легендариум» — это место,{' '}
          <br />
          которого мне самому не хватало в начале пути.
        </span>
        <span className="fq-m">
          «Легендариум» — это место, которого{' '}
          <br />
          мне самому не хватало в начале пути.
        </span>
      </p>

      <div className="fq-text">
        <div className="fq-head">
          <p className="fq-name">Андрей Лукин</p>
          <h2 className="fq-heading">
            «Я больше НЕ ХОТЕЛ ВЫЖИВАТЬ.{' '}
            <br />
            <em>Мне ХОТЕЛось ЖИТЬ НА ПОЛНУЮ!»</em>
          </h2>
        </div>
        <div className="fq-body">
          <p>
            Я обычный парень из простой семьи. Учился в военной академии, был на госслужбе, жизнь была расписана на годы
            вперёд. Но я вовремя понял, что так я жить не хочу.{' '}
            <br className="fq-mbr" />А чем заняться вместо этого — ещё не знал.
          </p>
          <p>
            Начал изучать дизайн, рекламу, пробовать разное. Знания собирал по кускам, а когда возникали трудности — не
            хватало помощи. Новые навыки помогли мне уйти с госслужбы и изменить свою жизнь.
          </p>
          <p>
            Поэтому я создал «Легендариум». Место, где мужчины могут попробовать разные направления, найти своё и получить
            поддержку. Здесь я делюсь опытом, чтобы мы вместе росли, зарабатывали и двигались к своим целям.
          </p>
        </div>
      </div>
    </section>
  )
}
