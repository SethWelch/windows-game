import { useSyncExternalStore } from 'react'
import type { IconId } from '@/icons/registry.ts'
import { ROOT_ID, resolve } from './fs.ts'
import type { FsNode } from './fs.ts'
import { getApp } from './registry.ts'
import { wm } from './windowStore.ts'

/** Which icon a node shows. Shortcuts borrow their target's icon, as in XP. */
export function iconIdFor(node: FsNode): IconId {
  if (node.kind === 'folder') return node.id === ROOT_ID ? 'myComputer' : 'folder'
  if (node.kind === 'file') return 'textFile'

  const target = resolve(node)
  if (!target) return 'textFile'
  if (target.kind === 'app') return getApp(target.appId)?.iconId ?? 'textFile'
  return iconIdFor(target.node)
}

/**
 * Whether to draw the shortcut arrow badge.
 *
 * The seeded shell items — My Computer, My Documents, Recycle Bin — are modelled
 * as shortcuts because they open something stored elsewhere, but XP presents them
 * as the shell folders themselves and gives them no overlay. `system` is exactly
 * that set, so it doubles as the predicate.
 */
export const hasShortcutBadge = (node: FsNode) =>
  node.kind === 'shortcut' && !node.system

/** Double-click / Enter behaviour, shared by the desktop and Explorer. */
export function openNode(node: FsNode) {
  const target = resolve(node)
  if (!target) return
  if (target.kind === 'app') {
    wm.openApp(target.appId)
    return
  }
  const t = target.node
  if (t.kind === 'folder') wm.openApp('explorer', { nodeId: t.id })
  else if (t.kind === 'file') wm.openApp('notepad', { fileId: t.id })
}

// ------------------------------------------------------------- clipboard

export type ClipMode = 'copy' | 'cut'

interface Clip {
  nodeId: string
  mode: ClipMode
}

let clip: Clip | null = null
const listeners = new Set<() => void>()

export const clipboard = {
  set(nodeId: string, mode: ClipMode) {
    clip = { nodeId, mode }
    listeners.forEach((l) => l())
  },
  clear() {
    clip = null
    listeners.forEach((l) => l())
  },
  get(): Clip | null {
    return clip
  },
}

export function useClipboard(): Clip | null {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l)
      return () => listeners.delete(l)
    },
    () => clip,
    () => clip,
  )
}
