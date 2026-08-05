import { useSyncExternalStore } from 'react'
import { APP_LIST } from './apps.ts'

/**
 * Which programs are pinned to the Start menu.
 *
 * `AppDefinition.startMenuSection` supplies the initial list, but pinning is a
 * user decision, so it can't stay in code — this holds the live list and persists
 * it, the way os/desktop.ts holds icon positions. Order is the pin order, which is
 * also the order XP showed them in.
 */

const KEY = 'xp:startmenu'

const defaults = () =>
  APP_LIST.filter((a) => a.startMenuSection === 'pinned').map((a) => a.id)

function load(): string[] {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return defaults()
    const parsed = JSON.parse(raw) as { pinned?: unknown }
    if (!Array.isArray(parsed.pinned)) return defaults()
    // Drop ids for apps that have since been removed from APP_LIST.
    return parsed.pinned.filter(
      (id): id is string =>
        typeof id === 'string' && APP_LIST.some((a) => a.id === id),
    )
  } catch {
    return defaults()
  }
}

let pinned = load()
const listeners = new Set<() => void>()

function commit(next: string[]) {
  pinned = next
  try {
    localStorage.setItem(KEY, JSON.stringify({ pinned }))
  } catch {
    // The pin just won't survive a reload.
  }
  listeners.forEach((l) => l())
}

export const startMenu = {
  isPinned: (appId: string) => pinned.includes(appId),

  pin(appId: string) {
    if (pinned.includes(appId)) return
    commit([...pinned, appId])
  },

  unpin(appId: string) {
    if (!pinned.includes(appId)) return
    commit(pinned.filter((id) => id !== appId))
  },
}

export function usePinnedIds(): string[] {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l)
      return () => listeners.delete(l)
    },
    () => pinned,
    () => pinned,
  )
}
