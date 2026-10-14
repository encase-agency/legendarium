import { Leva } from 'leva'

interface HeroDebugPanelProps {
  isDebug: boolean
}

export function HeroDebugPanel({ isDebug }: HeroDebugPanelProps) {
  return <Leva hidden={!isDebug} titleBar={{ title: 'Hero Debug' }} collapsed={false} />
}
