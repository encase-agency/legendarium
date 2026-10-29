import { useSyncExternalStore } from 'react'

const media = (query: string) => ({
  subscribe: (callback: () => void) => {
    const list = window.matchMedia(query)
    list.addEventListener('change', callback)
    return () => list.removeEventListener('change', callback)
  },
  get: () => window.matchMedia(query).matches,
})

const phoneAndTablet = media('(max-width: 1100px)')
const smallPhone = media('(max-width: 767px)')

/** True on phones and tablets (the same breakpoint as the phone layout in the CSS). */
export function usePhoneLayout() {
  return useSyncExternalStore(phoneAndTablet.subscribe, phoneAndTablet.get, () => false)
}

/** True on phones only (up to 767px); tablets (iPad) get the computer layout. */
export function useSmallPhone() {
  return useSyncExternalStore(smallPhone.subscribe, smallPhone.get, () => false)
}
