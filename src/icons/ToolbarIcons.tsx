/** Explorer toolbar glyphs. */

/**
 * Back / Forward, deliberately larger than the other toolbar glyphs as in XP.
 *
 * One circle with a single solid outline plus a gloss ellipse. An earlier version
 * stacked a second stroked circle inside for a bevel, which just read as a double
 * border.
 *
 * The disabled state is drawn, not filtered. Running the green artwork through
 * `grayscale() opacity()` washed it out to a ghost; XP's disabled nav buttons are
 * fully opaque silver with the arrow still clearly legible.
 */
const arrowCircle = (dir: 'back' | 'fwd', off: boolean) => {
  const key = `${dir}${off ? '-off' : ''}`
  return (
    <>
      <defs>
        <linearGradient id={`tbd-${key}`} x1="0" y1="0" x2="0.25" y2="1">
          {off ? (
            <>
              <stop offset="0" stopColor="#f2f1ee" />
              <stop offset="0.42" stopColor="#d8d6cf" />
              <stop offset="0.8" stopColor="#c2bfb6" />
              <stop offset="1" stopColor="#aeaba2" />
            </>
          ) : (
            <>
              <stop offset="0" stopColor="#9ce575" />
              <stop offset="0.42" stopColor="#4bb023" />
              <stop offset="0.8" stopColor="#2c8a12" />
              <stop offset="1" stopColor="#1d6e0b" />
            </>
          )}
        </linearGradient>
      </defs>

      {/* One circle with a single solid outline — a second stroked circle inside
          it read as a double border. */}
      <circle
        cx="16"
        cy="16"
        r="14.6"
        fill={`url(#tbd-${key})`}
        stroke={off ? '#87847c' : '#1a6209'}
        strokeWidth="1.6"
      />
      {/* gloss across the top */}
      <ellipse
        cx="16"
        cy="11.4"
        rx="11.4"
        ry="6.6"
        fill="#fff"
        opacity={off ? 0.32 : 0.22}
      />
      {/* Centring must account for the half-stroke (2 at strokeWidth 4) that round
          caps and joins add beyond every endpoint. The painted extent runs from
          the chevron vertex minus 2 to the shaft's cap plus 2; both arrows now
          span x 7.8–24.2, centred on 16. Measuring the path coordinates alone put
          them 1.8 out, in opposite directions. */}
      <path
        d={
          dir === 'back'
            ? 'M22.2 16H10.1M15.6 10.4 9.8 16l5.8 5.6'
            : 'M9.8 16h12.1M16.4 10.4 22.2 16l-5.8 5.6'
        }
        fill="none"
        stroke="#fdfdfc"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </>
  )
}

export function BackIcon({
  size = 24,
  disabled = false,
}: {
  size?: number
  disabled?: boolean
}) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden>
      {arrowCircle('back', disabled)}
    </svg>
  )
}

export function ForwardIcon({
  size = 24,
  disabled = false,
}: {
  size?: number
  disabled?: boolean
}) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden>
      {arrowCircle('fwd', disabled)}
    </svg>
  )
}

export function UpIcon({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
      <path
        d="M1.5 6.5h7.6l2 2.2h11.4v12.8H1.5z"
        fill="#f7cc5c"
        stroke="#a97b16"
        strokeWidth="1"
      />
      <path
        d="M12 3.2 17.4 9.4h-3.5v5.2h-3.8V9.4H6.6z"
        fill="#4bb023"
        stroke="#175c08"
        strokeWidth="1"
      />
    </svg>
  )
}

export function SearchIcon({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 22 22" aria-hidden>
      <circle
        cx="9"
        cy="9"
        r="6"
        fill="#cfe6f7"
        stroke="#2d6ca8"
        strokeWidth="1.6"
      />
      <circle cx="7.2" cy="7.2" r="2.4" fill="#fff" opacity="0.8" />
      <path
        d="M13.4 13.4 19 19"
        stroke="#3a3a3a"
        strokeWidth="2.6"
        strokeLinecap="round"
      />
    </svg>
  )
}

