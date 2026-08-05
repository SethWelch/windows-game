import type { IconProps } from './types.ts'

/** A desk microphone on its stand, with the sound coming off it. */
export function SoundRecorderIcon({ size = 32, className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      className={className}
      aria-hidden
    >
      <defs>
        <linearGradient id="sr-head" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#d8dde6" />
          <stop offset="0.5" stopColor="#8b939f" />
          <stop offset="1" stopColor="#4c525c" />
        </linearGradient>
      </defs>

      {/* Sound, arcing off to the right. */}
      <g fill="none" stroke="#2f9d3f" strokeWidth="1.8" strokeLinecap="round">
        <path d="M22 10a7 7 0 0 1 0 9" />
        <path d="M25.5 7a12 12 0 0 1 0 15" opacity="0.65" />
      </g>

      {/* Stand. */}
      <path d="M12 20v5" stroke="#3d434d" strokeWidth="2" />
      <path
        d="M6.5 29c0-2.2 2.5-4 5.5-4s5.5 1.8 5.5 4z"
        fill="#5a616c"
        stroke="#2b3038"
      />

      {/* Head: a capsule with a grille across it. */}
      <rect
        x="7"
        y="3"
        width="10"
        height="17"
        rx="5"
        fill="url(#sr-head)"
        stroke="#2b3038"
      />
      <g stroke="#3d434d" strokeWidth="0.9" opacity="0.8">
        <path d="M8.4 7.5h7.2M8.4 10h7.2M8.4 12.5h7.2M8.4 15h7.2" />
      </g>
    </svg>
  )
}
