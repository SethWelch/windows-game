import type { ReactNode } from 'react'
import { getNode } from '@/os/fs.ts'
import type { DisplaySettings } from '@/os/display.ts'
import { wallpaperLook } from '@/os/wallpaper.ts'

/**
 * The little monitor at the top of every tab.
 *
 * It costs nothing to be honest here: the inner screen uses the same background
 * builder the real desktop does, and the sample window's titlebar is painted from the
 * live tokens — so it follows the colour scheme without knowing anything about which
 * scheme is on. XP's preview was a static bitmap per scheme and got this wrong often
 * enough that people noticed.
 *
 * `children` replaces the sample window entirely, which is how the Screen Saver tab shows
 * a live miniature of the saver you have picked.
 *
 * The settings come in as a prop rather than out of the store, because what this shows is
 * the *draft* — the whole point of a monitor above an Apply button is to see a change
 * before it happens.
 */
export function DesktopPreview({
  settings,
  children,
}: {
  settings: DisplaySettings
  children?: ReactNode
}) {
  const node = settings.wallpaper.kind === 'file' ? getNode(settings.wallpaper.nodeId) : undefined
  const look = wallpaperLook(settings, node)

  return (
    <div className="dp-monitor" aria-hidden>
      <div className={`dp-screen ${look.className}`.trim()} style={look.style}>
        {/* A screen saver replaces the sample window rather than sitting over it: the
            monitor is showing what the screen would show, and the screen would not have
            a window on it. */}
        {children ?? (
          <>
        <div className="dp-mini">
          <div className="dp-mini-bar">
            <span>Active Window</span>
            <i />
          </div>
          <div className="dp-mini-menu">
            <span>File</span>
            <span>Edit</span>
            <span>View</span>
          </div>
          <div className="dp-mini-body">
            <span className="dp-mini-text" />
            <span className="dp-mini-text dp-mini-text--short" />
            <span className="dp-mini-hi">Window Text</span>
          </div>
        </div>
        <div className="dp-mini-taskbar">
          <span className="dp-mini-start" />
        </div>
          </>
        )}
      </div>
      <div className="dp-stand" />
    </div>
  )
}
