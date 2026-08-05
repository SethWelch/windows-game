import type { IconProps } from './types.ts'

/** An envelope stuffed too full, with a warning burst behind it. */
export function SpamIcon({ size = 32, className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      className={className}
      aria-hidden
    >
      {/* Starburst, because these things never arrived quietly. */}
      <path
        d="M16 1l2.6 5.2L24 4.4l-1.4 5.6 5.6-1.2-3.8 4.4 5.4 2.4-5.4 2.4 3.8 4.4-5.6-1.2L24 27.6 18.6 25.8 16 31l-2.6-5.2L8 27.6l1.4-5.6-5.6 1.2 3.8-4.4L2.2 16l5.4-2.4-3.8-4.4 5.6 1.2L8 4.4l5.4 1.8z"
        fill="#ffd21a"
        stroke="#b07d00"
        strokeWidth="0.8"
      />

      {/* Envelope, overstuffed. */}
      <rect x="6" y="11" width="20" height="13" fill="#fffdf2" stroke="#5a5a5a" />
      <path d="M6 11l10 7 10-7" fill="none" stroke="#5a5a5a" />
      {/* Letters spilling out of the top. */}
      <g fill="#ffffff" stroke="#8a8a8a" strokeWidth="0.7">
        <rect x="9" y="7.5" width="7" height="4" transform="rotate(-9 12.5 9.5)" />
        <rect x="16" y="7" width="7" height="4" transform="rotate(8 19.5 9)" />
      </g>

      {/* The exclamation everyone learned to distrust. */}
      <circle cx="24.5" cy="22.5" r="6" fill="#d61f1f" stroke="#7d0d0d" />
      <rect x="23.6" y="18.6" width="1.8" height="5" fill="#fff" />
      <rect x="23.6" y="25" width="1.8" height="1.8" fill="#fff" />
    </svg>
  )
}
