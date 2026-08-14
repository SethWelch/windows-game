import { useId, useState } from 'react'
import {
  COLORS,
  FONT_NAMES,
  SCHEME_NAMES,
  display,
  sameSettings,
  useDisplay,
} from '@/os/display.ts'
import type { DisplaySettings, FontSize, Position, Scheme } from '@/os/display.ts'
import { ROOT_ID, getChildren, useFsVersion } from '@/os/fs.ts'
import type { FsNode } from '@/os/fs.ts'
import { wm } from '@/os/windowStore.ts'
import type { AppProps } from '@/os/types.ts'
import { BUNDLED } from '@/os/wallpaper.ts'
import type { BundledId } from '@/os/wallpaper.ts'
import { SaverCanvas } from '@/components/Screensaver/SaverCanvas.tsx'
import { screensaver } from '@/os/screensaver.ts'
import { SAVERS, SAVER_ORDER, saverName } from '@/screensavers/savers.ts'
import type { SaverId } from '@/screensavers/savers.ts'
import { DesktopPreview } from './DesktopPreview.tsx'
import './DisplayProperties.css'

/**
 * Display Properties. Five tabs, because it had five, and what is on them either
 * works or is honestly inert.
 *
 * Working: the colour scheme (all three of Luna's), the shell font size, and the
 * background — picture, position and colour.
 *
 * Inert on purpose, and greyed rather than faked: Settings reports the real display it is
 * running on and offers no other resolution, because there isn't one to offer. The screen
 * saver's own Settings button is greyed for the same reason — none of the savers have
 * anything to configure.
 *
 * **Everything on these tabs edits a draft, not the desktop.** A property sheet's contract
 * is OK / Cancel / Apply: nothing takes effect until you ask for it, Cancel is free, and
 * Apply greys out when there is nothing pending. This applet used to write to the store on
 * every keystroke and offer a Close button, which meant Cancel was impossible to offer
 * honestly. The consequence to keep in mind when adding a control here: read from `draft`
 * and write with `set`, never `display.set` — one live write and Cancel starts lying.
 */

type Tab = 'themes' | 'desktop' | 'screensaver' | 'appearance' | 'settings'

const TABS: { id: Tab; label: string }[] = [
  { id: 'themes', label: 'Themes' },
  { id: 'desktop', label: 'Desktop' },
  { id: 'screensaver', label: 'Screen Saver' },
  { id: 'appearance', label: 'Appearance' },
  { id: 'settings', label: 'Settings' },
]

/** Every image anywhere in the tree, which is what the Background list offers. */
function imageFiles(): FsNode[] {
  const found: FsNode[] = []
  const walk = (id: string) => {
    for (const node of getChildren(id)) {
      if (node.kind === 'folder') walk(node.id)
      else if (node.kind === 'file' && node.content?.startsWith('data:image/')) {
        found.push(node)
      }
    }
  }
  walk(ROOT_ID)
  return found
}

/** What the Control Panel's task pages ask for when they open this. */
interface DisplayArgs {
  tab?: Tab
}

export function DisplayProperties({ windowId, args }: AppProps) {
  const requested = (args as DisplayArgs | undefined)?.tab
  // Honoured when the window opens, which is the only moment it can be: this applet is a
  // singleton, so a second request focuses the window already on screen rather than
  // dragging it to a different page of something you were in the middle of using.
  const [tab, setTab] = useState<Tab>(
    requested && TABS.some((t) => t.id === requested) ? requested : 'appearance',
  )
  // The Background list is drawn from the filesystem, so it has to redraw when a file
  // arrives — save a picture in Paint and it appears in here without reopening.
  useFsVersion()

  const applied = useDisplay()
  /**
   * The pending copy every tab edits. Seeded once, from whatever was applied when the
   * window opened.
   */
  const [draft, setDraft] = useState<DisplaySettings>(applied)
  const set = (patch: Partial<DisplaySettings>) => setDraft((d) => ({ ...d, ...patch }))

  /**
   * Derived, not tracked. Applying makes `applied` equal `draft`, which greys Apply on the
   * next render without anything having to remember to do it — and if something else in the
   * shell changes the background while this is open (Paint's Set As Background does), Apply
   * lights up again, which is the truth.
   */
  const dirty = !sameSettings(draft, applied)

  const actions = {
    ok: () => {
      if (dirty) display.set(draft)
      wm.close(windowId)
    },
    // Nothing was written, so there is nothing to undo — which is the whole reason the
    // draft exists.
    cancel: () => wm.close(windowId),
    apply: () => display.set(draft),
  }

  return (
    <div className="dp">
      <div className="dp-tabstrip" role="tablist">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            className="dp-tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="dp-page">
        {tab === 'themes' && <ThemesTab draft={draft} set={set} />}
        {tab === 'desktop' && <DesktopTab draft={draft} set={set} />}
        {tab === 'screensaver' && <ScreenSaverTab draft={draft} set={set} />}
        {tab === 'appearance' && <AppearanceTab draft={draft} set={set} />}
        {tab === 'settings' && <SettingsTab draft={draft} />}
      </div>

      {/* OK applies and closes, Cancel closes and discards, Apply applies and stays —
          and greys itself once there is nothing left to apply, as every XP property
          sheet did. OK is the default button. */}
      <div className="dp-buttons">
        <button type="button" className="xp-button dp-default" onClick={actions.ok}>
          OK
        </button>
        <button type="button" className="xp-button" onClick={actions.cancel}>
          Cancel
        </button>
        <button
          type="button"
          className="xp-button"
          disabled={!dirty}
          onClick={actions.apply}
        >
          Apply
        </button>
      </div>
    </div>
  )
}

