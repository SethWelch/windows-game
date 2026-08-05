import type { LevelName } from './engine.ts'

/**
 * The "Fastest Mine Sweepers" table, persisted the same way os/fs.ts is — one
 * localStorage key, written whole, tolerant of anything unparseable.
 */

const KEY = 'xp:minesweeper'

/** Custom fields keep no record, so only the three presets are scored. */
export type ScoredLevel = Exclude<LevelName, 'custom'>

export interface BestTime {
  /** Seconds. 999 is the "no record yet" value winmine shipped with. */
  time: number
  name: string
}

export type BestTimes = Record<ScoredLevel, BestTime>

export const SCORED_LEVELS: ScoredLevel[] = ['beginner', 'intermediate', 'expert']

export const LEVEL_LABELS: Record<ScoredLevel, string> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  expert: 'Expert',
}

const blank = (): BestTimes => ({
  beginner: { time: 999, name: 'Anonymous' },
  intermediate: { time: 999, name: 'Anonymous' },
  expert: { time: 999, name: 'Anonymous' },
})

export function loadBestTimes(): BestTimes {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return blank()
    const parsed = JSON.parse(raw) as Partial<BestTimes>
    const base = blank()
    for (const level of SCORED_LEVELS) {
      const entry = parsed?.[level]
      if (typeof entry?.time === 'number' && typeof entry?.name === 'string') {
        base[level] = entry
      }
    }
    return base
  } catch {
    return blank()
  }
}

/** Best-effort: a full quota or private mode just means the table is per-session. */
export function saveBestTimes(times: BestTimes) {
  try {
    localStorage.setItem(KEY, JSON.stringify(times))
  } catch {
    // Nothing to report — a lost high score is not worth a message box.
  }
}

export const resetBestTimes = (): BestTimes => {
  const fresh = blank()
  saveBestTimes(fresh)
  return fresh
}
