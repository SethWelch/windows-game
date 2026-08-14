import { useEffect } from 'react'
import { Icon } from '@/icons/Icon.tsx'
import { STOP_STANDBY, boot } from '@/os/boot.ts'
import { shutdown } from '@/os/shutdown.ts'
import { wm } from '@/os/windowStore.ts'
import './TurnOffDialog.css'

/**
 * The Turn Off Computer panel, and the grey it lays over everything behind it.
 *
 * Three choices, and in here they genuinely differ:
 *
 * - **Stand By** bugchecks. Not a joke at the machine's expense so much as a
 *   reproduction: standby on hardware of this era failed often enough that plenty of
 *   people learned never to touch it.
 * - **Restart** closes everything and runs the POST. It does not repair anything — a
 *   desktop you have broken is still broken on the other side.
 * - **Turn Off** powers down, and `boot.turnOff` puts the install right on the way out.
 *
 * The desaturation is `backdrop-filter` rather than a filter on the desktop itself.
 * Filtering an ancestor would make it the containing block for every `position: fixed`
 * descendant underneath — the trap documented in CLAUDE.md — and this way the effect
 * reaches backwards out of an element that contains nothing but itself.
 */
export function TurnOffDialog() {
  // Escape is Cancel. Nothing else is bound: the real panel took a click.
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') shutdown.close()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [])

  const choose = (act: () => void) => {
    shutdown.close()
    act()
  }

  return (
    <div className="xp-turnoff" role="dialog" aria-modal="true" aria-label="Turn off computer">
      <div className="xp-turnoff-panel">
        <div className="xp-turnoff-head">
          <span className="xp-turnoff-title">Turn off computer</span>
          <Icon id="windowsxp" size={32} className="xp-turnoff-logo" />
        </div>

        <div className="xp-turnoff-body">
          <button
            type="button"
            className="xp-turnoff-choice"
            onClick={() =>
              // Silent, and no warning. Announcing it first would give the game away,
              // and the stop screen it lands on makes no sound either.
              choose(() => boot.bluescreen(STOP_STANDBY))
            }
          >
            <span className="xp-turnoff-orb xp-turnoff-orb--standby" aria-hidden>
              <StandByGlyph />
            </span>
            Stand By
          </button>

          <button
            type="button"
            className="xp-turnoff-choice"
            onClick={() => choose(() => boot.turnOff())}
          >
            <span className="xp-turnoff-orb xp-turnoff-orb--off" aria-hidden>
              <PowerGlyph />
            </span>
            Turn Off
          </button>

          <button
            type="button"
            className="xp-turnoff-choice"
            onClick={() =>
              choose(() => {
                // Closed here as well as in the POST, so the desktop is already empty
                // behind the boot screen rather than flashing away underneath it.
                wm.closeAll()
                boot.restart()
              })
            }
          >
            <span className="xp-turnoff-orb xp-turnoff-orb--restart" aria-hidden>
              <RestartGlyph />
            </span>
            Restart
          </button>
        </div>

        <div className="xp-turnoff-foot">
          <button type="button" className="xp-button" onClick={() => shutdown.close()}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

/** The half-moon standby mark: a crescent cut out of a disc. */
function StandByGlyph() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden>
      <path
        d="M12 3.4v9.2"
        fill="none"
        stroke="#fff"
        strokeWidth="2.6"
        strokeLinecap="round"
      />
      <path
        d="M6.6 6.4a7.6 7.6 0 1 0 10.8 0"
        fill="none"
        stroke="#fff"
        strokeWidth="2.6"
        strokeLinecap="round"
      />
    </svg>
  )
}

/** The power mark, closed at the top rather than broken. */
function PowerGlyph() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden>
      <circle cx="12" cy="12" r="7.6" fill="none" stroke="#fff" strokeWidth="2.6" />
      <path d="M12 4.2v8" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" />
    </svg>
  )
}

/** Two arrows chasing each other round. */
function RestartGlyph() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden>
      <path
        d="M19.4 12a7.4 7.4 0 1 1-2.6-5.6"
        fill="none"
        stroke="#fff"
        strokeWidth="2.6"
        strokeLinecap="round"
      />
      <path d="M17.2 1.8v5.2h-5.2" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" />
    </svg>
  )
}
