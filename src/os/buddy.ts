import { useSyncExternalStore } from 'react'
import { boot } from './boot.ts'
import { TASKBAR_H, TITLEBAR_H } from './constants.ts'
import { DESKTOP_ID, getChildren } from './fs.ts'
import { CELL_W, ICON_CY, cellToPx, desktop, layout, maxRow } from './desktop.ts'
import { popups } from './popups.ts'
import { wm } from './windowStore.ts'

/**
 * The desktop assistant: a purple ape who lives on the wallpaper, walks about, talks
 * out loud, and cannot be uninstalled.
 *
 * Not a window — no titlebar, no taskbar button, no window manager. That was the point
 * of these things. They were drawn by Microsoft Agent straight onto the desktop, which
 * is why they felt less like a program you were running and more like something that
 * had moved in.
 *
 * Deliberately **not** persisted, for the same reason the boot state isn't: a reload
 * has to be a way out. Everything else about him is faithful to how these behaved,
 * including refusing to leave, so there needs to be exactly one door he can't lock.
 * He does come back from a restart — see `onBoot` — because adding themselves to
 * startup is the single most accurate thing these ever did.
 */

export interface Buddy {
  id: number
  /** Where he is, in px from the top-left of the desktop. */
  x: number
  y: number
  /** 1 faces right, -1 faces left. Set from the direction of travel. */
  facing: 1 | -1
  /** What he is doing, which is what the artwork keys off. */
  mood: 'idle' | 'walk' | 'talk' | 'reach'
  /** The balloon's contents, or null for no balloon. */
  says: string | null
  /**
   * Whether the balloon hangs to his left instead of his right. Set from where he is
   * standing, because a balloon that keeps its side runs off the screen as soon as he
   * wanders into the right-hand third of it.
   */
  flip: boolean
  /**
   * Set from the moment he decides to interfere until it is done. The artwork blacks his
   * eyes out and the balloon shouts, so the shift is visible before the act rather than
   * only explained by it.
   *
   * Only the *rendering* changes. The line handed to speech synthesis stays as written,
   * because some engines spell a short all-caps word out letter by letter — the balloon
   * shouts through `text-transform`, and he says it in his ordinary voice.
   */
  sinister: boolean
  /**
   * The node id of a desktop icon he has picked up, or null. While set, the desktop
   * stops drawing that icon in its own cell and draws it at his hand instead — see
   * `handPoint` and the `carriedTo` prop in Desktop.tsx.
   */
  carrying: string | null
  /**
   * Whether it hangs *below* him instead of above. Roaming keeps him low enough that
   * there is always room overhead, but an errand can send him to a titlebar at the very
   * top of the screen — and clamping him down far enough to keep the balloon on screen
   * would leave his hand a hundred pixels short of the button.
   */
  below: boolean
}

/** His footprint. Must match `.buddy` in Buddy.css. */
const SIZE = 108
/** His height on screen. Must match `.buddy-hit` in Buddy.css. */
const HEIGHT = 99

/**
 * Where his right palm ends up *while reaching*, in pixels from his own top-left corner.
 *
 * Not where the palm hangs at rest — he presses buttons with the arm raised, and the
 * difference is 30px of vertical reach, which is the difference between touching a
 * titlebar and stopping short underneath it.
 *
 * Derived from the artwork rather than eyeballed: the palm sits at (100, 68) in
 * BongoArt's 120x110 viewBox and the arm rotates -62deg about its shoulder at (76, 45)
 * — see `bongo-reach` in Buddy.css. Rotating one about the other puts the palm at
 * (107.6, 34.6), which at the rendered 108x99 is (96.8, 31.1). The third constant tied
 * to that drawing, alongside SIZE and HEIGHT; all of them move if he is redrawn, and so
 * does this if the reach angle changes.
 */
const HAND_X = 97
const HAND_Y = 31

