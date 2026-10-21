import { useEffect, useRef, type RefObject } from 'react'

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), video[controls], [tabindex]:not([tabindex="-1"])'
const dialogs: HTMLElement[] = []
let originalOverflow = ''

/** Shared by the portal dialogs; the root lock also covers Safari wheel/touch scrolling. */
export function activateDialog(dialog: HTMLElement, onClose: () => void, initialFocus?: HTMLElement | null) {
  const previous = document.activeElement as HTMLElement | null
  if (dialogs.length === 0) {
    originalOverflow = document.documentElement.style.overflow
    document.documentElement.style.overflow = 'hidden'
  }
  dialogs.push(dialog)
  const focusable = () => Array.from(dialog.querySelectorAll<HTMLElement>(FOCUSABLE))
    .filter(element => element.tabIndex >= 0 && element.getClientRects().length > 0)
  const focusFirst = () => (focusable()[0] ?? dialog).focus({ preventScroll: true })
  const isTop = () => dialogs.at(-1) === dialog
  const onKey = (event: KeyboardEvent) => {
    if (!isTop()) return
    if (event.key === 'Escape') {
      event.preventDefault()
      onClose()
    }
    if (event.key !== 'Tab') return
    const elements = focusable()
    const first = elements[0]
    const last = elements.at(-1)
    if (!first || !last) {
      event.preventDefault()
      dialog.focus({ preventScroll: true })
    } else if (event.shiftKey && (document.activeElement === first || !dialog.contains(document.activeElement))) {
      event.preventDefault()
      last.focus({ preventScroll: true })
    } else if (!event.shiftKey && (document.activeElement === last || !dialog.contains(document.activeElement))) {
      event.preventDefault()
      first.focus({ preventScroll: true })
    }
  }
  const onFocus = (event: FocusEvent) => {
    if (isTop() && !dialog.contains(event.target as Node)) focusFirst()
  }
  document.addEventListener('keydown', onKey)
  document.addEventListener('focusin', onFocus)
  if (initialFocus) initialFocus.focus({ preventScroll: true })
  else focusFirst()
  return () => {
    document.removeEventListener('keydown', onKey)
    document.removeEventListener('focusin', onFocus)
    const index = dialogs.lastIndexOf(dialog)
    if (index !== -1) dialogs.splice(index, 1)
    if (dialogs.length === 0) document.documentElement.style.overflow = originalOverflow
    if (previous?.isConnected) previous.focus({ preventScroll: true })
  }
}

export function useDialogLifecycle(
  dialogRef: RefObject<HTMLElement | null>,
  onClose: () => void,
  initialFocusRef?: RefObject<HTMLElement | null>,
) {
  const onCloseRef = useRef(onClose)
  useEffect(() => { onCloseRef.current = onClose }, [onClose])
  useEffect(() => {
    const dialog = dialogRef.current
    if (dialog) return activateDialog(dialog, () => onCloseRef.current(), initialFocusRef?.current)
  }, [dialogRef, initialFocusRef])
}
