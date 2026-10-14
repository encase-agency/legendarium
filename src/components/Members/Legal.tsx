import './Legal.css'

const REGISTRY =
  'https://obrnadzor.gov.ru/gosudarstvennye-uslugi-i-funkczii/gosudarstvennye-uslugi/liczenzirovanie-obrazovatelnoj-deyatelnosti/svodnyj-reestr-liczenzij/'

// Figma 530:5791.
export function Legal() {
  return (
    <section className="lg" id="legal">
      <div className="lg-head">
        <h2 className="lg-heading">
          Легендариум работает <em>официально</em>
        </h2>
        <p className="lg-sub">
          У проекта есть бессрочная образовательная лицензия, публичная оферта{' '}
          <br />
          и официальные реквизиты. Программа, срок доступа, порядок оплаты{' '}
          <br />и гарантии закреплены документами.
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
            № Л035-01252-46/01391373. Выдана Министерством образования и науки Курской области. Бессрочная.
          </p>
          <p className="lg-link">
            <a href={REGISTRY} target="_blank" rel="noreferrer">
              Открыть официальный реестр Рособрнадзора
            </a>
            .
          </p>
        </article>

        <article className="lg-card">
          <h3>Договор (публичная оферта)</h3>
          <p className="lg-w206">
            Всё, что входит, сроки{' '}
            <br />и гарантии прописаны{' '}
            <br />в договоре. Его можно прочитать до оплаты.
          </p>
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
