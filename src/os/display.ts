import { useSyncExternalStore } from 'react'
import { SAVERS } from '@/screensavers/savers.ts'
import type { SaverId } from '@/screensavers/savers.ts'
import { clamp } from './constants.ts'
import { BUNDLED } from './wallpaper.ts'
import type { BundledId } from './wallpaper.ts'

/**
 * What Display Properties controls: the colour scheme, the shell's font size, and the
 * background.
 *
 * The scheme and font size are applied by stamping the root element rather than by
 * threading values through React, because they reach every stylesheet at once — see
 * the `data-scheme` blocks in styles/tokens.css. The stamp happens at module load as
 * well as on change, so a persisted scheme is on the element before the first paint
 * instead of flashing Luna Blue and then correcting itself.
 *
 * The Background list is two halves: the pictures that ship with the machine (BUNDLED
 * in os/wallpaper.ts) and every image in the filesystem — which makes Paint's "Set As
 * Background" a real feature rather than a greyed menu item, the same way it was the
 * whole point of Paint for a lot of people.
 */

/** Luna's three colour schemes. */
export type Scheme = 'blue' | 'olive' | 'silver'

/** Luna's three font sizes. XP scaled the shell and let the apps cope. */
export type FontSize = 'normal' | 'large' | 'extra'

/** How a picture is laid onto the desktop. */
export type Position = 'center' | 'tile' | 'stretch'

/**
 * `none` is the background colour on its own, `bundled` is one of the pictures that
 * ship with the machine (see BUNDLED in os/wallpaper.ts), and `file` is a node id in
 * os/fs.ts — which is what makes Paint's Set As Background work.
 */
export type Wallpaper =
  | { kind: 'none' }
  | { kind: 'bundled'; id: BundledId }
  | { kind: 'file'; nodeId: string }

export interface DisplaySettings {
  scheme: Scheme
  fontSize: FontSize
  wallpaper: Wallpaper
  position: Position
  /** Shown where the picture isn't. XP's own default was this blue-grey. */
  color: string
  /** Which screen saver, or 'none'. See screensavers/savers.ts. */
  saver: SaverId
  /** Minutes of idleness before it starts. XP's own range was 1-99. */
  waitMinutes: number
}

/** The narrowest and widest waits XP's spinner accepted. */
const WAIT_MIN = 1
const WAIT_MAX = 99

/** The pixel sizes behind `FontSize`, matching XP's three steps. */
const FONT_PX: Record<FontSize, string> = {
  normal: '11px',
  large: '13px',
  extra: '15px',
}

/** XP's background colour dropdown, near enough. */
export const COLORS = [
  '#3a6ea5',
  '#000000',
  '#585858',
  '#808080',
  '#c0c0c0',
  '#ffffff',
  '#004000',
  '#008080',
  '#000080',
  '#400040',
  '#800000',
  '#808000',
]

const KEY = 'xp-display'

const DEFAULTS: DisplaySettings = {
  scheme: 'blue',
  fontSize: 'normal',
  wallpaper: { kind: 'bundled', id: 'bliss' },
  position: 'stretch',
  color: '#3a6ea5',
  saver: 'none',
  waitMinutes: 10,
}

/**
 * Validates a persisted wallpaper, and carries the one older shape forward: before
 * there were five bundled pictures there was only `{ kind: 'bliss' }`.
 */
function readWallpaper(saved: unknown): Wallpaper {
  if (!saved || typeof saved !== 'object') return DEFAULTS.wallpaper
  const w = saved as { kind?: string; id?: string; nodeId?: string }
  if (w.kind === 'bliss') return { kind: 'bundled', id: 'bliss' }
  if (w.kind === 'none') return { kind: 'none' }
  if (w.kind === 'file' && w.nodeId) return { kind: 'file', nodeId: w.nodeId }
  // An id we no longer ship would leave the desktop pointing at nothing.
  if (w.kind === 'bundled' && w.id && w.id in BUNDLED) {
    return { kind: 'bundled', id: w.id as BundledId }
  }
  return DEFAULTS.wallpaper
}

