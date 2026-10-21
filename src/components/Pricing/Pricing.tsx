import { siteConfig } from '../../lib/siteConfig'
import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react'
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

// Figma 542:6449 (plans) and 291:5292 (basic plan modal, opened by "Получить доступ").
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
      <a className="pr-pay" href={siteConfig.checkout.legend} aria-disabled={!siteConfig.checkout.legend} onClick={(event) => { if (!siteConfig.checkout.legend) event.preventDefault() }}>
        <span className="pr-gold" aria-hidden="true">
          <img src={`${A}/gold.jpg`} alt="" className="pr-gold-btn" />
        </span>
        <span className="pr-pay-text">{siteConfig.checkout.legend ? 'Оплатить сейчас' : 'Оплата недоступна'}</span>
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
              <div className="pr-prices">
                <p className="pr-old">
                  70 800 ₽<span className="pr-strike" />
                </p>
                <p className="pr-price">
                  <span>49 900 ₽/ </span>
                  <small>год</small>
                </p>
              </div>
            </div>
            <div className="pr-row pr-row--note">
              <p className="pr-for">На результат</p>
              <p className="pr-save">
                Выгода 20 900 ₽ - ты платишь{' '}
                <br />
                на 30% меньше
              </p>
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

            <div className="pr-box pr-installment">
              <div className="pr-inst-l">
                <p className="pr-inst-title">Рассрочка</p>
                <div className="pr-inst-text">
                  <p className="pr-t">Первый платеж только через 30 дней</p>
                  <p className="pr-s pr-s--319">
                    Есть время получить первые заказы и оплачивать рассрочку с заработанных денег
                  </p>
                </div>
              </div>
              <div className="pr-inst-r">
                <div className="pr-inst-price">
                  <p className="pr-inst-sum">
                    <span>4 158 ₽/</span>
                    <small>мес</small>
                  </p>
                  <p className="pr-s pr-s--tight">
                    без % и переплат{' '}
                    <br className="pr-mbr" />
                    140 ₽/день
                  </p>
                </div>
                <div className="pr-banks">
                  <span className="pr-bank pr-bank--a">
                    <img src={`${A}/bank-a.png`} alt="Т-Банк" />
                  </span>
                  <span className="pr-bank pr-bank--b">
                    <img src={`${A}/bank-b.png`} alt="Сбер" />
                  </span>
                  <span className="pr-bank pr-bank--c">
                    <img src={`${A}/bank-c.png`} alt="Яндекс Сплит" />
                  </span>
                </div>
              </div>
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
          Получить доступ
          <span className="pr-chev">
            <img src={`${A}/chevron.svg`} alt="" />
          </span>
        </button>
      </div>

      {open && <Suspense fallback={null}><BasicModal closing={closing} onClose={closeModal} /></Suspense>}
    </section>
  )
}