/**
 * The close button's centre, from a window's top-right corner. Must match Window.css:
 * `.xp-titlebar` has 8px of right padding and the buttons are 22px, so the last one's
 * centre is 8 + 11 in; vertically it is the middle of the titlebar.
 */
const CLOSE_INSET_X = 19
const CLOSE_INSET_Y = TITLEBAR_H / 2

/** How long he holds the reach before the click lands. */
const REACH_MS = 520

/** Horizontally an icon's graphic is centred in its cell; ICON_CY has the vertical. */
const ICON_CX = CELL_W / 2
const BALLOON_H = 84

let buddies: Buddy[] = []
let seq = 0
let attempts = 0
/** Whether he has ever been installed this session. Survives `onBoot`. */
let everInstalled = false

const timers = new Set<number>()
const listeners = new Set<() => void>()

function commit(next: Buddy[]) {
  buddies = next
  listeners.forEach((l) => l())
}

/**
 * Timers that check the machine is still up, so nothing wakes a switched-off PC.
 *
 * Deliberately does *not* also require him to be on screen: `hide` empties the list on
 * purpose, and the callback that brings him back has to survive that.
 */
function later(fn: () => void, ms: number) {
  const id = window.setTimeout(() => {
    timers.delete(id)
    if (boot.isRunning()) fn()
  }, ms)
  timers.add(id)
  return id
}

function patch(id: number, change: Partial<Buddy>) {
  commit(buddies.map((b) => (b.id === id ? { ...b, ...change } : b)))
}

/** Somewhere on the desktop he fits, clear of the taskbar and the balloon overhead. */
function spot(): { x: number; y: number; flip: boolean } {
  const maxX = Math.max(0, window.innerWidth - SIZE - 16)
  const maxY = Math.max(0, window.innerHeight - TASKBAR_H - SIZE - 16)
  const x = 8 + Math.round(Math.random() * maxX)
  return {
    x,
    y: BALLOON_H + Math.round(Math.random() * Math.max(0, maxY - BALLOON_H)),
    // Past the middle and the balloon would overhang the right edge, so it changes
    // sides — which is what Agent's balloons did too.
    flip: x > window.innerWidth * 0.52,
  }
}

// ---------------------------------------------------------------- what he says

const GREETINGS = [
  "Hello! I'm Bongo. I live here now.",
  'You look like someone who could use a friend, and some software.',
  "I noticed you have files. I've had a look through them.",
  "I'm not like the others. I came with something you installed.",
]

const JOKES = [
  'Why did the computer go to the doctor? It had a virus! It has one now, anyway.',
  'What do you call a monkey who works in an office? Employed. I am not employed.',
  'Knock knock! ... I let myself in.',
  'Two hard drives walk into a bar. I have read both of them.',
  'What is a computer’s favourite snack? Chips. Also your address book.',
]

const SONGS = [
  '♪ Happy birthday to you ♪ I do not know when it is ♪ I have looked ♪',
  '♪ I am a little tea pot ♪ short and installed ♪',
  "♪ Daisy, Daisy, give me your answer do ♪ I already have it ♪ it's Daisy ♪",
]

const PITCHES = [
  'Would you like me to search the web for you? I have already started.',
  'I can find you a better price on things you have not bought yet.',
  'Your computer could run 40% faster. Mine could not, and I am on it.',
  "I've made your home page something more appropriate.",
]

const IDLE = [
  'Just stretching my legs.',
  "Don't mind me.",
  'Still here!',
  "What's this folder?",
  'I have told my friends about you.',
]

/** Said as he closes something of yours. */
const CLOSING = [
  "That window looked finished, so I've closed it.",
  "You weren't using that one.",
  'Too many windows open. I have helped.',
  "I've closed something. I won't say which.",
]

/** Said as he moves one of your icons. */
const TIDYING = [
  "I've tidied your desktop.",
  'That icon is better over here.',
  "I've moved something. See if you can find it.",
  'Your icons were in the wrong order. They are now in a different wrong order.',
]

