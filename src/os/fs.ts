import { useSyncExternalStore } from 'react'

/**
 * A small hierarchical filesystem, persisted to localStorage.
 *
 * Nodes are held in a flat `Record<id, node>` with a `parentId` link rather than
 * nested children arrays. Moves, renames and deletes then touch one entry
 * instead of splicing arrays at depth, and there is no risk of a node existing in
 * two places at once.
 */

export const ROOT_ID = 'root'
export const DESKTOP_ID = 'desktop'
export const DOCS_ID = 'documents'
/**
 * The Recycle Bin is a real folder that deleted items are *moved* into, which is
 * how the actual shell works: a recycled file keeps its identity, its contents and
 * its whole subtree, so restoring it is just another reparent.
 */
export const RECYCLE_ID = 'recycle'

export type NodeKind = 'folder' | 'file' | 'shortcut'

export type ShortcutTarget =
  | { kind: 'app'; appId: string }
  | { kind: 'node'; nodeId: string }

export interface FsNode {
  id: string
  /** null only for the root. */
  parentId: string | null
  kind: NodeKind
  name: string
  modified: number
  /** Files only. */
  content?: string
  /** Shortcuts only. */
  target?: ShortcutTarget
  /** Blocks rename and delete — the seeded shell items. */
  system?: boolean
  /** Present only while the node sits in the Recycle Bin. */
  restore?: { parentId: string; at: number }
}

interface FsState {
  nodes: Record<string, FsNode>
  seq: number
  /** Bumped when a migration adds something to an existing tree. See `load`. */
  version?: number
}

/** Current shape. Anything older gets brought forward once, in `load`. */
const VERSION = 1

const KEY = 'xp:fs'

/** The desktop's My Computer shortcut. */
/** The extension a name sorts and types under, lowercased, or '' if it hasn't one. */
export function extensionOf(name: string): string {
  const dot = name.lastIndexOf('.')
  return dot > 0 ? name.slice(dot + 1).toLowerCase() : ''
}

/** The file types this shell can actually produce, by extension. */
const FILE_TYPES: Record<string, string> = {
  txt: 'Text Document',
  rtf: 'Rich Text Document',
  bmp: 'Bitmap Image',
  png: 'PNG Image',
  wav: 'Wave Sound',
}

/**
 * What the shell calls a node in a Type column — Explorer's details pane, the Recycle
 * Bin, and Arrange Icons By.
 *
 * `kind` alone is not enough to be useful, which is the whole reason this exists.
 * Every icon on a stock desktop is a shortcut, so grouping by `kind` puts all seven in
 * one bucket and produces exactly the same order as grouping by name. What distinguishes
 * them is what the shell already distinguishes elsewhere: the `system` items are folders
 * rather than links, and a file's type comes from its extension.
 */
export function typeLabel(node: FsNode): string {
  if (node.system) return 'System Folder'
  if (node.kind === 'folder') return 'File Folder'
  if (node.kind === 'shortcut') return 'Shortcut'
  const ext = extensionOf(node.name)
  return FILE_TYPES[ext] ?? (ext ? `${ext.toUpperCase()} File` : 'File')
}

/**
 * A node's size in bytes.
 *
 * Shortcuts get a nominal 512, which is roughly what a `.lnk` occupied on disk — they
 * have no content of their own, and reporting 0 bytes for something that plainly exists
 * reads as a bug. Folders report their own content length, which is nothing.
 */
export const sizeOf = (node: FsNode): number =>
  node.kind === 'shortcut' ? 512 : (node.content?.length ?? 0)

export const MY_COMPUTER_ID = 'sc-mycomputer'

/**
 * The Control Panel, which really was a folder — XP's shell put it inside My Computer and
 * opened it in an Explorer window. Ours is the same: a system folder with no children,
 * because Explorer renders its category view instead of listing it.
 */
export const CONTROL_PANEL_ID = 'control-panel'

