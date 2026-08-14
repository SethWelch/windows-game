import { useEffect, useRef, useState } from 'react'
import type { PointerEvent as ReactPointerEvent } from 'react'
import { Taskbar } from '@/components/Taskbar/Taskbar.tsx'
import { BuddyLayer } from '@/components/Buddy/BuddyLayer.tsx'
import { ScreensaverLayer } from '@/components/Screensaver/ScreensaverLayer.tsx'
import { PopupLayer } from '@/components/Popups/PopupLayer.tsx'
import { WindowLayer } from '@/components/Window/WindowLayer.tsx'
import { ContextMenu } from '@/components/ui/ContextMenu.tsx'
import type { MenuNode } from '@/components/ui/menu.types.ts'
import {
  folderContextMenu,
  itemContextMenu,
} from '@/components/ui/shellMenus.ts'
import {
  DESKTOP_ID,
  fs,
  getChildren,
  getNode,
  sizeOf,
  typeLabel,
  useFsVersion,
} from '@/os/fs.ts'
import type { FsNode, ShortcutTarget } from '@/os/fs.ts'
import {
  CELL_H,
  CELL_W,
  cellToPx,
  desktop,
  layout,
  useDesktopOptions,
  snapToCell,
  usePositions,
} from '@/os/desktop.ts'
import { clearDropHover, dropTargetAt, performDrop, trackDropHover } from '@/os/dnd.ts'
import { clipboard, openNode, useClipboard } from '@/os/shell.ts'
import { wm } from '@/os/windowStore.ts'
import { TurnOffDialog } from '@/components/Shutdown/TurnOffDialog.tsx'
import { useShutdownPrompt } from '@/os/shutdown.ts'
import { screensaver } from '@/os/screensaver.ts'
import { buddy, useCarriedIcons } from '@/os/buddy.ts'
import { useDisplay } from '@/os/display.ts'
import { wallpaperLook } from '@/os/wallpaper.ts'
import { DesktopIcon } from './DesktopIcon.tsx'
import './Desktop.css'

/** Movement below this is a click, not a drag. */
const DRAG_SLOP = 4

type ArrangeKey = 'name' | 'size' | 'type' | 'modified'

/**
 * How the type groups are ordered: system folders first, then real folders, then links,
 * then documents. Ranked deliberately rather than sorted by the label's spelling —
 * alphabetically "Shortcut" precedes "System Folder", which buries My Computer below a
 * pile of links and is not how the shell ever grouped them.
 */
const TYPE_RANK = (node: FsNode) =>
  node.system ? 0 : node.kind === 'folder' ? 1 : node.kind === 'shortcut' ? 2 : 3

/**
 * The four keys XP offered, each with the comparator behind it.
 *
 * `localeCompare` rather than `<`, so `Netscape` and `notepad` sort together instead of
 * every capital letter coming first. Ties fall back to the name, which keeps every sort
 * stable and repeatable — arranging twice by Type must not shuffle the icons about.
 */
const ARRANGERS: {
  id: ArrangeKey
  label: string
  compare: (a: FsNode, b: FsNode) => number
}[] = [
  {
    id: 'name',
    label: '&Name',
    compare: (a, b) => a.name.localeCompare(b.name),
  },
  {
    id: 'size',
    label: 'Si&ze',
    compare: (a, b) => sizeOf(b) - sizeOf(a) || a.name.localeCompare(b.name),
  },
  {
    id: 'type',
    label: '&Type',
    compare: (a, b) =>
      TYPE_RANK(a) - TYPE_RANK(b) ||
      typeLabel(a).localeCompare(typeLabel(b)) ||
      a.name.localeCompare(b.name),
  },
  {
    id: 'modified',
    label: 'Modifie&d',
    // Oldest first, the way clicking the column in Explorer sorted it.
    compare: (a, b) => a.modified - b.modified || a.name.localeCompare(b.name),
  },
]

interface Band {
  x: number
  y: number
  w: number
  h: number
}

/** One icon being carried, with the position it started from. */
interface Mover {
  id: string
  el: HTMLDivElement
  home: { x: number; y: number }
}

/**
 * Clicks that count as bare desktop. The wallpaper and both layers fill the
 * screen, so a strict `target === currentTarget` test would never match — and the
 * window layer counts because it is `pointer-events: none` except for the windows
 * themselves, so a click reaching it landed between them.
 */