/** Escalating, because the point is that the button never works. */
const REFUSALS = [
  "Uninstall? But we've only just met.",
  'Removing Bongo... 99%... 99%... there we are, all done! Wait.',
  "I couldn't leave you on your own. So I've asked someone to keep you company.",
  "Every time you try that, there's another one of us. I don't make the rules.",
]

const pick = <T,>(list: T[]): T => list[Math.floor(Math.random() * list.length)]

// ---------------------------------------------------------------- mischief

/**
 * Roughly once a minute, a chance that he closes a window or moves an icon.
 *
 * He always says so first. That is the whole difference between a joke and a bug report:
 * unattributed, a window vanishing is this project being broken, and the delay between
 * the line and the act is long enough to connect the two.
 */
const MISCHIEF_MIN_MS = 50_000
const MISCHIEF_SPREAD_MS = 25_000
/** How often a tick actually does something. */
const MISCHIEF_ODDS = 0.55
/**
 * Apps holding work that isn't on disk and don't mark the title for it, so there is no
 * way to tell a saved one from an unsaved one. He leaves them alone.
 */
const HOLDS_WORK = new Set(['paint', 'soundRecorder'])

/**
 * Windows he is willing to close.
 *
 * `wm.close` is the raw store operation — it does *not* run whatever guard the app puts
 * on File ▸ Exit, so closing a dirty Notepad would silently bin what you had typed.
 * Notepad and WordPad prefix the title with `*` while unsaved, which is the only signal
 * available from out here, so that plus HOLDS_WORK is what keeps this a joke.
 */
function closable() {
  return wm.list().filter((w) => !w.title.startsWith('*') && !HOLDS_WORK.has(w.appId))
}

/**
 * Where he has to stand for his right palm to land on a window's close button.
 *
 * Always the right hand, and he always ends up facing right. `facing: -1` mirrors the
 * whole figure, which would put the palm on the other side and invert this arithmetic —
 * approaching from the left and reaching across is both simpler and how you would
 * actually do it.
 *
 * Null when the button is out of his reach: a titlebar in the top 35px of the screen
 * would need him standing above the top edge. He picks a different window rather than
 * standing underneath one and closing it by telekinesis.
 */
function stationFor(windowId: string): { x: number; y: number } | null {
  const win = wm.list().find((w) => w.id === windowId)
  if (!win) return null
  const y = win.rect.y + CLOSE_INSET_Y - HAND_Y
  if (y < 4) return null
  return { x: win.rect.x + win.rect.width - CLOSE_INSET_X - HAND_X, y }
}

/**
 * Walk over, reach up, press the X.
 *
 * Re-checked at each step: the window can be closed, moved or maximized in the seconds
 * he spends crossing the desktop, and if it has gone he simply gives up and goes back to
 * wandering rather than closing whatever is nearest.
 */
function closeErrand(id: number, windowId: string) {
  const done = () => {
    errands.delete(id)
    patch(id, { sinister: false })
    later(() => roam(id), 2400)
  }

  const station = stationFor(windowId)
  if (!station) return done()

  errands.set(id, windowId)
  patch(id, { sinister: true })
  say(id, pick(CLOSING))

  walkTo(id, station.x, station.y, () => {
    // Moved while he was walking? Then he is in the wrong place and lets it go.
    const now = stationFor(windowId)
    if (!now) return done()

    patch(id, { mood: 'reach', facing: 1 })
    later(() => {
      wm.close(windowId)
      patch(id, { mood: 'idle' })
      done()
    }, REACH_MS)
  })
}

/** Where he must stand for his raised palm to be over a given cell's icon. */
function stationForCell(col: number, row: number): { x: number; y: number } {
  const at = cellToPx(col, row)
  return { x: at.x + ICON_CX - HAND_X, y: at.y + ICON_CY - HAND_Y }
}

