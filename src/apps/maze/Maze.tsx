import { useEffect, useRef, useState } from 'react'
import { RENDER_W } from '@/screensavers/maze3d/constants.ts'
import { render } from '@/screensavers/maze3d/raycast.ts'
import { buildAtlas, buildGround } from '@/screensavers/maze3d/textures.ts'
import { createWorld, step } from '@/screensavers/maze3d/world.ts'
import type { Held } from '@/screensavers/maze3d/world.ts'
import type { AppProps } from '@/os/types.ts'
import { useIsFocused } from '@/os/useWM.ts'
import './Maze.css'

/**
 * 3D Maze, the one you drive.
 *
 * Shares its whole engine with the screen saver in screensavers/maze3d — the same
 * generator, textures, raycaster and collision. The only difference is where the steering
 * comes from, which is the reason the camera is continuous rather than stepping tile to
 * tile: one position, one collision test, two drivers.
 *
 * The keyboard is guarded by `useIsFocused`, as Solitaire, Calculator, Minesweeper and
 * Paint all are. Nine apps keep a `keydown` on `document`, so without that guard the arrow
 * keys here would also be dealing cards behind you.
 */

const KEYS: Record<string, keyof Held> = {
  ArrowUp: 'forward',
  ArrowDown: 'back',
  ArrowLeft: 'left',
  ArrowRight: 'right',
  w: 'forward',
  s: 'back',
  a: 'left',
  d: 'right',
}

export function Maze({ windowId }: AppProps) {
  const focused = useIsFocused(windowId)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  /**
   * Which keys are down. A ref rather than state: it changes between frames and nothing
   * renders from it, so putting it in state would re-render the window on every keypress
   * for no reason at all.
   */
  const held = useRef<Held>({ forward: false, back: false, left: false, right: false })
  /** Bumped to start a fresh maze, which is what the loop keys off. */
  const [round, setRound] = useState(0)
  const [solved, setSolved] = useState(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const atlas = buildAtlas()
    const ground = buildGround()
    const world = createWorld(Date.now() >>> 0)
    let handle = 0
    let stopped = false
    let last = performance.now()
    let seen = world.solved
    let sized = ''

    /** Sizes to the element, so the maze fills whatever the window has been dragged to. */
    const fit = () => {
      const rect = canvas.getBoundingClientRect()
      const vw = Math.max(1, Math.round(rect.width))
      const vh = Math.max(1, Math.round(rect.height))
      const key = `${vw}x${vh}`
      if (key === sized) return
      sized = key
      const w = Math.min(RENDER_W, vw)
      const h = Math.max(1, Math.round((w * vh) / vw))
      canvas.width = w
      canvas.height = h
      const ctx = canvas.getContext('2d')
      // Re-set after every size assignment: writing `canvas.width` resets the 2D context,
      // and losing this is a blurry maze whose cause is nowhere near the symptom.
      if (ctx) ctx.imageSmoothingEnabled = false
    }

    const frame = (now: number) => {
      handle = 0
      if (stopped) return
      // Clamped: a window dragged behind another, or a backgrounded tab, hands back a
      // multi-second gap, and collision is a position test rather than a swept one.
      const dt = Math.min(now - last, 50) / 1000
      last = now
      fit()
      step(world, dt, held.current)
      const ctx = canvas.getContext('2d')
      if (ctx) render(ctx, world, atlas, ground)
      // The tally is the one thing the window renders from, so it is the one thing that
      // reaches React — and only when it actually changes.
      if (world.solved !== seen) {
        seen = world.solved
        setSolved(world.solved)
      }
      handle = requestAnimationFrame(frame)
    }

    handle = requestAnimationFrame(frame)

    return () => {
      // Not redundant with the cancel: StrictMode mounts, tears down and mounts again, and
      // a cancel racing a dispatched callback would leave the dead loop rescheduling.
      stopped = true
      if (handle) cancelAnimationFrame(handle)
    }
  }, [round])

  useEffect(() => {
    if (!focused) {
      // Dropping focus mid-stride must not leave a key stuck down.
      held.current = { forward: false, back: false, left: false, right: false }
      return
    }
    const set = (e: KeyboardEvent, down: boolean) => {
      const which = KEYS[e.key]
      if (!which) return
      e.preventDefault()
      held.current[which] = down
    }
    const onDown = (e: KeyboardEvent) => set(e, true)
    const onUp = (e: KeyboardEvent) => set(e, false)
    document.addEventListener('keydown', onDown)
    document.addEventListener('keyup', onUp)
    return () => {
      document.removeEventListener('keydown', onDown)
      document.removeEventListener('keyup', onUp)
    }
  }, [focused])

  return (
    <div className="mz">
      <canvas className="mz-canvas" ref={canvasRef} />
      <div className="mz-hud">
        <span>Arrow keys or WASD to move</span>
        <span className="mz-score">Mazes solved: {solved}</span>
        <button type="button" className="xp-button" onClick={() => setRound((r) => r + 1)}>
          New Maze
        </button>
      </div>
    </div>
  )
}