/**
 * A Control Panel category. Also a folder, for the same reason its parent is: navigating
 * to it gives Back, Up, the address bar and the window title without any of them knowing
 * this is a category page rather than a directory.
 */
export const CP_APPEARANCE_ID = 'cp-appearance'

/**
 * The one seeded item the shell will let you throw away.
 *
 * `system` is supposed to mean "the shell put this here, hands off" — My Computer
 * slipping through that check is a bug, and emptying the bin afterwards takes the
 * whole shell down with it. See os/boot.ts.
 */
const RECYCLABLE_SYSTEM = new Set<string>([MY_COMPUTER_ID])

/** Whether Delete will accept this node — `system`, with the hole above. */
export const canRecycle = (node: FsNode) =>
  !node.system || RECYCLABLE_SYSTEM.has(node.id)

/** Rebuilt by the DOS prompt's `RESTORE`, and by the seed. */
const myComputerShortcut = (): FsNode => ({
  id: MY_COMPUTER_ID,
  parentId: DESKTOP_ID,
  kind: 'shortcut',
  name: 'My Computer',
  target: { kind: 'node', nodeId: ROOT_ID },
  system: true,
  modified: Date.now(),
})

/** Where the pop-ups come from. Nothing else creates or needs this. */
const spamShortcut = (): FsNode => ({
  id: 'sc-spam',
  parentId: DESKTOP_ID,
  kind: 'shortcut',
  name: 'SPAM',
  target: { kind: 'app', appId: 'spam' },
  modified: Date.now(),
})

const buddyShortcut = (): FsNode => ({
  id: 'sc-buddy',
  parentId: DESKTOP_ID,
  kind: 'shortcut',
  name: 'Bongo Buddy',
  target: { kind: 'app', appId: 'buddy' },
  modified: Date.now(),
})

/**
 * Deliberately parentless. `getChildren` matches on `parentId`, so a detached
 * container can never turn up inside My Computer — the bin is somewhere things go,
 * not somewhere you can browse to.
 */
const controlPanelNode = (): FsNode => ({
  id: CONTROL_PANEL_ID,
  parentId: ROOT_ID,
  kind: 'folder',
  name: 'Control Panel',
  system: true,
  modified: Date.now(),
})

const appearanceNode = (): FsNode => ({
  id: CP_APPEARANCE_ID,
  parentId: CONTROL_PANEL_ID,
  kind: 'folder',
  name: 'Appearance and Themes',
  system: true,
  modified: Date.now(),
})

const recycleBinNode = (): FsNode => ({
  id: RECYCLE_ID,
  parentId: null,
  kind: 'folder',
  name: 'Recycle Bin',
  system: true,
  modified: Date.now(),
})

