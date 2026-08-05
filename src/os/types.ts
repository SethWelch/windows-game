import type { ComponentType } from 'react'
import type { IconId } from '@/icons/registry.ts'

export interface Rect {
  x: number
  y: number
  width: number
  height: number
}

export interface Size {
  width: number
  height: number
}

/** A union rather than an enum — tsconfig sets `erasableSyntaxOnly`. */
export type WindowStatus = 'normal' | 'minimized' | 'maximized'

export type ResizeEdge = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw'

export interface WindowInstance {
  id: string
  appId: string
  /** Window-owned, not app-owned: apps push changes up via `wm.setTitle`. */
  title: string
  iconId: IconId
  /** Live geometry while `status === 'normal'`. */
  rect: Rect
  /** Where to return to when un-maximizing. */
  restoreRect: Rect | null
  status: WindowStatus
  zIndex: number
  /** Launch payload, e.g. `{ fileName: 'notes.txt' }`. */
  args?: unknown
}

export interface WMState {
  /** Stable creation order — this doubles as taskbar button order. */
  windows: WindowInstance[]
  focusedId: string | null
  nextZ: number
  /** Shell UI state lives here so window clicks can dismiss the menu. */
  startMenuOpen: boolean
}

/** Every app component receives exactly this. */
export interface AppProps {
  windowId: string
  args?: unknown
}

export interface AppDefinition {
  id: string
  /** Default window title. */
  title: string
  /** Label under the desktop icon / in the Start menu. */
  label: string
  iconId: IconId
  component: ComponentType<AppProps>
  defaultSize: Size
  minSize?: Size
  resizable?: boolean
  maximizable?: boolean
  showOnDesktop?: boolean
  startMenuSection?: 'pinned' | 'programs'
  /**
   * Where it sits inside All Programs, e.g. `['Accessories', 'Entertainment']`.
   * Absent or empty means the top level, which is where installed programs went.
   */
  startMenuFolder?: string[]
  singleton?: boolean
}
