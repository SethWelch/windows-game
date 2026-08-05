import { clamp } from '@/os/constants.ts'

/**
 * Minesweeper board rules, kept pure and free of React.
 *
 * Every operation returns a new `Board` rather than mutating one, so the
 * component can hold the board in ordinary state and let identity drive renders.
 * Cells live in one flat row-major array — `neighbors()` is the only place that
 * converts an index back into a row and column.
 */

export type CellState = 'hidden' | 'revealed' | 'flagged' | 'marked'

export interface Cell {
  mine: boolean
  /** Mines among the 8 surrounding cells. Zero until the mines are laid. */
  adjacent: number
  state: CellState
  /** The one mine that ended the game — drawn on a red ground. */
  detonated?: boolean
}

export type GameStatus = 'ready' | 'playing' | 'won' | 'lost'

export interface Level {
  rows: number
  cols: number
  mines: number
}

export interface Board extends Level {
  cells: Cell[]
  status: GameStatus
  /** Safe cells still covered. Reaching 0 is exactly the win condition. */
  remaining: number
}

export const LEVELS = {
  beginner: { rows: 9, cols: 9, mines: 10 },
  intermediate: { rows: 16, cols: 16, mines: 40 },
  expert: { rows: 16, cols: 30, mines: 99 },
} as const

/** The three presets plus hand-entered dimensions, which keep no best time. */
export type LevelName = keyof typeof LEVELS | 'custom'

export const LIMITS = {
  rows: { min: 9, max: 24 },
  cols: { min: 9, max: 30 },
} as const

/** Which preset a size matches, or 'custom'. Keeps the Game menu's radio honest. */
export function levelNameFor(level: Level): LevelName {
  for (const [name, preset] of Object.entries(LEVELS)) {
    if (
      preset.rows === level.rows &&
      preset.cols === level.cols &&
      preset.mines === level.mines
    ) {
      return name as LevelName
    }
  }
  return 'custom'
}

/**
 * Custom Field accepts anything; the real game silently clamps it. The mine cap
 * is `(rows - 1) * (cols - 1)`, which is what winmine used — it leaves a border's
 * worth of safe squares rather than allowing an almost-solid field.
 */
export function normalizeLevel(level: Level): Level {
  const rows = clamp(Math.trunc(level.rows) || LIMITS.rows.min, LIMITS.rows.min, LIMITS.rows.max)
  const cols = clamp(Math.trunc(level.cols) || LIMITS.cols.min, LIMITS.cols.min, LIMITS.cols.max)
  const mines = clamp(Math.trunc(level.mines) || 1, 1, (rows - 1) * (cols - 1))
  return { rows, cols, mines }
}

export function createBoard(level: Level): Board {
  const { rows, cols, mines } = normalizeLevel(level)
  return {
    rows,
    cols,
    mines,
    cells: Array.from({ length: rows * cols }, () => ({
      mine: false,
      adjacent: 0,
      state: 'hidden' as CellState,
    })),
    status: 'ready',
    remaining: rows * cols - mines,
  }
}

/** Indices of the up-to-8 cells touching `i`. */
export function neighbors(size: Pick<Level, 'rows' | 'cols'>, i: number): number[] {
  const r = Math.floor(i / size.cols)
  const c = i % size.cols
  const out: number[] = []
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue
      const nr = r + dr
      const nc = c + dc
      if (nr < 0 || nr >= size.rows || nc < 0 || nc >= size.cols) continue
      out.push(nr * size.cols + nc)
    }
  }
  return out
}

export const flagCount = (b: Board) =>
  b.cells.reduce((n, c) => n + (c.state === 'flagged' ? 1 : 0), 0)

/** What the left LED panel shows. Goes negative once you over-flag, as it should. */
export const minesLeft = (b: Board) => b.mines - flagCount(b)

/**
 * Mines are laid on the first reveal, never under it — the same guarantee the
 * real game gives by relocating a first-click mine. Neighbours stay fair game,
 * so an opening move can still be a lone 5 with no free space around it.
 */
