import type { IconProps } from './types.ts'

/** Manila folder, slightly open, in XP's warm yellow. */
export function FolderIcon({ size = 32, className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      className={className}
      aria-hidden
    >
      <defs>
        <linearGradient id="fd-back" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fbe08a" />
          <stop offset="1" stopColor="#e8b23c" />
        </linearGradient>
        <linearGradient id="fd-front" x1="0" y1="0" x2="0.2" y2="1">
          <stop offset="0" stopColor="#ffeaa0" />
          <stop offset="0.55" stopColor="#f7cc5c" />
          <stop offset="1" stopColor="#dda42a" />
        </linearGradient>
      </defs>

      {/* back panel with the tab */}
      <path
        d="M2.5 8.5h9.2l2.4 2.6h15.4v16.4H2.5z"
        fill="url(#fd-back)"
        stroke="#a97b16"
        strokeWidth="1"
      />
      {/* inner paper edge, just visible above the front flap */}
      <path d="M6 11.6h20v3H6z" fill="#fffdf2" opacity="0.85" />
      {/* front flap, kicked out to the right so it reads as open */}
      <path
        d="M4.6 13.4h24.9l-2.2 14.1H2.5z"
        fill="url(#fd-front)"
        stroke="#a97b16"
        strokeWidth="1"
      />
      {/* top highlight along the flap */}
      <path
        d="M5.3 14.4h23.3"
        stroke="#fff8dc"
        strokeWidth="1"
        opacity="0.7"
        fill="none"
      />
    </svg>
  )
}
