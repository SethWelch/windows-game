import type { Instrument } from '@/os/instrument.ts'
import type { Note } from './music/notation.ts'

/**
 * The clock that plays the library.
 *
 * The sound itself is in os/instrument.ts, shared with the piano — this is only the part
 * that decides *when*, which is the part that is easy to get wrong. The instrument is passed
 * in rather than built here, so an app that both plays a piece and lets you play along has
 * one instrument and one graph rather than two of everything.
 *
 * Timing is on the audio clock, never on a timer. A `setInterval` fires whenever the main
 * thread gets round to it, so scheduling a note *at* the moment it should sound would put
 * audible jitter on every one. Instead the interval only looks ahead: every tick it hands the
 * audio thread every note starting in the next `LOOKAHEAD` seconds, stamped with an exact
 * `ctx.currentTime` offset. The interval can be late by tens of milliseconds and the music
 * still comes out metronomic.
 */

/** How often to top up the schedule. Comfortably shorter than the lookahead. */
const TICK_MS = 60

/** How far ahead to schedule. Long enough to survive a slow frame, short enough to seek. */
const LOOKAHEAD = 0.35

export interface Player {
  /** Points the player at a piece and parks it at the start. */
  load(notes: Note[]): void
  /** Runs from wherever it is parked. */
  start(): void
  /** Silences everything and parks where it stopped. */
  stop(): void
  /** Moves the parked position, and keeps running if it was. */
  seek(seconds: number): void
  /** Seconds into the piece. */
  position(): number
  /** The player's own level, 0-1, before the shell mixer. */
  setGain(gain: number): void
  dispose(): void
}

export function createPlayer(ctx: AudioContext, instrument: Instrument): Player {
  let notes: Note[] = []
  let timer: number | null = null
  /** Audio-clock time at which piece-time zero sits. Only meaningful while running. */
  let origin = 0
  /** Where we are when not running. */
  let parked = 0
  /** How far into `notes` the scheduler has got. */
  let cursor = 0

  const running = () => timer !== null
  const position = () => (running() ? Math.max(0, ctx.currentTime - origin) : parked)

  /** Hands the audio thread everything starting inside the lookahead window. */
  function fill() {
    const horizon = position() + LOOKAHEAD
    while (cursor < notes.length && notes[cursor].at < horizon) {
      const note = notes[cursor++]
      // `origin + at` is the exact moment it should sound, however late this tick was.
      instrument.strike(
        note.midi,
        note.velocity,
        Math.max(ctx.currentTime, origin + note.at),
        note.dur,
      )
    }
  }

  function halt() {
    if (timer !== null) window.clearInterval(timer)
    timer = null
    instrument.panic()
  }

  return {
    load(next) {
      const changed = next !== notes
      halt()
      notes = next
      if (changed) parked = 0
      cursor = 0
    },

    start() {
      if (running() || !notes.length) return
      origin = ctx.currentTime - parked
      // Notes before the parked position are already past; skip them rather than firing them
      // all at once, which is what seeking into the middle of a piece would do.
      cursor = notes.findIndex((n) => n.at >= parked)
      if (cursor < 0) cursor = notes.length
      fill()
      timer = window.setInterval(fill, TICK_MS)
    },

    stop() {
      if (!running()) return
      parked = position()
      halt()
    },

    seek(seconds) {
      const was = running()
      halt()
      parked = Math.max(0, seconds)
      if (was) this.start()
    },

    position,
    setGain: instrument.setGain,
    /** Stops the clock. The instrument belongs to the caller, so it is left alone. */
    dispose: halt,
  }
}
