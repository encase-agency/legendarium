import './Mission.css'
import { asset } from '../../lib/asset'

// Figma 530:2760: 1512x956 frame. Weights follow the spans in the file: semibold runs,
// regular punctuation and gold medium-italic runs.
export function Mission() {
  return (
    <section className="ms" id="mission">
      <img className="ms-logo" src={asset('/assets/statement/logo.svg')} alt="" />
      <p className="ms-caption">Легендариум</p>

      <p className="ms-text">
        <span className="ms-d">
        <b>Здесь учат тому,</b> <em className="g1">за что реально платят</em>.{' '}
        <br />
        <b>Наша миссия — стать полноценной</b>{' '}
        <br />
        <b>альтернативой традиционной системе</b>{' '}
        <br />
        <b>образования.</b> <em className="g2">Здесь с первых дней</em>{' '}
        <br />
        <em className="g2">осваивают востребованные навыки</em>
        <b>,</b>{' '}
        <br />
        <b>решают реальные задачи и получают</b>{' '}
        <br />
        <b>возможность</b> <em className="g2">зарабатывать уже</em>{' '}
        <br />
        <em className="g2">во время обучения.</em>
        </span>
        <span className="ms-m">
          <b>Здесь учат тому,</b> <em className="g1">за что реально платят</em>.{' '}
          <b>Наша миссия — стать полноценной альтернативой традиционной системе образования.</b>{' '}
          <em className="g2">
            Здесь{' '}
            <br />с первых дней осваивают востребованные навыки
          </em>
          <b>
            , решают реальные задачи{' '}
            <br />и получают возможность
          </b>{' '}
          <em className="g2">
            зарабатывать уже{' '}
            <br />
            во время обучения.
          </em>
        </span>
      </p>
    </section>
  )
}
