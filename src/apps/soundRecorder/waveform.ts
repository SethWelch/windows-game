/**
 * The "sound": an envelope of amplitudes, one frame at a time.
 *
 * There is no audio here, but the *data* is real, and that is what makes the
 * Effects menu worth having — Reverse, Add Echo and the volume and speed changes
 * all transform this array, and you can see every one of them happen in the wave
 * display. Faking the effects instead would have left the menu as decoration.
 */

/** Frames per second of envelope. Coarse on purpose: this is a picture, not PCM. */
export const FRAMES_PER_SECOND = 30

/** What File ▸ Properties reports, and what the byte count is figured from. */
export const FORMAT = { rate: 22050, bits: 8, channels: 1 }

/** sndrec32 stopped at sixty seconds unless you talked it into more. */
export const MAX_SECONDS = 60

export type Wave = number[]

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v)

export const duration = (wave: Wave) => wave.length / FRAMES_PER_SECOND

/** What a real PCM file of this length would have weighed. */
export const byteLength = (wave: Wave) =>
  Math.round(duration(wave) * FORMAT.rate * (FORMAT.bits / 8) * FORMAT.channels)

/**
 * One tick of "microphone". A random walk toward fresh targets, with the odd near
 * silence thrown in, so the trace gets the bursts and gaps of someone talking
 * rather than a uniform band of hiss.
 */
export function capture(wave: Wave, frames = 1): Wave {
  const out = wave.slice()
  let level = out.length ? out[out.length - 1] : 0.2
  for (let i = 0; i < frames; i++) {
    const target = Math.random() < 0.12 ? 0.05 : 0.25 + Math.random() * 0.7
    level += (target - level) * 0.35
    out.push(clamp01(level))
  }
  return out
}

export const amplify = (wave: Wave, factor: number): Wave =>
  wave.map((v) => clamp01(v * factor))

/** `factor` 2 is twice as fast, so half as long. */
export function respeed(wave: Wave, factor: number): Wave {
  const length = Math.max(1, Math.round(wave.length / factor))
  return Array.from({ length }, (_, i) =>
    wave[Math.min(wave.length - 1, Math.floor(i * factor))],
  )
}

/** A quarter-second slap-back at half volume, which runs past the original end. */
export function echo(wave: Wave): Wave {
  const delay = Math.round(FRAMES_PER_SECOND * 0.25)
  const out = [...wave, ...new Array<number>(delay).fill(0)]
  for (let i = 0; i < out.length; i++) {
    const from = i - delay
    if (from >= 0 && from < wave.length) out[i] = clamp01(out[i] + wave[from] * 0.5)
  }
  return out
}

export const reverse = (wave: Wave): Wave => [...wave].reverse()

/** Everything up to `seconds` goes; the rest slides back to the start. */
export const deleteBefore = (wave: Wave, seconds: number): Wave =>
  wave.slice(Math.floor(seconds * FRAMES_PER_SECOND))

export const deleteAfter = (wave: Wave, seconds: number): Wave =>
  wave.slice(0, Math.ceil(seconds * FRAMES_PER_SECOND))

/**
 * Three-point smoothing. The real display drew a rounded blob rather than a comb,
 * because it was tracing an audio envelope and not a bar chart — this rounds the
 * shoulders of each burst so it reads the same way.
 */
export function smooth(values: number[]): number[] {
  if (values.length < 3) return values
  return values.map((v, i) => {
    const before = values[i - 1] ?? v
    const after = values[i + 1] ?? v
    return (before + v * 2 + after) / 4
  })
}

/**
 * Peak per column, so the display costs the same to draw whether the recording is
 * one second long or sixty.
 */
export function envelope(wave: Wave, columns: number): number[] {
  if (!wave.length || columns < 1) return []
  const out: number[] = []
  for (let c = 0; c < columns; c++) {
    const from = Math.floor((c * wave.length) / columns)
    const to = Math.max(from + 1, Math.floor(((c + 1) * wave.length) / columns))
    let peak = 0
    for (let i = from; i < to && i < wave.length; i++) {
      if (wave[i] > peak) peak = wave[i]
    }
    out.push(peak)
  }
  return out
}

// ------------------------------------------------------------------ files

const ALPHABET = '0123456789abcdefghijklmnopqrstuvwxyz'

/**
 * One character per frame. A saved `.wav` is therefore a wall of alphanumerics —
 * which is about what opening a real one in Notepad got you, so the illusion holds
 * from both ends.
 */
export const encode = (wave: Wave): string =>
  wave.map((v) => ALPHABET[Math.round(clamp01(v) * 35)]).join('')

export const decode = (text: string): Wave =>
  [...text.trim()].flatMap((ch) => {
    const i = ALPHABET.indexOf(ch)
    return i < 0 ? [] : [i / 35]
  })
