import type { IconProps } from './types.ts'

/** A corner of the field: three covered tiles, a flag planted on one, one open. */
export function MinesweeperIcon({ size = 32, className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      className={className}
      aria-hidden
    >
      {/* Field, with the same sunken frame the program draws around its grid. */}
      <rect x="2" y="2" width="28" height="28" fill="#bdbdbd" />
      <path d="M2 2h28v2H4v26H2z" fill="#7b7b7b" />
      <path d="M30 2v28H2v-2h26V2z" fill="#fff" />

      {/* Covered tiles: 12px pitch, 2px bevels. */}
      <g>
        <rect x="4" y="4" width="12" height="12" fill="#bdbdbd" />
        <path d="M4 4h12v2H6v10H4z" fill="#fff" />
        <path d="M16 4v12H4v-2h10V4z" fill="#7b7b7b" />

        <rect x="16" y="16" width="12" height="12" fill="#bdbdbd" />
        <path d="M16 16h12v2h-10v10h-2z" fill="#fff" />
        <path d="M28 16v12H16v-2h10V16z" fill="#7b7b7b" />
      </g>

      {/* Open square, reading 3 — the count colour is part of the memory. */}
      <path d="M16 4h12v12H16z" fill="#bdbdbd" />
      <path d="M16 4h12v1H17v11h-1z" fill="#7b7b7b" />
      <text
        x="22"
        y="14.5"
        textAnchor="middle"
        fontFamily="Tahoma, Verdana, sans-serif"
        fontSize="11"
        fontWeight="bold"
        fill="#ff0000"
      >
        3
      </text>

      {/* Flag on the lower-left tile. */}
      <g>
        <rect x="4" y="16" width="12" height="12" fill="#bdbdbd" />
        <path d="M4 16h12v2H6v10H4z" fill="#fff" />
        <path d="M16 16v12H4v-2h10V16z" fill="#7b7b7b" />
        <polygon points="10,19 10,23 6,21" fill="#ff0000" />
        <rect x="9.6" y="19" width="1" height="5.6" fill="#000" />
        <rect x="8" y="24.6" width="4" height="1" fill="#000" />
        <rect x="6.6" y="25.6" width="6.8" height="1.2" fill="#000" />
      </g>
    </svg>
  )
}
