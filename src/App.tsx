import { useEffect } from 'react'
import { scrollToSection } from './lib/scrollToSection'
import { Header } from './components/Header/Header'
import { Hero } from './components/Hero/Hero'
import { Features } from './components/Features/Features'
import { Showcase } from './components/Showcase/Showcase'
import { Pain } from './components/Pain/Pain'
import { Statement } from './components/Statement/Statement'
import { Future } from './components/Future/Future'
import { Compare } from './components/Compare/Compare'
import { Steps } from './components/Steps/Steps'
import { Platform } from './components/Platform/Platform'
import { Crew } from './components/Crew/Crew'
import { Directions } from './components/Directions/Directions'
import { Faculties } from './components/Faculties/Faculties'
import { Community } from './components/Community/Community'
import { FounderQuote } from './components/Founder/FounderQuote'
import { Mission } from './components/Founder/Mission'
import { FounderPath } from './components/Founder/FounderPath'
import { Results } from './components/Results/Results'
import { Cases } from './components/Cases/Cases'
import { Members } from './components/Members/Members'
import { Legal } from './components/Members/Legal'
import { Pricing } from './components/Pricing/Pricing'
import { Faq } from './components/Faq/Faq'
import { Ask } from './components/Ask/Ask'
import { Story } from './components/Story/Story'
import { Footer } from './components/Footer/Footer'

function App() {
  // In-page links (#pricing, #route, ...) jump straight to the block; sections pinned by ScrollTrigger are handled too.
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey) return
      const a = (e.target as Element).closest?.('a[href^="#"]') as HTMLAnchorElement | null
      const id = a?.getAttribute('href')?.slice(1)
      if (!id || !document.getElementById(id)) return
      e.preventDefault()
      scrollToSection(id)
    }
    document.addEventListener('click', onClick)
    return () => document.removeEventListener('click', onClick)
  }, [])

  return (
    <>
      <Header />
      <Hero />
      <Features />
      <Showcase />
      <Pain />
      <Statement />
      <Future />
      <Compare />
      <Steps />
      <Platform />
      <Crew />
      <Directions />
      <Faculties />
      <Community />
      <FounderQuote />
      <Mission />
      <FounderPath />
      <Results />
      <Cases />
      <Members />
      <Legal />
      <Pricing />
      <Faq />
      <Ask />
      <Story />
      <Footer />
    </>
  )
}

export default App
