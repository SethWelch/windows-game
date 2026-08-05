import type { IconProps } from './types.ts'

/** The ship's wheel, over the horizon of a very dark blue planet. */
export function NetscapeIcon({ size = 32, className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      className={className}
      aria-hidden
    >
      <defs>
        <radialGradient id="ns-sky" cx="35%" cy="28%" r="80%">
          <stop offset="0" stopColor="#3a6fd8" />
          <stop offset="0.6" stopColor="#12295f" />
          <stop offset="1" stopColor="#050d24" />
        </radialGradient>
      </defs>

      <circle cx="16" cy="16" r="14.5" fill="url(#ns-sky)" stroke="#04081a" />

      {/* Stars behind the wheel. */}
      <g fill="#cfe4ff">
        <circle cx="8" cy="8" r="0.8" />
        <circle cx="24" cy="7" r="0.7" />
        <circle cx="26" cy="20" r="0.7" />
        <circle cx="7" cy="22" r="0.6" />
      </g>

      {/* Wheel: rim, hub, and the eight spokes with their handles. */}
      <g stroke="#e8b23a" strokeWidth="2" fill="none">
        <circle cx="16" cy="16" r="8" />
      </g>
      <g stroke="#f7d271" strokeWidth="1.5">
        <path d="M16 6.5v19M6.5 16h19M9.2 9.2l13.6 13.6M22.8 9.2 9.2 22.8" />
      </g>
      <circle cx="16" cy="16" r="2.6" fill="#e8b23a" stroke="#8a5f11" />
      <g fill="#f7d271">
        <circle cx="16" cy="5.6" r="1.5" />
        <circle cx="16" cy="26.4" r="1.5" />
        <circle cx="5.6" cy="16" r="1.5" />
        <circle cx="26.4" cy="16" r="1.5" />
      </g>
    </svg>
  )
}