/** Every tab reads the draft and writes back through `set`. Never `display.set`. */
interface TabProps {
  draft: DisplaySettings
  set: (patch: Partial<DisplaySettings>) => void
}

function ThemesTab({ draft, set }: TabProps) {
  const { scheme } = draft
  return (
    <>
      <p className="dp-blurb">
        A theme is a background plus a set of sounds, icons, and other elements to help
        you personalize your computer with one click.
      </p>
      <label className="dp-field">
        <span>Theme:</span>
        <select
          value={scheme}
          onChange={(e) => set({ scheme: e.target.value as Scheme })}
        >
          {Object.entries(SCHEME_NAMES).map(([id, label]) => (
            <option key={id} value={id}>
              Windows XP — {label}
            </option>
          ))}
        </select>
      </label>
      <DesktopPreview settings={draft} />
      {/* Moved here from the footer, which now holds the three buttons a property sheet is
          supposed to have. Themes is the right home for it: it is the tab about how the
          whole machine looks. Like every other control here it edits the draft, so it
          takes effect on Apply and Cancel still undoes it. */}
      <div className="dp-buttons dp-buttons--inline">
        <button
          type="button"
          className="xp-button"
          onClick={() => set(display.defaults())}
        >
          Restore Defaults
        </button>
      </div>
      <p className="dp-note">
        Save As and Delete are for themes of your own. There aren't any yet.
      </p>
    </>
  )
}

function DesktopTab({ draft, set }: TabProps) {
  const { wallpaper, position, color } = draft
  const images = imageFiles()
  // One key space for both halves of the list: bundled ids can't collide with node ids,
  // which are all prefixed (`sc-`, `f-`, and so on).
  const selected =
    wallpaper.kind === 'file'
      ? wallpaper.nodeId
      : wallpaper.kind === 'bundled'
        ? wallpaper.id
        : 'none'

  return (
    <>
      <DesktopPreview settings={draft} />

      <div className="dp-row">
        <div className="dp-col">
          <span className="dp-label">Background:</span>
          <div className="dp-list" role="listbox" aria-label="Background">
            <button
              type="button"
              role="option"
              aria-selected={selected === 'none'}
              onClick={() => set({ wallpaper: { kind: 'none' } })}
            >
              (None)
            </button>
            {/* The pictures that ship with the machine, then anything in the
                filesystem — which is where a Paint drawing turns up. */}
            {Object.entries(BUNDLED).map(([id, wp]) => (
              <button
                key={id}
                type="button"
                role="option"
                aria-selected={selected === id}
                onClick={() =>
                  set({ wallpaper: { kind: 'bundled', id: id as BundledId } })
                }
              >
                {wp.name}
              </button>
            ))}
            {images.map((node) => (
              <button
                key={node.id}
                type="button"
                role="option"
                aria-selected={selected === node.id}
                onClick={() =>
                  set({ wallpaper: { kind: 'file', nodeId: node.id } })
                }
              >
                {node.name.replace(/\.[^.]+$/, '')}
              </button>
            ))}
          </div>
          {/* Not disabled to be coy — it opens a second property sheet that doesn't
              exist. Greyed is what XP did with anything it couldn't offer. */}
          <button type="button" className="xp-button dp-wide" disabled>
            Customize Desktop...
          </button>
        </div>

        <div className="dp-col dp-col--narrow">
          <label className="dp-field dp-field--stack">
            <span>Position:</span>
            <select
              value={position}
              disabled={wallpaper.kind === 'none'}
              onChange={(e) => set({ position: e.target.value as Position })}
            >
              <option value="stretch">Stretch</option>
              <option value="tile">Tile</option>
              <option value="center">Center</option>
            </select>
          </label>

          <span className="dp-label">Color:</span>
          <div className="dp-swatches">
            {COLORS.map((hex) => (
              <button
                key={hex}
                type="button"
                className="dp-swatch"
                aria-label={hex}
                aria-pressed={color === hex}
                style={{ background: hex }}
                onClick={() => set({ color: hex })}
              />
            ))}
          </div>
        </div>
      </div>
    </>
  )
}

