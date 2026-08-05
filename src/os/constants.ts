import type { Rect } from './types.ts'

/** Must match `--taskbar-h` in styles/tokens.css. */
export const TASKBAR_H = 30
/** Must match `--titlebar-h` in styles/tokens.css. */
export const TITLEBAR_H = 30
/**
 * The blue frame's width down each side and along the bottom — must match
 * `.xp-window`'s padding in components/Window/Window.css. Apps that size a window
 * to their own content need it to convert a client size into a window size.
 */
export const FRAME_GUTTER = 3

/** How much of a window must stay reachable when shoved toward an edge. */
export const MIN_VISIBLE = 90
export const CASCADE_STEP = 24
export const Z_BASE = 100
export const DEFAULT_MIN_SIZE = { width: 220, height: 150 }

export const clamp = (v: number, lo: number, hi: number) =>
  Math.min(Math.max(v, lo), hi < lo ? lo : hi)

/**
 * The single source of truth for turning a Rect into styles. Both the React
 * render path and the imperative drag path go through this — if they ever
 * disagreed by a pixel you'd see a one-frame jump when the pointer is released.
 */
export const applyRect = (el: HTMLElement, r: Rect) => {
  el.style.transform = `translate(${r.x}px, ${r.y}px)`
  el.style.width = `${r.width}px`
  el.style.height = `${r.height}px`
}