function load(): DisplaySettings {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return DEFAULTS
    const parsed = JSON.parse(raw) as Partial<DisplaySettings>
    // Field by field: a half-written or older payload shouldn't take the desktop with
    // it, and an unknown scheme would leave the root stamped with a selector nothing
    // in tokens.css answers.
    return {
      scheme: parsed.scheme && parsed.scheme in SCHEME_NAMES ? parsed.scheme : DEFAULTS.scheme,
      fontSize: parsed.fontSize && parsed.fontSize in FONT_PX ? parsed.fontSize : DEFAULTS.fontSize,
      wallpaper: readWallpaper(parsed.wallpaper),
      position: parsed.position ?? DEFAULTS.position,
      color: parsed.color ?? DEFAULTS.color,
      // Membership-checked rather than `??`-defaulted: an id we no longer ship would
      // leave the overlay mounted with nothing to draw.
      saver: parsed.saver && parsed.saver in SAVERS ? parsed.saver : DEFAULTS.saver,
      waitMinutes:
        typeof parsed.waitMinutes === 'number' && Number.isFinite(parsed.waitMinutes)
          ? Math.round(clamp(parsed.waitMinutes, WAIT_MIN, WAIT_MAX))
          : DEFAULTS.waitMinutes,
    }
  } catch {
    return DEFAULTS
  }
}

/** Also the labels the Appearance tab shows, so the two can't drift apart. */
export const SCHEME_NAMES: Record<Scheme, string> = {
  blue: 'Default (blue)',
  olive: 'Olive Green',
  silver: 'Silver',
}

export const FONT_NAMES: Record<FontSize, string> = {
  normal: 'Normal',
  large: 'Large Fonts',
  extra: 'Extra Large Fonts',
}

/** Compared field by field, so a property sheet can tell whether anything is pending. */
export function sameWallpaper(a: Wallpaper, b: Wallpaper): boolean {
  if (a.kind !== b.kind) return false
  if (a.kind === 'bundled' && b.kind === 'bundled') return a.id === b.id
  if (a.kind === 'file' && b.kind === 'file') return a.nodeId === b.nodeId
  return true
}

/**
 * Whether two settings are the same.
 *
 * Driven off `Object.keys` rather than a hand-written list of comparisons, so a field added
 * to `DisplaySettings` later is compared automatically. Spelling the fields out would leave
 * Apply permanently greyed for whatever someone forgot to add, which is the kind of bug
 * nobody thinks to look for.
 */
export function sameSettings(a: DisplaySettings, b: DisplaySettings): boolean {
  return (Object.keys(a) as (keyof DisplaySettings)[]).every((key) =>
    key === 'wallpaper' ? sameWallpaper(a.wallpaper, b.wallpaper) : a[key] === b[key],
  )
}

let settings = load()
const listeners = new Set<() => void>()

/** Stamps the root element, which is what the tokens actually key off. */
function apply(s: DisplaySettings) {
  const root = document.documentElement
  // Blue is the value in `:root` itself, so it wants no attribute at all.
  if (s.scheme === 'blue') delete root.dataset.scheme
  else root.dataset.scheme = s.scheme
  root.style.setProperty('--xp-fs', FONT_PX[s.fontSize])
}

apply(settings)

function commit(next: DisplaySettings) {
  settings = next
  apply(next)
  try {
    localStorage.setItem(KEY, JSON.stringify(next))
  } catch {
    // Quota or private mode. The look holds for this session; see fs.isPersisted.
  }
  listeners.forEach((l) => l())
}

export const display = {
  get: () => settings,
  set(patch: Partial<DisplaySettings>) {
    commit({ ...settings, ...patch })
  },
  /**
   * How the machine shipped. Handed out rather than committed, because Display Properties
   * edits a draft — Restore Defaults there is a pending change like any other, and takes
   * effect on Apply.
   */
  defaults: () => DEFAULTS,
}

export function useDisplay(): DisplaySettings {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l)
      return () => listeners.delete(l)
    },
    () => settings,
    () => settings,
  )
}
