import { useSyncExternalStore } from 'react'

/**
 * What the machine is doing: powered down, running its POST, in Windows, or dropped
 * to a command prompt because the shell couldn't start.
 *
 * There is exactly one way to end up in `dos`: emptying the Recycle Bin while My
 * Computer is in it. That is a bug — `system` items are supposed to be undeletable —
 * and this is what it costs.
 *
 * Deliberately not persisted, so a reload always comes up in Windows. Nobody should
 * be able to lock themselves out of the desktop, and it's what makes `restart` a real
 * escape hatch rather than a joke.
 */

export type BootState = 'off' | 'starting' | 'windows' | 'dos'

let state: BootState = 'windows'
const listeners = new Set<() => void>()

function set(next: BootState) {
  if (next === state) return
  state = next
  listeners.forEach((l) => l())
}

export const boot = {
  /** The shell is gone. Drop to the prompt. */
  crash: () => set('dos'),
  /** Windows is up: the end of the POST, or `WINDOWS` at the prompt. */
  start: () => set('windows'),
  turnOff: () => set('off'),
  /** Power on, or restart. Runs the POST before Windows. */
  restart: () => set('starting'),

  /**
   * Whether programs can run. The window manager asks before opening anything, so a
   * timer left over from a signed-in AIM session can't raise a window at a machine
   * that is switched off.
   */
  isRunning: () => state === 'windows',
}

export function useBootState(): BootState {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l)
      return () => listeners.delete(l)
    },
    () => state,
    () => state,
  )
}
