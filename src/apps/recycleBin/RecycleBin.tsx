import { useState } from 'react'
import { ContextMenu } from '@/components/ui/ContextMenu.tsx'
import { MenuBar } from '@/components/ui/MenuBar.tsx'
import { MessageBox } from '@/components/ui/MessageBox.tsx'
import type { Menu, MenuNode } from '@/components/ui/menu.types.ts'
import { Icon } from '@/icons/Icon.tsx'
import type { IconId } from '@/icons/registry.ts'
import { audio } from '@/os/audio.ts'
import { boot } from '@/os/boot.ts'
import { discard, useDiscarded } from '@/os/discard.ts'
import {
  MY_COMPUTER_ID,
  RECYCLE_ID,
  fs,
  getChildren,
  getNode,
  sizeOf,
  typeLabel,
  useFsVersion,
} from '@/os/fs.ts'
import type { FsNode } from '@/os/fs.ts'
import { getApp } from '@/os/registry.ts'
import { iconIdFor } from '@/os/shell.ts'
import type { AppProps } from '@/os/types.ts'
import { wm } from '@/os/windowStore.ts'
import './RecycleBin.css'

/** Where the item came from, as a path the user recognises. */
function originOf(node: FsNode): string {
  const home = node.restore?.parentId
  const parent = home ? getNode(home) : undefined
  if (!parent) return 'Unknown'
  // The chain, minus My Computer, which nobody thinks of as part of a path.
  const names: string[] = []
  let cur: FsNode | undefined = parent
  while (cur && cur.parentId) {
    names.unshift(cur.name)
    cur = getNode(cur.parentId)
  }
  return names.length ? `C:\\${names.join('\\')}` : 'C:\\'
}

const stamp = (at?: number) =>
  at
    ? new Date(at).toLocaleString([], {
        month: 'numeric',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      })
    : ''

/** The bin shows sizes in whole kilobytes, and nothing at all for a folder. */
const sizeLabel = (node: FsNode) =>
  node.kind === 'folder' ? '' : `${Math.ceil(sizeOf(node) / 1024) || 1} KB`

/**
 * One row of the bin, whichever store it came out of.
 *
 * The bin holds shell objects rather than only files — a program can throw its own
 * things in here (see os/discard.ts), and once they're listed they have to restore
 * and delete like everything else.
 */
interface Row {
  id: string
  from: 'fs' | 'program'
  iconId: IconId
  name: string
  origin: string
  at?: number
  type: string
  size: string
}

