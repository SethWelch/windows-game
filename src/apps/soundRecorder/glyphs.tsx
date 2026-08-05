import { duration, envelope, smooth } from './waveform.ts'
import type { Wave } from './waveform.ts'

/**
 * Transport glyphs. Small, black and flat — these were 8x8 bitmaps on a button
 * face, so they carry no shading at all. Record is the only one with colour.
 */

/** Plain double triangles — the real seek buttons carried no end bar. */
export function SeekStartGlyph() {
  return (
    <svg className="xp-sr-glyph" viewBox="0 0 16 16" aria-hidden>
      <path d="M8 2v12L1 8z" fill="#000" />
      <path d="M15 2v12L8 8z" fill="#000" />
    </svg>
  )
}

export function SeekEndGlyph() {
  return (
    <svg className="xp-sr-glyph" viewBox="0 0 16 16" aria-hidden>
      <path d="M1 2v12l7-6z" fill="#000" />
      <path d="M8 2v12l7-6z" fill="#000" />
    </svg>
  )
}

export function PlayGlyph() {
  return (
    <svg className="xp-sr-glyph" viewBox="0 0 16 16" aria-hidden>
      <path d="M3 1.5v13l11-6.5z" fill="#000" />
    </svg>
  )
}

export function StopGlyph() {
  return (
    <svg className="xp-sr-glyph" viewBox="0 0 16 16" aria-hidden>
      <rect x="2.5" y="2.5" width="11" height="11" fill="#000" />
    </svg>
  )
}

export function RecordGlyph() {
  return (
    <svg className="xp-sr-glyph" viewBox="0 0 16 16" aria-hidden>
      <circle cx="8" cy="8" r="6" fill="#cc0000" />
    </svg>
  )
}

/**
 * The wave display: a green blob on the dialog's own grey, with a flat green rest
 * line running the full width — which is all you saw at 0.00 seconds.
 *
 * The real one was a live oscilloscope, a single wiggling line while playing and
 * flat otherwise. This draws the whole envelope instead, mirrored about the centre,
 * with a playhead sweeping over it — because a flat line would make every one of
 * the Effects invisible, and being able to *see* Reverse land is the better trade.
 */
export function WaveDisplay({
  wave,
  position,
  active,
}: {
  wave: Wave
  /** Seconds. Draws the playhead. */
  position: number
  /** Playing or recording: brightens the trace, as the real one did. */
  active: boolean
}) {
  // Few enough columns that smoothing rounds the bursts into lobes rather than
  // leaving a comb of spikes.
  const columns = 60
  const peaks = smooth(envelope(wave, columns))
  const total = duration(wave)

  // Mirrored: across the top, then back along the bottom, so it closes into a
  // solid blob rather than a line.
  const top = peaks.map((v, i) => `${(i / (columns - 1)) * 100},${50 - v * 44}`)
  const bottom = peaks
    .map((v, i) => `${(i / (columns - 1)) * 100},${50 + v * 44}`)
    .reverse()
  const band = [...top, ...bottom].join(' ')

  const playhead = total > 0 ? (position / total) * 100 : 0

  return (
    <div className="xp-sr-display">
      <svg
        className="xp-sr-scope"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        aria-hidden
      >
        <line
          x1="0"
          y1="50"
          x2="100"
          y2="50"
          stroke={active ? '#00ee00' : '#00cc00'}
          strokeWidth="2"
          vectorEffect="non-scaling-stroke"
        />

        {peaks.length > 0 && (
          <polygon points={band} fill={active ? '#00ee00' : '#00cc00'} />
        )}

        {peaks.length > 0 && active && (
          <line
            x1={playhead}
            y1="6"
            x2={playhead}
            y2="94"
            stroke="#006600"
            strokeWidth="1"
            vectorEffect="non-scaling-stroke"
          />
        )}
      </svg>
    </div>
  )
}

