import { useState } from 'react'
import type { RefObject } from 'react'
import { useOutsideClick } from '@/hooks/useOutsideClick.ts'
import { ContextMenu } from '@/components/ui/ContextMenu.tsx'
import type { MenuNode } from '@/components/ui/menu.types.ts'
import { Icon } from '@/icons/Icon.tsx'
import { UserAvatar } from '@/icons/UserAvatar.tsx'
import type { IconId } from '@/icons/registry.ts'
import { CONTROL_PANEL_ID, DOCS_ID, ROOT_ID } from '@/os/fs.ts'
import { PROGRAM_TREE, getApp } from '@/os/registry.ts'
import { usePinnedIds } from '@/os/startMenu.ts'
import type { AppDefinition } from '@/os/types.ts'
import { shutdown } from '@/os/shutdown.ts'
import { wm } from '@/os/windowStore.ts'
import { ProgramsMenu } from './ProgramsMenu.tsx'
import { programContextMenu } from './startMenuMenus.ts'
import './StartMenu.css'

/** Right-column shortcuts, opening real locations in the tree. */
/**
 * The right-hand column, in XP's order and grouping.
 *
 * Entries with neither `nodeId` nor `appId` are not wired to anything yet — they are here
 * so the menu reads as a Start menu rather than as three bookmarks, and they close the
 * menu on click rather than pretending to do something. They are deliberately *not*
 * greyed: greying is how this project marks something that cannot work, and these are
 * things that will.
 *
 * Recycle Bin is ours rather than XP's — the real one never had it here. It stays because
 * it works and it is useful.
 */
type Place =
  | { kind: 'separator' }
  | {
      label: string
      iconId: IconId
      nodeId?: string
      appId?: string
      /** Draws the green arrow, for the ones that opened a submenu. */
      submenu?: boolean
    }

/**
 * The second group in the left column: XP's "most frequently used programs".
 *
 * The real one tracked launches and reordered itself, which is why the list below is a
 * fixed order for now — nothing counts anything yet. It is still every bit as live as the
 * pinned group above it, because these are real apps; the only thing missing is the
 * *frequency*.
 *
 * Anything already pinned is filtered out, so the two groups never show the same program
 * twice, and pinning something simply promotes it out of here.
 */
const FREQUENT = [
  'paint',
  'wordpad',
  'calculator',
  'minesweeper',
  'solitaire',
  'mediaPlayer',
  'cmd',
  'soundRecorder',
]

/** How many of them XP showed. */
const FREQUENT_SHOWN = 6

const PLACES: Place[] = [
  { label: 'My Documents', iconId: 'folder', nodeId: DOCS_ID },
  { label: 'My Pictures', iconId: 'myPictures' },
  { label: 'My Music', iconId: 'myMusic', submenu: true },
  { label: 'My Computer', iconId: 'myComputer', nodeId: ROOT_ID },
  { label: 'Recycle Bin', iconId: 'recycleBin', appId: 'recycleBin' },
  { label: 'My Recent Documents', iconId: 'recent', submenu: true },
  { kind: 'separator' },
  { label: 'Control Panel', iconId: 'controlPanel', nodeId: CONTROL_PANEL_ID },
  { label: 'Printers and Faxes', iconId: 'printers' },
  { kind: 'separator' },
  { label: 'Search', iconId: 'searchPlace', submenu: true },
  { label: 'Help and Support', iconId: 'help' },
  { label: 'Run...', iconId: 'run' },
]

