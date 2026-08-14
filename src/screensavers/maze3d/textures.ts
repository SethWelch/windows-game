import { BRICK, END, POSTER, SLOTS, START, TEX } from './constants.ts'
import { hash } from './maze.ts'

/**
 * The maze's artwork, generated at runtime.
 *
 * Nothing here ships as a bitmap — the project's only images are the wallpaper and the ad
 * photographs, and a wall texture has no business joining them. Everything below is either
 * a per-pixel loop or a handful of canvas paths.
 *
 * One **atlas**, `SLOTS` tiles wide and one tall, so a tile byte can be turned into a
 * source x by multiplying: `tile * TEX`. That is what lets the renderer draw a wall column
 * with a single `drawImage` and no branching over which texture it wanted.
 */

const canvasOf = (w: number, h: number) => {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  return c
}

/**
 * Paints bricks into an ImageData, which every wall slot starts from.
 *
 * Deep red brick with near-white mortar, four bricks across and four courses down. An
 * earlier version used two 32px bricks of dusty violet stone, which was wrong twice over:
 * the original's walls are unmistakably red, and at two bricks per tile the masonry read
 * as breeze block.
 */
function bricks(data: Uint8ClampedArray, tint: number) {
  // Landscape and large: two bricks across, **four courses from floor to ceiling**, which
  // is what the original laid. Getting to that number is the whole point — anything
  // smaller stops reading as a corridor you could walk down and starts reading as tiling,
  // because the brick is what gives the wall its scale.
  //
  // Four courses over a one-tile wall means a 16px course; 2:1 then fixes the width at 32.
  // Both must divide 64 exactly or the texture wraps with a seam mid-wall, which is why the
  // only usable sizes here are 8, 16 and 32.
  const BRICK_W = 32
  const BRICK_H = 16
  // An eighth of a course, as it has been throughout.
  const MORTAR = 2

  for (let y = 0; y < TEX; y++) {
    for (let x = 0; x < TEX; x++) {
      const course = (y / BRICK_H) | 0
      // Alternate courses offset by half a brick, which is what makes it read as bonded
      // masonry rather than as a grid.
      const shifted = x + (course & 1) * (BRICK_W / 2)
      const bx = shifted % BRICK_W
      const by = y % BRICK_H
      const mortar = bx < MORTAR || by < MORTAR

      let r: number
      let g: number
      let b: number
      if (mortar) {
        // Faintly speckled, so the mortar isn't a flat white grid at close range.
        const n = (hash(x * 3, y * 3) - 0.5) * 16
        r = 232 + n
        g = 231 + n
        b = 238 + n
      } else {
        // Per-brick variation so no two match, then per-pixel grain on top. The grain is
        // what stops a 5x upscale looking like moulded plastic.
        const brick = hash(course, (shifted / BRICK_W) | 0) - 0.5
        const grain = (hash(x, y) - 0.5) * 0.6 + (hash(x >> 1, y >> 1) - 0.5) * 0.4
        const k = 1 + brick * 0.16 + grain * 0.22
        r = 158 * k * tint
        g = 26 * k * tint
        b = 26 * k * tint
        // A bright line along each brick's top edge and a dark one along its bottom, which
        // is the whole of the bevel and most of what makes a wall read at a distance.
        if (by === MORTAR) {
          r += 34
          g += 16
          b += 16
        }
        if (by === BRICK_H - 1) {
          r -= 42
          g -= 8
          b -= 8
        }
      }

      const i = (y * TEX + x) * 4
      data[i] = r
      data[i + 1] = g
      data[i + 2] = b
      data[i + 3] = 255
    }
  }
}

/**
 * The floor and ceiling, as raw pixels rather than canvases.
 *
 * Returned as `Uint32Array`s in the byte order `ImageData` uses, because the renderer
 * samples them per pixel while casting the floor — a `drawImage` cannot help there, and
 * indexing one typed array is as cheap as it gets.
 *
 * Little-endian packing (`a << 24 | b << 16 | g << 8 | r`) is what a `Uint32Array` view
 * over `ImageData` expects on every platform this runs on.
 */
export interface Ground {
  floor: Uint32Array
  ceiling: Uint32Array
  size: number
}

/**
 * Clamped, and that is not optional.
 *
 * `Uint8ClampedArray` clamps for you, which is why the brick pass gets away without it —
 * but this packs by hand into a `Uint32Array`, and `|` does no masking at all. A speckled
 * floor pixel of 258 sets bit 8 and leaks straight into the green channel, which shows up
 * as single yellow and red flecks scattered over an otherwise grey floor.
 */
const byte = (v: number) => (v < 0 ? 0 : v > 255 ? 255 : v | 0)

const pack = (r: number, g: number, b: number) =>
  ((255 << 24) | (byte(b) << 16) | (byte(g) << 8) | byte(r)) >>> 0

