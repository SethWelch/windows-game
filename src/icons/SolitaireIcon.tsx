import type { IconProps } from './types.ts'

/** Three fanned cards on felt: a back, a red ace, and the black ace on top. */
export function SolitaireIcon({ size = 32, className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      className={className}
      aria-hidden
    >
      <defs>
        <linearGradient id="sol-back" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#3d7ed6" />
          <stop offset="1" stopColor="#143f92" />
        </linearGradient>
      </defs>

      {/* Back card, fanned left. */}
      <g transform="rotate(-16 12 20)">
        <rect
          x="3"
          y="7"
          width="15"
          height="21"
          rx="2"
          fill="url(#sol-back)"
          stroke="#0c2f6e"
        />
        <rect x="5" y="9" width="11" height="17" rx="1" fill="none" stroke="#8fb6ee" />
      </g>

      {/* Middle card, the ace of hearts. */}
      <g transform="rotate(-4 16 20)">
        <rect
          x="8"
          y="5"
          width="15"
          height="21"
          rx="2"
          fill="#fff"
          stroke="#6b6b6b"
        />
        <path
          d="M15.5 20c-3-2.2-4.3-3.9-4.3-5.5 0-1.6 1.2-2.4 2.4-2.4.9 0 1.5.5 1.9 1.2.4-.7 1-1.2 1.9-1.2 1.2 0 2.4.8 2.4 2.4 0 1.6-1.3 3.3-4.3 5.5z"
          fill="#c8102e"
        />
      </g>

      {/* Front card, the ace of spades. */}
      <g transform="rotate(9 21 20)">
        <rect
          x="14"
          y="4"
          width="15"
          height="21"
          rx="2"
          fill="#fff"
          stroke="#6b6b6b"
        />
        <path
          d="M21.5 9s4 3.2 4 5.3c0 1.4-1 2.3-2.1 2.3-.7 0-1.3-.4-1.6-1 .2 1 .6 1.9 1.2 2.3h-3c.6-.4 1-1.3 1.2-2.3-.3.6-.9 1-1.6 1-1.1 0-2.1-.9-2.1-2.3 0-2.1 4-5.3 4-5.3z"
          fill="#111"
        />
      </g>
    </svg>
  )
}
