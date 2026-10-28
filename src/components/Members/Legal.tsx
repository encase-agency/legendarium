import { useRef } from 'react'
import { useCardReveal } from '../../lib/motion'
import { siteConfig } from '../../lib/siteConfig'
import './Legal.css'

// Figma 530:5791.
export function Legal() {
  const ref = useRef<HTMLElement>(null)
  useCardReveal(ref, '.lg-card')
  return (
    <section className="lg" id="legal" ref={ref}>
      <div className="lg-head">
        <h2 className="lg-heading">
          Легендариум работает <em>официально</em>
        </h2>
        <p className="lg-sub">
          Правовые документы и реквизиты проекта.{' '}
          <br />
          Программа, срок доступа, порядок оплаты{' '}
          <br />и гарантии необходимо проверить до оплаты.
        </p>
      </div>

      <div className="lg-cards">
        <article className="lg-card">
          <h3>Исполнитель</h3>
          <p className="lg-lines">
            ИП Лукин Андрей Вячеславович.{' '}
            <br />
            ИНН 462005474536.{' '}
            <br />
            ОГРНИП 321463200032022.
          </p>
        </article>

        <article className="lg-card">
          <h3>Образовательная лицензия</h3>
          <p>
            {siteConfig.license.text ?? 'Реквизиты образовательной лицензии уточняются.'}
          </p>
          {siteConfig.license.url && <p className="lg-link">
            <a href={siteConfig.license.url} target="_blank" rel="noreferrer">
              Открыть официальный реестр Рособрнадзора
            </a>
            .
          </p>}
        </article>

        <article className="lg-card">
          <h3>Договор (публичная оферта)</h3>
          <p className="lg-w206">
            Всё, что входит, сроки{' '}
            <br />и гарантии прописаны{' '}
            <br />в договоре. Его можно прочитать до оплаты.
          </p>
          <p className="lg-link">{siteConfig.documents.offer ? <a href={siteConfig.documents.offer} target="_blank" rel="noreferrer">Прочитать оферту</a> : 'Оферта пока недоступна.'}</p>
        </article>

        <article className="lg-card">
          <h3>Официальная оплата</h3>
          <p className="lg-w199">
            Оплата проходит через платёжную систему или банк. После оплаты приходит кассовый чек.
          </p>
        </article>

        <article className="lg-card">
          <h3>Гарантия</h3>
          <p>
            Мы отвечаем за процесс.{' '}
            <br />
            Если ты выполнил условия программы из оферты,{' '}
            <br />
            но не получил зафиксированный договором результат — проект продолжает сопровождение{' '}
            <br />и компенсирует оплату{' '}
            <br />
            по условиям оферты.
          </p>
        </article>
      </div>
    </section>
  )
}
