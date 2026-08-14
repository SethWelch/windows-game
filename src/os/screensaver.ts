import { useSyncExternalStore } from 'react'
import { boot } from './boot.ts'
import { display } from './display.ts'
import { wm } from './windowStore.ts'
import type { SaverId } from '@/screensavers/savers.ts'

/**
 * Whether a screen saver is up, and the idleness that puts it there.
 *
 * The saver itself is a full-screen overlay rather than a boot state — see
 * components/Screensaver/ScreensaverLayer.tsx. A new `BootState` would unmount the whole
 * desktop and take every open window's state with it, which is the opposite of what a
 * screen saver is for.
 *
 * Not persisted. Which saver and how long to wait are settings and live in os/display.ts;
 * whether one is *running* is a fact about this moment, like os/shutdown.ts.
 */

/** How often to check for idleness. Polling beats re-arming a timeout per mouse move. */
const POLL_MS = 1000

/**
 * How long after a session starts to ignore input.
 *
 * A stationary mouse still emits sub-pixel moves, and the overlay appearing under the
 * cursor produces one on its own — without this the saver dismisses itself on the frame
 * it appears.
 */
const WARM_UP_MS = 700

/** Cumulative pointer travel that counts as "the user is back", in px. */
const MOVE_SLOP = 6

let running = false
/**
 * A saver to show instead of the applied one, for the length of one session.
 *
 * Display Properties needs this because its settings are now a draft: pressing Preview
 * has to show the saver you just picked, and that one has not been applied yet. Null for
 * an idle-triggered session, which shows what is actually configured.
 */
let previewing: SaverId | null = null
let startedAt = 0
let lastActivity = Date.now()
let poll: number | null = null
const listeners = new Set<() => void>()

const notify = () => listeners.forEach((l) => l())

const bump = () => {
  lastActivity = Date.now()
}

/** Bubble phase and passive, deliberately: this must never interfere with anything. */
const ACTIVITY = ['pointermove', 'pointerdown', 'keydown', 'wheel'] as const

function watch() {
  for (const type of ACTIVITY) {
    document.addEventListener(type, bump, { passive: true })
  }
}

function unwatch() {
  for (const type of ACTIVITY) document.removeEventListener(type, bump)
}

function tick() {
  // Nothing appears over the POST, the stop screen or a machine that is switched off.
  if (!boot.isRunning() || running) return
  const { saver, waitMinutes } = display.get()
  if (saver === 'none') return
  if (Date.now() - lastActivity >= waitMinutes * 60_000) screensaver.start()
}

export const screensaver = {
  /** Begin watching for idleness. Called once, when the desktop mounts. */
  arm() {
    if (poll !== null) return
    lastActivity = Date.now()
    watch()
    poll = window.setInterval(tick, POLL_MS)
  },

  disarm() {
    if (poll !== null) window.clearInterval(poll)
    poll = null
    unwatch()
  },

  /**
   * Put one up. `preview` overrides which saver runs, which is what Display Properties
   * passes so an unapplied choice can still be previewed.
   */
  start(preview?: SaverId) {
    if (running) return
    running = true
    previewing = preview ?? null
    startedAt = Date.now()
    // While a session is up the overlay owns input; these would only fight it.
    unwatch()
    wm.setStartMenu(false)
    notify()
  },

  stop() {
    if (!running) return
    running = false
    previewing = null
    // Reset the clock as well as re-arming: without this the click that dismissed the
    // saver is measured against a timestamp from before it started, and it comes
    // straight back a second later.
    lastActivity = Date.now()
    watch()
    notify()
  },

  /**
   * Whether enough time has passed since the session began to accept input. See
   * WARM_UP_MS — the overlay asks before dismissing itself.
   */
  settled: () => Date.now() - startedAt >= WARM_UP_MS,

  /** What the POST does. Module state outlives a reboot; a session must not. */
  onBoot() {
    screensaver.disarm()
    running = false
    previewing = null
    lastActivity = Date.now()
    notify()
  },

  isRunning: () => running,
}

export const MOVE_THRESHOLD = MOVE_SLOP

/**
 * Which saver a running session should draw, or null to use the applied setting.
 *
 * Subscribed rather than read once, so it and `running` cannot be read from different
 * moments — they are always written together.
 */
export function useScreensaverPreview(): SaverId | null {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l)
      return () => listeners.delete(l)
    },
    () => previewing,
    () => previewing,
  )
}

export function useScreensaverRunning(): boolean {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l)
      return () => listeners.delete(l)
    },
    () => running,
    () => running,
  )
}
