import { useEffect, useRef } from 'react'
import type { RefObject } from 'react'

/**
 * Fires when a pointerdown lands outside every supplied ref, or on Escape, or
 * when the window loses focus. Listens in the capture phase so it wins against
 * handlers that stop propagation on their way up.
 */
export function useOutsideClick(
  refs: RefObject<HTMLElement | null>[],
  onDismiss: () => void,
  enabled = true,
) {
  // Callers pass a fresh array literal and inline callback every render; keeping
  // them in a ref means the listeners attach once instead of on every render.
  const latest = useRef({ refs, onDismiss })
  useEffect(() => {
    latest.current = { refs, onDismiss }
  })

  useEffect(() => {
    if (!enabled) return

    const isInside = (target: EventTarget | null) =>
      target instanceof Node &&
      latest.current.refs.some((r) => r.current?.contains(target))

    const onPointerDown = (e: PointerEvent) => {
      if (!isInside(e.target)) latest.current.onDismiss()
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') latest.current.onDismiss()
    }
    const onBlur = () => latest.current.onDismiss()

    document.addEventListener('pointerdown', onPointerDown, true)
    document.addEventListener('keydown', onKeyDown, true)
    window.addEventListener('blur', onBlur)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown, true)
      document.removeEventListener('keydown', onKeyDown, true)
      window.removeEventListener('blur', onBlur)
    }
  }, [enabled])
}
