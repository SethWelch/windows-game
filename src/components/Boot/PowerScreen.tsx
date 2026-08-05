import { useEffect, useState } from 'react'
import { boot } from '@/os/boot.ts'
import './Boot.css'

/**
 * The machine, switched off.
 *
 * The amber line is what a 98-era box left on screen after the shell had gone,
 * because the hardware couldn't cut its own power. The button appears a beat later,
 * once that's had time to read.
 */
export function PowerScreen() {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const id = window.setTimeout(() => setReady(true), 1100)
    return () => window.clearTimeout(id)
  }, [])

  return (
    <div className="boot boot--off">
      <p className="boot-safe">It's now safe to turn off your computer.</p>

      <button
        type="button"
        className="boot-power"
        data-ready={ready}
        aria-label="Turn on"
        title="Turn on"
        onClick={() => boot.restart()}
      >
        <svg viewBox="0 0 48 48" aria-hidden>
          {/* The IEC standby mark: a broken ring with a stroke through the gap. */}
          <path
            d="M14.5 11.5a16 16 0 1 0 19 0"
            fill="none"
            stroke="currentColor"
            strokeWidth="4"
            strokeLinecap="round"
          />
          <path
            d="M24 5v16"
            fill="none"
            stroke="currentColor"
            strokeWidth="4"
            strokeLinecap="round"
          />
        </svg>
      </button>
    </div>
  )
}
