import { useSyncExternalStore } from 'react'
import { audio } from '@/os/audio.ts'
import { wm } from '@/os/windowStore.ts'
import { BUDDIES, getBuddy, replyTo, typingTime } from './buddies.ts'

/**
 * The AIM session, held outside React.
 *
 * It has to live here rather than in a component: the Buddy List and every open
 * conversation are separate windows, and they all read the same session. Same
 * shape as os/windowStore.ts — a module-level object plus `useSyncExternalStore`.
 *
 * The buddies' replies are scheduled from here too, not from the IM window, so a
 * conversation keeps moving whether or not its window is open or focused.
 */

export interface Style {
  bold: boolean
  italic: boolean
  underline: boolean
  color: string
}

export interface Message {
  id: number
  /** Whose name goes in front of it. */
  from: string
  mine: boolean
  text: string
  at: number
  style?: Style
  /** `'away'` is an auto-response; `'system'` is the client talking, in italics. */
  kind?: 'away' | 'system'
}

interface State {
  /** Null until sign-on. */
  screenName: string | null
  away: string | null
  chats: Record<string, Message[]>
  typing: Record<string, boolean>
}

const EMPTY: State = { screenName: null, away: null, chats: {}, typing: {} }

let state: State = EMPTY
let seq = 0

const listeners = new Set<() => void>()

function set(next: State) {
  state = next
  listeners.forEach((l) => l())
}

// Every pending reply, so signing off doesn't leave buddies talking to nobody.
const timers = new Set<number>()

function later(fn: () => void, ms: number) {
  const id = window.setTimeout(() => {
    timers.delete(id)
    fn()
  }, ms)
  timers.add(id)
}

function clearTimers() {
  timers.forEach((id) => window.clearTimeout(id))
  timers.clear()
}

// ---------------------------------------------------------------- reads

export const isSignedOn = () => state.screenName !== null

/**
 * Raise the conversation with this buddy, opening a window only if one isn't
 * already up. `singleton` on the app can't express this — it's one window *per
 * buddy*, not one per program.
 */
export function openConversation(buddyId: string) {
  const open = wm
    .list()
    .find(
      (w) =>
        w.appId === 'aimIm' && (w.args as { buddyId?: string })?.buddyId === buddyId,
    )
  if (open) wm.focus(open.id)
  else wm.openApp('aimIm', { buddyId })
}

/** Which buddies have already had this away message — AIM sent it once each. */
let awayNotified = new Set<string>()

// ---------------------------------------------------------------- writes

function push(buddyId: string, message: Omit<Message, 'id' | 'at'>) {
  const history = state.chats[buddyId] ?? []
  set({
    ...state,
    chats: {
      ...state.chats,
      [buddyId]: [...history, { ...message, id: ++seq, at: Date.now() }],
    },
  })
}

function setTyping(buddyId: string, typing: boolean) {
  if (!!state.typing[buddyId] === typing) return
  set({ ...state, typing: { ...state.typing, [buddyId]: typing } })
}

/** A buddy's message arriving — the one path that can trigger an auto-response. */
function receive(buddyId: string, text: string) {
  const buddy = getBuddy(buddyId)
  if (!buddy || !isSignedOn()) return
  push(buddyId, { from: buddy.screenName, mine: false, text })
  // A message arriving is the one AIM event that always made a noise.
  audio.play('notify')

  if (state.away && !awayNotified.has(buddyId)) {
    awayNotified.add(buddyId)
    later(() => {
      if (!state.away) return
      push(buddyId, {
        from: state.screenName ?? '',
        mine: true,
        kind: 'away',
        text: state.away,
      })
    }, 400)
  }
}

function scheduleReply(buddyId: string, incoming: string) {
  const buddy = getBuddy(buddyId)
  if (!buddy?.online) return

  const turn = state.chats[buddyId]?.length ?? 0
  const text = replyTo(buddy, incoming, turn)
  // A beat to read it, then long enough to have typed it.
  const think = 600 + (turn % 3) * 250
  later(() => setTyping(buddyId, true), think)
  later(() => {
    setTyping(buddyId, false)
    receive(buddyId, text)
  }, think + typingTime(buddy, text))
}

export const aim = {
  signOn(screenName: string) {
    const name = screenName.trim()
    if (!name) return
    clearTimers()
    awayNotified = new Set()
    set({ ...EMPTY, screenName: name })

    // Somebody always IMed you within a minute of signing on. The window opens
    // itself, which is exactly as startling as it was in 2001.
    const opener = BUDDIES.find((b) => b.online && !b.away)
    if (!opener) return
    later(() => {
      if (!isSignedOn()) return
      const line = opener.persona.hello[0]
      setTyping(opener.id, true)
      later(() => {
        setTyping(opener.id, false)
        receive(opener.id, line)
        openConversation(opener.id)
      }, typingTime(opener, line))
    }, 9000)
  },

  signOff() {
    clearTimers()
    awayNotified = new Set()
    set(EMPTY)
  },

  send(buddyId: string, text: string, style: Style) {
    const trimmed = text.trim()
    const buddy = getBuddy(buddyId)
    if (!trimmed || !buddy || !isSignedOn()) return

    push(buddyId, {
      from: state.screenName ?? '',
      mine: true,
      text: trimmed,
      style,
    })

    if (!buddy.online) {
      // The bounce-back you got for messaging someone who'd already left.
      later(
        () =>
          push(buddyId, {
            from: '',
            mine: false,
            kind: 'system',
            text: `${buddy.screenName} is not currently signed on. Your message could not be delivered.`,
          }),
        700,
      )
      return
    }

    // Sending clears your away status, the way it did in the real client.
    if (state.away) aim.setAway(null)
    if (buddy.away && !state.chats[buddyId]?.some((m) => m.kind === 'away')) {
      later(
        () =>
          push(buddyId, {
            from: buddy.screenName,
            mine: false,
            kind: 'away',
            text: buddy.away ?? '',
          }),
        500,
      )
      return
    }
    scheduleReply(buddyId, trimmed)
  },

  setAway(message: string | null) {
    awayNotified = new Set()
    set({ ...state, away: message?.trim() ? message.trim() : null })
  },

  clearChat(buddyId: string) {
    if (!state.chats[buddyId]) return
    set({ ...state, chats: { ...state.chats, [buddyId]: [] } })
  },
}

// ---------------------------------------------------------------- subscribe

function subscribe(l: () => void) {
  listeners.add(l)
  return () => {
    listeners.delete(l)
  }
}

/**
 * Selectors must return something referentially stable — a primitive, or a value
 * already held in state. `s => s.chats[id]` is fine; `s => Object.keys(s.chats)`
 * would build a new array on every call and React would reject the snapshot.
 */
function useAim<T>(select: (s: State) => T): T {
  return useSyncExternalStore(
    subscribe,
    () => select(state),
    () => select(state),
  )
}

export const useScreenName = () => useAim((s) => s.screenName)
export const useAway = () => useAim((s) => s.away)
export const useChat = (buddyId: string) => useAim((s) => s.chats[buddyId])
export const useIsTyping = (buddyId: string) => useAim((s) => !!s.typing[buddyId])
