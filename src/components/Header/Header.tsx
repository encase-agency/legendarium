import { useCallback, useEffect, useRef, useState } from 'react'
import { scrollToSection } from '../../lib/scrollToSection'
import { MenuOverlay } from './MenuOverlay'
import './Header.css'
import { asset } from '../../lib/asset'

// Figma 545:6954: logo on the left, "Вступить" + "Меню" on the right. Fixed for the whole page, no shadow.
// "Меню" opens the full-screen menu (Figma 291:5241).
export function Header() {
  const [open, setOpen] = useState(false)
  const [closing, setClosing] = useState(false)
  const timer = useRef<number>(0)

  const closeMenu = useCallback(() => {
    setClosing(true)
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => {
      setOpen(false)
      setClosing(false)
    }, 250)
  }, [])

  const pick = useCallback(
    (id: string) => {
      closeMenu()
      window.setTimeout(() => scrollToSection(id), 270)
    },
    [closeMenu],
  )

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
    <header className="sh">
      <div className="sh-bar">
        <a
          className="sh-logo"
          href="#hero"
          aria-label="Легендариум"
          onClick={(e) => {
            e.preventDefault()
            scrollToSection('hero')
          }}
        >
          <img src={asset('/assets/hero/figma-logo.png')} alt="" />
        </a>
        <nav className="sh-nav">
          <a
            className="sh-btn sh-btn--dark"
            href="#pricing"
            onClick={(e) => {
              e.preventDefault()
              scrollToSection('pricing', 0, true)
            }}
          >
            Вступить в Легендариум
          </a>
          <button
            type="button"
            className="sh-btn sh-btn--light"
            aria-haspopup="dialog"
            aria-expanded={open}
            onClick={() => {
              window.clearTimeout(timer.current)
              setClosing(false)
              setOpen(true)
            }}
          >
            <img className="sh-burger" src={asset('/assets/footer/burger.svg')} alt="" />
            <span className="sh-label">Меню</span>
          </button>
        </nav>
      </div>

      {open && <MenuOverlay closing={closing} onClose={closeMenu} onPick={pick} />}
    </header>
  )
}
