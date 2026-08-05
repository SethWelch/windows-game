import type { IconProps } from './types.ts'

/** The running man. Mid-stride, arms back, leaning into it. */
export function AimIcon({ size = 32, className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      className={className}
      aria-hidden
    >
      <defs>
        <linearGradient id="aim-body" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffe14d" />
          <stop offset="1" stopColor="#e8a900" />
        </linearGradient>
      </defs>

      <g fill="url(#aim-body)" stroke="#8a6100" strokeWidth="0.7">
        {/* head, tipped forward */}
        <circle cx="19.5" cy="6.6" r="3.5" />
        {/* torso */}
        <path d="M17.8 10.2c2.6-.6 4.6.6 5 2.4l1 4.6-3.6 1-1-3.4-1.4 3.9-3.3-1.2z" />
        {/* trailing arm */}
        <path d="M15.6 11.4 8.6 13l.7 2.9 6.6-1.6z" />
        {/* leading arm, thrown forward */}
        <path d="M21.9 11.9l5.5 2.6-1.5 2.6-5.4-2.7z" />
        {/* front leg, driving up */}
        <path d="M17.6 17.4l-1.4 5.1-4.6 4.4 2.5 2.4 5.4-5.2 1.4-5.6z" />
        {/* back leg, extended */}
        <path d="M20.6 17.9l3.4 3.6 5.3 1.1-.7 3.3-6.6-1.3-4.6-4.7z" />
      </g>
    </svg>
  )
}
