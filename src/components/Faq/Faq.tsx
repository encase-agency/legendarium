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
    q: 'Я вообще ничего не умею в онлайне. Потяну?',
    a: 'Программы начинаются с базовых действий. Для старта нужен смартфон или ноутбук — требования указаны в карточке каждого факультета. Результат зависит не от прежней профессии, а от практики и выполненных шагов.',
    w: 991,
  },
  {
    q: 'Получу ли я доступ ко всем курсам?',
    a: 'В Базовом тарифе доступны все 12 направлений без обратной связи. Поддержка наставников, разборы и бонусные программы зависят от выбранного тарифа. Состав доступа указан в карточке тарифа и публичной оферте.',
    w: 1090,
  },
  {
    q: 'Сколько времени нужно уделять обучению?',
    a: 'Всё зависит от ваших целей и текущих возможностей. мы рекомендуем осваивать материал как можно быстрее, но без спешки, для большего количества практики с поддержкой от наставников',
    w: 991,
  },
  { q: 'Подойдёт ли женщинам?', a: 'Нет, программа только для мужчин', w: 991 },
  {
    q: 'Как быстро я смогу заработать?',
    a: 'Если вы усердно работаете и применяете все наши знания, вы сможете вернуть свои деньги в течение первых нескольких недель.\nМы не гарантируем никакой прибыли, так как это зависит только от вас',
    w: 991,
  },
  { q: 'Могу ли я отменить подписку?', a: 'Да, вы можете отменить подписку в любое время', w: 991 },
  {
    q: 'Я не разбираюсь в направлениях, которые есть в программе. Это проблема?',
    a: 'Все наши программы разработаны так, чтобы каждый смог с нуля освоить новую профессию.',
    w: 887,
    pad: 24,
  },
  {
    q: 'Есть ли дополнительные расходы?',
    a: 'Нет, никаких доп плат не нужно. вы получаете доступ к софту, онлайн курсам, чату с наставниками.\nДля работы может понадобиться софт (по желанию), можно приобрести (тильда, чат гпт и тд).\nДля трейдинга нужен депозит от 100$. вы можете сначала изучить способ без вложений, заработать, а после инвестировать.',
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