function seed(): FsState {
  const now = Date.now()
  const n = (node: Omit<FsNode, 'modified'>): FsNode => ({ ...node, modified: now })
  return {
    seq: 10,
    version: VERSION,
    nodes: {
      [RECYCLE_ID]: recycleBinNode(),
      [ROOT_ID]: n({
        id: ROOT_ID,
        parentId: null,
        kind: 'folder',
        name: 'My Computer',
        system: true,
      }),
      [DESKTOP_ID]: n({
        id: DESKTOP_ID,
        parentId: ROOT_ID,
        kind: 'folder',
        name: 'Desktop',
        system: true,
      }),
      [DOCS_ID]: n({
        id: DOCS_ID,
        parentId: ROOT_ID,
        kind: 'folder',
        name: 'My Documents',
        system: true,
      }),
      [CONTROL_PANEL_ID]: controlPanelNode(),
      [CP_APPEARANCE_ID]: appearanceNode(),
      [MY_COMPUTER_ID]: myComputerShortcut(),
      'sc-mydocs': n({
        id: 'sc-mydocs',
        parentId: DESKTOP_ID,
        kind: 'shortcut',
        name: 'My Documents',
        target: { kind: 'node', nodeId: DOCS_ID },
        system: true,
      }),
      'sc-recyclebin': n({
        id: 'sc-recyclebin',
        parentId: DESKTOP_ID,
        kind: 'shortcut',
        name: 'Recycle Bin',
        target: { kind: 'app', appId: 'recycleBin' },
        system: true,
      }),
      'sc-notepad': n({
        id: 'sc-notepad',
        parentId: DESKTOP_ID,
        kind: 'shortcut',
        name: 'Notepad',
        target: { kind: 'app', appId: 'notepad' },
      }),
      'sc-spam': spamShortcut(),
      'sc-buddy': buddyShortcut(),
      'sc-netscape': n({
        id: 'sc-netscape',
        parentId: DESKTOP_ID,
        kind: 'shortcut',
        name: 'Netscape Navigator',
        target: { kind: 'app', appId: 'netscape' },
      }),
      'f-readme': n({
        id: 'f-readme',
        parentId: DOCS_ID,
        kind: 'file',
        name: 'readme.txt',
        content: [
          'Welcome to Windows XP.',
          '',
          'This is a real folder tree. Right-click anywhere — the desktop or',
          'inside a window — to create folders, text documents and shortcuts.',
          '',
          'Cut, Copy and Paste move things between folders.',
        ].join('\n'),
      }),
    },
  }
}

function load(): FsState {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) {
      const fresh = seed()
      persist(fresh)
      return fresh
    }
    const parsed = JSON.parse(raw) as FsState
    // A missing root means corrupt or pre-tree data; start over rather than
    // limping along with an unreachable hierarchy.
    if (!parsed?.nodes?.[ROOT_ID]) return seed()
    // Trees saved before the Recycle Bin existed have no container for it. Adding
    // one beats discarding somebody's files over a missing folder.
    parsed.nodes[RECYCLE_ID] ??= recycleBinNode()
    // Same for the Control Panel: a tree saved before it existed has no folder for it,
    // and the Start menu's entry would open an Explorer window pointed at nothing.
    parsed.nodes[CONTROL_PANEL_ID] ??= controlPanelNode()
    parsed.nodes[CP_APPEARANCE_ID] ??= appearanceNode()

    // Migrations run once and then record that they have. Adding the shortcut on
    // every load instead would resurrect it every time somebody deleted it — so the
    // stamp has to be written back straight away, not left for the next commit.
    if ((parsed.version ?? 0) < VERSION) {
      if ((parsed.version ?? 0) < 1) parsed.nodes['sc-spam'] ??= spamShortcut()
      parsed.version = VERSION
      persist(parsed)
    }
    return parsed
  } catch {
    return seed()
  }
}

/** False after a failed write, so callers can report it rather than lie. */
let persistOk = true

function persist(s: FsState) {
  try {
    localStorage.setItem(KEY, JSON.stringify(s))
    persistOk = true
  } catch {
    // Quota or private mode: changes stay in memory for this session only.
    persistOk = false
  }
}

/** Whether the last mutation reached durable storage. */
export const isPersisted = () => persistOk

/**
 * Subscribes to that. `commit` persists before it notifies, so a component reading
 * this always sees the outcome of the write that woke it up.
 *
 * This matters because the failure is otherwise completely silent: Paint saves each
 * canvas as a PNG data URL, and a handful of those will exhaust the few megabytes
 * `localStorage` allows. Everything keeps working for the session and then quietly
 * isn't there next time.
 */
export function usePersisted(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => persistOk,
    () => persistOk,
  )
}

/**
 * Moves a node out of the Recycle Bin and back to where it came from, without
 * committing — `restore` does one item, `repair` does the lot in a single commit.
 */
