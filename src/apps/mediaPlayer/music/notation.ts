/**
 * A tiny notation, and the parser that turns it into notes.
 *
 * The library is real music now, and this is how it is written down. Not Standard MIDI
 * Files: a `.mid` is a binary asset, and the project ships none — but more usefully, a
 * text notation is something a person can read, diff and correct, and something a test can
 * check. Every piece in pieces.ts is a public-domain composition transcribed by hand into
 * this, so nothing here is anybody else's arrangement.
 *
 * A voice is a space-separated list of tokens:
 *
 *     c4q      middle C, one beat
 *     f#3e     F sharp below, half a beat
 *     bb5s.    B flat, a dotted sixteenth
 *     c4+e4+g4h   a chord, two beats
 *     rq       a beat of silence
 *     |        a bar line
 *
 * Durations are `w h q e s t` — whole, half, quarter, eighth, sixteenth, thirty-second —
 * and a trailing `.` makes it dotted. Pitches are scientific: `c4` is middle C, MIDI 60.
 *
 * **The bar lines are the point.** They are ignored when the notes are built, and checked
 * by `barFaults` — every bar in every voice has to add up to the piece's time signature.
 * Transcribing from memory, the mistake you actually make is dropping or doubling a note,
 * and that shifts everything after it out of alignment with the other hand. A bar that
 * doesn't sum is how you find it. See music.mjs in the scratchpad.
 */

/** Beats per token duration. */
const LENGTHS: Record<string, number> = {
  w: 4,
  h: 2,
  q: 1,
  e: 0.5,
  s: 0.25,
  t: 0.125,
}

const STEPS: Record<string, number> = { c: 0, d: 2, e: 4, f: 5, g: 7, a: 9, b: 11 }

export interface Piece {
  id: string
  title: string
  composer: string
  /** Where it comes from — shown in the Album column. */
  collection: string
  /** Quarter notes per minute. */
  bpm: number
  /** Beats to a bar, for the bar check and for nothing else. */
  beatsPerBar: number
  /**
   * Voices, roughly one per hand. Index 0 is treated as the melody and is voiced a little
   * brighter than the rest — see synth.ts.
   */
  voices: string[]
}

export interface Note {
  /** Seconds from the start of the piece. */
  at: number
  /** Seconds. */
  dur: number
  /** MIDI number; 60 is middle C. */
  midi: number
  /** Which voice it came from. */
  voice: number
  /**
   * How hard it is struck, 0-1.
   *
   * Derived from where the note falls in the bar rather than written down, because the
   * alternative — every note at identical loudness — is the single biggest reason a
   * synthesised performance sounds mechanical. A downbeat is leant on, the middle of the
   * bar slightly less, an off-beat lighter. That is not interpretation, it is what metre
   * *is*, and without it the pulse has to be inferred from pitch alone.
   */
  velocity: number
}

