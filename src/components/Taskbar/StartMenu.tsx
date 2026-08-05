import { useState } from 'react'
import type { RefObject } from 'react'
import { useOutsideClick } from '@/hooks/useOutsideClick.ts'
import { ContextMenu } from '@/components/ui/ContextMenu.tsx'
import type { MenuNode } from '@/components/ui/menu.types.ts'
import { Icon } from '@/icons/Icon.tsx'
import { UserAvatar } from '@/icons/UserAvatar.tsx'
import type { IconId } from '@/icons/registry.ts'
import { boot } from '@/os/boot.ts'
import { DOCS_ID, ROOT_ID } from '@/os/fs.ts'
import { PROGRAM_TREE, getApp } from '@/os/registry.ts'
import { usePinnedIds } from '@/os/startMenu.ts'
import type { AppDefinition } from '@/os/types.ts'
import { wm } from '@/os/windowStore.ts'
import { ProgramsMenu } from './ProgramsMenu.tsx'
import { programContextMenu } from './startMenuMenus.ts'
import './StartMenu.css'

/** Right-column shortcuts, opening real locations in the tree. */
const PLACES: { label: string; iconId: IconId; nodeId?: string; appId?: string }[] =
  [
    { label: 'My Documents', iconId: 'folder', nodeId: DOCS_ID },
    { label: 'My Computer', iconId: 'myComputer', nodeId: ROOT_ID },
    { label: 'Recycle Bin', iconId: 'recycleBin', appId: 'recycleBin' },
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

          <div className="xp-sm-sep" />

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
          {PLACES.map((p) => (
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
            </button>
          ))}
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
            boot.turnOff()
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
