import type { IconProps } from './types.ts'

export function MyComputerIcon({ size = 32, className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      className={className}
      aria-hidden
    >
      <defs>
        <linearGradient id="mc-screen" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#2f6fbf" />
          <stop offset="0.55" stopColor="#5b9ede" />
          <stop offset="1" stopColor="#8fc4ef" />
        </linearGradient>
        <linearGradient id="mc-case" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#efeade" />
          <stop offset="1" stopColor="#cfc9b8" />
        </linearGradient>
      </defs>

      {/* tower behind, to the right */}
      <path
        d="M23 10h6v17h-6z"
        fill="url(#mc-case)"
        stroke="#8f8a7c"
        strokeWidth="1"
      />
      <rect x="24.4" y="12" width="3.2" height="1.4" fill="#9a9488" />
      <rect x="24.4" y="14.6" width="3.2" height="1.4" fill="#9a9488" />
      <circle cx="26" cy="24" r="1" fill="#7fc44a" />

      {/* monitor stand */}
      <path d="M12 23.5h6v3h-6z" fill="#c8c3b4" stroke="#8f8a7c" />
      <path
        d="M8.5 26.5h13v2.5h-13z"
        fill="url(#mc-case)"
        stroke="#8f8a7c"
        strokeWidth="1"
      />

      {/* monitor bezel */}
      <rect
        x="2.5"
        y="6.5"
        width="25"
        height="17"
        rx="2"
        fill="url(#mc-case)"
        stroke="#8f8a7c"
        strokeWidth="1"
      />
      {/* screen */}
      <rect x="5" y="9" width="20" height="12" fill="url(#mc-screen)" />
      {/* glass highlight */}
      <path d="M5 9h20l-9 12H5z" fill="#fff" opacity="0.16" />
      <rect
        x="5"
        y="9"
        width="20"
        height="12"
        fill="none"
        stroke="#3b3b3b"
        strokeWidth="0.8"
      />
    </svg>
  )
}
