/**
 * Titlebar button glyphs, drawn to nearly fill their 22px button the way XP's do
 * — an undersized glyph is the single biggest tell that caption buttons are fake.
 *
 * SVG rather than text characters: at this size no font glyph lands on the pixel
 * grid. The rectangular glyphs use `crispEdges` to stay sharp; the X opts out,
 * since crisp rendering makes a bold diagonal jagged.
 */

const box = {
  width: 13,
  height: 13,
  viewBox: '0 0 13 13',
  shapeRendering: 'crispEdges' as const,
  'aria-hidden': true,
}

export function MinGlyph() {
  return (
    <svg {...box}>
      {/* Deliberately not centred: XP's minimize dash sits low and a touch left
          of centre, which is a surprisingly strong part of the look. */}
      <rect x="1.4" y="9.2" width="8.4" height="2.7" fill="#fff" />
    </svg>
  )
}

export function MaxGlyph() {
  return (
    <svg {...box}>
      <rect
        x="0.7"
        y="1"
        width="11.6"
        height="11"
        fill="none"
        stroke="#fff"
        strokeWidth="1.5"
      />
      {/* The thick top bar is the caption stripe of the window being maximized. */}
      <rect x="0.7" y="1" width="11.6" height="3.7" fill="#fff" />
    </svg>
  )
}

export function RestoreGlyph() {
  return (
    <svg {...box}>
      {/* back pane, peeking out top-right */}
      <rect
        x="3.6"
        y="0.8"
        width="8.4"
        height="8.4"
        fill="none"
        stroke="#fff"
        strokeWidth="1.4"
      />
      <rect x="3.6" y="0.8" width="8.4" height="2.7" fill="#fff" />
      {/* front pane, opaque so it reads as overlapping */}
      <rect
        x="0.7"
        y="3.8"
        width="8.4"
        height="8.4"
        fill="#2a6ad8"
        stroke="#fff"
        strokeWidth="1.4"
      />
      <rect x="0.7" y="3.8" width="8.4" height="2.7" fill="#fff" />
    </svg>
  )
}

export function CloseGlyph() {
  return (
    <svg {...box} shapeRendering="auto">
      <path
        d="M2.0 0.6 6.5 5.1 11.0 0.6 12.4 2.0 7.9 6.5 12.4 11.0 11.0 12.4 6.5 7.9 2.0 12.4 0.6 11.0 5.1 6.5 0.6 2.0Z"
        fill="#fff"
      />
    </svg>
  )
}
