import type { IconProps } from './types.ts'

/**
 * SVG fallback for the `windowsxp` icon, used only if the real artwork in
 * `src/images/icons/windowsxp-*.png` is missing.
 *
 * A rippling four-pane banner rather than the flat squares of the later Windows
 * logo: the panes are trapezoids, the left edge is vertically compressed (the
 * "pole" side) while the right fans taller and higher, and the outer edges carry
 * a gentle S-curve. Square viewBox so it honours the shared IconProps contract.
 */
export function StartFlag({ size = 24, className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 26 26"
      className={className}
      aria-hidden
    >
      <defs>
        <linearGradient id="sf-r" x1="0" y1="0" x2="0.3" y2="1">
          <stop offset="0" stopColor="#f86a3d" />
          <stop offset="1" stopColor="#d63a0e" />
        </linearGradient>
        <linearGradient id="sf-g" x1="0" y1="0" x2="0.3" y2="1">
          <stop offset="0" stopColor="#a8da22" />
          <stop offset="1" stopColor="#6da200" />
        </linearGradient>
        <linearGradient id="sf-b" x1="0" y1="0" x2="0.3" y2="1">
          <stop offset="0" stopColor="#54c4f7" />
          <stop offset="1" stopColor="#0b82d2" />
        </linearGradient>
        <linearGradient id="sf-y" x1="0" y1="0" x2="0.3" y2="1">
          <stop offset="0" stopColor="#ffd845" />
          <stop offset="1" stopColor="#eb9e00" />
        </linearGradient>
      </defs>

      {/* Thin light gutters come from the stroke plus the gaps left between panes.
          Nudged down to sit centred in the square viewBox. */}
      <g
        stroke="#f4fbff"
        strokeWidth="0.5"
        strokeLinejoin="round"
        transform="translate(0 3)"
      >
        {/* top-left */}
        <path d="M2.35 5.5 10.75 3.15 10.55 9.75 1.95 11.0Z" fill="url(#sf-r)" />
        {/* top-right — sweeps up and out */}
        <path
          d="M11.9 2.9C15.7 1.95 20.3 1.25 24.7 0.95L24.5 8.55C20.2 8.7 15.6 9.15 11.7 9.7Z"
          fill="url(#sf-g)"
        />
        {/* bottom-left */}
        <path d="M1.95 12.1 10.55 10.85 10.75 17.4 2.35 15.5Z" fill="url(#sf-b)" />
        {/* bottom-right */}
        <path
          d="M11.7 10.8C15.6 10.2 20.2 9.85 24.5 9.7L24.7 16.4C20.3 16.2 15.7 16.85 11.9 17.4Z"
          fill="url(#sf-y)"
        />
      </g>
    </svg>
  )
}
