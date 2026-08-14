import { FADE_MS, FOG_MAX, FOG_TILES, GRID, OPEN, PLANE, TEX } from './constants.ts'
import type { Ground } from './textures.ts'
import type { World } from './world.ts'

/**
 * The renderer: one ray per screen column, DDA against the tile grid, one textured strip.
 *
 * Three things in here reliably provoke the same questions, so each is answered where it
 * happens: why there is no cosine correction, why an axis-aligned ray needs no special
 * case, and why the strip is left unclamped.
 */

/** Reused across frames. Only ever written, never read across a frame boundary. */
let depth = new Float32Array(0)
/** The floor and ceiling buffer, kept between frames so it isn't reallocated 60x a second. */
let ground: ImageData | null = null
let groundPixels: Uint32Array = new Uint32Array(0)

/**
 * Casts the floor and the ceiling.
 *
 * Row by row rather than column by column, which is the whole trick: every pixel across a
 * given screen row is the same distance from the camera, so one division per row gives the
 * distance and the texture coordinate then steps linearly across it. The ceiling is the
 * mirror row, sampled from its own texture, so both halves cost one pass.
 *
 * This is the one place the `drawImage`-per-column approach cannot help — there is no
 * source rectangle that maps to a perspective-correct floor — so it writes pixels directly.
 * At 480x270 that is about 130k writes a frame, which measures as fractions of a
 * millisecond and is the price of the floor actually being tiled.
 */
function castGround(
  ctx: CanvasRenderingContext2D,
  world: World,
  g: Ground,
  w: number,
  h: number,
  horizon: number,
) {
  if (!ground || ground.width !== w || ground.height !== h) {
    ground = ctx.createImageData(w, h)
    groundPixels = new Uint32Array(ground.data.buffer)
  }

  const dirX = Math.cos(world.angle)
  const dirY = Math.sin(world.angle)
  const planeX = -dirY * PLANE
  const planeY = dirX * PLANE

  // The leftmost and rightmost rays; everything between is a lerp of the two.
  const leftX = dirX - planeX
  const leftY = dirY - planeY
  const rightX = dirX + planeX
  const rightY = dirY + planeY

  const size = g.size

  for (let y = 0; y < h; y++) {
    // Distance from the horizon, which is what sets the row's depth. The row exactly on
    // the horizon is infinitely far away, so it is skipped rather than divided by zero.
    const p = y - horizon
    if (p === 0) continue
    const below = p > 0
    // Camera height is half a wall, so the vertical scale matches the wall strips: a
    // one-tile wall at distance 1 fills the buffer.
    const rowDist = (0.5 * h) / Math.abs(p)

    const stepX = (rowDist * (rightX - leftX)) / w
    const stepY = (rowDist * (rightY - leftY)) / w
    let fx = world.x + rowDist * leftX
    let fy = world.y + rowDist * leftY

    // Same fade the walls get, so the two halves agree at the skirting.
    const fade = Math.min(FOG_MAX, rowDist / FOG_TILES)
    const keep = 1 - fade
    const src = below ? g.floor : g.ceiling
    let out = y * w

    for (let x = 0; x < w; x++) {
      // `& (size - 1)` rather than a modulo: the texture is 64 square, so this wraps with
      // one instruction and never goes negative the way `%` would on a negative coordinate.
      const tx = ((fx * size) | 0) & (size - 1)
      const ty = ((fy * size) | 0) & (size - 1)
      const c = src[ty * size + tx]

      if (fade === 0) {
        groundPixels[out] = c
      } else {
        // Unpacked, dimmed and repacked. Cheaper than a second pass with a fillRect, and
        // it keeps the fog identical to the walls'.
        // `keep` is never above 1, so these can only shrink — but they are floats, and
        // `|` would truncate rather than round while leaving any overflow unmasked. The
        // `& 255` on each is what keeps a channel from bleeding into its neighbour.
        const r = ((c & 255) * keep) & 255
        const gg = (((c >> 8) & 255) * keep) & 255
        const b = (((c >> 16) & 255) * keep) & 255
        groundPixels[out] = ((255 << 24) | (b << 16) | (gg << 8) | r) >>> 0
      }

      fx += stepX
      fy += stepY
      out++
    }
  }

  ctx.putImageData(ground, 0, 0)
}

