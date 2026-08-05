/**
 * The library. Invented tracks — the point is a playlist with plausible lengths to
 * run a transport against, and made-up titles do that as well as real ones would.
 */

export interface Track {
  id: string
  title: string
  artist: string
  album: string
  /** Seconds. */
  length: number
  /** Kilobits per second, for the status bar to quote. */
  bitrate: number
}

export const LIBRARY: Track[] = [
  {
    id: 't1',
    title: 'Harbour Lights',
    artist: 'The Cassette Deck',
    album: 'Slow Ferry',
    length: 227,
    bitrate: 128,
  },
  {
    id: 't2',
    title: 'Dial Tone Waltz',
    artist: 'Modem Quartet',
    album: 'Handshake',
    length: 184,
    bitrate: 128,
  },
  {
    id: 't3',
    title: 'Blue Hour',
    artist: 'Ilse Rahman',
    album: 'Northerly',
    length: 301,
    bitrate: 160,
  },
  {
    id: 't4',
    title: 'Cassette Rewind',
    artist: 'The Cassette Deck',
    album: 'Slow Ferry',
    length: 149,
    bitrate: 128,
  },
  {
    id: 't5',
    title: 'Parking Garage Sunrise',
    artist: 'Six Storey',
    album: 'Level Four',
    length: 268,
    bitrate: 192,
  },
  {
    id: 't6',
    title: 'Screensaver',
    artist: 'Modem Quartet',
    album: 'Handshake',
    length: 205,
    bitrate: 128,
  },
  {
    id: 't7',
    title: 'Long Way Round',
    artist: 'Ilse Rahman',
    album: 'Northerly',
    length: 342,
    bitrate: 160,
  },
  {
    id: 't8',
    title: 'Last Bus',
    artist: 'Six Storey',
    album: 'Level Four',
    length: 198,
    bitrate: 192,
  },
]

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
