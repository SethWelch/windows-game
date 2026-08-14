import { useSyncExternalStore } from 'react'

/**
 * Whether the Turn Off Computer panel is up.
 *
 * Its own store rather than local state in the desktop, because the two ends are far
 * apart: the Start menu's footer raises it and the desktop draws it, and threading a
 * callback down through the taskbar to get there would be worse than this.
 *
 * Not persisted. Coming back to a machine mid-question about switching itself off
 * would be a strange place to start.
 */

let open = false
const listeners = new Set<() => void>()

export const shutdown = {
  open: () => {
    if (open) return
    open = true
    listeners.forEach((l) => l())
  },
  close: () => {
    if (!open) return
    open = false
    listeners.forEach((l) => l())
  },
}

export function useShutdownPrompt(): boolean {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l)
      return () => listeners.delete(l)
    },
    () => open,
    () => open,
  )
}
