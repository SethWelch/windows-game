import { useEffect, useRef, useState } from 'react'
import type { PointerEvent as ReactPointerEvent } from 'react'
import { ContextMenu } from '@/components/ui/ContextMenu.tsx'
import { MenuBar } from '@/components/ui/MenuBar.tsx'
import {
  folderContextMenu,
  itemContextMenu,
} from '@/components/ui/shellMenus.ts'
import type { Menu, MenuNode } from '@/components/ui/menu.types.ts'
import { Icon } from '@/icons/Icon.tsx'
import {
  BackIcon,
  CaretDown,
  ChevronDown,
  ForwardIcon,
  FoldersIcon,
  SearchIcon,
  UpIcon,
  ViewsIcon,
} from '@/icons/ToolbarIcons.tsx'
import {
  CONTROL_PANEL_ID,
  CP_APPEARANCE_ID,
  DESKTOP_ID,
  ROOT_ID,
  fs,
  getChildren,
  getNode,
  getPath,
  useFsVersion,
} from '@/os/fs.ts'
import type { FsNode, ShortcutTarget } from '@/os/fs.ts'
import {
  clipboard,
  hasShortcutBadge,
  iconIdFor,
  openNode,
  useClipboard,
} from '@/os/shell.ts'
import {
  clearDropHover,
  dropTargetAt,
  performDrop,
  trackDropHover,
} from '@/os/dnd.ts'
import type { AppProps } from '@/os/types.ts'
import { wm } from '@/os/windowStore.ts'
import { AppearanceThemesView } from '@/apps/controlPanel/AppearanceThemesView.tsx'
import { ControlPanelView } from '@/apps/controlPanel/ControlPanelView.tsx'
import { TaskPane } from './TaskPane.tsx'
import './Explorer.css'

interface ExplorerArgs {
  nodeId?: string
}

/**
 * Clicks that count as "empty space" in the view. The group and tiles wrappers
 * fill the view, so a strict `target === currentTarget` test would miss the gaps
 * between tiles and below the last row.
 */
function isEmptySpace(target: EventTarget): boolean {
  if (!(target instanceof HTMLElement)) return false
  return (
    target.classList.contains('xp-explorer-view') ||
    target.classList.contains('xp-group') ||
    target.classList.contains('xp-tiles')
  )
}

/** XP groups My Computer's contents under headings; ordinary folders are flat. */
function groupsFor(folder: FsNode, items: FsNode[]) {
  if (folder.id !== ROOT_ID) return [{ heading: null, items }]
  return [{ heading: 'Files Stored on This Computer', items }]
}

/** Movement below this is a click, not a drag. Matches the desktop's threshold. */
const DRAG_SLOP = 4

interface TileDrag {
  node: FsNode
  pointerId: number
  fromX: number
  fromY: number
  /** Pointer offset inside the tile, so the ghost doesn't jump to a corner. */
  dx: number
  dy: number
  started: boolean
  hover: Element | null
}

