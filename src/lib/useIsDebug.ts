import { useState } from 'react'

export function useIsDebug(): boolean {
  const [isDebug] = useState(
    () => new URLSearchParams(window.location.search).get('debug') === '1',
  )
  return isDebug
}
