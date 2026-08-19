import type { Piece } from './notation.ts'

/**
 * The library. Five public-domain pieces, transcribed by hand into the notation in
 * notation.ts, and played by the synth in synth.ts.
 *
 * **These are transcriptions, not editions.** The compositions are long out of copyright,
 * and writing them out here rather than shipping `.mid` files means there is no third
 * party's arrangement involved and no binary asset in the repo — but it also means the
 * accuracy is mine. They were written from memory and checked two ways: every bar has to
 * add up to its time signature (`barFaults`), and each one was rendered as a piano roll
 * and looked at. Neither of those can tell you it sounds *right*, only that it is
 * internally consistent and the right shape. Wrong notes are entirely possible; if one
 * jars, it is a mistake and not an interpretation.
 *
 * The left-hand parts are deliberately plain — root and fifth, or simple triads. Filling
 * in an accompaniment I do not remember would be composing, and then it would not be
 * Beethoven any more. Where a piece is an excerpt it says so in the title, because a
 * library that claims to hold "Für Elise" and plays eight bars of it is lying.
 *
 * Tempi are the marked or customary ones, not slow-for-safety: the first pass at this had
 * every piece 20-25% under tempo, which reads as hesitant rather than steady.
 *
 * Only pieces I could write with confidence are here. Several obvious candidates — the
 * Minuet in G, Greensleeves, Gymnopédie No. 1 — were dropped because I could recall the
 * tune but not the metre well enough to write it down honestly, and a piece with the
 * right notes in the wrong rhythm is worse than an absent one.
 */

/**
 * The arpeggio figure everyone knows, and the reason this one is first: it is a single
 * unbroken line of sixteenths, so there is nothing to get out of alignment. Five notes up
 * and then the top three again, twice to a bar, over a changing harmony.
 *
 * Four bars, played twice. The harmony past bar four I could not recall with confidence.
 */
const preludeInC: Piece = {
  id: 'bwv846',
  title: 'Prelude in C (opening)',
  composer: 'J. S. Bach',
  collection: 'The Well-Tempered Clavier, Book I',
  bpm: 88,
  beatsPerBar: 4,
  voices: [
    [
      // C major.
      '| c3s e3s g3s c4s e4s g3s c4s e4s c3s e3s g3s c4s e4s g3s c4s e4s',
      // D minor seventh, still over C.
      '| c3s d3s f3s a3s d4s f3s a3s d4s c3s d3s f3s a3s d4s f3s a3s d4s',
      // G seventh, bass to B.
      '| b2s d3s g3s d4s f4s g3s d4s f4s b2s d3s g3s d4s f4s g3s d4s f4s',
      // Home.
      '| c3s e3s g3s c4s e4s g3s c4s e4s c3s e3s g3s c4s e4s g3s c4s e4s',
      '| c3s e3s g3s c4s e4s g3s c4s e4s c3s e3s g3s c4s e4s g3s c4s e4s',
      '| c3s d3s f3s a3s d4s f3s a3s d4s c3s d3s f3s a3s d4s f3s a3s d4s',
      '| b2s d3s g3s d4s f4s g3s d4s f4s b2s d3s g3s d4s f4s g3s d4s f4s',
      '| c3s e3s g3s c4s e4s g3s c4s e4s c3s e3s g3s c4s e4s g3s c4s e4s',
    ].join(' '),
  ],
}

/**
 * The ground bass, three times through, with the first melodic statement over the second
 * and third. The bass is the piece: eight half notes, D A B F# G D G A, round and round.
 *
 * The upper line in bars 9-12 is the melody in parallel thirds, which is what the second
 * violin actually does there.
 */
const canonInD: Piece = {
  id: 'canon-d',
  title: 'Canon in D (opening)',
  composer: 'Johann Pachelbel',
  collection: 'Canon and Gigue in D major',
  bpm: 72,
  beatsPerBar: 4,
  voices: [
    // Melody, silent for the first statement.
    [
      '| rw | rw | rw | rw',
      '| f#5h e5h | d5h c#5h | b4h a4h | b4h c#5h',
      '| f#5h e5h | d5h c#5h | b4h a4h | b4h c#5h',
    ].join(' '),
    // Thirds above, over the third statement only.
    [
      '| rw | rw | rw | rw',
      '| rw | rw | rw | rw',
      '| a5h g5h | f#5h e5h | d5h c#5h | d5h e5h',
    ].join(' '),
    // The ground.
    [
      '| d3h a2h | b2h f#2h | g2h d3h | g2h a2h',
      '| d3h a2h | b2h f#2h | g2h d3h | g2h a2h',
      '| d3h a2h | b2h f#2h | g2h d3h | g2h a2h',
    ].join(' '),
  ],
}

