import { useRef } from 'react'
import { useCardReveal } from '../../lib/motion'
import { siteConfig } from '../../lib/siteConfig'
import { linkAttrs } from '../../lib/documents'
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
            {siteConfig.license.text?.replace(/^Образовательная лицензия\s*/i, '') ?? 'Реквизиты образовательной лицензии уточняются.'}
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
          <p className="lg-link">{siteConfig.documents.offer ? <a {...linkAttrs(siteConfig.documents.offer)}>Прочитать оферту</a> : 'Оферта пока недоступна.'}</p>
        </article>

        <article className="lg-card">
          <h3>Официальная оплата</h3>
          <p className="lg-w199">
            Оплата проходит через платёжную систему или банк. После оплаты приходит кассовый чек.
          </p>
        </article>

        <article className="lg-card">
          <h3>Гарантия</h3>
          <p>Условия программы, сопровождения и гарантии закреплены в публичной оферте</p>
        </article>
      </div>
    </section>
  )
}
