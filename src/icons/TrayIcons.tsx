import type { IconProps } from './types.ts'

/** The tray speaker. Muted swaps the waves for the red prohibition sign. */
export function VolumeIcon({
  size = 16,
  className,
  muted = false,
}: IconProps & { muted?: boolean }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      className={className}
      aria-hidden
    >
      {/* speaker */}
      <path
        d="M2.5 6.2h2.2L7.8 3.4v9.2L4.7 9.8H2.5z"
        fill="#e8e8e8"
        stroke="#5a5a5a"
        strokeWidth="0.9"
      />

      {muted ? (
        <>
          <circle cx="11.4" cy="9.6" r="4.1" fill="#d61f1f" stroke="#7d0d0d" strokeWidth="0.8" />
          <rect x="9.1" y="9" width="4.6" height="1.4" fill="#fff" />
        </>
      ) : (
        /* waves */
        <g fill="none" stroke="#eaeaea" strokeWidth="1.1" strokeLinecap="round">
          <path d="M9.8 5.6c1.1 1.4 1.1 3.4 0 4.8" />
          <path d="M11.8 3.9c2 2.4 2 6.2 0 8.2" />
        </g>
      )}
    </svg>
  )
}

export function NetworkIcon({ size = 16, className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      className={className}
      aria-hidden
    >
      {/* back monitor */}
      <rect
        x="6.5"
        y="1.5"
        width="8"
        height="6"
        rx="0.6"
        fill="#d8d4c8"
        stroke="#4a4a4a"
        strokeWidth="0.9"
      />
      <rect x="7.6" y="2.6" width="5.8" height="3.8" fill="#3a6ea5" />
      {/* front monitor */}
      <rect
        x="1.5"
        y="6"
        width="8.5"
        height="6.4"
        rx="0.6"
        fill="#e8e4d8"
        stroke="#3a3a3a"
        strokeWidth="0.9"
      />
      <rect x="2.7" y="7.1" width="6.1" height="4.2" fill="#3fa9f5" />
      <path d="M3.4 12.9h6.8v1H3.4z" fill="#bdb9ad" stroke="#3a3a3a" />
      {/* link activity */}
      <rect x="11.6" y="9.4" width="1.6" height="1.6" fill="#00ff66" />
      <rect x="13.6" y="9.4" width="1.6" height="1.6" fill="#00c94f" />
    </svg>
  )
}
