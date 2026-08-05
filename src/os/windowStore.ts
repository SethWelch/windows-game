import { useSyncExternalStore } from 'react'
import { audio } from './audio.ts'
import { boot } from './boot.ts'
import { CASCADE_STEP, TASKBAR_H, Z_BASE, clamp } from './constants.ts'
import { getApp } from './registry.ts'
import type { Rect, Size, WMState, WindowInstance } from './types.ts'

let state: WMState = {
  windows: [],
  focusedId: null,
  nextZ: Z_BASE,
  startMenuOpen: false,
}
let seq = 0

const listeners = new Set<() => void>()

const subscribe = (l: () => void) => {
  listeners.add(l)
  return () => {
    listeners.delete(l)
  }
}

const set = (next: WMState) => {
  if (next === state) return
  state = next
  listeners.forEach((l) => l())
}

const find = (id: string) => state.windows.find((w) => w.id === id)

const patch = (id: string, fn: (w: WindowInstance) => WindowInstance): WMState => ({
  ...state,
  windows: state.windows.map((w) => (w.id === id ? fn(w) : w)),
})

/** The window that should take focus when `id` goes away or is minimized. */
const topmostOther = (id: string): WindowInstance | null =>
  state.windows
    .filter((w) => w.id !== id && w.status !== 'minimized')
    .reduce<WindowInstance | null>(
      (best, w) => (!best || w.zIndex > best.zIndex ? w : best),
      null,
    )

export const wm = {
  openApp(appId: string, args?: unknown): string | null {
    const app = getApp(appId)
    // Nothing launches on a machine that isn't running Windows — a timer left over
    // from a signed-in AIM session must not raise a window during a boot.
    if (!app || !boot.isRunning()) return null

    if (app.singleton) {
      const existing = state.windows.find((w) => w.appId === appId)
      if (existing) {
        wm.focus(existing.id)
        return existing.id
      }
    }

    const id = `${appId}-${++seq}`
    const step = state.windows.length % 8
    const z = state.nextZ + 1
    const { width, height } = app.defaultSize

    // Cascade, then pull back inside the viewport for small screens.
    const maxX = Math.max(0, window.innerWidth - width)
    const maxY = Math.max(0, window.innerHeight - TASKBAR_H - height)

    set({
      ...state,
      startMenuOpen: false,
      focusedId: id,
      nextZ: z,
      windows: [
        ...state.windows,
        {
          id,
          appId,
          title: app.title,
          iconId: app.iconId,
          rect: {
            x: Math.min(40 + step * CASCADE_STEP, maxX),
            y: Math.min(28 + step * CASCADE_STEP, maxY),
            width,
            height,
          },
          restoreRect: null,
          status: 'normal',
          zIndex: z,
          args,
        },
      ],
    })
    return id
  },

  close(id: string) {
    if (!find(id)) return
    const fallback = state.focusedId === id ? topmostOther(id) : null
    set({
      ...state,
      windows: state.windows.filter((w) => w.id !== id),
      focusedId:
        state.focusedId === id ? (fallback?.id ?? null) : state.focusedId,
    })
  },

  focus(id: string) {
    const w = find(id)
    if (!w) return
    // Already frontmost and nothing else to settle — skip the render.
    if (
      state.focusedId === id &&
      w.status !== 'minimized' &&
      !state.startMenuOpen
    ) {
      return
    }
    const z = state.nextZ + 1
    set({
      ...patch(id, (x) => ({
        ...x,
        zIndex: z,
        status: x.status === 'minimized' ? 'normal' : x.status,
      })),
      focusedId: id,
      nextZ: z,
      startMenuOpen: false,
    })
  },

  setRect(id: string, rect: Rect) {
    const w = find(id)
    if (!w) return
    set(patch(id, (x) => ({ ...x, rect })))
  },

  /**
   * Resize in place, keeping the top-left corner put. For apps whose content has
   * one correct size — Minesweeper's field grows when you switch to Expert.
   *
   * Deliberately not clamped to `minSize`: that limit exists to stop a *user*
   * dragging a window smaller than its layout survives, and an app asking for its
   * own size already knows better.
   */
  setSize(id: string, size: Size) {
    const w = find(id)
    if (!w) return
    if (w.rect.width === size.width && w.rect.height === size.height) return
    // Growing must not push the window off-screen: Minesweeper's Expert field is
    // nearly three times the width of Beginner's, so a window cascaded to the
    // right has to slide back in rather than lose its right-hand edge.
    set(
      patch(id, (x) => ({
        ...x,
        rect: {
          ...size,
          x: clamp(x.rect.x, 0, window.innerWidth - size.width),
          y: clamp(x.rect.y, 0, window.innerHeight - TASKBAR_H - size.height),
        },
      })),
    )
  },

  minimize(id: string) {
    const w = find(id)
    if (!w || w.status === 'minimized') return
    const fallback = topmostOther(id)
    audio.play('minimize')
    set({
      ...patch(id, (x) => ({ ...x, status: 'minimized' })),
      focusedId: fallback?.id ?? null,
    })
  },

  toggleMaximize(id: string) {
    const w = find(id)
    if (!w) return
    audio.play(w.status === 'maximized' ? 'restore' : 'maximize')
    set(
      patch(id, (x) =>
        x.status === 'maximized'
          ? {
              ...x,
              status: 'normal',
              rect: x.restoreRect ?? x.rect,
              restoreRect: null,
            }
          : { ...x, status: 'maximized', restoreRect: x.rect },
      ),
    )
  },

  /** Real XP semantics: clicking the focused window's button minimizes it. */
  taskbarClick(id: string) {
    const w = find(id)
    if (!w) return
    if (w.status !== 'minimized' && state.focusedId === id) wm.minimize(id)
    else wm.focus(id)
  },

  /** Everything closes. A machine that has just booted has nothing running on it. */
  closeAll() {
    if (!state.windows.length) return
    set({ ...state, windows: [], focusedId: null })
  },

  /**
   * Imperative snapshot, for code outside React that has to look before it opens
   * — AIM checks whether a conversation with a buddy is already on screen. React
   * components should use `useWindows()` instead so they re-render.
   */
  list(): readonly WindowInstance[] {
    return state.windows
  },

  setTitle(id: string, title: string) {
    const w = find(id)
    // The no-op guard is what makes it safe for an app to call this from an
    // effect that runs on every render.
    if (!w || w.title === title) return
    set(patch(id, (x) => ({ ...x, title })))
  },

  setStartMenu(open: boolean) {
    if (state.startMenuOpen === open) return
    set({ ...state, startMenuOpen: open })
  },
}

/**
 * Selector-based subscription.
 *
 * The snapshot must be referentially stable across calls, so the selector may
 * only return primitives or values already held in state. `s => s.windows` is
 * fine; `s => s.windows.filter(...)` builds a fresh array every call and React
 * throws "getSnapshot should be cached". Derive in the component instead.
 */
export function useWM<T>(selector: (s: WMState) => T): T {
  return useSyncExternalStore(
    subscribe,
    () => selector(state),
    () => selector(state),
  )
}