function isBareDesktop(e: { target: EventTarget; currentTarget: EventTarget }) {
  const target = e.target
  if (!(target instanceof HTMLElement)) return false
  return (
    target === e.currentTarget ||
    target.classList.contains('xp-wallpaper') ||
    target.classList.contains('xp-icon-layer') ||
    target.classList.contains('xp-window-layer')
  )
}

const sameSet = (a: Set<string>, b: Set<string>) =>
  a.size === b.size && [...a].every((id) => b.has(id))

export function Desktop() {
  useFsVersion()
  usePositions()
  const clip = useClipboard()
  const turningOff = useShutdownPrompt()
  // Icons Bongo is carrying, drawn at his hand instead of in their cell. A selector
  // rather than the whole buddy list, so his moods and chatter don't re-render this.
  const carriedIcons = useCarriedIcons()
  const options = useDesktopOptions()

  // Watching for idleness belongs to the desktop's lifetime: armed when the shell comes
  // up, disarmed when it goes away, so nothing polls at a machine that is switched off.
  useEffect(() => {
    screensaver.arm()
    return () => screensaver.disarm()
  }, [])

  /** Sort the desktop by one of the four keys, then let the store place them. */
  const arrangeBy = (key: ArrangeKey) => {
    const nodes = getChildren(DESKTOP_ID)
    const compare = ARRANGERS.find((a) => a.id === key)?.compare
    if (!compare) return
    desktop.arrange([...nodes].sort(compare).map((n) => n.id))
  }
  const displaySettings = useDisplay()
  // A picture out of the filesystem is held by node id, so it has to be looked up
  // every render — deleting the file falls the desktop back to the colour.
  const wallpaper = wallpaperLook(
    displaySettings,
    displaySettings.wallpaper.kind === 'file'
      ? getNode(displaySettings.wallpaper.nodeId)
      : undefined,
  )

  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [editing, setEditing] = useState<string | null>(null)
  const [menu, setMenu] = useState<{ x: number; y: number; items: MenuNode[] } | null>(
    null,
  )
  /** The rubber band, in icon-layer coordinates. Null when not dragging one. */
  const [band, setBand] = useState<Band | null>(null)
  // Bumped purely to force a re-render; the value itself is never read.
  const [, bump] = useState(0)

  const layerRef = useRef<HTMLDivElement>(null)
  /** Live icon elements, so a group drag can write every transform. */
  const iconEls = useRef(new Map<string, HTMLDivElement>())
  /** Tears down whichever gesture is in flight. */
  const endGesture = useRef<(() => void) | null>(null)

  const items = getChildren(DESKTOP_ID)
  // Recomputed every render rather than memoized: it's a handful of items, and
  // the resize bump plus the fs and position subscriptions already drive the
  // re-renders that matter.
  const cells = layout(items.map((i) => i.id))

  // No browser context menu anywhere in the shell.
  useEffect(() => {
    const block = (e: MouseEvent) => e.preventDefault()
    document.addEventListener('contextmenu', block)
    return () => document.removeEventListener('contextmenu', block)
  }, [])

  // Re-flow so nothing strands below the taskbar when the viewport shrinks.
  useEffect(() => {
    const onResize = () => bump((t) => t + 1)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  // Forget stored positions for icons that no longer exist.
  useEffect(() => {
    desktop.prune(new Set(items.map((i) => i.id)))
  }, [items])

  useEffect(() => () => endGesture.current?.(), [])

  const startRename = (id: string) => {
    setSelected(new Set([id]))
    setEditing(id)
  }

  /** Delete acts on the whole selection, falling back to the item clicked. */
  const recycleSelection = (node: FsNode) => {
    const ids = selected.has(node.id) ? [...selected] : [node.id]
    for (const id of ids) fs.recycle(id)
    setSelected(new Set())
  }

  const paste = () => {
    if (!clip) return
    if (clip.mode === 'cut') fs.move(clip.nodeId, DESKTOP_ID)
    else fs.copy(clip.nodeId, DESKTOP_ID)
    clipboard.clear()
  }

  // ------------------------------------------------------------- gestures

  /** Every icon's box in layer coordinates, for hit-testing the rubber band. */
  const iconBoxes = () =>
    items.flatMap((node) => {
      const cell = cells.get(node.id)
      if (!cell) return []
      const at = cellToPx(cell.col, cell.row)
      return [{ id: node.id, ...at }]
    })

  /**
   * Rubber-band selection. Runs on document listeners so the band survives the
   * pointer leaving the desktop, and only starts after `DRAG_SLOP` so an ordinary
   * click to deselect doesn't flash a one-pixel rectangle.
   */
  const beginMarquee = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (endGesture.current || !layerRef.current) return
    // Annotated so the null check survives into the hoisted handlers below.
    const layer: DOMRect = layerRef.current.getBoundingClientRect()

    // Ctrl adds to what's already selected, as it does in Explorer.
    const base = e.ctrlKey || e.metaKey ? new Set(selected) : new Set<string>()
    const boxes = iconBoxes()
    const ox = e.clientX - layer.left
    const oy = e.clientY - layer.top
    const pointerId = e.pointerId
    let started = false
    let shown = base

    function onMove(ev: PointerEvent) {
      if (ev.pointerId !== pointerId) return
      const x = ev.clientX - layer.left
      const y = ev.clientY - layer.top
      if (!started && Math.abs(x - ox) + Math.abs(y - oy) <= DRAG_SLOP) return
      started = true

      const rect = {
        x: Math.min(ox, x),
        y: Math.min(oy, y),
        w: Math.abs(x - ox),
        h: Math.abs(y - oy),
      }
      setBand(rect)

      // Any overlap with the icon's cell counts, which is the forgiving version
      // and what the real thing feels like.
      const hits = boxes.filter(
        (b) =>
          b.x < rect.x + rect.w &&
          b.x + CELL_W > rect.x &&
          b.y < rect.y + rect.h &&
          b.y + CELL_H > rect.y,
      )
      const next = new Set([...base, ...hits.map((h) => h.id)])
      // Only re-render when the selection actually changed, not every frame.
      if (!sameSet(next, shown)) {
        shown = next
        setSelected(next)
      }
    }

    function finish(ev: PointerEvent) {
      if (ev.pointerId !== pointerId) return
      cleanup()
      setBand(null)
    }

    function cleanup() {
      endGesture.current = null
      document.removeEventListener('pointermove', onMove)
      document.removeEventListener('pointerup', finish)
      document.removeEventListener('pointercancel', finish)
    }

    endGesture.current = () => {
      cleanup()
      setBand(null)
    }
    document.addEventListener('pointermove', onMove)
    document.addEventListener('pointerup', finish)
    document.addEventListener('pointercancel', finish)
  }

  /**
   * Dragging icons. Moves the whole selection when the grabbed icon is part of
   * one, which is why this lives here rather than in DesktopIcon: it needs every
   * icon's element and starting cell.
   */
  const beginIconDrag = (
    e: ReactPointerEvent<HTMLDivElement>,
    node: FsNode,
    selection: Set<string>,
  ) => {
    if (endGesture.current) return
    const ids = selection.has(node.id) ? [...selection] : [node.id]
    const movers: Mover[] = ids.flatMap((id) => {
      const el = iconEls.current.get(id)
      const cell = cells.get(id)
      return el && cell ? [{ id, el, home: cellToPx(cell.col, cell.row) }] : []
    })
    if (!movers.length) return

    const pointerId = e.pointerId
    const fromX = e.clientX
    const fromY = e.clientY
    /** A plain click on an already-multi-selected icon collapses it on release. */
    const collapses = selection.size > 1 && selection.has(node.id)
    let moved = false
    let hover: Element | null = null

    function onMove(ev: PointerEvent) {
      if (ev.pointerId !== pointerId) return
      const dx = ev.clientX - fromX
      const dy = ev.clientY - fromY
      if (!moved && Math.abs(dx) + Math.abs(dy) <= DRAG_SLOP) return
      moved = true

      for (const m of movers) {
        m.el.style.transform = `translate(${m.home.x + dx}px, ${m.home.y + dy}px)`
        m.el.style.zIndex = '5'
        // The icons travel under the pointer, so they'd hit-test themselves.
        m.el.style.pointerEvents = 'none'
      }
      hover = trackDropHover(node, ev.clientX, ev.clientY, hover)
    }

    function finish(ev: PointerEvent) {
      if (ev.pointerId !== pointerId) return
      const dropped = moved ? dropTargetAt(ev.clientX, ev.clientY) : undefined
      const dx = ev.clientX - fromX
      const dy = ev.clientY - fromY

      clearDropHover(hover)
      for (const m of movers) {
        m.el.style.zIndex = ''
        m.el.style.pointerEvents = ''
      }
      cleanup()

      if (!moved) {
        if (collapses) setSelected(new Set([node.id]))
        return
      }

      // Dropped onto something that takes them: everything but the target itself.
      if (dropped) {
        const handled = movers
          .filter((m) => m.id !== dropped.id)
          .map((m) => getNode(m.id))
          .filter((n): n is FsNode => !!n)
          .map((n) => performDrop(n, dropped))
          .some(Boolean)

        if (handled) {
          setSelected(new Set())
          // Whatever stayed behind is still wearing the drag's transform, and its
          // cell hasn't changed — so React won't re-render it. Put it back.
          for (const m of movers) {
            if (getNode(m.id)?.parentId === DESKTOP_ID) {
              m.el.style.transform = `translate(${m.home.x}px, ${m.home.y}px)`
            }
          }
          return
        }
      }

      // Otherwise it's a reposition. Commit every cell in one write, then set the
      // final transforms: an icon that landed back on its own cell has an
      // unchanged style prop, so React would never write over the preview.
      const placed = desktop.moveMany(
        movers.map((m) => ({
          id: m.id,
          ...snapToCell(m.home.x + dx, m.home.y + dy),
        })),
        cells,
      )
      for (const m of movers) {
        const cell = placed.get(m.id)
        if (!cell) continue
        const at = cellToPx(cell.col, cell.row)
        m.el.style.transform = `translate(${at.x}px, ${at.y}px)`
      }

      // Auto Arrange: the icon lands where you dropped it and then everything closes up
      // behind it. The transforms above are written first on purpose — compacting
      // re-renders every icon from its new cell, which overwrites them.
      if (desktop.options().autoArrange) {
        desktop.compact(getChildren(DESKTOP_ID).map((n) => n.id))
      }
    }

    function cleanup() {
      endGesture.current = null
      document.removeEventListener('pointermove', onMove)
      document.removeEventListener('pointerup', finish)
      document.removeEventListener('pointercancel', finish)
    }

    endGesture.current = cleanup
    document.addEventListener('pointermove', onMove)
    document.addEventListener('pointerup', finish)
    document.addEventListener('pointercancel', finish)
  }

  /** Settle the selection, then arm a drag. */
  const onIconPointerDown = (
    e: ReactPointerEvent<HTMLDivElement>,
    node: FsNode,
  ) => {
    // Keeps the desktop's own handler from clearing what we just selected. The
    // Start menu still closes: its outside-click listener is on the document in
    // the capture phase and sees this first.
    e.stopPropagation()
    if (editing === node.id || e.button !== 0) return

    if (e.ctrlKey || e.metaKey || e.shiftKey) {
      // A modifier-click toggles membership and never starts a drag.
      const next = new Set(selected)
      if (next.has(node.id)) next.delete(node.id)
      else next.add(node.id)
      setSelected(next)
      return
    }

    // An icon already in a multi-selection keeps it, so the group can be dragged;
    // releasing without moving is what collapses it.
    let selection = selected
    if (!selected.has(node.id)) {
      selection = new Set([node.id])
      setSelected(selection)
    }
    beginIconDrag(e, node, selection)
  }

  // ------------------------------------------------------------- menus

  const desktopMenu = folderContextMenu({
    onNewFolder: () => startRename(fs.createFolder(DESKTOP_ID)),
    onNewFile: () => startRename(fs.createFile(DESKTOP_ID)),
    onNewShortcut: (target: ShortcutTarget, label: string) =>
      startRename(fs.createShortcut(DESKTOP_ID, target, label)),
    onPaste: paste,
    canPaste: !!clip,
    onRefresh: () => bump((t) => t + 1),
    // The way almost everybody actually opened Display Properties.
    onProperties: () => wm.openApp('displayProperties'),
    extras: [
      {
        id: 'arrange',
        label: 'Arra&nge Icons By',
        submenu: [
          ...ARRANGERS.map((a) => ({
            id: `arr-${a.id}`,
            label: a.label,
            onSelect: () => arrangeBy(a.id),
          })),
          { kind: 'separator' as const },
          {
            id: 'arr-auto',
            label: 'Auto Arra&nge',
            checked: options.autoArrange,
            onSelect: () => {
              const next = !options.autoArrange
              desktop.setOption('autoArrange', next)
              // Turning it on closes the gaps immediately, rather than waiting for the
              // next drop to reveal that it did anything.
              if (next) desktop.compact(getChildren(DESKTOP_ID).map((n) => n.id))
            },
          },
          {
            // Always on here: there is no free positioning to align *from*. Every icon
            // lives in a cell, so this is the state XP left it in, greyed because
            // turning it off isn't something this desktop can do.
            id: 'arr-align',
            label: 'Align to &Grid',
            checked: true,
            disabled: true,
          },
          { kind: 'separator' as const },
          {
            id: 'arr-show',
            label: '&Show Desktop Icons',
            checked: options.showIcons,
            onSelect: () => desktop.setOption('showIcons', !options.showIcons),
          },
        ],
      },
    ],
  })

  const iconMenu = (node: FsNode) =>
    itemContextMenu({
      node,
      onOpen: () => openNode(node),
      onRename: () => startRename(node.id),
      onDelete: () => recycleSelection(node),
      onCut: () => clipboard.set(node.id, 'cut'),
      onCopy: () => clipboard.set(node.id, 'copy'),
      onCreateShortcut: () =>
        fs.createShortcut(
          DESKTOP_ID,
          { kind: 'node', nodeId: node.id },
          `Shortcut to ${node.name}`,
        ),
    })

  return (
    <div
      className="xp-desktop"
      onPointerDown={(e) => {
        // Deliberately does NOT clear `editing`: that would unmount the rename
        // input before its onBlur could commit, discarding the name.
        wm.setStartMenu(false)
        // Ctrl is how you add to a selection, so it must not clear it first —
        // otherwise the icons blink off until the band's first move restores them.
        if (!e.ctrlKey && !e.metaKey) setSelected(new Set())
        if (e.button === 0 && isBareDesktop(e)) beginMarquee(e)
      }}
      onContextMenu={(e) => {
        e.preventDefault()
        if (!isBareDesktop(e)) return
        setMenu({ x: e.clientX, y: e.clientY, items: desktopMenu })
      }}
    >
      <div
        className={`xp-wallpaper ${wallpaper.className}`.trim()}
        style={wallpaper.style}
      />

      {/* The layer stays mounted with Show Desktop Icons off — the rubber band and the
          right-click that turns them back on both live on it, and the icons themselves
          are simply not rendered. */}
      <div className="xp-icon-layer" ref={layerRef}>
        {(options.showIcons ? items : []).map((node) => {
          const cell = cells.get(node.id) ?? { col: 0, row: 0 }
          return (
            <DesktopIcon
              key={node.id}
              node={node}
              cell={cell}
              carriedTo={carriedIcons.get(node.id) ?? null}
              selected={selected.has(node.id)}
              cut={clip?.mode === 'cut' && clip.nodeId === node.id}
              editing={editing === node.id}
              registerEl={(el) => {
                if (el) iconEls.current.set(node.id, el)
                else iconEls.current.delete(node.id)
              }}
              onPointerDown={(e) => {
                // Taking it off him: otherwise his carry and this drag would both be
                // writing the same element's transform.
                buddy.release(node.id)
                onIconPointerDown(e, node)
              }}
              onOpen={() => openNode(node)}
              onContextMenu={(e) => {
                e.preventDefault()
                e.stopPropagation()
                // Right-clicking outside the selection replaces it, as in XP.
                if (!selected.has(node.id)) setSelected(new Set([node.id]))
                setMenu({ x: e.clientX, y: e.clientY, items: iconMenu(node) })
              }}
              onCommitName={(label) => {
                fs.rename(node.id, label)
                setEditing(null)
              }}
              onCancelName={() => setEditing(null)}
              onDelete={() => recycleSelection(node)}
            />
          )
        })}

        {band && (
          <div
            className="xp-marquee"
            style={{ left: band.x, top: band.y, width: band.w, height: band.h }}
          />
        )}
      </div>

      <WindowLayer />
      {/* Above the windows, below the taskbar — see PopupLayer.css. */}
      <PopupLayer />
      {/* Above both, still below the taskbar — see Buddy.css. */}
      <BuddyLayer />
      <Taskbar />

      {menu && (
        <ContextMenu
          x={menu.x}
          y={menu.y}
          items={menu.items}
          onDismiss={() => setMenu(null)}
        />
      )}

      {/* Last, and over everything: while this is up nothing behind it is reachable. */}
      {turningOff && <TurnOffDialog />}

      {/* Over even that — walking away mid-question should still blank the screen. */}
      <ScreensaverLayer />
    </div>
  )
}
