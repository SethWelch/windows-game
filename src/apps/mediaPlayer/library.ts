import { durationOf, notesOf } from './music/notation.ts'
import { PIECES } from './music/pieces.ts'
import type { Note } from './music/notation.ts'

/**
 * The library, which is real music now.
 *
 * It used to be invented titles with plausible lengths, there only to give the transport
 * something to run against. Every field here is derived from an actual piece in
 * music/pieces.ts instead: the length is how long it takes to play, and playing it is what
 * you hear. That makes the seek bar, the clock, Next and the end-of-playlist behaviour all
 * mean what they say.
 *
 * The notes come along on the track, because the transport needs to hand them to the
 * synth and nothing else has to know where they came from.
 */

export interface Track {
  id: string
  title: string
  /** The composer. Shown in the Artist column, which is close enough to what it is. */
  artist: string
  album: string
  /** Seconds. Measured from the notation, not asserted. */
  length: number
  /** What the status bar quotes where a real file would have a bitrate. */
  detail: string
  notes: Note[]
}

export const LIBRARY: Track[] = PIECES.map((piece) => ({
  id: piece.id,
  title: piece.title,
  artist: piece.composer,
  album: piece.collection,
  length: durationOf(piece),
  // There is no file and no bitrate. Saying so is better than quoting a number that
  // would be a lie in a field nobody reads closely.
  detail: `${piece.bpm} bpm, synthesised`,
  notes: notesOf(piece),
}))

/** `3:42`, and `0:07` rather than `0:7`. */
export function clock(seconds: number): string {
  const whole = Math.max(0, Math.floor(seconds))
  const minutes = Math.floor(whole / 60)
  return `${minutes}:${String(whole % 60).padStart(2, '0')}`
}

export const totalLength = (tracks: Track[]) =>
  tracks.reduce((sum, t) => sum + t.length, 0)

/**
 * Which track comes after `index`. Null means the playlist is finished — Shuffle
 * picks anything but the current one, and Repeat is handled by the caller because
 * it never gets this far.
 */
export function nextIndex(
  index: number,
  count: number,
  shuffle: boolean,
): number | null {
  if (count === 0) return null
  if (shuffle) {
    if (count === 1) return 0
    let pick = index
    while (pick === index) pick = Math.floor(Math.random() * count)
    return pick
  }
  return index + 1 < count ? index + 1 : null
}

export function previousIndex(index: number, count: number): number {
  if (count === 0) return 0
  return index - 1 >= 0 ? index - 1 : count - 1
}
