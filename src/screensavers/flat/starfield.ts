import type { Saver } from './types.ts'

const COUNT = 320
/** How far ahead stars are born, in the same units as `z`. */
const DEPTH = 1
const SPEED = 0.00028

/**
 * Starfield. Flying forward through a static field.
 *
 * Each star is a fixed point in a unit cube that only moves toward the viewer; the drift
 * across the screen is perspective alone, which is what makes the ones near the edges
 * appear to accelerate away. Nothing is ever recycled by position — only by `z` crossing
 * zero — so the field never develops a visible seam.
 */
export const starfield: Saver = {
  name: 'Starfield',
  create(w, h) {
    const cx = w / 2
    const cy = h / 2
    const stars = Array.from({ length: COUNT }, () => ({
      x: Math.random() * 2 - 1,
      y: Math.random() * 2 - 1,
      z: Math.random() * DEPTH,
    }))

    return (ctx, dt) => {
      ctx.fillStyle = '#000'
      ctx.fillRect(0, 0, w, h)

      for (const s of stars) {
        s.z -= dt * SPEED
        // Reborn far away with a fresh direction, rather than wrapped: wrapping would
        // send it back down the line it came in on, which reads as a flicker.
        if (s.z <= 0.02) {
          s.x = Math.random() * 2 - 1
          s.y = Math.random() * 2 - 1
          s.z = DEPTH
        }

        const k = 0.5 / s.z
        const px = cx + s.x * k * cx
        const py = cy + s.y * k * cy
        if (px < 0 || px >= w || py < 0 || py >= h) continue

        // Nearer is bigger and brighter, both from the same term, so a star grows into
        // view rather than popping.
        const near = 1 - s.z / DEPTH
        const size = Math.max(1, near * 2.6)
        ctx.fillStyle = `rgba(255,255,255,${0.25 + near * 0.75})`
        ctx.fillRect(px, py, size, size)
      }
    }
  },
}
