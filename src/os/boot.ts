import { useSyncExternalStore } from 'react'
import { fs } from './fs.ts'

/**
 * What the machine is doing: powered down, running its POST, in Windows, stopped on a
 * bugcheck, or dropped to a command prompt because the shell couldn't start.
 *
 * There is exactly one way to end up in `dos`: emptying the Recycle Bin while My
 * Computer is in it. That is a bug — `system` items are supposed to be undeletable —
 * and this is what it costs.
 *
 * `bsod` has two ways in, both of them things you have to go and do: filling the
 * screen with every advertisement there is, or killing a critical process from the
 * command prompt. Neither can happen by accident.
 *
 * Deliberately not persisted, so a reload always comes up in Windows. Nobody should
 * be able to lock themselves out of the desktop, and it's what makes `restart` a real
 * escape hatch rather than a joke.
 */

export type BootState = 'off' | 'starting' | 'windows' | 'dos' | 'bsod'

/**
 * A bugcheck, in the shape the screen prints it.
 *
 * XP had two layouts and used both. The long one names the bugcheck and recites four
 * paragraphs of advice; the short one is for a fatal system error, where a process
 * Windows cannot live without has gone. `name` being null selects the short one.
 */
export interface StopError {
  /** The bugcheck's all-caps name. Null for the short {Fatal System Error} form. */
  name: string | null
  /** As printed after `*** STOP:` — '0x000000D1', or a bare 'c000021a'. */
  code: string
  /** The four bracketed parameters the long form carries. */
  params?: [string, string, string, string]
  /** The offending driver, named and located. */
  driver?: { file: string; address: string; base: string; stamp: string }
  /** Body lines for the short form, which skips the boilerplate. */
  detail?: string[]
}

/** Every advertisement at once. The adware sidebar finally gets a kernel driver. */
export const STOP_SPAM: StopError = {
  name: 'DRIVER_IRQL_NOT_LESS_OR_EQUAL',
  code: '0x000000D1',
  params: ['0x00000000', '0x00000002', '0x00000000', '0xF7A9C3F4'],
  driver: {
    file: 'sfindrv.sys',
    address: 'F7A9C3F4',
    base: 'F7A9C000',
    stamp: '3dd991eb',
  },
}

/**
 * Standby. `DRIVER_POWER_STATE_FAILURE` is the genuine bugcheck for a device that
 * wouldn't change power state, and it is what these machines really did die of on the
 * way into or out of standby — often enough that plenty of people simply never used it.
 */
export const STOP_STANDBY: StopError = {
  name: 'DRIVER_POWER_STATE_FAILURE',
  code: '0x0000009F',
  params: ['0x00000003', '0x85F1E9A8', '0x85D4C550', '0x8A3B1C08'],
  driver: {
    file: 'USBPORT.SYS',
    address: 'F8A21B4C',
    base: 'F8A1E000',
    stamp: '3b7d8419',
  },
}

/** `taskkill /f` on something the kernel was relying on. */
export const stopFatal = (process: string): StopError => ({
  name: null,
  code: 'c000021a',
  detail: [
    `The ${process} system process terminated unexpectedly`,
    'with a status of 0xc0000005 (0x00000000 0x00000000).',
    'The system has been shut down.',
  ],
})

let state: BootState = 'windows'
let stop: StopError = STOP_SPAM
const listeners = new Set<() => void>()

function set(next: BootState) {
  if (next === state) return
  state = next
  listeners.forEach((l) => l())
}

export const boot = {
  /** The shell is gone. Drop to the prompt. */
  crash: () => set('dos'),

  /**
   * Stop the machine on a bugcheck. The screen reads the error straight out of the
   * module rather than through the store — it can only be mounted while the state is
   * `bsod`, and this is set before the notification that gets it there.
   */
  bluescreen(error: StopError) {
    stop = error
    set('bsod')
  },
  /** What to print. Only meaningful while the state is `bsod`. */
  stopError: () => stop,

  /** Windows is up: the end of the POST, or `WINDOWS` at the prompt. */
  start: () => set('windows'),
  /**
   * Power down properly, which repairs the install on the way out: everything still in
   * the Recycle Bin goes home and anything the machine shipped with that was destroyed
   * comes back. Restarting deliberately does *not* do this — a restart only clears what
   * is running, so a machine you have broken stays broken until you switch it off.
   *
   * Here rather than in the panel that calls it, so no future caller can power the
   * machine down and forget.
   */
  turnOff() {
    fs.repair()
    set('off')
  },
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
