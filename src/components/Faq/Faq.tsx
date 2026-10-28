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
    a: 'Да. Программы рассчитаны в том числе на новичков: вы выбираете направление, изучаете уроки и применяете знания на практике. Доступные способы поддержки зависят от тарифа.',
    w: 991,
  },
  {
    q: 'Будет ли у меня доступ ко всем направлениям?',
    a: 'Да. В обоих тарифах есть доступ к материалам 12 направлений. Для старта советуем сосредоточиться на одном навыке, а затем изучать другие направления. Бонусные курсы и личные разборы зависят от тарифа.',
    w: 1090,
  },
  {
    q: 'Сколько времени нужно уделять обучению?',
    a: 'Единого графика нет: время зависит от направления и вашей цели. Планируйте время не только на просмотр уроков, но и на практику.',
    w: 991,
  },
  {
    q: 'Могут ли участвовать женщины?',
    a: 'Да. Участвовать могут совершеннолетние независимо от пола. При этом сообщество и часть материалов ориентированы на мужскую аудиторию.',
    w: 991,
  },
  {
    q: 'Когда я смогу получить первый доход?',
    a: 'Универсального срока и суммы нет. Результат зависит от выбранного навыка, практики и поиска клиентов. Условия возврата для тарифа «Легенда» описаны в оферте.',
    w: 991,
  },
  {
    q: 'Как отключить продление подписки?',
    a: 'Автоматическое продление можно отключить в личном кабинете. Доступ сохранится до конца оплаченного периода. Если вы оплатили обучение в рассрочку через банк, обязательства перед банком регулируются отдельным договором — отключение продления их не отменяет.',
    w: 991,
  },
  {
    q: 'Как выбрать направление, если я пока не разбираюсь в них?',
    a: 'Изучите описания направлений и выберите то, которое ближе вашим интересам и возможностям. Если сомневаетесь, задайте вопрос команде.',
    w: 887,
    pad: 24,
  },
  {
    q: 'Понадобятся ли расходы помимо оплаты тарифа?',
    a: 'Состав обучения зависит от тарифа. Для практики могут понадобиться сторонние платные сервисы и инструменты. Для торговли криптовалютой нужен собственный депозит — с ним связан риск потерь. Интернет, устройство и комиссии вашего банка оплачиваются отдельно.',
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