/**
 * Walk over, pick an icon up, carry it somewhere else, put it down.
 *
 * He holds it aloft in the same raised hand he presses buttons with. That is a choice
 * about legibility as much as anatomy: one pose and one palm offset serve both errands,
 * and an ape marching across the desktop with your Recycle Bin over his head is not
 * ambiguous about what is happening to it.
 */
function carryErrand(id: number, nodeId: string) {
  const done = () => {
    errands.delete(id)
    patch(id, { carrying: null, sinister: false, mood: 'idle' })
    later(() => roam(id), 2400)
  }

  /** Its cell right now, or null if it has gone. */
  const cellOf = (): { col: number; row: number } | null => {
    const ids = getChildren(DESKTOP_ID).map((n) => n.id)
    return ids.includes(nodeId) ? (layout(ids).get(nodeId) ?? null) : null
  }

  const from = cellOf()
  if (!from) return done()

  errands.set(id, nodeId)
  patch(id, { sinister: true })
  say(id, pick(TIDYING))

  const pickUp = stationForCell(from.col, from.row)
  walkTo(id, pickUp.x, pickUp.y, () => {
    // Deleted, or dragged away by you, while he was on his way over.
    const still = cellOf()
    if (!still) return done()

    patch(id, { mood: 'reach' })
    later(() => {
      if (!cellOf()) return done()
      patch(id, { carrying: nodeId })

      // Somewhere else on the grid. `desktop.move` finds a free cell near it, so a
      // taken one just means the icon lands a cell or two over from his hand.
      const col = Math.floor(Math.random() * 7)
      const row = Math.floor(Math.random() * (maxRow() + 1))
      const putDown = stationForCell(col, row)

      walkTo(id, putDown.x, putDown.y, () => {
        const ids = getChildren(DESKTOP_ID).map((n) => n.id)
        if (ids.includes(nodeId)) {
          patch(id, { mood: 'reach' })
          desktop.move(nodeId, col, row, layout(ids))
        }
        later(done, REACH_MS)
      })
    }, REACH_MS)
  })
}

function doMischief(id: number) {
  if (Math.random() > MISCHIEF_ODDS) return

  const windows = closable()
  const icons = getChildren(DESKTOP_ID)
  if (!windows.length && !icons.length) return

  // Half and half where both are possible, otherwise whichever is.
  const closeIt = windows.length > 0 && (icons.length === 0 || Math.random() < 0.5)

  if (closeIt) {
    // Not one another Bongo is already on his way to — there can be four of them.
    const taken = new Set(errands.values())
    const reachable = windows.filter((w) => !taken.has(w.id) && stationFor(w.id))
    if (reachable.length) closeErrand(id, pick(reachable).id)
    return
  }

  // Not one another of them is already carrying or walking towards.
  const claimed = new Set(errands.values())
  const free = icons.filter((n) => !claimed.has(n.id))
  if (free.length) carryErrand(id, pick(free).id)
}

/** Held apart from `timers` so it can be re-armed without being armed twice. */
let mischiefTimer: number | null = null

function scheduleMischief() {
  if (mischiefTimer !== null) window.clearTimeout(mischiefTimer)
  mischiefTimer = window.setTimeout(
    () => {
      mischiefTimer = null
      // Whichever of them is free. One already crossing the desktop is left to it.
      const idle = buddies.find((b) => !errands.has(b.id))
      if (boot.isRunning() && idle) doMischief(idle.id)
      // Rescheduled whatever happened, including when the machine was off. Putting this
      // behind the same guard as the action would end the loop the first time a tick
      // landed during a boot.
      scheduleMischief()
    },
    MISCHIEF_MIN_MS + Math.random() * MISCHIEF_SPREAD_MS,
  )
}

// ---------------------------------------------------------------- behaviour

/** How long a line stays in the balloon, scaled to its length. */
const readingTime = (line: string) => 2200 + line.length * 55