export function FoldersIcon({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 22 22" aria-hidden>
      <path
        d="M1.5 4.5h6l1.5 2h11v12H1.5z"
        fill="#f7cc5c"
        stroke="#a97b16"
        strokeWidth="1"
      />
      <g stroke="#6b5a1e" strokeWidth="1" fill="none">
        <path d="M5 10v6h4" />
        <path d="M5 13h4" />
      </g>
      <rect x="9.5" y="8.5" width="4" height="3" fill="#fffdf2" stroke="#6b5a1e" />
      <rect x="9.5" y="14.5" width="4" height="3" fill="#fffdf2" stroke="#6b5a1e" />
    </svg>
  )
}

export function ViewsIcon({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 22 22" aria-hidden>
      <rect
        x="1.5"
        y="3.5"
        width="19"
        height="15"
        fill="#fff"
        stroke="#5a5a5a"
        strokeWidth="1"
      />
      <rect x="3" y="5" width="6" height="4.5" fill="#7fb0ee" />
      <rect x="3" y="11.5" width="6" height="4.5" fill="#7fb0ee" />
      <g fill="#9a9a9a">
        <rect x="10.5" y="5.5" width="8" height="1.4" />
        <rect x="10.5" y="8" width="8" height="1.4" />
        <rect x="10.5" y="12" width="8" height="1.4" />
        <rect x="10.5" y="14.5" width="8" height="1.4" />
      </g>
    </svg>
  )
}

/** The "Go" button beside the address bar: a green square, not a circle. */
export function GoIcon({ size = 17 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 17 17" aria-hidden>
      <defs>
        <linearGradient id="tb-go" x1="0" y1="0" x2="0.25" y2="1">
          <stop offset="0" stopColor="#86d862" />
          <stop offset="0.45" stopColor="#3ea51c" />
          <stop offset="0.85" stopColor="#2a8a12" />
          <stop offset="1" stopColor="#1d7a0c" />
        </linearGradient>
      </defs>
      <rect
        x="0.5"
        y="0.5"
        width="20"
        height="20"
        rx="2"
        fill="url(#tb-go)"
        stroke="#15590a"
        strokeWidth="1"
      />
      {/* gloss across the upper half */}
      <path d="M1.6 1.6h13.8v6.2H1.6z" fill="#fff" opacity="0.2" />
      {/* white right arrow: tail plus head */}
      <path d="M3.8 7.1h4.4V4.6l4.6 3.9-4.6 3.9V9.9H3.8z" fill="#fff" />
    </svg>
  )
}

/**
 * Small grey triangle for split-button dropdowns on the toolbar. Distinct from
 * ChevronDown, which is the accent-blue combo-box arrow on the address bar —
 * XP used the two shapes in different places.
 */
export function CaretDown({ size = 7 }: { size?: number }) {
  return (
    <svg width={size} height={size * 0.6} viewBox="0 0 10 6" aria-hidden>
      <path d="M0.6 1 9.4 1 5 5.6z" fill="#6b6b66" />
    </svg>
  )
}

/**
 * Blue chevron for combo-box and split-button dropdowns. XP drew these in the
 * theme's accent blue rather than as a black triangle.
 */
export function ChevronDown({
  size = 9,
  color = '#1c4e9e',
}: {
  size?: number
  color?: string
}) {
  return (
    <svg
      width={size}
      height={Math.round(size * 0.66)}
      viewBox="0 0 9 6"
      aria-hidden
    >
      <path
        d="M0.9 1.2 4.5 4.6 8.1 1.2"
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="square"
      />
    </svg>
  )
}

/** Collapse chevron on a task-pane header. */
export function PaneChevron({ open = true }: { open?: boolean }) {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" aria-hidden>
      <circle cx="7.5" cy="7.5" r="7" fill="#f2f7fd" stroke="#7f9fd0" />
      <path
        d={open ? 'M4.5 9 7.5 5.8 10.5 9' : 'M4.5 6 7.5 9.2 10.5 6'}
        fill="none"
        stroke="#22508f"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  )
}
