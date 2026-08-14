import {
  ARRIVE,
  AUTO_SPEED,
  AUTO_TURN,
  FADE_MS,
  GRID,
  OPEN,
  RADIUS,
  USER_SPEED,
  USER_TURN,
} from './constants.ts'
import { generate, route, rng } from './maze.ts'
import type { Maze } from './maze.ts'

/**
 * The camera, and what moves it.
 *
 * The camera is **continuous** — a float position and a float angle — rather than stepping
 * from tile to tile. That is the consequential choice in here: a discrete autopilot is
 * easier to write, but it needs a second representation of where the camera is, and the
 * player's driver would then have to animate back onto the tile lattice before the
 * autopilot could resume. Steering a continuous camera means the autopilot and the player
 * share one position, one collision test, and one set of units.
 */

export interface Held {
  forward: boolean
  back: boolean
  left: boolean
  right: boolean
}

export interface World {
  maze: Maze
  x: number
  y: number
  angle: number
  /** Distance walked, which drives the head bob — so it stops when the camera does. */
  travelled: number
  /** Waypoints left in the current route, as tile centres. */
  route: { x: number; y: number }[]
  /** 'walk' is normal; 'fade' is the wipe after reaching the end. */
  phase: 'walk' | 'fade'
  fadeMs: number
  /** Counted for the app's scoreboard; the saver ignores it. */
  solved: number
  random: () => number
}

export function createWorld(seed: number): World {
  const maze = generate(seed)
  return {
    maze,
    x: maze.startX + 0.5,
    y: maze.startY + 0.5,
    // Facing whichever way is actually open, rather than into a wall.
    angle: firstOpenAngle(maze),
    travelled: 0,
    route: [],
    phase: 'walk',
    fadeMs: 0,
    solved: 0,
    random: rng(seed ^ 0x9e3779b9),
  }
}

/** The start cell has one or two exits; face one so the first frame isn't a brick wall. */
function firstOpenAngle(maze: Maze): number {
  const { grid, startX, startY } = maze
  const dirs: [number, number, number][] = [
    [1, 0, 0],
    [0, 1, Math.PI / 2],
    [-1, 0, Math.PI],
    [0, -1, -Math.PI / 2],
  ]
  for (const [dx, dy, a] of dirs) {
    if (grid[(startY + dy) * GRID + (startX + dx)] === OPEN) return a
  }
  return 0
}

export const solid = (world: World, x: number, y: number) => {
  if (x < 0 || y < 0 || x >= GRID || y >= GRID) return true
  return world.maze.grid[(y | 0) * GRID + (x | 0)] !== OPEN
}

/**
 * Moves the camera, one axis at a time.
 *
 * Testing each axis separately is what gives sliding along a wall for free: a diagonal into
 * a corner keeps whichever component is legal instead of stopping dead. The autopilot goes
 * through here too, so a bad route can never push the camera inside geometry.
 */
function advance(world: World, dx: number, dy: number) {
  const before = { x: world.x, y: world.y }
  if (dx !== 0 && !solid(world, world.x + dx + Math.sign(dx) * RADIUS, world.y)) {
    world.x += dx
  }
  if (dy !== 0 && !solid(world, world.x, world.y + dy + Math.sign(dy) * RADIUS)) {
    world.y += dy
  }
  world.travelled += Math.abs(world.x - before.x) + Math.abs(world.y - before.y)
}

/** Shortest signed difference between two angles. */
const wrapPi = (a: number) => {
  let v = a
  while (v > Math.PI) v -= Math.PI * 2
  while (v < -Math.PI) v += Math.PI * 2
  return v
}

/**
 * The autopilot always heads for the end.
 *
 * It wandered to random cells at first, which was a mistake twice over: it looked aimless,
 * and because the "seek the end" branch was gated on never having found one, it stopped
 * completing anything at all after the first maze. Heading for the exit is less code, it
 * is what the original did, and the route there is four hundred tiles of corridor — the
 * tour comes free.
 */
function plan(world: World) {
  const { maze } = world
  world.route = route(maze.grid, world.x | 0, world.y | 0, maze.endX, maze.endY)
}

/**
 * Advances the world by `dt` seconds.
 *
 * `held` null means the autopilot is driving. The two drivers differ only in where the
 * steering demand comes from — everything downstream of that is shared.
 */
export function step(world: World, dt: number, held: Held | null) {
  if (world.phase === 'fade') {
    world.fadeMs += dt * 1000
    if (world.fadeMs >= FADE_MS) {
      // A fresh maze, keeping the tally and the driver.
      const next = createWorld((world.random() * 0xffffffff) >>> 0)
      world.maze = next.maze
      world.x = next.x
      world.y = next.y
      world.angle = next.angle
      world.route = []
      world.phase = 'walk'
      world.fadeMs = 0
    }
    return
  }

  if (held) {
    const turn = (held.right ? 1 : 0) - (held.left ? 1 : 0)
    world.angle += turn * USER_TURN * dt
    const drive = (held.forward ? 1 : 0) - (held.back ? 1 : 0)
    if (drive !== 0) {
      const d = drive * USER_SPEED * dt
      advance(world, Math.cos(world.angle) * d, Math.sin(world.angle) * d)
    }
  } else {
    if (!world.route.length) plan(world)
    const next = world.route[0]
    if (next) {
      const err = wrapPi(Math.atan2(next.y - world.y, next.x - world.x) - world.angle)
      const limit = AUTO_TURN * dt
      world.angle += Math.max(-limit, Math.min(limit, err))
      // Full speed only when facing the waypoint, nothing at all past ninety degrees off.
      // That is what makes it pivot into a corner and then walk, rather than arcing
      // through the wall.
      const d = AUTO_SPEED * dt * Math.max(0, Math.cos(err))
      advance(world, Math.cos(world.angle) * d, Math.sin(world.angle) * d)
      if (Math.hypot(next.x - world.x, next.y - world.y) < ARRIVE) world.route.shift()
    }
  }

  // Reaching the end cell wins, whoever was steering.
  if ((world.x | 0) === world.maze.endX && (world.y | 0) === world.maze.endY) {
    world.solved += 1
    world.phase = 'fade'
    world.fadeMs = 0
    world.route = []
  }
}

/** Puts the player back at the start of a brand new maze. */
export function reset(world: World, seed: number) {
  const next = createWorld(seed)
  world.maze = next.maze
  world.x = next.x
  world.y = next.y
  world.angle = next.angle
  world.route = []
  world.phase = 'walk'
  world.fadeMs = 0
  world.travelled = 0
}
