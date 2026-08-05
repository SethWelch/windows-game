import { useSyncExternalStore } from 'react'
import type { IconId } from '@/icons/registry.ts'

/**
 * Things a *program* has thrown away, as opposed to files.
 *
 * The Recycle Bin holds shell objects, not only nodes out of os/fs.ts — so a program
 * can put something of its own in there and take it back. Solitaire is the first
 * caller: drag a card onto the bin and it leaves play, restore it and the game puts
 * it back on the deck.
 *
 * Deliberately not persisted. A discarded card only means anything to the deal it
 * came out of, and every deal is fresh — a card surviving a reload would be an item
 * nothing could ever reclaim.
 */

export interface DiscardedItem {
  id: string
  /** The program that will take it back. */
  appId: string
  iconId: IconId
  /** Shown in the Name column. */
  label: string
  /** Shown in the Type column. */
  kind: string
  /** Shown in the Original Location column. */
  origin: string
  at: number
  /** Opaque to the shell — only the owning program reads it. */
  payload: string
}

/** Returns true if the program took the item back. */
type Reclaim = (payload: string) => boolean

let items: DiscardedItem[] = []
let seq = 0
const owners = new Map<string, Reclaim>()
const listeners = new Set<() => void>()

function commit(next: DiscardedItem[]) {
  items = next
  listeners.forEach((l) => l())
}

export const discard = {
  add(item: Omit<DiscardedItem, 'id' | 'at'>): string {
    const id = `disc-${++seq}`
    commit([...items, { ...item, id, at: Date.now() }])
    return id
  },

  /**
   * Registers the program that can reclaim its own items. Returns the teardown, so
   * a component can hand this straight back from an effect.
   */
  handle(appId: string, reclaim: Reclaim): () => void {
    owners.set(appId, reclaim)
    return () => {
      if (owners.get(appId) === reclaim) owners.delete(appId)
    }
  },

  /**
   * The two ways this fails are different things to tell someone about, so they're
   * different answers: nobody is listening, versus the program looked and said no —
   * which is how Solitaire declines a card belonging to a deal that has moved on.
   * The item stays in the bin either way.
   */
  restore(id: string): 'restored' | 'no-owner' | 'refused' {
    const item = items.find((i) => i.id === id)
    if (!item) return 'refused'
    const owner = owners.get(item.appId)
    if (!owner) return 'no-owner'
    if (!owner(item.payload)) return 'refused'
    commit(items.filter((i) => i.id !== id))
    return 'restored'
  },

  remove(id: string) {
    if (!items.some((i) => i.id === id)) return
    commit(items.filter((i) => i.id !== id))
  },

  clear() {
    if (!items.length) return
    commit([])
  },
}

export function useDiscarded(): DiscardedItem[] {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l)
      return () => listeners.delete(l)
    },
    () => items,
    () => items,
  )
}
