/**
 * The keyboard's geometry, and what on a computer keyboard plays what.
 *
 * Separate from the component because a module that exports a component may export nothing
 * else, and because this is the half worth testing: which key sounds which note is exactly
 * the sort of table that is wrong in one place and nowhere else.
 */

/** Semitones above C in one octave that have a black key above-left of them. */
const BLACK_OFFSETS = new Set([1, 3, 6, 8, 10])

export const isBlack = (midi: number) => BLACK_OFFSETS.has(((midi % 12) + 12) % 12)

/** Lowest note drawn — C3. */
export const FIRST = 48

/** Three octaves, ending on the C so the top of the keyboard doesn't look bitten off. */
export const LAST = 84

export const NOTE_NAMES = [
  'C',
  'C#',
  'D',
  'D#',
  'E',
  'F',
  'F#',
  'G',
  'G#',
  'A',
  'A#',
  'B',
]

/** `C4`, the way the notation writes it. */
export function nameOf(midi: number): string {
  const name = NOTE_NAMES[((midi % 12) + 12) % 12]
  return `${name}${Math.floor(midi / 12) - 1}`
}

/** Every note on the drawn keyboard. */
export const KEYS: number[] = Array.from(
  { length: LAST - FIRST + 1 },
  (_, i) => FIRST + i,
)

/** A black key's width, as a fraction of a white one. Close to a real piano's 13.7/23.5. */
const BLACK_WIDTH = 0.58

export interface KeyBox {
  midi: number
  black: boolean
  /** Left edge, in white-key widths. */
  x: number
  /** Width, in white-key widths. */
  w: number
}

/**
 * Where every key sits, in units of one white key.
 *
 * Worked out here rather than in CSS because a black key has to straddle the join between
 * two white ones without taking any width from them, and CSS has no way to count how many
 * white keys came before it. White key *i* spans `[i, i+1)`, so the join before it is at
 * `i` — which is exactly where the black key's centre goes.
 */
export const LAYOUT: KeyBox[] = (() => {
  const boxes: KeyBox[] = []
  let whites = 0
  for (const midi of KEYS) {
    if (isBlack(midi)) {
      boxes.push({ midi, black: true, x: whites - BLACK_WIDTH / 2, w: BLACK_WIDTH })
    } else {
      boxes.push({ midi, black: false, x: whites, w: 1 })
      whites++
    }
  }
  return boxes
})()

/** How many white keys the keyboard is wide, which is what sets the scale. */
export const WHITE_COUNT = LAYOUT.filter((k) => !k.black).length

/**
 * Semitones above the base note for each typing key.
 *
 * The layout every tracker and soft-synth has used since the nineties: the bottom two rows
 * are one octave with the black keys on the row above, and `q`-row is the octave up. Worth
 * keeping because anyone who has met a music program before already knows it, and because
 * `z x c v b n m` being the white keys makes it guessable for anyone who hasn't.
 */
export const BINDINGS: Record<string, number> = {
  // Lower octave: white keys on the bottom row, black keys on the home row.
  z: 0,
  s: 1,
  x: 2,
  d: 3,
  c: 4,
  v: 5,
  g: 6,
  b: 7,
  h: 8,
  n: 9,
  j: 10,
  m: 11,
  ',': 12,
  // The octave above: white keys on the q-row, black keys on the number row.
  q: 12,
  '2': 13,
  w: 14,
  '3': 15,
  e: 16,
  r: 17,
  '5': 18,
  t: 19,
  '6': 20,
  y: 21,
  '7': 22,
  u: 23,
  i: 24,
}

/** How far the typing keys are shifted, in octaves, and how far they may be. */
export const OCTAVE_MIN = -1
export const OCTAVE_MAX = 1

/**
 * Which note a typing key plays. Null for a key that isn't bound, or one shifted off the
 * end of the drawn keyboard — a key that sounds a note you cannot see would be a puzzle.
 */
export function noteFor(key: string, octaveShift: number): number | null {
  const offset = BINDINGS[key.toLowerCase()]
  if (offset === undefined) return null
  const midi = FIRST + 12 + offset + octaveShift * 12
  return midi >= FIRST && midi <= LAST ? midi : null
}

/** The typing key bound to a note, for printing on the key itself. */
export function labelFor(midi: number, octaveShift: number): string | undefined {
  for (const [key, offset] of Object.entries(BINDINGS)) {
    if (FIRST + 12 + offset + octaveShift * 12 === midi) {
      return key === ',' ? ',' : key.toUpperCase()
    }
  }
  return undefined
}
