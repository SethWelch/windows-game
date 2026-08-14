import type { Saver } from './types.ts'

const CURVES = 3
/** Four control points: two ends and two handles, i.e. one cubic. */
const CONTROLS = 4
const TRAIL = 18
const SPEED = 0.055

/**
 * Beziers. Mystify's sibling — the same bouncing control points, but read as a cubic curve
 * instead of joined with straight lines.
 *
 * Worth having both: the straight-line version writhes and the curved one billows, and at
 * a glance nobody would guess they are the same twelve lines of motion underneath.
 */
export const beziers: Saver = {
  name: 'Beziers',
  create(w, h) {
    const speed = SPEED * Math.min(w, h)
    const curves = Array.from({ length: CURVES }, (_, c) => ({
      hue: c * 110 + Math.random() * 40,
      points: Array.from({ length: CONTROLS }, () => {
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
      ctx.lineWidth = 1.6

      const step = dt / 1000
      for (const curve of curves) {
        for (const p of curve.points) {
          p.x += p.vx * step
          p.y += p.vy * step
          if (p.x < 0) { p.x = 0; p.vx = Math.abs(p.vx) }
          if (p.x > w) { p.x = w; p.vx = -Math.abs(p.vx) }
          if (p.y < 0) { p.y = 0; p.vy = Math.abs(p.vy) }
          if (p.y > h) { p.y = h; p.vy = -Math.abs(p.vy) }
        }

        curve.trail.unshift(curve.points.map((p) => ({ x: p.x, y: p.y })))
        if (curve.trail.length > TRAIL) curve.trail.length = TRAIL

        curve.hue = (curve.hue + step * 11) % 360
        curve.trail.forEach(([a, b, c, d], age) => {
          const fade = 1 - age / TRAIL
          ctx.strokeStyle = `hsla(${curve.hue - age * 4}, 85%, ${45 + fade * 25}%, ${fade})`
          ctx.beginPath()
          ctx.moveTo(a.x, a.y)
          ctx.bezierCurveTo(b.x, b.y, c.x, c.y, d.x, d.y)
          ctx.stroke()
        })
      }
    }
  },
}