export function Explorer({ windowId, args }: AppProps) {
  const { nodeId } = (args ?? {}) as ExplorerArgs
  useFsVersion()
  const clip = useClipboard()

  const [cwd, setCwd] = useState(nodeId ?? DESKTOP_ID)
  const [back, setBack] = useState<string[]>([])
  const [forward, setForward] = useState<string[]>([])
  const [selected, setSelected] = useState<string | null>(null)
  const [editing, setEditing] = useState<string | null>(null)
  const [draft, setDraft] = useState('')
  const [showTasks, setShowTasks] = useState(true)
  const [menu, setMenu] = useState<{ x: number; y: number; items: MenuNode[] } | null>(
    null,
  )
  /** Set once a drag passes the threshold; drives the ghost that follows the pointer. */
  const [dragging, setDragging] = useState<{ node: FsNode; x: number; y: number } | null>(
    null,
  )

  const rootRef = useRef<HTMLDivElement>(null)
  const ghostRef = useRef<HTMLDivElement>(null)
  const tileDrag = useRef<TileDrag | null>(null)
  const detach = useRef<(() => void) | null>(null)

  const folder = getNode(cwd) ?? getNode(ROOT_ID)!
  const items = getChildren(folder.id)
  const trail = getPath(folder.id)
  const selectedNode = selected ? (getNode(selected) ?? null) : null

  useEffect(() => {
    wm.setTitle(windowId, folder.name)
  }, [windowId, folder.name])

  const goTo = (id: string) => {
    if (id === cwd) return
    setBack((h) => [...h, cwd])
    setForward([])
    setSelected(null)
    setEditing(null)
    setCwd(id)
  }

  const goBack = () => {
    if (!back.length) return
    setForward((f) => [cwd, ...f])
    setCwd(back[back.length - 1])
    setBack((h) => h.slice(0, -1))
    setSelected(null)
  }

  const goForward = () => {
    if (!forward.length) return
    setBack((h) => [...h, cwd])
    setCwd(forward[0])
    setForward((f) => f.slice(1))
    setSelected(null)
  }

  const startRename = (id: string) => {
    setDraft(getNode(id)?.name ?? '')
    setEditing(id)
  }

  // Closing the window mid-drag must not leave listeners on the document.
  useEffect(() => () => detach.current?.(), [])

  /**
   * Tile dragging, for dropping onto a folder or the Recycle Bin.
   *
   * On document listeners rather than pointer capture, and only from the second
   * threshold-crossing move: the tile it starts on can re-render or move out from
   * under the gesture, and keeping it untouched through a plain click is what
   * leaves double-click-to-open working.
   */
  const beginTileDrag = (e: ReactPointerEvent<HTMLDivElement>, node: FsNode) => {
    if (e.button !== 0 || node.system || tileDrag.current) return
    const root = rootRef.current
    if (!root) return

    const box = e.currentTarget.getBoundingClientRect()
    const g: TileDrag = {
      node,
      pointerId: e.pointerId,
      fromX: e.clientX,
      fromY: e.clientY,
      dx: e.clientX - box.left,
      dy: e.clientY - box.top,
      started: false,
      hover: null,
    }
    tileDrag.current = g

    // The ghost is absolute inside the app root, so pointer coordinates have to
    // come back out of viewport space — `.xp-window` carries a transform, which
    // would make a `position: fixed` layer resolve against the window instead.
    const frame = root.getBoundingClientRect()
    const local = (x: number, y: number) => ({
      x: x - g.dx - frame.left,
      y: y - g.dy - frame.top,
    })

    function onMove(ev: PointerEvent) {
      if (ev.pointerId !== g.pointerId) return
      const at = local(ev.clientX, ev.clientY)

      if (!g.started) {
        const travelled =
          Math.abs(ev.clientX - g.fromX) + Math.abs(ev.clientY - g.fromY)
        if (travelled <= DRAG_SLOP) return
        g.started = true
        setDragging({ node: g.node, x: at.x, y: at.y })
        return
      }
      if (ghostRef.current) {
        ghostRef.current.style.transform = `translate(${at.x}px, ${at.y}px)`
      }

      g.hover = trackDropHover(g.node, ev.clientX, ev.clientY, g.hover)
    }

    function onUp(ev: PointerEvent) {
      if (ev.pointerId !== g.pointerId) return
      const dragged = g.started
      const target = dragged ? dropTargetAt(ev.clientX, ev.clientY) : undefined
      cleanup()
      if (!dragged) return
      setDragging(null)
      if (target && performDrop(g.node, target)) setSelected(null)
    }

    function onCancel(ev: PointerEvent) {
      if (ev.pointerId !== g.pointerId) return
      cleanup()
      setDragging(null)
    }

    function cleanup() {
      clearDropHover(g.hover)
      tileDrag.current = null
      detach.current = null
      document.removeEventListener('pointermove', onMove)
      document.removeEventListener('pointerup', onUp)
      document.removeEventListener('pointercancel', onCancel)
    }

    detach.current = () => {
      cleanup()
      setDragging(null)
    }
    document.addEventListener('pointermove', onMove)
    document.addEventListener('pointerup', onUp)
    document.addEventListener('pointercancel', onCancel)
  }

  const activate = (node: FsNode) => {
    // Navigating in place beats spawning a window for every folder.
    if (node.kind === 'folder') {
      goTo(node.id)
      return
    }
    if (node.kind === 'shortcut' && node.target?.kind === 'node') {
      const target = getNode(node.target.nodeId)
      if (target?.kind === 'folder') {
        goTo(target.id)
        return
      }
    }
    openNode(node)
  }

  const paste = () => {
    if (!clip) return
    if (clip.mode === 'cut') fs.move(clip.nodeId, folder.id)
    else fs.copy(clip.nodeId, folder.id)
    clipboard.clear()
  }

  const emptyMenu = () =>
    folderContextMenu({
      onNewFolder: () => startRename(fs.createFolder(folder.id)),
      onNewFile: () => startRename(fs.createFile(folder.id)),
      onNewShortcut: (target: ShortcutTarget, label: string) =>
        startRename(fs.createShortcut(folder.id, target, label)),
      onPaste: paste,
      canPaste: !!clip,
      onRefresh: () => setSelected(null),
    })

  const nodeMenu = (node: FsNode) =>
    itemContextMenu({
      node,
      onOpen: () => activate(node),
      onRename: () => startRename(node.id),
      onDelete: () => fs.recycle(node.id),
      onCut: () => clipboard.set(node.id, 'cut'),
      onCopy: () => clipboard.set(node.id, 'copy'),
      onCreateShortcut: () =>
        fs.createShortcut(
          folder.id,
          { kind: 'node', nodeId: node.id },
          `Shortcut to ${node.name}`,
        ),
    })

  const menus: Menu[] = [
    {
      id: 'file',
      label: '&File',
      items: [
        {
          id: 'new-folder',
          label: 'Ne&w Folder',
          onSelect: () => startRename(fs.createFolder(folder.id)),
        },
        {
          id: 'new-file',
          label: 'New &Text Document',
          onSelect: () => startRename(fs.createFile(folder.id)),
        },
        { kind: 'separator' },
        {
          id: 'delete',
          label: '&Delete',
          disabled: !selectedNode || !!selectedNode.system,
          onSelect: () => selected && fs.recycle(selected),
        },
        {
          id: 'rename',
          label: 'Rena&me',
          disabled: !selectedNode || !!selectedNode.system,
          onSelect: () => selected && startRename(selected),
        },
        { kind: 'separator' },
        { id: 'close', label: '&Close', onSelect: () => wm.close(windowId) },
      ],
    },
    {
      id: 'edit',
      label: '&Edit',
      items: [
        {
          id: 'cut',
          label: 'Cu&t',
          disabled: !selectedNode || !!selectedNode.system,
          onSelect: () => selected && clipboard.set(selected, 'cut'),
        },
        {
          id: 'copy',
          label: '&Copy',
          disabled: !selectedNode || !!selectedNode.system,
          onSelect: () => selected && clipboard.set(selected, 'copy'),
        },
        { id: 'paste', label: '&Paste', disabled: !clip, onSelect: paste },
        { kind: 'separator' },
        {
          id: 'selectall',
          label: 'Select &All',
          disabled: true,
        },
      ],
    },
    {
      id: 'view',
      label: '&View',
      items: [
        {
          id: 'tasks',
          label: 'E&xplorer Bar',
          checked: showTasks,
          onSelect: () => setShowTasks((v) => !v),
        },
        { kind: 'separator' },
        { id: 'refresh', label: 'R&efresh', onSelect: () => setSelected(null) },
      ],
    },
    {
      id: 'favorites',
      label: 'F&avorites',
      items: [{ id: 'add-fav', label: '&Add to Favorites...', disabled: true }],
    },
    {
      id: 'tools',
      label: '&Tools',
      items: [{ id: 'folder-opts', label: '&Folder Options...', disabled: true }],
    },
    {
      id: 'help',
      label: '&Help',
      items: [{ id: 'about', label: '&About Windows', disabled: true }],
    },
  ]

  return (
    <div className="xp-explorer" ref={rootRef}>
      <div className="xp-explorer-menurow">
        <MenuBar menus={menus} />
        <span className="xp-explorer-brand">
          {/* 16 is a native size in the artwork, so nothing gets rescaled. */}
          <Icon id="windowsxp" size={16} />
        </span>
      </div>

      <div className="xp-explorer-toolbar">
        <button
          type="button"
          className="xp-tbi xp-tbi--labelled xp-tbi--nav"
          disabled={!back.length}
          onClick={goBack}
        >
          <BackIcon disabled={!back.length} />
          <span>Back</span>
          <span className="xp-tbi-caret">
            <CaretDown />
          </span>
        </button>
        <button
          type="button"
          className="xp-tbi xp-tbi--nav"
          disabled={!forward.length}
          onClick={goForward}
          title="Forward"
        >
          <ForwardIcon disabled={!forward.length} />
          <span className="xp-tbi-caret">
            <CaretDown />
          </span>
        </button>
        <button
          type="button"
          className="xp-tbi"
          disabled={!folder.parentId}
          onClick={() => folder.parentId && goTo(folder.parentId)}
          title="Up"
        >
          <UpIcon />
        </button>

        <span className="xp-tb-sep" />

        <button type="button" className="xp-tbi xp-tbi--labelled" disabled>
          <SearchIcon />
          <span>Search</span>
        </button>
        <button
          type="button"
          className="xp-tbi xp-tbi--labelled"
          data-active={showTasks}
          onClick={() => setShowTasks((v) => !v)}
        >
          <FoldersIcon />
          <span>Folders</span>
        </button>

        <span className="xp-tb-sep" />

        <button type="button" className="xp-tbi" disabled title="Views">
          <ViewsIcon />
          <span className="xp-tbi-caret">
            <CaretDown />
          </span>
        </button>
      </div>

      <div className="xp-explorer-addressrow">
        <label htmlFor={`addr-${windowId}`}>Address</label>
        <div className="xp-address" id={`addr-${windowId}`}>
          <Icon id={iconIdFor(folder)} size={16} />
          <span className="xp-address-text">
            {trail.map((n) => n.name).join('\\')}
          </span>
          <span className="xp-address-caret">
            <ChevronDown />
          </span>
        </div>
        <button type="button" className="xp-go" disabled>
          {/* 16 is the artwork's native size, so nothing gets rescaled. */}
          <Icon id="go-arrow" size={22} />
          <span>Go</span>
        </button>
      </div>

      <div className="xp-window-content">
        <div className="xp-explorer-panes">
          {showTasks && (
            <TaskPane
              folder={folder}
              selected={selectedNode}
              onNavigate={goTo}
              onNewFolder={() => startRename(fs.createFolder(folder.id))}
              onRename={() => selected && startRename(selected)}
              onCopy={() => selected && clipboard.set(selected, 'copy')}
              onDelete={() => selected && fs.recycle(selected)}
            />
          )}

          {/* The Control Panel is a folder that isn't a folder: XP's shell gave it its
              own body inside an ordinary Explorer window, which is why it gets the menu
              bar, toolbar, address bar and task pane for nothing. */}
          {folder.id === CONTROL_PANEL_ID ? (
            <ControlPanelView onNavigate={goTo} />
          ) : folder.id === CP_APPEARANCE_ID ? (
            <AppearanceThemesView />
          ) : (
          <div
            className="xp-explorer-view"
            onPointerDown={(e) => {
              if (isEmptySpace(e.target)) setSelected(null)
            }}
            onContextMenu={(e) => {
              if (!isEmptySpace(e.target)) return
              e.preventDefault()
              setMenu({ x: e.clientX, y: e.clientY, items: emptyMenu() })
            }}
          >
            {items.length === 0 && (
              <p className="xp-explorer-empty">This folder is empty.</p>
            )}

            {groupsFor(folder, items).map((group) => (
              <div key={group.heading ?? '_'} className="xp-group">
                {group.heading && (
                  <>
                    <div className="xp-group-heading">{group.heading}</div>
                    <div className="xp-group-rule" />
                  </>
                )}
                <div className="xp-tiles">
                  {group.items.map((node) => (
                    <div
                      key={node.id}
                      className="xp-tile"
                      data-selected={selected === node.id}
                      data-cut={clip?.mode === 'cut' && clip.nodeId === node.id}
                      data-drop-node={node.id}
                      tabIndex={0}
                      onPointerDown={(e) => {
                        e.stopPropagation()
                        setSelected(node.id)
                        if (editing !== node.id) beginTileDrag(e, node)
                      }}
                      onDoubleClick={() => editing !== node.id && activate(node)}
                      onContextMenu={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        setSelected(node.id)
                        setMenu({ x: e.clientX, y: e.clientY, items: nodeMenu(node) })
                      }}
                      onKeyDown={(e) => {
                        if (editing === node.id) return
                        if (e.key === 'Enter') activate(node)
                        if (e.key === 'F2' && !node.system) startRename(node.id)
                        if (e.key === 'Delete' && !node.system) fs.recycle(node.id)
                      }}
                    >
                      <span className="xp-tile-icon">
                        <Icon id={iconIdFor(node)} size={48} />
                        {hasShortcutBadge(node) && (
                          <Icon
                            id="shortcut"
                            size={48}
                            className="xp-shortcut-badge"
                          />
                        )}
                      </span>

                      {editing === node.id ? (
                        <input
                          className="xp-tile-edit"
                          value={draft}
                          autoFocus
                          onChange={(e) => setDraft(e.target.value)}
                          onFocus={(e) => e.currentTarget.select()}
                          onPointerDown={(e) => e.stopPropagation()}
                          onBlur={() => {
                            fs.rename(node.id, draft)
                            setEditing(null)
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              fs.rename(node.id, draft)
                              setEditing(null)
                            }
                            if (e.key === 'Escape') setEditing(null)
                          }}
                        />
                      ) : (
                        <span className="xp-tile-label">{node.name}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          )}
        </div>
      </div>

      <div className="xp-statusbar">
        <span className="xp-statusbar-cell xp-explorer-count">
          {items.length} object{items.length === 1 ? '' : 's'}
        </span>
        <span className="xp-statusbar-cell xp-explorer-zone">My Computer</span>
      </div>

      {/* The thing you're carrying. Untouchable, so the drop hit-test underneath
          sees the tile it's over rather than the ghost. */}
      {dragging && (
        <div
          ref={ghostRef}
          className="xp-tile-ghost"
          style={{ transform: `translate(${dragging.x}px, ${dragging.y}px)` }}
        >
          <span className="xp-tile-icon">
            <Icon id={iconIdFor(dragging.node)} size={48} />
            {hasShortcutBadge(dragging.node) && (
              <Icon id="shortcut" size={48} className="xp-shortcut-badge" />
            )}
          </span>
          <span className="xp-tile-label">{dragging.node.name}</span>
        </div>
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