function ScreenSaverTab({ draft, set }: TabProps) {
  const { saver, waitMinutes } = draft
  const chosen = SAVERS[saver]
  const saverId = useId()

  return (
    <>
      {/* The monitor shows the real saver, running, rather than a picture of one — same
          builder, same loop. XP's was a static bitmap per saver.

          174x128 is `.dp-screen` inside its border: 186x140 border-box less the 6px frame.
          Must match DisplayProperties.css. */}
      <DesktopPreview settings={draft}>
        {chosen ? <SaverCanvas saver={saver} width={174} height={128} /> : undefined}
      </DesktopPreview>

      {/* A `div` with an explicit `htmlFor`, not a wrapping `<label>`. A label forwards
          clicks to the control it labels, so with the buttons inside it, pressing Preview
          also opened the dropdown — the two fought each other. A label may only wrap the
          one control it names. */}
      <div className="dp-field">
        <label htmlFor={saverId}>Screen saver:</label>
        <select
          id={saverId}
          value={saver}
          onChange={(e) => set({ saver: e.target.value as SaverId })}
        >
          {SAVER_ORDER.map((id) => (
            <option key={id} value={id}>
              {saverName(id)}
            </option>
          ))}
        </select>
        {/* Settings stays greyed: none of these have anything to configure yet, and a
            dialog with nothing in it would be worse than an honest grey. */}
        <button type="button" className="xp-button" disabled>
          Settings
        </button>
        <button
          type="button"
          className="xp-button"
          disabled={!chosen}
          /* The draft's saver, not the applied one — pressing Preview after picking
             something has to show you the thing you picked. */
          onClick={() => screensaver.start(saver)}
        >
          Preview
        </button>
      </div>

      <label className="dp-field">
        <span>Wait:</span>
        <input
          type="number"
          value={waitMinutes}
          min={1}
          max={99}
          disabled={!chosen}
          onChange={(e) => {
            // Clamped here as well as in the store's loader, because a number input
            // happily reports 0 or an empty string while you are typing in it.
            const n = Number(e.target.value)
            if (Number.isFinite(n)) {
              set({ waitMinutes: Math.min(99, Math.max(1, Math.round(n))) })
            }
          }}
        />
        <span>minutes</span>
      </label>
      <p className="dp-note">
        {chosen
          ? 'Any key, click or movement brings the desktop back.'
          : 'No screen saver selected.'}
      </p>
      <fieldset className="xp-groupbox dp-group">
        <legend>Monitor power</legend>
        <p className="dp-blurb">
          To adjust monitor power settings and save energy, click Power.
        </p>
        <button type="button" className="xp-button" disabled>
          Power...
        </button>
      </fieldset>
    </>
  )
}

function AppearanceTab({ draft, set }: TabProps) {
  const { scheme, fontSize } = draft
  return (
    <>
      <DesktopPreview settings={draft} />
      <label className="dp-field dp-field--stack">
        <span>Windows and buttons:</span>
        {/* Windows Classic is a whole second set of chrome — square corners, grey
            titlebars, the lot — rather than a palette swap, so it isn't offered. */}
        <select defaultValue="xp">
          <option value="xp">Windows XP style</option>
        </select>
      </label>
      <label className="dp-field dp-field--stack">
        <span>Color scheme:</span>
        <select
          value={scheme}
          onChange={(e) => set({ scheme: e.target.value as Scheme })}
        >
          {Object.entries(SCHEME_NAMES).map(([id, label]) => (
            <option key={id} value={id}>
              {label}
            </option>
          ))}
        </select>
      </label>
      <label className="dp-field dp-field--stack">
        <span>Font size:</span>
        <select
          value={fontSize}
          onChange={(e) => set({ fontSize: e.target.value as FontSize })}
        >
          {Object.entries(FONT_NAMES).map(([id, label]) => (
            <option key={id} value={id}>
              {label}
            </option>
          ))}
        </select>
      </label>
      <div className="dp-buttons dp-buttons--inline">
        <button type="button" className="xp-button" disabled>
          Effects...
        </button>
        <button type="button" className="xp-button" disabled>
          Advanced
        </button>
      </div>
    </>
  )
}

function SettingsTab({ draft }: { draft: DisplaySettings }) {
  // The real display, read off the browser the same way the POST reads the machine.
  const width = window.screen.width
  const height = window.screen.height
  const depth = window.screen.colorDepth
  const quality =
    depth >= 32 ? 'Highest (32 bit)' : depth >= 24 ? 'High (24 bit)' : `${depth} bit`

  return (
    <>
      <DesktopPreview settings={draft} />
      <p className="dp-blurb">Drag the monitor icons to match the physical arrangement of your monitors.</p>
      <div className="dp-row">
        <fieldset className="xp-groupbox dp-group dp-col">
          <legend>Screen resolution</legend>
          {/* One notch, at the far end. There is one display and we cannot change it,
              so a slider that moved would be a lie about what happens next. */}
          <input type="range" min={0} max={0} defaultValue={0} disabled />
          <p className="dp-readout">
            {width} by {height} pixels
          </p>
        </fieldset>
        <fieldset className="xp-groupbox dp-group dp-col">
          <legend>Color quality</legend>
          <select defaultValue="native" disabled>
            <option value="native">{quality}</option>
          </select>
        </fieldset>
      </div>
      <p className="dp-note">
        Plug and Play Monitor on the display adapter this browser is running on.
      </p>
    </>
  )
}
