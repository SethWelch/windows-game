import { useState } from 'react'
import type { MouseEvent as ReactMouseEvent } from 'react'
import { Icon } from '@/icons/Icon.tsx'
import type { ProgramFolder } from '@/os/registry.ts'
import type { AppDefinition } from '@/os/types.ts'

/**
 * One panel of All Programs, and — through itself — every panel below it.
 *
 * Each level keeps its own idea of which of its folders is open, so hovering a
 * sibling closes the one before it and hovering a program closes them all. That is
 * the whole behaviour of a Windows menu, and recursion is the only state it needs.
 */
export function ProgramsMenu({
  folder,
  nested = false,
  onLaunch,
  onAppContextMenu,
}: {
  folder: ProgramFolder
  /** Sub-panels sit beside their row instead of above the Start button. */
  nested?: boolean
  onLaunch: (appId: string) => void
  onAppContextMenu: (e: ReactMouseEvent, app: AppDefinition) => void
}) {
  const [open, setOpen] = useState<string | null>(null)

  return (
    <div className={`xp-sm-flyout${nested ? ' xp-sm-flyout--sub' : ''}`}>
      {folder.folders.map((child) => (
        <div
          key={child.name}
          className="xp-sm-branch"
          onPointerEnter={() => setOpen(child.name)}
        >
          <button type="button" className="xp-sm-item xp-sm-folderrow">
            <span className="xp-sm-item-icon">
              <Icon id="folder" size={16} />
            </span>
            {child.name}
            <span className="xp-sm-chevron xp-sm-chevron--plain">▶</span>
          </button>

          {open === child.name && (
            <ProgramsMenu
              folder={child}
              nested
              onLaunch={onLaunch}
              onAppContextMenu={onAppContextMenu}
            />
          )}
        </div>
      ))}

      {folder.apps.map((app) => (
        <button
          key={app.id}
          type="button"
          className="xp-sm-item"
          onPointerEnter={() => setOpen(null)}
          onClick={() => onLaunch(app.id)}
          onContextMenu={(e) => onAppContextMenu(e, app)}
        >
          <span className="xp-sm-item-icon">
            <Icon id={app.iconId} size={16} />
          </span>
          {app.label}
        </button>
      ))}
    </div>
  )
}
