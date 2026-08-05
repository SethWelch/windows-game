import {
  RECYCLE_ID,
  ROOT_ID,
  canRecycle,
  fs,
  getNode,
  isAncestor,
  resolve,
} from './fs.ts'
import type { FsNode } from './fs.ts'

/**
 * What dragging one shell item onto another means.
 *
 * Shared by the desktop and Explorer so the rules can't drift apart, and written
 * against the *resolved* target: dropping on the Recycle Bin shortcut and dropping
 * on the bin itself are the same gesture, and so are a folder and a shortcut to
 * one. Anything that hosts droppable items marks them with `data-drop-node`.
 */

export type DropAction =
  | { kind: 'recycle' }
  | { kind: 'move'; folderId: string; folderName: string }

/** Null when the drop would do nothing, which is also what suppresses the hover. */
export function dropActionFor(source: FsNode, target: FsNode): DropAction | null {
  if (source.id === target.id) return null
  // Seeded items can't be moved about, but one of them can be thrown away — which
  // is why this asks `canRecycle` rather than testing `system` outright.
  if (source.system && !canRecycle(source)) return null

  const resolved = resolve(target)
  if (!resolved) return null

  if (resolved.kind === 'app') {
    return resolved.appId === 'recycleBin' ? { kind: 'recycle' } : null
  }

  const folder = resolved.node
  if (folder.kind !== 'folder') return null
  if (folder.id === RECYCLE_ID) return { kind: 'recycle' }
  // My Computer is a shell root, not somewhere files go — XP refused this too.
  if (folder.id === ROOT_ID) return null
  // Already there, or it would swallow itself.
  if (folder.id === source.parentId) return null
  if (isAncestor(source.id, folder.id)) return null
  return { kind: 'move', folderId: folder.id, folderName: folder.name }
}

export function performDrop(source: FsNode, target: FsNode): boolean {
  const action = dropActionFor(source, target)
  if (!action) return false
  return action.kind === 'recycle'
    ? fs.recycle(source.id)
    : fs.move(source.id, action.folderId)
}

/** The droppable shell item under the pointer, if there is one. */
export function dropTargetAt(x: number, y: number): FsNode | undefined {
  const el = document.elementFromPoint(x, y)?.closest<HTMLElement>('[data-drop-node]')
  const id = el?.dataset.dropNode
  return id ? getNode(id) : undefined
}

/**
 * Track and highlight the item a drag is over, but only where the drop would
 * actually land. Pass the previous return value back in each time; call
 * `clearDropHover` when the gesture ends.
 *
 * Writes `data-drop-hover` straight to the DOM rather than going through state:
 * this runs on every pointermove, and the same reasoning applies as in
 * hooks/useWindowGesture.ts — an outline is not worth a render per frame.
 */
export function trackDropHover(
  source: FsNode,
  x: number,
  y: number,
  previous: Element | null,
): Element | null {
  const el =
    document.elementFromPoint(x, y)?.closest<HTMLElement>('[data-drop-node]') ?? null
  if (el === previous) return previous

  clearDropHover(previous)
  const target = el?.dataset.dropNode ? getNode(el.dataset.dropNode) : undefined
  if (el && target && dropActionFor(source, target)) {
    el.dataset.dropHover = 'true'
    return el
  }
  return null
}

export function clearDropHover(previous: Element | null) {
  if (previous instanceof HTMLElement) delete previous.dataset.dropHover
}

/** The Recycle Bin under the pointer, wherever it's shown from. */
function recycleElementAt(x: number, y: number): HTMLElement | null {
  const el = document.elementFromPoint(x, y)?.closest<HTMLElement>('[data-drop-node]')
  const node = el?.dataset.dropNode ? getNode(el.dataset.dropNode) : undefined
  if (!el || !node) return null

  const resolved = resolve(node)
  if (!resolved) return null
  const isBin =
    resolved.kind === 'app'
      ? resolved.appId === 'recycleBin'
      : resolved.node.id === RECYCLE_ID
  return isBin ? el : null
}

/**
 * Whether a drop here would go in the bin.
 *
 * Separate from `dropActionFor` because that needs an `FsNode` for the *source*, and
 * the thing being dragged isn't always a file — Solitaire drags playing cards onto
 * the bin, which is a program's object rather than the filesystem's.
 */
export const isRecycleTargetAt = (x: number, y: number) => !!recycleElementAt(x, y)

/** The bin's highlight, for those same non-file drags. */
export function trackRecycleHover(
  x: number,
  y: number,
  previous: Element | null,
): Element | null {
  const el = recycleElementAt(x, y)
  if (el === previous) return previous
  clearDropHover(previous)
  if (!el) return null
  el.dataset.dropHover = 'true'
  return el
}