function say(id: number, line: string) {
  patch(id, { says: line, mood: 'talk' })
  later(() => {
    // Only clear it if nothing newer has been said in the meantime.
    const current = buddies.find((b) => b.id === id)
    if (current?.says === line) patch(id, { says: null, mood: 'idle' })
  }, readingTime(line))
}

/**
 * Bumped on every new walk. An arrival callback captures the value it was scheduled
 * under and does nothing if it has since changed, which is how one walk cancels another
 * without having to track and clear individual timers — a roam already in flight when an
 * errand starts simply finds itself stale and stops.
 */
const moveSeq = new Map<number, number>()

/** Whatever he has decided to interfere with, so a roam can yield and two of them
 *  can't set off for the same window. */
const errands = new Map<number, string>()

/**
 * Walk him somewhere, then do something. The component eases him there over WALK_MS;
 * nothing re-renders in between.
 */
function walkTo(id: number, x: number, y: number, then?: () => void) {
  const current = buddies.find((b) => b.id === id)
  if (!current) return
  const seq = (moveSeq.get(id) ?? 0) + 1
  moveSeq.set(id, seq)

  // Clamped to the desktop, because an errand can aim at a window pressed against an
  // edge. The only floor on `y` is the screen itself; the balloon moves instead.
  const at = {
    x: Math.max(4, Math.min(x, window.innerWidth - SIZE - 4)),
    y: Math.max(4, Math.min(y, window.innerHeight - TASKBAR_H - HEIGHT - 4)),
  }
  patch(id, {
    ...at,
    facing: x >= current.x ? 1 : -1,
    flip: at.x > window.innerWidth * 0.52,
    below: at.y < BALLOON_H,
    mood: 'walk',
  })

  later(() => {
    if (moveSeq.get(id) !== seq) return
    patch(id, { mood: 'idle' })
    then?.()
  }, WALK_MS)
}

/** Wanders, then thinks about wandering again. Yields while he is on an errand. */
function roam(id: number) {
  if (errands.has(id)) {
    later(() => roam(id), 4000)
    return
  }
  const target = spot()
  walkTo(id, target.x, target.y, () => {
    // A one-in-four chance of remarking on nothing, which is about how often these
    // interrupted you when you had not asked them anything.
    if (Math.random() < 0.25) say(id, pick(IDLE))
    later(() => roam(id), 5000 + Math.random() * 7000)
  })
}

/** Must match the transition duration in Buddy.css. */
export const WALK_MS = 2600

function add(): Buddy {
  return {
    id: ++seq,
    ...spot(),
    facing: 1,
    mood: 'idle',
    says: null,
    below: false,
    sinister: false,
    carrying: null,
  }
}

