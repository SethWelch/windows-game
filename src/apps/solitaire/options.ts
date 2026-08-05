import type { Rules, Scoring } from './engine.ts'

/**
 * Everything the Options and Deck dialogs set, persisted the way the rest of the
 * shell persists things: one localStorage key, written whole, tolerant of junk.
 */

const KEY = 'xp:solitaire'

export interface Options extends Rules {
  timed: boolean
  statusBar: boolean
  /** Which card back, 1-based — see `.xp-sol-back` in Solitaire.css. */
  back: number
}

export const BACK_COUNT = 4

const DEFAULTS: Options = {
  drawThree: true,
  scoring: 'standard',
  timed: false,
  statusBar: true,
  back: 1,
}

const SCORINGS: Scoring[] = ['standard', 'vegas', 'none']

export function loadOptions(): Options {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return DEFAULTS
    const p = JSON.parse(raw) as Partial<Options>
    return {
      drawThree: typeof p.drawThree === 'boolean' ? p.drawThree : DEFAULTS.drawThree,
      scoring:
        p.scoring && SCORINGS.includes(p.scoring) ? p.scoring : DEFAULTS.scoring,
      timed: typeof p.timed === 'boolean' ? p.timed : DEFAULTS.timed,
      statusBar: typeof p.statusBar === 'boolean' ? p.statusBar : DEFAULTS.statusBar,
      back:
        typeof p.back === 'number' && p.back >= 1 && p.back <= BACK_COUNT
          ? Math.trunc(p.back)
          : DEFAULTS.back,
    }
  } catch {
    return DEFAULTS
  }
}

/** Best-effort: a blocked write just means the settings are per-session. */
export function saveOptions(options: Options) {
  try {
    localStorage.setItem(KEY, JSON.stringify(options))
  } catch {
    // Nothing worth interrupting the player over.
  }
}
