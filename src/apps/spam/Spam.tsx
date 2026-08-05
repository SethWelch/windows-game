import { useEffect } from 'react'
import { popups, useAds } from '@/os/popups.ts'
import type { AppProps } from '@/os/types.ts'
import { wm } from '@/os/windowStore.ts'
import './Spam.css'

/**
 * What the SPAM icon actually runs.
 *
 * It infects on mount, which is the joke — you double-clicked it, that was the whole
 * transaction. The window it leaves behind is the escape hatch: a live count and one
 * button that clears the lot. Every ad also closes on its own X, and Escape works
 * from anywhere, so this is a convenience rather than the only way out.
 */
export function Spam({ windowId }: AppProps) {
  const ads = useAds()

  useEffect(() => {
    popups.infect()
  }, [])

  return (
    <div className="spam">
      <div className="xp-window-content">
        <div className="spam-body">
          <p className="spam-head">Thank you for installing SpamBot 2001.</p>
          <p className="spam-count">
            <strong>{ads.length}</strong>{' '}
            {ads.length === 1 ? 'advertisement is' : 'advertisements are'} currently
            on your desktop.
          </p>
          <p className="spam-hint">
            Close them individually, press Escape, or give up and use the button.
          </p>

          <div className="spam-actions">
            <button
              type="button"
              className="xp-button xp-button--default"
              disabled={!ads.length}
              onClick={() => popups.closeAll()}
            >
              Remove All
            </button>
            <button
              type="button"
              className="xp-button"
              onClick={() => popups.infect()}
            >
              More Offers
            </button>
            <button
              type="button"
              className="xp-button"
              onClick={() => {
                popups.closeAll()
                wm.close(windowId)
              }}
            >
              Uninstall
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
