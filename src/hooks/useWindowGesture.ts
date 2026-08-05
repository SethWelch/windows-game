import { useRef } from 'react'
import type { DOMAttributes, PointerEvent as ReactPointerEvent } from 'react'
import { MIN_VISIBLE, TITLEBAR_H, clamp } from '@/os/constants.ts'
import type { Rect, ResizeEdge, Size } from '@/os/types.ts'

interface GestureOptions {
  /** Committed geometry, read once at pointerdown. */
  getRect: () => Rect
  /** The draggable area — the window layer's client box. */
  getBounds: () => Size
  minSize: Size
  /** Called on every pointermove; write straight to the DOM here. */
  onPreview: (r: Rect) => void
  /** Called once on pointerup with the final rect. */
  onCommit: (r: Rect) => void
  onStart?: () => void
}

/** XP let you shove a window mostly offscreen, but never out of reach. */
function clampMove(base: Rect, dx: number, dy: number, vp: Size): Rect {
  return {
    ...base,
    x: clamp(base.x + dx, MIN_VISIBLE - base.width, vp.width - MIN_VISIBLE),
    y: clamp(base.y + dy, 0, Math.max(0, vp.height - TITLEBAR_H)),
  }
}

/**
 * Compute both edges, then clamp the *moving* edge against the *fixed* one.
 *
 * The tempting shortcut — clamp width first, then derive x from it — makes the
 * window walk sideways once you drag past the minimum, because x keeps
 * following the pointer after width has stopped shrinking.
 */
function resizeRect(
  base: Rect,
  edge: ResizeEdge,
  dx: number,
  dy: number,
  min: Size,
  vp: Size,
): Rect {
  let { x, y } = base
  let right = base.x + base.width
  let bottom = base.y + base.height

  if (edge.includes('w')) x = clamp(base.x + dx, 0, right - min.width)
  if (edge.includes('n')) y = clamp(base.y + dy, 0, bottom - min.height)
  if (edge.includes('e')) right = clamp(right + dx, x + min.width, vp.width)
  if (edge.includes('s')) bottom = clamp(bottom + dy, y + min.height, vp.height)

  return { x, y, width: right - x, height: bottom - y }
}

interface GestureState {
  px: number
  py: number
  base: Rect
  edge: ResizeEdge | null
  last: Rect
}

/**
 * Pointer-capture based move/resize. Nothing goes through React state during the
 * gesture: `onPreview` writes to the DOM node directly and `onCommit` fires once
 * on release, so a drag costs one render instead of one per frame.
 */
export function useWindowGesture(o: GestureOptions) {
  const active = useRef<GestureState | null>(null)

  const onDown = (e: ReactPointerEvent<HTMLElement>, edge: ResizeEdge | null) => {
    if (e.button !== 0) return
    o.onStart?.()
    const base = o.getRect()
    active.current = { px: e.clientX, py: e.clientY, base, edge, last: base }
    e.currentTarget.setPointerCapture(e.pointerId)
    // No preventDefault here on purpose: cancelling pointerdown suppresses the
    // compatibility mouse events in some browsers, which would take
    // double-click-to-maximize with it. Text selection is handled by
    // `user-select: none` on the titlebar and handles instead.
  }

  const onMove = (e: ReactPointerEvent<HTMLElement>) => {
    const g = active.current
    if (!g) return
    // Deltas are measured from the gesture origin, never the previous event —
    // per-event deltas accumulate rounding error over a long drag.
    const dx = e.clientX - g.px
    const dy = e.clientY - g.py
    const vp = o.getBounds()
    const next = g.edge
      ? resizeRect(g.base, g.edge, dx, dy, o.minSize, vp)
      : clampMove(g.base, dx, dy, vp)
    g.last = next
    o.onPreview(next)
  }

  const onUp = (e: ReactPointerEvent<HTMLElement>) => {
    const g = active.current
    if (!g) return
    active.current = null
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId)
    }
    o.onCommit(g.last)
  }

  const moveProps: DOMAttributes<HTMLElement> = {
    onPointerDown: (e) => onDown(e, null),
    onPointerMove: onMove,
    onPointerUp: onUp,
    onPointerCancel: onUp,
  }

  const resizeProps = (edge: ResizeEdge): DOMAttributes<HTMLElement> => ({
    onPointerDown: (e) => onDown(e, edge),
    onPointerMove: onMove,
    onPointerUp: onUp,
    onPointerCancel: onUp,
  })

  return { moveProps, resizeProps }
}
