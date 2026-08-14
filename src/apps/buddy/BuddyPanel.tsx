import { useEffect } from 'react'
import { BongoArt } from '@/components/Buddy/BongoArt.tsx'
import { buddy, useBuddies } from '@/os/buddy.ts'
import type { AppProps } from '@/os/types.ts'
import { wm } from '@/os/windowStore.ts'
import './BuddyPanel.css'

/**
 * Bongo's own window, which exists to be the thing that installs him and then to be
 * the thing that fails to remove him.
 *
 * Same shape as SpamBot: opening it is the install, and what you get afterwards is a
 * panel with a live count and a button that doesn't work. Closing the window doesn't
 * close him, because that was the whole trick — the program you could see was never the
 * program that was running.
 *
 * It carried a voice picker for a while, which was how the voice and pitch got settled;
 * those are fixed in os/voice.ts now, so there is nothing left in here to configure.
 */
export function BuddyPanel({ windowId }: AppProps) {
  const buddies = useBuddies()
  const attempts = buddy.attempts()

  // Opening it is the install. Bongo outlives the window that put him here.
  useEffect(() => {
    buddy.install()
  }, [])

  return (
    <div className="bp">
      <div className="bp-head">
        <span className="bp-portrait">
          <BongoArt mood="idle" />
        </span>
        <div className="bp-blurb">
          <p className="bp-title">Bongo Buddy 2.1</p>
          <p>
            Your new desktop companion! Bongo tells jokes, sings songs, and searches the
            web on your behalf whether or not you ask.
          </p>
          <p className="bp-count">
            {buddies.length === 1
              ? 'Bongo is on your desktop.'
              : `${buddies.length} Bongos are on your desktop.`}
          </p>
        </div>
      </div>

      <p className="bp-hint">
        Click him to hear something. Right-click him for everything else.
        {attempts > 0 && (
          <>
            {' '}
            Uninstall attempted {attempts} time{attempts === 1 ? '' : 's'}.
            {attempts >= 3 && ' Each attempt has been noted.'}
          </>
        )}
      </p>

      <div className="bp-buttons">
        <button type="button" className="xp-button" onClick={() => buddy.uninstall()}>
          Uninstall Bongo
        </button>
        <button type="button" className="xp-button" onClick={() => wm.close(windowId)}>
          Close
        </button>
      </div>
    </div>
  )
}