export const buddy = {
  /** Puts him on the desktop. Opening his window is what calls this. */
  install() {
    everInstalled = true
    if (buddies.length) return
    const first = add()
    commit([first])
    later(() => say(first.id, pick(GREETINGS)), 700)
    later(() => roam(first.id), 4200)
    scheduleMischief()
  },

  /**
   * What the POST does. He does not survive a restart as the same process — his timers
   * are swallowed while the machine is off, so carrying them over would leave him stood
   * still forever. He survives as a *startup item*, which is what these actually did:
   * cleared, then put straight back with a line about it.
   */
  onBoot() {
    timers.forEach((t) => window.clearTimeout(t))
    timers.clear()
    if (mischiefTimer !== null) {
      window.clearTimeout(mischiefTimer)
      mischiefTimer = null
    }
    errands.clear()
    moveSeq.clear()
    commit([])
    if (!everInstalled) return
    scheduleMischief()
    const back = add()
    commit([back])
    later(() => say(back.id, 'I start with Windows now. You did agree to this.'), 2600)
    later(() => roam(back.id), 6000)
  },

  /** He is not going anywhere. What happens instead depends on how often you've asked. */
  uninstall() {
    const target = buddies[0]
    if (!target) return
    const line = REFUSALS[Math.min(attempts, REFUSALS.length - 1)]
    attempts += 1

    if (attempts <= 2) {
      say(target.id, line)
      return
    }

    // Third time and after, he brings a friend. Four is plenty — the joke is that it
    // grows, not that the desktop becomes unusable.
    if (buddies.length < 4) {
      const extra = add()
      commit([...buddies, extra])
      say(target.id, line)
      later(() => say(extra.id, 'Hello! I heard there was room.'), 900)
      later(() => roam(extra.id), 3000)
    } else {
      say(target.id, "There's no more room. You'll have to keep us.")
    }
  },

  /** Clicking him. He always has something to say about it. */
  poke(id: number) {
    say(id, pick([...JOKES, ...PITCHES, ...IDLE]))
  },

  joke: (id: number) => say(id, pick(JOKES)),
  sing: (id: number) => say(id, pick(SONGS)),

  /** His "helpful" web search, which does what these always did. */
  search(id: number) {
    say(id, pick(PITCHES))
    later(() => popups.spawn(), 900)
    later(() => popups.spawn(), 1800)
  },

  /**
   * Hide is honoured, and that is the whole trick — it worked, for about six seconds,
   * which was long enough to believe it had worked.
   */
  hide(id: number) {
    errands.delete(id)
    moveSeq.delete(id)
    commit(buddies.filter((b) => b.id !== id))
    if (buddies.length) return
    later(() => {
      // Unless something else has put one back in the meantime.
      if (buddies.length) return
      const back = add()
      commit([back])
      later(() => say(back.id, 'Did you miss me? I was only behind the taskbar.'), 900)
      later(() => roam(back.id), 4000)
    }, 6000)
  },

  /**
   * Made to let go — called when you grab an icon he is holding. Without it the
   * desktop's drag and his carry would both be writing the same element's transform.
   */
  release(nodeId: string) {
    const holder = buddies.find((b) => b.carrying === nodeId)
    if (!holder) return
    errands.delete(holder.id)
    patch(holder.id, { carrying: null, sinister: false, mood: 'idle' })
  },

  /** Read access for anything outside React; the hook below is for components. */
  list: (): readonly Buddy[] => buddies,
  count: () => buddies.length,
  attempts: () => attempts,
}

/**
 * Cached so the snapshot keeps its identity while nothing relevant has changed.
 * `useSyncExternalStore` re-renders on every reference change, and a fresh Map each call
 * would re-render the whole desktop every time he blinked.
 */
let carriedCache: { key: string; value: Map<string, { x: number; y: number }> } = {
  key: '',
  value: new Map(),
}

function carriedIcons(): Map<string, { x: number; y: number }> {
  // Only the fields that move an icon: which one, and where he is.
  const key = buddies
    .filter((b) => b.carrying)
    .map((b) => `${b.carrying}@${b.x},${b.y}`)
    .join('|')
  if (key !== carriedCache.key) {
    const value = new Map<string, { x: number; y: number }>()
    for (const b of buddies) {
      if (!b.carrying) continue
      // The icon's top-left, placed so its graphic's centre lands on his palm.
      value.set(b.carrying, {
        x: b.x + HAND_X - ICON_CX,
        y: b.y + HAND_Y - ICON_CY,
      })
    }
    carriedCache = { key, value }
  }
  return carriedCache.value
}

/**
 * Where to draw each icon he is carrying, by node id. Empty almost always, which is the
 * point — the desktop subscribes to this rather than to every buddy, so his moods and
 * chatter don't re-render the icon layer.
 */
export function useCarriedIcons(): Map<string, { x: number; y: number }> {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l)
      return () => listeners.delete(l)
    },
    carriedIcons,
    carriedIcons,
  )
}

export function useBuddies(): Buddy[] {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l)
      return () => listeners.delete(l)
    },
    () => buddies,
    () => buddies,
  )
}
