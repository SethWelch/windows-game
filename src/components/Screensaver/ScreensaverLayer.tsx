import { useEffect, useRef } from 'react'
import { useDisplay } from '@/os/display.ts'
import {
  MOVE_THRESHOLD,
  screensaver,
  useScreensaverPreview,
  useScreensaverRunning,
} from '@/os/screensaver.ts'
import { SAVERS } from '@/screensavers/savers.ts'
import { SaverCanvas } from './SaverCanvas.tsx'
import './Screensaver.css'

/**
 * The screen saver, over everything.
 *
 * A true overlay rather than a boot state: a new `BootState` would unmount the desktop and
 * take every open window's state with it. The desktop keeps running underneath — which is
 * exactly why this has to swallow the input that dismisses it, rather than merely sitting
 * on top of it.
 */
export function ScreensaverLayer() {
  const running = useScreensaverRunning()
  const { saver: configured } = useDisplay()
  // Display Properties can preview a saver it hasn't applied yet — see `start`.
  const preview = useScreensaverPreview()
  const saver = preview ?? configured
  const rootRef = useRef<HTMLDivElement | null>(null)

  /**
   * Ends the session, and eats the event that ended it.
   *
   * Both calls are needed, for different reasons. `stopImmediatePropagation` stops the
   * other *listeners*: nine apps keep a `keydown` on `document`, so the dismissing key
   * would otherwise also reach Calculator and Solitaire. `preventDefault` stops the
   * *default action*, so it doesn't type a character into a focused Notepad. Suppressing
   * `pointerdown` has the same payoff — the click that wakes the machine doesn't also
   * press whatever was under the cursor, which is how the real thing behaved and would
   * otherwise be genuinely annoying.
   *
   * Capture phase on `window`, the first node in the propagation path, so it runs ahead
   * of every listener the shell has on `document`.
   */
  useEffect(() => {
    if (!running) return
    const root = rootRef.current
    // Focus it so no caret is left blinking in a Notepad behind a blanked screen, and so
    // an IME cannot start composing into something invisible.
    root?.focus()

    const dismiss = (e: Event) => {
      if (!screensaver.settled()) return
      e.stopImmediatePropagation()
      e.preventDefault()
      screensaver.stop()
    }

    /**
     * Movement has to accumulate past a threshold rather than counting at all: a
     * stationary mouse still emits sub-pixel moves, and the overlay appearing under the
     * cursor produces one by itself. The first event is discarded outright.
     */
    let travelled = 0
    let seen = false
    const onMove = (e: PointerEvent) => {
      if (!seen) {
        seen = true
        return
      }
      travelled += Math.abs(e.movementX) + Math.abs(e.movementY)
      if (travelled >= MOVE_THRESHOLD) dismiss(e)
    }

    window.addEventListener('keydown', dismiss, true)
    window.addEventListener('pointerdown', dismiss, true)
    window.addEventListener('wheel', dismiss, true)
    window.addEventListener('pointermove', onMove, true)

    return () => {
      window.removeEventListener('keydown', dismiss, true)
      window.removeEventListener('pointerdown', dismiss, true)
      window.removeEventListener('wheel', dismiss, true)
      window.removeEventListener('pointermove', onMove, true)
    }
  }, [running])

  // Nothing is mounted unless a session is up, so no loop exists while the machine is
  // merely awake and idle.
  if (!running || !SAVERS[saver]) return null

  return (
    <div className="saver" ref={rootRef} tabIndex={-1} role="presentation">
      {/* Keyed on the saver so switching it tears the old loop down rather than handing a
          new painter to a closure built for the old one. */}
      <SaverCanvas key={saver} saver={saver} />
    </div>
  )
}
