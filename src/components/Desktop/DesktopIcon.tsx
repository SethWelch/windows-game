import { useState } from 'react'
import type { PointerEvent as ReactPointerEvent } from 'react'
import { Icon } from '@/icons/Icon.tsx'
import { CELL_H, CELL_W, cellToPx } from '@/os/desktop.ts'
import { WALK_MS } from '@/os/buddy.ts'
import type { FsNode } from '@/os/fs.ts'
import { hasShortcutBadge, iconIdFor } from '@/os/shell.ts'
import './DesktopIcon.css'

interface Cell {
  col: number
  row: number
}

/**
 * One desktop icon. Presentational apart from its own rename box: the pointer
 * gesture lives in Desktop.tsx, because dragging a selection has to move every
 * icon in it and only the desktop knows what's selected.
 */
export function DesktopIcon({
  node,
  cell,
  carriedTo,
  selected,
  cut,
  editing,
  registerEl,
  onPointerDown,
  onOpen,
  onContextMenu,
  onCommitName,
  onCancelName,
  onDelete,
}: {
  node: FsNode
  cell: Cell
  /**
   * Somewhere other than its cell to sit, in desktop pixels — Bongo's hand, when he has
   * picked it up. It transitions there over the same duration as his walk, so the two
   * glide in step without either of them driving animation frames.
   */
  carriedTo?: { x: number; y: number } | null
  selected: boolean
  cut: boolean
  editing: boolean
  /** Hands the element to Desktop, which writes transforms during a drag. */
  registerEl: (el: HTMLDivElement | null) => void
  onPointerDown: (e: ReactPointerEvent<HTMLDivElement>) => void
  onOpen: () => void
  onContextMenu: (e: React.MouseEvent) => void
  onCommitName: (label: string) => void
  onCancelName: () => void
  onDelete: () => void
}) {
  const [draft, setDraft] = useState(node.name)
  const home = cellToPx(cell.col, cell.row)
  const at = carriedTo ?? home

  return (
    <div
      ref={registerEl}
      className="xp-desktop-icon"
      data-selected={selected}
      data-cut={cut}
      // Makes this icon a drop target for os/dnd.ts's hit-test.
      data-drop-node={node.id}
      style={{
        transform: `translate(${at.x}px, ${at.y}px)`,
        width: CELL_W,
        height: CELL_H,
        // Only while carried: the icon layer sits under the windows, and an icon being
        // marched about needs to be visible over him. The taskbar is 10.
        ...(carriedTo
          ? { transition: `transform ${WALK_MS}ms ease-in-out`, zIndex: 8 }
          : null),
      }}
      tabIndex={0}
      onPointerDown={onPointerDown}
      onDoubleClick={() => !editing && onOpen()}
      onContextMenu={onContextMenu}
      onKeyDown={(e) => {
        if (editing) return
        if (e.key === 'Enter') onOpen()
        if (e.key === 'F2' && !node.system) setDraft(node.name)
        if (e.key === 'Delete') onDelete()
      }}
    >
      <span className="xp-desktop-icon-art">
        <Icon id={iconIdFor(node)} size={32} />
        {hasShortcutBadge(node) && (
          <Icon id="shortcut" size={32} className="xp-shortcut-badge" />
        )}
      </span>

      {editing ? (
        <input
          className="xp-desktop-icon-edit"
          value={draft}
          autoFocus
          onChange={(e) => setDraft(e.target.value)}
          onFocus={(e) => e.currentTarget.select()}
          onPointerDown={(e) => e.stopPropagation()}
          onBlur={() => onCommitName(draft)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') onCommitName(draft)
            if (e.key === 'Escape') {
              setDraft(node.name)
              onCancelName()
            }
          }}
        />
      ) : (
        <span className="xp-desktop-icon-label">{node.name}</span>
      )}
    </div>
  )
}