/** `c4` → 60. Accidentals stack, so `bbb4` is B double-flat. */
export function midiOf(pitch: string): number {
  const m = /^([a-g])([#b]*)(-?\d)$/.exec(pitch.toLowerCase())
  if (!m) throw new Error(`unreadable pitch: ${pitch}`)
  const [, letter, accidentals, octave] = m
  let semitones = STEPS[letter]
  for (const a of accidentals) semitones += a === '#' ? 1 : -1
  // Scientific pitch notation: C4 is MIDI 60, and octaves start at C.
  return (Number(octave) + 1) * 12 + semitones
}

interface Token {
  /** Empty for a rest. */
  pitches: number[]
  /** Beats. */
  beats: number
}

function tokenize(voice: string): (Token | 'bar')[] {
  const out: (Token | 'bar')[] = []
  for (const raw of voice.trim().split(/\s+/)) {
    if (!raw) continue
    if (raw === '|') {
      out.push('bar')
      continue
    }
    const m = /^([rRa-gA-G#b0-9+]+?)([whqest])(\.?)$/.exec(raw)
    if (!m) throw new Error(`unreadable token: ${raw}`)
    const [, body, length, dotted] = m
    const beats = LENGTHS[length] * (dotted ? 1.5 : 1)
    const pitches =
      body.toLowerCase() === 'r' ? [] : body.split('+').map((p) => midiOf(p))
    out.push({ pitches, beats })
  }
  return out
}

/**
 * Bars whose contents don't match the time signature, as `"voice 1 bar 4: 3.5 beats"`.
 *
 * The last bar of a voice is exempt: a piece that ends mid-bar is a legitimate excerpt,
 * and several of these are excerpts.
 */
export function barFaults(piece: Piece): string[] {
  const faults: string[] = []
  piece.voices.forEach((voice, v) => {
    const tokens = tokenize(voice)
    let bar = 1
    let beats = 0
    for (const token of tokens) {
      if (token === 'bar') {
        // A bar line before any notes is decoration, not an empty bar. A short *first*
        // bar is an anacrusis — a pickup — which is normal and not a fault; a short one
        // anywhere else means a note went missing.
        const pickup = bar === 1 && beats < piece.beatsPerBar
        if (beats > 0 && !pickup && Math.abs(beats - piece.beatsPerBar) > 1e-9) {
          faults.push(`voice ${v} bar ${bar}: ${beats} beats`)
        }
        if (beats > 0) bar++
        beats = 0
        continue
      }
      beats += token.beats
    }
    // Trailing partial bar allowed; a trailing *over-full* one is still a fault.
    if (beats - piece.beatsPerBar > 1e-9) {
      faults.push(`voice ${v} bar ${bar}: ${beats} beats (final)`)
    }
  })
  return faults
}

/**
 * Where a note sits in the bar, as a weight.
 *
 * Whole numbers of beats are stressed and subdivisions are not; the first beat of the bar
 * most of all. The accompaniment is quieter than the melody by a fixed amount on top of
 * this, which is what stops a left hand of three-note chords from burying the tune.
 */
function stress(beat: number, beatsPerBar: number, voice: number): number {
  const inBar = ((beat % beatsPerBar) + beatsPerBar) % beatsPerBar
  const onBeat = Math.abs(inBar - Math.round(inBar)) < 1e-6
  let weight: number
  if (inBar < 1e-6) weight = 1
  else if (Math.abs(inBar - beatsPerBar / 2) < 1e-6) weight = 0.9
  else if (onBeat) weight = 0.84
  else weight = 0.72
  return voice === 0 ? weight : weight * 0.66
}

/** Flattens a piece into notes on one timeline, sorted by start. */
export function notesOf(piece: Piece): Note[] {
  const secondsPerBeat = 60 / piece.bpm
  const notes: Note[] = []
  piece.voices.forEach((voice, v) => {
    let beat = 0
    for (const token of tokenize(voice)) {
      if (token === 'bar') continue
      for (const midi of token.pitches) {
        notes.push({
          at: beat * secondsPerBeat,
          dur: token.beats * secondsPerBeat,
          midi,
          voice: v,
          velocity: stress(beat, piece.beatsPerBar, v),
        })
      }
      beat += token.beats
    }
  })
  notes.sort((a, b) => a.at - b.at || a.midi - b.midi)
  return notes
}

/**
 * How long the piece runs, in seconds.
 *
 * The *notated* length of the longest voice, not the end of the last note — a piece that
 * finishes with a rest is still that long, and a voice that ends in rests must still line
 * up with one that doesn't. Widened to the last note's tail as well, since a note is
 * allowed to ring past the final bar line.
 */
export function durationOf(piece: Piece): number {
  const secondsPerBeat = 60 / piece.bpm
  const notated = Math.max(
    0,
    ...piece.voices.map((voice) =>
      tokenize(voice).reduce((beats, t) => (t === 'bar' ? beats : beats + t.beats), 0),
    ),
  )
  const ringing = notesOf(piece).reduce((end, n) => Math.max(end, n.at + n.dur), 0)
  return Math.max(notated * secondsPerBeat, ringing)
}