export function buildGround(): Ground {
  const floor = new Uint32Array(TEX * TEX)
  const ceiling = new Uint32Array(TEX * TEX)
  // Rectangular for the same reason the bricks are: a square grid on the floor reads as
  // graph paper. Twice as wide as deep, so two tiles span a corridor and four run along it.
  const TILE_W = 32
  const TILE_H = 16
  const GROUT = 2

  for (let y = 0; y < TEX; y++) {
    for (let x = 0; x < TEX; x++) {
      const i = y * TEX + x

      // Floor: big pale tiles, heavily speckled, with grey grout between them. The speckle
      // matters more here than anywhere — a flat floor at this scale looks like paper.
      const grout = x % TILE_W < GROUT || y % TILE_H < GROUT
      if (grout) {
        const n = (hash(x * 5, y * 5) - 0.5) * 14
        floor[i] = pack(178 + n, 178 + n, 188 + n)
      } else {
        const speck =
          (hash(x, y) - 0.5) * 46 + (hash(x >> 1, y >> 1) - 0.5) * 26
        floor[i] = pack(222 + speck, 223 + speck, 232 + speck)
      }

      // Ceiling: mustard, mottled at two scales so it doesn't band when it is stretched
      // across the top of the screen.
      const m = (hash(x + 40, y + 40) - 0.5) * 40 + (hash(x >> 2, y >> 2) - 0.5) * 24
      ceiling[i] = pack(214 + m, 163 + m * 0.8, 28 + m * 0.4)
    }
  }
  return { floor, ceiling, size: TEX }
}

/** The rat on the wall. A silhouette, which is all that survives the fog anyway. */
function rat(ctx: CanvasRenderingContext2D, ox: number) {
  // The panel: a dark frame, a light bevel, and cream paper.
  ctx.fillStyle = '#2a2530'
  ctx.fillRect(ox + 8, 10, 48, 44)
  ctx.fillStyle = '#cfc9bb'
  ctx.fillRect(ox + 9, 11, 46, 42)
  ctx.fillStyle = '#e8e2d0'
  ctx.fillRect(ox + 10, 12, 44, 40)

  ctx.fillStyle = '#4a4550'
  ctx.beginPath()
  ctx.ellipse(ox + 30, 36, 13, 8, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.beginPath()
  ctx.arc(ox + 42, 32, 6, 0, Math.PI * 2)
  ctx.fill()
  ctx.beginPath()
  ctx.arc(ox + 39, 26, 3.2, 0, Math.PI * 2)
  ctx.arc(ox + 45, 26, 3.2, 0, Math.PI * 2)
  ctx.fill()

  // The tail, and a foot or two.
  ctx.strokeStyle = '#4a4550'
  ctx.lineWidth = 1.8
  ctx.beginPath()
  ctx.moveTo(ox + 18, 38)
  ctx.quadraticCurveTo(ox + 12, 46, ox + 16, 48)
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(ox + 26, 43)
  ctx.lineTo(ox + 25, 47)
  ctx.moveTo(ox + 34, 43)
  ctx.lineTo(ox + 35, 47)
  ctx.stroke()

  // The eye, and whiskers.
  ctx.fillStyle = '#e8e2d0'
  ctx.beginPath()
  ctx.arc(ox + 44, 31, 1.4, 0, Math.PI * 2)
  ctx.fill()
  ctx.strokeStyle = '#6a6472'
  ctx.lineWidth = 0.8
  for (const dy of [-2, 0, 2]) {
    ctx.beginPath()
    ctx.moveTo(ox + 47, 34)
    ctx.lineTo(ox + 54, 34 + dy)
    ctx.stroke()
  }
}

/** A sign on a coloured plate. Canvas text needs no asset, so this costs nothing. */
function sign(ctx: CanvasRenderingContext2D, ox: number, text: string, plate: string) {
  ctx.fillStyle = '#2a2530'
  ctx.fillRect(ox + 6, 18, 52, 28)
  ctx.fillStyle = plate
  ctx.fillRect(ox + 8, 20, 48, 24)

  ctx.font = 'bold 19px "Courier New", monospace'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  // Drawn twice: the offset black pass is the shadow, which is what keeps it legible
  // once the fog has taken most of the contrast.
  ctx.fillStyle = 'rgba(0,0,0,0.55)'
  ctx.fillText(text, ox + 33, 33)
  ctx.fillStyle = '#fff'
  ctx.fillText(text, ox + 32, 32)
}

/** Builds the wall atlas. Called once per session. */
export function buildAtlas(): HTMLCanvasElement {
  const atlas = canvasOf(TEX * SLOTS, TEX)
  const ctx = atlas.getContext('2d')
  if (!ctx) return atlas

  // Every wall slot starts as bricks; the decorated ones get painted over.
  for (const slot of [BRICK, POSTER, END, START]) {
    const img = ctx.createImageData(TEX, TEX)
    bricks(img.data, slot === BRICK ? 1 : 0.92)
    ctx.putImageData(img, slot * TEX, 0)
  }

  rat(ctx, POSTER * TEX)
  sign(ctx, END * TEX, 'END', '#b02a20')
  sign(ctx, START * TEX, 'IN', '#1f6f2a')
  return atlas
}