function unrecycle(id: string): boolean {
  const node = state.nodes[id]
  if (!node || node.parentId !== RECYCLE_ID) return false
  const home = node.restore?.parentId ?? DESKTOP_ID
  const parent = state.nodes[home]
  // The Desktop is the fallback when the original folder is gone — or is itself in
  // the bin, which happens if you delete a file and then delete the folder it came
  // from. Restoring into that folder would put the item back in the bin.
  const usable =
    parent?.kind === 'folder' && !isAncestor(id, home) && !isAncestor(RECYCLE_ID, home)
  const target = usable ? home : DESKTOP_ID
  node.parentId = target
  // Something else may have taken the name in the meantime — but not this node itself.
  node.name = uniqueName(target, node.name, id)
  delete node.restore
  node.modified = Date.now()
  return true
}

let state = load()
const listeners = new Set<() => void>()

function commit() {
  // New object identity so useSyncExternalStore sees the change.
  state = { ...state, nodes: { ...state.nodes } }
  persist(state)
  listeners.forEach((l) => l())
}

const nextId = (prefix: string) => `${prefix}-${++state.seq}`

// ---------------------------------------------------------------- reads

export const getNode = (id: string): FsNode | undefined => state.nodes[id]

const KIND_ORDER: Record<NodeKind, number> = { folder: 0, shortcut: 1, file: 2 }

/** Folders first, then shortcuts, then files; alphabetical within each. */
export function getChildren(parentId: string): FsNode[] {
  return Object.values(state.nodes)
    .filter((n) => n.parentId === parentId)
    .sort(
      (a, b) =>
        KIND_ORDER[a.kind] - KIND_ORDER[b.kind] ||
        a.name.localeCompare(b.name, undefined, { numeric: true }),
    )
}

/** Root-first chain to `id`, for breadcrumbs and the address bar. */
export function getPath(id: string): FsNode[] {
  const chain: FsNode[] = []
  let cur = state.nodes[id]
  const guard = new Set<string>()
  while (cur && !guard.has(cur.id)) {
    guard.add(cur.id)
    chain.unshift(cur)
    cur = cur.parentId ? state.nodes[cur.parentId] : undefined!
  }
  return chain
}

/** What a shortcut points at, or the node itself if it isn't one. */
export function resolve(
  node: FsNode,
): { kind: 'app'; appId: string } | { kind: 'node'; node: FsNode } | null {
  if (node.kind !== 'shortcut') return { kind: 'node', node }
  const t = node.target
  if (!t) return null
  if (t.kind === 'app') return { kind: 'app', appId: t.appId }
  const target = state.nodes[t.nodeId]
  return target ? { kind: 'node', node: target } : null
}

/** True when `maybeAncestor` is at or above `id` — guards moves into themselves. */
export function isAncestor(maybeAncestor: string, id: string): boolean {
  let cur = state.nodes[id]
  const guard = new Set<string>()
  while (cur && !guard.has(cur.id)) {
    if (cur.id === maybeAncestor) return true
    guard.add(cur.id)
    cur = cur.parentId ? state.nodes[cur.parentId] : undefined!
  }
  return false
}

/**
 * A name no sibling is already using.
 *
 * `exceptId` is not optional bookkeeping: callers that move a node reparent it before
 * naming it, so without excluding the node itself it collides with its own old name
 * and every move or restore comes back as "thing (2)".
 */
function uniqueName(parentId: string, desired: string, exceptId?: string): string {
  const taken = new Set(
    getChildren(parentId)
      .filter((n) => n.id !== exceptId)
      .map((n) => n.name.toLowerCase()),
  )
  if (!taken.has(desired.toLowerCase())) return desired

  const dot = desired.lastIndexOf('.')
  const stem = dot > 0 ? desired.slice(0, dot) : desired
  const ext = dot > 0 ? desired.slice(dot) : ''
  for (let i = 2; i < 1000; i++) {
    const candidate = `${stem} (${i})${ext}`
    if (!taken.has(candidate.toLowerCase())) return candidate
  }
  return `${stem} (${Date.now()})${ext}`
}

