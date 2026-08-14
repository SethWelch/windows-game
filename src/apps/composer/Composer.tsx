import { useEffect, useRef, useState } from 'react'
import type { CSSProperties, PointerEvent as ReactPointerEvent } from 'react'
import { draftDocument, titleIn } from '@/apps/netscape/sites.ts'
import { Dialog } from '@/components/ui/Dialog.tsx'
import { MenuBar } from '@/components/ui/MenuBar.tsx'
import { composer, useComposer } from '@/os/composer.ts'
import { clamp } from '@/os/constants.ts'
import type { AppProps } from '@/os/types.ts'
import { useWindows } from '@/os/useWM.ts'
import { wm } from '@/os/windowStore.ts'
import { buildComposerMenus } from './composerMenus.ts'
import type { ViewMode } from './composerMenus.ts'
import { Preview } from './Preview.tsx'
import './Composer.css'

/**
 * Netscape Composer — the HTML editor that shipped inside Communicator, and the one
 * item in Navigator's Communicator menu that was greyed out until now.
 *
 * Two departures from the real thing, both deliberate. Composer was WYSIWYG: you typed
 * into the rendered page and it wrote the tags for you, with the markup hidden behind
 * a separate HTML Source view. This edits the source directly and renders alongside,
 * because seeing the tag and its effect at the same time is the point of asking for it.
 * And Composer had no notion of a style sheet at all — CSS was a year away from being
 * usable — so the Style Sheet tab is ours.
 *
 * The rendering, though, is Navigator's: `draftDocument` builds the preview through the
 * same user-agent stylesheet the browser gives a real page, so a draft cannot look one
 * way here and another way when the browser opens it.
 */

/** What the caption says before the draft declares a `<title>` of its own. */
const UNTITLED = 'Untitled'

/** Narrowest either pane may be squeezed, as a fraction of the split. */
const MIN_RATIO = 0.15

/** Which of the two source panes is on top. */
type SourceTab = 'html' | 'css'

const TAB_LABEL: Record<SourceTab, string> = {
  html: 'HTML',
  css: 'Style Sheet',
}

