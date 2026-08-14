import { useEffect, useState } from 'react'
import { boot } from '@/os/boot.ts'
import './BsodScreen.css'

/**
 * The stop screen. Not a window and not inside the shell — by the time this is up
 * there is no shell, which is the whole point of how XP drew it: text mode, one
 * column, no chrome of any kind.
 *
 * The dump counts up because that was the part you sat and watched, deciding whether
 * this was the time the machine didn't come back. Nothing responds until it finishes,
 * which is also how it was; after that any key restarts, because a real one either sat
 * there forever or rebooted itself and only one of those is worth building.
 *
 * Silent on purpose. A bugcheck stopped the kernel before it could ask the sound card
 * for anything.
 */

/** The advice, verbatim in shape if not in every comma. */
const ADVICE = [
  "If this is the first time you've seen this Stop error screen,",
  'restart your computer. If this screen appears again, follow',
  'these steps:',
  '',
  'Check to make sure any new hardware or software is properly installed.',
  'If this is a new installation, ask your hardware or software manufacturer',
  'for any Windows updates you might need.',
  '',
  'If problems continue, disable or remove any newly installed hardware',
  'or software. Disable BIOS memory options such as caching or shadowing.',
  'If you need to use Safe Mode to remove or disable components, restart',
  'your computer, press F8 to select Advanced Startup Options, and then',
  'select Safe Mode.',
]

/** How long the dump takes, in milliseconds per percent. */
const DUMP_TICK = 26

export function BsodScreen() {
  const stop = boot.stopError()
  const [dumped, setDumped] = useState(0)
  const done = dumped >= 100

  useEffect(() => {
    if (done) return
    const id = window.setInterval(() => {
      // Uneven, because it was never a smooth progress bar — it stalled and jumped.
      setDumped((d) => Math.min(100, d + 1 + (d % 7 === 0 ? 3 : 0)))
    }, DUMP_TICK)
    return () => window.clearInterval(id)
  }, [done])

  // Nothing is accepted until the dump finishes.
  useEffect(() => {
    if (!done) return
    const restart = () => boot.restart()
    window.addEventListener('keydown', restart)
    window.addEventListener('mousedown', restart)
    return () => {
      window.removeEventListener('keydown', restart)
      window.removeEventListener('mousedown', restart)
    }
  }, [done])

  return (
    <div className="bsod">
      <div className="bsod-page">
        {stop.name ? (
          <>
            <p className="bsod-line">
              A problem has been detected and Windows has been shut down to prevent
              damage
            </p>
            <p className="bsod-line">to your computer.</p>
            <p className="bsod-blank" />
            <p className="bsod-line">{stop.name}</p>
            <p className="bsod-blank" />
            {ADVICE.map((line, i) =>
              line ? (
                <p key={i} className="bsod-line">
                  {line}
                </p>
              ) : (
                <p key={i} className="bsod-blank" />
              ),
            )}
            <p className="bsod-blank" />
            <p className="bsod-line">Technical information:</p>
            <p className="bsod-blank" />
            <p className="bsod-line">
              {`*** STOP: ${stop.code}`}
              {stop.params ? ` (${stop.params.join(',')})` : ''}
            </p>
            {stop.driver && (
              <>
                <p className="bsod-blank" />
                <p className="bsod-line">
                  {`***  ${stop.driver.file} - Address ${stop.driver.address} base at ` +
                    `${stop.driver.base}, DateStamp ${stop.driver.stamp}`}
                </p>
              </>
            )}
          </>
        ) : (
          <>
            <p className="bsod-line">{`*** STOP: ${stop.code} {Fatal System Error}`}</p>
            <p className="bsod-blank" />
            {stop.detail?.map((line) => (
              <p key={line} className="bsod-line">
                {line}
              </p>
            ))}
          </>
        )}

        <p className="bsod-blank" />
        <p className="bsod-line">
          {done
            ? 'Beginning dump of physical memory'
            : `Dumping physical memory to disk: ${dumped}`}
        </p>
        {done && (
          <>
            <p className="bsod-line">Physical memory dump complete.</p>
            <p className="bsod-line">
              Contact your system administrator or technical support group for further
            </p>
            <p className="bsod-line">assistance.</p>
            <p className="bsod-blank" />
            {/* Ours says so. A real one left you to work it out. */}
            <p className="bsod-line bsod-hint">Press any key to restart.</p>
          </>
        )}
      </div>
    </div>
  )
}
