import { useSyncExternalStore } from 'react'

/**
 * Desktop icon *positions* only. The icons themselves are whatever lives in the
 * Desktop folder — XP kept layout in the registry, separate from the filesystem,
 * and the same split keeps view state out of os/fs.ts.
 */

/** Grid geometry. Must match the cell size assumed in Desktop.css. */
export const CELL_W = 80
export const CELL_H = 78
export const GRID_X = 4
export const GRID_Y = 8

const KEY = 'xp:desktop'

type Positions = Record<string, { col: number; row: number }>

function load(): Positions {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as { positions?: Positions }
    return parsed.positions ?? {}
  } catch {
    return {}
  }
}

let positions = load()
const listeners = new Set<() => void>()

function commit() {
  positions = { ...positions }
  try {
    localStorage.setItem(KEY, JSON.stringify({ positions }))
  } catch {
    // Layout just won't survive a reload.
  }
  listeners.forEach((l) => l())
}

const cellKey = (col: number, row: number) => `${col},${row}`

export function maxRow(): number {
  const h = typeof window === 'undefined' ? 800 : window.innerHeight
  return Math.max(0, Math.floor((h - 30 - GRID_Y) / CELL_H) - 1)
}

export const cellToPx = (col: number, row: number) => ({
  x: GRID_X + col * CELL_W,
  y: GRID_Y + row * CELL_H,
})

export const snapToCell = (x: number, y: number) => ({
  col: Math.max(0, Math.round((x - GRID_X) / CELL_W)),
  row: Math.max(0, Math.min(maxRow(), Math.round((y - GRID_Y) / CELL_H))),
})

/**
 * Assign a cell to every id, honouring stored positions where they are still
 * usable and filling the rest column-major, the order XP filled the desktop in.
 */
export function layout(ids: string[]): Map<string, { col: number; row: number }> {
  const out = new Map<string, { col: number; row: number }>()
  const taken = new Set<string>()
  const limit = maxRow()

  const pending: string[] = []
  for (const id of ids) {
    const p = positions[id]
    // Reject a stored cell that is occupied or has fallen below the taskbar.
    if (p && p.row <= limit && !taken.has(cellKey(p.col, p.row))) {
      taken.add(cellKey(p.col, p.row))
      out.set(id, p)
    } else {
      pending.push(id)
    }
  }

  let col = 0
  let row = 0
  for (const id of pending) {
    while (taken.has(cellKey(col, row))) {
      row++
      if (row > limit) {
        row = 0
        col++
      }
    }
    taken.add(cellKey(col, row))
    out.set(id, { col, row })
  }
  return out
}

/** The requested cell, or the nearest free one — XP never stacked two icons. */
function freeCellNear(
  col: number,
  row: number,
  taken: Set<string>,
): { col: number; row: number } {
  if (!taken.has(cellKey(col, row))) return { col, row }

  const limit = maxRow()
  let best: { col: number; row: number } | null = null
  let bestD = Infinity
  for (let c = 0; c < 32; c++) {
    for (let r = 0; r <= limit; r++) {
      if (taken.has(cellKey(c, r))) continue
      const d = (c - col) ** 2 + (r - row) ** 2
      if (d < bestD) {
        bestD = d
        best = { col: c, row: r }
      }
    }
  }
  return best ?? { col, row }
}

export const desktop = {
  /**
   * Park several items at once, in one commit — dragging a selection moves the
   * whole group, and N separate commits would be N writes and N renders. Items
   * are placed in order, each avoiding the ones already down.
   *
   * Returns where everything actually landed, which is not always what was asked
   * for: callers write the final transforms from it.
   */
  moveMany(
    moves: { id: string; col: number; row: number }[],
    occupied: Map<string, { col: number; row: number }>,
  ): Map<string, { col: number; row: number }> {
    const moving = new Set(moves.map((m) => m.id))
    const taken = new Set<string>()
    for (const [id, cell] of occupied) {
      if (!moving.has(id)) taken.add(cellKey(cell.col, cell.row))
    }

    const placed = new Map<string, { col: number; row: number }>()
    for (const m of moves) {
      const cell = freeCellNear(m.col, m.row, taken)
      taken.add(cellKey(cell.col, cell.row))
      positions[m.id] = cell
      placed.set(m.id, cell)
    }
    commit()
    return placed
  },

  /** Park one item. Returns the cell actually used. */
  move(
    id: string,
    col: number,
    row: number,
    occupied: Map<string, { col: number; row: number }>,
  ): { col: number; row: number } {
    return desktop.moveMany([{ id, col, row }], occupied).get(id) ?? { col, row }
  },

  /** Drop stored positions for ids that no longer exist. */
  prune(validIds: Set<string>) {
    let changed = false
    for (const id of Object.keys(positions)) {
      if (!validIds.has(id)) {
        delete positions[id]
        changed = true
      }
    }
    if (changed) commit()
  },

  bump() {
    commit()
  },
}

export function usePositions(): Positions {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l)
      return () => listeners.delete(l)
    },
    () => positions,
    () => positions,
  )
}
