import { useEffect, useRef, useState } from 'react'
import { RENDER_W, createAmbience } from './ambience.ts'

/**
 * The canvas Ambience runs on, and the loop that drives it.
 *
 * The project's third `requestAnimationFrame` loop, and the first outside the screen
 * savers — see the note in CLAUDE.md for why that bar is high and why frame feedback
 * clears it. The three rules that keep a loop here from misbehaving are all below: a
 * `stopped` flag as well as `cancelAnimationFrame`, a hard `dt` clamp, and
 * `imageSmoothingEnabled` re-set immediately after every size assignment.
 *
 * Nothing runs while the player is paused. The effect is keyed on `playing`, so pausing
 * tears the loop down and the last frame simply stays on the canvas — which is what the
 * real one did, and means a paused window costs exactly nothing.
 */
export function AmbienceCanvas({ playing }: { playing: boolean }) {
  const hostRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  /**
   * Which preset is up, reported out of the loop so the caption can name it. One render
   * every half minute or so; the loop itself never causes one.
   */
  const [preset, setPreset] = useState('')

  useEffect(() => {
    if (!playing) return
    const host = hostRef.current
    const canvas = canvasRef.current
    if (!host || !canvas) return

    let handle = 0
    let stopped = false
    let last = performance.now()
    let paint: ReturnType<typeof createAmbience> | null = null
    /** The bitmap size currently set up, so a no-op resize doesn't wipe the trail. */
    let sized = ''
    /**
     * How far into the preset rotation we are, kept out here so it survives the painter
     * being rebuilt. Losing the smoke to a resize is unavoidable; losing your place in
     * the rotation, and having the colour jump back to blue, is not.
     */
    let elapsed = 0

    /**
     * Sizes the backing store and rebuilds the painter.
     *
     * Rebuilding throws the trail away, which is why this returns early when the size
     * hasn't actually changed: a `ResizeObserver` fires for any layout change at all,
     * and every one of them would otherwise flash the visualization back to black.
     *
     * Assigning `canvas.width` clears the bitmap *and* resets the 2D context, which is
     * why smoothing is re-set on the next line. Here it goes to `true` rather than
     * `false` — the opposite of every other canvas in the project — because the
     * resampling *is* the softness. See ambience.ts.
     */
    const resize = () => {
      const cw = Math.max(1, host.clientWidth)
      const ch = Math.max(1, host.clientHeight)
      // Capped in width, with the height following the pane's real aspect ratio so the
      // cloud isn't stretched.
      const w = Math.min(RENDER_W, cw)
      const h = Math.max(1, Math.round(ch * (w / cw)))
      const key = `${w}x${h}`
      if (key === sized) return
      sized = key
      if (paint) elapsed = paint.elapsed()
      canvas.width = w
      canvas.height = h
      const ctx = canvas.getContext('2d')
      if (ctx) ctx.imageSmoothingEnabled = true
      paint = createAmbience(w, h, setPreset, elapsed)
    }

    resize()
    const observer = new ResizeObserver(resize)
    observer.observe(host)

    const frame = (now: number) => {
      handle = 0
      if (stopped) return
      // Clamped at *both* ends. The upper bound is the backgrounded-tab gap; the lower
      // bound is subtler and cost a real bug: `last` is set with `performance.now()` when
      // the effect runs, but the first callback is handed the timestamp of the frame that
      // was already in progress, which can be *earlier* than that. `now - last` is then
      // negative, and anything integrating dt runs backwards on its first frame.
      //
      // Here that made `elapsed` negative, `Math.floor(-0.0002)` is -1, and JavaScript's
      // `%` keeps the sign — so `PRESETS[-1]` was undefined and the first frame threw,
      // killing the loop before it drew anything. It only showed up when the canvas
      // mounted with playback already running, which is exactly what tuning a station and
      // then switching to Now Playing does.
      const dt = Math.max(0, Math.min(now - last, 50))
      last = now
      const ctx = canvas.getContext('2d')
      if (ctx && paint) paint(ctx, dt)
      handle = requestAnimationFrame(frame)
    }
    handle = requestAnimationFrame(frame)

    return () => {
      // Not redundant with `cancelAnimationFrame`: StrictMode mounts, tears down and
      // mounts again, and a cancel racing an already-dispatched callback would leave the
      // dead loop rescheduling itself forever.
      stopped = true
      if (handle) cancelAnimationFrame(handle)
      observer.disconnect()
    }
  }, [playing])

  return (
    <div className="wmp-ambience" ref={hostRef}>
      <canvas className="wmp-ambience-canvas" ref={canvasRef} />
      {/* The real player named the running visualization in the info bar above the pane.
          Ours has no info bar, so it goes in the corner instead — and now that the presets
          rotate, without it there is nothing anywhere that tells you what you are looking
          at or that it changed on purpose. */}
      {preset && <span className="wmp-vis-name">Ambience : {preset}</span>}
    </div>
  )
}