export function Composer({ windowId }: AppProps) {
  const draft = useComposer()
  const [view, setView] = useState<ViewMode>('split')
  const [tab, setTab] = useState<SourceTab>('html')
  const [about, setAbout] = useState(false)
  /** Where the divider sits, committed on release rather than during the drag. */
  const [ratio, setRatio] = useState(0.5)

  const bodyRef = useRef<HTMLDivElement>(null)

  /**
   * Whether the preview is in its own window.
   *
   * Derived from the window list rather than stored, because the window's existence
   * *is* the popped-out state — a flag would go stale the moment you closed that window
   * with its own close button, and there is nowhere to notice that happening.
   */
  const windows = useWindows()
  const previewWindow = windows.find((w) => w.appId === 'composerPreview')
  const poppedOut = !!previewWindow

  const title = titleIn(draft.html) ?? UNTITLED
  /** With the preview elsewhere, this window has only source to show. */
  const effective: ViewMode = poppedOut ? 'source' : view

  useEffect(() => {
    wm.setTitle(windowId, `${title} - Netscape Composer`)
  }, [windowId, title])

  const actions = {
    newDoc: () => composer.reset(),
    setView,
    popOut: () => wm.openApp('composerPreview'),
    bringBack: () => {
      if (previewWindow) wm.close(previewWindow.id)
    },
    about: () => setAbout(true),
    close: () => wm.close(windowId),
  }

  /**
   * Drags the divider.
   *
   * Document listeners and a direct style write rather than state per move, which is
   * the house gesture pattern — but here it also fixes a real bug: an `<iframe>` eats
   * the pointer events over it, so a `pointermove` bound to the preview pane would stop
   * firing the moment the divider crossed under the cursor. `data-dragging` takes the
   * frame out of the hit-testing for the duration, which is the other half of the fix.
   */
  const onDividerDown = (e: ReactPointerEvent) => {
    e.preventDefault()
    const body = bodyRef.current
    if (!body) return
    const box = body.getBoundingClientRect()
    let latest = ratio
    body.dataset.dragging = 'true'

    const onMove = (ev: PointerEvent) => {
      latest = clamp((ev.clientX - box.left) / box.width, MIN_RATIO, 1 - MIN_RATIO)
      body.style.setProperty('--comp-ratio', String(latest))
    }
    const onUp = () => {
      document.removeEventListener('pointermove', onMove)
      document.removeEventListener('pointerup', onUp)
      delete body.dataset.dragging
      // Commit what the DOM already shows, so the re-render is a no-op visually.
      setRatio(latest)
    }
    document.addEventListener('pointermove', onMove)
    document.addEventListener('pointerup', onUp)
  }

  const source = tab === 'html' ? draft.html : draft.css
  const setSource = tab === 'html' ? composer.setHtml : composer.setCss

  return (
    <div className="comp">
      <MenuBar menus={buildComposerMenus(actions, { view, poppedOut })} />

      <div className="comp-toolbar">
        <div className="comp-views" role="group" aria-label="View">
          {(['split', 'source', 'preview'] as ViewMode[]).map((mode) => (
            <button
              key={mode}
              type="button"
              className="comp-viewbtn"
              aria-pressed={effective === mode}
              // With the preview popped out there is only one layout available, so
              // these describe a choice that no longer exists.
              disabled={poppedOut}
              onClick={() => setView(mode)}
            >
              {mode === 'split' ? 'Split' : mode === 'source' ? 'Source' : 'Preview'}
            </button>
          ))}
        </div>
        <span className="comp-toolbar-spacer" />
        <button
          type="button"
          className="comp-viewbtn"
          onClick={poppedOut ? actions.bringBack : actions.popOut}
        >
          {poppedOut ? 'Bring Preview Back' : 'Pop Out Preview'}
        </button>
      </div>

      <div
        className="xp-window-content comp-body"
        ref={bodyRef}
        data-view={effective}
        // A custom property, which `CSSProperties` has no shape for; the cast is what
        // every other stylesheet-driven value in the project does.
        style={{ '--comp-ratio': ratio } as CSSProperties}
      >
        <div className="comp-source">
          <div className="comp-tabs" role="tablist">
            {(['html', 'css'] as SourceTab[]).map((id) => (
              <button
                key={id}
                type="button"
                role="tab"
                className="comp-tab"
                aria-selected={tab === id}
                onClick={() => setTab(id)}
              >
                {TAB_LABEL[id]}
              </button>
            ))}
          </div>
          {/* One textarea reused across both tabs rather than two hidden ones, so the
              undo stack cannot be the wrong document's. Keyed so switching tabs starts
              a fresh one instead of letting Ctrl+Z walk into the other language. */}
          <textarea
            key={tab}
            className="comp-edit"
            value={source}
            spellCheck={false}
            wrap="off"
            aria-label={`${TAB_LABEL[tab]} source`}
            onChange={(e) => setSource(e.target.value)}
          />
        </div>

        {/* Not rendered while the preview has a window of its own — the pane would be
            a second frame rendering the identical document, invisible for as long as
            that window stays open. Merely switching to Source keeps it mounted, on the
            other hand, so toggling back is instant and holds its scroll position. */}
        {!poppedOut && (
          <>
            {/* `aria-hidden` because the divider is a convenience, not content: the
                same layouts are reachable from the View menu, which is where a screen
                reader user would find them. */}
            <div className="comp-divider" onPointerDown={onDividerDown} aria-hidden />
            <div className="comp-preview">
              <Preview doc={draftDocument(draft.html, draft.css, title)} label={title} />
            </div>
          </>
        )}
      </div>

      <div className="xp-statusbar">
        <span className="xp-statusbar-cell comp-status-doc">{title}</span>
        <span className="xp-statusbar-cell">
          HTML: {draft.html.length} characters
        </span>
        <span className="xp-statusbar-cell">Style Sheet: {draft.css.length} characters</span>
      </div>

      {about && (
        <Dialog title="About Composer" onClose={() => setAbout(false)}>
          <div className="comp-about">
            <strong>Netscape Composer 4.08</strong>
            <br />
            Part of Netscape Communicator
            <br />
            <br />
            The preview is rendered with Navigator's own defaults, so a page that looks
            right here looks the same when the browser opens it.
          </div>
          <div className="xp-dialog-buttons">
            <button
              type="button"
              className="xp-button xp-button--default"
              onClick={() => setAbout(false)}
            >
              OK
            </button>
          </div>
        </Dialog>
      )}
    </div>
  )
}