export function RecycleBin({ windowId }: AppProps) {
  useFsVersion()
  const discarded = useDiscarded()
  const [selected, setSelected] = useState<string | null>(null)
  const [confirm, setConfirm] = useState<'empty' | 'delete' | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [menu, setMenu] = useState<{ x: number; y: number; items: MenuNode[] } | null>(
    null,
  )

  const rows: Row[] = [
    ...getChildren(RECYCLE_ID).map(
      (node): Row => ({
        id: node.id,
        from: 'fs',
        iconId: iconIdFor(node),
        name: node.name,
        origin: originOf(node),
        at: node.restore?.at,
        type: typeLabel(node),
        size: sizeLabel(node),
      }),
    ),
    ...discarded.map(
      (item): Row => ({
        id: item.id,
        from: 'program',
        iconId: item.iconId,
        name: item.label,
        origin: item.origin,
        at: item.at,
        type: item.kind,
        size: '',
      }),
    ),
  ]

  const selectedRow = rows.find((r) => r.id === selected) ?? null

  /** `quiet` is for Restore all, which would otherwise stack a dialog per failure. */
  const restore = (row: Row, quiet = false) => {
    if (row.from === 'fs') {
      fs.restore(row.id)
      setSelected(null)
      return
    }

    const result = discard.restore(row.id)
    if (result === 'restored') {
      setSelected(null)
      return
    }
    if (quiet) return

    const owner = getApp(discarded.find((d) => d.id === row.id)?.appId ?? '')
    const program = owner?.label ?? 'The program'
    setError(
      result === 'no-owner'
        ? `Cannot restore '${row.name}'.\n\n${program} is not running. Start it and try again.`
        : `Cannot restore '${row.name}'.\n\n${program} would not take it back — it belongs to a session that has moved on.`,
    )
  }

  const destroy = (row: Row) => {
    if (row.from === 'fs') fs.remove(row.id)
    else discard.remove(row.id)
  }

  const itemMenu = (row: Row): MenuNode[] => [
    { id: 'restore', label: '&Restore', onSelect: () => restore(row) },
    { kind: 'separator' },
    { id: 'cut', label: 'Cu&t', disabled: true },
    { kind: 'separator' },
    {
      id: 'delete',
      label: '&Delete',
      onSelect: () => {
        setSelected(row.id)
        setConfirm('delete')
      },
    },
    { kind: 'separator' },
    { id: 'properties', label: 'P&roperties', disabled: true },
  ]

  const menus: Menu[] = [
    {
      id: 'file',
      label: '&File',
      items: [
        {
          id: 'restore',
          label: '&Restore',
          disabled: !selectedRow,
          onSelect: () => selectedRow && restore(selectedRow),
        },
        {
          id: 'delete',
          label: '&Delete',
          disabled: !selectedRow,
          onSelect: () => setConfirm('delete'),
        },
        { kind: 'separator' },
        {
          id: 'empty',
          label: '&Empty Recycle Bin',
          disabled: !rows.length,
          onSelect: () => setConfirm('empty'),
        },
        { kind: 'separator' },
        { id: 'close', label: '&Close', onSelect: () => wm.close(windowId) },
      ],
    },
    {
      id: 'edit',
      label: '&Edit',
      items: [{ id: 'selectall', label: 'Select &All', disabled: true }],
    },
    {
      id: 'view',
      label: '&View',
      items: [{ id: 'details', label: '&Details', checked: true }],
    },
    {
      id: 'help',
      label: '&Help',
      items: [{ id: 'about', label: '&About Windows', disabled: true }],
    },
  ]

  return (
    <div className="xp-recyclebin">
      <MenuBar menus={menus} />

      <div className="xp-window-content">
        <div className="xp-rb-panes">
          {/* XP's blue task pane, with the two things you ever did in here. */}
          <div className="xp-rb-tasks">
            <div className="xp-rb-tasks-head">Recycle Bin Tasks</div>
            <div className="xp-rb-tasks-body">
              <button
                type="button"
                className="xp-rb-task"
                disabled={!rows.length}
                onClick={() => setConfirm('empty')}
              >
                Empty the Recycle Bin
              </button>
              <button
                type="button"
                className="xp-rb-task"
                disabled={!selectedRow}
                onClick={() => selectedRow && restore(selectedRow)}
              >
                Restore this item
              </button>
              <button
                type="button"
                className="xp-rb-task"
                disabled={!rows.length}
                onClick={() => {
                  // A copy, because each restore removes the item it took.
                  for (const row of [...rows]) restore(row, true)
                  setSelected(null)
                }}
              >
                Restore all items
              </button>
            </div>
          </div>

          <div
            className="xp-rb-view"
            onPointerDown={(e) => {
              if (e.target === e.currentTarget) setSelected(null)
            }}
          >
            {rows.length === 0 ? (
              <div className="xp-rb-empty">
                <p>The Recycle Bin is empty.</p>
                <p className="xp-rb-hint">
                  Delete something from the desktop or a folder — or drag it onto
                  the Recycle Bin — and it will wait here until you empty it.
                </p>
              </div>
            ) : (
              <table className="xp-rb-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Original Location</th>
                    <th>Date Deleted</th>
                    <th>Type</th>
                    <th>Size</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr
                      key={row.id}
                      data-selected={selected === row.id}
                      onPointerDown={() => setSelected(row.id)}
                      onDoubleClick={() => restore(row)}
                      onContextMenu={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        setSelected(row.id)
                        setMenu({ x: e.clientX, y: e.clientY, items: itemMenu(row) })
                      }}
                    >
                      <td>
                        <span className="xp-rb-name">
                          <Icon id={row.iconId} size={16} />
                          {row.name}
                        </span>
                      </td>
                      <td>{row.origin}</td>
                      <td>{stamp(row.at)}</td>
                      <td>{row.type}</td>
                      <td className="xp-rb-size">{row.size}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      <div className="xp-statusbar">
        <span className="xp-statusbar-cell">
          {rows.length} object{rows.length === 1 ? '' : 's'}
        </span>
        <span className="xp-statusbar-cell">Recycle Bin</span>
      </div>

      {menu && (
        <ContextMenu
          x={menu.x}
          y={menu.y}
          items={menu.items}
          onDismiss={() => setMenu(null)}
        />
      )}

      {error && (
        <MessageBox
          title="Recycle Bin"
          message={error}
          buttons={[{ label: 'OK', primary: true, onClick: () => setError(null) }]}
          onClose={() => setError(null)}
        />
      )}

      {confirm && (
        <MessageBox
          title={confirm === 'empty' ? 'Confirm Multiple File Delete' : 'Confirm File Delete'}
          message={
            confirm === 'empty'
              ? `Are you sure you want to delete these ${rows.length} item${
                  rows.length === 1 ? '' : 's'
                }?\n\nThis cannot be undone.`
              : `Are you sure you want to delete '${selectedRow?.name ?? ''}'?\n\nThis cannot be undone.`
          }
          buttons={[
            {
              label: 'Yes',
              primary: true,
              onClick: () => {
                audio.play('recycle')
                if (confirm === 'empty') {
                  // Emptying purges regardless of `system`, so My Computer really
                  // does go — and the shell goes with it.
                  const fatal = getChildren(RECYCLE_ID).some(
                    (n) => n.id === MY_COMPUTER_ID,
                  )
                  fs.emptyRecycleBin()
                  discard.clear()
                  if (fatal) boot.crash()
                } else if (selectedRow) {
                  destroy(selectedRow)
                }
                setSelected(null)
                setConfirm(null)
              },
            },
            { label: 'No', onClick: () => setConfirm(null) },
          ]}
          onClose={() => setConfirm(null)}
        />
      )}
    </div>
  )
}
