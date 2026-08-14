import { useEffect, useRef } from 'react'
import { SAVERS } from '@/screensavers/savers.ts'
import type { SaverId } from '@/screensavers/savers.ts'

/**
 * A canvas running one screen saver, and the loop that drives it.
 *
 * Shared by the full-screen overlay and by the little monitor in Display Properties, so
 * the preview cannot show something other than what you get — the same argument
 * `DesktopPreview` already makes about the wallpaper.
 *
 * This is the project's first `requestAnimationFrame` loop. Everything else that moves is
 * CSS, deliberately; a canvas saver is the case that cannot be.
 */

/**
 * How wide the backing store gets when it is tracking the viewport, whatever the monitor
 * is. Fixing the cost independent of screen size is half the reason; the other half is
 * that it is more faithful — these ran at 640x480 on a CRT, and a pixel-crisp starfield
 * at 2560 across looks like a modern screensaver doing an impression.
 */
const FILL_W = 960

export function SaverCanvas({
  saver,
  width,
  height,
}: {
  saver: SaverId
  /** Omit both to track the viewport; give both for a fixed-size preview. */
  width?: number
  height?: number
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const fixed = width !== undefined && height !== undefined

  useEffect(() => {
    const canvas = canvasRef.current
    const entry = SAVERS[saver]
    if (!canvas || !entry) return

    let handle = 0
    let stopped = false
    let last = performance.now()
    let paint: ReturnType<typeof entry.create> | null = null

    /**
     * Sizes the backing store and rebuilds the painter.
     *
     * `canvas.width` is assigned only here. Assigning it clears the bitmap *and* resets
     * the 2D context — which is why `imageSmoothingEnabled` is re-set on the very next
     * line. That reset is the easiest thing in this file to lose an hour to: the symptom
     * is a saver that goes blurry after a resize, and the cause is nowhere near it.
     */
    const resize = () => {
      const fill = entry.renderWidth ?? FILL_W
      const w = fixed ? width : Math.min(fill, Math.max(1, window.innerWidth))
      const h = fixed
        ? height
        : Math.max(1, Math.round((w * Math.max(1, window.innerHeight)) / Math.max(1, window.innerWidth)))
      canvas.width = w
      canvas.height = h
      const ctx = canvas.getContext('2d')
      if (ctx) ctx.imageSmoothingEnabled = false
      // New bounds mean a new saver rather than a stretched one — a starfield's centre
      // has moved, and its stars were placed against the old one.
      paint = entry.create(w, h)
    }

    resize()

    const frame = (now: number) => {
      handle = 0
      if (stopped) return
      // Clamped hard: a backgrounded tab hands back a multi-second gap on the first frame
      // after it wakes, and an unclamped delta makes every saver lurch.
      const dt = Math.min(now - last, 50)
      last = now
      const ctx = canvas.getContext('2d')
      if (ctx && paint) paint(ctx, dt)
      handle = requestAnimationFrame(frame)
    }

    if (!fixed) window.addEventListener('resize', resize)
    handle = requestAnimationFrame(frame)

    return () => {
      // Not redundant with `cancelAnimationFrame`: StrictMode mounts, tears down and
      // mounts again, and a cancel racing an already-dispatched callback would leave the
      // dead loop rescheduling itself forever.
      stopped = true
      if (handle) cancelAnimationFrame(handle)
      if (!fixed) window.removeEventListener('resize', resize)
    }
  }, [saver, fixed, width, height])

  return <canvas className="saver-canvas" ref={canvasRef} />
}
