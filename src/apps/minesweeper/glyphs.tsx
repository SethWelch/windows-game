/**
 * Minesweeper's own artwork: the LED panels, the smiley, and the cell glyphs.
 *
 * These stay local to the app rather than joining icons/registry.ts, which is for
 * shell icons the window manager can name by id. Nothing here is ever a window
 * icon or a desktop tile.
 */

/** Seven-segment geometry on a 12x22 grid, corners mitred at 45°. */
const SEGMENT_SHAPES: Record<string, string> = {
  a: '2,1 10,1 8.6,2.4 3.4,2.4',
  b: '11,2 11,11 9.6,9.6 9.6,3.4',
  c: '11,11 11,20 9.6,18.6 9.6,12.4',
  d: '3.4,19.6 8.6,19.6 10,21 2,21',
  e: '1,11 2.4,12.4 2.4,18.6 1,20',
  f: '1,2 2.4,3.4 2.4,9.6 1,11',
  g: '3.4,10.3 8.6,10.3 10,11 8.6,11.7 3.4,11.7 2,11',
}

const LIT: Record<string, string> = {
  '0': 'abcdef',
  '1': 'bc',
  '2': 'abdeg',
  '3': 'abcdg',
  '4': 'bcfg',
  '5': 'acdfg',
  '6': 'acdefg',
  '7': 'abc',
  '8': 'abcdefg',
  '9': 'abcdfg',
  '-': 'g',
  ' ': '',
}

/**
 * Unlit segments are drawn in a dark red rather than hidden, which is what makes
 * a real LED panel read as a panel instead of floating digits.
 */
function Digit({ char }: { char: string }) {
  const lit = LIT[char] ?? ''
  return (
    <svg className="xp-ms-digit" viewBox="0 0 12 22" aria-hidden>
      {Object.entries(SEGMENT_SHAPES).map(([key, points]) => (
        <polygon
          key={key}
          points={points}
          fill={lit.includes(key) ? '#ff0000' : '#480000'}
        />
      ))}
    </svg>
  )
}

/** Three fixed digits: `007`, `-01`, `999` — never more, never fewer. */
function format(value: number): string {
  const v = Math.trunc(value)
  if (v < 0) return `-${String(Math.min(-v, 99)).padStart(2, '0')}`
  return String(Math.min(v, 999)).padStart(3, '0')
}

export function LedDisplay({ value, label }: { value: number; label: string }) {
  return (
    <div className="xp-ms-led" role="img" aria-label={`${label}: ${value}`}>
      {[...format(value)].map((char, i) => (
        <Digit key={i} char={char} />
      ))}
    </div>
  )
}

export type FaceMood = 'smile' | 'ooh' | 'dead' | 'cool'

export function SmileyFace({ mood }: { mood: FaceMood }) {
  return (
    <svg className="xp-ms-face-art" viewBox="0 0 20 20" aria-hidden>
      <circle cx="10" cy="10" r="8.6" fill="#ffff00" stroke="#000" strokeWidth="1" />

      {mood === 'dead' ? (
        <g stroke="#000" strokeWidth="1.1" strokeLinecap="round">
          <path d="M5.4 5.8 8.2 8.6M8.2 5.8 5.4 8.6" />
          <path d="M11.8 5.8 14.6 8.6M14.6 5.8 11.8 8.6" />
        </g>
      ) : mood === 'cool' ? (
        // Shades: one bar across both lenses, the way the original pixelled them.
        <g fill="#000">
          <rect x="3" y="6.4" width="14" height="1.2" />
          <path d="M4.2 7.6h4.6l-1 3.1H5.4z" />
          <path d="M11.2 7.6h4.6l-1.4 3.1h-2.2z" />
        </g>
      ) : (
        <g fill="#000">
          <ellipse cx="6.9" cy="7.6" rx="1.15" ry="1.5" />
          <ellipse cx="13.1" cy="7.6" rx="1.15" ry="1.5" />
        </g>
      )}

      {mood === 'ooh' ? (
        <circle cx="10" cy="13.4" r="2.1" fill="#000" />
      ) : mood === 'dead' ? (
        <path
          d="M6.2 14.4Q10 11.2 13.8 14.4"
          fill="none"
          stroke="#000"
          strokeWidth="1.1"
          strokeLinecap="round"
        />
      ) : (
        <path
          d="M5.6 11.6Q10 15.8 14.4 11.6"
          fill="none"
          stroke="#000"
          strokeWidth="1.1"
          strokeLinecap="round"
        />
      )}
    </svg>
  )
}

export function MineGlyph({ crossed = false }: { crossed?: boolean }) {
  return (
    <svg className="xp-ms-glyph" viewBox="0 0 16 16" aria-hidden>
      <g stroke="#000" strokeWidth="1.2">
        <path d="M8 2.2V13.8M2.2 8H13.8M3.9 3.9 12.1 12.1M12.1 3.9 3.9 12.1" />
      </g>
      <circle cx="8" cy="8" r="3.9" fill="#000" />
      {/* The one specular pixel that told you it was a sphere. */}
      <rect x="6" y="5.6" width="1.6" height="1.6" fill="#fff" />
      {crossed && (
        <path
          d="M2.4 2.4 13.6 13.6M13.6 2.4 2.4 13.6"
          stroke="#ff0000"
          strokeWidth="1.6"
        />
      )}
    </svg>
  )
}

export function FlagGlyph() {
  return (
    <svg className="xp-ms-glyph" viewBox="0 0 16 16" aria-hidden>
      <polygon points="8,2.5 8,7.5 3,5 " fill="#ff0000" />
      <rect x="7.6" y="2.5" width="1" height="8.5" fill="#000" />
      <rect x="6" y="11" width="4" height="1.1" fill="#000" />
      <rect x="4" y="12.1" width="8" height="1.4" fill="#000" />
    </svg>
  )
}
