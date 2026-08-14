import type { IconProps } from './types.ts'

/**
 * The right-hand column of the Start menu.
 *
 * Grouped in one file the way ToolbarIcons and TrayIcons are, because they only ever
 * appear together and half of them are variations on the same manila folder.
 *
 * All 32x32 to match the rest of `src/icons`, and all drawn rather than traced — the
 * shapes are the recognisable ones (a folder with a photo in it, a magnifier, a printer)
 * without being XP's actual artwork.
 */

/** The folder body every folder-ish icon here sits on top of. */
function FolderBody() {
  return (
    <>
      <path
        d="M2.5 8.5h9.2l2.4 2.6h15.4v16.4H2.5z"
        fill="url(#sm-folder-back)"
        stroke="#a97b16"
      />
      <path
        d="M2.5 12.5h27v14.9H2.5z"
        fill="url(#sm-folder-front)"
        stroke="#a97b16"
      />
    </>
  )
}

/** Shared once per icon, since each is its own <svg> with its own <defs>. */
function FolderDefs() {
  return (
    <defs>
      <linearGradient id="sm-folder-back" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#fbe08a" />
        <stop offset="1" stopColor="#e8b23c" />
      </linearGradient>
      <linearGradient id="sm-folder-front" x1="0" y1="0" x2="0.2" y2="1">
        <stop offset="0" stopColor="#ffeaa0" />
        <stop offset="0.55" stopColor="#f7cc5c" />
        <stop offset="1" stopColor="#dda42a" />
      </linearGradient>
    </defs>
  )
}

const frame = (size: number, className?: string) => ({
  width: size,
  height: size,
  viewBox: '0 0 32 32',
  className,
  'aria-hidden': true,
})

/** A folder with a photograph standing in it. */
export function MyPicturesIcon({ size = 32, className }: IconProps) {
  return (
    <svg {...frame(size, className)}>
      <FolderDefs />
      <FolderBody />
      {/* the picture: sky, a hill, and a sun */}
      <rect x="11" y="14" width="16" height="12" fill="#fff" stroke="#8a8a8a" />
      <rect x="12.4" y="15.4" width="13.2" height="9.2" fill="#8ec9ef" />
      <path d="M12.4 24.6c3-4 6-5 13.2-1.6v1.6z" fill="#5aa03a" />
      <circle cx="22.6" cy="18.2" r="2" fill="#ffdd55" />
    </svg>
  )
}

/** A folder with a quaver on it. */
export function MyMusicIcon({ size = 32, className }: IconProps) {
  return (
    <svg {...frame(size, className)}>
      <FolderDefs />
      <FolderBody />
      <g fill="#2a4a8a">
        <ellipse cx="15.5" cy="24" rx="3.4" ry="2.6" />
        <rect x="18.2" y="14.5" width="1.8" height="9.6" />
        <path d="M20 14.5c3.4.6 5.4 2 6 4-1.6-1.6-3.4-2.4-6-2.6z" />
      </g>
    </svg>
  )
}

/** A folder with a clock, for the things you had open lately. */
export function RecentIcon({ size = 32, className }: IconProps) {
  return (
    <svg {...frame(size, className)}>
      <FolderDefs />
      <FolderBody />
      <circle cx="20" cy="20.5" r="7" fill="#fff" stroke="#5a6a80" />
      <path
        d="M20 15.6v5h4"
        fill="none"
        stroke="#2a3a52"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  )
}

/** The applet window with a slider and a switch in it. */
export function ControlPanelIcon({ size = 32, className }: IconProps) {
  return (
    <svg {...frame(size, className)}>
      <rect x="3.5" y="5.5" width="25" height="21" rx="2" fill="#f2f4f8" stroke="#5a6a80" />
      <path d="M3.5 7.5a2 2 0 0 1 2-2h21a2 2 0 0 1 2 2v3h-25z" fill="#2f6fd0" />
      <circle cx="25.6" cy="8" r="1.2" fill="#fff" opacity="0.8" />
      {/* a slider and a rocker, which is what every applet seemed to contain */}
      <rect x="7" y="15" width="18" height="2.4" rx="1.2" fill="#b8c2d0" />
      <rect x="12.6" y="12.8" width="3.6" height="6.8" rx="1.2" fill="#4a5a72" />
      <rect x="7" y="21" width="18" height="2.4" rx="1.2" fill="#b8c2d0" />
      <rect x="18.6" y="18.8" width="3.6" height="6.8" rx="1.2" fill="#4a5a72" />
    </svg>
  )
}

/** A printer, with a sheet coming out of it. */
export function PrintersIcon({ size = 32, className }: IconProps) {
  return (
    <svg {...frame(size, className)}>
      <rect x="9" y="4.5" width="14" height="8" fill="#fffdf4" stroke="#8a8a8a" />
      <path d="M11.6 7h8.8M11.6 9.4h7" stroke="#c0c4cc" />
      <rect x="4.5" y="12.5" width="23" height="10" rx="2" fill="#c8ced8" stroke="#5a6a80" />
      <rect x="8" y="15" width="10" height="2" rx="1" fill="#6a7688" />
      <circle cx="23.4" cy="16" r="1.5" fill="#4fc020" />
      <rect x="9" y="21" width="14" height="6.5" fill="#fffdf4" stroke="#8a8a8a" />
      <path d="M11.6 24h8.8" stroke="#c0c4cc" />
    </svg>
  )
}

/** A magnifier over a page. */
export function SearchPlaceIcon({ size = 32, className }: IconProps) {
  return (
    <svg {...frame(size, className)}>
      <path d="M7.5 4.5h11l6 6v17h-17z" fill="#fff" stroke="#7a8698" />
      <path d="M18.5 4.5v6h6" fill="#e4e9f0" stroke="#7a8698" />
      <circle cx="17" cy="18" r="6.4" fill="#cfe6f8" stroke="#2a5a92" strokeWidth="1.6" />
      <path
        d="M21.8 22.8 27 28"
        stroke="#2a5a92"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  )
}

/** The question mark in a disc, which is what Help was everywhere. */
export function HelpIcon({ size = 32, className }: IconProps) {
  return (
    <svg {...frame(size, className)}>
      <circle cx="16" cy="16" r="12" fill="url(#sm-help)" stroke="#0d3f7d" />
      <defs>
        <radialGradient id="sm-help" cx="36%" cy="28%" r="76%">
          <stop offset="0" stopColor="#7ab8f0" />
          <stop offset="1" stopColor="#1a5fbf" />
        </radialGradient>
      </defs>
      <text
        x="16"
        y="23.5"
        textAnchor="middle"
        fontFamily="Georgia, serif"
        fontSize="17"
        fontWeight="bold"
        fill="#fff"
      >
        ?
      </text>
    </svg>
  )
}

/** A window with a prompt in it, for Run. */
export function RunIcon({ size = 32, className }: IconProps) {
  return (
    <svg {...frame(size, className)}>
      <rect x="3.5" y="6.5" width="25" height="19" rx="2" fill="#f2f4f8" stroke="#5a6a80" />
      <path d="M3.5 8.5a2 2 0 0 1 2-2h21a2 2 0 0 1 2 2v2.5h-25z" fill="#2f6fd0" />
      <rect x="6.5" y="13.5" width="19" height="9" fill="#101010" />
      <path
        d="M9 16.5h3.4M9 19.5h6"
        stroke="#4fe04f"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      <rect x="16.4" y="15.4" width="1.6" height="2.4" fill="#4fe04f" />
    </svg>
  )
}