export function StartMenu({
  panelRef,
  startButtonRef,
}: {
  panelRef: RefObject<HTMLDivElement | null>
  startButtonRef: RefObject<HTMLButtonElement | null>
}) {
  const [flyoutOpen, setFlyoutOpen] = useState(false)
  const [menu, setMenu] = useState<{ x: number; y: number; items: MenuNode[] } | null>(
    null,
  )
  const pinnedIds = usePinnedIds()

  useOutsideClick([panelRef, startButtonRef], () => wm.setStartMenu(false))

  const launch = (appId: string) => {
    wm.openApp(appId)
    setFlyoutOpen(false)
  }

  const pinned = pinnedIds
    .map((id) => getApp(id))
    .filter((app): app is AppDefinition => !!app)

  // Whatever isn't pinned, up to the six XP showed. Pinning something removes it from
  // here rather than listing it twice.
  const frequent = FREQUENT.filter((id) => !pinnedIds.includes(id))
    .map((id) => getApp(id))
    .filter((app): app is AppDefinition => !!app)
    .slice(0, FREQUENT_SHOWN)

  /**
   * The context menu renders inside the panel, so the Start menu's own
   * outside-click check counts it as inside and the panel stays put underneath.
   */
  const openMenu = (e: React.MouseEvent, app: AppDefinition) => {
    e.preventDefault()
    e.stopPropagation()
    setMenu({
      x: e.clientX,
      y: e.clientY,
      items: programContextMenu(app, {
        onOpen: () => {
          setMenu(null)
          launch(app.id)
        },
        // Send To acts somewhere else, so get out of the way and let them see it.
        onDone: () => {
          setMenu(null)
          setFlyoutOpen(false)
          wm.setStartMenu(false)
        },
        // Pinning changes this menu, so stay open — that's where the result is.
        onPinChange: () => setMenu(null),
      }),
    })
  }

  /** A pinned program. All Programs draws its own rows — see ProgramsMenu.tsx. */
  const programItem = (app: AppDefinition, size: number) => (
    <button
      key={app.id}
      type="button"
      className="xp-sm-item"
      onClick={() => launch(app.id)}
      onContextMenu={(e) => openMenu(e, app)}
    >
      <span className="xp-sm-item-icon">
        <Icon id={app.iconId} size={size} />
      </span>
      {app.label}
    </button>
  )

  return (
    <div
      className="xp-start-menu"
      ref={panelRef}
      // The desktop closes the Start menu on pointerdown; if that reached here,
      // the panel would unmount before any item's click could fire.
      onPointerDown={(e) => e.stopPropagation()}
    >
      <div className="xp-sm-header">
        <UserAvatar size={42} />
        <span>Owner</span>
      </div>

      <div className="xp-sm-body">
        <div className="xp-sm-left">
          {pinned.map((app) => programItem(app, 24))}

          {frequent.length > 0 && <div className="xp-sm-sep" />}
          {frequent.map((app) => programItem(app, 24))}

          <div className="xp-sm-sep xp-sm-sep--push" />

          <button
            type="button"
            className="xp-sm-item xp-sm-allprograms"
            onClick={() => setFlyoutOpen((v) => !v)}
            onPointerEnter={() => setFlyoutOpen(true)}
          >
            <span className="xp-sm-item-icon">
              <Icon id="myComputer" size={20} />
            </span>
            All Programs
            <span className="xp-sm-chevron">▶</span>
          </button>
        </div>

        <div className="xp-sm-right">
          {PLACES.map((p, i) =>
            'kind' in p ? (
              <div key={`sep-${i}`} className="xp-sm-sep xp-sm-sep--right" />
            ) : (
              <button
                key={p.label}
                type="button"
                className="xp-sm-item"
                onClick={() => {
                  if (p.nodeId) wm.openApp('explorer', { nodeId: p.nodeId })
                  else if (p.appId) wm.openApp(p.appId)
                  wm.setStartMenu(false)
                }}
              >
                <span className="xp-sm-item-icon">
                  <Icon id={p.iconId} size={20} />
                </span>
                {p.label}
                {p.submenu && <span className="xp-sm-chevron">▶</span>}
              </button>
            ),
          )}
        </div>
      </div>

      <div className="xp-sm-footer">
        <button type="button" onClick={() => wm.setStartMenu(false)}>
          <span className="xp-sm-glyph xp-sm-glyph--logoff">↩</span>
          Log Off
        </button>
        <button
          type="button"
          onClick={() => {
            wm.setStartMenu(false)
            shutdown.open()
          }}
        >
          <span className="xp-sm-glyph xp-sm-glyph--shutdown">⏻</span>
          Turn Off Computer
        </button>
      </div>

      {flyoutOpen && (
        <ProgramsMenu
          folder={PROGRAM_TREE}
          onLaunch={launch}
          onAppContextMenu={(e, app) => openMenu(e, app)}
        />
      )}

      {menu && (
        <ContextMenu
          x={menu.x}
          y={menu.y}
          items={menu.items}
          onDismiss={() => setMenu(null)}
        />
      )}
    </div>
  )
}
