import type { IconProps } from './types.ts'

/** A palette with a brush laid across it, dipped in red. */
export function PaintIcon({ size = 32, className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      className={className}
      aria-hidden
    >
      <defs>
        <linearGradient id="pt-palette" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f3e2c0" />
          <stop offset="1" stopColor="#c69b62" />
        </linearGradient>
      </defs>

      {/* Palette, with the thumb hole. */}
      <path
        d="M14 4c7 0 13 4.6 13 10.4 0 4-3.4 5.6-6 5.6h-2.4c-1.6 0-2.6 1-2.6 2.2 0 .9.5 1.5.5 2.3 0 1.4-1.2 2.5-3 2.5C7.4 27 3 21.8 3 15.6 3 9 8 4 14 4z"
        fill="url(#pt-palette)"
        stroke="#7a5626"
      />
      <ellipse cx="10.5" cy="20.5" rx="2.6" ry="2.2" fill="#8a6432" />

      {/* Wells of paint. */}
      <g stroke="#7a5626" strokeWidth="0.6">
        <circle cx="9" cy="10" r="2.1" fill="#d61f1f" />
        <circle cx="15.5" cy="8" r="2.1" fill="#1f6fd6" />
        <circle cx="21.5" cy="10.5" r="2.1" fill="#f2c53d" />
        <circle cx="22" cy="16.5" r="2.1" fill="#2fa03f" />
      </g>

      {/* Brush across the corner, ferrule and all. */}
      <g transform="rotate(-38 22 24)">
        <rect x="10" y="22.4" width="15" height="3.2" fill="#c08a46" stroke="#6f4a19" />
        <rect x="24" y="22" width="4" height="4" fill="#b9bec7" stroke="#5c6169" />
        <path d="M28 22.2h2.6l.8 1.8-.8 2h-2.6z" fill="#d61f1f" stroke="#8a1414" />
      </g>
    </svg>
  )
}
