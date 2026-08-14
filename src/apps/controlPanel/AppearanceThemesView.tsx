import { AppearanceIcon } from '@/icons/ControlPanelIcons.tsx'
import { Icon } from '@/icons/Icon.tsx'
import { wm } from '@/os/windowStore.ts'
import './ControlPanelView.css'

/**
 * The Appearance and Themes category page.
 *
 * XP's categories did not open an applet — they opened a page of *tasks*, each a sentence
 * describing what you wanted rather than the applet that happened to do it, with the
 * applets themselves listed underneath for anyone who already knew where to go. That
 * split is the whole idea of Category view, so it is worth reproducing rather than
 * shortcutting straight to Display Properties.
 *
 * Every task here works, and each one lands on the right tab.
 */

/** Which tab of Display Properties each task wants. Must match its `Tab` union. */
const TASKS: { label: string; tab: string }[] = [
  { label: "Change the computer's theme", tab: 'themes' },
  { label: 'Change the desktop background', tab: 'desktop' },
  { label: 'Choose a screen saver', tab: 'screensaver' },
  { label: 'Change the screen resolution', tab: 'settings' },
]

export function AppearanceThemesView() {
  /**
   * The tab is honoured when the applet opens. Display Properties is a singleton, so if
   * it is already up this focuses it where it stands — which is what the real one did
   * too, rather than yanking you to a different page of a window you were already using.
   */
  const open = (tab: string) => wm.openApp('displayProperties', { tab })

  return (
    <div className="cp cp--page">
      <h1 className="cp-heading">Appearance and Themes</h1>

      <section className="cp-section">
        <h2 className="cp-section-heading">Pick a task...</h2>
        <ul className="cp-tasks">
          {TASKS.map(({ label, tab }) => (
            <li key={tab}>
              <button type="button" className="cp-task" onClick={() => open(tab)}>
                {label}
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section className="cp-section">
        <h2 className="cp-section-heading">or pick a Control Panel icon</h2>
        <div className="cp-applets">
          <button type="button" className="cp-applet" onClick={() => open('appearance')}>
            <span className="cp-applet-art">
              <Icon id="display" size={32} />
            </span>
            <span>Display</span>
          </button>
        </div>
      </section>

      {/* The category's own artwork, sat in the corner the way these pages had it. */}
      <span className="cp-watermark" aria-hidden>
        <AppearanceIcon />
      </span>
    </div>
  )
}
