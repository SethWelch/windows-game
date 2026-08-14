import { useSyncExternalStore } from 'react'
import { DEFAULT_SKIN, isSkin } from '@/apps/mediaPlayer/skins.ts'
import type { SkinId } from '@/apps/mediaPlayer/skins.ts'
import { clamp } from './constants.ts'

/**
 * What Media Player remembers between sessions: its own volume, and its skin.
 *
 * Separate from the shell mixer in os/audio.ts on purpose, because they were separate
 * things: the tray slider is the machine's volume and this is the program's, and the two
 * multiply — see the note in apps/mediaPlayer/useRadio.ts. Turning the machine down
 * quietened Media Player, but turning Media Player down never touched the machine.
 *
 * Persisted, because a volume you have to set every time you open a program is not a
 * setting. The shell mixer has always survived a reload; this is the half that didn't.
 *
 * Shared across windows rather than held per-window. Two Media Players are two radios —
 * `useRadio` is a hook for exactly that reason — but volume is a preference, not part of
 * a playback session, and one program remembering one volume is what the real one did.
 */

export interface PlayerSettings {
  /** 0-100, matching the shell mixer's range so the two can be multiplied. */
  volume: number
  muted: boolean
  /** Which skin the player wears. See apps/mediaPlayer/skins.ts. */
  skin: SkinId
}

const KEY = 'xp:mediaplayer'

const DEFAULTS: PlayerSettings = { volume: 70, muted: false, skin: DEFAULT_SKIN }

function load(): PlayerSettings {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return DEFAULTS
    const parsed = JSON.parse(raw) as Partial<PlayerSettings>
    return {
      // Clamped as well as type-checked: a hand-edited payload should not be able to put
      // a value outside 0-1 into `el.volume`, which throws rather than saturating.
      volume:
        typeof parsed.volume === 'number' && Number.isFinite(parsed.volume)
          ? Math.round(clamp(parsed.volume, 0, 100))
          : DEFAULTS.volume,
      muted: parsed.muted === true,
      // Membership-checked rather than `??`-defaulted: a skin we no longer ship would
      // stamp an attribute nothing in the stylesheet answers, and the player would come
      // up with no colours at all.
      skin: isSkin(parsed.skin) ? parsed.skin : DEFAULTS.skin,
    }
  } catch {
    return DEFAULTS
  }
}

let settings = load()
const listeners = new Set<() => void>()

function commit(next: PlayerSettings) {
  settings = next
  try {
    localStorage.setItem(KEY, JSON.stringify(next))
  } catch {
    // Quota or private mode. It holds for this session; see fs.isPersisted.
  }
  listeners.forEach((l) => l())
}

export const player = {
  get: () => settings,

  setVolume(volume: number) {
    const next = Math.round(clamp(volume, 0, 100))
    if (next === settings.volume && !settings.muted) return
    // Spread, not a fresh object: this used to be the only setting here and dropping the
    // rest on the floor was invisible until there was a rest to drop.
    // Moving the slider unmutes, which is what both this and the tray always did.
    commit({ ...settings, volume: next, muted: false })
  },

  setMuted(muted: boolean) {
    if (muted === settings.muted) return
    commit({ ...settings, muted })
  },

  setSkin(skin: SkinId) {
    if (skin === settings.skin) return
    commit({ ...settings, skin })
  },
}

export function usePlayerSettings(): PlayerSettings {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l)
      return () => listeners.delete(l)
    },
    () => settings,
    () => settings,
  )
}
