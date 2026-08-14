import { BRICK, CELLS, END, GRID, OPEN, POSTER, START } from './constants.ts'

/**
 * Maze generation, and the pathfinding the autopilot steers by.
 *
 * The maze is a **tile grid**, not a graph of cells with edges between them, because the
 * only question the renderer ever asks is "is this tile solid". Odd coordinates are cell
 * interiors, even ones are the wall lattice, and the border ring is always solid — which
 * is what guarantees a ray always hits something and the DDA loop always terminates.
 */

/**
 * mulberry32. Small, fast, and good enough that corridors don't visibly repeat.
 *
 * Seeded rather than `Math.random()` so a maze is reproducible from its seed — which makes
 * it testable, and means a given screen saver session is one maze rather than a different
 * one each frame if anything ever rebuilt it.
 */
export function rng(seed: number): () => number {
  let s = seed >>> 0
  return () => {
    s = (s + 0x6d2b79f5) >>> 0
    let t = Math.imul(s ^ (s >>> 15), 1 | s)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/**
 * A stable pseudo-random value for a coordinate pair.
 *
 * A pure function of position, so it returns the same thing on every call forever. That is
 * the property the decorations need: `Math.random()` would put the posters somewhere else
 * every time anything recomputed them — the same reason the media player's visualiser uses
 * `Math.sin(i)` for its bar heights.
 */
export const hash = (x: number, y: number) => {
  const v = Math.sin(x * 127.1 + y * 311.7) * 43758.5453
  return v - Math.floor(v)
}

export interface Maze {
  grid: Uint8Array
  /** Where the camera starts, in tile coordinates. */
  startX: number
  startY: number
  /** The open tile in front of the END sign — what the autopilot aims for. */
  endX: number
  endY: number
}

const at = (x: number, y: number) => y * GRID + x

/**
 * Carve with an iterative randomised depth-first search — a recursive backtracker.
 *
 * Deliberately not Prim's or Kruskal's: those give a bushy maze full of short dead ends,
 * while the backtracker gives long serpentine corridors with the occasional long dead end,
 * which is what walking through the original actually felt like. Iterative rather than
 * recursive because the stack depth is the cell count, and an explicit `Int32Array` costs
 * nothing to write.
 */
export function generate(seed: number): Maze {
  const random = rng(seed)
  const grid = new Uint8Array(GRID * GRID).fill(BRICK)
  const visited = new Uint8Array(CELLS * CELLS)
  const stack = new Int32Array(CELLS * CELLS)
  let top = 0

  const cellToTile = (c: number) => c * 2 + 1

  stack[top++] = 0
  visited[0] = 1
  grid[at(cellToTile(0), cellToTile(0))] = OPEN

  while (top > 0) {
    const cell = stack[top - 1]
    const cx = cell % CELLS
    const cy = (cell / CELLS) | 0

    // Neighbours two tiles away that haven't been reached yet.
    const options: number[] = []
    if (cy > 0 && !visited[cell - CELLS]) options.push(0)
    if (cx < CELLS - 1 && !visited[cell + 1]) options.push(1)
    if (cy < CELLS - 1 && !visited[cell + CELLS]) options.push(2)
    if (cx > 0 && !visited[cell - 1]) options.push(3)

    if (!options.length) {
      top--
      continue
    }

    const dir = options[(random() * options.length) | 0]
    const dx = dir === 1 ? 1 : dir === 3 ? -1 : 0
    const dy = dir === 2 ? 1 : dir === 0 ? -1 : 0
    const nx = cx + dx
    const ny = cy + dy

    // Open the cell and the wall between, which is the tile halfway.
    grid[at(cellToTile(cx) + dx, cellToTile(cy) + dy)] = OPEN
    grid[at(cellToTile(nx), cellToTile(ny))] = OPEN
    const next = ny * CELLS + nx
    visited[next] = 1
    stack[top++] = next
  }

  const startX = cellToTile(0)
  const startY = cellToTile(0)

  // The end goes as far from the start as the maze allows, so finding it means crossing it.
  const dist = distances(grid, startX, startY)
  let best = -1
  let endX = startX
  let endY = startY
  for (let y = 1; y < GRID; y += 2) {
    for (let x = 1; x < GRID; x += 2) {
      const d = dist[at(x, y)]
      if (d > best) {
        best = d
        endX = x
        endY = y
      }
    }
  }

  decorate(grid, startX, startY, endX, endY)
  return { grid, startX, startY, endX, endY }
}

/**
 * Breadth-first distance in tiles from one open tile to every other, or -1 where
 * unreachable. Used to place the end, to build routes, and to assert in tests that the
 * whole maze is connected.
 */
export function distances(grid: Uint8Array, fromX: number, fromY: number): Int32Array {
  const dist = new Int32Array(GRID * GRID).fill(-1)
  const queue = new Int32Array(GRID * GRID)
  let head = 0
  let tail = 0

  dist[at(fromX, fromY)] = 0
  queue[tail++] = at(fromX, fromY)

  while (head < tail) {
    const here = queue[head++]
    const x = here % GRID
    const y = (here / GRID) | 0
    const d = dist[here]
    for (let i = 0; i < 4; i++) {
      const nx = x + (i === 1 ? 1 : i === 3 ? -1 : 0)
      const ny = y + (i === 2 ? 1 : i === 0 ? -1 : 0)
      if (nx < 0 || ny < 0 || nx >= GRID || ny >= GRID) continue
      const idx = at(nx, ny)
      if (grid[idx] !== OPEN || dist[idx] !== -1) continue
      dist[idx] = d + 1
      queue[tail++] = idx
    }
  }
  return dist
}

/**
 * The shortest route between two open tiles, as tile centres, excluding the start.
 * Empty if there is no path — which the border ring makes impossible from an open tile,
 * but the caller shouldn't have to know that.
 */
export function route(
  grid: Uint8Array,
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
): { x: number; y: number }[] {
  // Searched backwards from the destination, so following the falling distance from the
  // start needs no predecessor array at all.
  const dist = distances(grid, toX, toY)
  const start = at(fromX, fromY)
  if (dist[start] < 0) return []

  const out: { x: number; y: number }[] = []
  let x = fromX
  let y = fromY
  let d = dist[start]
  while (d > 0) {
    let moved = false
    for (let i = 0; i < 4; i++) {
      const nx = x + (i === 1 ? 1 : i === 3 ? -1 : 0)
      const ny = y + (i === 2 ? 1 : i === 0 ? -1 : 0)
      const idx = at(nx, ny)
      if (nx < 0 || ny < 0 || nx >= GRID || ny >= GRID) continue
      if (dist[idx] !== d - 1) continue
      x = nx
      y = ny
      d = dist[idx]
      out.push({ x: x + 0.5, y: y + 0.5 })
      moved = true
      break
    }
    // Cannot happen while `dist` is consistent, but a route that silently looped forever
    // would hang the frame rather than fail visibly.
    if (!moved) break
  }
  return out
}

/** Every open tile in the maze, for picking somewhere to wander to. */
export function openTiles(grid: Uint8Array): { x: number; y: number }[] {
  const out: { x: number; y: number }[] = []
  for (let y = 1; y < GRID; y += 2) {
    for (let x = 1; x < GRID; x += 2) {
      if (grid[at(x, y)] === OPEN) out.push({ x, y })
    }
  }
  return out
}

/**
 * Turns some solid walls into posters, and marks the two signs.
 *
 * Only walls that actually face a corridor are eligible — a poster on a tile buried inside
 * the lattice is invisible and wastes the budget. Which of them gets one comes from
 * `hash`, not from the seeded generator, so it is decided by position alone.
 */
function decorate(
  grid: Uint8Array,
  startX: number,
  startY: number,
  endX: number,
  endY: number,
) {
  for (let y = 1; y < GRID - 1; y++) {
    for (let x = 1; x < GRID - 1; x++) {
      const idx = at(x, y)
      if (grid[idx] !== BRICK) continue
      const facesCorridor =
        grid[at(x - 1, y)] === OPEN ||
        grid[at(x + 1, y)] === OPEN ||
        grid[at(x, y - 1)] === OPEN ||
        grid[at(x, y + 1)] === OPEN
      if (facesCorridor && hash(x, y) < 1 / 14) grid[idx] = POSTER
    }
  }

  // The signs go on a solid tile beside the relevant cell, so you read them head-on
  // walking into it.
  const mark = (x: number, y: number, kind: number) => {
    for (let i = 0; i < 4; i++) {
      const nx = x + (i === 1 ? 1 : i === 3 ? -1 : 0)
      const ny = y + (i === 2 ? 1 : i === 0 ? -1 : 0)
      if (nx <= 0 || ny <= 0 || nx >= GRID - 1 || ny >= GRID - 1) continue
      if (grid[at(nx, ny)] !== OPEN) {
        grid[at(nx, ny)] = kind
        return
      }
    }
  }
  mark(endX, endY, END)
  mark(startX, startY, START)
}
