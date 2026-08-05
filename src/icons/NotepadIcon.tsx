import type { IconProps } from './types.ts'

export function NotepadIcon({ size = 32, className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      className={className}
      aria-hidden
    >
      <defs>
        <linearGradient id="np-page" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="1" stopColor="#e4eaf1" />
        </linearGradient>
        <linearGradient id="np-bar" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#9dc6f5" />
          <stop offset="1" stopColor="#3d7ed6" />
        </linearGradient>
        <linearGradient id="np-pencil" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffe27a" />
          <stop offset="0.5" stopColor="#f5c542" />
          <stop offset="1" stopColor="#d99f1f" />
        </linearGradient>
      </defs>

      {/* page */}
      <path
        d="M6 2.5h16.5L26 6v23.5H6z"
        fill="url(#np-page)"
        stroke="#6d8ba8"
        strokeWidth="1"
      />
      {/* dog-eared top-right corner */}
      <path d="M22.5 2.5 26 6h-3.5z" fill="#c3cdd8" stroke="#6d8ba8" />
      {/* tiny titlebar strip */}
      <rect x="7" y="4" width="14" height="4" fill="url(#np-bar)" />
      {/* text rules */}
      <g fill="#9aa3ab">
        <rect x="8" y="12" width="15" height="1.4" />
        <rect x="8" y="15.6" width="15" height="1.4" />
        <rect x="8" y="19.2" width="11" height="1.4" />
        <rect x="8" y="22.8" width="13" height="1.4" />
      </g>
      {/* pencil, laid across the lower right */}
      <g transform="rotate(-42 21 24)">
        <rect x="12" y="22.2" width="14" height="4" fill="url(#np-pencil)" />
        <rect x="12" y="22.2" width="14" height="1.1" fill="#fff0b8" />
        <path d="M26 22.2h3.4l1.6 2-1.6 2H26z" fill="#f0dfbe" />
        <path d="M29.4 22.2 31 24.2l-1.6 2z" fill="#4a4a4a" />
        <rect x="10.2" y="22.2" width="1.8" height="4" fill="#e0759a" />
      </g>
    </svg>
  )
}
