import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react'
import { siteConfig } from '../../lib/siteConfig'
import { trackAnalyticsGoal } from '../Consent/analytics'
const BasicModal = lazy(() => import('./BasicModal').then(module => ({ default: module.BasicModal })))
import './Pricing.css'
import { asset } from '../../lib/asset'

const A = asset('/assets/pricing2')

const BONUS = [
  'Лукиномика отношений',
  'Здоровье и спорт',
  'Мышление победителя',
  'Инвестиции',
  'Блог с нуля (YouTube и др)',
]

function Item({ title, sub, wide }: { title: string; sub: string; wide?: boolean }) {
  return (
    <li>
      <img src={`${A}/check-a.svg`} alt="" className="pr-check" />
      <div className={wide ? 'pr-item is-wide' : 'pr-item'}>
        <p className="pr-t">{title}</p>
        <p className="pr-s">{sub}</p>
      </div>
    </li>
  )
}

// Figma 742:3501 (plans) and 742:3453 (basic plan modal, opened by "Смотреть тариф").
export function Pricing() {
  const [open, setOpen] = useState(false)
  const [closing, setClosing] = useState(false)
  const timer = useRef<number>(0)

  const openModal = () => {
    window.clearTimeout(timer.current)
    setClosing(false)
    setOpen(true)
  }

  const closeModal = useCallback(() => {
    setClosing(true)
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => {
      setOpen(false)
      setClosing(false)
    }, 280)
  }, [])

  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  useEffect(() => () => window.clearTimeout(timer.current), [])

  return (
    <section className="pr" id="pricing">
      <a className="pr-pay" href={siteConfig.enrollment.legend} target="_blank" rel="noreferrer" onClick={() => trackAnalyticsGoal('tariff_legend_click')}>
        <span className="pr-gold" aria-hidden="true">
          <img src={`${A}/gold.jpg`} alt="" className="pr-gold-btn" />
        </span>
        <span className="pr-pay-text">Получить доступ</span>
      </a>

      <h2 className="pr-heading">Выбери уровень участия</h2>

      <article className="pr-card">
        <div className="pr-card-in">
          <div className="pr-gold" aria-hidden="true">
            <img src={`${A}/gold.jpg`} alt="" className="pr-gold-card" />
            <span className="pr-shade" />
          </div>

          <div className="pr-top">
            <div className="pr-row">
              <p className="pr-name">Легенда</p>
            </div>
            <div className="pr-row pr-row--note">
              <p className="pr-for">На результат</p>
            </div>
          </div>

          <div className="pr-boxes">
            <div className="pr-box pr-features">
              <ul className="pr-col pr-col--l">
                <Item title="Доступ ко всем 12 направлениям" sub="С первого дня на год" />
                <Item title="Живые разборы с Дядей Андреем" sub="Каждую неделю" />
                <Item title="Офлайн-встречи:" sub="МСК, СПБ, Пхукет, Дубай" />
                <Item title="Поиск первых заказов" sub="Гарантированная помощь" />
              </ul>
              <ul className="pr-col pr-col--r">
                <Item
                  title="Ежедневные прямые эфиры с наставниками"
                  sub="Ответы на все вопросы, персональная помощь"
                  wide
                />
                <li className="is-top">
                  <img src={`${A}/check-b.svg`} alt="" className="pr-check is-18" />
                  <div className="pr-bonus">
                    <p className="pr-t">5 бонусных курсов:</p>
                    <div className="pr-chips">
                      {BONUS.map((b) => (
                        <span key={b}>{b}</span>
                      ))}
                    </div>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </article>

      <div className="pr-more">
        <div className="pr-more-text">
          <p className="pr-more-1">
            Нужен только доступ к урокам?{' '}
            <br className="pr-mbr" />
            Базовая подписка - 5 900 ₽/мес
          </p>
          <p className="pr-more-2">
            12 направлений, уроки без личных разборов,{' '}
            <br className="pr-mbr" />
            оплата помесячно
          </p>
        </div>
        <button type="button" className="pr-access" onClick={openModal}>
          Смотреть тариф
          <span className="pr-chev">
            <img src={`${A}/chevron.svg`} alt="" />
          </span>
        </button>
      </div>

      {open && <Suspense fallback={null}><BasicModal closing={closing} onClose={closeModal} /></Suspense>}
    </section>
  )
}