export function render(
  ctx: CanvasRenderingContext2D,
  world: World,
  atlas: HTMLCanvasElement,
  g: Ground,
) {
  const w = ctx.canvas.width
  const h = ctx.canvas.height
  if (depth.length !== w) depth = new Float32Array(w)

  const dirX = Math.cos(world.angle)
  const dirY = Math.sin(world.angle)
  // The camera plane is perpendicular to the direction, scaled to the field of view.
  const planeX = -dirY * PLANE
  const planeY = dirX * PLANE

  // Bob from distance walked rather than from elapsed time, so it stops when the camera
  // stops. Two lines, and most of what makes this feel like walking.
  const bob = Math.sin(world.travelled * 6.3) * 2.2
  // One horizon, shared by the walls and the ground. Bobbing the walls without bobbing the
  // floor would slide the skirting up and down against it.
  const horizon = (h >> 1) + bob

  castGround(ctx, world, g, w, h, horizon)

  for (let x = 0; x < w; x++) {
    const camera = (2 * x) / w - 1
    const rayX = dirX + planeX * camera
    const rayY = dirY + planeY * camera

    let mapX = world.x | 0
    let mapY = world.y | 0

    // 1e30 rather than a branch on zero. An effectively-infinite step is never the smaller
    // side, so a perfectly axis-aligned ray simply never advances that axis.
    const deltaX = rayX === 0 ? 1e30 : Math.abs(1 / rayX)
    const deltaY = rayY === 0 ? 1e30 : Math.abs(1 / rayY)
    const stepX = rayX < 0 ? -1 : 1
    const stepY = rayY < 0 ? -1 : 1
    let sideX = (rayX < 0 ? world.x - mapX : mapX + 1 - world.x) * deltaX
    let sideY = (rayY < 0 ? world.y - mapY : mapY + 1 - world.y) * deltaY

    let side = 0
    let tile = OPEN
    // The border ring is always solid, so this terminates without a step limit.
    while (tile === OPEN) {
      if (sideX < sideY) {
        sideX += deltaX
        mapX += stepX
        side = 0
      } else {
        sideY += deltaY
        mapY += stepY
        side = 1
      }
      if (mapX < 0 || mapY < 0 || mapX >= GRID || mapY >= GRID) break
      tile = world.maze.grid[mapY * GRID + mapX]
    }
    if (tile === OPEN) continue

    // Already perpendicular, so there is no cosine correction anywhere in here: the
    // fisheye cancels because the ray was parametrised along the camera plane rather than
    // by angle.
    const perp = side === 0 ? sideX - deltaX : sideY - deltaY
    depth[x] = perp

    const lineH = Math.round(h / perp)
    // Left unclamped on purpose, and canvas does the clipping. Clamping `top` to zero
    // while leaving the height alone would squash the texture as you walk into a wall.
    const top = horizon - (lineH >> 1)

    let wallX = side === 0 ? world.y + perp * rayY : world.x + perp * rayX
    wallX -= Math.floor(wallX)
    let texX = (wallX * TEX) | 0
    // Mirrored on the two faces seen from the far side, so brick courses run continuously
    // round a corner instead of reflecting at it.
    if ((side === 0 && rayX > 0) || (side === 1 && rayY < 0)) texX = TEX - 1 - texX

    ctx.drawImage(atlas, tile * TEX + texX, 0, 1, TEX, x, top, 1, lineH)

    // Fog, plus a fixed darkening for one of the two wall orientations — the old two-tone
    // trick that makes a corner legible. Done in alpha so there is one atlas and one path
    // rather than a second, pre-darkened set of textures.
    const fade = Math.min(FOG_MAX, perp / FOG_TILES) + (side === 1 ? 0.16 : 0)
    if (fade > 0) {
      ctx.fillStyle = `rgba(0,0,0,${fade})`
      ctx.fillRect(x, top, 1, lineH)
    }
  }

  if (world.phase === 'fade') {
    ctx.fillStyle = `rgba(0,0,0,${Math.min(1, world.fadeMs / FADE_MS)})`
    ctx.fillRect(0, 0, w, h)
  }
}

/** The last frame's wall distance per column. Kept for sprites, if they ever arrive. */
export const columnDepth = () => depth