function layMines(board: Board, safe: number): Board {
  const cells = board.cells.map((c) => ({ ...c }))

  const pool: number[] = []
  for (let i = 0; i < cells.length; i++) if (i !== safe) pool.push(i)

  // Partial Fisher-Yates: only the first `mines` slots have to be settled.
  const count = Math.min(board.mines, pool.length)
  for (let k = 0; k < count; k++) {
    const j = k + Math.floor(Math.random() * (pool.length - k))
    const swap = pool[k]
    pool[k] = pool[j]
    pool[j] = swap
    cells[pool[k]].mine = true
  }

  for (let i = 0; i < cells.length; i++) {
    cells[i].adjacent = neighbors(board, i).filter((n) => cells[n].mine).length
  }
  return { ...board, cells, status: 'playing' }
}

/** Clearing the last safe cell auto-flags the mines, as the real game does. */
function settle(b: Board): Board {
  if (b.remaining > 0) return b
  return {
    ...b,
    status: 'won',
    cells: b.cells.map((c) =>
      c.mine && c.state !== 'flagged' ? { ...c, state: 'flagged' } : c,
    ),
  }
}

/**
 * Losing uncovers every mine you missed. Flags left on safe squares keep their
 * `flagged` state — the renderer crosses them out, since "flagged but not a
 * mine" is already the whole definition of a wrong guess.
 */
function detonate(b: Board, hit: number): Board {
  return {
    ...b,
    status: 'lost',
    cells: b.cells.map((c, j) =>
      c.mine && c.state !== 'flagged'
        ? { ...c, state: 'revealed', detonated: j === hit }
        : c,
    ),
  }
}

/** Uncover `i`, flooding outward while the count is zero. */
export function reveal(board: Board, i: number): Board {
  if (board.status === 'won' || board.status === 'lost') return board
  // Flagged and ?-marked cells are protected — that is what marking them is for.
  if (board.cells[i].state !== 'hidden') return board

  const b = board.status === 'ready' ? layMines(board, i) : board
  if (b.cells[i].mine) return detonate(b, i)

  const cells = b.cells.map((c) => ({ ...c }))
  let remaining = b.remaining
  const stack = [i]
  while (stack.length) {
    const j = stack.pop()!
    const cell = cells[j]
    if (cell.state !== 'hidden') continue
    cell.state = 'revealed'
    remaining--
    // A numbered cell reveals itself and stops; only blanks spread.
    if (cell.adjacent === 0) {
      for (const n of neighbors(b, j)) {
        if (cells[n].state === 'hidden') stack.push(n)
      }
    }
  }
  return settle({ ...b, cells, remaining })
}

/** Right-click: hidden → flag → ? → hidden, skipping ? when Marks is off. */
export function cycleMark(board: Board, i: number, marks: boolean): Board {
  if (board.status === 'won' || board.status === 'lost') return board
  const cell = board.cells[i]
  if (cell.state === 'revealed') return board

  const next: CellState =
    cell.state === 'hidden' ? 'flagged' : cell.state === 'flagged' && marks ? 'marked' : 'hidden'

  const cells = board.cells.slice()
  cells[i] = { ...cell, state: next }
  return { ...board, cells }
}

/**
 * Chord: open every hidden neighbour of a revealed number once it carries as many
 * flags as its count. Miscounted flags blow up, which is the point of the risk.
 */
export function chord(board: Board, i: number): Board {
  if (board.status !== 'playing') return board
  const cell = board.cells[i]
  if (cell.state !== 'revealed' || cell.adjacent === 0) return board

  const around = neighbors(board, i)
  const flags = around.filter((n) => board.cells[n].state === 'flagged').length
  if (flags !== cell.adjacent) return board

  let next = board
  for (const n of around) {
    next = reveal(next, n)
    if (next.status === 'lost') break
  }
  return next
}

/** Which cells a chord would open — the set that shows depressed while held. */
export function chordTargets(board: Board, i: number): number[] {
  const cell = board.cells[i]
  if (cell.state !== 'revealed') return [i]
  return neighbors(board, i).filter((n) => board.cells[n].state === 'hidden')
}
