/**
 * The nine Control Panel categories.
 *
 * Each is a pair of objects rather than one, which is what made these read at a glance:
 * a palette *and* a brush, a printer *and* a keyboard, a clock *and* a calendar. Drawn at
 * 48 because that is the size the category view uses them at — the rest of `src/icons` is
 * 32, and scaling these up made the compound shapes mushy.
 *
 * Grouped in one file like ToolbarIcons and StartMenuIcons: they only ever appear
 * together, and half of them share the same pale-blue backing plate.
 */

const box = { width: 48, height: 48, viewBox: '0 0 48 48', 'aria-hidden': true } as const

/** The pale plate most of these sit on, which ties the set together. */
function Plate() {
  return (
    <>
      <rect x="2" y="6" width="30" height="30" rx="3" fill="#cfe0f4" stroke="#7d9dc4" />
      <path d="M2 9a3 3 0 0 1 3-3h24a3 3 0 0 1 3 3v3H2z" fill="#8fb4dc" />
    </>
  )
}

/** A palette and a brush. */
export function AppearanceIcon() {
  return (
    <svg {...box}>
      <path
        d="M18 8c8 0 14 5 14 11 0 4-3 5-6 5h-3c-2 0-3 1-3 3 0 1 1 2 1 3 0 2-2 3-4 3-7 0-14-6-14-13S10 8 18 8z"
        fill="#f2f0e4"
        stroke="#8a8674"
      />
      <circle cx="13" cy="16" r="2.4" fill="#e03028" />
      <circle cx="21" cy="14" r="2.4" fill="#f0c020" />
      <circle cx="27" cy="19" r="2.4" fill="#2f8fd0" />
      <circle cx="12" cy="25" r="2.4" fill="#4faa34" />
      {/* the brush, laid across the corner */}
      <path d="M30 40l10-10 4 4-10 10-5 1z" fill="#d8a860" stroke="#8a6a30" />
      <path d="M29 41l-3 4 5-2z" fill="#8b5a2b" />
      <path d="M40 30l4 4 2-2-4-4z" fill="#c0c4cc" stroke="#7a8290" />
    </svg>
  )
}

/** A printer and a keyboard. */
export function HardwareIcon() {
  return (
    <svg {...box}>
      <rect x="6" y="4" width="20" height="10" fill="#fffdf4" stroke="#8a8a8a" />
      <rect x="3" y="14" width="26" height="12" rx="2" fill="#c8ced8" stroke="#5a6a80" />
      <rect x="7" y="17" width="12" height="2.4" rx="1.2" fill="#6a7688" />
      <circle cx="25" cy="18" r="1.6" fill="#4fc020" />
      <rect x="6" y="24" width="20" height="7" fill="#fffdf4" stroke="#8a8a8a" />
      {/* keyboard, tucked in front */}
      <path d="M18 44l2-8h24l2 8z" fill="#e4e8ee" stroke="#7a8290" />
      <g fill="#a8b0bc">
        {[0, 1, 2].map((r) =>
          [0, 1, 2, 3, 4, 5].map((c) => (
            <rect key={`${r}-${c}`} x={22 + c * 3.6} y={37.5 + r * 2.2} width="2.6" height="1.5" rx="0.4" />
          )),
        )}
      </g>
    </svg>
  )
}

/** A monitor with a globe in front of it. */
export function NetworkIcon() {
  return (
    <svg {...box}>
      <rect x="6" y="6" width="28" height="20" rx="2" fill="#e8e4d8" stroke="#8a8678" />
      <rect x="9" y="9" width="22" height="14" fill="#2f6fd0" />
      <path d="M17 26h6l2 6h-10z" fill="#ded8c8" stroke="#8a8678" />
      <circle cx="31" cy="31" r="12" fill="#2f8fd0" stroke="#155a92" />
      <path d="M19 31h24" stroke="#a8dcf8" />
      <ellipse cx="31" cy="31" rx="6" ry="12" fill="none" stroke="#a8dcf8" />
      <path d="M21 24c6 4 14 4 20 0M21 38c6-4 14-4 20 0" fill="none" stroke="#a8dcf8" />
    </svg>
  )
}

