import type { Saver } from './types.ts'

const RIBBONS = 2
const VERTICES = 4
/** How many past outlines linger. The trail is the whole effect. */
const TRAIL = 14
const SPEED = 0.075

interface Point {
  x: number
  y: number
  vx: number
  vy: number
}

/**
 * Mystify. Polygons whose corners bounce around the screen, each dragging a fading trail
 * of its own past shapes.
 *
 * The corners move independently, which is the trick — a rigid polygon bouncing would
 * just be a shape sliding about, whereas independent vertices make it writhe. The trail is
 * kept as a ring of past vertex snapshots rather than by dimming the canvas: fading the
 * whole frame leaves a grey smear behind everything, and this way the lines stay crisp all
 * the way back.
 */
export const mystify: Saver = {
  name: 'Mystify',
  create(w, h) {
    const speed = SPEED * Math.min(w, h)
    const ribbons = Array.from({ length: RIBBONS }, (_, r) => ({
      hue: r * 150 + Math.random() * 60,
      points: Array.from({ length: VERTICES }, (): Point => {
        const a = Math.random() * Math.PI * 2
        return {
          x: Math.random() * w,
          y: Math.random() * h,
          vx: Math.cos(a) * speed,
          vy: Math.sin(a) * speed,
        }
      }),
      trail: [] as { x: number; y: number }[][],
    }))

    return (ctx, dt) => {
      ctx.fillStyle = '#000'
      ctx.fillRect(0, 0, w, h)
      ctx.lineWidth = 1.4

      const step = dt / 1000
      for (const ribbon of ribbons) {
        for (const p of ribbon.points) {
          p.x += p.vx * step
          p.y += p.vy * step
          // Reflected *and* clamped: a corner that overshoots on a long frame would
          // otherwise sit outside the box flipping its velocity every frame.
          if (p.x < 0) { p.x = 0; p.vx = Math.abs(p.vx) }
          if (p.x > w) { p.x = w; p.vx = -Math.abs(p.vx) }
          if (p.y < 0) { p.y = 0; p.vy = Math.abs(p.vy) }
          if (p.y > h) { p.y = h; p.vy = -Math.abs(p.vy) }
        }

        ribbon.trail.unshift(ribbon.points.map((p) => ({ x: p.x, y: p.y })))
        if (ribbon.trail.length > TRAIL) ribbon.trail.length = TRAIL

        ribbon.hue = (ribbon.hue + step * 14) % 360
        ribbon.trail.forEach((shape, age) => {
          const fade = 1 - age / TRAIL
          ctx.strokeStyle = `hsla(${ribbon.hue - age * 3}, 90%, ${40 + fade * 30}%, ${fade})`
          ctx.beginPath()
          shape.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)))
          ctx.closePath()
          ctx.stroke()
        })
      }
    }
  },
}
