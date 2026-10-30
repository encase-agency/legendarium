import { useState, type CSSProperties } from 'react'
import './Faq.css'
import { asset } from '../../lib/asset'

const A = asset('/assets/faq')

interface Item {
  q: string
  a: string
  /** answer max width in design px (Figma 537:5958) */
  w: number
  /** vertical padding of an opened row in design px */
  pad?: number
}

const ITEMS: Item[] = [
  {
    q: 'Можно ли начать без опыта в онлайн-профессиях?',
    a: 'Да. Тебе не нужно приходить с готовой профессией или портфолио. Выбери направление, проходи уроки и сразу пробуй навыки на практических заданиях.',
    w: 991,
  },
  {
    q: 'Будет ли у меня доступ ко всем направлениям?',
    a: 'Да, материалы всех 12 направлений доступны. Не нужно угадывать с выбором раз и навсегда: начни с того, что интересно сейчас, а другие навыки подключай по мере роста.',
    w: 1090,
  },
  {
    q: 'Сколько времени нужно уделять обучению?',
    a: 'Начать можно даже с 30 минут в день: посмотреть урок и сделать один практический шаг. Регулярные действия помогут двигаться вперёд, даже если у тебя пока есть работа и мало свободного времени.',
    w: 991,
  },
  {
    q: 'Могут ли участвовать женщины?',
    a: 'Да. Программа открыта для всех совершеннолетних. Навыки, уроки и задания доступны независимо от пола; при этом само сообщество и часть материалов в первую очередь ориентированы на мужскую аудиторию.',
    w: 991,
  },
  {
    q: 'Когда я смогу получить первый доход?',
    a: 'Первые заказы можно искать уже во время обучения: ты не ждёшь окончания всей программы, чтобы применить новый навык. На сайте есть истории участников, получивших оплату в первые недели. 87% студентов Легендариума находят первые заказы в первый месяц.',
    w: 991,
  },
  {
    q: 'Как выбрать направление, если я пока не разбираюсь в них?',
    a: 'Не нужно сразу выбирать дело на всю жизнь. Посмотри направления, попробуй первые задания и начни с того, что ближе твоим интересам и возможностям. Если сомневаешься, команда поможет разобраться с выбором.',
    w: 887,
    pad: 24,
  },
  {
    q: 'Понадобятся ли расходы помимо оплаты тарифа?',
    a: 'Для практики в некоторых направлениях могут понадобиться сторонние платные инструменты. Для торговли криптовалютой нужен собственный депозит.',
    w: 887,
    pad: 24,
  },
]

// Figma 537:6074 (all closed) and 537:5958 (all open). Rows open independently.
export function Faq() {
  const [open, setOpen] = useState<Set<number>>(() => new Set())

  const toggle = (i: number) =>
    setOpen((prev) => {
      const next = new Set(prev)
      if (next.has(i)) next.delete(i)
      else next.add(i)
      return next
    })

  return (
    <section className="faq" id="faq">
      <h2 className="faq-heading">Частые вопросы</h2>
      <p className="faq-sub">Если твоей ситуации здесь нет — спроси команду.</p>

      <div className="faq-list">
        {ITEMS.map((it, i) => {
          const isOpen = open.has(i)
          const cls = ['faq-row']
          if (isOpen) cls.push('is-open')
          if (it.pad === 24) cls.push('is-pad24')
          return (
            <div className={cls.join(' ')} key={it.q}>
              <h3 className="faq-h">
                <button
                  type="button"
                  className="faq-q"
                  aria-expanded={isOpen}
                  aria-controls={`faq-a-${i}`}
                  onClick={() => toggle(i)}
                >
                  <span className="faq-title">{it.q}</span>
                  <span className="faq-icon" aria-hidden="true">
                    <img className="faq-plus" src={`${A}/plus.svg`} alt="" />
                    <img className="faq-minus" src={`${A}/minus.svg`} alt="" />
                  </span>
                </button>
              </h3>
              <div className="faq-a" id={`faq-a-${i}`} role="region">
                <div className="faq-a-in">
                  <p className="faq-text" style={{ '--w': it.w } as CSSProperties}>
                    {it.a}
                  </p>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
