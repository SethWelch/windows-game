import type { IconProps } from './types.ts'

/** The glassy sphere with a play triangle cut into it. */
export function MediaPlayerIcon({ size = 32, className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      className={className}
      aria-hidden
    >
      <defs>
        <radialGradient id="wmp-ball" cx="36%" cy="28%" r="78%">
          <stop offset="0" stopColor="#9fd0ff" />
          <stop offset="0.45" stopColor="#2f7fd6" />
          <stop offset="1" stopColor="#0d2f6b" />
        </radialGradient>
        <linearGradient id="wmp-gloss" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.72" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
      </defs>

      <circle cx="16" cy="16" r="14" fill="url(#wmp-ball)" stroke="#0a2050" />

      {/* Orange play triangle, the one warm thing in the whole icon. */}
      <path d="M12.5 9.5 23 16l-10.5 6.5z" fill="#ff9c1a" stroke="#b3610a" />

      {/* Highlight across the top, which is what made it look like glass. */}
      <ellipse cx="16" cy="9.5" rx="9.5" ry="5.5" fill="url(#wmp-gloss)" />
    </svg>
  )
}
