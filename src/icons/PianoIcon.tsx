import type { IconProps } from './types.ts'

/** A keyboard seen from just above: white keys, black keys, and the felt strip behind. */
export function PianoIcon({ size = 32, className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      className={className}
      aria-hidden
    >
      {/* Case, with the red felt along the back. */}
      <rect x="2.5" y="7.5" width="27" height="17" rx="1.5" fill="#2a2a30" stroke="#14141a" />
      <rect x="3.5" y="8.5" width="25" height="2" fill="#8d2427" />

      {/* Seven white keys. */}
      <g fill="#f7f7f1" stroke="#8c8c92" strokeWidth="0.7">
        {[0, 1, 2, 3, 4, 5, 6].map((i) => (
          <rect key={i} x={3.6 + i * 3.55} y="10.5" width="3.55" height="13" rx="0.4" />
        ))}
      </g>

      {/* Five black keys, over the joins — the same pattern the app lays out. */}
      <g fill="#16161c">
        {[1, 2, 4, 5, 6].map((i) => (
          <rect key={i} x={3.6 + i * 3.55 - 1.05} y="10.5" width="2.1" height="8" rx="0.3" />
        ))}
      </g>
    </svg>
  )
}