/**
 * The theme stated three times, which is what the A section does before it moves on.
 *
 * In 3/8 — three eighths to a bar, which is why `beatsPerBar` is 1.5 — and it opens with a
 * two-sixteenth pickup. The rising figures in bars 3, 5 and 7 really are in the right hand;
 * only the sustained bass underneath is my own simplification.
 */
const furElise: Piece = {
  id: 'fur-elise',
  title: 'Für Elise (opening)',
  composer: 'Ludwig van Beethoven',
  collection: 'Bagatelle No. 25 in A minor',
  bpm: 120,
  beatsPerBar: 1.5,
  voices: [
    [
      'e5s d#5s',
      '| e5s d#5s e5s b4s d5s c5s',
      '| a4q re',
      '| c4e e4e a4e',
      '| b4q re',
      '| e4e g#4e b4e',
      '| c5q re',
      '| e4e e5e d#5e',
      '| e5s d#5s e5s b4s d5s c5s',
      '| a4q re',
      '| c4e e4e a4e',
      '| b4q re',
      '| e4e g#4e b4e',
      '| c5q re',
      '| e4e e5e d#5e',
      '| e5s d#5s e5s b4s d5s c5s',
      '| a4q re',
      '| c4e e4e a4e',
      '| b4q re',
      '| e4e g#4e b4e',
      '| c5q re',
      '| a4q. ',
    ].join(' '),
    [
      'rq',
      '| re re re',
      '| a2q re',
      '| a2q re',
      '| e2q re',
      '| e2q re',
      '| a2q re',
      '| a2q re',
      '| re re re',
      '| a2q re',
      '| a2q re',
      '| e2q re',
      '| e2q re',
      '| a2q re',
      '| a2q re',
      '| re re re',
      '| a2q re',
      '| a2q re',
      '| e2q re',
      '| e2q re',
      '| a2q re',
      '| a2q. ',
    ].join(' '),
  ],
}

/** The theme from the Ninth's finale, one full period. All quarters bar the cadences. */
const odeToJoy: Piece = {
  id: 'ode-to-joy',
  title: 'Ode to Joy',
  composer: 'Ludwig van Beethoven',
  collection: 'Symphony No. 9 in D minor',
  bpm: 120,
  beatsPerBar: 4,
  voices: [
    [
      '| f#4q f#4q g4q a4q',
      '| a4q g4q f#4q e4q',
      '| d4q d4q e4q f#4q',
      '| f#4q. e4e e4h',
      '| f#4q f#4q g4q a4q',
      '| a4q g4q f#4q e4q',
      '| d4q d4q e4q f#4q',
      '| e4q. d4e d4h',
    ].join(' '),
    [
      '| d3+a3h d3+a3h',
      '| d3+a3h a2+e3h',
      '| d3+a3h d3+a3h',
      '| d3+a3h a2+e3h',
      '| d3+a3h d3+a3h',
      '| d3+a3h a2+e3h',
      '| d3+a3h d3+a3h',
      '| a2+e3h d3+a3h',
    ].join(' '),
  ],
}

/**
 * The French folk tune Mozart wrote twelve variations on, and the one piece here whose
 * rhythm nobody could get wrong. It earns its place by being the only thing in the library
 * short and plain enough to hear the synth's envelope on.
 */
const ahVousDiraiJe: Piece = {
  id: 'ah-vous-dirai-je',
  title: 'Ah! vous dirai-je, maman',
  composer: 'Traditional',
  collection: 'Theme of Mozart’s K. 265',
  bpm: 112,
  beatsPerBar: 4,
  voices: [
    [
      '| c4q c4q g4q g4q',
      '| a4q a4q g4h',
      '| f4q f4q e4q e4q',
      '| d4q d4q c4h',
      '| g4q g4q f4q f4q',
      '| e4q e4q d4h',
      '| g4q g4q f4q f4q',
      '| e4q e4q d4h',
      '| c4q c4q g4q g4q',
      '| a4q a4q g4h',
      '| f4q f4q e4q e4q',
      '| d4q d4q c4h',
    ].join(' '),
    [
      '| c3+g3h c3+g3h',
      '| f2+c3h c3+g3h',
      '| f2+c3h c3+g3h',
      '| g2+d3h c3+g3h',
      '| c3+g3h f2+c3h',
      '| c3+g3h g2+d3h',
      '| c3+g3h f2+c3h',
      '| c3+g3h g2+d3h',
      '| c3+g3h c3+g3h',
      '| f2+c3h c3+g3h',
      '| f2+c3h c3+g3h',
      '| g2+d3h c3+g3h',
    ].join(' '),
  ],
}

/** Shown in this order, which is roughly chronological. */
export const PIECES: Piece[] = [
  preludeInC,
  canonInD,
  furElise,
  odeToJoy,
  ahVousDiraiJe,
]
