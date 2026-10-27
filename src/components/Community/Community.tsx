import type { CSSProperties, ReactNode } from 'react'
import { Lines } from '../shared/Lines'
import './Community.css'
import { asset } from '../../lib/asset'

const A = asset('/assets/community')

const CHECKS = ['Стабильно зарабатывает онлайн', 'Живет по своим правилам', 'Путешествует по миру', 'Помогает родным и близким']

// iPhone 14 Pro mockup from Figma 529:2698 (133.586 x 275.036 design px); inset values are the
// design's own percentages. Only the layers that are visible are kept.
function Phone() {
  return (
    <div className="cm-phone">
      <div className="ph-screenbg" />
      <div className="ph-strokeout" />
      <img className="ph-stroke" src={`${A}/phone-stroke.svg`} alt="" />
      <div className="ph-screen">
        <img src={`${A}/screen2.jpg`} alt="" />
      </div>
      <i className="ph-ant ph-ant--bottom" />
      <i className="ph-ant ph-ant--lb" />
      <i className="ph-ant ph-ant--lt" />
      <i className="ph-ant ph-ant--rb" />
      <i className="ph-ant ph-ant--r" />
      <i className="ph-ant ph-ant--top" />
      <div className="ph-speaker" />
      <i className="ph-btn ph-btn--minus" />
      <i className="ph-btn ph-btn--plus" />
      <i className="ph-btn ph-btn--silence" />
      <i className="ph-btn ph-btn--power" />
      <div className="ph-cam" />
      <img className="ph-lens1" src={`${A}/lens1.svg`} alt="" />
      <span className="ph-lens">
        <img src={`${A}/lens.png`} alt="" />
      </span>
    </div>
  )
}

interface Row {
  label: string
  title: ReactNode
  wide?: boolean
  /** phone layout: explicit line breaks when they differ from the desktop ones */
  mTitle?: string[]
  media: ReactNode
}

// Figma 529:2681.
const ROWS: Row[] = [
  {
    label: 'Чаты факультетов',
    title: 'Вопросы по конкретной работе, обратная связь и опыт людей из того же направления',
    media: (
      <img
        className="cm-crop"
        src={`${A}/r318.jpg`}
        alt=""
        style={{ width: '197.42%', height: '429.22%', left: '-55.78%', top: '-168.71%' } as CSSProperties}
      />
    ),
  },
  {
    label: 'Общий чат',
    title: (
      <>
        Контакты, идеи, совместные проекты{' '}
        <br />и задачи между участниками
      </>
    ),
    media: <Phone />,
  },
  {
    label: 'Регулярные эфиры',
    title: 'Разборы работ, вопросов и ошибок, которые повторяются у новичков',
    mTitle: ['Разборы работ, вопросов', 'и ошибок, которые', 'повторяются у новичков'],
    media: <img className="cm-cover" src={`${A}/r319.jpg`} alt="" />,
  },
  {
    label: 'Личные разборы с Андреем',
    wide: true,
    title: (
      <>
        Твоя ситуация, твои действия{' '}
        <br />и следующий шаг без общих мотивационных речей
      </>
    ),
    mTitle: ['Твоя ситуация, твои действия', 'и следующий шаг', 'без общих мотивационных речей'],
    media: (
      <img
        className="cm-crop"
        src={`${A}/r320.jpg`}
        alt=""
        style={{ width: '100%', height: '217.41%', left: 0, top: '-58.71%' } as CSSProperties}
      />
    ),
  },
  {
    label: 'Офлайн-встречи',
    wide: true,
    title: (
      <>
        Живые встречи участников.{' '}
        <br />
        Города, даты и условия участия публикуются внутри сообщества
      </>
    ),
    mTitle: ['Живые встречи участников.', 'Города, даты и условия', 'участия публикуются внутри', 'сообщества'],
    media: <img className="cm-cover" src={`${A}/r322.jpg`} alt="" />,
  },
]

// Figma 529:2648 (left text + "Рядом" list) and 529:2681 (the cards that follow). The text on the
// left stays pinned (position: sticky) while the right column scrolls past it.
export function Community() {
  return (
    <section className="community" id="community">
      <div className="cm-pin">
        <h2 className="cm-heading">
          <span className="cm-d">
            Изменить жизнь{' '}
            <br />
            проще, когда{' '}
            <br />
            вокруг сотни{' '}
            <br />
            единомышленников
          </span>
          <span className="cm-m">
            Изменить жизнь проще,{' '}
            <br />
            когда вокруг сотни единомышленников
          </span>
        </h2>
        <p className="cm-sub">
          <span className="cm-d">
            Те, кто еще вчера зависел от графиков{' '}
            <br />и начальников, но принял решение все{' '}
            <br />
            изменить и пришел в Легендариум.
          </span>
          <span className="cm-m">
            Те, кто еще вчера зависел от графиков и начальников,{' '}
            <br />
            но принял решение все изменить и пришел в Легендариум.
          </span>
        </p>
      </div>

      <div className="cm-col">
        <p className="cm-label">Рядом — те, кто уже:</p>
        <ul className="cm-checks">
          {CHECKS.map((c) => (
            <li key={c}>
              <span>{c}</span>
              <img src={`${A}/check.svg`} alt="" />
            </li>
          ))}
        </ul>

        <ul className="cm-rows">
          {ROWS.map((r) => (
            <li className="cm-row" key={r.label}>
              <div className="cm-media">{r.media}</div>
              <div className={r.wide ? 'cm-text is-wide' : 'cm-text'}>
                <p className="cm-row-label">{r.label}</p>
                <p className="cm-row-title">
                  <span className={r.mTitle ? 'cm-d' : undefined}>{r.title}</span>
                  {r.mTitle && <Lines lines={r.mTitle} className="cm-m" />}
                </p>
              </div>
            </li>
          ))}
        </ul>

        <a className="cm-cta" href="#pricing">
          <span className="cm-circle">
            <img src={`${A}/circle.svg`} alt="" />
            <b>
              Хочу быть{' '}
              <br />
              среди своих
            </b>
          </span>
          <span className="cm-note">
            Доступ к сообществу входит{' '}
            <br />
            <em>в тариф «Легенда»</em>
          </span>
        </a>
      </div>
    </section>
  )
}
