import { useEffect, useState } from 'react'

/**
 * Ticks on the wall-clock minute rather than every second: the displayed time
 * flips exactly when the minute does, with no drift and no wasted renders.
 */
export function useClock() {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    let id = 0
    const schedule = () => {
      id = window.setTimeout(
        () => {
          setNow(new Date())
          schedule()
        },
        60_000 - (Date.now() % 60_000),
      )
    }
    schedule()
    return () => window.clearTimeout(id)
  }, [])

  return now
}
