import { DOCS_ID, ROOT_ID, canRecycle } from '@/os/fs.ts'
import type { FsNode, ShortcutTarget } from '@/os/fs.ts'
import { allPrograms } from '@/os/registry.ts'
import type { MenuNode } from './menu.types.ts'

/** Shortcut targets offered by New ▸ Shortcut. */
function shortcutTargets(): { label: string; target: ShortcutTarget }[] {
  return [
    ...allPrograms().map((app) => ({
      label: app.label,
      target: { kind: 'app', appId: app.id } as ShortcutTarget,
    })),
    { label: 'My Computer', target: { kind: 'node', nodeId: ROOT_ID } },
    { label: 'My Documents', target: { kind: 'node', nodeId: DOCS_ID } },
  ]
}

export interface FolderMenuActions {
  onNewFolder: () => void
  onNewFile: () => void
  onNewShortcut: (target: ShortcutTarget, label: string) => void
  onPaste: () => void
  canPaste: boolean
  onRefresh: () => void
  /** Desktop-only extras such as Arrange Icons By. */
  extras?: MenuNode[]
  /**
   * Only the desktop has a Properties sheet to open — Display Properties. Folders in
   * Explorer have none, so leaving this out keeps the item greyed for them.
   */
  onProperties?: () => void
}

/** Right-click on empty space inside a folder (or the desktop). */
export function folderContextMenu(a: FolderMenuActions): MenuNode[] {
  return [
    ...(a.extras ?? []),
    { id: 'refresh', label: 'R&efresh', onSelect: a.onRefresh },
    { kind: 'separator' },
    {
      id: 'paste',
      label: '&Paste',
      disabled: !a.canPaste,
      onSelect: a.onPaste,
    },
    { kind: 'separator' },
    {
      id: 'new',
      label: 'Ne&w',
      submenu: [
        { id: 'new-folder', label: '&Folder', onSelect: a.onNewFolder },
        { kind: 'separator' },
        {
          id: 'new-text',
          label: '&Text Document',
          onSelect: a.onNewFile,
        },
        {
          id: 'new-shortcut',
          label: '&Shortcut',
          submenu: shortcutTargets().map((t) => ({
            id: `sc-${t.label}`,
            label: t.label,
            onSelect: () => a.onNewShortcut(t.target, `Shortcut to ${t.label}`),
          })),
        },
      ],
    },
    { kind: 'separator' },
    {
      id: 'properties',
      label: 'P&roperties',
      disabled: !a.onProperties,
      onSelect: a.onProperties,
    },
  ]
}

export interface ItemMenuActions {
  node: FsNode
  onOpen: () => void
  onRename: () => void
  onDelete: () => void
  onCut: () => void
  onCopy: () => void
  onCreateShortcut: () => void
}

/** Right-click on a folder/file/shortcut. */
export function itemContextMenu(a: ItemMenuActions): MenuNode[] {
  // Seeded shell items (My Computer, Recycle Bin, …) aren't user data.
  const locked = !!a.node.system
  // Delete asks separately, because one seeded item does accept it — see
  // `canRecycle` in os/fs.ts, and what that costs.
  const undeletable = !canRecycle(a.node)
  return [
    { id: 'open', label: '&Open', onSelect: a.onOpen },
    { kind: 'separator' },
    {
      id: 'shortcut',
      label: 'Create &Shortcut',
      onSelect: a.onCreateShortcut,
    },
    { kind: 'separator' },
    { id: 'cut', label: 'Cu&t', disabled: locked, onSelect: a.onCut },
    { id: 'copy', label: '&Copy', disabled: locked, onSelect: a.onCopy },
    { kind: 'separator' },
    { id: 'delete', label: '&Delete', disabled: undeletable, onSelect: a.onDelete },
    { id: 'rename', label: 'Rena&me', disabled: locked, onSelect: a.onRename },
    { kind: 'separator' },
    /* A file's property sheet is a different dialog again, and there isn't one. */
    { id: 'properties', label: 'P&roperties', disabled: true },
  ]
}
