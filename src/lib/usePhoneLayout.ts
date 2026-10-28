import { useSyncExternalStore } from 'react'

const QUERY = '(max-width: 1100px)'

const subscribe = (callback: () => void) => {
  const query = window.matchMedia(QUERY)
  query.addEventListener('change', callback)
  return () => query.removeEventListener('change', callback)
}

/** True on phones and tablets (the same breakpoint as the phone layout in the CSS). */
export function usePhoneLayout() {
  return useSyncExternalStore(subscribe, () => window.matchMedia(QUERY).matches, () => false)
}
