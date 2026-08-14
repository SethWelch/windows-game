import type { IconProps } from './types.ts'

/**
 * A page being written on: sheet, folded corner, and a pen nib across it.
 *
 * The angle bracket in the corner is the licence — Composer's own icon was a page and a
 * pen with nothing to say which language, and this one edits markup you can see.
 */
export function ComposerIcon({ size = 32, className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      className={className}
      aria-hidden
    >
      {/* Sheet, with the top-right corner turned down. */}
      <path
        d="M5.5 3.5h14l7 7v18h-21z"
        fill="#fdfdfa"
        stroke="#7d7d70"
        strokeLinejoin="round"
      />
      <path d="M19.5 3.5v7h7z" fill="#e2e2d6" stroke="#7d7d70" strokeLinejoin="round" />

      {/* Lines of markup. The short one is the closing tag. */}
      <g stroke="#9aa4b4" strokeWidth="1.4" strokeLinecap="round">
        <path d="M8.5 14h9M8.5 17.5h11M8.5 21h6" />
      </g>

      {/* `<>` stamped in the free corner, in Netscape's green. */}
      <g stroke="#2f8f3f" strokeWidth="1.5" fill="none" strokeLinecap="round">
        <path d="M11 25.5 8.8 27.4 11 29.3M18 25.5l2.2 1.9-2.2 1.9" />
      </g>

      {/* The pen, laid diagonally over the sheet: barrel, then the nib and its slit. */}
      <g transform="rotate(38 22 18)">
        <rect x="20.2" y="5.5" width="3.6" height="14" fill="#e8b23a" stroke="#8a5f11" />
        <path d="M20.2 19.5h3.6L22 24z" fill="#d8d8d8" stroke="#5c5c5c" />
        <path d="M22 21v2.4" stroke="#5c5c5c" />
      </g>
    </svg>
  )
}