/** Two heads, one behind the other. */
export function UserAccountsIcon() {
  return (
    <svg {...box}>
      <g>
        <circle cx="14" cy="16" r="7" fill="#f0c020" stroke="#a07800" />
        <path d="M2 42c0-8 5-13 12-13s12 5 12 13z" fill="#f0c020" stroke="#a07800" />
      </g>
      <g>
        <circle cx="30" cy="14" r="8" fill="#e88030" stroke="#a05010" />
        <path d="M16 43c0-9 6-15 14-15s14 6 14 15z" fill="#e88030" stroke="#a05010" />
      </g>
      <circle cx="30" cy="14" r="8" fill="none" stroke="#a05010" />
    </svg>
  )
}

/** A disc going into a box. */
export function AddRemoveIcon() {
  return (
    <svg {...box}>
      <Plate />
      <path d="M6 12h22v20H6z" fill="#eef4fb" />
      <path d="M9 16h16M9 20h12M9 24h16" stroke="#9db4d0" />
      <circle cx="30" cy="32" r="12" fill="#dfe6ee" stroke="#7a8698" />
      <circle cx="30" cy="32" r="11" fill="none" stroke="#fff" />
      <circle cx="30" cy="32" r="4" fill="#fff" stroke="#7a8698" />
      <path d="M22 26a11 11 0 0 1 12-2l-2 3a8 8 0 0 0-8 1z" fill="#a8c8e8" opacity="0.8" />
    </svg>
  )
}

/** A clock and a calendar. */
export function DateTimeIcon() {
  return (
    <svg {...box}>
      <rect x="3" y="6" width="24" height="24" rx="2" fill="#fff" stroke="#7a8698" />
      <path d="M3 8a2 2 0 0 1 2-2h20a2 2 0 0 1 2 2v5H3z" fill="#c03028" />
      <g fill="#8a94a4">
        {[0, 1, 2].map((r) =>
          [0, 1, 2, 3].map((c) => (
            <rect key={`${r}-${c}`} x={6 + c * 5} y={16 + r * 4.4} width="3.4" height="2.8" />
          )),
        )}
      </g>
      <circle cx="32" cy="32" r="13" fill="#f4f6fa" stroke="#5a6a80" />
      <circle cx="32" cy="32" r="11" fill="#fff" />
      <path
        d="M32 24v8l6 4"
        fill="none"
        stroke="#2a3a52"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  )
}

/** A speaker with sound coming out of it. */
export function SoundsIcon() {
  return (
    <svg {...box}>
      <path d="M6 19h7l10-9v28l-10-9H6z" fill="#e4e8ee" stroke="#5a6a80" />
      <g fill="none" stroke="#2f8fd0" strokeWidth="2.6" strokeLinecap="round">
        <path d="M28 18a10 10 0 0 1 0 12" />
        <path d="M33 13a17 17 0 0 1 0 22" />
        <path d="M38 8a24 24 0 0 1 0 32" />
      </g>
    </svg>
  )
}

/** The accessibility figure, arms out in a circle. */
export function AccessibilityIcon() {
  return (
    <svg {...box}>
      <circle cx="24" cy="24" r="21" fill="#4faa34" stroke="#2a6a18" />
      <circle cx="24" cy="11" r="4.4" fill="#fff" />
      <path
        d="M9 19h30M24 16v14M24 30l-7 13M24 30l7 13"
        fill="none"
        stroke="#fff"
        strokeWidth="4"
        strokeLinecap="round"
      />
    </svg>
  )
}

/** A pie chart on a plate, for the one category nobody could define. */
export function PerformanceIcon() {
  return (
    <svg {...box}>
      <Plate />
      <path d="M6 12h22v20H6z" fill="#eef4fb" />
      <path d="M9 28l5-7 4 4 6-9" fill="none" stroke="#5a8ac0" strokeWidth="1.6" />
      <circle cx="30" cy="32" r="13" fill="#fff" stroke="#5a6a80" />
      <path d="M30 32V19a13 13 0 0 1 11.3 19.5z" fill="#2f8fd0" />
      <path d="M30 32l11.3 6.5A13 13 0 0 1 30 45z" fill="#8fc63f" />
      <path d="M30 32l-11.3 6.5A13 13 0 0 1 30 19z" fill="#c8d4e2" />
    </svg>
  )
}