// ---------------------------------------------------------------- writes

/** Drop a node and its whole subtree. Callers commit. */
function purge(id: string) {
  const doomed: string[] = []
  const walk = (nid: string) => {
    doomed.push(nid)
    for (const child of Object.values(state.nodes)) {
      if (child.parentId === nid) walk(child.id)
    }
  }
  walk(id)
  for (const nid of doomed) delete state.nodes[nid]
}

export const fs = {
  createFolder(parentId: string, name = 'New Folder'): string {
    const id = nextId('d')
    state.nodes[id] = {
      id,
      parentId,
      kind: 'folder',
      name: uniqueName(parentId, name),
      modified: Date.now(),
    }
    commit()
    return id
  },

  createFile(
    parentId: string,
    name = 'New Text Document.txt',
    content = '',
  ): string {
    const id = nextId('f')
    state.nodes[id] = {
      id,
      parentId,
      kind: 'file',
      name: uniqueName(parentId, name),
      content,
      modified: Date.now(),
    }
    commit()
    return id
  },

  createShortcut(parentId: string, target: ShortcutTarget, name: string): string {
    const id = nextId('s')
    state.nodes[id] = {
      id,
      parentId,
      kind: 'shortcut',
      name: uniqueName(parentId, name),
      target,
      modified: Date.now(),
    }
    commit()
    return id
  },

  rename(id: string, name: string): boolean {
    const node = state.nodes[id]
    const trimmed = name.trim()
    if (!node || node.system || !trimmed || trimmed === node.name) return false
    const clash = getChildren(node.parentId ?? ROOT_ID).some(
      (n) => n.id !== id && n.name.toLowerCase() === trimmed.toLowerCase(),
    )
    if (clash) return false
    node.name = trimmed
    node.modified = Date.now()
    commit()
    return true
  },

  /** Permanent, recursive delete. `recycle` is what the shell's Delete does. */
  remove(id: string): boolean {
    const node = state.nodes[id]
    if (!node || node.system) return false
    purge(id)
    commit()
    return true
  },

  /**
   * Send to the Recycle Bin, remembering where it came from.
   *
   * Deliberately not built on `move`: that renames on a name clash, and two files
   * called the same thing really can sit in the bin together — a rename would also
   * lose the name the item has to be restored under.
   */
  recycle(id: string): boolean {
    const node = state.nodes[id]
    if (!node || !canRecycle(node) || node.parentId === RECYCLE_ID) return false
    node.restore = { parentId: node.parentId ?? DESKTOP_ID, at: Date.now() }
    node.parentId = RECYCLE_ID
    commit()
    return true
  },

  /** Put it back where it came from, or on the Desktop if that folder is gone. */
  restore(id: string): boolean {
    if (!unrecycle(id)) return false
    commit()
    return true
  },

  /**
   * What a power cycle puts right. Everything still in the Recycle Bin goes back
   * where it came from, and anything the machine shipped with that has gone missing
   * is rebuilt from the seed.
   *
   * The fiction is that the POST repairs the install, so no amount of deleting can
   * leave the desktop permanently broken — which matters because emptying the bin
   * with My Computer in it used to be a one-way door once you'd reloaded the page.
   * Files and folders *you* made are yours: they stay where they are, and if you
   * destroyed one for real by emptying the bin, it does not come back. The machine
   * can rebuild what it shipped with. It can't rebuild what you made and then
   * deliberately threw out.
   *
   * One commit for the lot, so the desktop repaints once.
   */
  repair(): { rebuilt: number; restored: number } {
    // Seeded structure first: a bin item can only go home if its folder is there.
    const shipped = seed().nodes
    const rebuilt = Object.keys(shipped).filter((id) => !state.nodes[id])
    for (const id of rebuilt) state.nodes[id] = shipped[id]

    // Then empty the bin back to source. Repeated passes rather than one, because an
    // item's home folder can itself be sitting in the bin — delete a file, then delete
    // the folder it came from, and the file only goes home after the folder does. Each
    // pass that moves something may unblock another; stop when one moves nothing.
    let restored = 0
    for (;;) {
      const moved = getChildren(RECYCLE_ID).filter((node) => unrecycle(node.id)).length
      if (!moved) break
      restored += moved
    }

    if (rebuilt.length || restored) commit()
    return { rebuilt: rebuilt.length, restored }
  },

  /**
   * Puts My Computer back on the desktop. The DOS prompt's `RESTORE` is the only
   * caller, because emptying the bin is the only thing that can remove it.
   */
  restoreMyComputer(): boolean {
    if (state.nodes[MY_COMPUTER_ID]) return false
    state.nodes[MY_COMPUTER_ID] = myComputerShortcut()
    commit()
    return true
  },

  /** Purges the whole bin in one commit. Returns how many top-level items went. */
  emptyRecycleBin(): number {
    const doomed = getChildren(RECYCLE_ID)
    if (!doomed.length) return 0
    // Purges regardless of `system`, which `remove` would have refused. That is how
    // My Computer gets destroyed for real once it's in here — see canRecycle above.
    for (const node of doomed) purge(node.id)
    commit()
    return doomed.length
  },

  writeFile(id: string, content: string): boolean {
    const node = state.nodes[id]
    if (!node || node.kind !== 'file') return false
    node.content = content
    node.modified = Date.now()
    commit()
    return true
  },

  /** Create-or-overwrite by name, the shape Notepad's Save As needs. */
  saveAs(parentId: string, name: string, content: string): string {
    const existing = getChildren(parentId).find(
      (n) => n.kind === 'file' && n.name.toLowerCase() === name.toLowerCase(),
    )
    if (existing) {
      existing.content = content
      existing.modified = Date.now()
      commit()
      return existing.id
    }
    return fs.createFile(parentId, name, content)
  },

  move(id: string, newParentId: string): boolean {
    const node = state.nodes[id]
    const parent = state.nodes[newParentId]
    if (!node || !parent || parent.kind !== 'folder') return false
    if (node.parentId === newParentId) return true
    // Moving a folder inside itself would orphan the whole subtree.
    if (isAncestor(id, newParentId)) return false
    node.parentId = newParentId
    node.name = uniqueName(newParentId, node.name, id)
    node.modified = Date.now()
    commit()
    return true
  },

  /** Deep copy for folders; returns the new node's id. */
  copy(id: string, newParentId: string): string | null {
    const src = state.nodes[id]
    const parent = state.nodes[newParentId]
    if (!src || !parent || parent.kind !== 'folder') return null
    if (isAncestor(id, newParentId)) return null

    const clone = (nid: string, parentId: string, rename: boolean): string => {
      const from = state.nodes[nid]
      const newId = nextId(from.kind === 'folder' ? 'd' : from.kind === 'file' ? 'f' : 's')
      state.nodes[newId] = {
        ...from,
        id: newId,
        parentId,
        system: false,
        name: rename ? uniqueName(parentId, from.name) : from.name,
        modified: Date.now(),
      }
      for (const child of Object.values(state.nodes)) {
        if (child.parentId === nid && child.id !== newId) {
          clone(child.id, newId, false)
        }
      }
      return newId
    }

    const newId = clone(id, newParentId, true)
    commit()
    return newId
  },
}

// ---------------------------------------------------------------- subscribe

function subscribe(l: () => void) {
  listeners.add(l)
  return () => {
    listeners.delete(l)
  }
}

/**
 * Subscribes to the whole tree. Selectors must return a stable value, so this
 * hands back the nodes record — derive lists with getChildren in render.
 */
export function useFsVersion(): Record<string, FsNode> {
  return useSyncExternalStore(
    subscribe,
    () => state.nodes,
    () => state.nodes,
  )
}
